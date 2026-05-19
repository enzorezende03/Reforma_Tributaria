import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { consumeSsoToken } from "@/lib/sso-receiver";

consumeSsoToken().finally(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
