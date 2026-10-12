import { REPO_FILES_URL } from "../../config";
import { getIsSpeech } from "../../data/answers";
import { BUILTIN_SET_ID, type Question, type QuestionBank } from "../../data/types";
import { IconButton } from "../../shared/ui/Button";
import { Sheet } from "../../shared/ui/Sheet";
import { useSets } from "../sets/SetsProvider";
import { toPageUrl } from "../sets/setUrl";
import styles from "./ComplaintSheet.module.css";

interface ComplaintSheetProps {
  bank: QuestionBank;
  question: Question | null;
  onClose: () => void;
}

/** Кнопка «Не согласен с вопросом» — красная рожица. */
export function ComplaintButton({ bare = false, onClick }: { bare?: boolean; onClick: () => void }) {
  return <IconButton icon="angry" label="Не согласен с вопросом" danger bare={bare} onClick={onClick} />;
}

/** Панель «Не согласен с вопросом»: подсказывает, куда нести правку. Открыта, пока question не null. */
export function ComplaintSheet({ bank, question, onClose }: ComplaintSheetProps) {
  return (
    <Sheet open={!!question} title="Не согласен?" onClose={onClose}>
      {question && <Complaint bank={bank} question={question} />}
    </Sheet>
  );
}

function Complaint({ bank, question }: { bank: QuestionBank; question: Question }) {
  const { sets } = useSets();
  if (bank.setId === BUILTIN_SET_ID) return <BuiltinComplaint question={question} />;
  // У набора из файла с устройства ссылки нет — его составлял сам человек.
  const url = sets.find((s) => s.id === bank.setId)?.url;
  if (url) return <LinkedSetComplaint url={toPageUrl(url)} />;
  return <p className={styles.text}>Так ты сам вопросы составлял, я-то при чём? 🙂</p>;
}

function BuiltinComplaint({ question }: { question: Question }) {
  return (
    <div className={styles.body}>
      <p className={styles.text}>
        Не согласен с формулировкой, ответом или подсказкой? Буду рад{" "}
        <a href={getQuestionFileUrl(question)} target="_blank" rel="noreferrer">
          пулл реквесту
        </a>
        !
      </p>
      <p className={styles.hint}>
        Ссылка откроет на GitHub файл с этим вопросом, его строка будет подсвечена. Карандаш справа вверху — правка: GitHub сам
        сделает твою копию репозитория и предложит открыть пулл реквест.
      </p>
    </div>
  );
}

function LinkedSetComplaint({ url }: { url: string }) {
  return (
    <p className={styles.text}>
      Я тут просто почтальон 📮 Вопросы сочинял автор набора — все претензии к нему.{" "}
      <a href={url} target="_blank" rel="noreferrer">
        Вот его файл
      </a>
      .
    </p>
  );
}

/** Страница файла основной базы с этим вопросом; строка вопроса подсвечена, если она известна. */
function getQuestionFileUrl(question: Question) {
  const folder = getIsSpeech(question) ? "speech" : "questions";
  const anchor = question.line ? `#L${question.line}` : "";
  return `${REPO_FILES_URL}/${folder}/${question.topic}/${question.subtopic}.yaml${anchor}`;
}
