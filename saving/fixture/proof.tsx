import React from "react";
import { createRoot } from "react-dom/client";
import { App, ConfigProvider } from "antd";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n, { i18nReady } from "../src/i18n";
import { SessionThinking } from "../src/features/thinking/SessionThinking";
import "../src/styles/tokens.css";
import "../src/styles/layout.css";
document.body.style.cssText="margin:0;background:#f6f6f6;font:15px Arial,sans-serif;color:#262626";
void i18nReady.then(()=>i18n.changeLanguage("en")).then(()=>{
 createRoot(document.getElementById("root")!).render(<MemoryRouter><I18nextProvider i18n={i18n}><ConfigProvider prefixCls="qwenpaw"><App><main style={{padding:30}}><h1 style={{fontSize:20}}>Thinking strength: stable feedback while saving</h1><p>Actual official SessionThinking, fixture settings only. Each save is delayed 650 ms.</p><div style={{position:"absolute",bottom:90,left:160}}><SessionThinking agentId="fixture-agent" sessionId="fixture-session" chatId="fixture-chat"/></div></main></App></ConfigProvider></I18nextProvider></MemoryRouter>);
});
