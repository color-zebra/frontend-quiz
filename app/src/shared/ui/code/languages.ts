// Порядок важен: сначала глобальный Prism, потом грамматики, которых нет в комплекте prism-react-renderer.
import "./prismGlobal";
import "prismjs/components/prism-scss";
import "prismjs/components/prism-http";

import type { CodeLang } from "../../../data/types";

/** codeLang вопроса → имя грамматики Prism. null — выводить без подсветки. */
export const PRISM_LANGUAGE: Record<CodeLang, string | null> = {
  html: "markup",
  css: "css",
  scss: "scss",
  js: "javascript",
  ts: "typescript",
  jsx: "jsx",
  tsx: "tsx",
  http: "http",
  json: "json",
  text: null,
};
