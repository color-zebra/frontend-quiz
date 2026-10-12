/**
 * Ачивки. Каждая — строка в списке: название, за что, картинка из public/achievements и правило с порогом.
 * Новую ачивку или ступень добавляют сюда — подсчёт и экраны подхватят её сами, и задним числом тоже.
 */

/** Правило: за что даётся ачивка. Считается только по тестовым вопросам основной базы. */
export type AchievementRule =
  /** Освоено не меньше share вопросов темы: отвечал, и вопрос не в ошибках. */
  | { kind: "topic"; topic: string; share: number }
  /** Всего ответов. */
  | { kind: "answers"; count: number }
  /** Доля верных среди последних window ответов — когда ответов уже не меньше window. */
  | { kind: "accuracy"; share: number; window: number }
  /** Верных ответов подряд. */
  | { kind: "streak"; count: number }
  /** Сколько раз вопрос уходил из ошибок (два верных подряд). */
  | { kind: "fixed"; count: number }
  /** Сколько раз нажато «Не знаю». */
  | { kind: "gaveUp"; count: number }
  /** Ответов ночью, с 0:00 до 5:00. */
  | { kind: "night"; count: number }
  /** Ответов в пятницу вечером, с 18:00 до полуночи. */
  | { kind: "friday"; count: number };

export type AchievementGroup = "topics" | "answers" | "accuracy" | "mistakes" | "special";

export interface Achievement {
  /** Постоянный id: по нему ачивку узнают в итоге сессии. Не менять. */
  id: string;
  title: string;
  description: string;
  /** Файл в public/achievements. */
  icon: string;
  group: AchievementGroup;
  rule: AchievementRule;
}

export const GROUP_TITLES: Record<AchievementGroup, string> = {
  topics: "Темы",
  answers: "Ответы",
  accuracy: "Точность",
  mistakes: "Работа над ошибками",
  special: "Особые",
};

const topic = (id: string, topicId: string, title: string, topicTitle: string): Achievement => ({
  id,
  title,
  description: `Освоено 80 % вопросов по ${topicTitle}`,
  icon: `${id.replace("topic-", "")}.svg`,
  group: "topics",
  rule: { kind: "topic", topic: topicId, share: 0.8 },
});

function achievement(
  id: string,
  title: string,
  description: string,
  icon: string,
  group: AchievementGroup,
  rule: AchievementRule,
): Achievement {
  return { id, title, description, icon, group, rule };
}

export const ACHIEVEMENTS: readonly Achievement[] = [
  topic("topic-html", "html", "<body>билдер", "HTML"),
  topic("topic-css", "css", "Стиляга", "CSS и SCSS"),
  topic("topic-javascript", "javascript", "Ванильный ниндзя", "JavaScript"),
  topic("topic-typescript", "typescript", "Чёткий тип", "TypeScript"),
  topic("topic-react", "react", "Хук справа", "React"),
  topic("topic-network", "network", "404: пробелы не найдены", "сетям"),
  topic("topic-nextjs", "nextjs", "Next level", "Next.js"),

  achievement("answers-10", "Hello world", "10 ответов", "hello.svg", "answers", { kind: "answers", count: 10 }),
  achievement("answers-100", "Клуб ста", "100 ответов", "hundred.svg", "answers", { kind: "answers", count: 100 }),
  achievement("answers-500", "Оно того стоило?", "500 ответов", "worth.svg", "answers", {
    kind: "answers",
    count: 500,
  }),

  achievement("accuracy-80", "Можно пушить в прод", "80 % верных из последних 100", "prod.svg", "accuracy", {
    kind: "accuracy",
    share: 0.8,
    window: 100,
  }),
  achievement("accuracy-90", "Увольняем тестировщика", "90 % верных из последних 100", "fire-tester.svg", "accuracy", {
    kind: "accuracy",
    share: 0.9,
    window: 100,
  }),
  achievement("accuracy-100", "Человек-компилятор", "Все последние 100 — верные", "compiler.svg", "accuracy", {
    kind: "accuracy",
    share: 1,
    window: 100,
  }),
  achievement("streak-10", "Снайпер", "10 верных подряд", "sniper.svg", "accuracy", { kind: "streak", count: 10 }),
  achievement("streak-25", "В потоке", "25 верных подряд", "flow.svg", "accuracy", { kind: "streak", count: 25 }),

  achievement("fixed-10", "Делал фичи, фиксил баги", "10 вопросов ушли из ошибок", "bugfix.svg", "mistakes", {
    kind: "fixed",
    count: 10,
  }),
  achievement("fixed-50", "Рефакторил легаси", "50 вопросов ушли из ошибок", "legacy.svg", "mistakes", {
    kind: "fixed",
    count: 50,
  }),

  achievement("gave-up-20", "Я знаю, что ничего не знаю", "20 раз нажал «Не знаю»", "socrates.svg", "special", {
    kind: "gaveUp",
    count: 20,
  }),
  achievement("night-10", "Ночной деплой", "10 ответов после полуночи", "night.svg", "special", {
    kind: "night",
    count: 10,
  }),
  achievement("friday-1", "Деплой в пятницу", "Ответ в пятницу вечером", "friday.svg", "special", {
    kind: "friday",
    count: 1,
  }),
];

