// Каталог готовых наборов: модуль собирает плагин setsCatalog в vite.config.ts из custom-sets/catalog.yaml.
declare module "virtual:sets-catalog" {
  const items: {
    /** Ссылка на набор — такая же, как в поле «Добавить набор». */
    url: string;
    title: string;
    description: string;
    /** Вопросов в наборе: тестовых или устных. Неизвестно, если файл набора лежит не в custom-sets/. */
    count?: number;
    /** Устный набор. */
    speech: boolean;
    /** Уровни вопросов, от junior к senior. Пусто, если файл набора лежит не в custom-sets/. */
    levels: ("junior" | "middle" | "senior")[];
  }[];
  export default items;
}
