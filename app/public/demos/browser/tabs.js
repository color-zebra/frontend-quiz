// Вкладки дашборда. Таблица заказов подгоняет колонки при изменении размера окна.
// Режим «Исправлено» переключается радиокнопкой на странице.
const money = new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 });
const holder = document.getElementById("tab");
let current = null;
let opened = 0;

class OrdersTable {
  constructor(container, orders) {
    this.table = document.createElement("table");
    this.table.className = "orders";
    this.table.innerHTML = ORDERS_HEAD + "<tbody>" + orders.map((o) => orderRowHtml(o, money)).join("") + "</tbody>";
    this.rows = Array.from(this.table.tBodies[0].rows);
    container.append(this.table);
    this.onResize = () => this.fitColumns();
    if (mode() === "fixed") {
      // Исправлено: все подписки таблицы снимаются одним abort() при уходе с вкладки.
      this.subscriptions = new AbortController();
      window.addEventListener("resize", this.onResize, { signal: this.subscriptions.signal });
    } else {
      window.addEventListener("resize", this.onResize);
    }
  }

  fitColumns() {
    this.table.style.fontSize = window.innerWidth < 700 ? "12px" : "";
  }

  destroy() {
    this.subscriptions?.abort();
    this.table.remove();
  }
}

function mode() {
  return document.querySelector("input[name=mode]:checked").value;
}

function show(tab) {
  document.querySelectorAll("[role=tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === tab)));
  if (current) {
    // Убираем прошлую вкладку.
    if (mode() === "fixed") current.destroy();
    else current.table.remove();
    current = null;
  }
  holder.textContent = "";
  if (tab === "orders") {
    opened += 1;
    current = new OrdersTable(holder, makeOrders(2000, opened));
  } else {
    holder.innerHTML = `<p>Вкладка «${tab === "overview" ? "Обзор" : "Клиенты"}».</p>`;
  }
  document.getElementById("status").textContent = `«Заказы» открывали ${opened} раз`;
}

document.querySelectorAll("[role=tab]").forEach((b) => b.addEventListener("click", () => show(b.dataset.tab)));
document.getElementById("stress").addEventListener("click", () => {
  for (let i = 0; i < 20; i++) {
    show("orders");
    show("overview");
  }
});
show("overview");
