import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { ConfigProvider, theme } from "antd";
import i18next from "i18next";
import { I18nextProvider } from "react-i18next";
import { ThinkingControl } from "../src/features/thinking/ThinkingControl";
import { ThinkingControl as Before } from "./Before";
import type { ThinkingControlSpec, ThinkingPreference } from "../src/features/thinking/types";
import "../src/styles/tokens.css";
const params = new URLSearchParams(location.search);
const dark = params.has("dark");
document.documentElement.classList.toggle("dark-mode", dark);
document.body.style.cssText = `margin:0;padding:30px;background:${dark ? "#181818" : "#f6f6f6"};color:${dark ? "#ededed" : "#262626"};font:15px Arial,sans-serif;`;
const i18n = i18next.createInstance();
void i18n.init({ lng:"en", resources:{en:{translation:{thinkingControl:{low:"Low",medium:"Medium",high:"High",off:"Off",default:"Default",light:"Low",balanced:"Medium",deep:"High",intensive:"Maximum",title:"Reasoning strength",budget:"Thinking budget",reset:"Reset thinking"}}}} });
const Control = params.has("before") ? Before : ThinkingControl;
function Card({id,title,control,initial,tone}:{id:string;title:string;control:ThinkingControlSpec;initial:ThinkingPreference;tone?:"default"|"quiet"}) {
  const [value,setValue]=useState(initial);
  return <div id={id} style={{padding:16,borderRadius:16,background:dark?"#252525":"white",boxShadow:"0 1px 5px #0001"}}><h2 style={{fontSize:14,margin:"0 0 10px"}}>{title}</h2><Control control={control} value={value} onChange={setValue} modelLabel="Example reasoning model" tone={tone}/></div>;
}
const effort:ThinkingControlSpec={kind:"effort",efforts:["low","medium","high"],supports_off:true};
createRoot(document.getElementById("root")!).render(<I18nextProvider i18n={i18n}><ConfigProvider prefixCls={params.get("prefix") || "qwenpaw"} theme={{algorithm:dark?theme.darkAlgorithm:theme.defaultAlgorithm,token:{colorPrimary:"#ff7f16"}}}><main style={{maxWidth:840,margin:"auto"}}><h1 style={{fontSize:20,margin:"0 0 8px"}}>Reasoning strength: selected vs unselected</h1><p style={{margin:"0 0 22px",opacity:.65}}>Official ThinkingControl rendered with fixture values. No backend or user data.</p><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}><Card id="effort" title="Discrete effort" control={effort} initial={{level:"low"}}/><Card id="budget" title="Numeric budget with off" control={{kind:"budget",efforts:[],supports_off:true,budget_min:1000,budget_max:10000}} initial={{level:"budget",budget_tokens:4000}}/><Card id="quiet" title="Compact settings control" control={effort} initial={{level:"medium"}} tone="quiet"/><Card id="unresolved" title="Unresolved default" control={effort} initial={{level:"inherit"}}/></div></main></ConfigProvider></I18nextProvider>);
