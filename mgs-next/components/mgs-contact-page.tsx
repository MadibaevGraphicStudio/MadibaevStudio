"use client";

import {
  ArrowUpRightIcon,
  ChevronDownIcon,
  EnvelopeIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { MgsLocale } from "@/lib/mgs-project-data";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

const contactCopy = {
  ru: {
    eyebrow: "Обсудить проект",
    title: "Обсудим проект.",
    lead: "Расскажите, что нужно запустить, изменить или улучшить. Мы разберём контекст и предложим следующий шаг.",
    formTitle: "О проекте",
    formNote: "Можно без готового ТЗ",
    required: "обязательно",
    labels: { name: "Имя", company: "Компания", email: "Email", contact: "Telegram / WhatsApp", projectType: "Тип задачи", budget: "Ориентир по бюджету", deadline: "Срок", message: "Что нужно решить" },
    placeholders: { name: "Ваше имя", email: "name@company.com", company: "Компания / проект", contact: "@username или +992…", budget: "Например, $2,000–5,000", deadline: "Дата или желаемый период", message: "Что происходит сейчас, что должно измениться и какой результат нужен" },
    projectTypes: ["Комплексный проект", "Брендинг", "Сайты", "Интерфейсы", "Графический дизайн / презентация", "Реклама / событие / печать", "3D-визуализация", "Другое"],
    selectProjectType: "Выберите направление",
    attachmentNote: "Есть бриф, презентация, сайт, референсы или другие материалы? Добавьте ссылку в описании.",
    submit: "Отправить задачу",
    submitting: "Отправляем…",
    error: "Не удалось отправить запрос. Попробуйте ещё раз или напишите нам напрямую.",
    fallback: "Форма временно недоступна, поэтому мы открыли письмо с вашим брифом. Если почтовый клиент не открылся, напишите на info@madibaevstudio.online или в Telegram.",
    directTitle: "Или напрямую",
    locationLabel: "География",
    location: "Душанбе · worldwide",
    responseLabel: "Ответ",
    response: "Обычно 1–2 рабочих дня",
  },
  en: {
    eyebrow: "Discuss a project",
    title: "Let's discuss your project.",
    lead: "Tell us what needs to launch, change, or improve. We'll review the context and define the next step.",
    formTitle: "Project context",
    formNote: "No perfect brief required",
    required: "required",
    labels: { name: "Name", company: "Company", email: "Email", contact: "Telegram / WhatsApp", projectType: "Challenge type", budget: "Budget range", deadline: "Timing", message: "What needs to change" },
    placeholders: { name: "Your name", email: "name@company.com", company: "Company / project", contact: "@username or +1…", budget: "For example, $2,000–5,000", deadline: "Target date or timeframe", message: "What is happening now, what should change, and what result do you need?" },
    projectTypes: ["End-to-end project", "Branding", "Websites", "UI/UX Design", "Graphic Design / Presentation", "Advertising / Event / Print", "3D Visualization", "Other"],
    selectProjectType: "Select a direction",
    attachmentNote: "Already have a brief, presentation, website, references, or other materials? Add a link in the message.",
    submit: "Send the challenge",
    submitting: "Sending…",
    error: "Could not send the enquiry. Please try again or contact us directly.",
    fallback: "The form is temporarily unavailable, so we opened an email with your brief. If your email client did not open, contact info@madibaevstudio.online or Telegram.",
    directTitle: "Or contact us directly",
    locationLabel: "Location",
    location: "Dushanbe · worldwide",
    responseLabel: "Response",
    response: "Usually within 1–2 business days",
  },
} as const;

type EnquiryPayload = {
  name: string;
  email: string;
  company: string;
  contact: string;
  projectType: string;
  budget: string;
  deadline: string;
  message: string;
};

function buildFallbackMailto(payload: EnquiryPayload, locale: MgsLocale) {
  const subject = locale === "ru" ? "Заявка на проект для MGS" : "Project enquiry for MGS";
  const lines = [["Name", payload.name], ["Email", payload.email], ["Company", payload.company], ["Contact", payload.contact], ["Project type", payload.projectType], ["Budget", payload.budget], ["Timing", payload.deadline], ["Message", payload.message]]
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}`);
  return `mailto:info@madibaevstudio.online?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n\n"))}`;
}