const topicDetails = (topic: string) =>
  `Освой 80 % вопросов по ${topic}. Освоенный вопрос — тот, на который ты отвечал и который сейчас не в ошибках.`;

const ANSWERS_NOTE = "верно или нет, «Не знаю» тоже считается";
const ACCURACY_NOTE = "Считается любое окно из 100 ответов подряд — получил однажды, достижение остаётся.";
const STREAK_NOTE = "Ошибка или «Не знаю» обнуляют серию, но лучшая серия запоминается.";
const FIXED_NOTE = "вопрос уходит из ошибок, когда на него дважды подряд ответили верно.";

/** Подробное описание для шторки: за что дают и как считается. Короткое — в description, для итога сессии. */
export const ACHIEVEMENT_DETAILS: Record<string, string> = {
  "topic-html": topicDetails("HTML"),
  "topic-css": topicDetails("CSS и SCSS"),
  "topic-javascript": topicDetails("JavaScript"),
  "topic-typescript": topicDetails("TypeScript"),
  "topic-react": topicDetails("React"),
  "topic-network": topicDetails("сетям в браузере"),
  "topic-nextjs": topicDetails("Next.js"),

  "answers-10": `Ответь на 10 вопросов основной базы — ${ANSWERS_NOTE}.`,
  "answers-100": `Ответь на 100 вопросов основной базы — ${ANSWERS_NOTE}.`,
  "answers-500": `Ответь на 500 вопросов основной базы — ${ANSWERS_NOTE}.`,

  "accuracy-80": `Ответь верно хотя бы на 80 из 100 вопросов основной базы подряд. ${ACCURACY_NOTE}`,
  "accuracy-90": `Ответь верно хотя бы на 90 из 100 вопросов основной базы подряд. ${ACCURACY_NOTE}`,
  "accuracy-100": "Ответь верно на 100 вопросов основной базы подряд — ни одной ошибки и ни одного «Не знаю».",
  "streak-10": `Ответь верно на 10 вопросов подряд. ${STREAK_NOTE}`,
  "streak-25": `Ответь верно на 25 вопросов подряд. ${STREAK_NOTE}`,

  "fixed-10": `Выведи из ошибок 10 вопросов: ${FIXED_NOTE}`,
  "fixed-50": `Выведи из ошибок 50 вопросов: ${FIXED_NOTE}`,

  "gave-up-20": "Нажми «Не знаю» 20 раз — на любых вопросах основной базы.",
  "night-10": "Ответь на 10 вопросов основной базы с полуночи до пяти утра.",
  "friday-1": "Ответь хотя бы на один вопрос основной базы в пятницу после 18:00.",
};
