// Заново переносит строки в блоках `explanation: |` и `question: |`, чтобы после правок не оставалось
// рваных строк. Ширина — 110 символов вместе с отступом. Абзацы (пустые строки) сохраняются.
// Запуск: node scripts/reflow.mjs questions/network/*.yaml
import { readFileSync, writeFileSync } from "node:fs";

const WIDTH = 110;
const files = process.argv.slice(2);

function wrap(text, indent) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    if (line && indent.length + line.length + 1 + word.length > WIDTH) {
      lines.push(indent + line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(indent + line);
  return lines;
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
      out.push(...wrap(p, indent));
    });
  }
  writeFileSync(file, out.join(eol));
}
