import clsx from "clsx";
import { IconButton } from "../../shared/ui/Button";
import glass from "../../shared/ui/glass.module.css";
import { Icon } from "../../shared/ui/Icon";
import { Screen, TopBar } from "../../shared/ui/Screen";
import { ScreenTitle } from "../../shared/ui/ScreenTitle";
import styles from "./Help.module.css";
import { ShareLinkButton } from "./HelpParts";

interface HelpHubScreenProps {
  onBack: () => void;
  onOpenBasics: () => void;
  onOpenSetsHelp: () => void;
}

/** Помощь: общая инструкция и инструкция про свои наборы — двумя плитками, чтобы вторую не искать. Прямая ссылка — …/#help. */
export function HelpHubScreen({ onBack, onOpenBasics, onOpenSetsHelp }: HelpHubScreenProps) {
  return (
    <Screen>
      <TopBar>
        <IconButton icon="arrowLeft" label="Назад" onClick={onBack} />
      </TopBar>

      <ScreenTitle title="Помощь" subtitle="Выбери, о чём почитать" />

      <button type="button" className={clsx(styles.hubTile, glass.glass)} onClick={onOpenBasics}>
        <Icon name="help" />
        <span className={styles.hubTitle}>Как пользоваться</span>
        <span className={styles.hubSub}>Тренировка, ответы, заметки, установка на телефон, работа без интернета</span>
      </button>
      <button type="button" className={clsx(styles.hubTile, glass.glass)} onClick={onOpenSetsHelp}>
        <Icon name="folder" />
        <span className={styles.hubTitle}>Свои наборы вопросов</span>
        <span className={styles.hubSub}>Как сделать свой тест, добавить его в приложение и поделиться с друзьями</span>
      </button>

      <ShareLinkButton hash="#help" title="Zubrilka — помощь" />
    </Screen>
  );
}
