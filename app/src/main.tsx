import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/manrope";
import "@fontsource-variable/unbounded";
import "./styles/themes.css";
import "./styles/global.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { AccessGate } from "./features/access/AccessGate";
import { listenForInstallPrompt } from "./features/pwa/install";
import { requestPersistentStorage } from "./features/pwa/persistStorage";

listenForInstallPrompt();
requestPersistentStorage();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AccessGate>
      <App />
    </AccessGate>
  </StrictMode>,
);
