// Адреса репозитория приложения. Переименовал репозиторий — поправь только REPO_URL.
export const REPO_URL = "https://github.com/color-zebra/frontend-quiz";

/** Пример своего набора: подставляется кнопкой на экране наборов. */
export const SAMPLE_SET_URL = `${REPO_URL}/blob/main/examples/sample-set.yaml`;

/** Куда сообщать о неверном вопросе или ошибке в приложении. */
export const ISSUES_URL = `${REPO_URL}/issues`;

/**
 * SHA-256 пароля на вход — экран от случайных посетителей, не защита данных. Пустая строка — вход без пароля.
 * Задаётся командой `pnpm password <пароль>` из корня репозитория, руками не править.
 */
export const ACCESS_PASSWORD_HASH = "823007296c353e745112077d2ed143e727af56e1271b8f0686b0926251a34558";
