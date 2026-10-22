// Что увидела бы аналитика у реального человека. Те же данные собирает библиотека web-vitals
// в сборке с атрибуцией: Event Timing даёт три части задержки, Long Animation Frames — виноватые скрипты.
const box = document.getElementById("metrics");
let lastFrames = [];

function fileName(url) {
  return url ? url.split("/").pop() : "—";
}

function show(entry) {
  const inputDelay = entry.processingStart - entry.startTime;
  const processing = entry.processingEnd - entry.processingStart;
  const presentation = entry.startTime + entry.duration - entry.processingEnd;
  const frames = lastFrames.filter((f) => f.startTime + f.duration >= entry.startTime && f.startTime <= entry.startTime + entry.duration);
  const scripts = frames
    .flatMap((f) => f.scripts)
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 3)
    .map((s) => `${s.sourceFunctionName || s.invoker} в ${fileName(s.sourceURL)} — ${Math.round(s.duration)} мс` +
      (s.forcedStyleAndLayoutDuration > 1 ? `, из них принудительная раскладка ${Math.round(s.forcedStyleAndLayoutDuration)} мс` : ""));
  box.innerHTML =
    `<dt>Последнее взаимодействие</dt><dd>${entry.name} на ${entry.target?.tagName?.toLowerCase() ?? "?"} — ${Math.round(entry.duration)} мс</dd>` +
    `<dt>Ожидание ввода</dt><dd>${Math.round(inputDelay)} мс</dd>` +
    `<dt>Обработка</dt><dd>${Math.round(processing)} мс</dd>` +
    `<dt>Показ результата</dt><dd>${Math.round(presentation)} мс</dd>` +
    `<dt>Скрипты в долгих кадрах</dt><dd>${scripts.length ? scripts.join("<br>") : "нет данных (Long Animation Frames есть только в Chrome)"}</dd>`;
  console.log("[аналитика] взаимодействие", Math.round(entry.duration), "мс", { inputDelay, processing, presentation, scripts });
}

if (PerformanceObserver.supportedEntryTypes.includes("long-animation-frame")) {
  new PerformanceObserver((list) => {
    lastFrames = lastFrames.concat(list.getEntries()).slice(-30);
  }).observe({ type: "long-animation-frame", buffered: true });
}

// Взаимодействие — это несколько событий (pointerdown, pointerup, click, change…) с общим interactionId.
// Берём самое долгое событие каждого взаимодействия и ждём чуть-чуть, чтобы пришли данные о кадрах.
let pending = null;
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (!entry.interactionId) continue;
    if (!pending || entry.interactionId !== pending.interactionId || entry.duration > pending.duration) pending = entry;
  }
  const entry = pending;
  setTimeout(() => show(entry), 100);
}).observe({ type: "event", durationThreshold: 16, buffered: true });
