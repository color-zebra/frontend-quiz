import clsx from "clsx";
import { formatTopicLine } from "../../data/titles";
import type { QuestionBank } from "../../data/types";
import { useProgress } from "../../features/progress/ProgressProvider";
import { getBankStats, RECENT_ANSWERS, type TopicStats } from "../../features/progress/stats";
import { ANSWER_FORMS, OF_QUESTIONS_FORMS, plural } from "../../shared/lib/plural";
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
  /** Прорешать ошибки подтемы — сразу сессия из них. */
  onStart: (questionIds: string[], length: number) => void;
}

const percent = (share: number) => `${Math.round(share * 100)} %`;

/** Статистика основной базы: что видел, точность, какие темы отстают, слабые подтемы. Сброс — в кабинете. */
export function StatsScreen({ bank, onBack, onStart }: StatsScreenProps) {
  const { records, getProgress } = useProgress();
  const stats = getBankStats(bank, records, (id) => getProgress(bank.setId, id));

  return (
    <Screen>
      <TopBar>
        <IconButton icon="arrowLeft" label="Назад" onClick={onBack} />
      </TopBar>
      <ScreenTitle title="Статистика" subtitle="Основная база" />

      {stats.seen === 0 && !stats.speech ? (
        <p className={styles.empty}>Пока нет ни одного ответа — статистика появится после первой сессии.</p>
      ) : (
        <>
          <Card label="Основная база">
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
          </Card>

          <Card label="По темам">
            <ul className={styles.topics}>
              {stats.topics.map((topic) => (
                <TopicRow key={topic.id} topic={topic} />
              ))}
            </ul>
            <p className={styles.legend}>
              <LegendItem dot={styles.dotMastered} label="освоено" />
              <LegendItem dot={styles.dotAlmost} label="закрепить" />
              <LegendItem dot={styles.dotMistakes} label="ошибки" />
              <LegendItem dot={styles.dotUnseen} label="не видел" />
            </p>
          </Card>

          {stats.weak.length > 0 && (
            <Card label="Слабые места">
              <div className={styles.weakList}>
                {stats.weak.map((weak) => (
                  <button
                    key={weak.key}
                    type="button"
                    className={clsx(styles.weak, glass.glass)}
                    aria-label={`Прорешать: ${formatTopicLine(weak.topicTitle, weak.subtopicTitle)}`}
                    onClick={() => onStart(weak.questionIds, weak.questionIds.length)}
                  >
                    <span className={styles.weakText}>
                      <span className={styles.weakTopic}>{weak.topicTitle}</span>
                      <span className={styles.weakTitle}>{weak.subtopicTitle}</span>
                      <span className={styles.weakCount}>
                        ошибки: {weak.questionIds.length}
                        {weak.almost > 0 && (
                          <span className={styles.almostText}>
                            {` · закрепить: ${weak.almost}`}
                          </span>
                        )}
                      </span>
                    </span>
                    <Icon name="refresh" className={styles.weakIcon} />
                  </button>
                ))}
              </div>
            </Card>
          )}

          {stats.speech && (
            <Card label="Устные вопросы">
              <p className={styles.accuracy}>
                По последней самооценке: знал <b>{stats.speech.knew}</b> · частично <b>{stats.speech.partly}</b> · не
                знал <b>{stats.speech.didnt}</b>
              </p>
            </Card>
          )}
        </>
      )}

    </Screen>
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
