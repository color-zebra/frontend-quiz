import { useState } from "react";
import { IconButton } from "./Button";
import { Icon } from "./Icon";
import { ImageViewer } from "./ImageViewer";
import styles from "./MarkdownImage.module.css";

type ImageSource = { url: string } | { problem: string };

/**
 * Адрес картинки: полный https:// или путь относительно ссылки набора — так картинки переедут вместе с набором,
 * если папку с ним перенесут на другой сайт. У набора из файла ссылки нет, и относительный путь разрешить не от чего.
 */
function resolveImage(src: string | undefined, baseUrl: string | undefined): ImageSource {
  if (!src) return { problem: "у картинки нет адреса" };
  const absolute = /^[a-z][a-z\d+.-]*:/i.test(src);
  if (!absolute && !baseUrl) {
    return { problem: "у набора из файла картинка по относительному пути не показывается — нужна полная ссылка https://" };
  }
  try {
    const url = new URL(src, baseUrl);
    return url.protocol === "https:" ? { url: url.href } : { problem: "картинки показываются только по ссылкам https://" };
  } catch {
    return { problem: "непонятный адрес картинки" };
  }
}

interface MarkdownImageProps {
  src?: string;
  alt?: string;
  title?: string;
  /** Ссылка набора: от неё разрешается относительный путь. Нет у набора из файла. */
  baseUrl?: string;
}

/**
 * Картинка из текста урока или вопроса. Сначала грузим с crossOrigin: такой ответ Service Worker сохранит для офлайна.
 * Сайт без CORS такую картинку не отдаст — тогда вторая попытка без него: картинка покажется, но только с интернетом.
 * Загрузившуюся картинку можно открыть на весь экран: нажатием по ней или кнопкой под ней — для клавиатуры
 * и чтобы было видно, что так можно. Кнопка не в углу картинки: на схемах там тоже бывает текст. Саму картинку в кнопку не заворачиваем: внутри кнопки она перестала бы
 * быть картинкой для программ чтения с экрана.
 */
export function MarkdownImage({ src, alt, title, baseUrl }: MarkdownImageProps) {
  const [attempt, setAttempt] = useState<"cors" | "plain" | "failed">("cors");
  const [loaded, setLoaded] = useState(false);
  const [viewing, setViewing] = useState(false);
  const source = resolveImage(src, baseUrl);
  const problem = "problem" in source ? source.problem : attempt === "failed" ? "не загрузилась — нет связи или неверный адрес" : null;

  if (problem || !("url" in source)) {
    return (
      <span className={styles.imageStub} role="img" aria-label={alt || "Картинка"}>
        <Icon name="image" />
        <span>
          <span className={styles.stubAlt}>{alt ? `Картинка: ${alt}` : "Картинка без описания"}</span>
          <span className={styles.stubReason}>{problem}</span>
        </span>
      </span>
    );
  }

  const crossOrigin = attempt === "cors" ? "anonymous" : undefined;
  return (
    <span className={styles.figure}>
      <span className={styles.frame}>
        <img
          key={attempt}
          src={source.url}
          alt={alt ?? ""}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          crossOrigin={crossOrigin}
          className={loaded ? styles.zoomable : undefined}
          onLoad={() => setLoaded(true)}
          onError={() => setAttempt((prev) => (prev === "cors" ? "plain" : "failed"))}
          onClick={() => loaded && setViewing(true)}
        />
      </span>
      {(title || loaded) && (
        <span className={styles.figureFooter}>
          {title && <span className={styles.caption}>{title}</span>}
          {loaded && (
            <IconButton
              icon="fit"
              bare
              label={alt ? `Открыть на весь экран: ${alt}` : "Открыть картинку на весь экран"}
              className={styles.expand}
              onClick={() => setViewing(true)}
            />
          )}
        </span>
      )}
      <ImageViewer
        open={viewing}
        src={source.url}
        alt={alt ?? ""}
        caption={title}
        crossOrigin={crossOrigin}
        onClose={() => setViewing(false)}
      />
    </span>
  );
}
