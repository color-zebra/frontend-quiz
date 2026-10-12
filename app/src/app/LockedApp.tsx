import { PasswordScreen } from "../features/access/AccessGate";
import { HelpScreen } from "../screens/help/HelpScreen";
import { SetsHelpScreen } from "../screens/help/SetsHelpScreen";
import { Background } from "../shared/ui/Background";
import { useScreenStack } from "./useScreenStack";

type LockedScreen = "password" | "help" | "helpSets";

/** Прямые ссылки на инструкцию работают и без пароля: …/#help и …/#help-sets открывают её поверх экрана входа. */
function getInitialStack(): LockedScreen[] {
  if (location.hash === "#help") return ["password", "help"];
  if (location.hash === "#help-sets") return ["password", "helpSets"];
  return ["password"];
}

/**
 * Приложение до ввода пароля: экран входа и инструкция. Инструкцию можно прочитать, ещё не войдя, —
 * база вопросов при этом не скачивается.
 */
export function LockedApp({ onUnlock }: { onUnlock: () => void }) {
  const nav = useScreenStack(getInitialStack(), () => undefined);

  return (
    <>
      <Background />
      {renderScreen()}
    </>
  );

  function renderScreen() {
    switch (nav.screen) {
      case "help":
        return <HelpScreen onBack={nav.back} onOpenSetsHelp={() => nav.push("helpSets")} />;
      case "helpSets":
        return <SetsHelpScreen onBack={nav.back} />;
      case "password":
        return <PasswordScreen onUnlock={onUnlock} onOpenHelp={() => nav.push("help")} />;
    }
  }
}
