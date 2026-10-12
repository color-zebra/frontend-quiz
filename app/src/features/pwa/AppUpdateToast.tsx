import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "../../shared/ui/Button";
import { Icon } from "../../shared/ui/Icon";
import styles from "./AppUpdateToast.module.css";

/** Как часто проверять новую версию, если приложение долго открыто. Браузер проверяет и сам при каждом запуске. */
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;
const OFFLINE_READY_HIDE_MS = 5000;

/**
 * Регистрирует Service Worker и сообщает о двух событиях: приложение готово работать без сети
 * и вышла новая версия. Новая версия включается только по кнопке, чтобы не оборвать сессию.
 */
export function AppUpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (registration) setInterval(() => registration.update().catch(() => undefined), UPDATE_CHECK_INTERVAL_MS);
    },
  });

  useEffect(() => {
    if (!offlineReady) return;
    const timer = setTimeout(() => setOfflineReady(false), OFFLINE_READY_HIDE_MS);
    return () => clearTimeout(timer);
  }, [offlineReady, setOfflineReady]);

  if (needRefresh) {
    return (
      <div className={styles.toast} role="status">
        <span className={styles.text}>Вышла новая версия приложения</span>
        <Button className={styles.action} onClick={() => updateServiceWorker()}>
          Перезапустить
        </Button>
        <button type="button" className={styles.close} aria-label="Позже" onClick={() => setNeedRefresh(false)}>
          <Icon name="close" />
        </button>
      </div>
    );
  }

  if (offlineReady) {
    return (
      <div className={styles.toast} role="status">
        <span className={styles.text}>Приложение готово работать без интернета</span>
        <button type="button" className={styles.close} aria-label="Скрыть" onClick={() => setOfflineReady(false)}>
          <Icon name="close" />
        </button>
      </div>
    );
  }

  return null;
}
