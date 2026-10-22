// Данные дашборда «Пульс»: заказы сети магазинов. Генерируются одинаково при каждой загрузке,
// чтобы профили «до» и «после» можно было сравнивать.
const REGIONS = [
  "Москва", "Санкт-Петербург", "Новосибирск", "Екатеринбург", "Казань", "Нижний Новгород", "Челябинск",
  "Самара", "Омск", "Ростов-на-Дону", "Уфа", "Красноярск", "Воронеж", "Пермь", "Волгоград", "Краснодар",
  "Саратов", "Тюмень", "Тольятти", "Ижевск", "Барнаул", "Ульяновск", "Иркутск", "Хабаровск", "Ярославль",
  "Владивосток", "Махачкала", "Томск", "Оренбург", "Кемерово", "Новокузнецк", "Рязань", "Астрахань",
  "Набережные Челны", "Пенза", "Киров", "Липецк", "Чебоксары", "Тула", "Калининград", "Курск", "Сочи",
];
const STATUSES = ["Новый", "Собирается", "В пути", "Доставлен", "Возврат"];
const GOODS = ["Плед", "Кастрюля", "Лампа", "Ковёр", "Стул", "Полка", "Чайник", "Шторы", "Подушка", "Зеркало"];

function seeded(seed) {
  return function next() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeOrders(count = 2000, seed = 42) {
  const random = seeded(seed);
  const start = Date.UTC(2026, 6, 1);
  const orders = [];
  for (let i = 0; i < count; i++) {
    orders.push({
      id: 100000 + i,
      date: new Date(start + Math.floor(random() * 90) * 86400000),
      region: REGIONS[Math.floor(random() * REGIONS.length)],
      status: STATUSES[Math.floor(random() * STATUSES.length)],
      item: GOODS[Math.floor(random() * GOODS.length)],
      qty: 1 + Math.floor(random() * 5),
      price: 500 + Math.floor(random() * 20000),
      customer: "Клиент " + (1 + Math.floor(random() * 900)),
    });
  }
  return orders;
}

function orderRowHtml(order, money) {
  return (
    "<tr>" +
    `<td>${order.id}</td>` +
    `<td>${order.date.toISOString().slice(0, 10)}</td>` +
    `<td>${order.region}</td>` +
    `<td>${order.status}</td>` +
    `<td>${order.item}</td>` +
    `<td>${order.qty}</td>` +
    `<td>${money.format(order.price)}</td>` +
    `<td>${money.format(order.price * order.qty)}</td>` +
    `<td>${order.customer}</td>` +
    "</tr>"
  );
}

const ORDERS_HEAD =
  "<thead><tr><th>Заказ</th><th>Дата</th><th>Регион</th><th>Статус</th><th>Товар</th><th>Шт.</th>" +
  "<th>Цена</th><th>Сумма</th><th>Клиент</th></tr></thead>";
