const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/SummaryService-Rvo3G3Cb.js","assets/_commonjsHelpers-BosuxZz1.js","assets/Settings-CqfeHVVq.js","assets/preload-helper-D7HrI6pR.js"])))=>i.map(i=>d[i]);
import{_ as T}from"./assets/preload-helper-D7HrI6pR.js";import{H as f}from"./assets/HistoryStore-CzLcGvyX.js";const I={apiEndpoint:"https://api.chroniclesync.xyz",pagesUrl:"https://chroniclesync.pages.dev",clientId:"extension-default"},_="https://api-staging.chroniclesync.xyz";async function v(){try{const t=await chrome.storage.sync.get(["apiEndpoint","pagesUrl","clientId","environment","customApiUrl"]);let r=I.apiEndpoint;return t.environment==="staging"?r=_:t.environment==="custom"&&t.customApiUrl&&(r=t.customApiUrl),{apiEndpoint:r,pagesUrl:t.pagesUrl||I.pagesUrl,clientId:t.clientId||I.clientId}}catch(t){return console.error("Error loading config:",t),I}}const U=5*60*1e3;async function x(){try{return await chrome.storage.local.get(["initialized"]),await v(),await chrome.storage.local.set({initialized:!0}),!0}catch(t){return console.error("Failed to initialize extension:",t),!1}}async function z(){var n;const t=navigator.platform,r=navigator.userAgent;return{deviceId:await A(),platform:t,userAgent:r,browserName:"Chrome",browserVersion:((n=/Chrome\/([0-9.]+)/.exec(r))==null?void 0:n[1])||"unknown"}}async function A(){const t=await chrome.storage.local.get(["deviceId"]);if(t.deviceId)return t.deviceId;const r="device_"+Math.random().toString(36).substring(2);return await chrome.storage.local.set({deviceId:r}),r}async function w(t=!1){var r,i;try{if(!(await chrome.storage.local.get(["initialized"])).initialized&&!await x()){console.debug("Sync skipped: Extension not initialized");return}const e=await v();if(!e.clientId||e.clientId==="extension-default")throw console.debug("Sync paused: No client ID configured"),new Error("Please configure your Client ID in the extension popup");console.debug("Starting sync with client ID:",e.clientId);const o=await z(),l=Date.now(),g=(await chrome.storage.local.get(["lastSync"])).lastSync||0,y=t?0:g,d=new f;await d.init(),await d.updateDevice(o);const p=await chrome.history.search({text:"",startTime:y,endTime:l,maxResults:1e4}),E=(await Promise.all(p.map(async s=>(await chrome.history.getVisits({url:s.url})).filter(u=>u.visitTime>=y&&u.visitTime<=l).map(u=>({url:s.url,title:s.title,visitTime:u.visitTime,visitId:u.visitId,referringVisitId:u.referringVisitId,transition:u.transition,...o}))))).flat();for(const s of E)await d.addEntry(s);const m=await d.getUnsyncedEntries();if(m.length>0){const s=await fetch(`${e.apiEndpoint}?clientId=${encodeURIComponent(e.clientId)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({history:m,deviceInfo:o,lastSync:g})});if(!s.ok)throw new Error(`HTTP error! status: ${s.status}`);const a=await s.json();if(a.history&&a.history.length>0&&await d.mergeRemoteEntries(a.history),a.devices)for(const S of a.devices)await d.updateDevice(S);for(const S of m)await d.markAsSynced(S.visitId);const h=a.lastSyncTime||l,u=new Date(h).toLocaleString();await chrome.storage.local.set({lastSync:h}),await chrome.storage.sync.set({lastSync:u});try{chrome.runtime.sendMessage({type:"syncComplete",stats:{sent:m.length,received:((r=a.history)==null?void 0:r.length)||0,devices:((i=a.devices)==null?void 0:i.length)||0}}).catch(()=>{})}catch{}}console.debug("Successfully completed sync")}catch(n){console.error("Error syncing history:",n);try{chrome.runtime.sendMessage({type:"syncError",error:n.message}).catch(()=>{})}catch{}return}}w(!0);setInterval(()=>w(!1),U);async function C(t){try{const r=await chrome.scripting.executeScript({target:{tabId:t},func:()=>({content:document.documentElement.outerHTML,title:document.title,url:window.location.href})});if(r&&r[0]&&r[0].result)return r[0].result}catch(r){console.error("Error capturing page content:",r)}return null}chrome.tabs.onUpdated.addListener(async(t,r,i)=>{var n,e;if(r.status==="complete"&&i.url&&!i.url.startsWith("chrome://")){console.debug(`Navigation completed: ${i.url}`);const o=await C(t);if(o){const l=new f;await l.init();const c=await z(),g=await chrome.history.getVisits({url:i.url}),y=g[g.length-1];if(y){const d={url:i.url,title:i.title,content:o.content,visitTime:y.visitTime,visitId:y.visitId,referringVisitId:y.referringVisitId,transition:y.transition,...c};await l.addEntry(d);const p=await v();if((n=p.summary)!=null&&n.enabled&&((e=p.summary)!=null&&e.autoSummarize)){const{SummaryService:D}=await T(async()=>{const{SummaryService:h}=await import("./assets/SummaryService-Rvo3G3Cb.js");return{SummaryService:h}},__vite__mapDeps([0,1])),{Settings:E}=await T(async()=>{const{Settings:h}=await import("./assets/Settings-CqfeHVVq.js");return{Settings:h}},__vite__mapDeps([2,3])),m=new E;await m.init();const s=new D(m);await s.init();const a=await s.processEntry(d);a.summary&&await l.updateEntry(a),s.dispose()}}}setTimeout(()=>w(!1),1e3)}});chrome.runtime.onMessage.addListener((t,r,i)=>{if(t.type==="getClientId")return chrome.storage.local.get(["initialized"]).then(async n=>{if(!n.initialized&&!await x()){i({error:"Extension not initialized"});return}try{const e=await v();i({clientId:e.clientId==="extension-default"?null:e.clientId})}catch(e){console.error("Error getting client ID:",e),i({error:"Failed to get client ID"})}}),!0;if(t.type==="triggerSync")return w(!0).then(()=>{i({success:!0,message:"Sync successful"})}).catch(n=>{console.error("Manual sync failed:",n),i({error:n.message})}),!0;if(t.type==="getHistory"){const{deviceId:n,since:e,limit:o}=t,l=new f;return l.init().then(async()=>{try{const c=await l.getEntries(n,e),g=o?c.slice(0,o):c;i(g)}catch(c){console.error("Error fetching history from IndexedDB:",c),i({error:c.message})}}).catch(c=>{console.error("Error initializing IndexedDB:",c),i({error:c.message})}),!0}else if(t.type==="getDevices"){const n=new f;return n.init().then(async()=>{try{const e=await n.getDevices();i(e)}catch(e){console.error("Error fetching devices from IndexedDB:",e),i({error:e.message})}}).catch(e=>{console.error("Error initializing IndexedDB:",e),i({error:e.message})}),!0}else if(t.type==="deleteHistory"){const{visitId:n}=t,e=new f;return e.init().then(async()=>{try{await e.deleteEntry(n),await w(!1),i({success:!0})}catch(o){console.error("Error deleting history entry:",o),i({error:o.message})}}).catch(o=>{console.error("Error initializing IndexedDB:",o),i({error:o.message})}),!0}});
