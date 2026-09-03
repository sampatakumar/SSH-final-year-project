import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";

import "./styles/variables.css";
import "./styles/global.css";
import "./styles/components.css";
import "./styles/responsive.css";
import "./index.css"; 

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);