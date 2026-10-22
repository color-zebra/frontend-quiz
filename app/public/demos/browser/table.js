// Таблица заказов с закреплённой колонкой «Заказ». Колонка сделана отдельной таблицей слева,
// поэтому высоту её строк приходится подгонять под строки основной таблицы — в них переносится комментарий.
const money = new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 });
const NOTES = ["", "Позвонить перед доставкой", "Подъезд со двора, код 45К, третий этаж без лифта", "Подарок, без чека",
  "Клиент просит собрать заказ к пятнице и привезти вместе со следующим, если получится"];
let seed = 1;

function rowsData() {
  seed += 1;
  return makeOrders(1500, seed).map((o, i) => ({ ...o, note: NOTES[(i * 7 + seed) % NOTES.length] }));
}

function cellsHtml(o) {
  return `<td>${o.date.toISOString().slice(0, 10)}</td><td>${o.region}</td><td>${o.status}</td><td>${o.item}</td>` +
    `<td>${o.qty}</td><td>${money.format(o.price * o.qty)}</td><td class="note">${o.note}</td>`;
}

const HEAD = "<th>Дата</th><th>Регион</th><th>Статус</th><th>Товар</th><th>Шт.</th><th>Сумма</th><th>Комментарий</th>";

function renderSplit(orders) {
  document.getElementById("holder").innerHTML =
    '<div class="split">' +
    '<table class="orders left"><thead><tr><th>Заказ</th></tr></thead><tbody>' +
    orders.map((o) => `<tr><td>${o.id}</td></tr>`).join("") +
    "</tbody></table>" +
    '<table class="orders right"><thead><tr>' + HEAD + "</tr></thead><tbody>" +
    orders.map((o) => `<tr>${cellsHtml(o)}</tr>`).join("") +
    "</tbody></table></div>";
}

// Как было: в одном цикле читаем высоту строки справа и сразу пишем высоту строки слева.
// Каждая запись делает раскладку устаревшей, и следующее чтение заставляет браузер считать её заново.
function syncRowHeights() {
  const left = document.querySelectorAll(".left tbody tr");
  const right = document.querySelectorAll(".right tbody tr");
  for (let i = 0; i < right.length; i++) {
    left[i].style.height = right[i].offsetHeight + "px";
  }
}

// Сначала чтения, потом записи: раскладка считается один раз — при первом чтении.
function syncRowHeightsBatched() {
  const left = document.querySelectorAll(".left tbody tr");
  const right = document.querySelectorAll(".right tbody tr");
  const heights = Array.from(right, (row) => row.offsetHeight);
  heights.forEach((h, i) => {
    left[i].style.height = h + "px";
  });
}

// Без скрипта: одна таблица, первая колонка закреплена через position: sticky. Подгонять нечего.
function renderSticky(orders) {
  document.getElementById("holder").innerHTML =
    '<div class="scroll"><table class="orders one"><thead><tr><th>Заказ</th>' + HEAD + "</tr></thead><tbody>" +
    orders.map((o) => `<tr><td>${o.id}</td>${cellsHtml(o)}</tr>`).join("") +
    "</tbody></table></div>";
}

function refresh() {
  const mode = document.querySelector("input[name=mode]:checked").value;
  const t0 = performance.now();
  const orders = rowsData();
  if (mode === "sticky") {
    renderSticky(orders);
  } else {
    renderSplit(orders);
    if (mode === "thrash") syncRowHeights();
    else syncRowHeightsBatched();
  }
  document.getElementById("status").textContent = `Обновлено за ${Math.round(performance.now() - t0)} мс`;
}

document.getElementById("refresh").addEventListener("click", refresh);
refresh();
