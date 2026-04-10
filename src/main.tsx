import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { dataService } from "./app/lib/data";

dataService.initialize();

createRoot(document.getElementById("root")!).render(<App />);
