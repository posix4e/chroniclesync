function h(){const t=u(),n=f(t);return{content:t,summary:n}}function u(){var r,l;const t=["article",'[role="main"]',"main",".main-content","#content",".content",".post-content",".article-content"];let n="";for(const a of t){const o=document.querySelectorAll(a);if(o.length>0){let e=o[0],s=((r=e.textContent)==null?void 0:r.length)||0;for(let c=1;c<o.length;c++){const i=((l=o[c].textContent)==null?void 0:l.length)||0;i>s&&(s=i,e=o[c])}if(n=e.textContent||"",n.length>200)break}}if(n.length<200){const a=document.querySelectorAll("p"),o=[];a.forEach(e=>{var c;const s=((c=e.textContent)==null?void 0:c.trim())||"";s.length>20&&o.push(s)}),n=o.join(`

`)}return n.length<200&&(n=document.body.textContent||""),m(n)}function m(t){return t.replace(/\\s+/g," ").replace(/\\n+/g,`
`).trim()}function f(t){if(!t||t.length<100)return t;const n=t.replace(/([.!?])\\s*(?=[A-Z])/g,"$1|").split("|").filter(e=>e.trim().length>10);if(n.length<=3)return n.join(" ");const r={};return(t.toLowerCase().match(/\\b\\w{3,}\\b/g)||[]).forEach(e=>{r[e]=(r[e]||0)+1}),n.map(e=>{const s=e.toLowerCase().match(/\\b\\w{3,}\\b/g)||[];let c=0;return s.forEach(i=>{r[i]&&(c+=r[i])}),{sentence:e,score:c/Math.max(1,s.length)}}).sort((e,s)=>s.score-e.score).slice(0,3).map(e=>e.sentence).join(" ")}function p(){try{const t=h();browser.runtime.sendMessage({type:"pageContentExtracted",data:{url:window.location.href,title:document.title,content:t.content,summary:t.summary,timestamp:Date.now()}})}catch(t){console.error("Error extracting page content:",t)}}window.addEventListener("load",()=>{setTimeout(p,1e3)});browser.runtime.onMessage.addListener((t,n,r)=>{if(t.type==="searchPageContent"){const{query:l}=t;try{const a=h(),o=d(a.content,l);r({success:!0,results:o})}catch(a){r({success:!1,error:String(a)})}return!0}});function d(t,n){if(!n||!t)return[];const r=[],l=t.toLowerCase(),a=n.toLowerCase();let o=0;for(;o<l.length;){const e=l.indexOf(a,o);if(e===-1)break;const s=Math.max(0,e-100),c=Math.min(t.length,e+n.length+100),i=t.substring(e,e+n.length),g=t.substring(s,c);r.push({text:i,context:g}),o=e+n.length}return r}
