import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/react";
import "@fontsource-variable/manrope";
import App from "./App";
import { installGlobalClientTelemetry } from "./services/client-telemetry";

installGlobalClientTelemetry();

const root = document.getElementById("root");
if (!root) throw new Error("Application root not found.");
if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
  throw new Error("VITE_CLERK_PUBLISHABLE_KEY is required.");
}

createRoot(root).render(
  <StrictMode>
    <ClerkProvider afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </StrictMode>,
);
