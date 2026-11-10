"use client";

import { ArrowPathIcon, CheckIcon, ClipboardIcon, CloudArrowUpIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/solid";
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
    if (!needle) return files;
    return files.filter((file) => `${file.name} ${file.path}`.toLowerCase().includes(needle));
  }, [files, query]);

  async function uploadSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    if (!selected.length) return;
    setUploading(true);
    setMessage(null);

    try {
      for (const file of selected) {
        const form = new FormData();
        form.append("file", file);
        const response = await fetch("/api/admin/media", { method: "POST", body: form });
        const payload = (await response.json().catch(() => null)) as { file?: MediaFile; error?: string } | null;
        if (!response.ok || !payload?.file) throw new Error(payload?.error || `Не удалось загрузить ${file.name}.`);
        setFiles((current) => [payload.file!, ...current.filter((item) => item.path !== payload.file!.path)]);
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
    setMessage(null);
    const response = await fetch(`/api/admin/media?path=${encodeURIComponent(file.path)}`, { method: "DELETE" });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(payload?.error || "Не удалось удалить файл.");
      return;
    }
    setFiles((current) => current.filter((item) => item.path !== file.path));
  }

  async function copyUrl(file: MediaFile) {
    await navigator.clipboard.writeText(file.url);
    setCopied(file.path);
    window.setTimeout(() => setCopied((current) => current === file.path ? null : current), 1200);
  }

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-[#fff7ee]">{files.length} файлов · {formatBytes(totalBytes)}</p>
          <p className="mt-1 text-xs leading-5 text-[#a99c90]">Файлы сохраняются в Docker volume `mgs_data` и доступны по `/media/...`.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-[#d2c3b4] hover:bg-white/[0.05]" onClick={() => void load()} type="button">
            <ArrowPathIcon className="size-4" /> Обновить
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-[#f2e7d7] px-3 py-2 text-xs font-semibold text-[#111] disabled:opacity-50" disabled={uploading} onClick={() => inputRef.current?.click()} type="button">
            <CloudArrowUpIcon className="size-4" /> {uploading ? "Загрузка…" : "Загрузить файлы"}
          </button>
          <input ref={inputRef} className="hidden" multiple onChange={uploadSelected} type="file" />
        </div>
      </div>

      <input
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[#fff7ee] outline-none placeholder:text-[#746b63]"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Поиск по имени файла…"
        value={query}
      />

      {message ? <p className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-[#d2c3b4]">{message}</p> : null}
      {loading ? <p className="py-10 text-center text-sm text-[#a99c90]">Загрузка медиатеки…</p> : null}

      {!loading && filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 px-5 py-14 text-center text-sm text-[#a99c90]">Файлов пока нет.</div>
      ) : null}

      <div className={`grid gap-3 ${compact ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-2 md:grid-cols-3 xl:grid-cols-5"}`}>
        {filtered.map((file) => (
          <article className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]" key={file.path}>
            <button className="block w-full text-left" onClick={() => onSelect?.(file.url)} type="button">
              <div className="relative aspect-[4/3] overflow-hidden bg-[#111]">
                {file.isImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" loading="lazy" src={file.url} />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl font-semibold uppercase text-[#746b63]">{file.extension.replace(".", "") || "file"}</div>
                )}
                {onSelect ? <span className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white"><CheckIcon className="size-3.5" /></span> : null}
              </div>
              <div className="p-3">
                <p className="truncate text-xs font-medium text-[#fff7ee]" title={file.name}>{file.name}</p>
                <p className="mt-1 text-[0.68rem] text-[#8d8278]">{formatBytes(file.size)}</p>
              </div>
            </button>
            <div className="flex border-t border-white/10">
              <button className="flex flex-1 items-center justify-center gap-1.5 px-2 py-2 text-[0.68rem] text-[#a99c90] hover:bg-white/[0.04] hover:text-white" onClick={() => void copyUrl(file)} type="button">
                {copied === file.path ? <CheckIcon className="size-3" /> : <ClipboardIcon className="size-3" />}
                {copied === file.path ? "Скопировано" : "URL"}
              </button>
              <button className="flex items-center justify-center border-l border-white/10 px-3 py-2 text-[#8d8278] hover:bg-red-500/10 hover:text-red-300" onClick={() => void remove(file)} title="Удалить" type="button">
                <TrashIcon className="size-3.5" />
              </button>
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
      <div className="flex gap-2">
        <input className="min-w-0 flex-1 rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-[#fff7ee] outline-none placeholder:text-[#a99c90]" disabled={disabled} onChange={(event) => onChange(event.target.value)} value={value} />
        <button className="shrink-0 rounded-[22px] border border-white/10 px-4 text-xs font-medium text-[#d2c3b4] hover:bg-white/[0.05] disabled:opacity-50" disabled={disabled} onClick={() => setOpen(true)} type="button">Выбрать</button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[200] overflow-y-auto bg-black/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="mx-auto my-4 max-w-6xl rounded-[28px] border border-white/10 bg-[#090909] p-4 shadow-2xl md:p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div><h2 className="text-xl font-semibold text-[#fff7ee]">Медиатека</h2><p className="mt-1 text-xs text-[#a99c90]">Выберите уже загруженный файл или загрузите новый.</p></div>
              <button className="rounded-full border border-white/10 p-2 text-[#d2c3b4] hover:bg-white/[0.05]" onClick={() => setOpen(false)} type="button"><XMarkIcon className="size-5" /></button>
            </div>
            <MgsAdminMediaLibrary compact onSelect={(url) => { onChange(url); setOpen(false); }} />
          </div>
        </div>
      ) : null}
    </>
  );
}
