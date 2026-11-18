import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
/* self-hosted web fonts (OFL): headings and reading text, interface, large numerals, math text */
import "@fontsource-variable/noto-serif-georgian";
import "@fontsource-variable/noto-sans-georgian";
import "@fontsource-variable/noto-serif-display";
import "@fontsource-variable/stix-two-text";
import "@fontsource-variable/stix-two-text/wght-italic.css";
import App from "./App";
import { startActivityTracking } from "./features/student/activity";
import "./features/student/progress";
import { session } from "./features/student/session";
import "./features/tests/outbox";
import "./styles/index.css";

session.init();
startActivityTracking();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
