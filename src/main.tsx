import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log = () => {};
console.error = () => {};
console.warn = () => {};
console.info = () => {};
console.debug = () => {};

createRoot(document.getElementById("root")!).render(<App />);
