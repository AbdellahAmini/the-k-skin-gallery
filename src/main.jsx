import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App.jsx";
import { StoreProvider } from "./state/StoreContext.jsx";
import "./styles.css";
import "./rebuild.css";
import "./header.css";
import "./navigation.css";

const dataElement = document.getElementById("gallery-initial-data");
let initialData = null;
try { initialData = dataElement ? JSON.parse(dataElement.textContent) : null; } catch { initialData = null; }

const root = document.getElementById("root");
const app = <React.StrictMode>
  <BrowserRouter><StoreProvider initialData={initialData}><App /></StoreProvider></BrowserRouter>
</React.StrictMode>;

if (initialData && root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);
