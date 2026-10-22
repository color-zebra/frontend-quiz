// Карточки «Обзора»: число «прокручивается» к новому значению, полоска под ним показывает долю от плана.
const CARDS = [
  { label: "Выручка, млн ₽", plan: 120 },
  { label: "Заказы, тыс.", plan: 60 },
  { label: "Средний чек, тыс. ₽", plan: 5 },
  { label: "Возвраты, %", plan: 10 },
];
const STEPS = 20;
const ROW = 34;

const root = document.getElementById("cards");
root.innerHTML = CARDS.map(
  (c, i) => `<div class="card"><div class="label">${c.label}</div><div class="value"><div class="strip" id="strip${i}"></div></div><div class="bar"><div id="bar${i}"></div></div></div>`,
).join("");

let values = CARDS.map((c) => Math.round(c.plan * 0.6));

function fillStrip(i, from, to) {
  const strip = document.getElementById(`strip${i}`);
  const numbers = Array.from({ length: STEPS + 1 }, (_, k) => Math.round(from + ((to - from) * k) / STEPS));
  strip.innerHTML = numbers.map((n) => `<div>${n}</div>`).join("");
  return strip;
}

// Как было: каждый кадр JavaScript меняет top у ленты цифр и width у полоски.
// Это свойства раскладки: браузер в каждом кадре пересчитывает раскладку и заново рисует карточки.
function animateWithTop(strips, bars, from, to) {
  const start = performance.now();
  const duration = 900;
  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    strips.forEach((s) => {
      s.style.top = -t * STEPS * ROW + "px";
    });
    bars.forEach((b, i) => {
      const share = (from[i] + (to[i] - from[i]) * t) / CARDS[i].plan;
      b.style.width = Math.min(100, share * 100) + "%";
    });
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// transform: анимацию описывает CSS, двигает её компоновщик. Раскладка и отрисовка в каждом кадре не нужны.
function animateWithTransform(strips, bars, from, to) {
  strips.forEach((s) => {
    s.style.transition = "none";
    s.style.transform = "translateY(0)";
  });
  bars.forEach((b, i) => {
    b.style.width = "100%";
    b.style.transition = "none";
    b.style.transform = `scaleX(${Math.min(1, from[i] / CARDS[i].plan)})`;
  });
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      strips.forEach((s) => {
        s.style.transition = "transform 0.9s ease-out";
        s.style.transform = `translateY(${-STEPS * ROW}px)`;
      });
      bars.forEach((b, i) => {
        b.style.transition = "transform 0.9s ease-out";
        b.style.transform = `scaleX(${Math.min(1, to[i] / CARDS[i].plan)})`;
      });
    }),
  );
}

document.getElementById("update").addEventListener("click", () => {
  const mode = document.querySelector("input[name=mode]:checked").value;
  const next = CARDS.map((c) => Math.round(c.plan * (0.4 + Math.random() * 0.6)));
  const strips = CARDS.map((_, i) => fillStrip(i, values[i], next[i]));
  const bars = CARDS.map((_, i) => document.getElementById(`bar${i}`));
  strips.forEach((s) => {
    s.style.top = "0px";
    s.style.transform = "";
    s.style.transition = "";
  });
  bars.forEach((b) => {
    b.style.transform = "";
    b.style.transition = "";
  });
  if (mode === "top") animateWithTop(strips, bars, values, next);
  else animateWithTransform(strips, bars, values, next);
  values = next;
});

// Нагрузка: каждые 100 мс основной поток занят на 80 мс. Анимация на JavaScript будет дёргаться,
// а анимация transform, которую ведёт компоновщик, — нет.
setInterval(() => {
  if (!document.getElementById("busy").checked) return;
  const end = performance.now() + 80;
  while (performance.now() < end) {
    // занято
  }
}, 100);
