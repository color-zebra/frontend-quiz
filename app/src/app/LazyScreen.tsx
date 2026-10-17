import { Component, Suspense, type ReactNode } from "react";
import { Button } from "../shared/ui/Button";
import { Screen } from "../shared/ui/Screen";
import styles from "./App.module.css";

interface LazyScreenProps {
  onBack: () => void;
  children: ReactNode;
}

/**
 * Экран из отдельного файла сборки (React.lazy). Пока файл грузится — пустой экран: обычно это мгновение, файл
 * лежит в кэше приложения. Не скачался (нет сети, а кэш ещё не успел заполниться) — объяснение вместо белого экрана.
 */
export class LazyScreen extends Component<LazyScreenProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return <Suspense fallback={<Screen>{null}</Screen>}>{this.props.children}</Suspense>;
    // Как экран ошибки загрузки базы в App: по центру, во весь экран.
    return (
      <div className={styles.status} role="alert">
        <p>Не удалось открыть экран.</p>
        <p className={styles.details}>
          Чаще всего так бывает без интернета, если эта часть приложения ещё не успела сохраниться на устройстве.
          Проверь связь и перезагрузи страницу.
        </p>
        <Button icon="refresh" onClick={() => location.reload()}>
          Перезагрузить
        </Button>
        <Button variant="secondary" icon="arrowLeft" onClick={this.props.onBack}>
          Назад
        </Button>
      </div>
    );
  }
}
