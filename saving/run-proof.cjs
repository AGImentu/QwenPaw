const {app,BrowserWindow,session}=require('electron');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const repo=process.env.QWENPAW_REPO || process.cwd();
const existing={id:'fixture-chat'};
app.setPath('userData',path.join(__dirname,'thinking-complete-profile'));app.on('window-all-closed',()=>{});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
app.whenReady().then(async()=>{
 let win;const writes=[],reads=[],errors=[],thinkingWrites=[];let model='model-a',depth={level:'low'},decision={enabled:false,configured:true,override:null},activeWrites=0,maxActiveWrites=0;
 const watchdog=setTimeout(()=>{console.error('Model selector verification timeout');app.exit(1)},60000);
 try{
  session.defaultSession.protocol.interceptBufferProtocol('http',(req,done)=>{
   const url=new URL(req.url),headers=req.headers||{},agent=Object.entries(headers).find(([k])=>k.toLowerCase()==='x-agent-id')?.[1];
   const reply=(body,statusCode=200)=>done({statusCode,mimeType:'application/json',data:Buffer.from(JSON.stringify(body))});
   if(url.pathname===`/api/chats/${existing.id}/thinking`){
    reads.push(agent);if(agent!=='fixture-agent')return reply({detail:'Chat not found'},404);
    if(req.method==='PUT') { depth=JSON.parse(Buffer.concat((req.uploadData||[]).map(x=>x.bytes)).toString());thinkingWrites.push({agent,...depth}); }
    const response={provider_id:'fixture-provider',model,model_name:'Model A',model_source:'global',model_key:`fixture-provider:${model}`,value:depth,decision,effective:depth.level==='inherit'?{level:'low'}:depth,control:{kind:'effort',efforts:['low','medium','high'],supports_off:true},source:'model',reason:null};
    if(req.method==='PUT'){activeWrites++;maxActiveWrites=Math.max(maxActiveWrites,activeWrites);setTimeout(()=>{activeWrites--;reply(response)},650);return;}
    return reply(response);
   }
   if(url.pathname===`/api/chats/${existing.id}/decision-settings`&&req.method==='PUT'){
    const enabled=JSON.parse(Buffer.concat((req.uploadData||[]).map(x=>x.bytes)).toString());decision={enabled,configured:true,override:enabled};setTimeout(()=>reply(decision),350);return;
   }
   if(url.pathname===`/api/chats/${existing.id}/model`&&req.method==='PUT'){
    const input=JSON.parse(Buffer.concat((req.uploadData||[]).map(x=>x.bytes)).toString());writes.push({agent,model:input.model});
    if(agent!=='fixture-agent')return reply({detail:'Chat not found'},404);model=input.model;
    return reply({provider_id:'fixture-provider',model,value:{level:'inherit'},effective:{level:'off'},control:{kind:'unsupported',efforts:[],supports_off:false},source:'model',reason:null});
   }
   if(url.pathname==='/api/models')return reply([{id:'fixture-provider',name:'Fixture provider',is_custom:true,require_api_key:false,base_url:'https://example.test/v1',models:[{id:'model-a',name:'Model A'},{id:'model-b',name:'Model B'}],extra_models:[]}]);
   if(url.pathname==='/api/worklist-embed/actions/stream')return done({mimeType:'text/event-stream',data:Buffer.from('\n')});
   const proxy=http.request(req.url,{method:req.method,headers},res=>{
    const parts=[];res.on('data',x=>parts.push(x));res.on('end',()=>done({statusCode:res.statusCode,headers:res.headers,data:Buffer.concat(parts)}));
   });proxy.on('error',error=>done({statusCode:502,data:Buffer.from(error.message)}));
   for(const part of req.uploadData||[])if(part.bytes)proxy.write(part.bytes);proxy.end();
  });
  win=new BrowserWindow({show:false,width:1500,height:1000,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true,offscreen:true,backgroundThrottling:false}});
  win.webContents.on('console-message',(_event,level,text)=>{if(level>=3)errors.push(text)});
  const ui=script=>win.webContents.executeJavaScript(script,true);
  const until=async check=>{for(let n=0;n<160;n++){if(await check())return;await pause(100)}throw Error('UI condition timed out')};
  await win.loadURL('http://127.0.0.1:5279/.thinking-save-proof/index.html');
  await ui(`window.stabilityExceptions=[];window.addEventListener('error',event=>window.stabilityExceptions.push(event.message));window.addEventListener('unhandledrejection',event=>window.stabilityExceptions.push(String(event.reason)));`);
  await until(()=>ui(`!![...document.querySelectorAll('button')].find(n=>n.textContent.includes('Model A'))`));
  await pause(600);
  await ui(`[...document.querySelectorAll('button')].find(n=>n.textContent.includes('Model A')).click()`);
  await until(()=>ui(`!!document.querySelector('[role="dialog"] [role="slider"]:not([aria-disabled="true"])')`));
  await pause(700);
  const labels=JSON.parse(fs.readFileSync(path.join(repo,'console/src/locales/en.json'),'utf8')).thinkingControl;
  await ui(`window.stabilityFrames=[];window.stabilityWanted=null;window.stabilityTimer=setInterval(()=>{const panel=document.querySelector('[role="dialog"]');if(!panel||window.stabilityWanted===null)return;const slider=panel.querySelector('[role="slider"]'),rail=panel.querySelector('[class$="slider-rail"]'),track=panel.querySelector('[class$="slider-track"]'),title=panel.querySelector('section strong'),rect=panel.getBoundingClientRect(),r=rail.getBoundingClientRect();window.stabilityFrames.push({wanted:window.stabilityWanted,value:Number(slider.getAttribute('aria-valuenow')),label:title.textContent,blur:!!panel.querySelector('[class*="spin-blur"]'),disabled:slider.getAttribute('aria-disabled')==='true',ratio:track.getBoundingClientRect().width/r.width,x:rect.x,y:rect.y,width:rect.width,height:rect.height,titleY:title.getBoundingClientRect().y,railY:r.y,trackColor:getComputedStyle(track).backgroundColor});},16);`);
  const sample=async(wanted,ms)=>{await ui(`window.stabilityWanted=${wanted}`);await pause(ms);await ui('window.stabilityWanted=null');};
  const point=async ratio=>ui(`(()=>{const r=document.querySelector('[role="dialog"] [class$="slider-rail"]').getBoundingClientRect();return{x:Math.round(r.x+Math.min(r.width-1,Math.max(1,r.width*${ratio}))),y:Math.round(r.y+r.height/2)}})()`);
  const move=async ratio=>win.webContents.sendInputEvent({type:'mouseMove',...await point(ratio)});
  const click=async ratio=>{
    const where=await point(ratio);win.webContents.sendInputEvent({type:'mouseMove',...where});
    win.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...where});win.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...where});await pause(30);
  };
  await sample(1,120);
  await click(1);await sample(3,100);
  await click(2/3);await sample(2,100);
  await click(0);await sample(0,100);
  await click(1/3);await sample(1,2800);
  assert.deepEqual(thinkingWrites.map(x=>x.level),['high','medium','off','low']);
  await click(1);await sample(3,100);
  const start=await point(1);win.webContents.sendInputEvent({type:'mouseDown',button:'left',clickCount:1,...start});
  await move(0);await pause(30);await sample(0,900);
  win.webContents.sendInputEvent({type:'mouseUp',button:'left',clickCount:1,...await point(0)});await pause(30);await sample(0,900);
  const frames=await ui('clearInterval(window.stabilityTimer);window.stabilityFrames');
  assert.ok(frames.length>100);
  const first=frames[0],levels=['off','low','medium','high'];
  for(const frame of frames){assert.equal(frame.value,frame.wanted);assert.equal(frame.label,labels[levels[frame.wanted]]);assert.equal(frame.blur,false);assert.equal(frame.disabled,false);assert.ok(Math.abs(frame.ratio-frame.wanted/3)<.01);for(const key of ['x','y','width','height','titleY','railY'])assert.ok(Math.abs(frame[key]-first[key])<.5,`Layout shifted: ${key}`);assert.equal(frame.trackColor,first.trackColor);}
  assert.equal(maxActiveWrites,1);assert.equal(activeWrites,0);assert.equal(depth.level,'off');assert.equal(writes.length,0);assert.deepEqual(await ui('window.stabilityExceptions'),[]);
  const locale=JSON.parse(fs.readFileSync(path.join(repo,'console/src/locales/en.json'),'utf8'));
  await ui(`[...document.querySelector('[role="dialog"]').querySelectorAll('[role="button"]')].find(n=>n.textContent.includes(${JSON.stringify(locale.chat.sessionSettings.advanced)})).click()`);
  await until(()=>ui(`!!document.querySelector('[role="dialog"] [role="switch"]')`));
  await ui(`document.querySelector('[role="dialog"] [role="switch"]').click()`);
  assert.equal(await ui(`document.querySelector('[role="dialog"] [role="switch"]').disabled`),true);
  await until(()=>ui(`!document.querySelector('[role="dialog"] [role="switch"]').disabled`));
  assert.equal(await ui(`document.querySelector('[role="dialog"] [role="switch"]').getAttribute('aria-checked')`),'true');
  assert.equal(depth.level,'off');
  fs.writeFileSync(path.join(__dirname,'thinking-complete-stable.png'),(await win.webContents.capturePage()).toPNG());

  const result={passed:true,officialSource:true,advancedDecisionPreserved:true,runtimeExceptions:await ui('window.stabilityExceptions'),developmentDiagnostics:errors,checkedFrames:frames.length,slowSaveMs:650,mouseClicksAndDrag:true,noLabelRollback:true,noWholePanelDimming:true,noLayoutMovement:true,orderedWrites:thinkingWrites.map(x=>x.level),maxActiveWrites,finalLevel:depth.level,chromium:process.versions.chrome,noModelSwitchRequests:true,productionSettingsUnchanged:true};
  fs.writeFileSync(path.join(__dirname,'thinking-complete-stability-result.json'),JSON.stringify(result,null,2),'utf8');console.log(JSON.stringify(result));
 }catch(error){console.error(error.stack,JSON.stringify(errors));process.exitCode=1;}
 finally{clearTimeout(watchdog);if(win&&!win.isDestroyed())win.destroy();app.exit(process.exitCode||0);}
});
