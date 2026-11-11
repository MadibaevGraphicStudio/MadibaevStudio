"use client";

import { Button } from "@animate-ui/react/primitives/buttons/button";
import { Dialog } from "@animate-ui/react/primitives/radix-ui";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { MgsAdminProject } from "@/lib/mgs-content-store";

type MgsAdminProjectEditorProps = {
  project: MgsAdminProject;
  disabled: boolean;
};

type BlockState = {
  type: "heading" | "paragraph";
  ru: string;
  en: string;
};

type ProjectState = {
  slug: string;
  sequence: string;
  visual: MgsAdminProject["visual"];
  year: string;
  mark: string;
  cover: string;
  status: MgsAdminProject["status"];
  featured: boolean;
  titleRu: string;
  titleEn: string;
  clientRu: string;
  clientEn: string;
  categoryRu: string;
  categoryEn: string;
  industryRu: string;
  industryEn: string;
  disciplineRu: string;
  disciplineEn: string;
  summaryRu: string;
  summaryEn: string;
  servicesRu: string;
  servicesEn: string;
  seoTitleRu: string;
  seoTitleEn: string;
  seoDescriptionRu: string;
  seoDescriptionEn: string;
  seoKeywordsRu: string;
  seoKeywordsEn: string;
  blocks: BlockState[];
};

function toProjectState(project: MgsAdminProject): ProjectState {
  return {
    slug: project.slug,
    sequence: project.sequence,
    visual: project.visual,
    year: String(project.year),
    mark: project.mark,
    cover: project.cover,
    status: project.status,
    featured: project.featured,
    titleRu: project.title.ru,
    titleEn: project.title.en,
    clientRu: project.client.ru,
    clientEn: project.client.en,
    categoryRu: project.category.ru,
    categoryEn: project.category.en,
    industryRu: project.industry.ru,
    industryEn: project.industry.en,
    disciplineRu: project.discipline.ru,
    disciplineEn: project.discipline.en,
    summaryRu: project.summary.ru,
    summaryEn: project.summary.en,
    servicesRu: project.services.ru.join(", "),
    servicesEn: project.services.en.join(", "),
    seoTitleRu: project.seo?.title.ru ?? project.title.ru,
    seoTitleEn: project.seo?.title.en ?? project.title.en,
    seoDescriptionRu: project.seo?.description.ru ?? project.summary.ru,
    seoDescriptionEn: project.seo?.description.en ?? project.summary.en,
    seoKeywordsRu: project.seo?.keywords.ru.join(", ") ?? "",
    seoKeywordsEn: project.seo?.keywords.en.join(", ") ?? "",
    blocks: project.blocks.map((block) => ({
      type: block.type,
      ru: block.content.ru,
      en: block.content.en,
    })),
  };
}

