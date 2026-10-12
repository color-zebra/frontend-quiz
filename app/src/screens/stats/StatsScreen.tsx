import clsx from "clsx";
import { useState, type ReactNode } from "react";
import { UNGROUPED, type QuestionBank } from "../../data/types";
import { useProgress } from "../../features/progress/ProgressProvider";
import {
  getBankStats,
  RECENT_ANSWERS,
  type BankStats,
  type TopicStats,
  type WeakSubtopic,
} from "../../features/progress/stats";
import { useSets } from "../../features/sets/SetsProvider";
import { ANSWER_FORMS, OF_QUESTIONS_FORMS, plural } from "../../shared/lib/plural";
import { readStorageJson, writeStorage } from "../../shared/lib/storage";
import { IconButton } from "../../shared/ui/Button";
import { Card } from "../../shared/ui/Card";
import glass from "../../shared/ui/glass.module.css";
import { Icon } from "../../shared/ui/Icon";
import { Screen, TopBar } from "../../shared/ui/Screen";
import { ScreenTitle } from "../../shared/ui/ScreenTitle";
import styles from "./StatsScreen.module.css";

interface StatsScreenProps {
  bank: QuestionBank;
  onBack: () => void;
  /** Прорешать ошибки подтемы — сразу сессия из них, в базе или наборе, откуда подтема. */
  onStart: (bank: QuestionBank, questionIds: string[], length: number) => void;
}

/** Свой набор со своей статистикой. */
interface SetSection {
  bank: QuestionBank;
  stats: BankStats;
  title: string;
}

/** Какие наборы раскрыты: по умолчанию все свёрнуты, раскрытые запоминаются на устройстве. */
const OPEN_SETS_KEY = "fq.statsOpenSets";

const percent = (share: number) => `${Math.round(share * 100)} %`;
const hasAnswers = (stats: BankStats) => stats.seen > 0 || !!stats.speech;

function readOpenSets() {
  const saved = readStorageJson(OPEN_SETS_KEY);
  return new Set(Array.isArray(saved) ? saved.filter((id): id is string => typeof id === "string") : []);
}

/**
 * Статистика: сначала основная база и её слабые места, ниже — свои наборы сворачиваемыми карточками, у каждого внутри
 * свои полоски и слабые места. Набор появляется, когда на его вопросы уже отвечали. Сброс — в кабинете.
 */
export function StatsScreen({ bank, onBack, onStart }: StatsScreenProps) {
  const { records, getProgress } = useProgress();
  const { sets, getSetBank } = useSets();
  const [openSets, setOpenSets] = useState(readOpenSets);
  const getStats = (b: QuestionBank) => getBankStats(b, records, (id) => getProgress(b.setId, id));

  const base = getStats(bank);
  const baseShown = hasAnswers(base);
  const setSections = sets.flatMap((record): SetSection[] => {
    const setBank = getSetBank(record.id);
    if (!setBank) return [];
    const stats = getStats(setBank);
    return hasAnswers(stats) ? [{ bank: setBank, stats, title: record.title }] : [];
  });
  // Подпись цветов — одна, под полосками базы; если у базы полосок нет, — в каждом наборе.
  const legendInBase = base.topics.length > 0;

  function toggleSet(id: string, open: boolean) {
    const next = new Set(openSets);
    if (open) next.add(id);
    else next.delete(id);
    setOpenSets(next);
    writeStorage(OPEN_SETS_KEY, JSON.stringify([...next]));
  }

  return (
    <Screen>
      <TopBar>
        <IconButton icon="arrowLeft" label="Назад" onClick={onBack} />
      </TopBar>
      <ScreenTitle title="Статистика" subtitle={setSections.length ? "Основная база и свои наборы" : "Основная база"} />

      {!baseShown && setSections.length === 0 && (
        <p className={styles.empty}>Пока нет ни одного ответа — статистика появится после первой сессии.</p>
      )}

      {baseShown && (
        <>
          <Card label="Основная база">
            <StatsBody stats={base} withLegend={legendInBase} />
          </Card>
          {base.weak.length > 0 && (
            <Card label="Слабые места">
              <WeakList weak={base.weak} onStart={(w) => onStart(bank, w.questionIds, w.questionIds.length)} />
            </Card>
          )}
        </>
      )}

      {setSections.map((section) => (
        <SetCard
          key={section.bank.setId}
          section={section}
          open={openSets.has(section.bank.setId)}
          onToggle={(open) => toggleSet(section.bank.setId, open)}
        >
          <StatsBody stats={section.stats} withLegend={!legendInBase} />
          {section.stats.weak.length > 0 && (
            <>
              <div className={styles.setWeakLabel}>Слабые места</div>
              <WeakList
                weak={section.stats.weak}
                onStart={(w) => onStart(section.bank, w.questionIds, w.questionIds.length)}
              />
            </>
          )}
        </SetCard>
      ))}
    </Screen>
  );
}

interface SetCardProps {
  section: SetSection;
  open: boolean;
  onToggle: (open: boolean) => void;
  children: ReactNode;
}

