// Вкладка «Заказы» обновляет таблицу по таймеру. В «Пульсе» — раз в 30 секунд, в демо — раз в 3 секунды,
// чтобы не ждать.
const money = new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 });
const REFRESH_MS = 3000;
const holder = document.getElementById("tab");
let view = null;
let version = 0;

function mode() {
  return document.querySelector("input[name=mode]:checked").value;
}

class OrdersView {
  constructor(container) {
    this.root = document.createElement("div");
    this.root.className = "scroll";
    container.append(this.root);
    this.refreshOrders();
    this.timer = setInterval(() => this.refreshOrders(), REFRESH_MS);
  }

  // Перерисовать таблицу заказов.
  refreshOrders() {
    version += 1;
    const orders = makeOrders(6000, version);
    this.root.innerHTML =
      '<table class="orders">' + ORDERS_HEAD + "<tbody>" + orders.map((o) => orderRowHtml(o, money)).join("") + "</tbody></table>";
  }

  destroy() {
    clearInterval(this.timer);
    this.root.remove();
  }
}

function show(tab) {
  document.querySelectorAll("[role=tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === tab)));
  if (view) {
    if (mode() === "fixed") view.destroy();
    else view.root.remove();
    view = null;
  }
  holder.textContent = "";
  if (tab === "orders") view = new OrdersView(holder);
  else holder.innerHTML = "<p>Сводка за сегодня.</p>";
}

document.querySelectorAll("[role=tab]").forEach((b) => b.addEventListener("click", () => show(b.dataset.tab)));
document.getElementById("halfday").addEventListener("click", () => {
  for (let i = 0; i < 12; i++) {
    show("orders");
    show("overview");
  }
});
show("overview");
