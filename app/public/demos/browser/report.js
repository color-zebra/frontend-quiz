// Отчёт по регионам за квартал: выручка, число заказов и медианный чек по каждому региону.
// Ошибка нарочно: для каждого региона и каждого дня мы заново перебираем все заказы.
const quarterOrders = makeOrders(20000, 7);
const money = new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 });
const DAY = 86400000;
const firstDay = Date.UTC(2026, 6, 1);

// Секундомер: тикает таймером раз в 50 мс. Пока основной поток занят, тики ждут в очереди.
const clock = document.getElementById("clock");
const started = performance.now();
setInterval(() => {
  clock.textContent = ((performance.now() - started) / 1000).toFixed(1);
}, 50);

function ordersFor(region, day) {
  return quarterOrders.filter((o) => o.region === region && o.date.getTime() === firstDay + day * DAY);
}

function summarize(orders) {
  const sums = orders.map((o) => o.price * o.qty).sort((a, b) => a - b);
  const revenue = sums.reduce((a, b) => a + b, 0);
  const median = sums.length ? sums[Math.floor(sums.length / 2)] : 0;
  return { revenue, count: sums.length, median };
}

function regionRow(region, days) {
  let revenue = 0;
  let count = 0;
  const medians = [];
  for (const day of days) {
    const s = summarize(day);
    revenue += s.revenue;
    count += s.count;
    if (s.count) medians.push(s.median);
  }
  medians.sort((a, b) => a - b);
  return { region, revenue, count, median: medians[Math.floor(medians.length / 2)] ?? 0 };
}

// Как было: 42 региона × 90 дней × 20 000 заказов — больше 75 миллионов проверок за один раз.
function buildReport() {
  const rows = [];
  for (const region of REGIONS) {
    const days = [];
    for (let day = 0; day < 90; day++) days.push(ordersFor(region, day));
    rows.push(regionRow(region, days));
  }
  return rows;
}

// По частям: та же работа, но каждые ~40 мс уступаем браузеру — он успевает обработать ввод и нарисовать кадр.
const yieldToMain = () =>
  globalThis.scheduler?.yield ? scheduler.yield() : new Promise((resolve) => setTimeout(resolve, 0));

async function buildReportInChunks() {
  const rows = [];
  let sliceStart = performance.now();
  for (const region of REGIONS) {
    const days = [];
    for (let day = 0; day < 90; day++) days.push(ordersFor(region, day));
    rows.push(regionRow(region, days));
    if (performance.now() - sliceStart > 40) {
      await yieldToMain();
      sliceStart = performance.now();
    }
  }
  return rows;
}

// Без лишней работы: один проход по заказам раскладывает их по региону и дню.
function buildReportGrouped() {
  const byRegion = new Map(REGIONS.map((r) => [r, Array.from({ length: 90 }, () => [])]));
  for (const o of quarterOrders) {
    const day = Math.round((o.date.getTime() - firstDay) / DAY);
    byRegion.get(o.region)[day].push(o);
  }
  return REGIONS.map((region) => regionRow(region, byRegion.get(region)));
}

function renderReport(rows) {
  rows.sort((a, b) => b.revenue - a.revenue);
  document.getElementById("report").innerHTML =
    "<thead><tr><th>Регион</th><th>Выручка</th><th>Заказов</th><th>Медианный чек</th></tr></thead><tbody>" +
    rows
      .map((r) => `<tr><td>${r.region}</td><td>${money.format(r.revenue)}</td><td>${r.count}</td><td>${money.format(r.median)}</td></tr>`)
      .join("") +
    "</tbody>";
}

document.getElementById("build").addEventListener("click", async () => {
  const mode = document.querySelector("input[name=mode]:checked").value;
  const status = document.getElementById("status");
  status.textContent = "Строим…";
  performance.mark("report-start");
  const t0 = performance.now();
  let rows;
  if (mode === "naive") rows = buildReport();
  else if (mode === "chunks") rows = await buildReportInChunks();
  else rows = buildReportGrouped();
  renderReport(rows);
  performance.measure("Отчёт по регионам", "report-start");
  status.textContent = `Готово за ${Math.round(performance.now() - t0)} мс`;
});
