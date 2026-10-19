import React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { App, ConfigProvider } from "antd";
import SidebarSessionList from "../../src/layouts/SidebarSessionList";
import { i18nReady } from "../../src/i18n";
import "../../src/styles/tokens.css";
import "../../src/styles/layout.css";
import "../../src/styles/workspace.css";

await i18nReady;
createRoot(document.getElementById("root")!).render(
  <ConfigProvider>
    <App>
      <MemoryRouter
        initialEntries={["/chat/7b66c61c-c17c-4eaa-a03e-ef8efc860523"]}
      >
        <div
          style={{
            display: "flex",
            width: 300,
            height: 700,
            padding: 12,
            background: "var(--app-bg)",
          }}
        >
          <SidebarSessionList defaultSearchOpen hideNewTask />
        </div>
      </MemoryRouter>
    </App>
  </ConfigProvider>,
);
