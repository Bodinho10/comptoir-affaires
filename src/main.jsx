import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

if (!window.storage) {
  const cle = (k) => `comptoir:${k}`;
  window.storage = {
    async get(key) {
      const v = localStorage.getItem(cle(key));
      return v === null ? null : { key, value: v, shared: true };
    },
    async set(key, value) {
      localStorage.setItem(cle(key), value);
      return { key, value, shared: true };
    },
    async delete(key) {
      localStorage.removeItem(cle(key));
      return { key, deleted: true, shared: true };
    },
    async list(prefix = "") {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("comptoir:")) {
          const sansPrefixe = k.slice("comptoir:".length);
          if (sansPrefixe.startsWith(prefix)) keys.push(sansPrefixe);
        }
      }
      return { keys, prefix, shared: true };
    },
  };
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
