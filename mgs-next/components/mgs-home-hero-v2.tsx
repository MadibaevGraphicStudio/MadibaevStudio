"use client";

import { ArrowDownIcon, ArrowUpRightIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { MgsLocale } from "@/lib/mgs-project-data";

import styles from "./mgs-home-hero-v2.module.css";

type MgsHomeHeroV2Props = {
  locale: MgsLocale;
};

const heroCopy = {
  ru: {
    opening: "Создаём",
    words: ["бренды", "сайты", "продукты", "системы"],
    closing: "которые работают!",
    lead: "Стратегия, дизайн и технологии в одной команде. Разбираемся в задаче, проектируем решение и доводим его до запуска.",
    primaryAction: "Обсудить проект",
    secondaryAction: "Смотреть работы",
    location: "Душанбе · работаем по всему миру",
    availability: "Открыты для новых проектов",
  },
  en: {
    opening: "We create",
    words: ["brands", "websites", "products", "systems"],
    closing: "that work.",
    lead: "Strategy, design, and technology in one team. We clarify the challenge, shape the solution, and take it all the way to launch.",
    primaryAction: "Discuss a project",
    secondaryAction: "View our work",
    location: "Dushanbe · working worldwide",
    availability: "Available for new projects",
  },
} as const;

function withLocale(path: string, locale: MgsLocale) {
  return `${path}?lang=${locale}`;
}

export function MgsHomeHeroV2({ locale }: MgsHomeHeroV2Props) {
  const copy = heroCopy[locale];
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;

    const timer = window.setInterval(() => {
      setWordIndex((current) => (current + 1) % copy.words.length);
    }, 2600);

    return () => window.clearInterval(timer);
  }, [copy.words.length, locale]);

  const currentWord = copy.words[wordIndex];

  return (
    <section className={styles.hero} aria-labelledby="mgs-home-hero-title">
      <div className={styles.backgroundGrid} aria-hidden="true" />
      <div className={`mgs-shell ${styles.shell}`}>
        <div className={styles.intro}>
          <div className={styles.copy}>
            <h1
              id="mgs-home-hero-title"
              aria-label={`${copy.opening} ${copy.words[0]} ${copy.closing}`}
            >
              <span aria-hidden="true">{copy.opening}</span>
              <span
                className={styles.dynamicLine}
                aria-hidden="true"
                style={{ minHeight: ".84em", marginBottom: "-.09em", transform: "translateY(.07em)" }}
              >
                <span className={styles.dynamicWord} key={`${locale}-${currentWord}`}>{currentWord}</span>
              </span>
              <span aria-hidden="true">{copy.closing}</span>
            </h1>

            <div className={styles.support}>
              <p className={styles.lead}>{copy.lead}</p>

              <div className={styles.actions}>
                <Link className={`${styles.button} ${styles.buttonPrimary}`} href={withLocale("/contact", locale)}>
                  <span>{copy.primaryAction}</span>
                  <ArrowUpRightIcon aria-hidden="true" />
                </Link>
                <Link className={`${styles.button} ${styles.buttonSecondary}`} href="#selected-work">
                  <span>{copy.secondaryAction}</span>
                  <ArrowDownIcon aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div className={styles.meta}>
              <span>{copy.location}</span>
              <span className={styles.availability}><i aria-hidden="true" />{copy.availability}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