function splitServices(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function fieldClasses(multiline = false) {
  return `w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-[#fff7ee] outline-none placeholder:text-[#a99c90] focus:border-[#c6b798]/60 focus:ring-2 focus:ring-[#c6b798]/15 ${
    multiline ? "min-h-28 resize-y" : ""
  }`;
}

export function MgsAdminProjectEditor({ project, disabled }: MgsAdminProjectEditorProps) {
  const router = useRouter();
  const [state, setState] = useState<ProjectState>(() => toProjectState(project));
  const [savedState, setSavedState] = useState(() => JSON.stringify(toProjectState(project)));
  const dirty = JSON.stringify(state) !== savedState;
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<"save" | "delete" | null>(null);
  const [aiMode, setAiMode] = useState<"seo" | "copywriter" | null>(null);
  const [questionMode, setQuestionMode] = useState<"seo" | "copywriter" | null>(null);
  const [questions, setQuestions] = useState<Array<{ id: string; question: string; placeholder?: string }>>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showGuide, setShowGuide] = useState(false);
  const [guideStep, setGuideStep] = useState(0);

  function closeGuide() {
    setShowGuide(false);
  }

  const setField = <K extends keyof ProjectState>(key: K, value: ProjectState[K]) => {
    setState((current) => ({ ...current, [key]: value }));
  };

  const payload = {
    slug: state.slug.trim(),
    sequence: state.sequence.trim(),
    visual: state.visual,
    year: Number(state.year),
    mark: state.mark.trim(),
    cover: state.cover.trim(),
    status: state.status,
    featured: state.featured,
    title: { ru: state.titleRu.trim(), en: state.titleEn.trim() },
    client: { ru: state.clientRu.trim(), en: state.clientEn.trim() },
    category: { ru: state.categoryRu.trim(), en: state.categoryEn.trim() },
    industry: { ru: state.industryRu.trim(), en: state.industryEn.trim() },
    discipline: { ru: state.disciplineRu.trim(), en: state.disciplineEn.trim() },
    summary: { ru: state.summaryRu.trim(), en: state.summaryEn.trim() },
    services: { ru: splitServices(state.servicesRu), en: splitServices(state.servicesEn) },
    seo: {
      title: { ru: state.seoTitleRu.trim(), en: state.seoTitleEn.trim() },
      description: { ru: state.seoDescriptionRu.trim(), en: state.seoDescriptionEn.trim() },
      keywords: { ru: splitServices(state.seoKeywordsRu), en: splitServices(state.seoKeywordsEn) },
    },
    blocks: state.blocks.map((block) => ({
      type: block.type,
      content: { ru: block.ru.trim(), en: block.en.trim() },
    })),
  };

  async function requestQuestions(mode: "seo" | "copywriter") {
    setMessage(null);
    setQuestionMode(mode);
    setQuestions([]);
    setAnswers({});
    setPending("save");
    try {
      const response = await fetch("/api/admin/ai/project-copy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "questions", target: mode, locale: "both", project: payload }) });
      const result = (await response.json().catch(() => null)) as { error?: string; questions?: Array<{ id: string; question: string; placeholder?: string }> } | null;
      if (!response.ok || !Array.isArray(result?.questions)) { setMessage(result?.error ?? "Не удалось подготовить вопросы."); setQuestionMode(null); return; }
      setQuestions(result.questions);
      setAnswers(Object.fromEntries(result.questions.map((question) => [question.id, ""])));
    } catch { setMessage("Не удалось связаться с AI-сервисом."); setQuestionMode(null); }
    finally { setPending(null); }
  }

  async function runAi(mode: "seo" | "copywriter", context: Record<string, string>) {
    setMessage(null);
    setAiMode(mode);
    setPending("save");
    try {
      const response = await fetch("/api/admin/ai/project-copy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode, locale: "both", answers: context, project: payload }) });
      const result = (await response.json().catch(() => null)) as { error?: string; seo?: { title?: { ru?: string; en?: string }; description?: { ru?: string; en?: string }; keywords?: { ru?: string[]; en?: string[] } }; copy?: { title?: { ru?: string; en?: string }; summary?: { ru?: string; en?: string }; blocks?: BlockState[] } } | null;
      if (!response.ok) { setMessage(result?.error ?? "AI generation failed."); return; }
      if (mode === "seo" && result?.seo) setState((current) => ({ ...current, seoTitleRu: result.seo?.title?.ru ?? current.seoTitleRu, seoTitleEn: result.seo?.title?.en ?? current.seoTitleEn, seoDescriptionRu: result.seo?.description?.ru ?? current.seoDescriptionRu, seoDescriptionEn: result.seo?.description?.en ?? current.seoDescriptionEn, seoKeywordsRu: result.seo?.keywords?.ru?.join(", ") ?? current.seoKeywordsRu, seoKeywordsEn: result.seo?.keywords?.en?.join(", ") ?? current.seoKeywordsEn }));
      if (mode === "copywriter" && result?.copy) setState((current) => ({ ...current, titleRu: result.copy?.title?.ru ?? current.titleRu, titleEn: result.copy?.title?.en ?? current.titleEn, summaryRu: result.copy?.summary?.ru ?? current.summaryRu, summaryEn: result.copy?.summary?.en ?? current.summaryEn, blocks: Array.isArray(result.copy?.blocks) && result.copy.blocks.length ? result.copy.blocks : current.blocks }));
      setMessage(mode === "seo" ? "SEO draft generated. Review it, then save the project." : "Copy draft generated. Review it, then save the project.");
    } catch { setMessage("Unable to reach the AI service. Please try again."); } finally { setPending(null); setAiMode(null); }
  }

  function submitAnswers() {
    if (!questionMode || Object.values(answers).some((answer) => !answer.trim())) return;
    const mode = questionMode;
    setQuestionMode(null);
    void runAi(mode, answers);
  }

  return (
    <>
      <div className="space-y-5">
      <section className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-5 md:grid-cols-2 xl:grid-cols-4">
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-[#c6b798]">Slug</span>
          <input className={fieldClasses()} disabled={disabled || pending !== null} onChange={(event) => setField("slug", event.target.value)} value={state.slug} />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-[#c6b798]">Sequence</span>
          <input className={fieldClasses()} disabled={disabled || pending !== null} onChange={(event) => setField("sequence", event.target.value)} value={state.sequence} />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-[#c6b798]">Year</span>
          <input className={fieldClasses()} disabled={disabled || pending !== null} onChange={(event) => setField("year", event.target.value)} value={state.year} />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-[#c6b798]">Mark</span>
          <input className={fieldClasses()} disabled={disabled || pending !== null} onChange={(event) => setField("mark", event.target.value)} value={state.mark} />
        </label>
        <label className="block xl:col-span-2">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-[#c6b798]">Cover image</span>
          <input className={fieldClasses()} disabled={disabled || pending !== null} onChange={(event) => setField("cover", event.target.value)} value={state.cover} />
        </label>
        <div
          aria-label="Cover preview"
          className="relative flex min-h-32 items-center justify-center overflow-hidden rounded-[22px] border border-white/10 bg-[#151518] bg-cover bg-center xl:col-span-2"
          role="img"
          style={{ backgroundImage: `url(${state.cover})` }}
        >
          <div className="absolute inset-0 bg-black/25" />
          <span className="relative text-6xl font-semibold tracking-[-0.12em] text-white/90 drop-shadow-[0_8px_28px_rgba(0,0,0,0.45)]">
            {state.mark || "M"}
          </span>
        </div>
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-[#c6b798]">Visual</span>
          <select className={fieldClasses()} disabled={disabled || pending !== null} onChange={(event) => setField("visual", event.target.value as ProjectState["visual"])} value={state.visual}>
            <option value="nava">nava</option>
            <option value="aria">aria</option>
            <option value="solo">solo</option>
            <option value="north">north</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-[#c6b798]">Status</span>
          <select className={fieldClasses()} disabled={disabled || pending !== null} onChange={(event) => setField("status", event.target.value as ProjectState["status"])} value={state.status}>
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
        </label>
        <label className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3">
          <input checked={state.featured} disabled={disabled || pending !== null} onChange={(event) => setField("featured", event.target.checked)} type="checkbox" />
          <span className="text-sm text-[#fff7ee]">Featured project</span>
        </label>
      </section>

      <section className="grid gap-4 rounded-[30px] border border-white/10 bg-white/[0.035] p-5 md:grid-cols-2">
        {[
          ["titleRu", "Title RU"],
          ["titleEn", "Title EN"],
          ["clientRu", "Client RU"],
          ["clientEn", "Client EN"],
          ["categoryRu", "Category RU"],
          ["categoryEn", "Category EN"],
          ["industryRu", "Industry RU"],
          ["industryEn", "Industry EN"],
          ["disciplineRu", "Discipline RU"],
          ["disciplineEn", "Discipline EN"],
        ].map(([key, label]) => (
          <label className="block" key={key}>
            <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-[#c6b798]">{label}</span>
            <input className={fieldClasses()} disabled={disabled || pending !== null} onChange={(event) => setField(key as keyof ProjectState, event.target.value as never)} value={state[key as keyof ProjectState] as string} />
          </label>
        ))}
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-[#c6b798]">Summary RU</span>
          <textarea className={fieldClasses(true)} disabled={disabled || pending !== null} onChange={(event) => setField("summaryRu", event.target.value)} value={state.summaryRu} />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-[#c6b798]">Summary EN</span>
          <textarea className={fieldClasses(true)} disabled={disabled || pending !== null} onChange={(event) => setField("summaryEn", event.target.value)} value={state.summaryEn} />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-[#c6b798]">Services RU</span>
          <textarea className={fieldClasses(true)} disabled={disabled || pending !== null} onChange={(event) => setField("servicesRu", event.target.value)} value={state.servicesRu} />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-[#c6b798]">Services EN</span>
          <textarea className={fieldClasses(true)} disabled={disabled || pending !== null} onChange={(event) => setField("servicesEn", event.target.value)} value={state.servicesEn} />
        </label>
      </section>

      <section className={`space-y-4 rounded-[30px] border p-5 transition-colors duration-500 ${aiMode ? "border-[#e5097f]/50 bg-[linear-gradient(120deg,rgba(21,155,211,0.10),rgba(229,9,127,0.10),rgba(255,207,50,0.08))] shadow-[0_0_45px_rgba(229,9,127,0.12)]" : "border-white/10 bg-white/[0.035]"}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-xs uppercase tracking-[0.18em] text-[#c6b798]">AI studio tools</p><h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#fff7ee]">SEO optimizer & copywriter</h3><p className="mt-1 max-w-2xl text-sm leading-6 text-[#b7aa9d]">OpenRouter подготовит черновик. Проверьте результат перед сохранением.</p>{aiMode ? <p aria-live="polite" className="mt-3 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-[#ffcf32]"><span className="size-2 animate-ping rounded-full bg-[#ffcf32]" />{aiMode === "seo" ? "Анализируем проект и собираем SEO" : "Редактируем текст проекта"}</p> : null}</div>
          <div className="flex flex-wrap gap-2"><Button type="button" className="rounded-full border border-white/10 px-4 py-2 text-sm text-[#c6b798]" onClick={() => { setGuideStep(0); setShowGuide(true); }}>AI guide</Button><Button className={`rounded-full bg-[linear-gradient(120deg,#159bd3,#e5097f,#ffcf32)] px-4 py-2 text-sm font-semibold text-white transition-all duration-500 ${aiMode === "seo" ? "animate-mgs-ai-sheen shadow-[0_0_30px_rgba(229,9,127,0.35)]" : "hover:brightness-110"}`} disabled={disabled || pending !== null} onClick={() => void requestQuestions("seo")} type="button">{aiMode === "seo" ? <span className="inline-flex items-center gap-2"><span className="size-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />Generating…</span> : "Generate SEO"}</Button><Button className={`rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-[#f6ecdd] transition ${aiMode === "copywriter" ? "border-[#159bd3]/70 bg-[#159bd3]/10" : "hover:bg-white/[0.06]"}`} disabled={disabled || pending !== null} onClick={() => void requestQuestions("copywriter")} type="button">{aiMode === "copywriter" ? "Improving…" : "Improve copy"}</Button></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[["seoTitleRu", "SEO title RU"], ["seoTitleEn", "SEO title EN"], ["seoDescriptionRu", "Meta description RU"], ["seoDescriptionEn", "Meta description EN"], ["seoKeywordsRu", "Keywords RU"], ["seoKeywordsEn", "Keywords EN"]].map(([key, label]) => <label className="block" key={key}><span className="mb-2 block text-xs uppercase tracking-[0.18em] text-[#c6b798]">{label}</span><textarea className={fieldClasses(key.includes("Description"))} disabled={disabled || pending !== null} onChange={(event) => setField(key as keyof ProjectState, event.target.value as never)} value={state[key as keyof ProjectState] as string} /></label>)}
        </div>
      </section>

      <section className="space-y-4 rounded-[30px] border border-white/10 bg-white/[0.035] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#c6b798]">Narrative blocks</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#fff7ee]">Case study structure</h3>
          </div>
          <Button
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-[#fff7ee] transition hover:border-white/20 hover:bg-white/[0.05]"
            disabled={disabled || pending !== null}
            onClick={() =>
              setField("blocks", [...state.blocks, { type: "paragraph", ru: "", en: "" }])
            }
            type="button"
          >
            <PlusIcon className="size-4" />
            Add block
          </Button>
        </div>

        <div className="space-y-4">
          {state.blocks.map((block, index) => (
            <article className="rounded-xl border border-white/10 bg-black/20 p-4" key={`${block.type}-${index}`}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-white/10 px-3 py-1 text-[0.68rem] uppercase tracking-[0.18em] text-[#c6b798]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <select aria-label={`Block ${index + 1} type`}
                    className={fieldClasses()}
                    disabled={disabled || pending !== null}
                    onChange={(event) =>
                      setField(
                        "blocks",
                        state.blocks.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, type: event.target.value as BlockState["type"] } : item,
                        ),
                      )
                    }
                    value={block.type}
                  >
                    <option value="heading">heading</option>
                    <option value="paragraph">paragraph</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    className="rounded-full border border-white/10 p-2 text-[#fff7ee] transition hover:border-white/20 hover:bg-white/[0.05]"
                    disabled={disabled || pending !== null || index === 0}
                    onClick={() => {
                      const nextBlocks = [...state.blocks];
                      [nextBlocks[index - 1], nextBlocks[index]] = [nextBlocks[index], nextBlocks[index - 1]];
                      setField("blocks", nextBlocks);
                    }}
                    type="button"
                  >
                    <ArrowUpIcon aria-hidden="true" className="size-4" /><span className="sr-only">Move block up</span>
                  </Button>
                  <Button
                    className="rounded-full border border-white/10 p-2 text-[#fff7ee] transition hover:border-white/20 hover:bg-white/[0.05]"
                    disabled={disabled || pending !== null || index === state.blocks.length - 1}
                    onClick={() => {
                      const nextBlocks = [...state.blocks];
                      [nextBlocks[index + 1], nextBlocks[index]] = [nextBlocks[index], nextBlocks[index + 1]];
                      setField("blocks", nextBlocks);
                    }}
                    type="button"
                  >
                    <ArrowDownIcon aria-hidden="true" className="size-4" /><span className="sr-only">Move block down</span>
                  </Button>
                  <Button
                    className="rounded-full border border-rose-300/18 bg-rose-500/8 p-2 text-rose-100 transition hover:border-rose-200/30 hover:bg-rose-500/16"
                    disabled={disabled || pending !== null}
                    onClick={() => setField("blocks", state.blocks.filter((_, itemIndex) => itemIndex !== index))}
                    type="button"
                  >
                    <TrashIcon aria-hidden="true" className="size-4" /><span className="sr-only">Remove block</span>
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <textarea
                  className={fieldClasses(true)}
                  disabled={disabled || pending !== null}
                  onChange={(event) =>
                    setField(
                      "blocks",
                      state.blocks.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, ru: event.target.value } : item,
                      ),
                    )
                  }
                  aria-label={`Block ${index + 1} Russian copy`} placeholder="Russian copy"
                  value={block.ru}
                />
                <textarea
                  className={fieldClasses(true)}
                  disabled={disabled || pending !== null}
                  onChange={(event) =>
                    setField(
                      "blocks",
                      state.blocks.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, en: event.target.value } : item,
                      ),
                    )
                  }
                  aria-label={`Block ${index + 1} English copy`} placeholder="English copy"
                  value={block.en}
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-label="Project actions" className="sticky bottom-4 z-20 flex flex-wrap items-center gap-3 rounded-2xl border border-white/15 bg-[#141416]/95 p-4 shadow-[0_12px_50px_#0008] backdrop-blur-xl">
        <p className="mr-auto text-xs text-[#c6b798]" aria-live="polite">{disabled ? "Connect storage to edit this project" : dirty ? "Unsaved changes" : "All changes saved"}</p>
        <Button
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-[linear-gradient(120deg,#159bd3_0%,#e5097f_48%,#ffcf32_100%)] px-6 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          disabled={disabled || pending !== null}
          onClick={async () => {
            setPending("save");
            setMessage(null);

            try {
              const response = await fetch(`/api/admin/projects/${project.slug}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify(payload),
              });
              const data = (await response.json().catch(() => null)) as { error?: string; project?: MgsAdminProject } | null;

              if (!response.ok || !data?.project) {
                setMessage(data?.error ?? "Unable to save the project.");
                return;
              }

              setState(toProjectState(data.project));
              setSavedState(JSON.stringify(toProjectState(data.project)));
              setMessage("Project saved.");

              if (data.project.slug !== project.slug) {
                router.replace(`/admin/projects/${data.project.slug}`);
              }

              router.refresh();
            } catch {
              setMessage("Connection failed. Your changes are still here; please try again.");
            } finally {
              setPending(null);
            }
          }}
          type="button"
        >
          {pending === "save" ? "Saving..." : "Save project"}
        </Button>

        <Button
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-rose-300/20 bg-rose-500/10 px-6 text-sm font-semibold text-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={disabled || pending !== null}
          onClick={async () => {
            if (!window.confirm(`Delete ${project.title.en}?`)) {
              return;
            }

            setPending("delete");
            setMessage(null);

            try {
              const response = await fetch(`/api/admin/projects/${project.slug}`, {
                method: "DELETE",
                credentials: "same-origin",
              });
              const data = (await response.json().catch(() => null)) as { error?: string } | null;

              if (!response.ok) {
                setMessage(data?.error ?? "Unable to delete the project.");
                return;
              }

              router.replace("/admin/projects");
              router.refresh();
            } catch {
              setMessage("Unable to delete. Please check your connection and try again.");
            } finally {
              setPending(null);
            }
          }}
          type="button"
        >
          {pending === "delete" ? "Deleting..." : "Delete project"}
        </Button>

        {message ? <p role="status" className="w-full text-sm text-[#d2c3b4]">{message}</p> : null}
      </section>
      </div>

      <Dialog.Root open={Boolean(questionMode && questions.length)} onOpenChange={(open) => { if (!open) setQuestionMode(null); }}>
        <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md" />
          <Dialog.Content aria-describedby={undefined} className="admin-ui fixed left-1/2 top-1/2 z-[61] max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-white/15 bg-[#111113] p-6 text-[#f6ecdd] shadow-[0_30px_100px_rgba(0,0,0,0.65)] sm:p-8">
            <p className="text-xs uppercase tracking-[0.2em] text-[#c6b798]">Перед генерацией · {questionMode === "seo" ? "SEO" : "Copywriter"}</p>
            <Dialog.Title className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[#fff7ee]">Ответьте на несколько вопросов</Dialog.Title>
            <p className="mt-2 text-sm leading-6 text-[#b7aa9d]">Ответы помогут AI говорить конкретно о вашем проекте, а не заполнять поля общими фразами.</p>
            <div className="mt-6 space-y-4">{questions.map((question, index) => <label className="block" key={question.id}><span className="mb-2 block text-sm font-medium text-[#f6ecdd]">{index + 1}. {question.question}</span><textarea className={fieldClasses(true)} autoFocus={index === 0} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} placeholder={question.placeholder || "Ваш ответ"} value={answers[question.id] ?? ""} /> </label>)}</div>
            <div className="mt-7 flex items-center justify-end gap-3"><Button className="rounded-full border border-white/10 px-4 py-2.5 text-sm text-[#b7aa9d] transition hover:bg-white/[0.06]" onClick={() => setQuestionMode(null)} type="button">Отмена</Button><Button className="rounded-full bg-[linear-gradient(120deg,#159bd3,#e5097f,#ffcf32)] px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45" disabled={Object.values(answers).some((answer) => !answer.trim())} onClick={submitAnswers} type="button">Сгенерировать</Button></div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={showGuide} onOpenChange={setShowGuide}>
        <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md" />
          <Dialog.Content aria-describedby={undefined} className="admin-ui fixed left-1/2 top-1/2 z-[51] max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-white/15 bg-[#111113] p-6 text-[#f6ecdd] shadow-[0_30px_100px_rgba(0,0,0,0.6)] sm:p-8">
            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#159bd3,#e5097f,#ffcf32)]" />
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#c6b798]">AI editor guide · {guideStep + 1}/3</p>
              <Button className="text-sm text-[#a99c90] transition hover:text-white" onClick={closeGuide} type="button">Пропустить</Button>
            </div>
            <Dialog.Title className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-[#fff7ee]">
              {guideStep === 0 ? "Начните с SEO" : guideStep === 1 ? "Проверьте результат" : "Сохраните изменения"}
            </Dialog.Title>
            <p className="mt-4 text-base leading-7 text-[#d2c3b4]">
              {guideStep === 0 ? "Нажмите Generate SEO в блоке AI studio tools. Система подготовит SEO-заголовок, meta description и ключевые слова на русском и английском." : guideStep === 1 ? "Поля заполнятся как черновик. Проверьте формулировки, при необходимости отредактируйте их вручную или запустите генерацию ещё раз." : "Когда результат вас устраивает, пролистайте вниз и нажмите Save project. Только после этого данные попадут в проект и на сайт."}
            </p>
            <div className="mt-7 flex items-center justify-between gap-3">
              <Button className="rounded-full border border-white/10 px-4 py-2.5 text-sm text-[#b7aa9d] transition hover:bg-white/[0.06] disabled:invisible" disabled={guideStep === 0} onClick={() => setGuideStep((step) => step - 1)} type="button">Назад</Button>
              {guideStep < 2 ? <Button className="rounded-full bg-[linear-gradient(120deg,#159bd3,#e5097f,#ffcf32)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110" onClick={() => setGuideStep((step) => step + 1)} type="button">Далее</Button> : <Button className="rounded-full bg-[linear-gradient(120deg,#159bd3,#e5097f,#ffcf32)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110" onClick={closeGuide} type="button">Понятно</Button>}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
