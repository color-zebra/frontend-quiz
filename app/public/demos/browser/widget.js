// Виджет чата поддержки (будто бы от другой команды).
// При старте он приводит страницу в нужный ему вид.
(function chatWidget() {
  function cleanupPromos() {
    document.querySelectorAll(".promo").forEach((el) => el.remove());
  }
  setTimeout(cleanupPromos, 3000);
})();
