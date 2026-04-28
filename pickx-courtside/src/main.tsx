import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register Service Worker for Web Push
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => console.log("SW registered:", reg))
      .catch((err) => console.error("SW registration failed:", err));
  });
}

createRoot(document.getElementById("root")!).render(<App />);
