// Экраны режима обучения — одним отдельным файлом сборки: приложение подгружает его, только когда человек
// открывает уроки (React.lazy в QuizApp). Разметка уроков с таблицами тянет за собой свои библиотеки.
export { CourseScreen } from "./CourseScreen";
export { LessonQuizScreen } from "./LessonQuizScreen";
export { LessonScreen } from "./LessonScreen";
