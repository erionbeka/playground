import { createRoot } from "react-dom/client";
import App from "./App";
import { initVault } from "./lib/secureVault";
import "./index.css";

async function boot() {
  await initVault();
  createRoot(document.getElementById("root")!).render(<App />);
}

void boot();