export function MgsContactPage({ locale }: { locale: MgsLocale }) {
  const copy = contactCopy[locale];
  const router = useRouter();
  const formStartedAt = useRef<number | null>(null);
  useEffect(() => { formStartedAt.current = Date.now(); }, []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);

    const formData = new FormData(event.currentTarget);
    const payload: EnquiryPayload = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      company: String(formData.get("company") || "").trim(),
      contact: String(formData.get("contact") || "").trim(),
      projectType: String(formData.get("projectType") || "").trim(),
      budget: String(formData.get("budget") || "").trim(),
      deadline: String(formData.get("deadline") || "").trim(),
      message: String(formData.get("message") || "").trim(),
    };

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          website: String(formData.get("website") || ""),
          formStartedAt: formStartedAt.current ?? Date.now(),
          turnstileToken: String(formData.get("cf-turnstile-response") || ""),
        }),
      });

      if (!response.ok) {
        if (response.status === 503) {
          window.location.href = buildFallbackMailto(payload, locale);
          setSubmitError(copy.fallback);
          setIsSubmitting(false);
          return;
        }
        const turnstile = (window as Window & { turnstile?: { reset(): void } }).turnstile;
        turnstile?.reset();
        throw new Error("submit_failed");
      }

      const params = new URLSearchParams({ lang: locale, name: payload.name });
      router.push(`/thank-you?${params.toString()}`);
    } catch {
      setSubmitError(copy.error);
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mgs-route-page mgs-shell">
      {TURNSTILE_SITE_KEY ? <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" /> : null}
      <section className="mgs-route-hero">
        <p className="mgs-eyebrow"><span />{copy.eyebrow}</p>
        <div className="mgs-route-hero__heading"><h1>{copy.title}</h1><p>{copy.lead}</p></div>
      </section>

      <section className="mgs-contact-layout">
        <form className="mgs-contact-form" onSubmit={handleSubmit}>
          <div className="mgs-contact-form__heading"><p className="mgs-eyebrow">{copy.formTitle}</p><span>{copy.formNote}</span></div>

          <div aria-hidden="true" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" }}>
            <label htmlFor="enquiry-website">Website</label>
            <input autoComplete="off" id="enquiry-website" name="website" tabIndex={-1} type="text" />
          </div>

          <div className="mgs-contact-form__fields">
            <label className="mgs-contact-form__field" htmlFor="enquiry-name"><span>{copy.labels.name} <em>{copy.required}</em></span><input autoComplete="name" id="enquiry-name" name="name" placeholder={copy.placeholders.name} required type="text" /></label>
            <label className="mgs-contact-form__field" htmlFor="enquiry-email"><span>{copy.labels.email} <em>{copy.required}</em></span><input autoComplete="email" id="enquiry-email" name="email" placeholder={copy.placeholders.email} required type="email" /></label>
            <label className="mgs-contact-form__field" htmlFor="enquiry-company"><span>{copy.labels.company}</span><input autoComplete="organization" id="enquiry-company" name="company" placeholder={copy.placeholders.company} type="text" /></label>
            <label className="mgs-contact-form__field" htmlFor="enquiry-contact"><span>{copy.labels.contact}</span><input autoComplete="tel" id="enquiry-contact" name="contact" placeholder={copy.placeholders.contact} type="text" /></label>
            <label className="mgs-contact-form__field" htmlFor="enquiry-project-type"><span>{copy.labels.projectType}</span><span className="mgs-contact-form__select"><select defaultValue="" id="enquiry-project-type" name="projectType" required><option disabled value="">{copy.selectProjectType}</option>{copy.projectTypes.map((projectType) => <option key={projectType} value={projectType}>{projectType}</option>)}</select><ChevronDownIcon aria-hidden="true" /></span></label>
            <label className="mgs-contact-form__field" htmlFor="enquiry-budget"><span>{copy.labels.budget}</span><input id="enquiry-budget" inputMode="decimal" name="budget" placeholder={copy.placeholders.budget} type="text" /></label>
            <label className="mgs-contact-form__field" htmlFor="enquiry-deadline"><span>{copy.labels.deadline}</span><input id="enquiry-deadline" name="deadline" placeholder={copy.placeholders.deadline} type="text" /></label>
            <label className="mgs-contact-form__field mgs-contact-form__field--wide" htmlFor="enquiry-message"><span>{copy.labels.message} <em>{copy.required}</em></span><textarea id="enquiry-message" name="message" placeholder={copy.placeholders.message} required rows={7} /></label>
          </div>

          {TURNSTILE_SITE_KEY ? <div className="cf-turnstile" data-sitekey={TURNSTILE_SITE_KEY} data-theme="dark" /> : null}
          <p className="mgs-contact-form__attachment-note">{copy.attachmentNote}</p>
          <Button aria-live="polite" className="mgs-button mgs-button--primary" disabled={isSubmitting} type="submit"><span>{isSubmitting ? copy.submitting : copy.submit}</span><ArrowUpRightIcon aria-hidden="true" /></Button>
          {submitError ? <p className="mgs-contact-form__error" role="alert">{submitError}</p> : null}
        </form>

        <aside className="mgs-contact-panel">
          <p className="mgs-eyebrow">{copy.directTitle}</p>
          <ul><li><EnvelopeIcon aria-hidden="true" /><a href="mailto:info@madibaevstudio.online">info@madibaevstudio.online</a></li><li><GlobeAltIcon aria-hidden="true" /><a href="https://t.me/madibaevstudio" rel="noreferrer" target="_blank">@madibaevstudio</a></li></ul>
          <div className="mgs-contact-panel__meta"><div><span>{copy.locationLabel}</span><strong>{copy.location}</strong></div><div><span>{copy.responseLabel}</span><strong>{copy.response}</strong></div></div>
        </aside>
      </section>
    </main>
  );
}
