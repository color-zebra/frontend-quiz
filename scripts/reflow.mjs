// Заново переносит строки в блоках `explanation: |` и `question: |`, чтобы после правок не оставалось
// рваных строк. Ширина — 110 символов вместе с отступом. Абзацы (пустые строки) и пункты списков («- …», «1. …»)
// сохраняются: каждый пункт переносится отдельно, его продолжение — с отступом под текст пункта.
// Запуск: node scripts/reflow.mjs questions/network/*.yaml
import { readFileSync, writeFileSync } from "node:fs";

const WIDTH = 110;
const LIST_ITEM = /^([-*]|\d+\.)\s+/;
const files = process.argv.slice(2);

/** hanging — отступ строк после первой: у пункта списка продолжение стоит под его текстом, а не под «-». */
function wrap(text, indent, hanging = "") {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  const prefix = () => (lines.length ? indent + hanging : indent);
  for (const word of words) {
    if (line && prefix().length + line.length + 1 + word.length > WIDTH) {
      lines.push(prefix() + line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(prefix() + line);
  return lines;
}

/** Абзац — текст и/или пункты списка: каждый пункт начинается с маркера, остальные строки продолжают предыдущее. */
function wrapParagraph(paragraph, indent) {
  const chunks = [];
  for (const raw of paragraph.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (chunks.length === 0 || LIST_ITEM.test(line)) chunks.push(line);
    else chunks[chunks.length - 1] += ` ${line}`;
  }
  return chunks.flatMap((chunk) => {
    const marker = chunk.match(LIST_ITEM)?.[0];
    return wrap(chunk, indent, marker ? " ".repeat(marker.length) : "");
  });
}

for (const file of files) {
  const raw = readFileSync(file, "utf8");
  const eol = raw.includes("\r\n") ? "\r\n" : "\n";
  const src = raw.split(/\r?\n/);
  const out = [];
  for (let i = 0; i < src.length; i++) {
    const line = src[i];
    const m = line.match(/^(\s*)(explanation|question): \|$/);
    out.push(line);
    if (!m) continue;
    const indent = m[1] + "  ";
    const block = [];
    while (i + 1 < src.length && (src[i + 1].startsWith(indent) || src[i + 1].trim() === "")) {
      if (src[i + 1].trim() === "" && !(src[i + 2] ?? "").startsWith(indent)) break;
      block.push(src[++i]);
    }
    const paragraphs = block.join("\n").split(/\n\s*\n/);
    paragraphs.forEach((p, k) => {
      if (k > 0) out.push("");
      out.push(...wrapParagraph(p, indent));
    });
  }
  writeFileSync(file, out.join(eol));
}
