import clsx from "clsx";
import type { ReactNode } from "react";
import { readStorage, writeStorage } from "../lib/storage";
import { IconButton } from "./Button";
import { Icon, type IconName } from "./Icon";
import { ScreenTitle } from "./ScreenTitle";
import { useIsDesktop } from "./useIsDesktop";
import styles from "./SectionSwitch.module.css";

/** Три раздела приложения: курсы, тренажёр вопросов и кабинет. */
export type Section = "courses" | "trainer" | "cabinet";

const SECTIONS: { id: Section; label: string; icon: IconName }[] = [
  { id: "courses", label: "Курсы", icon: "book" },
  { id: "trainer", label: "Тренажёр", icon: "target" },
  { id: "cabinet", label: "Кабинет", icon: "user" },
];

const SECTION_KEY = "fq.section";

/** Раздел, открытый в прошлый раз: приложение открывается там же. Первый запуск — «Курсы». */
export function readSection(): Section {
  const saved = readStorage(SECTION_KEY);
  return SECTIONS.some((s) => s.id === saved) ? (saved as Section) : "courses";
}

export function writeSection(section: Section) {
  writeStorage(SECTION_KEY, section);
}

/**
 * Переключатель разделов — под заголовком трёх главных экранов. Не прилипает: уезжает при прокрутке, чтобы
 * не отнимать место у текста. Внутри курса, урока и вопроса его нет.
 */
export function SectionSwitch({ current, onSelect }: { current: Section; onSelect: (section: Section) => void }) {
  // На десктопе разделы — в боковом меню.
  if (useIsDesktop()) return null;
  return (
    <nav className={styles.switch} aria-label="Разделы">
      {SECTIONS.map((s) => (
        <button
          key={s.id}
          type="button"
          className={clsx(styles.item, s.id === current && styles.current)}
          aria-current={s.id === current ? "page" : undefined}
          onClick={() => s.id !== current && onSelect(s.id)}
        >
          <Icon name={s.icon} />
          {s.label}
        </button>
      ))}
    </nav>
  );
}

interface SectionHeaderProps {
  section: Section;
  title: string;
  subtitle?: ReactNode;
  onSelect: (section: Section) => void;
  onOpenHelp: () => void;
  /** Под переключателем: строка «Вышла новая версия». */
  children?: ReactNode;
}

/** Шапка главного экрана раздела: заголовок и «Помощь», под ними — переключатель разделов. */
export function SectionHeader({ section, title, subtitle, onSelect, onOpenHelp, children }: SectionHeaderProps) {
  // На десктопе «Справка» — внизу бокового меню.
  const desktop = useIsDesktop();
  return (
    <>
      <header className={styles.head}>
        <ScreenTitle title={title} subtitle={subtitle} />
        {!desktop && <IconButton icon="help" label="Помощь" onClick={onOpenHelp} />}
      </header>
      <SectionSwitch current={section} onSelect={onSelect} />
      {children}
    </>
  );
}
