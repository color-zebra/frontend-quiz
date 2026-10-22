// Экспорт таблицы заказов в CSV.
// Файл собирается в браузере и скачивается без сервера.
function toCsv(orders) {
  const lines = ["id;date;region;sum"];
  for (const o of orders) {
    lines.push([o.id, o.date.slice(0, 10), o.region, o.sum].join(";"));
  }
  return lines.join("\n");
}

document.getElementById("export").addEventListener("click", async () => {
  try {
    const orders = lastOrders.length ? lastOrders : await loadOrders("export");
    const blob = new Blob([toCsv(orders)], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "orders.csv";
    link.click();
  } catch (error) {
    // «Потом разберёмся»
  }
});
