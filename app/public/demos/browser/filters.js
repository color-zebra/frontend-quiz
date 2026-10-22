// Фильтр по региону над таблицей заказов за год. Три нарочно встроенные причины медленного отклика:
// 1) раз в секунду таймер готовит подсказки — нажатие, попавшее на этот момент, ждёт (ожидание ввода);
// 2) для каждой строки обработчик считает «всего у клиента», перебирая все 40 000 заказов (обработка);
// 3) в таблицу вставляются все строки региона сразу — браузеру долго считать стили и раскладку (показ результата).
const orders = makeOrders(40000, 11);
const select = document.getElementById("region");
select.innerHTML = REGIONS.map((r) => `<option>${r}</option>`).join("");

const money = new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 });
const PAGE = 100;
let shown = PAGE;
let current = orders;

function mode() {
  return document.querySelector("input[name=mode]:checked").value;
}

// Как было: сумма покупок клиента — перебором всех заказов для каждой строки таблицы.
function customerTotal(customer) {
  return orders.filter((o) => o.customer === customer).reduce((sum, o) => sum + o.price * o.qty, 0);
}

// Исправлено: суммы по клиентам считаются один раз, за один проход.
let totalsByCustomer = null;
function customerTotalCached(customer) {
  if (!totalsByCustomer) {
    totalsByCustomer = new Map();
    for (const o of orders) totalsByCustomer.set(o.customer, (totalsByCustomer.get(o.customer) ?? 0) + o.price * o.qty);
  }
  return totalsByCustomer.get(customer);
}

function renderRows(list, limit, total) {
  const rows = list
    .slice(0, limit)
    .map((o) => orderRowHtml(o, money).replace("</tr>", `<td>${money.format(total(o.customer))}</td></tr>`));
  document.getElementById("orders").innerHTML =
    ORDERS_HEAD.replace("</tr>", "<th>Всего у клиента</th></tr>") + "<tbody>" + rows.join("") + "</tbody>";
  document.getElementById("more").hidden = list.length <= limit;
}

function applyFilter(region) {
  const list = orders.filter((o) => o.region === region).sort((a, b) => b.date - a.date);
  current = list;
  if (mode() === "slow") {
    renderRows(list, list.length, customerTotal);
  } else {
    shown = PAGE;
    renderRows(list, shown, customerTotalCached);
  }
  document.getElementById("status").textContent = `Заказов: ${list.length}`;
}

select.addEventListener("change", () => applyFilter(select.value));
document.getElementById("showMore").addEventListener("click", () => {
  shown += PAGE;
  renderRows(current, shown, customerTotalCached);
});

// Живое обновление раз в секунду: подсказки с суммами для последних 8000 заказов. Как было — каждый раз
// заново; исправлено — подсказки готовятся один раз, и обновление их не трогает.
let tooltips = null;
function refreshTooltips() {
  if (mode() === "fast" && tooltips) return;
  tooltips = orders.slice(0, 8000).map((o) => `${o.region}, ${o.customer}: ${money.format(o.price * o.qty)}`);
}
setInterval(refreshTooltips, 1000);

applyFilter(REGIONS[0]);
