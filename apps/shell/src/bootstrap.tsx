import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "design-tokens/theme.css";
import { initializeTheme } from "design-tokens";
import { App } from "./App";
import { loadRemotes } from "./platform/load-remotes";

initializeTheme();

const container = document.getElementById("root");
if (!container) throw new Error("#root element not found");

async function bootstrap(): Promise<void> {
  try {
    await loadRemotes();
  } catch (error) {
    // Individual ProviderBoundary instances preserve the usable parts of the
    // shell if the registry or a provider is unavailable.
    console.error("Unable to register runtime remotes", { error });
  }

  createRoot(container!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();
