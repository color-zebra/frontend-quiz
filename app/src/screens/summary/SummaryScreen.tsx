import clsx from "clsx";
import type { CSSProperties } from "react";
import { formatTopicLine, getTopicTitles } from "../../data/titles";
import type { QuestionBank } from "../../data/types";
import { AchievementBadge } from "../../features/achievements/AchievementBadge";
import type { Achievement } from "../../features/achievements/achievements";
import { getMistakeIds, type SessionAnswer } from "../../features/session/session";
import { countQuestions } from "../../shared/lib/plural";
import { Brand } from "../../shared/ui/Brand";
import { Button } from "../../shared/ui/Button";
import { Card, SectionLabel } from "../../shared/ui/Card";
import glass from "../../shared/ui/glass.module.css";
import { Icon } from "../../shared/ui/Icon";
import { LevelBadge } from "../../shared/ui/LevelBadge";
import { Markdown } from "../../shared/ui/Markdown";
import { Screen, TopBar } from "../../shared/ui/Screen";
import { ScreenTitle } from "../../shared/ui/ScreenTitle";
import styles from "./SummaryScreen.module.css";

interface SummaryScreenProps {
  bank: QuestionBank;
  answers: readonly SessionAnswer[];
  /** Ачивки, полученные в этой сессии. */
  achievements: readonly Achievement[];
  onRetryMistakes: (ids: string[]) => void;
  onOpenQuestion: (id: string) => void;
  /** Подпись кнопки возврата: «На главную» или «К набору». */
  backLabel: string;
  onBack: () => void;
}

function getTopicStats(bank: QuestionBank, answers: readonly SessionAnswer[]) {
  const stats = new Map<string, { title: string; correct: number; total: number }>();
  for (const answer of answers) {
    const question = bank.byId.get(answer.questionId);
    if (!question) continue;
    const entry = stats.get(question.topic) ?? { title: getTopicTitles(bank, question).topicTitle, correct: 0, total: 0 };
    entry.total++;
    if (answer.correct) entry.correct++;
    stats.set(question.topic, entry);
  }
  return [...stats.values()];
}

/** «Отвечено 10 вопросов», а если были устные — ещё и разбивка самооценки. */
function getSubtitle(answers: readonly SessionAnswer[]) {
  const total = `Отвечено ${countQuestions(answers.length)}`;
  const graded = answers.filter((a) => a.grade);
  if (graded.length === 0) return total;
  const count = (grade: string) => graded.filter((a) => a.grade === grade).length;
  return `${total} · устно: знал ${count("knew")}, частично ${count("partly")}, не знал ${count("didnt")}`;
}

export function SummaryScreen({
  bank,
  answers,
  achievements,
  onRetryMistakes,
  onOpenQuestion,
  backLabel,
  onBack,
}: SummaryScreenProps) {
  const correct = answers.filter((a) => a.correct).length;
  // Сессия только из устных вопросов — подписи про «знал», а не про «верно».
  const speechOnly = answers.length > 0 && answers.every((a) => a.grade);
  const percent = answers.length ? Math.round((correct / answers.length) * 100) : 0;
  const mistakeIds = getMistakeIds(answers);
  const topicStats = getTopicStats(bank, answers);

  return (
    <Screen>
      <TopBar>
        <Brand />
      </TopBar>

      <ScreenTitle title="Сессия завершена" subtitle={getSubtitle(answers)} />

      <section className={clsx(styles.score, glass.glass)}>
        <div className={styles.ringWrap}>
          <div className={styles.ring} style={{ "--p": `${percent}%` } as CSSProperties} />
          <div className={styles.ringText}>
            <b>
              {correct} / {answers.length}
            </b>
            <span>
              {percent}% {speechOnly ? "знал" : "верно"}
            </span>
          </div>
        </div>
      </section>

      {achievements.length > 0 && (
        <Card label="Новые достижения">
          <ul className={styles.achievements}>
            {achievements.map((achievement) => (
              <li key={achievement.id} className={styles.achievement}>
                <AchievementBadge achievement={achievement} earned size={44} />
                <span className={styles.achievementText}>
                  <b>{achievement.title}</b>
                  <span>{achievement.description}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {topicStats.length > 1 && (
        <Card label="По темам">
          <div className={styles.stats}>
            {topicStats.map((s) => (
              <div key={s.title} className={styles.stat}>
                <span>{s.title}</span>
                <span className={styles.bar}>
                  <span style={{ width: `${(s.correct / s.total) * 100}%` }} />
                </span>
                <span className={styles.val}>
                  {s.correct}/{s.total}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className={styles.mistakes}>
        <SectionLabel>{mistakeIds.length ? `${speechOnly ? "Слабые места" : "Ошибки"} · ${mistakeIds.length}` : "Ошибок нет"}</SectionLabel>
        {mistakeIds.length === 0 && <p className={styles.clean}>Все ответы верные — можно брать уровень посложнее.</p>}
        {mistakeIds.map((id) => {
          const question = bank.byId.get(id);
          if (!question) return null;
          const { topicTitle, subtopicTitle } = getTopicTitles(bank, question);
          return (
            <button key={id} type="button" className={clsx(styles.mistake, glass.glass)} onClick={() => onOpenQuestion(id)}>
              <span className={styles.mistakeMeta}>
                <LevelBadge level={question.level} />
                <span className={styles.mistakeTopic}>{formatTopicLine(topicTitle, subtopicTitle)}</span>
              </span>
              <Markdown text={question.question} inline className={styles.mistakeText} />
              <Icon name="chevronRight" className={styles.chevron} />
            </button>
          );
        })}
      </div>

      <div className={styles.buttons}>
        {mistakeIds.length > 0 && (
          <Button icon="refresh" onClick={() => onRetryMistakes(mistakeIds)}>
            {speechOnly ? "Повторить слабые" : "Прорешать ошибки"} · {mistakeIds.length}
          </Button>
        )}
        <Button variant={mistakeIds.length ? "secondary" : "primary"} onClick={onBack}>
          {backLabel}
        </Button>
        {mistakeIds.length > 0 && (
          <p className={styles.saved}>Ошибки сохранены — их можно прорешать и позже: в фильтрах «Ошибки».</p>
        )}
      </div>
    </Screen>
  );
}
