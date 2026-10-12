/** «12 октября»; год добавляется, только если он не текущий. */
export function formatShortDate(value: string | number | undefined) {
  if (value === undefined) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return new Intl.DateTimeFormat("ru", { day: "numeric", month: "long", year: sameYear ? undefined : "numeric" }).format(date);
}
