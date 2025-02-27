var y=Object.defineProperty;var h=(c,t,i)=>t in c?y(c,t,{enumerable:!0,configurable:!0,writable:!0,value:i}):c[t]=i;var a=(c,t,i)=>h(c,typeof t!="symbol"?t+"":t,i);import{S as g}from"./assets/Settings-DJ726YSO.js";import{H as d}from"./assets/HistoryStore-kHGyP3yn.js";class f{constructor(t){a(this,"settings");a(this,"deviceInfo");this.settings=t,this.deviceInfo={platform:"unknown",browserName:"Chrome",browserVersion:"unknown",userAgent:"Chrome Extension"},this.initDeviceInfo()}async initDeviceInfo(){this.deviceInfo=await this.getDeviceInfo()}async getDeviceInfo(){const t=await chrome.runtime.getPlatformInfo(),i=chrome.runtime.getManifest().version;return{platform:t.os,browserName:"Chrome",browserVersion:i,userAgent:"Chrome Extension"}}async syncHistory(t){const i=this.settings.getApiUrl(),n=await chrome.storage.sync.get(["clientId"]).then(o=>o.clientId);if(!n)throw new Error("Client ID not found");const e={history:t,deviceInfo:this.deviceInfo};console.log("Syncing history with payload:",e);const s=await fetch(`${i}/history/sync?clientId=${n}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)});if(!s.ok){const o=await s.text();throw console.error("Sync failed:",o),new Error(`Sync failed: ${o}`)}const r=await s.json();console.log("Sync successful:",r)}async getHistory(t=1,i=50){const n=this.settings.getApiUrl(),e=await chrome.storage.sync.get(["clientId"]).then(o=>o.clientId);if(!e)throw new Error("Client ID not found");const s=await fetch(`${n}/history?clientId=${e}&page=${t}&pageSize=${i}`,{headers:{"Content-Type":"application/json"}});if(!s.ok){const o=await s.text();throw console.error("Failed to get history:",o),new Error(`Failed to get history: ${o}`)}return(await s.json()).history||[]}}class w{constructor(t){a(this,"settings");a(this,"store");a(this,"syncService");a(this,"syncInterval",null);a(this,"SYNC_INTERVAL_MS",5*60*1e3);this.settings=t,this.store=new d,this.syncService=new f(t)}async init(){await this.store.init(),this.setupHistoryListener()}async getSystemInfo(){const t=navigator.platform,i=navigator.userAgent,n=i.includes("Chrome")?"Chrome":i.includes("Firefox")?"Firefox":i.includes("Safari")?"Safari":"Unknown",e=(i.match(/Chrome\/([0-9.]+)/)||["","unknown"])[1];return{deviceId:await this.getDeviceId(),platform:t,userAgent:i,browserName:n,browserVersion:e}}async getDeviceId(){const t=await chrome.storage.local.get(["deviceId"]);if(t.deviceId)return t.deviceId;const i="device_"+Math.random().toString(36).substring(2);return await chrome.storage.local.set({deviceId:i}),i}setupHistoryListener(){console.log("Setting up history listener..."),this.loadInitialHistory(),chrome.history.onVisited.addListener(async t=>{var i;if(console.log("New history entry:",t),t.url)try{const n=await chrome.history.getVisits({url:t.url}),e=n[n.length-1];if(e){const s=await this.getSystemInfo();await this.store.addEntry({visitId:`${e.visitId}`,url:t.url,title:t.title||"",visitTime:t.lastVisitTime||Date.now(),referringVisitId:((i=e.referringVisitId)==null?void 0:i.toString())||"0",transition:e.transition,...s}),console.log("History entry stored successfully")}}catch(n){console.error("Error storing history entry:",n)}})}async loadInitialHistory(){var t,i;console.log("Loading initial history...");try{const n=((t=this.settings.config)==null?void 0:t.expirationDays)||7,e=await chrome.history.search({text:"",maxResults:100,startTime:Date.now()-n*24*60*60*1e3});console.log("Found initial history items:",e.length);const s=await this.getSystemInfo();for(const r of e)if(r.url){const o=await chrome.history.getVisits({url:r.url});for(const l of o)await this.store.addEntry({visitId:`${l.visitId}`,url:r.url,title:r.title||"",visitTime:l.visitTime||Date.now(),referringVisitId:((i=l.referringVisitId)==null?void 0:i.toString())||"0",transition:l.transition,...s})}console.log("Initial history loaded successfully")}catch(n){console.error("Error loading initial history:",n)}}async startSync(){this.syncInterval||(await this.syncPendingEntries(),this.syncInterval=window.setInterval(()=>{this.syncPendingEntries().catch(t=>{console.error("Error during sync:",t)})},this.SYNC_INTERVAL_MS))}stopSync(){this.syncInterval&&(window.clearInterval(this.syncInterval),this.syncInterval=null)}async syncPendingEntries(){var s;const t=((s=this.settings.config)==null?void 0:s.expirationDays)||7,i=Date.now()-t*24*60*60*1e3,e=(await this.store.getUnsyncedEntries()).filter(r=>r.visitTime>=i);if(e.length!==0)try{const r=e.map(o=>({visitId:o.visitId,url:o.url,title:o.title,visitTime:o.visitTime,platform:o.platform,browserName:o.browserName}));await this.syncService.syncHistory(r),await Promise.all(e.map(o=>this.store.markAsSynced(o.url))),console.log("Successfully synced entries:",e.length)}catch(r){throw console.error("Error syncing history:",r),r}}async getHistory(){var e;const t=((e=this.settings.config)==null?void 0:e.expirationDays)||7,i=Date.now()-t*24*60*60*1e3;return(await this.store.getEntries()).filter(s=>s.visitTime>=i)}}class m{constructor(){a(this,"settings");a(this,"historySync");this.settings=new g,this.historySync=new w(this.settings)}async init(){await this.settings.init(),await this.historySync.init(),await this.historySync.startSync(),this.setupMessageListeners()}setupMessageListeners(){chrome.runtime.onMessage.addListener((t,i,n)=>{console.log("Received message:",t);const e=s=>{const r=s instanceof Error?s.message:"Unknown error";console.error("Error handling message:",s),n({error:r})};if(t.type==="stopSync"){try{this.historySync.stopSync(),n({success:!0})}catch(s){e(s)}return!1}return t.type==="getHistory"||t.type==="startSync"?((async()=>{try{if(t.type==="getHistory"){const r=await this.historySync.getHistory();console.log("Sending history:",r),n(r||[])}else t.type==="startSync"&&(await this.historySync.startSync(),n({success:!0}))}catch(r){e(r)}})(),!0):(console.warn("Unknown message type:",t.type),n({error:`Unknown message type: ${t.type}`}),!1)})}}console.log("Starting background service...");const u=new m;u.init().then(()=>{console.log("Background service initialized successfully")}).catch(c=>{console.error("Error initializing background service:",c)});
