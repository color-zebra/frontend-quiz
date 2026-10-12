import { Prism } from "prism-react-renderer";

// Грамматики из пакета prismjs регистрируются в глобальном Prism. Подставляем экземпляр
// prism-react-renderer, чтобы они попали туда же. Этот модуль должен импортироваться первым.
(globalThis as unknown as { Prism: typeof Prism }).Prism = Prism;
