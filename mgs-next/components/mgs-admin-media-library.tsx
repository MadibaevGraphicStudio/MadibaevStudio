"use client";

import { Check, Clipboard, CloudUpload, FileImage, FolderOpen, LoaderCircle, RefreshCw, Search, Trash2, X } from "lucide-react";
import { Button } from "@animate-ui/react/primitives/buttons/button";
import { Dialog } from "@animate-ui/react/primitives/radix-ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type MediaFile = {
  path: string;
  url: string;
  name: string;
  extension: string;
  size: number;
  updatedAt: string;
  isImage: boolean;
};

type MediaLibraryProps = {
  onSelect?: (url: string) => void;
  compact?: boolean;
};

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export function MgsAdminMediaLibrary({ onSelect, compact = false }: MediaLibraryProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [typeFilter, setTypeFilter] = useState<"all" | "images" | "files">("all");

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/media", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as { files?: MediaFile[]; error?: string } | null;
      if (!response.ok) throw new Error(payload?.error || "Не удалось загрузить медиатеку.");
      setFiles(Array.isArray(payload?.files) ? payload.files : []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось загрузить медиатеку.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return files.filter((file) => (!needle || `${file.name} ${file.path}`.toLowerCase().includes(needle)) && (typeFilter === "all" || (typeFilter === "images" ? file.isImage : !file.isImage)));
  }, [files, query, typeFilter]);

  async function uploadSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    if (!selected.length) return;
    setUploading(true);
    setUploadProgress({ done: 0, total: selected.length });
    setMessage(null);

    try {
      for (const file of selected) {
        const form = new FormData();
        form.append("file", file);
        const response = await fetch("/api/admin/media", { method: "POST", body: form });
        const payload = (await response.json().catch(() => null)) as { file?: MediaFile; error?: string } | null;
        if (!response.ok || !payload?.file) throw new Error(payload?.error || `Не удалось загрузить ${file.name}.`);
        setFiles((current) => [payload.file!, ...current.filter((item) => item.path !== payload.file!.path)]);
        setUploadProgress((current) => ({ ...current, done: current.done + 1 }));
      }
      setMessage(`Загружено файлов: ${selected.length}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка загрузки.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove(file: MediaFile) {
    if (!window.confirm(`Удалить ${file.name}? Ссылки на этот файл перестанут работать.`)) return;
    setRemoving(file.path);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/media?path=${encodeURIComponent(file.path)}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error || "Не удалось удалить файл.");
      setFiles((current) => current.filter((item) => item.path !== file.path));
      setMessage(`Файл «${file.name}» удалён.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Не удалось удалить файл. Повторите попытку.");
    } finally {
      setRemoving(null);
    }
  }

  async function copyUrl(file: MediaFile) {
    try {
      await navigator.clipboard.writeText(new URL(file.url, window.location.origin).href);
      setCopied(file.path);
      setMessage("Ссылка скопирована.");
      window.setTimeout(() => setCopied((current) => current === file.path ? null : current), 1600);
    } catch {
      setMessage("Не удалось скопировать ссылку. Разрешите доступ к буферу обмена и повторите попытку.");
    }
  }

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);

  return (
    <div aria-busy={loading || uploading} className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-[#c6b798]/10 text-[#c6b798]"><FolderOpen aria-hidden="true" className="size-5" /></span>
          <div>
            <p className="text-sm font-semibold text-[#fff7ee]">{files.length} файлов <span className="px-1 text-[#746b63]">/</span> {formatBytes(totalBytes)}</p>
            <p className="mt-1 text-xs leading-5 text-[#a99c90]">Изображения и документы для ваших проектов.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-xs text-[#d2c3b4] hover:bg-white/[0.05] disabled:opacity-50" disabled={loading || uploading || Boolean(removing)} onClick={() => void load()} type="button">
            <RefreshCw aria-hidden="true" className={`size-4 ${loading ? "motion-safe:animate-spin" : ""}`} /> Обновить
          </Button>
          <Button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#f2e7d7] px-4 py-2 text-xs font-semibold text-[#111] hover:bg-white disabled:opacity-50" disabled={uploading || loading} onClick={() => inputRef.current?.click()} type="button">
            {uploading ? <LoaderCircle aria-hidden="true" className="size-4 motion-safe:animate-spin" /> : <CloudUpload aria-hidden="true" className="size-4" />} {uploading ? `Загрузка ${uploadProgress.done}/${uploadProgress.total}…` : "Загрузить файлы"}
          </Button>
          <input ref={inputRef} aria-label="Загрузить файлы" className="hidden" disabled={uploading} multiple onChange={uploadSelected} type="file" />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">Поиск файлов</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#a99c90]" />
          <input className="min-h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-4 text-sm text-[#fff7ee] outline-none placeholder:text-[#a99c90] focus:border-[#c6b798] focus:ring-2 focus:ring-[#c6b798]/15" onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по имени файла…" type="search" value={query} />
        </label>
        <label className="block sm:w-44">
          <span className="sr-only">Тип файла</span>
          <select className="min-h-11 w-full rounded-xl border border-white/10 bg-[#141313] px-4 py-3 text-sm text-[#fff7ee] outline-none focus:border-[#c6b798]" onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)} value={typeFilter}>
            <option value="all">Все файлы</option><option value="images">Изображения</option><option value="files">Документы</option>
          </select>
        </label>
      </div>

      {message ? <p className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-[#d2c3b4]" role="status">{message}</p> : null}
      {loading ? <div className="grid grid-cols-2 gap-3 md:grid-cols-3" role="status"><span className="sr-only">Загрузка медиатеки…</span>{[0, 1, 2].map((item) => <div aria-hidden="true" className="aspect-[4/3] rounded-2xl border border-white/10 bg-white/[0.04] motion-safe:animate-pulse" key={item} />)}</div> : null}

      {!loading && filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-black/20 px-5 py-14 text-center">
          <FileImage aria-hidden="true" className="mx-auto mb-4 size-9 text-[#c6b798]" />
          <p className="font-semibold text-[#fff7ee]">{query || typeFilter !== "all" ? "Ничего не найдено" : "Медиатека пока пуста"}</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#a99c90]">{query || typeFilter !== "all" ? "Попробуйте другое имя файла или сбросьте фильтры." : "Загрузите изображения, чтобы использовать их в проектах."}</p>
          {query || typeFilter !== "all" ? <Button className="mt-4 min-h-10 rounded-xl border border-white/15 px-4 text-sm text-[#f6ecdd] hover:bg-white/5" onClick={() => { setQuery(""); setTypeFilter("all"); }} type="button">Сбросить фильтры</Button> : null}
        </div>
      ) : null}

      {!loading ? <p aria-live="polite" className="text-xs text-[#a99c90]">Показано {filtered.length} из {files.length}</p> : null}
      <div className={`grid gap-3 ${compact ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-2 md:grid-cols-3 xl:grid-cols-5"}`}>
        {filtered.map((file) => (
          <article aria-busy={removing === file.path} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] transition hover:border-[#c6b798]/40" key={file.path}>
            <div className="relative aspect-[4/3] overflow-hidden bg-[#111]">
              {file.isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" className="h-full w-full object-cover transition duration-200 motion-safe:group-hover:scale-[1.03]" loading="lazy" src={file.url} />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-[#a99c90]"><FileImage aria-hidden="true" className="size-8" /><span className="text-xs font-semibold uppercase">{file.extension.replace(".", "") || "file"}</span></div>
              )}
              {onSelect ? <Button aria-label={`Выбрать ${file.name}`} className="absolute inset-0 flex items-start justify-end p-2 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c6b798]" onClick={() => onSelect(file.url)} type="button"><span className="rounded-full bg-black/70 p-2 text-white"><Check aria-hidden="true" className="size-3.5" /></span></Button> : <a aria-label={`Открыть ${file.name}`} className="absolute inset-0 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c6b798]" href={file.url} rel="noopener noreferrer" target="_blank" />}
            </div>
            <div className="p-3">
              <p className="truncate text-xs font-medium text-[#fff7ee]" title={file.name}>{file.name}</p>
              <p className="mt-1 text-[0.68rem] text-[#a99c90]">{formatBytes(file.size)}</p>
            </div>
            <div className="flex border-t border-white/10">
              <Button aria-label={`Скопировать ссылку на ${file.name}`} className="flex min-h-10 min-w-0 flex-1 items-center justify-center gap-1.5 px-2 py-2 text-[0.68rem] text-[#b7aa9d] hover:bg-white/[0.04] hover:text-white" onClick={() => void copyUrl(file)} type="button">
                {copied === file.path ? <Check aria-hidden="true" className="size-3" /> : <Clipboard aria-hidden="true" className="size-3" />}
                {copied === file.path ? "Готово" : "Ссылка"}
              </Button>
              <Button aria-label={`Удалить ${file.name}`} className="flex min-h-10 min-w-10 items-center justify-center border-l border-white/10 px-3 py-2 text-[#a99c90] hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40" disabled={Boolean(removing) || uploading} onClick={() => void remove(file)} type="button">
                {removing === file.path ? <LoaderCircle aria-hidden="true" className="size-3.5 motion-safe:animate-spin" /> : <Trash2 aria-hidden="true" className="size-3.5" />}
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function MgsAdminMediaPicker({ value, onChange, disabled = false }: { value: string; onChange: (value: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Dialog.Root onOpenChange={setOpen} open={open}>
        <div className="flex gap-2">
          <input aria-label="Ссылка на медиафайл" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[#fff7ee] outline-none placeholder:text-[#a99c90] focus:border-[#c6b798]" disabled={disabled} onChange={(event) => onChange(event.target.value)} value={value} />
          <Dialog.Trigger asChild><Button className="shrink-0 rounded-xl border border-white/10 px-4 text-xs font-medium text-[#d2c3b4] hover:bg-white/[0.05] disabled:opacity-50" disabled={disabled} type="button">Выбрать</Button></Dialog.Trigger>
        </div>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm" />
          <Dialog.Content className="admin-ui fixed inset-x-3 top-1/2 z-[201] mx-auto flex max-h-[90dvh] max-w-6xl -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#090909] text-[#f6ecdd] shadow-2xl outline-none sm:inset-x-6">
            <div className="relative border-b border-white/10 p-5 pr-16 md:p-6">
              <Dialog.Title className="text-xl font-semibold text-[#fff7ee]">Медиатека</Dialog.Title>
              <Dialog.Description className="mt-1 text-xs leading-5 text-[#a99c90]">Выберите уже загруженный файл или загрузите новый.</Dialog.Description>
              <Dialog.Close aria-label="Закрыть медиатеку" className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-xl border border-white/10 text-[#d2c3b4] hover:bg-white/[0.05] focus-visible:outline-2 focus-visible:outline-[#c6b798]"><X aria-hidden="true" className="size-4" /></Dialog.Close>
            </div>
            <div className="min-h-0 overflow-y-auto p-4 md:p-6"><MgsAdminMediaLibrary compact onSelect={(url) => { onChange(url); setOpen(false); }} /></div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
