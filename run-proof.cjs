const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const folder=path.join(__dirname,'upstream-slider-proof');fs.mkdirSync(folder,{recursive:true});
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const child=cp.spawn(process.env.CHROME_BIN || 'C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=5478',`--user-data-dir=${path.join(folder,'chrome-profile')}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
let socket;const pending=new Map();let sequence=0;
async function cdp(method,params={}){const id=++sequence;const promise=new Promise((resolve,reject)=>pending.set(id,{resolve,reject}));socket.send(JSON.stringify({id,method,params}));return promise;}
async function evaluate(expression){const r=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;}
async function until(check){for(let n=0;n<150;n++){try{if(await check())return;}catch{}await pause(100);}throw Error('Browser condition timed out');}
const snapshot=id=>evaluate(`(()=>{const c=document.querySelector('#${id}'),r=c.querySelector('[class$="slider-rail"]'),t=c.querySelector('[class$="slider-track"]'),h=c.querySelector('[role="slider"]');return {ratio:t.getBoundingClientRect().width/r.getBoundingClientRect().width,rail:getComputedStyle(r).backgroundColor,railImage:getComputedStyle(r).backgroundImage,track:getComputedStyle(t).backgroundColor,trackOpacity:getComputedStyle(t).opacity,thumbOpacity:getComputedStyle(h).opacity,height:r.getBoundingClientRect().height,value:Number(h.getAttribute('aria-valuenow'))}})()`);
async function key(id,key,code,windowsVirtualKeyCode){await evaluate(`document.querySelector('#${id} [role="slider"]').focus()`);await cdp('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode});await cdp('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode});await pause(250);}
async function load(query=''){await cdp('Page.navigate',{url:'http://127.0.0.1:5278/.slider-proof/index.html'+query});await until(()=>evaluate(`document.querySelectorAll('[role="slider"]').length===4`));await evaluate('document.fonts.ready.then(()=>true)');await pause(800);}
async function screenshot(name){const r=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(folder,name),Buffer.from(r.data,'base64'));}
(async()=>{const report={passed:false,base:'697aeb669f42f223d060772eb7a313eec78ebd20',checks:[]};try{
let version;await until(async()=>{version=await fetch('http://127.0.0.1:5478/json/version').then(r=>r.json());return !!version.Browser;});report.browser=version.Browser;
const targets=await fetch('http://127.0.0.1:5478/json').then(r=>r.json());socket=new WebSocket(targets.find(x=>x.type==='page').webSocketDebuggerUrl);await new Promise(r=>socket.addEventListener('open',r,{once:true}));socket.addEventListener('message',e=>{const m=JSON.parse(e.data);if(!m.id)return;const p=pending.get(m.id);pending.delete(m.id);if(m.error)p.reject(Error(JSON.stringify(m.error)));else p.resolve(m.result);});
await cdp('Page.enable');await cdp('Runtime.enable');await cdp('Emulation.setDeviceMetricsOverride',{width:920,height:620,deviceScaleFactor:1,mobile:false});
await load('?before=1');const before=await snapshot('effort');assert.ok(before.railImage.includes('linear-gradient'));assert.equal(before.track,'rgba(0, 0, 0, 0)');report.before=before;await screenshot('before-light.png');
for(const prefix of ['qwenpaw','ant']){
await load('?prefix='+prefix);const low=await snapshot('effort');assert.ok(Math.abs(low.ratio-1/3)<.01);assert.equal(low.railImage,'none');assert.notEqual(low.rail,low.track);assert.notEqual(low.track,'rgba(0, 0, 0, 0)');
if(prefix==='qwenpaw')await screenshot('after-light.png');
await key('effort','End','End',35);const high=await snapshot('effort');assert.ok(high.ratio>.99);
await key('effort','ArrowLeft','ArrowLeft',37);const medium=await snapshot('effort');assert.ok(Math.abs(medium.ratio-2/3)<.01);
await key('effort','Home','Home',36);const off=await snapshot('effort');assert.ok(off.ratio<.01);
await key('effort','ArrowRight','ArrowRight',39);const again=await snapshot('effort');assert.ok(Math.abs(again.ratio-1/3)<.01);
const rect=await evaluate(`(()=>{const r=document.querySelector('#effort [role="slider"]').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})()`);await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',...rect});await pause(250);const hover=await snapshot('effort');assert.equal(hover.rail,low.rail);assert.equal(hover.track,low.track);
const budget=await snapshot('budget');assert.ok(budget.ratio>0&&budget.ratio<1);await key('budget','End','End',35);assert.ok((await snapshot('budget')).ratio>.99);await key('budget','Home','Home',36);assert.ok((await snapshot('budget')).ratio<.01);await key('budget','ArrowRight','ArrowRight',39);assert.equal((await snapshot('budget')).value,1000);
const quiet=await snapshot('quiet');assert.equal(quiet.height,10);assert.ok(Math.abs(quiet.ratio-2/3)<.01);
const unresolved=await snapshot('unresolved');assert.equal(unresolved.trackOpacity,'0');assert.equal(unresolved.thumbOpacity,'0');
report.checks.push({prefix,low,medium,high,off,budget,quiet,unresolved,hoverColorsStable:true});
}
await load('?dark=1');const dark=await snapshot('effort');assert.notEqual(dark.rail,dark.track);assert.ok(Math.abs(dark.ratio-1/3)<.01);report.dark=dark;await screenshot('after-dark.png');report.passed=true;
}catch(e){report.error=e.stack;process.exitCode=1;}finally{fs.writeFileSync(path.join(folder,'result.json'),JSON.stringify(report,null,2),'utf8');console.log(JSON.stringify(report));if(socket)socket.close();child.kill();}})();
