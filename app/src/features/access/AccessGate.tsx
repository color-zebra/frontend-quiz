import { useState, type FormEvent, type ReactNode } from "react";
import { ACCESS_PASSWORD_HASH } from "../../config";
import { readStorage, writeStorage } from "../../shared/lib/storage";
import { Background } from "../../shared/ui/Background";
import { Brand } from "../../shared/ui/Brand";
import { Button } from "../../shared/ui/Button";
import glass from "../../shared/ui/glass.module.css";
import styles from "./AccessGate.module.css";

// На устройстве храним отпечаток введённого пароля: сменили пароль — все снова увидят экран входа.
const STORAGE_KEY = "fq.access";

async function sha256(text: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getIsUnlocked() {
  // В режиме разработки пароль не спрашиваем, чтобы не мешал.
  return import.meta.env.DEV || !ACCESS_PASSWORD_HASH || readStorage(STORAGE_KEY) === ACCESS_PASSWORD_HASH;
}

/**
 * Экран пароля перед приложением — от случайных посетителей по ссылке. Проверка в браузере,
 * поэтому от того, кто полезет в код, это не защищает; данные и так открыты.
 */
export function AccessGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(getIsUnlocked);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!password.trim() || checking) return;
    setChecking(true);
    // Пробелы по краям — частая опечатка с телефонной клавиатуры; команда pnpm password их тоже отрезает.
    const hash = await sha256(password.trim());
    setChecking(false);
    if (hash !== ACCESS_PASSWORD_HASH) {
      setError(true);
      return;
    }
    writeStorage(STORAGE_KEY, hash);
    setUnlocked(true);
  }

  if (unlocked) return children;

  return (
    <>
      <Background />
      <main className={styles.screen}>
        <form className={`${styles.card} ${glass.glass}`} onSubmit={submit}>
          <Brand />
          <p className={styles.text}>
            Тренажёр вопросов с вариантами ответов. Вход по паролю — спроси его у того, кто дал ссылку.
          </p>
          <input
            className={styles.input}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            placeholder="Пароль"
            aria-label="Пароль"
            aria-invalid={error}
            autoFocus
          />
          {error && (
            <p className={styles.error} role="alert">
              Неверный пароль
            </p>
          )}
          <Button type="submit" disabled={!password.trim() || checking}>
            Войти
          </Button>
          <p className={styles.note}>Пароль спрашивается один раз на этом устройстве.</p>
        </form>
      </main>
    </>
  );
}
