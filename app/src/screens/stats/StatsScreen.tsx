import clsx from "clsx";
import { formatTopicLine } from "../../data/titles";
import type { QuestionBank } from "../../data/types";
import { useProgress } from "../../features/progress/ProgressProvider";
import { getBankStats, RECENT_ANSWERS, type TopicStats } from "../../features/progress/stats";
import { ANSWER_FORMS, plural } from "../../shared/lib/plural";
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
      <ScreenTitle title="Статистика" subtitle="Основная база · ответы хранятся только на этом устройстве" />

      {stats.seen === 0 && !stats.speech ? (
        <p className={styles.empty}>Пока нет ни одного ответа — статистика появится после первой сессии.</p>
      ) : (
        <>
          <Card label="Основная база">
            <p className={styles.seen}>
              Видел <b>{stats.seen}</b> из {stats.total} вопросов
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
              <span className={styles.dotMastered} /> освоено <span className={styles.dotMistakes} /> в ошибках{" "}
              <span className={styles.dotUnseen} /> не видел
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
                    onClick={() => onStart(weak.questionIds, weak.questionIds.length)}
                  >
                    <span className={styles.weakText}>
                      <span>{formatTopicLine(weak.topicTitle, weak.subtopicTitle)}</span>
                      <span className={styles.weakCount}>ошибок: {weak.questionIds.length}</span>
                    </span>
                    <span className={styles.weakAction}>
                      <Icon name="refresh" />
                      Прорешать
                    </span>
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

/** Тема: полоска из трёх частей — освоено, в ошибках, не видел. */
function TopicRow({ topic }: { topic: TopicStats }) {
  const width = (n: number) => `${(n / topic.total) * 100}%`;
  const summary = `освоено ${topic.mastered}, в ошибках ${topic.mistakes}, не видел ${topic.unseen} из ${topic.total}`;
  return (
    <li className={styles.topic}>
      <div className={styles.topicHead}>
        <span>{topic.title}</span>
        <span className={styles.topicShare}>освоено {percent(topic.mastered / topic.total)}</span>
      </div>
      <div className={styles.bar} role="img" aria-label={`${topic.title}: ${summary}`}>
        <span className={styles.mastered} style={{ width: width(topic.mastered) }} />
        <span className={styles.mistakes} style={{ width: width(topic.mistakes) }} />
      </div>
    </li>
  );
}
