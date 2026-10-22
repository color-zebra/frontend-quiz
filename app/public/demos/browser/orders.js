// Загрузка заказов и кнопка «Обновить».
// Данные лежат в orders.json рядом со страницей.
let lastOrders = [];

async function loadOrders(reason) {
  const response = await fetch("orders.json?reason=" + reason);
  lastOrders = await response.json();
  document.getElementById("status").textContent = `Заказов: ${lastOrders.length}`;
  return lastOrders;
}

document.getElementById("refresh").addEventListener("click", () => {
  loadOrders("button");
  document.dispatchEvent(new CustomEvent("orders:refresh"));
});

// Подписка на обновление заказов:
// когда данные обновились, перечитать их.
document.addEventListener("orders:refresh", () => {
  setTimeout(() => loadOrders("event"), 0);
});
