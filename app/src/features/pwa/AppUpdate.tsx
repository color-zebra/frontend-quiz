import { createContext, use, type ReactNode } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { IconButton, Button } from "../../shared/ui/Button";
import styles from "./AppUpdate.module.css";

/** Как часто проверять новую версию, если приложение долго открыто. Браузер проверяет и сам при каждом запуске. */
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

interface AppUpdateValue {
  /** Вышла новая версия, и человек её ещё не отложил. */
  ready: boolean;
  /** «Обновить»: включить новую версию — страница перезагрузится. */
  apply: () => void;
  /** «Позже»: спрятать строку до следующего запуска. */
  dismiss: () => void;
}

const AppUpdateContext = createContext<AppUpdateValue>({ ready: false, apply: () => undefined, dismiss: () => undefined });

/**
 * Регистрирует Service Worker и знает, вышла ли новая версия. Новая версия включается только по кнопке, чтобы
 * не оборвать сессию. О том, что приложение готово работать без сети, не сообщаем: это и так сказано новичку
 * в подсказке, а плашка поверх экрана мешала.
 */
export function AppUpdateProvider({ children }: { children: ReactNode }) {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (registration) setInterval(() => registration.update().catch(() => undefined), UPDATE_CHECK_INTERVAL_MS);
    },
  });
  return (
    <AppUpdateContext
      value={{ ready: needRefresh, apply: () => void updateServiceWorker(), dismiss: () => setNeedRefresh(false) }}
    >
      {children}
    </AppUpdateContext>
  );
}

/**
 * «Вышла новая версия» — строкой под переключателем разделов на трёх главных экранах, а не плашкой поверх экрана:
 * в уроке и вопросе она не появляется и ничего не закрывает.
 */
export function UpdateBanner() {
  const { ready, apply, dismiss } = use(AppUpdateContext);
  if (!ready) return null;
  return (
    <div className={styles.banner} role="status">
      <span className={styles.text}>Вышла новая версия</span>
      <Button className={styles.action} onClick={apply}>
        Обновить
      </Button>
      <IconButton icon="close" label="Позже" bare onClick={dismiss} />
    </div>
  );
}
