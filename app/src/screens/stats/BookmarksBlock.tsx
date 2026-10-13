import clsx from "clsx";
import { useState } from "react";
import { formatTopicLine, getTopicTitles } from "../../data/titles";
import type { QuestionBank } from "../../data/types";
import { useBookmarks } from "../../features/bookmarks/BookmarksProvider";
import { Button } from "../../shared/ui/Button";
import glass from "../../shared/ui/glass.module.css";
import { Icon } from "../../shared/ui/Icon";
import { LevelBadge } from "../../shared/ui/LevelBadge";
import { Markdown } from "../../shared/ui/Markdown";
import { Sheet } from "../../shared/ui/Sheet";
import styles from "./BookmarksBlock.module.css";

interface BookmarksBlockProps {
  bank: QuestionBank;
  onStart: (questionIds: string[]) => void;
  onOpenQuestion: (questionId: string) => void;
}

/**
 * «Вернуться позже»: вопросы базы или набора, отмеченные закладкой. Нажатие — разбор вопроса; «Прорешать
 * отмеченные» — сессия из них; «Снять все закладки» — с подтверждением. Сброс статистики закладки не трогает.
 */
export function BookmarksBlock({ bank, onStart, onOpenQuestion }: BookmarksBlockProps) {
  const { getBookmarks, clear } = useBookmarks();
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Вопрос могли удалить из базы — такую закладку не показываем.
  const questions = getBookmarks(bank.setId).flatMap((b) => bank.byId.get(b.questionId) ?? []);
  if (questions.length === 0) return null;

  return (
    <div className={styles.block}>
      <div className={styles.list}>
        {questions.map((question) => {
          const { topicTitle, subtopicTitle } = getTopicTitles(bank, question);
          return (
            <button
              key={question.id}
              type="button"
              className={clsx(styles.row, glass.glass)}
              onClick={() => onOpenQuestion(question.id)}
            >
              <span className={styles.text}>
                <span className={styles.meta}>
                  <LevelBadge level={question.level} />
                  <span className={styles.topic}>{formatTopicLine(topicTitle, subtopicTitle)}</span>
                </span>
                <Markdown text={question.question} inline className={styles.question} />
              </span>
              <Icon name="chevronRight" className={styles.chevron} />
            </button>
          );
        })}
      </div>
      <Button icon="refresh" onClick={() => onStart(questions.map((q) => q.id))}>
        Прорешать отмеченные · {questions.length}
      </Button>
      <button type="button" className={styles.clear} onClick={() => setConfirmOpen(true)}>
        Снять все закладки
      </button>

      <Sheet open={confirmOpen} title="Снять все закладки?" onClose={() => setConfirmOpen(false)}>
        <div className={styles.confirm}>
          <p>
            Закладки снимутся со всех {questions.length} вопросов{" "}
            {bank.title ? `набора «${bank.title}»` : "основной базы"}. Сами вопросы, ответы и статистика останутся.
          </p>
          <div className={styles.confirmButtons}>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Отмена
            </Button>
            <Button
              icon="trash"
              onClick={() => {
                clear(bank.setId);
                setConfirmOpen(false);
              }}
            >
              Снять
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}

