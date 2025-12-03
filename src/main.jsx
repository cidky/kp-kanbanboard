import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // ⬅ Tambahkan ini
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      {" "}
      {/* ⬅ Bungkus App dengan Router */}
      <App />
    </BrowserRouter>
  </StrictMode>
);