/** Сворачиваемая карточка набора: в свёрнутом виде — название и одна строка итогов. */
function SetCard({ section, open, onToggle, children }: SetCardProps) {
  const { stats, title } = section;
  const summary =
    stats.total > 0
      ? `видел ${stats.seen} из ${stats.total} · верных ${percent(stats.answers.accuracy)}`
      : "устные вопросы";
  return (
    <details
      className={clsx(styles.setCard, glass.glass)}
      open={open}
      onToggle={(e) => onToggle(e.currentTarget.open)}
    >
      <summary className={styles.setSummary}>
        <span className={styles.setHead}>
          <span className={styles.setLabel}>
            <Icon name="folder" />
            Набор «{title}»
          </span>
          <span className={styles.setLine}>{summary}</span>
        </span>
        <Icon name="chevronRight" className={styles.setMarker} />
      </summary>
      <div className={styles.setBody}>{children}</div>
    </details>
  );
}

/** Видел и точность, полоски тем, устные, подпись цветов. */
function StatsBody({ stats, withLegend }: { stats: BankStats; withLegend: boolean }) {
  return (
    <>
      {stats.total > 0 && (
        <>
          <p className={styles.seen}>
            Видел <b>{stats.seen}</b> из {stats.total} {plural(stats.total, OF_QUESTIONS_FORMS)}
          </p>
          <p className={styles.accuracy}>
            Верных ответов: <b>{percent(stats.answers.accuracy)}</b> — из {stats.answers.count}{" "}
            {plural(stats.answers.count, ANSWER_FORMS)}
          </p>
          {stats.recent && (
            <p className={styles.accuracy}>
              За последние {RECENT_ANSWERS}: <b>{percent(stats.recent.accuracy)}</b>
            </p>
          )}
        </>
      )}

      {stats.topics.length > 0 && (
        <ul className={styles.topics}>
          {stats.topics.map((topic) => (
            <TopicRow key={topic.id} topic={topic} />
          ))}
        </ul>
      )}

      {stats.speech && (
        <p className={clsx(styles.accuracy, styles.speech)}>
          Устные, по последней самооценке: знал <b>{stats.speech.knew}</b> · частично <b>{stats.speech.partly}</b> · не
          знал <b>{stats.speech.didnt}</b>
        </p>
      )}

      {withLegend && stats.topics.length > 0 && (
        <p className={styles.legend}>
          <LegendItem dot={styles.dotMastered} label="освоено" />
          <LegendItem dot={styles.dotAlmost} label="закрепить" />
          <LegendItem dot={styles.dotMistakes} label="ошибки" />
          <LegendItem dot={styles.dotUnseen} label="не видел" />
        </p>
      )}
    </>
  );
}

function WeakList({ weak, onStart }: { weak: readonly WeakSubtopic[]; onStart: (weak: WeakSubtopic) => void }) {
  return (
    <div className={styles.weakList}>
      {weak.map((w) => (
        <WeakRow key={w.key} weak={w} onStart={() => onStart(w)} />
      ))}
    </div>
  );
}

/** Слабая подтема: сверху мелко тема, ниже подтема. У вопросов без подтемы — одна строка с темой. */
function WeakRow({ weak, onStart }: { weak: WeakSubtopic; onStart: () => void }) {
  const noSubtopic = weak.subtopicTitle === UNGROUPED;
  const title = noSubtopic ? weak.topicTitle : weak.subtopicTitle;
  return (
    <button
      type="button"
      className={clsx(styles.weak, glass.glass)}
      aria-label={`Прорешать: ${noSubtopic ? title : `${weak.topicTitle} · ${title}`}`}
      onClick={onStart}
    >
      <span className={styles.weakText}>
        {!noSubtopic && <span className={styles.weakTopic}>{weak.topicTitle}</span>}
        <span className={styles.weakTitle}>{title}</span>
        <span className={styles.weakCount}>
          ошибки: {weak.questionIds.length}
          {weak.almost > 0 && <span className={styles.almostText}>{` · закрепить: ${weak.almost}`}</span>}
        </span>
      </span>
      <Icon name="refresh" className={styles.weakIcon} />
    </button>
  );
}

/** Пункт подписи под полосками: точка и слово переносятся только вместе. */
function LegendItem({ dot, label }: { dot: string; label: string }) {
  return (
    <span className={styles.legendItem}>
      <span className={dot} />
      {label}
    </span>
  );
}

/** Тема: полоска из четырёх частей — освоено, почти исправлено, в ошибках, не видел. */
function TopicRow({ topic }: { topic: TopicStats }) {
  const width = (n: number) => `${(n / topic.total) * 100}%`;
  const almost = topic.almost ? `, закрепить ${topic.almost}` : "";
  const summary = `освоено ${topic.mastered}, в ошибках ${topic.mistakes}, не видел ${topic.unseen} из ${topic.total}${almost}`;
  return (
    <li className={styles.topic}>
      <div className={styles.topicHead}>
        <span>{topic.title}</span>
        <span className={styles.topicShare}>освоено {percent(topic.mastered / topic.total)}</span>
      </div>
      <div className={styles.bar} role="img" aria-label={`${topic.title}: ${summary}`}>
        <span className={styles.mastered} style={{ width: width(topic.mastered) }} />
        <span className={styles.almost} style={{ width: width(topic.almost) }} />
        <span className={styles.mistakes} style={{ width: width(topic.mistakes - topic.almost) }} />
      </div>
    </li>
  );
}
