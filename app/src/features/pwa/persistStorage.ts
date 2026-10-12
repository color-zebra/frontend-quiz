/**
 * Просит браузер не стирать данные сайта (заметки и копию базы) при нехватке места.
 * Chrome решает сам, без окна с вопросом; установленному приложению обычно соглашается.
 */
export function requestPersistentStorage() {
  const storage = navigator.storage;
  if (!storage?.persist) return;
  storage
    .persisted()
    .then((persisted) => (persisted ? true : storage.persist()))
    .catch(() => undefined);
}
