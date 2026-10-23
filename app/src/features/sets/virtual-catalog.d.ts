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
    /** Оглавление — названия уроков по порядку; пусто у набора без уроков и у набора не из custom-sets/. */
    lessons: { id: string; title: string; computer?: true; audio?: true }[];
    /** Значки курса от автора: audio — «Озвучен», computer — «Практика за компьютером». */
    features: ("audio" | "computer")[];
    /** Размер файла набора в байтах — сколько скачается (без картинок и аудио). */
    bytes?: number;
    /** Серия, в которую входит курс, — по порядку каталога. */
    series?: string;
    /** Дополнительный набор к курсу (устная тренировка): ссылка на курс из каталога. */
    course?: string;
  }[];
  export default items;
}
