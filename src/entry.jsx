import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// 既存Service Workerを全て登録解除 + キャッシュ完全消去 (キャッシュ問題対策)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  }).catch(() => {});
}
if (window.caches) {
  caches.keys().then((keys) => {
    keys.forEach((k) => caches.delete(k));
  }).catch(() => {});
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
