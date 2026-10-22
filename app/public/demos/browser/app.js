// Код дашборда на странице загрузки. Как было: главную картинку — график выручки — вставляет скрипт,
// поэтому браузер узнаёт о ней только после загрузки и выполнения этого файла.
document.addEventListener("DOMContentLoaded", () => {
  const holder = document.getElementById("hero");
  if (holder && !holder.querySelector("img")) {
    const img = document.createElement("img");
    img.src = "sales.png";
    img.alt = "Выручка по дням за квартал";
    img.className = "hero";
    holder.append(img);
  }
  const canvas = document.getElementById("spark");
  const days = Array.from({ length: 30 }, (_, i) => 50 + Math.round(30 * Math.sin(i / 3) + i));
  window.Charts.line(canvas.getContext("2d"), days, { width: canvas.width, height: canvas.height, padding: 6 });
});
