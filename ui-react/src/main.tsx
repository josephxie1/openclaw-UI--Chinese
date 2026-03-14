import "./styles.css";
import React from "react";
import { createRoot } from "react-dom/client";

console.log("[main] starting...");

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Root element #root not found");
}

// Lazy import App to catch module evaluation errors
import("./App.tsx")
  .then(({ App }) => {
    console.log("[main] App module loaded, rendering...");
    createRoot(rootEl).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
    console.log("[main] render() called.");
  })
  .catch((err) => {
    console.error("[main] FATAL: Failed to load App module:", err);
    rootEl.innerHTML = `<pre style="color:red;padding:20px">${err?.stack ?? err}</pre>`;
  });
