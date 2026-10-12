import type { Question, QuestionBank } from "./types";

export function getTopicTitles(bank: QuestionBank, question: Question) {
  const topic = bank.topicById.get(question.topic);
  return {
    topicTitle: topic?.title ?? question.topic,
    subtopicTitle: topic?.subtopics.find((s) => s.id === question.subtopic)?.title ?? question.subtopic,
  };
}
