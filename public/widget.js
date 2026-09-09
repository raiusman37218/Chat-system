"use strict";(()=>{var qi=Symbol.for("@supabase/supabase-js.traceContextExtractor");function gr(){return globalThis[qi]}function ne(r,e){var t={};for(var i in r)Object.prototype.hasOwnProperty.call(r,i)&&e.indexOf(i)<0&&(t[i]=r[i]);if(r!=null&&typeof Object.getOwnPropertySymbols=="function")for(var s=0,i=Object.getOwnPropertySymbols(r);s<i.length;s++)e.indexOf(i[s])<0&&Object.prototype.propertyIsEnumerable.call(r,i[s])&&(t[i[s]]=r[i[s]]);return t}function mr(r,e,t,i){function s(n){return n instanceof t?n:new t(function(a){a(n)})}return new(t||(t=Promise))(function(n,a){function o(h){try{c(i.next(h))}catch(u){a(u)}}function l(h){try{c(i.throw(h))}catch(u){a(u)}}function c(h){h.done?n(h.value):s(h.value).then(o,l)}c((i=i.apply(r,e||[])).next())})}var yr=r=>r?(...e)=>r(...e):(...e)=>fetch(...e);var pe=class extends Error{constructor(e,t="FunctionsError",i){super(e),this.name=t,this.context=i}toJSON(){return{name:this.name,message:this.message,context:this.context}}},je=class extends pe{constructor(e){super("Failed to send a request to the Edge Function","FunctionsFetchError",e)}},ge=class extends pe{constructor(e){super("Relay Error invoking the Edge Function","FunctionsRelayError",e)}},me=class extends pe{constructor(e){super("Edge Function returned a non-2xx status code","FunctionsHttpError",e)}},Le;(function(r){r.Any="any",r.ApNortheast1="ap-northeast-1",r.ApNortheast2="ap-northeast-2",r.ApSouth1="ap-south-1",r.ApSoutheast1="ap-southeast-1",r.ApSoutheast2="ap-southeast-2",r.CaCentral1="ca-central-1",r.EuCentral1="eu-central-1",r.EuWest1="eu-west-1",r.EuWest2="eu-west-2",r.EuWest3="eu-west-3",r.SaEast1="sa-east-1",r.UsEast1="us-east-1",r.UsWest1="us-west-1",r.UsWest2="us-west-2"})(Le||(Le={}));var Pe=class{constructor(e,{headers:t={},customFetch:i,region:s=Le.Any}={}){this.url=e,this.headers=t,this.region=s,this.fetch=yr(i)}setAuth(e){this.headers.Authorization=`Bearer ${e}`}invoke(e){return mr(this,arguments,void 0,function*(t,i={}){var s,n;let a,o,l;try{let{headers:c,method:h,body:u,signal:f,timeout:d}=i,p={},{region:g}=i;g||(g=this.region);let m=new URL(`${this.url}/${t}`);g&&g!=="any"&&(p["x-region"]=g,m.searchParams.set("forceFunctionRegion",g));let w,_=!!c&&Object.keys(c).some(Oe=>Oe.toLowerCase()==="content-type");u&&!_?typeof Blob<"u"&&u instanceof Blob||u instanceof ArrayBuffer?(p["Content-Type"]="application/octet-stream",w=u):typeof u=="string"?(p["Content-Type"]="text/plain",w=u):typeof FormData<"u"&&u instanceof FormData?w=u:(p["Content-Type"]="application/json",w=JSON.stringify(u)):u&&typeof u!="string"&&!(typeof Blob<"u"&&u instanceof Blob)&&!(u instanceof ArrayBuffer)&&!(typeof FormData<"u"&&u instanceof FormData)?w=JSON.stringify(u):w=u;let b=f;d&&(o=new AbortController,a=setTimeout(()=>o.abort(),d),f?(b=o.signal,l=()=>o.abort(),f.addEventListener("abort",l)):b=o.signal);let k=yield this.fetch(m.toString(),{method:h||"POST",headers:Object.assign(Object.assign(Object.assign({},p),this.headers),c),body:w,signal:b}).catch(Oe=>{throw new je(Oe)}),L=k.headers.get("x-relay-error");if(L&&L==="true")throw new ge(k);if(!k.ok)throw new me(k);let E=((s=k.headers.get("Content-Type"))!==null&&s!==void 0?s:"text/plain").split(";")[0].trim().toLowerCase(),A;return E==="application/json"?A=yield k.json():E==="application/octet-stream"||E==="application/pdf"?A=yield k.blob():E==="text/event-stream"?A=k:E==="multipart/form-data"?A=yield k.formData():A=yield k.text(),{data:A,error:null,response:k}}catch(c){return{data:null,error:c,response:c instanceof me||c instanceof ge?c.context:void 0}}finally{a&&clearTimeout(a),l&&((n=i.signal)===null||n===void 0||n.removeEventListener("abort",l))}})}};var wr=r=>Math.min(1e3*2**r,3e4),Hi=[520,503],xr=["GET","HEAD","OPTIONS"],ot=class extends Error{constructor(r){super(r.message),this.name="PostgrestError",this.details=r.details,this.hint=r.hint,this.code=r.code}toJSON(){return{name:this.name,message:this.message,details:this.details,hint:this.hint,code:this.code}}};function Be(r){"@babel/helpers - typeof";return Be=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Be(r)}function Gi(r,e){if(Be(r)!="object"||!r)return r;var t=r[Symbol.toPrimitive];if(t!==void 0){var i=t.call(r,e||"default");if(Be(i)!="object")return i;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(r)}function Ki(r){var e=Gi(r,"string");return Be(e)=="symbol"?e:e+""}function zi(r,e,t){return(e=Ki(e))in r?Object.defineProperty(r,e,{value:t,enumerable:!0,configurable:!0,writable:!0}):r[e]=t,r}function vr(r,e){var t=Object.keys(r);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(r);e&&(i=i.filter(function(s){return Object.getOwnPropertyDescriptor(r,s).enumerable})),t.push.apply(t,i)}return t}function we(r){for(var e=1;e<arguments.length;e++){var t=arguments[e]!=null?arguments[e]:{};e%2?vr(Object(t),!0).forEach(function(i){zi(r,i,t[i])}):Object.getOwnPropertyDescriptors?Object.defineProperties(r,Object.getOwnPropertyDescriptors(t)):vr(Object(t)).forEach(function(i){Object.defineProperty(r,i,Object.getOwnPropertyDescriptor(t,i))})}return r}function br(r,e){return new Promise(t=>{if(e?.aborted){t();return}let i=setTimeout(()=>{e?.removeEventListener("abort",s),t()},r);function s(){clearTimeout(i),t()}e?.addEventListener("abort",s)})}function Vi(r,e,t,i){return!(!i||t>=3||!xr.includes(r)||!Hi.includes(e))}var Wi=class{constructor(r){var e,t,i,s,n;this.shouldThrowOnError=!1,this.retryEnabled=!0,this.method=r.method,this.url=r.url,this.headers=new Headers(r.headers),this.schema=r.schema,this.body=r.body,this.shouldThrowOnError=(e=r.shouldThrowOnError)!==null&&e!==void 0?e:!1,this.signal=r.signal,this.isMaybeSingle=(t=r.isMaybeSingle)!==null&&t!==void 0?t:!1,this.shouldStripNulls=(i=r.shouldStripNulls)!==null&&i!==void 0?i:!1,this.urlLengthLimit=(s=r.urlLengthLimit)!==null&&s!==void 0?s:8e3,this.retryEnabled=(n=r.retry)!==null&&n!==void 0?n:!0,r.fetch?this.fetch=r.fetch:this.fetch=fetch}throwOnError(){return this.shouldThrowOnError=!0,this}stripNulls(){if(this.headers.get("Accept")==="text/csv")throw new Error("stripNulls() cannot be used with csv()");return this.shouldStripNulls=!0,this}setHeader(r,e){return this.headers=new Headers(this.headers),this.headers.set(r,e),this}retry(r){return this.retryEnabled=r,this}then(r,e){var t=this;if(this.schema===void 0||(["GET","HEAD"].includes(this.method)?this.headers.set("Accept-Profile",this.schema):this.headers.set("Content-Profile",this.schema)),this.method!=="GET"&&this.method!=="HEAD"&&this.headers.set("Content-Type","application/json"),this.shouldStripNulls){let a=this.headers.get("Accept");a==="application/vnd.pgrst.object+json"?this.headers.set("Accept","application/vnd.pgrst.object+json;nulls=stripped"):(!a||a==="application/json")&&this.headers.set("Accept","application/vnd.pgrst.array+json;nulls=stripped")}let i=this.fetch,n=(async()=>{let a=0;for(;;){let c={};t.headers.forEach((u,f)=>{c[f]=u}),a>0&&(c["X-Retry-Count"]=String(a));let h;try{h=await i(t.url.toString(),{method:t.method,headers:c,body:JSON.stringify(t.body,(u,f)=>typeof f=="bigint"?f.toString():f),signal:t.signal})}catch(u){if(u?.name==="AbortError"||u?.code==="ABORT_ERR"||!xr.includes(t.method))throw u;if(t.retryEnabled&&a<3){let f=wr(a);a++,await br(f,t.signal);continue}throw u}if(Vi(t.method,h.status,a,t.retryEnabled)){var o,l;let u=(o=(l=h.headers)===null||l===void 0?void 0:l.get("Retry-After"))!==null&&o!==void 0?o:null,f=u!==null?Math.max(0,parseInt(u,10)||0)*1e3:wr(a);await h.text(),a++,await br(f,t.signal);continue}return await t.processResponse(h)}})();return this.shouldThrowOnError||(n=n.catch(a=>{var o;let l="",c="",h="",u=a?.cause;if(u){var f,d,p,g;let _=(f=u?.message)!==null&&f!==void 0?f:"",b=(d=u?.code)!==null&&d!==void 0?d:"";l=`${(p=a?.name)!==null&&p!==void 0?p:"FetchError"}: ${a?.message}`,l+=`

Caused by: ${(g=u?.name)!==null&&g!==void 0?g:"Error"}: ${_}`,b&&(l+=` (${b})`),u?.stack&&(l+=`
${u.stack}`)}else{var m;l=(m=a?.stack)!==null&&m!==void 0?m:""}let w=this.url.toString().length;return a?.name==="AbortError"||a?.code==="ABORT_ERR"?(h="",c="Request was aborted (timeout or manual cancellation)",w>this.urlLengthLimit&&(c+=`. Note: Your request URL is ${w} characters, which may exceed server limits. If selecting many fields, consider using views. If filtering with large arrays (e.g., .in('id', [many IDs])), consider using an RPC function to pass values server-side.`)):(u?.name==="HeadersOverflowError"||u?.code==="UND_ERR_HEADERS_OVERFLOW")&&(h="",c="HTTP headers exceeded server limits (typically 16KB)",w>this.urlLengthLimit&&(c+=`. Your request URL is ${w} characters. If selecting many fields, consider using views. If filtering with large arrays (e.g., .in('id', [200+ IDs])), consider using an RPC function instead.`)),{success:!1,error:{message:`${(o=a?.name)!==null&&o!==void 0?o:"FetchError"}: ${a?.message}`,details:l,hint:c,code:h},data:null,count:null,status:0,statusText:""}})),n.then(r,e)}async processResponse(r){var e=this;let t=null,i=null,s=null,n=r.status,a=r.statusText;if(r.ok){var o,l;if(e.method!=="HEAD"){var c;let d=await r.text();if(d!=="")if(e.headers.get("Accept")==="text/csv")i=d;else if(e.headers.get("Accept")&&(!((c=e.headers.get("Accept"))===null||c===void 0)&&c.includes("application/vnd.pgrst.plan+text")))i=d;else try{i=JSON.parse(d)}catch{if(t={message:d},i=null,e.shouldThrowOnError)throw new ot({message:d,details:"",hint:"",code:""})}}let u=(o=e.headers.get("Prefer"))===null||o===void 0?void 0:o.match(/count=(exact|planned|estimated)/),f=(l=r.headers.get("content-range"))===null||l===void 0?void 0:l.split("/");if(u&&f&&f.length>1&&(s=parseInt(f[1])),e.isMaybeSingle&&Array.isArray(i))if(i.length>1){if(t={code:"PGRST116",details:`Results contain ${i.length} rows, application/vnd.pgrst.object+json requires 1 row`,hint:null,message:"JSON object requested, multiple (or no) rows returned"},i=null,s=null,n=406,a="Not Acceptable",e.shouldThrowOnError){var h;throw new ot(we(we({},t),{},{hint:(h=t.hint)!==null&&h!==void 0?h:""}))}}else i.length===1?i=i[0]:i=null}else{let u=await r.text();try{t=JSON.parse(u),Array.isArray(t)&&r.status===404&&(i=[],t=null,n=200,a="OK")}catch{r.status===404&&u===""?(n=204,a="No Content"):t={message:u}}if(t&&e.shouldThrowOnError)throw new ot(t)}return{success:t===null,error:t,data:i,count:s,status:n,statusText:a}}returns(){return this}overrideTypes(){return this}},Ji=class extends Wi{throwOnError(){return super.throwOnError()}select(r){let e=!1,t=(r??"*").split("").map(i=>/\s/.test(i)&&!e?"":(i==='"'&&(e=!e),i)).join("");return this.url.searchParams.set("select",t),this.headers.append("Prefer","return=representation"),this}order(r,{ascending:e=!0,nullsFirst:t,foreignTable:i,referencedTable:s=i}={}){let n=s?`${s}.order`:"order",a=this.url.searchParams.get(n);return this.url.searchParams.set(n,`${a?`${a},`:""}${r}.${e?"asc":"desc"}${t===void 0?"":t?".nullsfirst":".nullslast"}`),this}limit(r,{foreignTable:e,referencedTable:t=e}={}){let i=typeof t>"u"?"limit":`${t}.limit`;return this.url.searchParams.set(i,`${r}`),this}range(r,e,{foreignTable:t,referencedTable:i=t}={}){let s=typeof i>"u"?"offset":`${i}.offset`,n=typeof i>"u"?"limit":`${i}.limit`;return this.url.searchParams.set(s,`${r}`),this.url.searchParams.set(n,`${e-r+1}`),this}abortSignal(r){return this.signal=r,this}single(){return this.headers.set("Accept","application/vnd.pgrst.object+json"),this}maybeSingle(){return this.isMaybeSingle=!0,this}csv(){return this.headers.set("Accept","text/csv"),this}geojson(){return this.headers.set("Accept","application/geo+json"),this}explain({analyze:r=!1,verbose:e=!1,settings:t=!1,buffers:i=!1,wal:s=!1,format:n="text"}={}){var a;let o=[r?"analyze":null,e?"verbose":null,t?"settings":null,i?"buffers":null,s?"wal":null].filter(Boolean).join("|"),l=(a=this.headers.get("Accept"))!==null&&a!==void 0?a:"application/json";return this.headers.set("Accept",`application/vnd.pgrst.plan+${n}; for="${l}"; options=${o};`),n==="json"?this:this}rollback(){return this.headers.append("Prefer","tx=rollback"),this}returns(){return this}maxAffected(r){return this.headers.append("Prefer","handling=strict"),this.headers.append("Prefer",`max-affected=${r}`),this}},_r=new RegExp("[,()]"),ye=class extends Ji{throwOnError(){return super.throwOnError()}eq(r,e){return this.url.searchParams.append(r,`eq.${e}`),this}neq(r,e){return this.url.searchParams.append(r,`neq.${e}`),this}gt(r,e){return this.url.searchParams.append(r,`gt.${e}`),this}gte(r,e){return this.url.searchParams.append(r,`gte.${e}`),this}lt(r,e){return this.url.searchParams.append(r,`lt.${e}`),this}lte(r,e){return this.url.searchParams.append(r,`lte.${e}`),this}like(r,e){return this.url.searchParams.append(r,`like.${e}`),this}likeAllOf(r,e){return this.url.searchParams.append(r,`like(all).{${e.join(",")}}`),this}likeAnyOf(r,e){return this.url.searchParams.append(r,`like(any).{${e.join(",")}}`),this}ilike(r,e){return this.url.searchParams.append(r,`ilike.${e}`),this}ilikeAllOf(r,e){return this.url.searchParams.append(r,`ilike(all).{${e.join(",")}}`),this}ilikeAnyOf(r,e){return this.url.searchParams.append(r,`ilike(any).{${e.join(",")}}`),this}regexMatch(r,e){return this.url.searchParams.append(r,`match.${e}`),this}regexIMatch(r,e){return this.url.searchParams.append(r,`imatch.${e}`),this}is(r,e){return this.url.searchParams.append(r,`is.${e}`),this}isDistinct(r,e){return this.url.searchParams.append(r,`isdistinct.${e}`),this}in(r,e){let t=Array.from(new Set(e)).map(i=>typeof i=="string"&&_r.test(i)?`"${i}"`:`${i}`).join(",");return this.url.searchParams.append(r,`in.(${t})`),this}notIn(r,e){let t=Array.from(new Set(e)).map(i=>typeof i=="string"&&_r.test(i)?`"${i}"`:`${i}`).join(",");return this.url.searchParams.append(r,`not.in.(${t})`),this}contains(r,e){return typeof e=="string"?this.url.searchParams.append(r,`cs.${e}`):Array.isArray(e)?this.url.searchParams.append(r,`cs.{${e.join(",")}}`):this.url.searchParams.append(r,`cs.${JSON.stringify(e)}`),this}containedBy(r,e){return typeof e=="string"?this.url.searchParams.append(r,`cd.${e}`):Array.isArray(e)?this.url.searchParams.append(r,`cd.{${e.join(",")}}`):this.url.searchParams.append(r,`cd.${JSON.stringify(e)}`),this}rangeGt(r,e){return this.url.searchParams.append(r,`sr.${e}`),this}rangeGte(r,e){return this.url.searchParams.append(r,`nxl.${e}`),this}rangeLt(r,e){return this.url.searchParams.append(r,`sl.${e}`),this}rangeLte(r,e){return this.url.searchParams.append(r,`nxr.${e}`),this}rangeAdjacent(r,e){return this.url.searchParams.append(r,`adj.${e}`),this}overlaps(r,e){return typeof e=="string"?this.url.searchParams.append(r,`ov.${e}`):this.url.searchParams.append(r,`ov.{${e.join(",")}}`),this}textSearch(r,e,{config:t,type:i}={}){let s="";i==="plain"?s="pl":i==="phrase"?s="ph":i==="websearch"&&(s="w");let n=t===void 0?"":`(${t})`;return this.url.searchParams.append(r,`${s}fts${n}.${e}`),this}match(r){return Object.entries(r).filter(([e,t])=>t!==void 0).forEach(([e,t])=>{this.url.searchParams.append(e,`eq.${t}`)}),this}not(r,e,t){return this.url.searchParams.append(r,`not.${e}.${t}`),this}or(r,{foreignTable:e,referencedTable:t=e}={}){let i=t?`${t}.or`:"or";return this.url.searchParams.append(i,`(${r})`),this}filter(r,e,t){return this.url.searchParams.append(r,`${e}.${t}`),this}},Qi=class{constructor(r,{headers:e={},schema:t,fetch:i,urlLengthLimit:s=8e3,retry:n}){this.url=r,this.headers=new Headers(e),this.schema=t,this.fetch=i,this.urlLengthLimit=s,this.retry=n}cloneRequestState(){return{url:new URL(this.url.toString()),headers:new Headers(this.headers)}}select(r,e){let{head:t=!1,count:i}=e??{},s=t?"HEAD":"GET",n=!1,a=(r??"*").split("").map(c=>/\s/.test(c)&&!n?"":(c==='"'&&(n=!n),c)).join(""),{url:o,headers:l}=this.cloneRequestState();return o.searchParams.set("select",a),i&&l.append("Prefer",`count=${i}`),new ye({method:s,url:o,headers:l,schema:this.schema,fetch:this.fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}insert(r,{count:e,defaultToNull:t=!0}={}){var i;let s="POST",{url:n,headers:a}=this.cloneRequestState();if(e&&a.append("Prefer",`count=${e}`),t||a.append("Prefer","missing=default"),Array.isArray(r)){let o=r.reduce((l,c)=>l.concat(Object.keys(c)),[]);if(o.length>0){let l=[...new Set(o)].map(c=>`"${c}"`);n.searchParams.set("columns",l.join(","))}}return new ye({method:s,url:n,headers:a,schema:this.schema,body:r,fetch:(i=this.fetch)!==null&&i!==void 0?i:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}upsert(r,{onConflict:e,ignoreDuplicates:t=!1,count:i,defaultToNull:s=!0}={}){var n;let a="POST",{url:o,headers:l}=this.cloneRequestState();if(l.append("Prefer",`resolution=${t?"ignore":"merge"}-duplicates`),e!==void 0&&o.searchParams.set("on_conflict",e),i&&l.append("Prefer",`count=${i}`),s||l.append("Prefer","missing=default"),Array.isArray(r)){let c=r.reduce((h,u)=>h.concat(Object.keys(u)),[]);if(c.length>0){let h=[...new Set(c)].map(u=>`"${u}"`);o.searchParams.set("columns",h.join(","))}}return new ye({method:a,url:o,headers:l,schema:this.schema,body:r,fetch:(n=this.fetch)!==null&&n!==void 0?n:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}update(r,{count:e}={}){var t;let i="PATCH",{url:s,headers:n}=this.cloneRequestState();return e&&n.append("Prefer",`count=${e}`),new ye({method:i,url:s,headers:n,schema:this.schema,body:r,fetch:(t=this.fetch)!==null&&t!==void 0?t:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}delete({count:r}={}){var e;let t="DELETE",{url:i,headers:s}=this.cloneRequestState();return r&&s.append("Prefer",`count=${r}`),new ye({method:t,url:i,headers:s,schema:this.schema,fetch:(e=this.fetch)!==null&&e!==void 0?e:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}},kr=class Er{constructor(e,{headers:t={},schema:i,fetch:s,timeout:n,urlLengthLimit:a=8e3,retry:o}={}){this.url=e,this.headers=new Headers(t),this.schemaName=i,this.urlLengthLimit=a;let l=s??globalThis.fetch;n!==void 0&&n>0?this.fetch=(c,h)=>{let u=new AbortController,f=setTimeout(()=>u.abort(),n),d=h?.signal;if(d){if(d.aborted)return clearTimeout(f),l(c,h);let p=()=>{clearTimeout(f),u.abort()};return d.addEventListener("abort",p,{once:!0}),l(c,we(we({},h),{},{signal:u.signal})).finally(()=>{clearTimeout(f),d.removeEventListener("abort",p)})}return l(c,we(we({},h),{},{signal:u.signal})).finally(()=>clearTimeout(f))}:this.fetch=l,this.retry=o}from(e){if(!e||typeof e!="string"||e.trim()==="")throw new Error("Invalid relation name: relation must be a non-empty string.");return new Qi(new URL(`${this.url}/${e}`),{headers:new Headers(this.headers),schema:this.schemaName,fetch:this.fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}schema(e){return new Er(this.url,{headers:this.headers,schema:e,fetch:this.fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}rpc(e,t={},{head:i=!1,get:s=!1,count:n}={}){var a;let o,l=new URL(`${this.url}/rpc/${e}`),c,h=d=>d!==null&&typeof d=="object"&&(!Array.isArray(d)||d.some(h)),u=i&&Object.values(t).some(h);u?(o="POST",c=t):i||s?(o=i?"HEAD":"GET",Object.entries(t).filter(([d,p])=>p!==void 0).map(([d,p])=>[d,Array.isArray(p)?`{${p.join(",")}}`:`${p}`]).forEach(([d,p])=>{l.searchParams.append(d,p)})):(o="POST",c=t);let f=new Headers(this.headers);return u?f.set("Prefer",n?`count=${n},return=minimal`:"return=minimal"):n&&f.set("Prefer",`count=${n}`),new ye({method:o,url:l,headers:f,schema:this.schemaName,body:c,fetch:(a=this.fetch)!==null&&a!==void 0?a:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}};var Nt=class{constructor(){}static detectEnvironment(){var e;if(typeof WebSocket<"u")return{type:"native",wsConstructor:WebSocket};let t=globalThis;if(typeof globalThis<"u"&&typeof t.WebSocket<"u")return{type:"native",wsConstructor:t.WebSocket};let i=typeof global<"u"?global:void 0;if(i&&typeof i.WebSocket<"u")return{type:"native",wsConstructor:i.WebSocket};if(typeof globalThis<"u"&&typeof t.WebSocketPair<"u"&&typeof globalThis.WebSocket>"u")return{type:"cloudflare",error:"Cloudflare Workers detected. WebSocket clients are not supported in Cloudflare Workers.",workaround:"Use Cloudflare Workers WebSocket API for server-side WebSocket handling, or deploy to a different runtime."};if(typeof globalThis<"u"&&t.EdgeRuntime||typeof navigator<"u"&&(!((e=navigator.userAgent)===null||e===void 0)&&e.includes("Vercel-Edge")))return{type:"unsupported",error:"Edge runtime detected (Vercel Edge/Netlify Edge). WebSockets are not supported in edge functions.",workaround:"Use serverless functions or a different deployment target for WebSocket functionality."};let s=globalThis.process;if(s){let n=s.versions;if(n&&n.node)return{type:"unsupported",error:"Node.js detected but native WebSocket not found.",workaround:"Ensure you are running Node.js 22+ or provide a WebSocket implementation via the transport option."}}return{type:"unsupported",error:"Unknown JavaScript runtime without WebSocket support.",workaround:"Ensure you're running in a supported environment (browser, Node.js, Deno) or provide a custom WebSocket implementation."}}static getWebSocketConstructor(){let e=this.detectEnvironment();if(e.wsConstructor)return e.wsConstructor;let t=e.error||"WebSocket not supported in this environment.";throw e.workaround&&(t+=`

Suggested solution: ${e.workaround}`),new Error(t)}static isWebSocketSupported(){try{return this.detectEnvironment().type==="native"}catch{return!1}}},Ut=Nt;var Sr="2.112.4";var Ar=`realtime-js/${Sr}`,Tr="1.0.0",Mt="2.0.0",Ir=Mt;var Cr=1e4;var Rr=100;var q={closed:"closed",errored:"errored",joined:"joined",joining:"joining",leaving:"leaving"},lt={close:"phx_close",error:"phx_error",join:"phx_join",reply:"phx_reply",leave:"phx_leave",access_token:"access_token"};var Ne={connecting:"connecting",open:"open",closing:"closing",closed:"closed"};var Ue=class{constructor(e){this.HEADER_LENGTH=1,this.USER_BROADCAST_PUSH_META_LENGTH=6,this.KINDS={userBroadcastPush:3,userBroadcast:4},this.BINARY_ENCODING=0,this.JSON_ENCODING=1,this.BROADCAST_EVENT="broadcast",this.allowedMetadataKeys=[],this.allowedMetadataKeys=e??[]}encode(e,t){if(e.event===this.BROADCAST_EVENT&&!(e.payload instanceof ArrayBuffer)&&typeof e.payload.event=="string")return t(this._binaryEncodeUserBroadcastPush(e));let i=[e.join_ref,e.ref,e.topic,e.event,e.payload];return t(JSON.stringify(i))}_binaryEncodeUserBroadcastPush(e){var t;return this._isArrayBuffer((t=e.payload)===null||t===void 0?void 0:t.payload)?this._encodeBinaryUserBroadcastPush(e):this._encodeJsonUserBroadcastPush(e)}_encodeBinaryUserBroadcastPush(e){var t,i;let s=(i=(t=e.payload)===null||t===void 0?void 0:t.payload)!==null&&i!==void 0?i:new ArrayBuffer(0);return this._encodeUserBroadcastPush(e,this.BINARY_ENCODING,s)}_encodeJsonUserBroadcastPush(e){var t,i;let s=(i=(t=e.payload)===null||t===void 0?void 0:t.payload)!==null&&i!==void 0?i:{},a=new TextEncoder().encode(JSON.stringify(s)).buffer;return this._encodeUserBroadcastPush(e,this.JSON_ENCODING,a)}_encodeUserBroadcastPush(e,t,i){var s,n;let a=new TextEncoder,o=a.encode(e.topic),l=a.encode((s=e.ref)!==null&&s!==void 0?s:""),c=a.encode((n=e.join_ref)!==null&&n!==void 0?n:""),h=a.encode(e.payload.event),u=this.allowedMetadataKeys?this._pick(e.payload,this.allowedMetadataKeys):{},f=a.encode(Object.keys(u).length===0?"":JSON.stringify(u));if(c.length>255)throw new Error(`joinRef length ${c.length} exceeds maximum of 255`);if(l.length>255)throw new Error(`ref length ${l.length} exceeds maximum of 255`);if(o.length>255)throw new Error(`topic length ${o.length} exceeds maximum of 255`);if(h.length>255)throw new Error(`userEvent length ${h.length} exceeds maximum of 255`);if(f.length>255)throw new Error(`metadata length ${f.length} exceeds maximum of 255`);let d=this.USER_BROADCAST_PUSH_META_LENGTH+c.length+l.length+o.length+h.length+f.length,p=new ArrayBuffer(this.HEADER_LENGTH+d),g=new DataView(p),m=new Uint8Array(p),w=0;g.setUint8(w++,this.KINDS.userBroadcastPush),g.setUint8(w++,c.length),g.setUint8(w++,l.length),g.setUint8(w++,o.length),g.setUint8(w++,h.length),g.setUint8(w++,f.length),g.setUint8(w++,t),m.set(c,w),w+=c.length,m.set(l,w),w+=l.length,m.set(o,w),w+=o.length,m.set(h,w),w+=h.length,m.set(f,w),w+=f.length;var _=new Uint8Array(p.byteLength+i.byteLength);return _.set(new Uint8Array(p),0),_.set(new Uint8Array(i),p.byteLength),_.buffer}decode(e,t){if(this._isArrayBuffer(e)){let i=this._binaryDecode(e);return t(i)}if(typeof e=="string"){let i=JSON.parse(e),[s,n,a,o,l]=i;return t({join_ref:s,ref:n,topic:a,event:o,payload:l})}return t({})}_binaryDecode(e){let t=new DataView(e),i=t.getUint8(0),s=new TextDecoder;if(i===this.KINDS.userBroadcast)return this._decodeUserBroadcast(e,t,s)}_decodeUserBroadcast(e,t,i){let s=t.getUint8(1),n=t.getUint8(2),a=t.getUint8(3),o=t.getUint8(4),l=this.HEADER_LENGTH+4,c=i.decode(e.slice(l,l+s));l=l+s;let h=i.decode(e.slice(l,l+n));l=l+n;let u=i.decode(e.slice(l,l+a));l=l+a;let f=e.slice(l,e.byteLength),d=o===this.JSON_ENCODING?JSON.parse(i.decode(f)):f,p={type:this.BROADCAST_EVENT,event:h,payload:d};return a>0&&(p.meta=JSON.parse(u)),{join_ref:null,ref:null,topic:c,event:this.BROADCAST_EVENT,payload:p}}_isArrayBuffer(e){var t;return e instanceof ArrayBuffer||((t=e?.constructor)===null||t===void 0?void 0:t.name)==="ArrayBuffer"}_pick(e,t){return!e||typeof e!="object"?{}:Object.fromEntries(Object.entries(e).filter(([i])=>t.includes(i)))}};var S;(function(r){r.abstime="abstime",r.bool="bool",r.date="date",r.daterange="daterange",r.float4="float4",r.float8="float8",r.int2="int2",r.int4="int4",r.int4range="int4range",r.int8="int8",r.int8range="int8range",r.json="json",r.jsonb="jsonb",r.money="money",r.numeric="numeric",r.oid="oid",r.reltime="reltime",r.text="text",r.time="time",r.timestamp="timestamp",r.timestamptz="timestamptz",r.timetz="timetz",r.tsrange="tsrange",r.tstzrange="tstzrange"})(S||(S={}));var Dt=(r,e,t={})=>{var i;let s=(i=t.skipTypes)!==null&&i!==void 0?i:[];return e?Object.keys(e).reduce((n,a)=>(n[a]=Yi(a,r,e,s),n),{}):{}},Yi=(r,e,t,i)=>{let s=e.find(o=>o.name===r),n=s?.type,a=t[r];return n&&!i.includes(n)?Or(n,a):Ft(a)},Or=(r,e)=>{if(r.charAt(0)==="_"){let t=r.slice(1,r.length);return ts(e,t)}switch(r){case S.bool:return Xi(e);case S.float4:case S.float8:case S.int2:case S.int4:case S.int8:case S.numeric:case S.oid:return Zi(e);case S.json:case S.jsonb:return es(e);case S.timestamp:return rs(e);case S.abstime:case S.date:case S.daterange:case S.int4range:case S.int8range:case S.money:case S.reltime:case S.text:case S.time:case S.timestamptz:case S.timetz:case S.tsrange:case S.tstzrange:return Ft(e);default:return Ft(e)}},Ft=r=>r,Xi=r=>{switch(r){case"t":return!0;case"f":return!1;default:return r}},Zi=r=>{if(typeof r=="string"){let e=parseFloat(r);if(!Number.isNaN(e))return e}return r},es=r=>{if(typeof r=="string")try{return JSON.parse(r)}catch{return r}return r},ts=(r,e)=>{if(typeof r!="string")return r;let t=r.length-1,i=r[t];if(r[0]==="{"&&i==="}"){let n,a=r.slice(1,t);try{n=JSON.parse("["+a+"]")}catch{n=a?a.split(","):[]}return n.map(o=>Or(e,o))}return r},rs=r=>typeof r=="string"?r.replace(" ","T"):r,ct=r=>{let e=new URL(r);return e.protocol=e.protocol.replace(/^ws/i,"http"),e.pathname=e.pathname.replace(/\/+$/,"").replace(/\/socket\/websocket$/i,"").replace(/\/socket$/i,"").replace(/\/websocket$/i,""),e.pathname===""||e.pathname==="/"?e.pathname="/api/broadcast":e.pathname=e.pathname+"/api/broadcast",e.href};var _e=r=>typeof r=="function"?r:function(){return r},ss=typeof self<"u"?self:null,be=typeof window<"u"?window:null,H=ss||be||globalThis,ns="2.0.0",as=1e4,os=1e3,ls=100,G={connecting:0,open:1,closing:2,closed:3},B={closed:"closed",errored:"errored",joined:"joined",joining:"joining",leaving:"leaving"},Y={close:"phx_close",error:"phx_error",join:"phx_join",reply:"phx_reply",leave:"phx_leave"},$t={longpoll:"longpoll",websocket:"websocket"},cs={complete:4},qt="base64url.bearer.phx.",ht=class{constructor(r,e,t,i){this.channel=r,this.event=e,this.payload=t||function(){return{}},this.receivedResp=null,this.timeout=i,this.timeoutTimer=null,this.recHooks=[],this.sent=!1,this.ref=void 0}resend(r){this.timeout=r,this.reset(),this.send()}send(){this.hasReceived("timeout")||(this.startTimeout(),this.sent=!0,this.channel.socket.push({topic:this.channel.topic,event:this.event,payload:this.payload(),ref:this.ref,join_ref:this.channel.joinRef()}))}receive(r,e){return this.hasReceived(r)&&e(this.receivedResp.response),this.recHooks.push({status:r,callback:e}),this}reset(){this.cancelRefEvent(),this.ref=null,this.refEvent=null,this.receivedResp=null,this.sent=!1}destroy(){this.cancelRefEvent(),this.cancelTimeout()}matchReceive({status:r,response:e,_ref:t}){this.recHooks.filter(i=>i.status===r).forEach(i=>i.callback(e))}cancelRefEvent(){this.refEvent&&this.channel.off(this.refEvent)}cancelTimeout(){clearTimeout(this.timeoutTimer),this.timeoutTimer=null}startTimeout(){this.timeoutTimer&&this.cancelTimeout(),this.ref=this.channel.socket.makeRef(),this.refEvent=this.channel.replyEventName(this.ref),this.channel.on(this.refEvent,r=>{this.cancelRefEvent(),this.cancelTimeout(),this.receivedResp=r,this.matchReceive(r)}),this.timeoutTimer=setTimeout(()=>{this.trigger("timeout",{})},this.timeout)}hasReceived(r){return this.receivedResp&&this.receivedResp.status===r}trigger(r,e){this.channel.trigger(this.refEvent,{status:r,response:e})}},jr=class{constructor(r,e){this.callback=r,this.timerCalc=e,this.timer=void 0,this.tries=0}reset(){this.tries=0,clearTimeout(this.timer)}scheduleTimeout(){clearTimeout(this.timer),this.timer=setTimeout(()=>{this.tries=this.tries+1,this.callback()},this.timerCalc(this.tries+1))}},hs=class{constructor(r,e,t){this.state=B.closed,this.topic=r,this.params=_e(e||{}),this.socket=t,this.bindings=[],this.bindingRef=0,this.timeout=this.socket.timeout,this.joinedOnce=!1,this.joinPush=new ht(this,Y.join,this.params,this.timeout),this.pushBuffer=[],this.stateChangeRefs=[],this.rejoinTimer=new jr(()=>{this.socket.isConnected()&&this.rejoin()},this.socket.rejoinAfterMs),this.stateChangeRefs.push(this.socket.onError(()=>this.rejoinTimer.reset())),this.stateChangeRefs.push(this.socket.onOpen(()=>{this.rejoinTimer.reset(),this.isErrored()&&this.rejoin()})),this.joinPush.receive("ok",()=>{this.state=B.joined,this.rejoinTimer.reset(),this.pushBuffer.forEach(i=>i.send()),this.pushBuffer=[]}),this.joinPush.receive("error",i=>{this.state=B.errored,this.socket.hasLogger()&&this.socket.log("channel",`error ${this.topic}`,i),this.socket.isConnected()&&this.rejoinTimer.scheduleTimeout()}),this.onClose(()=>{this.rejoinTimer.reset(),this.socket.hasLogger()&&this.socket.log("channel",`close ${this.topic}`),this.state=B.closed,this.socket.remove(this)}),this.onError(i=>{this.socket.hasLogger()&&this.socket.log("channel",`error ${this.topic}`,i),this.isJoining()&&this.joinPush.reset(),this.state=B.errored,this.socket.isConnected()&&this.rejoinTimer.scheduleTimeout()}),this.joinPush.receive("timeout",()=>{this.socket.hasLogger()&&this.socket.log("channel",`timeout ${this.topic}`,this.joinPush.timeout),new ht(this,Y.leave,_e({}),this.timeout).send(),this.state=B.errored,this.joinPush.reset(),this.socket.isConnected()&&this.rejoinTimer.scheduleTimeout()}),this.on(Y.reply,(i,s)=>{this.trigger(this.replyEventName(s),i)})}join(r=this.timeout){if(this.joinedOnce)throw new Error("tried to join multiple times. 'join' can only be called a single time per channel instance");return this.timeout=r,this.joinedOnce=!0,this.rejoin(),this.joinPush}teardown(){this.pushBuffer.forEach(r=>r.destroy()),this.pushBuffer=[],this.rejoinTimer.reset(),this.joinPush.destroy(),this.state=B.closed,this.bindings=[]}onClose(r){this.on(Y.close,r)}onError(r){return this.on(Y.error,e=>r(e))}on(r,e){let t=this.bindingRef++;return this.bindings.push({event:r,ref:t,callback:e}),t}off(r,e){this.bindings=this.bindings.filter(t=>!(t.event===r&&(typeof e>"u"||e===t.ref)))}canPush(){return this.socket.isConnected()&&this.isJoined()}push(r,e,t=this.timeout){if(e=e||{},!this.joinedOnce)throw new Error(`tried to push '${r}' to '${this.topic}' before joining. Use channel.join() before pushing events`);let i=new ht(this,r,function(){return e},t);return this.canPush()?i.send():(i.startTimeout(),this.pushBuffer.push(i)),i}leave(r=this.timeout){this.rejoinTimer.reset(),this.joinPush.cancelTimeout(),this.state=B.leaving;let e=()=>{this.socket.hasLogger()&&this.socket.log("channel",`leave ${this.topic}`),this.trigger(Y.close,"leave")},t=new ht(this,Y.leave,_e({}),r);return t.receive("ok",()=>e()).receive("timeout",()=>e()),t.send(),this.canPush()||t.trigger("ok",{}),t}onMessage(r,e,t){return e}filterBindings(r,e,t){return!0}isMember(r,e,t,i){return this.topic!==r?!1:i&&i!==this.joinRef()?(this.socket.hasLogger()&&this.socket.log("channel","dropping outdated message",{topic:r,event:e,payload:t,joinRef:i}),!1):!0}joinRef(){return this.joinPush.ref}rejoin(r=this.timeout){this.isLeaving()||(this.socket.leaveOpenTopic(this.topic),this.state=B.joining,this.joinPush.resend(r))}trigger(r,e,t,i){let s=this.onMessage(r,e,t,i);if(e&&!s)throw new Error("channel onMessage callbacks must return the payload, modified or unmodified");let n=this.bindings.filter(a=>a.event===r&&this.filterBindings(a,e,t));for(let a=0;a<n.length;a++)n[a].callback(s,t,i||this.joinRef())}replyEventName(r){return`chan_reply_${r}`}isClosed(){return this.state===B.closed}isErrored(){return this.state===B.errored}isJoined(){return this.state===B.joined}isJoining(){return this.state===B.joining}isLeaving(){return this.state===B.leaving}},dt=class{static request(r,e,t,i,s,n,a){if(H.XDomainRequest){let o=new H.XDomainRequest;return this.xdomainRequest(o,r,e,i,s,n,a)}else if(H.XMLHttpRequest){let o=new H.XMLHttpRequest;return this.xhrRequest(o,r,e,t,i,s,n,a)}else{if(H.fetch&&H.AbortController)return this.fetchRequest(r,e,t,i,s,n,a);throw new Error("No suitable XMLHttpRequest implementation found")}}static fetchRequest(r,e,t,i,s,n,a){let o={method:r,headers:t,body:i},l=null;if(s){l=new AbortController;let c=setTimeout(()=>l.abort(),s);o.signal=l.signal}return H.fetch(e,o).then(c=>c.text()).then(c=>this.parseJSON(c)).then(c=>a&&a(c)).catch(c=>{c.name==="AbortError"&&n?n():a&&a(null)}),l}static xdomainRequest(r,e,t,i,s,n,a){return r.timeout=s,r.open(e,t),r.onload=()=>{let o=this.parseJSON(r.responseText);a&&a(o)},n&&(r.ontimeout=n),r.onprogress=()=>{},r.send(i),r}static xhrRequest(r,e,t,i,s,n,a,o){r.open(e,t,!0),r.timeout=n;for(let[l,c]of Object.entries(i))r.setRequestHeader(l,c);return r.onerror=()=>o&&o(null),r.onreadystatechange=()=>{if(r.readyState===cs.complete&&o){let l=this.parseJSON(r.responseText);o(l)}},a&&(r.ontimeout=a),r.send(s),r}static parseJSON(r){if(!r||r==="")return null;try{return JSON.parse(r)}catch{return console&&console.log("failed to parse JSON response",r),null}}static serialize(r,e){let t=[];for(var i in r){if(!Object.prototype.hasOwnProperty.call(r,i))continue;let s=e?`${e}[${i}]`:i,n=r[i];typeof n=="object"?t.push(this.serialize(n,s)):t.push(encodeURIComponent(s)+"="+encodeURIComponent(n))}return t.join("&")}static appendParams(r,e){if(Object.keys(e).length===0)return r;let t=r.match(/\?/)?"&":"?";return`${r}${t}${this.serialize(e)}`}},us=r=>{let e="",t=new Uint8Array(r),i=t.byteLength;for(let s=0;s<i;s++)e+=String.fromCharCode(t[s]);return btoa(e)},ve=class{constructor(r,e){e&&e.length===2&&e[1].startsWith(qt)&&(this.authToken=atob(e[1].slice(qt.length))),this.endPoint=null,this.token=null,this.skipHeartbeat=!0,this.reqs=new Set,this.awaitingBatchAck=!1,this.currentBatch=null,this.currentBatchTimer=null,this.batchBuffer=[],this.onopen=function(){},this.onerror=function(){},this.onmessage=function(){},this.onclose=function(){},this.pollEndpoint=this.normalizeEndpoint(r),this.readyState=G.connecting,setTimeout(()=>this.poll(),0)}normalizeEndpoint(r){return r.replace("ws://","http://").replace("wss://","https://").replace(new RegExp("(.*)/"+$t.websocket),"$1/"+$t.longpoll)}endpointURL(){return dt.appendParams(this.pollEndpoint,{token:this.token})}closeAndRetry(r,e,t){this.close(r,e,t),this.readyState=G.connecting}ontimeout(){this.onerror("timeout"),this.closeAndRetry(1005,"timeout",!1)}isActive(){return this.readyState===G.open||this.readyState===G.connecting}poll(){let r={Accept:"application/json"};this.authToken&&(r["X-Phoenix-AuthToken"]=this.authToken),this.ajax("GET",r,null,()=>this.ontimeout(),e=>{if(e){var{status:t,token:i,messages:s}=e;if(t===410&&this.token!==null){this.onerror(410),this.closeAndRetry(3410,"session_gone",!1);return}this.token=i}else t=0;switch(t){case 200:s.forEach(n=>{setTimeout(()=>this.onmessage({data:n}),0)}),this.poll();break;case 204:this.poll();break;case 410:this.readyState=G.open,this.onopen({}),this.poll();break;case 403:this.onerror(403),this.close(1008,"forbidden",!1);break;case 0:case 500:this.onerror(500),this.closeAndRetry(1011,"internal server error",500);break;default:throw new Error(`unhandled poll status ${t}`)}})}send(r){typeof r!="string"&&(r=us(r)),this.currentBatch?this.currentBatch.push(r):this.awaitingBatchAck?this.batchBuffer.push(r):(this.currentBatch=[r],this.currentBatchTimer=setTimeout(()=>{this.batchSend(this.currentBatch),this.currentBatch=null},0))}batchSend(r,e=0){this.awaitingBatchAck=!0;let t=e+ls,i=r.slice(e,t);this.ajax("POST",{"Content-Type":"application/x-ndjson"},i.join(`
`),()=>this.onerror("timeout"),s=>{!s||s.status!==200?(this.awaitingBatchAck=!1,this.onerror(s&&s.status),this.closeAndRetry(1011,"internal server error",!1)):t<r.length?this.batchSend(r,t):this.batchBuffer.length>0?(this.batchSend(this.batchBuffer),this.batchBuffer=[]):this.awaitingBatchAck=!1})}close(r,e,t){for(let s of this.reqs)s.abort();this.readyState=G.closed;let i=Object.assign({code:1e3,reason:void 0,wasClean:!0},{code:r,reason:e,wasClean:t});this.batchBuffer=[],clearTimeout(this.currentBatchTimer),this.currentBatchTimer=null,typeof CloseEvent<"u"?this.onclose(new CloseEvent("close",i)):this.onclose(i)}ajax(r,e,t,i,s){let n,a=()=>{this.reqs.delete(n),i()};n=dt.request(r,this.endpointURL(),e,t,this.timeout,a,o=>{this.reqs.delete(n),this.isActive()&&s(o)}),this.reqs.add(n)}},Lr=class Me{constructor(e,t={}){let i=t.events||{state:"presence_state",diff:"presence_diff"};this.state=Object.create(null),this.pendingDiffs=[],this.channel=e,this.joinRef=null,this.caller={onJoin:function(){},onLeave:function(){},onSync:function(){}},this.channel.on(i.state,s=>{let{onJoin:n,onLeave:a,onSync:o}=this.caller;this.joinRef=this.channel.joinRef(),this.state=Me.syncState(this.state,s,n,a),this.pendingDiffs.forEach(l=>{this.state=Me.syncDiff(this.state,l,n,a)}),this.pendingDiffs=[],o()}),this.channel.on(i.diff,s=>{let{onJoin:n,onLeave:a,onSync:o}=this.caller;this.inPendingSyncState()?this.pendingDiffs.push(s):(this.state=Me.syncDiff(this.state,s,n,a),o())})}onJoin(e){this.caller.onJoin=e}onLeave(e){this.caller.onLeave=e}onSync(e){this.caller.onSync=e}list(e){return Me.list(this.state,e)}inPendingSyncState(){return!this.joinRef||this.joinRef!==this.channel.joinRef()}static syncState(e,t,i,s){let n=this.toNullProtoObj(this.clone(e));t=this.toNullProtoObj(t);let a=Object.create(null),o=Object.create(null);return this.map(n,(l,c)=>{t[l]||(o[l]=c)}),this.map(t,(l,c)=>{let h=n[l];if(h){let u=c.metas.map(g=>g.phx_ref),f=h.metas.map(g=>g.phx_ref),d=c.metas.filter(g=>f.indexOf(g.phx_ref)<0),p=h.metas.filter(g=>u.indexOf(g.phx_ref)<0);d.length>0&&(a[l]=c,a[l].metas=d),p.length>0&&(o[l]=this.clone(h),o[l].metas=p)}else a[l]=c}),this.syncDiff(n,{joins:a,leaves:o},i,s)}static syncDiff(e,t,i,s){e=this.toNullProtoObj(e);let{joins:n,leaves:a}=this.clone(t);return i||(i=function(){}),s||(s=function(){}),this.map(n,(o,l)=>{let c=e[o];if(e[o]=this.clone(l),c){let h=e[o].metas.map(f=>f.phx_ref),u=c.metas.filter(f=>h.indexOf(f.phx_ref)<0);e[o].metas.unshift(...u)}i(o,c,l)}),this.map(a,(o,l)=>{let c=e[o];if(!c)return;let h=l.metas.map(u=>u.phx_ref);c.metas=c.metas.filter(u=>h.indexOf(u.phx_ref)<0),s(o,c,l),c.metas.length===0&&delete e[o]}),e}static list(e,t){return t||(t=function(i,s){return s}),this.map(e,(i,s)=>t(i,s))}static map(e,t){return Object.getOwnPropertyNames(e).map(i=>t(i,e[i]))}static toNullProtoObj(e){if(Object.getPrototypeOf(e)===null)return e;let t=Object.create(null);return Object.getOwnPropertyNames(e).forEach(i=>{t[i]=e[i]}),t}static clone(e){return JSON.parse(JSON.stringify(e))}},ut={HEADER_LENGTH:1,META_LENGTH:4,KINDS:{push:0,reply:1,broadcast:2},encode(r,e){if(r.payload.constructor===ArrayBuffer)return e(this.binaryEncode(r));{let t=[r.join_ref,r.ref,r.topic,r.event,r.payload];return e(JSON.stringify(t))}},decode(r,e){if(r.constructor===ArrayBuffer)return e(this.binaryDecode(r));{let[t,i,s,n,a]=JSON.parse(r);return e({join_ref:t,ref:i,topic:s,event:n,payload:a})}},binaryEncode(r){let{join_ref:e,ref:t,event:i,topic:s,payload:n}=r,a=new TextEncoder,o=a.encode(e),l=a.encode(t),c=a.encode(s),h=a.encode(i);this.assertFieldSize(o.byteLength,"join_ref"),this.assertFieldSize(l.byteLength,"ref"),this.assertFieldSize(c.byteLength,"topic"),this.assertFieldSize(h.byteLength,"event");let u=this.META_LENGTH+o.byteLength+l.byteLength+c.byteLength+h.byteLength,f=new ArrayBuffer(this.HEADER_LENGTH+u),d=new Uint8Array(f),p=new DataView(f),g=0;p.setUint8(g++,this.KINDS.push),p.setUint8(g++,o.byteLength),p.setUint8(g++,l.byteLength),p.setUint8(g++,c.byteLength),p.setUint8(g++,h.byteLength),d.set(o,g),g+=o.byteLength,d.set(l,g),g+=l.byteLength,d.set(c,g),g+=c.byteLength,d.set(h,g),g+=h.byteLength;var m=new Uint8Array(f.byteLength+n.byteLength);return m.set(d,0),m.set(new Uint8Array(n),f.byteLength),m.buffer},assertFieldSize(r,e){if(r>255)throw new Error(`unable to convert ${e} to binary: must be less than or equal to 255 bytes, but is ${r} bytes`)},binaryDecode(r){let e=new DataView(r),t=e.getUint8(0),i=new TextDecoder;switch(t){case this.KINDS.push:return this.decodePush(r,e,i);case this.KINDS.reply:return this.decodeReply(r,e,i);case this.KINDS.broadcast:return this.decodeBroadcast(r,e,i)}},decodePush(r,e,t){let i=e.getUint8(1),s=e.getUint8(2),n=e.getUint8(3),a=this.HEADER_LENGTH+this.META_LENGTH-1,o=t.decode(r.slice(a,a+i));a=a+i;let l=t.decode(r.slice(a,a+s));a=a+s;let c=t.decode(r.slice(a,a+n));a=a+n;let h=r.slice(a,r.byteLength);return{join_ref:o,ref:null,topic:l,event:c,payload:h}},decodeReply(r,e,t){let i=e.getUint8(1),s=e.getUint8(2),n=e.getUint8(3),a=e.getUint8(4),o=this.HEADER_LENGTH+this.META_LENGTH,l=t.decode(r.slice(o,o+i));o=o+i;let c=t.decode(r.slice(o,o+s));o=o+s;let h=t.decode(r.slice(o,o+n));o=o+n;let u=t.decode(r.slice(o,o+a));o=o+a;let f=r.slice(o,r.byteLength),d={status:u,response:f};return{join_ref:l,ref:c,topic:h,event:Y.reply,payload:d}},decodeBroadcast(r,e,t){let i=e.getUint8(1),s=e.getUint8(2),n=this.HEADER_LENGTH+2,a=t.decode(r.slice(n,n+i));n=n+i;let o=t.decode(r.slice(n,n+s));n=n+s;let l=r.slice(n,r.byteLength);return{join_ref:null,ref:null,topic:a,event:o,payload:l}}},Pr=class{constructor(r,e={}){this.stateChangeCallbacks={open:[],close:[],error:[],message:[]},this.channels=[],this.sendBuffer=[],this.ref=0,this.fallbackRef=null,this.timeout=e.timeout||as,this.transport=e.transport||H.WebSocket||ve,this.conn=void 0,this.primaryPassedHealthCheck=!1,this.longPollFallbackMs=e.longPollFallbackMs,this.fallbackTimer=null;let t=null;try{t=H&&H.sessionStorage}catch{}this.sessionStore=e.sessionStorage||t,this.establishedConnections=0,this.defaultEncoder=ut.encode.bind(ut),this.defaultDecoder=ut.decode.bind(ut),this.closeWasClean=!0,this.disconnecting=!1,this.binaryType=e.binaryType||"arraybuffer",this.connectClock=1,this.pageHidden=!1,this.encode=void 0,this.decode=void 0,this.transport!==ve?(this.encode=e.encode||this.defaultEncoder,this.decode=e.decode||this.defaultDecoder):(this.encode=this.defaultEncoder,this.decode=this.defaultDecoder);let i=null;be&&be.addEventListener&&(be.addEventListener("pagehide",s=>{this.conn&&(this.disconnect(),i=this.connectClock)}),be.addEventListener("pageshow",s=>{i===this.connectClock&&(i=null,this.connect())}),be.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"?this.pageHidden=!0:(this.pageHidden=!1,!this.isConnected()&&!this.closeWasClean&&this.teardown(()=>this.connect()))})),this.heartbeatIntervalMs=e.heartbeatIntervalMs||3e4,this.autoSendHeartbeat=e.autoSendHeartbeat??!0,this.heartbeatCallback=e.heartbeatCallback??(()=>{}),this.rejoinAfterMs=s=>e.rejoinAfterMs?e.rejoinAfterMs(s):[1e3,2e3,5e3][s-1]||1e4,this.reconnectAfterMs=s=>e.reconnectAfterMs?e.reconnectAfterMs(s):[10,50,100,150,200,250,500,1e3,2e3][s-1]||5e3,this.logger=e.logger||null,!this.logger&&e.debug&&(this.logger=(s,n,a)=>{console.log(`${s}: ${n}`,a)}),this.longpollerTimeout=e.longpollerTimeout||2e4,this.params=_e(e.params||{}),this.endPoint=`${r}/${$t.websocket}`,this.vsn=e.vsn||ns,this.heartbeatTimeoutTimer=null,this.heartbeatTimer=null,this.heartbeatSentAt=null,this.pendingHeartbeatRef=null,this.reconnectTimer=new jr(()=>{if(this.pageHidden){this.log("Not reconnecting as page is hidden!"),this.teardown();return}this.teardown(async()=>{e.beforeReconnect&&await e.beforeReconnect(),this.connect()})},this.reconnectAfterMs),this.authToken=e.authToken&&_e(e.authToken)}getLongPollTransport(){return ve}replaceTransport(r){this.connectClock++,this.closeWasClean=!0,clearTimeout(this.fallbackTimer),this.reconnectTimer.reset(),this.conn&&(this.conn.close(),this.conn=null),this.transport=r}protocol(){return location.protocol.match(/^https/)?"wss":"ws"}endPointURL(){let r=dt.appendParams(dt.appendParams(this.endPoint,this.params()),{vsn:this.vsn});return r.charAt(0)!=="/"?r:r.charAt(1)==="/"?`${this.protocol()}:${r}`:`${this.protocol()}://${location.host}${r}`}disconnect(r,e,t){this.connectClock++,this.disconnecting=!0,this.closeWasClean=!0,clearTimeout(this.fallbackTimer),this.reconnectTimer.reset(),this.teardown(()=>{this.disconnecting=!1,r&&r()},e,t)}connect(r){r&&(console&&console.log("passing params to connect is deprecated. Instead pass :params to the Socket constructor"),this.params=_e(r)),!(this.conn&&!this.disconnecting)&&(this.longPollFallbackMs&&this.transport!==ve?this.connectWithFallback(ve,this.longPollFallbackMs):this.transportConnect())}log(r,e,t){this.logger&&this.logger(r,e,t)}hasLogger(){return this.logger!==null}onOpen(r){let e=this.makeRef();return this.stateChangeCallbacks.open.push([e,r]),e}onClose(r){let e=this.makeRef();return this.stateChangeCallbacks.close.push([e,r]),e}onError(r){let e=this.makeRef();return this.stateChangeCallbacks.error.push([e,r]),e}onMessage(r){let e=this.makeRef();return this.stateChangeCallbacks.message.push([e,r]),e}onHeartbeat(r){this.heartbeatCallback=r}ping(r){if(!this.isConnected())return!1;let e=this.makeRef(),t=Date.now();this.push({topic:"phoenix",event:"heartbeat",payload:{},ref:e});let i=this.onMessage(s=>{s.ref===e&&(this.off([i]),r(Date.now()-t))});return!0}transportName(r){return r===ve?"LongPoll":r.name}transportConnect(){this.connectClock++,this.closeWasClean=!1;let r;this.authToken&&(r=["phoenix",`${qt}${btoa(this.authToken()).replace(/=/g,"")}`]),this.conn=new this.transport(this.endPointURL(),r),this.conn.binaryType=this.binaryType,this.conn.timeout=this.longpollerTimeout,this.conn.onopen=()=>this.onConnOpen(),this.conn.onerror=e=>this.onConnError(e),this.conn.onmessage=e=>this.onConnMessage(e),this.conn.onclose=e=>this.onConnClose(e)}getSession(r){return this.sessionStore&&this.sessionStore.getItem(r)}storeSession(r,e){this.sessionStore&&this.sessionStore.setItem(r,e)}connectWithFallback(r,e=2500){clearTimeout(this.fallbackTimer);let t=!1,i=!0,s,n,a=this.transportName(r),o=l=>{this.log("transport",`falling back to ${a}...`,l),this.off([s,n]),i=!1,this.replaceTransport(r),this.transportConnect()};if(this.getSession(`phx:fallback:${a}`))return o("memorized");this.fallbackTimer=setTimeout(o,e),n=this.onError(l=>{this.log("transport","error",l),i&&!t&&(clearTimeout(this.fallbackTimer),o(l))}),this.fallbackRef&&this.off([this.fallbackRef]),this.fallbackRef=this.onOpen(()=>{if(t=!0,!i){let l=this.transportName(r);return this.primaryPassedHealthCheck||this.storeSession(`phx:fallback:${l}`,"true"),this.log("transport",`established ${l} fallback`)}clearTimeout(this.fallbackTimer),this.fallbackTimer=setTimeout(o,e),this.ping(l=>{this.log("transport","connected to primary after",l),this.primaryPassedHealthCheck=!0,clearTimeout(this.fallbackTimer)})}),this.transportConnect()}clearHeartbeats(){clearTimeout(this.heartbeatTimer),clearTimeout(this.heartbeatTimeoutTimer)}onConnOpen(){this.hasLogger()&&this.log("transport",`connected to ${this.endPointURL()}`),this.closeWasClean=!1,this.disconnecting=!1,this.establishedConnections++,this.flushSendBuffer(),this.reconnectTimer.reset(),this.autoSendHeartbeat&&this.resetHeartbeat(),this.triggerStateCallbacks("open")}heartbeatTimeout(){if(this.pendingHeartbeatRef){this.pendingHeartbeatRef=null,this.heartbeatSentAt=null,this.hasLogger()&&this.log("transport","heartbeat timeout. Attempting to re-establish connection");try{this.heartbeatCallback("timeout")}catch(r){this.log("error","error in heartbeat callback",r)}this.triggerChanError(new Error("heartbeat timeout")),this.closeWasClean=!1,this.teardown(()=>this.reconnectTimer.scheduleTimeout(),os,"heartbeat timeout")}}resetHeartbeat(){this.conn&&this.conn.skipHeartbeat||(this.pendingHeartbeatRef=null,this.clearHeartbeats(),this.heartbeatTimer=setTimeout(()=>this.sendHeartbeat(),this.heartbeatIntervalMs))}teardown(r,e,t){if(!this.conn)return r&&r();let i=this.conn;this.waitForBufferDone(i,()=>{e?i.close(e,t||""):i.close(),this.waitForSocketClosed(i,()=>{this.conn===i&&(this.conn.onopen=function(){},this.conn.onerror=function(){},this.conn.onmessage=function(){},this.conn.onclose=function(){},this.conn=null),r&&r()})})}waitForBufferDone(r,e,t=1){if(t===5||!r.bufferedAmount){e();return}setTimeout(()=>{this.waitForBufferDone(r,e,t+1)},150*t)}waitForSocketClosed(r,e,t=1){if(t===5||r.readyState===G.closed){e();return}setTimeout(()=>{this.waitForSocketClosed(r,e,t+1)},150*t)}onConnClose(r){this.conn&&(this.conn.onclose=()=>{}),this.hasLogger()&&this.log("transport","close",r),this.triggerChanError(r),this.clearHeartbeats(),this.closeWasClean||this.reconnectTimer.scheduleTimeout(),this.triggerStateCallbacks("close",r)}onConnError(r){this.hasLogger()&&this.log("transport","error",r);let e=this.transport,t=this.establishedConnections;this.triggerStateCallbacks("error",r,e,t),(e===this.transport||t>0)&&this.triggerChanError(r)}triggerChanError(r){this.channels.forEach(e=>{e.isErrored()||e.isLeaving()||e.isClosed()||e.trigger(Y.error,r)})}connectionState(){switch(this.conn&&this.conn.readyState){case G.connecting:return"connecting";case G.open:return"open";case G.closing:return"closing";default:return"closed"}}isConnected(){return this.connectionState()==="open"}remove(r){this.off(r.stateChangeRefs),this.channels=this.channels.filter(e=>e!==r)}off(r){for(let e in this.stateChangeCallbacks)this.stateChangeCallbacks[e]=this.stateChangeCallbacks[e].filter(([t])=>r.indexOf(t)===-1)}channel(r,e={}){let t=new hs(r,e,this);return this.channels.push(t),t}push(r){if(this.hasLogger()){let{topic:e,event:t,payload:i,ref:s,join_ref:n}=r;this.log("push",`${e} ${t} (${n}, ${s})`,i)}this.isConnected()?this.encode(r,e=>this.conn.send(e)):this.sendBuffer.push(()=>this.encode(r,e=>this.conn.send(e)))}makeRef(){let r=this.ref+1;return r===this.ref?this.ref=0:this.ref=r,this.ref.toString()}sendHeartbeat(){if(!this.isConnected()){try{this.heartbeatCallback("disconnected")}catch(r){this.log("error","error in heartbeat callback",r)}return}if(this.pendingHeartbeatRef){this.heartbeatTimeout();return}this.pendingHeartbeatRef=this.makeRef(),this.heartbeatSentAt=Date.now(),this.push({topic:"phoenix",event:"heartbeat",payload:{},ref:this.pendingHeartbeatRef});try{this.heartbeatCallback("sent")}catch(r){this.log("error","error in heartbeat callback",r)}this.heartbeatTimeoutTimer=setTimeout(()=>this.heartbeatTimeout(),this.heartbeatIntervalMs)}flushSendBuffer(){this.isConnected()&&this.sendBuffer.length>0&&(this.sendBuffer.forEach(r=>r()),this.sendBuffer=[])}onConnMessage(r){this.decode(r.data,e=>{let{topic:t,event:i,payload:s,ref:n,join_ref:a}=e;if(n&&n===this.pendingHeartbeatRef){let o=this.heartbeatSentAt?Date.now()-this.heartbeatSentAt:void 0;this.clearHeartbeats();try{this.heartbeatCallback(s.status==="ok"?"ok":"error",o)}catch(l){this.log("error","error in heartbeat callback",l)}this.pendingHeartbeatRef=null,this.heartbeatSentAt=null,this.autoSendHeartbeat&&(this.heartbeatTimer=setTimeout(()=>this.sendHeartbeat(),this.heartbeatIntervalMs))}this.hasLogger()&&this.log("receive",`${s.status||""} ${t} ${i} ${n&&"("+n+")"||""}`.trim(),s);for(let o=0;o<this.channels.length;o++){let l=this.channels[o];l.isMember(t,i,s,a)&&l.trigger(i,s,n,a)}this.triggerStateCallbacks("message",e)})}triggerStateCallbacks(r,...e){try{this.stateChangeCallbacks[r].forEach(([t,i])=>{try{i(...e)}catch(s){this.log("error",`error in ${r} callback`,s)}})}catch(t){this.log("error",`error triggering ${r} callbacks`,t)}}leaveOpenTopic(r){let e=this.channels.find(t=>t.topic===r&&(t.isJoined()||t.isJoining()));e&&(this.hasLogger()&&this.log("transport",`leaving duplicate topic "${r}"`),e.leave())}};var Fe=class r{constructor(e,t){let i=fs(t);this.presence=new Lr(e.getChannel(),i),this.presence.onJoin((s,n,a)=>{let o=r.onJoinPayload(s,n,a);e.getChannel().trigger("presence",o)}),this.presence.onLeave((s,n,a)=>{let o=r.onLeavePayload(s,n,a);e.getChannel().trigger("presence",o)}),this.presence.onSync(()=>{e.getChannel().trigger("presence",{event:"sync"})})}get state(){return r.transformState(this.presence.state)}static transformState(e){return e=ds(e),Object.getOwnPropertyNames(e).reduce((t,i)=>{let s=e[i];return t[i]=ft(s),t},{})}static onJoinPayload(e,t,i){let s=Br(t),n=ft(i);return{event:"join",key:e,currentPresences:s,newPresences:n}}static onLeavePayload(e,t,i){let s=Br(t),n=ft(i);return{event:"leave",key:e,currentPresences:s,leftPresences:n}}};function ft(r){return r.metas.map(e=>{let t=Object.getOwnPropertyDescriptors(e),i=Object.defineProperties({},t);return i.presence_ref=i.phx_ref,delete i.phx_ref,delete i.phx_ref_prev,i})}function ds(r){return JSON.parse(JSON.stringify(r))}function fs(r){return r?.events&&{events:r.events}}function Br(r){return r?.metas?ft(r):[]}var Ht;(function(r){r.SYNC="sync",r.JOIN="join",r.LEAVE="leave"})(Ht||(Ht={}));var xe=class{get state(){return this.presenceAdapter.state}constructor(e,t){this.channel=e,this.presenceAdapter=new Fe(this.channel.channelAdapter,t)}};function Nr(r){if(r instanceof Error)return r;if(typeof r=="string")return new Error(r);if(r&&typeof r=="object"){let e=r;if(typeof e.code=="number"){let t=typeof e.reason=="string"&&e.reason?` (${e.reason})`:"";return new Error(`socket closed: ${e.code}${t}`,{cause:r})}return new Error("channel error: transport failure",{cause:r})}return new Error("channel error: connection lost")}var De=class{constructor(e,t,i){let s=ps(i);this.channel=e.getSocket().channel(t,s),this.socket=e}get state(){return this.channel.state}set state(e){this.channel.state=e}get joinedOnce(){return this.channel.joinedOnce}get joinPush(){return this.channel.joinPush}get rejoinTimer(){return this.channel.rejoinTimer}on(e,t){return this.channel.on(e,t)}off(e,t){this.channel.off(e,t)}subscribe(e){return this.channel.join(e)}unsubscribe(e){return this.channel.leave(e)}teardown(){this.channel.teardown()}onClose(e){this.channel.onClose(e)}onError(e){return this.channel.onError(e)}push(e,t,i){let s;try{s=this.channel.push(e,t,i)}catch{throw new Error(`tried to push '${e}' to '${this.channel.topic}' before joining. Use channel.subscribe() before pushing events`)}if(this.channel.pushBuffer.length>Rr){let n=this.channel.pushBuffer.shift();n.cancelTimeout(),this.socket.log("channel",`discarded push due to buffer overflow: ${n.event}`,n.payload())}return s}updateJoinPayload(e){let t=this.channel.joinPush.payload();this.channel.joinPush.payload=()=>Object.assign(Object.assign({},t),e)}canPush(){return this.socket.isConnected()&&this.state===q.joined}isJoined(){return this.state===q.joined}isJoining(){return this.state===q.joining}isClosed(){return this.state===q.closed}isLeaving(){return this.state===q.leaving}updateFilterBindings(e){this.channel.filterBindings=e}updatePayloadTransform(e){this.channel.onMessage=e}getChannel(){return this.channel}};function ps(r){return{config:Object.assign({broadcast:{ack:!1,self:!1},presence:{key:"",enabled:!1},private:!1},r.config)}}var gs=/[,()"\\]/,ms=r=>gs.test(r)||r!==r.trim(),ys=r=>`"${r.replace(/\\/g,"\\\\").replace(/"/g,'\\"')}"`,Ur=r=>{let e=r===null?"null":String(r);return ms(e)?ys(e):e},ws=r=>r===null?"null":String(r),vs=(r,e)=>{if(r==="in"){let t=Array.isArray(e)?e:[e];if(t.length===0)throw new Error("Realtime `in` filter requires at least one value.");return`in.(${Array.from(new Set(t)).map(s=>Ur(s)).join(",")})`}return r==="is"?`is.${ws(e)}`:`${r}.${Ur(e)}`},ke=class{constructor(){this.filters=[]}add(e,t,i,s=!1){let n=s?"not.":"";return this.filters.push(`${e}=${n}${vs(t,i)}`),this}eq(e,t){return this.add(e,"eq",t)}neq(e,t){return this.add(e,"neq",t)}gt(e,t){return this.add(e,"gt",t)}gte(e,t){return this.add(e,"gte",t)}lt(e,t){return this.add(e,"lt",t)}lte(e,t){return this.add(e,"lte",t)}in(e,t){return this.add(e,"in",t)}like(e,t){return this.add(e,"like",t)}ilike(e,t){return this.add(e,"ilike",t)}match(e,t){return this.add(e,"match",t)}imatch(e,t){return this.add(e,"imatch",t)}is(e,t){return this.add(e,"is",t)}isDistinct(e,t){return this.add(e,"isdistinct",t)}not(e,t,i){return this.add(e,t,i,!0)}build(){return this.filters.join(",")}toString(){return this.build()}};var Gt;(function(r){r.ALL="*",r.INSERT="INSERT",r.UPDATE="UPDATE",r.DELETE="DELETE"})(Gt||(Gt={}));var te;(function(r){r.BROADCAST="broadcast",r.PRESENCE="presence",r.POSTGRES_CHANGES="postgres_changes",r.SYSTEM="system"})(te||(te={}));var K;(function(r){r.SUBSCRIBED="SUBSCRIBED",r.TIMED_OUT="TIMED_OUT",r.CLOSED="CLOSED",r.CHANNEL_ERROR="CHANNEL_ERROR"})(K||(K={}));var Ee=class r{get state(){return this.channelAdapter.state}set state(e){this.channelAdapter.state=e}get joinedOnce(){return this.channelAdapter.joinedOnce}get timeout(){return this.socket.timeout}get joinPush(){return this.channelAdapter.joinPush}get rejoinTimer(){return this.channelAdapter.rejoinTimer}constructor(e,t={config:{}},i){var s,n;if(this.topic=e,this.params=t,this.socket=i,this.bindings={},this.subTopic=e.replace(/^realtime:/i,""),this.params.config=Object.assign({broadcast:{ack:!1,self:!1},presence:{key:"",enabled:!1},private:!1},t.config),this.channelAdapter=new De(this.socket.socketAdapter,e,this.params),this.presence=new xe(this),this._onClose(()=>{this.socket._remove(this)}),this._updateFilterTransform(),this.broadcastEndpointURL=ct(this.socket.socketAdapter.endPointURL()),this.private=this.params.config.private||!1,!this.private&&(!((n=(s=this.params.config)===null||s===void 0?void 0:s.broadcast)===null||n===void 0)&&n.replay))throw new Error(`tried to use replay on public channel '${this.topic}'. It must be a private channel.`)}subscribe(e,t=this.timeout){var i,s,n;if(this.socket.isConnected()||this.socket.connect(),this.channelAdapter.isClosed()){let{config:{broadcast:a,presence:o,private:l}}=this.params,c=(s=(i=this.bindings.postgres_changes)===null||i===void 0?void 0:i.map(d=>d.filter))!==null&&s!==void 0?s:[],h=!!this.bindings[te.PRESENCE]&&this.bindings[te.PRESENCE].length>0||((n=this.params.config.presence)===null||n===void 0?void 0:n.enabled)===!0,u={},f={broadcast:a,presence:Object.assign(Object.assign({},o),{enabled:h}),postgres_changes:c,private:l};this.socket.accessTokenValue&&(u.access_token=this.socket.accessTokenValue),this._onError(d=>{e?.(K.CHANNEL_ERROR,Nr(d))}),this._onClose(()=>e?.(K.CLOSED)),this.updateJoinPayload(Object.assign({config:f},u)),this._updateFilterMessage(),this.channelAdapter.subscribe(t).receive("ok",async({postgres_changes:d})=>{if(this.socket._isManualToken()||this.socket.setAuth(),d===void 0){e?.(K.SUBSCRIBED);return}this._updatePostgresBindings(d,e)}).receive("error",d=>{this.state=q.errored;let p=Object.values(d).join(", ")||"error";e?.(K.CHANNEL_ERROR,new Error(p,{cause:d}))}).receive("timeout",()=>{e?.(K.TIMED_OUT)})}return this}_updatePostgresBindings(e,t){var i;let s=this.bindings.postgres_changes,n=(i=s?.length)!==null&&i!==void 0?i:0,a=[];for(let o=0;o<n;o++){let l=s[o],{filter:{event:c,schema:h,table:u,filter:f}}=l,d=e&&e[o];if(d&&d.event===c&&r.isFilterValueEqual(d.schema,h)&&r.isFilterValueEqual(d.table,u)&&r.isFilterValueEqual(d.filter,f))a.push(Object.assign(Object.assign({},l),{id:d.id}));else{this.unsubscribe(),this.state=q.errored,t?.(K.CHANNEL_ERROR,new Error("mismatch between server and client bindings for postgres changes"));return}}this.bindings.postgres_changes=a,this.state!=q.errored&&t&&t(K.SUBSCRIBED)}presenceState(){return this.presence.state}async track(e,t={}){return await this.send({type:"presence",event:"track",payload:e},t)}async untrack(e={}){return await this.send({type:"presence",event:"untrack"},e)}on(e,t,i){let s=this.channelAdapter.isJoined()||this.channelAdapter.isJoining(),n=e===te.PRESENCE||e===te.POSTGRES_CHANGES;if(s&&n)throw this.socket.log("channel",`cannot add \`${e}\` callbacks for ${this.topic} after \`subscribe()\`.`),new Error(`cannot add \`${e}\` callbacks for ${this.topic} after \`subscribe()\`.`);return this._on(e,t,i)}async httpSend(e,t,i={}){var s;if(t==null)return Promise.reject(new Error("Payload is required for httpSend()"));let n=t instanceof ArrayBuffer||ArrayBuffer.isView(t),a={apikey:this.socket.apiKey?this.socket.apiKey:"","Content-Type":n?"application/octet-stream":"application/json"};this.socket.accessTokenValue&&(a.Authorization=`Bearer ${this.socket.accessTokenValue}`);let o=new URL(this.broadcastEndpointURL);o.pathname+=`/${encodeURIComponent(this.subTopic)}/events/${encodeURIComponent(e)}`,this.private&&o.searchParams.set("private","true");let l={method:"POST",headers:a,body:n?t:JSON.stringify(t)},c=await this._fetchWithTimeout(o.toString(),l,(s=i.timeout)!==null&&s!==void 0?s:this.timeout);if(c.status===202)return{success:!0};if(c.status===404)return Promise.reject(new Error("httpSend() requires Realtime server v2.97.0 or newer; the endpoint returned 404. Update your Supabase CLI to a recent version, or upgrade the Realtime server in your self-hosted setup. See https://github.com/supabase/supabase-js/blob/master/packages/core/realtime-js/migrations/httpsend-server-version.md"));let h=c.statusText;try{let u=await c.json();h=u.error||u.message||h}catch{}return Promise.reject(new Error(h))}async send(e,t={}){var i,s;if(!this.channelAdapter.canPush()&&e.type==="broadcast"){let n="Realtime send() is automatically falling back to REST API. This behavior will be deprecated in the future. Please use httpSend() explicitly for REST delivery.";this.socket.hasLogger()?this.socket.log("channel",n):console.warn(n);let{event:a,payload:o}=e,l={apikey:this.socket.apiKey?this.socket.apiKey:"","Content-Type":"application/json"};this.socket.accessTokenValue&&(l.Authorization=`Bearer ${this.socket.accessTokenValue}`);let c={method:"POST",headers:l,body:JSON.stringify({messages:[{topic:this.subTopic,event:a,payload:o,private:this.private}]})};try{let h=await this._fetchWithTimeout(this.broadcastEndpointURL,c,(i=t.timeout)!==null&&i!==void 0?i:this.timeout);return await((s=h.body)===null||s===void 0?void 0:s.cancel()),h.ok?"ok":"error"}catch(h){return h instanceof Error&&h.name==="AbortError"?"timed out":"error"}}else return new Promise(n=>{var a,o,l;let c=this.channelAdapter.push(e.type,e,t.timeout||this.timeout);e.type==="broadcast"&&!(!((l=(o=(a=this.params)===null||a===void 0?void 0:a.config)===null||o===void 0?void 0:o.broadcast)===null||l===void 0)&&l.ack)&&n("ok"),c.receive("ok",()=>n("ok")),c.receive("error",()=>n("error")),c.receive("timeout",()=>n("timed out"))})}updateJoinPayload(e){this.channelAdapter.updateJoinPayload(e)}async unsubscribe(e=this.timeout){return new Promise(t=>{this.channelAdapter.unsubscribe(e).receive("ok",()=>t("ok")).receive("timeout",()=>t("timed out")).receive("error",()=>t("error"))})}teardown(){this.channelAdapter.teardown()}async _fetchWithTimeout(e,t,i){let s=new AbortController,n=setTimeout(()=>s.abort(),i),a=await this.socket.fetch(e,Object.assign(Object.assign({},t),{signal:s.signal}));return clearTimeout(n),a}_on(e,t,i){var s;let n=e.toLocaleLowerCase(),a=t?.filter;if((a instanceof ke||typeof a=="object"&&a!==null&&typeof a.build=="function")&&(t=Object.assign(Object.assign({},t),{filter:a.build()})),n===te.POSTGRES_CHANGES&&((s=this.bindings[n])===null||s===void 0?void 0:s.find(h=>r.isSamePostgresFilter(h.filter,t))))return this.socket.log("error",`duplicate \`postgres_changes\` binding for ${this.topic} ignored`,t),this;let o=this.channelAdapter.on(e,i),l={type:n,filter:t,callback:i,ref:o};return this.bindings[n]?this.bindings[n].push(l):this.bindings[n]=[l],this._updateFilterMessage(),this}_onClose(e){this.channelAdapter.onClose(e)}_onError(e){this.channelAdapter.onError(e)}_updateFilterMessage(){this.channelAdapter.updateFilterBindings((e,t,i)=>{var s,n,a,o,l,c,h;let u=e.event.toLocaleLowerCase();if(this._notThisChannelEvent(u,i))return!1;let f=(s=this.bindings[u])===null||s===void 0?void 0:s.find(d=>d.ref===e.ref);if(!f)return!0;if(["broadcast","presence","postgres_changes"].includes(u))if("id"in f){let d=f.id,p=(n=f.filter)===null||n===void 0?void 0:n.event;return d&&((a=t.ids)===null||a===void 0?void 0:a.includes(d))&&(p==="*"||p?.toLocaleLowerCase()===((o=t.data)===null||o===void 0?void 0:o.type.toLocaleLowerCase()))}else{let d=(c=(l=f?.filter)===null||l===void 0?void 0:l.event)===null||c===void 0?void 0:c.toLocaleLowerCase();return d==="*"||d===((h=t?.event)===null||h===void 0?void 0:h.toLocaleLowerCase())}else return f.type.toLocaleLowerCase()===u})}_notThisChannelEvent(e,t){let{close:i,error:s,leave:n,join:a}=lt;return t&&[i,s,n,a].includes(e)&&t!==this.joinPush.ref}_updateFilterTransform(){this.channelAdapter.updatePayloadTransform((e,t,i)=>{if(typeof t=="object"&&"ids"in t){let s=t.data,{schema:n,table:a,commit_timestamp:o,type:l,errors:c}=s;return Object.assign(Object.assign({},{schema:n,table:a,commit_timestamp:o,eventType:l,new:{},old:{},errors:c}),this._getPayloadRecords(s))}return t})}copyBindings(e){if(this.joinedOnce)throw new Error("cannot copy bindings into joined channel");for(let t in e.bindings)for(let i of e.bindings[t])this._on(i.type,i.filter,i.callback)}static isFilterValueEqual(e,t){return(e??void 0)===(t??void 0)}static isSamePostgresFilter(e,t){var i,s,n,a;let o=(s=(i=e?.select)===null||i===void 0?void 0:i.join())!==null&&s!==void 0?s:void 0,l=(a=(n=t?.select)===null||n===void 0?void 0:n.join())!==null&&a!==void 0?a:void 0;return e?.event===t?.event&&r.isFilterValueEqual(e?.schema,t?.schema)&&r.isFilterValueEqual(e?.table,t?.table)&&r.isFilterValueEqual(e?.filter,t?.filter)&&o===l}_getPayloadRecords(e){let t={new:{},old:{}};return(e.type==="INSERT"||e.type==="UPDATE")&&(t.new=Dt(e.columns,e.record)),(e.type==="UPDATE"||e.type==="DELETE")&&(t.old=Dt(e.columns,e.old_record)),t}};var $e=class{constructor(e,t){this.socket=new Pr(e,t)}get timeout(){return this.socket.timeout}get endPoint(){return this.socket.endPoint}get transport(){return this.socket.transport}get heartbeatIntervalMs(){return this.socket.heartbeatIntervalMs}get heartbeatCallback(){return this.socket.heartbeatCallback}set heartbeatCallback(e){this.socket.heartbeatCallback=e}get heartbeatTimer(){return this.socket.heartbeatTimer}get pendingHeartbeatRef(){return this.socket.pendingHeartbeatRef}get reconnectTimer(){return this.socket.reconnectTimer}get vsn(){return this.socket.vsn}get encode(){return this.socket.encode}get decode(){return this.socket.decode}get reconnectAfterMs(){return this.socket.reconnectAfterMs}get sendBuffer(){return this.socket.sendBuffer}get stateChangeCallbacks(){return this.socket.stateChangeCallbacks}connect(){this.socket.connect()}disconnect(e,t,i,s=1e4){return new Promise(n=>{setTimeout(()=>n("timeout"),s),this.socket.disconnect(()=>{e(),n("ok")},t,i)})}push(e){this.socket.push(e)}log(e,t,i){this.socket.log(e,t,i)}hasLogger(){return this.socket.hasLogger()}makeRef(){return this.socket.makeRef()}onOpen(e){this.socket.onOpen(e)}onClose(e){this.socket.onClose(e)}onError(e){this.socket.onError(e)}onMessage(e){this.socket.onMessage(e)}isConnected(){return this.socket.isConnected()}isConnecting(){return this.socket.connectionState()==Ne.connecting}isDisconnecting(){return this.socket.connectionState()==Ne.closing}connectionState(){return this.socket.connectionState()}endPointURL(){return this.socket.endPointURL()}sendHeartbeat(){this.socket.sendHeartbeat()}getSocket(){return this.socket}};var Mr={HEARTBEAT_INTERVAL:25e3,RECONNECT_DELAY:10,HEARTBEAT_TIMEOUT_FALLBACK:100},_s=[1e3,2e3,5e3,1e4],xs=1e4;function ks(){let r=new Map;return{get length(){return r.size},clear(){r.clear()},getItem(e){return r.has(e)?r.get(e):null},key(e){var t;return(t=Array.from(r.keys())[e])!==null&&t!==void 0?t:null},removeItem(e){r.delete(e)},setItem(e,t){r.set(e,String(t))}}}function Es(){try{if(typeof globalThis<"u"&&globalThis.sessionStorage)return globalThis.sessionStorage}catch{}return ks()}var Ss=`
  addEventListener("message", (e) => {
    if (e.data.event === "start") {
      setInterval(() => postMessage({ event: "keepAlive" }), e.data.interval);
    }
  });`,Se=class{get endPoint(){return this.socketAdapter.endPoint}get timeout(){return this.socketAdapter.timeout}get transport(){return this.socketAdapter.transport}get heartbeatCallback(){return this.socketAdapter.heartbeatCallback}get heartbeatIntervalMs(){return this.socketAdapter.heartbeatIntervalMs}get heartbeatTimer(){return this.worker?this._workerHeartbeatTimer:this.socketAdapter.heartbeatTimer}get pendingHeartbeatRef(){return this.worker?this._pendingWorkerHeartbeatRef:this.socketAdapter.pendingHeartbeatRef}get reconnectTimer(){return this.socketAdapter.reconnectTimer}get vsn(){return this.socketAdapter.vsn}get encode(){return this.socketAdapter.encode}get decode(){return this.socketAdapter.decode}get reconnectAfterMs(){return this.socketAdapter.reconnectAfterMs}get sendBuffer(){return this.socketAdapter.sendBuffer}get stateChangeCallbacks(){return this.socketAdapter.stateChangeCallbacks}constructor(e,t){var i;if(this.channels=new Array,this.accessTokenValue=null,this.accessToken=null,this.apiKey=null,this.httpEndpoint="",this.headers={},this.params={},this.ref=0,this.serializer=new Ue,this._manuallySetToken=!1,this._authPromise=null,this._authGeneration=0,this._workerHeartbeatTimer=void 0,this._pendingWorkerHeartbeatRef=null,this._pendingDisconnectTimer=null,this._disconnectOnEmptyChannelsAfterMs=0,this._resolveFetch=n=>n?(...a)=>n(...a):(...a)=>fetch(...a),!(!((i=t?.params)===null||i===void 0)&&i.apikey))throw new Error("API key is required to connect to Realtime");this.apiKey=t.params.apikey;let s=this._initializeOptions(t);this.socketAdapter=new $e(e,s),this.httpEndpoint=ct(e),this.fetch=this._resolveFetch(t?.fetch)}connect(){if(!(this.isConnecting()||this.isDisconnecting()||this.isConnected())){this.accessToken&&!this._authPromise&&this._setAuthSafely("connect"),this._setupConnectionHandlers();try{this.socketAdapter.connect()}catch(e){let t=e.message;throw new Error(`WebSocket not available: ${t}`)}this._handleNodeJsRaceCondition()}}endpointURL(){return this.socketAdapter.endPointURL()}async disconnect(e,t){return this._cancelPendingDisconnect(),this.isDisconnecting()?"ok":await this.socketAdapter.disconnect(()=>{clearInterval(this._workerHeartbeatTimer),this._terminateWorker()},e,t)}getChannels(){return this.channels}async removeChannel(e){let t=await e.unsubscribe();return t==="ok"&&e.teardown(),t}async removeAllChannels(){let e=this.channels.map(async i=>{let s=await i.unsubscribe();return i.teardown(),s}),t=await Promise.all(e);return await this.disconnect(),t}log(e,t,i){this.socketAdapter.log(e,t,i)}hasLogger(){return this.socketAdapter.hasLogger()}connectionState(){return this.socketAdapter.connectionState()||Ne.closed}isConnected(){return this.socketAdapter.isConnected()}isConnecting(){return this.socketAdapter.isConnecting()}isDisconnecting(){return this.socketAdapter.isDisconnecting()}channel(e,t={config:{}}){let i=`realtime:${e}`,s=this.getChannels().find(n=>n.topic===i);if(s)return s;{let n=new Ee(`realtime:${e}`,t,this);return this._cancelPendingDisconnect(),this.channels.push(n),n}}push(e){this.socketAdapter.push(e)}async setAuth(e=null){let t=++this._authGeneration,i=this._performAuth(e,t);t===this._authGeneration&&(this._authPromise=i);try{await i}finally{this._authPromise===i&&(this._authPromise=null)}}_isManualToken(){return this._manuallySetToken}async sendHeartbeat(){this.socketAdapter.sendHeartbeat()}onHeartbeat(e){this.socketAdapter.heartbeatCallback=this._wrapHeartbeatCallback(e)}_makeRef(){return this.socketAdapter.makeRef()}_remove(e){this.channels=this.channels.filter(t=>t.topic!==e.topic),this.channels.length===0&&(this.log("transport","no channels remaining, scheduling disconnect"),this._schedulePendingDisconnect())}_schedulePendingDisconnect(){if(this._cancelPendingDisconnect(),this._disconnectOnEmptyChannelsAfterMs===0){this.log("transport","disconnecting immediately - no channels"),this.disconnect();return}this._pendingDisconnectTimer=setTimeout(()=>{this._pendingDisconnectTimer=null,this.channels.length===0&&(this.log("transport","deferred disconnect fired - no channels, disconnecting"),this.disconnect())},this._disconnectOnEmptyChannelsAfterMs),this.log("transport",`deferred disconnect scheduled in ${this._disconnectOnEmptyChannelsAfterMs}ms`)}_cancelPendingDisconnect(){this._pendingDisconnectTimer!==null&&(this.log("transport","pending disconnect cancelled - channel activity detected"),clearTimeout(this._pendingDisconnectTimer),this._pendingDisconnectTimer=null)}async _performAuth(e,t){let i,s=!1;if(e)i=e,s=!0;else if(this.accessToken)try{i=await this.accessToken()}catch(n){this.log("error","Error fetching access token from callback",n),i=this.accessTokenValue}else i=this.accessTokenValue;t===this._authGeneration&&(this.accessToken?this._manuallySetToken=!1:s&&(this._manuallySetToken=!0),this.accessTokenValue!=i&&(this.accessTokenValue=i,this.channels.forEach(n=>{let a={access_token:i,version:Ar};n.updateJoinPayload(a),n.joinedOnce&&n.channelAdapter.isJoined()&&n.channelAdapter.push(lt.access_token,{access_token:i})})))}async _waitForAuthIfNeeded(){this._authPromise&&await this._authPromise}_setAuthSafely(e="general"){this._isManualToken()||this.setAuth().catch(t=>{this.log("error",`Error setting auth in ${e}`,t)})}_setupConnectionHandlers(){this.socketAdapter.onOpen(()=>{(this._authPromise||(this.accessToken&&!this.accessTokenValue?this.setAuth():Promise.resolve())).catch(t=>{this.log("error","error waiting for auth on connect",t)}),this.worker&&!this.workerRef&&this._startWorkerHeartbeat()}),this.socketAdapter.onClose(()=>{this.worker&&this.workerRef&&this._terminateWorker()}),this.socketAdapter.onMessage(e=>{e.ref&&e.ref===this._pendingWorkerHeartbeatRef&&(this._pendingWorkerHeartbeatRef=null)})}_handleNodeJsRaceCondition(){this.socketAdapter.isConnected()&&this.socketAdapter.getSocket().onConnOpen()}_wrapHeartbeatCallback(e){return(t,i)=>{t!=="disconnected"&&(t=="sent"&&this._setAuthSafely(),e&&e(t,i))}}_startWorkerHeartbeat(){this.workerUrl?this.log("worker",`starting worker for from ${this.workerUrl}`):this.log("worker","starting default worker");let e=this._workerObjectUrl(this.workerUrl);this.workerRef=new Worker(e),this.workerRef.onerror=t=>{this.log("worker","worker error",t.message),this._terminateWorker(),this.disconnect()},this.workerRef.onmessage=t=>{t.data.event==="keepAlive"&&this.sendHeartbeat()},this.workerRef.postMessage({event:"start",interval:this.heartbeatIntervalMs})}_terminateWorker(){this.workerRef&&(this.log("worker","terminating worker"),this.workerRef.terminate(),this.workerRef=void 0)}_workerObjectUrl(e){let t;if(e)t=e;else{let i=new Blob([Ss],{type:"application/javascript"});t=URL.createObjectURL(i)}return t}_initializeOptions(e){var t,i,s,n,a,o,l,c,h,u,f,d;this.worker=(t=e?.worker)!==null&&t!==void 0?t:!1,this.accessToken=(i=e?.accessToken)!==null&&i!==void 0?i:null;let p={};p.timeout=(s=e?.timeout)!==null&&s!==void 0?s:Cr,p.heartbeatIntervalMs=(n=e?.heartbeatIntervalMs)!==null&&n!==void 0?n:Mr.HEARTBEAT_INTERVAL,this._disconnectOnEmptyChannelsAfterMs=(a=e?.disconnectOnEmptyChannelsAfterMs)!==null&&a!==void 0?a:2*((o=e?.heartbeatIntervalMs)!==null&&o!==void 0?o:Mr.HEARTBEAT_INTERVAL),p.transport=(l=e?.transport)!==null&&l!==void 0?l:Ut.getWebSocketConstructor(),p.params=e?.params,p.logger=e?.logger,p.heartbeatCallback=this._wrapHeartbeatCallback(e?.heartbeatCallback),p.sessionStorage=(c=e?.sessionStorage)!==null&&c!==void 0?c:Es(),p.reconnectAfterMs=(h=e?.reconnectAfterMs)!==null&&h!==void 0?h:(_=>_s[_-1]||xs);let g,m,w=(u=e?.vsn)!==null&&u!==void 0?u:Ir;switch(w){case Tr:g=(_,b)=>b(JSON.stringify(_)),m=(_,b)=>b(JSON.parse(_));break;case Mt:g=this.serializer.encode.bind(this.serializer),m=this.serializer.decode.bind(this.serializer);break;default:throw new Error(`Unsupported serializer version: ${p.vsn}`)}if(p.vsn=w,p.encode=(f=e?.encode)!==null&&f!==void 0?f:g,p.decode=(d=e?.decode)!==null&&d!==void 0?d:m,p.beforeReconnect=this._reconnectAuth.bind(this),(e?.logLevel||e?.log_level)&&(this.logLevel=e.logLevel||e.log_level,p.params=Object.assign(Object.assign({},p.params),{log_level:this.logLevel})),this.worker){if(typeof window<"u"&&!window.Worker)throw new Error("Web Worker is not supported");this.workerUrl=e?.workerUrl,p.autoSendHeartbeat=!this.worker}return p}async _reconnectAuth(){await this._waitForAuthIfNeeded(),this.isConnected()||this.connect()}};var qe=class extends Error{constructor(r,e){super(r),this.name="IcebergError",this.status=e.status,this.icebergType=e.icebergType,this.icebergCode=e.icebergCode,this.details=e.details,this.isCommitStateUnknown=e.icebergType==="CommitStateUnknownException"||[500,502,504].includes(e.status)&&e.icebergType?.includes("CommitState")===!0}isNotFound(){return this.status===404}isConflict(){return this.status===409}isAuthenticationTimeout(){return this.status===419}};function As(r,e,t){let i=new URL(e,r);if(t)for(let[s,n]of Object.entries(t))n!==void 0&&i.searchParams.set(s,n);return i.toString()}async function Ts(r){return!r||r.type==="none"?{}:r.type==="bearer"?{Authorization:`Bearer ${r.token}`}:r.type==="header"?{[r.name]:r.value}:r.type==="custom"?await r.getHeaders():{}}function Is(r){let e=r.fetchImpl??globalThis.fetch;return{async request({method:t,path:i,query:s,body:n,headers:a}){let o=As(r.baseUrl,i,s),l=await Ts(r.auth),c=await e(o,{method:t,headers:{...n?{"Content-Type":"application/json"}:{},...l,...a},body:n?JSON.stringify(n):void 0}),h=await c.text(),u=(c.headers.get("content-type")||"").includes("application/json"),f=u&&h?JSON.parse(h):h;if(!c.ok){let d=u?f:void 0,p=d?.error;throw new qe(p?.message??`Request failed with status ${c.status}`,{status:c.status,icebergType:p?.type,icebergCode:p?.code,details:d})}return{status:c.status,headers:c.headers,data:f}}}}function pt(r){return r.join("")}var Cs=class{constructor(r,e=""){this.client=r,this.prefix=e}async listNamespaces(r){let e=r?{parent:pt(r.namespace)}:void 0;return(await this.client.request({method:"GET",path:`${this.prefix}/namespaces`,query:e})).data.namespaces.map(i=>({namespace:i}))}async createNamespace(r,e){let t={namespace:r.namespace,properties:e?.properties};return(await this.client.request({method:"POST",path:`${this.prefix}/namespaces`,body:t})).data}async dropNamespace(r){await this.client.request({method:"DELETE",path:`${this.prefix}/namespaces/${pt(r.namespace)}`})}async loadNamespaceMetadata(r){return{properties:(await this.client.request({method:"GET",path:`${this.prefix}/namespaces/${pt(r.namespace)}`})).data.properties}}async namespaceExists(r){try{return await this.client.request({method:"HEAD",path:`${this.prefix}/namespaces/${pt(r.namespace)}`}),!0}catch(e){if(e instanceof qe&&e.status===404)return!1;throw e}}async createNamespaceIfNotExists(r,e){try{return await this.createNamespace(r,e)}catch(t){if(t instanceof qe&&t.status===409)return;throw t}}};function Ae(r){return r.join("")}var Rs=class{constructor(r,e="",t){this.client=r,this.prefix=e,this.accessDelegation=t}async listTables(r){return(await this.client.request({method:"GET",path:`${this.prefix}/namespaces/${Ae(r.namespace)}/tables`})).data.identifiers}async createTable(r,e){let t={};return this.accessDelegation&&(t["X-Iceberg-Access-Delegation"]=this.accessDelegation),(await this.client.request({method:"POST",path:`${this.prefix}/namespaces/${Ae(r.namespace)}/tables`,body:e,headers:t})).data.metadata}async updateTable(r,e){let t=await this.client.request({method:"POST",path:`${this.prefix}/namespaces/${Ae(r.namespace)}/tables/${r.name}`,body:e});return{"metadata-location":t.data["metadata-location"],metadata:t.data.metadata}}async dropTable(r,e){await this.client.request({method:"DELETE",path:`${this.prefix}/namespaces/${Ae(r.namespace)}/tables/${r.name}`,query:{purgeRequested:String(e?.purge??!1)}})}async loadTable(r){let e={};return this.accessDelegation&&(e["X-Iceberg-Access-Delegation"]=this.accessDelegation),(await this.client.request({method:"GET",path:`${this.prefix}/namespaces/${Ae(r.namespace)}/tables/${r.name}`,headers:e})).data.metadata}async tableExists(r){let e={};this.accessDelegation&&(e["X-Iceberg-Access-Delegation"]=this.accessDelegation);try{return await this.client.request({method:"HEAD",path:`${this.prefix}/namespaces/${Ae(r.namespace)}/tables/${r.name}`,headers:e}),!0}catch(t){if(t instanceof qe&&t.status===404)return!1;throw t}}async createTableIfNotExists(r,e){try{return await this.createTable(r,e)}catch(t){if(t instanceof qe&&t.status===409)return await this.loadTable({namespace:r.namespace,name:e.name});throw t}}},Fr=class{constructor(r){let e="v1";r.catalogName&&(e+=`/${r.catalogName}`);let t=r.baseUrl.endsWith("/")?r.baseUrl:`${r.baseUrl}/`;this.client=Is({baseUrl:t,auth:r.auth,fetchImpl:r.fetch}),this.accessDelegation=r.accessDelegation?.join(","),this.namespaceOps=new Cs(this.client,e),this.tableOps=new Rs(this.client,e,this.accessDelegation)}async listNamespaces(r){return this.namespaceOps.listNamespaces(r)}async createNamespace(r,e){return this.namespaceOps.createNamespace(r,e)}async dropNamespace(r){await this.namespaceOps.dropNamespace(r)}async loadNamespaceMetadata(r){return this.namespaceOps.loadNamespaceMetadata(r)}async listTables(r){return this.tableOps.listTables(r)}async createTable(r,e){return this.tableOps.createTable(r,e)}async updateTable(r,e){return this.tableOps.updateTable(r,e)}async dropTable(r,e){await this.tableOps.dropTable(r,e)}async loadTable(r){return this.tableOps.loadTable(r)}async namespaceExists(r){return this.namespaceOps.namespaceExists(r)}async tableExists(r){return this.tableOps.tableExists(r)}async createNamespaceIfNotExists(r,e){return this.namespaceOps.createNamespaceIfNotExists(r,e)}async createTableIfNotExists(r,e){return this.tableOps.createTableIfNotExists(r,e)}};function Ge(r){"@babel/helpers - typeof";return Ge=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Ge(r)}function Os(r,e){if(Ge(r)!="object"||!r)return r;var t=r[Symbol.toPrimitive];if(t!==void 0){var i=t.call(r,e||"default");if(Ge(i)!="object")return i;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(r)}function js(r){var e=Os(r,"string");return Ge(e)=="symbol"?e:e+""}function Ls(r,e,t){return(e=js(e))in r?Object.defineProperty(r,e,{value:t,enumerable:!0,configurable:!0,writable:!0}):r[e]=t,r}function Dr(r,e){var t=Object.keys(r);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(r);e&&(i=i.filter(function(s){return Object.getOwnPropertyDescriptor(r,s).enumerable})),t.push.apply(t,i)}return t}function x(r){for(var e=1;e<arguments.length;e++){var t=arguments[e]!=null?arguments[e]:{};e%2?Dr(Object(t),!0).forEach(function(i){Ls(r,i,t[i])}):Object.getOwnPropertyDescriptors?Object.defineProperties(r,Object.getOwnPropertyDescriptors(t)):Dr(Object(t)).forEach(function(i){Object.defineProperty(r,i,Object.getOwnPropertyDescriptor(t,i))})}return r}var yt=class extends Error{constructor(r,e="storage",t,i){super(r),this.__isStorageError=!0,this.namespace=e,this.name=e==="vectors"?"StorageVectorsError":"StorageError",this.status=t,this.statusCode=i}toJSON(){return{name:this.name,message:this.message,status:this.status,statusCode:this.statusCode}}};function wt(r){return typeof r=="object"&&r!==null&&"__isStorageError"in r}var gt=class extends yt{constructor(r,e,t,i="storage",s){super(r,i,e,t),this.name=i==="vectors"?"StorageVectorsApiError":"StorageApiError",this.status=e,this.statusCode=t,this.code=s}toJSON(){return x(x({},super.toJSON()),{},{code:this.code})}},Hr=class extends yt{constructor(r,e,t="storage"){super(r,t),this.name=t==="vectors"?"StorageVectorsUnknownError":"StorageUnknownError",this.originalError=e}};function mt(r,e,t){let i=x({},r),s=e.toLowerCase();for(let n of Object.keys(i))n.toLowerCase()===s&&delete i[n];return i[s]=t,i}function Ps(r){let e={};for(let[t,i]of Object.entries(r))e[t.toLowerCase()]=i;return e}var Bs=r=>r?(...e)=>r(...e):(...e)=>fetch(...e),Ns=r=>{if(typeof r!="object"||r===null)return!1;let e=Object.getPrototypeOf(r);return(e===null||e===Object.prototype||Object.getPrototypeOf(e)===null)&&!(Symbol.toStringTag in r)&&!(Symbol.iterator in r)},zt=r=>{if(Array.isArray(r))return r.map(t=>zt(t));if(typeof r=="function"||r!==Object(r))return r;let e={};return Object.entries(r).forEach(([t,i])=>{let s=t.replace(/([-_][a-z])/gi,n=>n.toUpperCase().replace(/[-_]/g,""));e[s]=zt(i)}),e},Us=r=>!r||typeof r!="string"||r.length===0||r.length>100||r.trim()!==r||r.includes("/")||r.includes("\\")?!1:/^[\w!.\*'() &$@=;:+,?-]+$/.test(r),Gr=r=>r.split("/").map(encodeURIComponent).join("/"),$r=r=>{if(typeof r=="object"&&r!==null){let e=r;if(typeof e.msg=="string")return e.msg;if(typeof e.message=="string")return e.message;if(typeof e.error_description=="string")return e.error_description;if(typeof e.error=="string")return e.error;if(typeof e.error=="object"&&e.error!==null){let t=e.error;if(typeof t.message=="string")return t.message}}return JSON.stringify(r)},Ms=async(r,e,t,i)=>{if(r!==null&&typeof r=="object"&&"json"in r&&typeof r.json=="function"){let s=r,n=parseInt(String(s.status),10);Number.isFinite(n)||(n=500),s.json().then(a=>{let o=a?.statusCode||a?.code||n+"";e(new gt($r(a),n,o,i,a?.code))}).catch(()=>{let a=n+"";e(new gt(s.statusText||`HTTP ${n} error`,n,a,i))})}else e(new Hr($r(r),r,i))},Fs=(r,e,t,i)=>{let s={method:r,headers:e?.headers||{}};if(r==="GET"||r==="HEAD"||!i)return x(x({},s),t);if(Ns(i)){var n;let a=e?.headers||{},o;for(let[l,c]of Object.entries(a))l.toLowerCase()==="content-type"&&(o=c);s.headers=mt(a,"Content-Type",(n=o)!==null&&n!==void 0?n:"application/json"),s.body=JSON.stringify(i)}else s.body=i;return e?.duplex&&(s.duplex=e.duplex),x(x({},s),t)};async function He(r,e,t,i,s,n,a){return new Promise((o,l)=>{r(t,Fs(e,i,s,n)).then(c=>{if(!c.ok)throw c;if(i?.noResolveJson)return c;if(a==="vectors"){let h=c.headers.get("content-type");if(c.headers.get("content-length")==="0"||c.status===204)return{};if(!h||!h.includes("application/json"))return{}}return c.json()}).then(c=>o(c)).catch(c=>Ms(c,l,i,a))})}function Kr(r="storage"){return{get:async(e,t,i,s)=>He(e,"GET",t,i,s,void 0,r),post:async(e,t,i,s,n)=>He(e,"POST",t,s,n,i,r),put:async(e,t,i,s,n)=>He(e,"PUT",t,s,n,i,r),head:async(e,t,i,s)=>He(e,"HEAD",t,x(x({},i),{},{noResolveJson:!0}),s,void 0,r),remove:async(e,t,i,s,n)=>He(e,"DELETE",t,s,n,i,r)}}var Ds=Kr("storage"),{get:Ke,post:$,put:Vt,head:$s,remove:ze}=Ds,N=Kr("vectors"),Te=class{constructor(r,e={},t,i="storage"){this.shouldThrowOnError=!1,this.url=r,this.headers=Ps(e),this.fetch=Bs(t),this.namespace=i}throwOnError(){return this.shouldThrowOnError=!0,this}setHeader(r,e){return this.headers=mt(this.headers,r,e),this}async handleOperation(r){var e=this;try{return{data:await r(),error:null}}catch(t){if(e.shouldThrowOnError)throw t;if(wt(t))return{data:null,error:t};throw t}}},zr;zr=Symbol.toStringTag;var qs=class{constructor(r,e){this.downloadFn=r,this.shouldThrowOnError=e,this[zr]="StreamDownloadBuilder",this.promise=null}then(r,e){return this.getPromise().then(r,e)}catch(r){return this.getPromise().catch(r)}finally(r){return this.getPromise().finally(r)}getPromise(){return this.promise||(this.promise=this.execute()),this.promise}async execute(){var r=this;try{return{data:(await r.downloadFn()).body,error:null}}catch(e){if(r.shouldThrowOnError)throw e;if(wt(e))return{data:null,error:e};throw e}}},Vr;Vr=Symbol.toStringTag;var Hs=class{constructor(r,e){this.downloadFn=r,this.shouldThrowOnError=e,this[Vr]="BlobDownloadBuilder",this.promise=null}asStream(){return new qs(this.downloadFn,this.shouldThrowOnError)}then(r,e){return this.getPromise().then(r,e)}catch(r){return this.getPromise().catch(r)}finally(r){return this.getPromise().finally(r)}getPromise(){return this.promise||(this.promise=this.execute()),this.promise}async execute(){var r=this;try{return{data:await(await r.downloadFn()).blob(),error:null}}catch(e){if(r.shouldThrowOnError)throw e;if(wt(e))return{data:null,error:e};throw e}}},Kt={limit:100,offset:0,sortBy:{column:"name",order:"asc"}},qr={cacheControl:"3600",contentType:"text/plain;charset=UTF-8",upsert:!1},Gs=class extends Te{constructor(r,e={},t,i){super(r,e,i,"storage"),this.bucketId=t}async uploadOrUpdate(r,e,t,i){var s=this;return s.handleOperation(async()=>{let n,a=x(x({},qr),i),o=x(x({},s.headers),r==="POST"&&{"x-upsert":String(a.upsert)}),l=a.metadata;if(typeof Blob<"u"&&t instanceof Blob?(n=new FormData,n.append("cacheControl",a.cacheControl),l&&n.append("metadata",s.encodeMetadata(l)),n.append("",t)):typeof FormData<"u"&&t instanceof FormData?(n=t,n.has("cacheControl")||n.append("cacheControl",a.cacheControl),l&&!n.has("metadata")&&n.append("metadata",s.encodeMetadata(l))):(n=t,o["cache-control"]=`max-age=${a.cacheControl}`,o["content-type"]=a.contentType,l&&(o["x-metadata"]=s.toBase64(s.encodeMetadata(l))),(typeof ReadableStream<"u"&&n instanceof ReadableStream||n&&typeof n=="object"&&"pipe"in n&&typeof n.pipe=="function")&&!a.duplex&&(a.duplex="half")),i?.headers)for(let[f,d]of Object.entries(i.headers))o=mt(o,f,d);let c=s._removeEmptyFolders(e),h=s._getFinalPath(c),u=await(r=="PUT"?Vt:$)(s.fetch,`${s.url}/object/${h}`,n,x({headers:o},a?.duplex?{duplex:a.duplex}:{}));return{path:c,id:u.Id,fullPath:u.Key}})}async upload(r,e,t){return this.uploadOrUpdate("POST",r,e,t)}async uploadToSignedUrl(r,e,t,i){var s=this;let n=s._removeEmptyFolders(r),a=s._getFinalPath(n),o=new URL(s.url+`/object/upload/sign/${a}`);return o.searchParams.set("token",e),s.handleOperation(async()=>{let l,c=x(x({},qr),i),h=x(x({},s.headers),{"x-upsert":String(c.upsert)}),u=c.metadata;if(typeof Blob<"u"&&t instanceof Blob?(l=new FormData,l.append("cacheControl",c.cacheControl),u&&l.append("metadata",s.encodeMetadata(u)),l.append("",t)):typeof FormData<"u"&&t instanceof FormData?(l=t,l.has("cacheControl")||l.append("cacheControl",c.cacheControl),u&&!l.has("metadata")&&l.append("metadata",s.encodeMetadata(u))):(l=t,h["cache-control"]=`max-age=${c.cacheControl}`,h["content-type"]=c.contentType,u&&(h["x-metadata"]=s.toBase64(s.encodeMetadata(u))),(typeof ReadableStream<"u"&&l instanceof ReadableStream||l&&typeof l=="object"&&"pipe"in l&&typeof l.pipe=="function")&&!c.duplex&&(c.duplex="half")),i?.headers)for(let[f,d]of Object.entries(i.headers))h=mt(h,f,d);return{path:n,fullPath:(await Vt(s.fetch,o.toString(),l,x({headers:h},c?.duplex?{duplex:c.duplex}:{}))).Key}})}async createSignedUploadUrl(r,e){var t=this;return t.handleOperation(async()=>{let i=t._getFinalPath(r),s=x({},t.headers);e?.upsert&&(s["x-upsert"]="true");let n=await $(t.fetch,`${t.url}/object/upload/sign/${i}`,{},{headers:s}),a=new URL(t.url+n.url),o=a.searchParams.get("token");if(!o)throw new yt("No token returned by API");return{signedUrl:a.toString(),path:r,token:o}})}async update(r,e,t){return this.uploadOrUpdate("PUT",r,e,t)}async move(r,e,t){var i=this;return i.handleOperation(async()=>await $(i.fetch,`${i.url}/object/move`,{bucketId:i.bucketId,sourceKey:r,destinationKey:e,destinationBucket:t?.destinationBucket},{headers:i.headers}))}async copy(r,e,t){var i=this;return i.handleOperation(async()=>({path:(await $(i.fetch,`${i.url}/object/copy`,{bucketId:i.bucketId,sourceKey:r,destinationKey:e,destinationBucket:t?.destinationBucket},{headers:i.headers})).Key}))}async createSignedUrl(r,e,t){var i=this;return i.handleOperation(async()=>{let s=i._getFinalPath(r),n=typeof t?.transform=="object"&&t.transform!==null&&Object.keys(t.transform).length>0,a=await $(i.fetch,`${i.url}/object/sign/${s}`,x({expiresIn:e},n?{transform:t.transform}:{}),{headers:i.headers}),o=new URLSearchParams;t?.download&&o.set("download",t.download===!0?"":t.download),t?.cacheNonce!=null&&o.set("cacheNonce",String(t.cacheNonce));let l=o.toString();return{signedUrl:encodeURI(`${i.url}${a.signedURL}${l?`&${l}`:""}`)}})}async createSignedUrls(r,e,t){var i=this;return i.handleOperation(async()=>{let s=await $(i.fetch,`${i.url}/object/sign/${i.bucketId}`,{expiresIn:e,paths:r},{headers:i.headers}),n=new URLSearchParams;t?.download&&n.set("download",t.download===!0?"":t.download),t?.cacheNonce!=null&&n.set("cacheNonce",String(t.cacheNonce));let a=n.toString();return s.map(o=>x(x({},o),{},{signedUrl:o.signedURL?encodeURI(`${i.url}${o.signedURL}${a?`&${a}`:""}`):null}))})}download(r,e,t){let i=typeof e?.transform=="object"&&e.transform!==null&&Object.keys(e.transform).length>0?"render/image/authenticated":"object",s=new URLSearchParams;e?.transform&&this.applyTransformOptsToQuery(s,e.transform),e?.cacheNonce!=null&&s.set("cacheNonce",String(e.cacheNonce));let n=s.toString(),a=this._getFinalPath(r),o=()=>Ke(this.fetch,`${this.url}/${i}/${a}${n?`?${n}`:""}`,{headers:this.headers,noResolveJson:!0},t);return new Hs(o,this.shouldThrowOnError)}async info(r){var e=this;let t=e._getFinalPath(r);return e.handleOperation(async()=>zt(await Ke(e.fetch,`${e.url}/object/info/${t}`,{headers:e.headers})))}async exists(r){var e=this;let t=e._getFinalPath(r);try{return await $s(e.fetch,`${e.url}/object/${t}`,{headers:e.headers}),{data:!0,error:null}}catch(s){if(e.shouldThrowOnError)throw s;if(wt(s)){var i;let n=s instanceof gt?s.status:s instanceof Hr?(i=s.originalError)===null||i===void 0?void 0:i.status:void 0;if(n!==void 0&&[400,404].includes(n))return{data:!1,error:s}}throw s}}getPublicUrl(r,e){let t=this._getFinalPath(r),i=new URLSearchParams;e?.download&&i.set("download",e.download===!0?"":e.download),e?.transform&&this.applyTransformOptsToQuery(i,e.transform),e?.cacheNonce!=null&&i.set("cacheNonce",String(e.cacheNonce));let s=i.toString(),n=typeof e?.transform=="object"&&e.transform!==null&&Object.keys(e.transform).length>0?"render/image":"object";return{data:{publicUrl:encodeURI(`${this.url}/${n}/public/${t}`)+(s?`?${s}`:"")}}}async remove(r){var e=this;return e.handleOperation(async()=>await ze(e.fetch,`${e.url}/object/${e.bucketId}`,{prefixes:r},{headers:e.headers}))}async purgeCache(r,e,t){var i=this;return i.handleOperation(async()=>{let s=Gr(i._getFinalPath(r)),n=new URLSearchParams;e?.transformations&&n.set("transformations","true");let a=n.toString();return await ze(i.fetch,`${i.url}/cdn/${s}${a?`?${a}`:""}`,{},{headers:i.headers},t)})}async list(r,e,t){var i=this;return i.handleOperation(async()=>{let s=e?.sortBy?x(x({},Kt.sortBy),e.sortBy):Kt.sortBy,n=x(x(x({},Kt),e),{},{sortBy:s,prefix:r||""});return await $(i.fetch,`${i.url}/object/list/${i.bucketId}`,n,{headers:i.headers},t)})}async listV2(r,e){var t=this;return t.handleOperation(async()=>{let i=x({},r);return await $(t.fetch,`${t.url}/object/list-v2/${t.bucketId}`,i,{headers:t.headers},e)})}encodeMetadata(r){return JSON.stringify(r)}toBase64(r){return typeof Buffer<"u"?Buffer.from(r).toString("base64"):btoa(r)}_getFinalPath(r){return`${this.bucketId}/${r.replace(/^\/+/,"")}`}_removeEmptyFolders(r){return r.replace(/^\/|\/$/g,"").replace(/\/+/g,"/")}applyTransformOptsToQuery(r,e){return e.width&&r.set("width",e.width.toString()),e.height&&r.set("height",e.height.toString()),e.resize&&r.set("resize",e.resize),e.format&&r.set("format",e.format),e.quality&&r.set("quality",e.quality.toString()),r}},Ks="2.112.4",Ve={"X-Client-Info":`storage-js/${Ks}`},zs=class extends Te{constructor(r,e={},t,i){let s=new URL(r);i?.useNewHostname&&/supabase\.(co|in|red)$/.test(s.hostname)&&!s.hostname.includes("storage.supabase.")&&(s.hostname=s.hostname.replace("supabase.","storage.supabase."));let n=s.href.replace(/\/$/,""),a=x(x({},Ve),e);super(n,a,t,"storage")}async listBuckets(r){var e=this;return e.handleOperation(async()=>{let t=e.listBucketOptionsToQueryString(r);return await Ke(e.fetch,`${e.url}/bucket${t}`,{headers:e.headers})})}async getBucket(r){var e=this;return e.handleOperation(async()=>await Ke(e.fetch,`${e.url}/bucket/${r}`,{headers:e.headers}))}async createBucket(r,e={public:!1}){var t=this;return t.handleOperation(async()=>await $(t.fetch,`${t.url}/bucket`,{id:r,name:r,type:e.type,public:e.public,file_size_limit:e.fileSizeLimit,allowed_mime_types:e.allowedMimeTypes},{headers:t.headers}))}async updateBucket(r,e){var t=this;return t.handleOperation(async()=>await Vt(t.fetch,`${t.url}/bucket/${r}`,{id:r,name:r,public:e.public,file_size_limit:e.fileSizeLimit,allowed_mime_types:e.allowedMimeTypes},{headers:t.headers}))}async emptyBucket(r){var e=this;return e.handleOperation(async()=>await $(e.fetch,`${e.url}/bucket/${r}/empty`,{},{headers:e.headers}))}async deleteBucket(r){var e=this;return e.handleOperation(async()=>await ze(e.fetch,`${e.url}/bucket/${r}`,{},{headers:e.headers}))}async purgeBucketCache(r,e,t){var i=this;return i.handleOperation(async()=>{let s=new URLSearchParams;e?.transformations&&s.set("transformations","true");let n=s.toString();return await ze(i.fetch,`${i.url}/cdn/${Gr(r)}${n?`?${n}`:""}`,{},{headers:i.headers},t)})}listBucketOptionsToQueryString(r){let e={};return r&&("limit"in r&&(e.limit=String(r.limit)),"offset"in r&&(e.offset=String(r.offset)),r.search&&(e.search=r.search),r.sortColumn&&(e.sortColumn=r.sortColumn),r.sortOrder&&(e.sortOrder=r.sortOrder)),Object.keys(e).length>0?"?"+new URLSearchParams(e).toString():""}},Vs=class extends Te{constructor(r,e={},t){let i=r.replace(/\/$/,""),s=x(x({},Ve),e);super(i,s,t,"storage")}async createBucket(r){var e=this;return e.handleOperation(async()=>await $(e.fetch,`${e.url}/bucket`,{name:r},{headers:e.headers}))}async listBuckets(r){var e=this;return e.handleOperation(async()=>{let t=new URLSearchParams;r?.limit!==void 0&&t.set("limit",r.limit.toString()),r?.offset!==void 0&&t.set("offset",r.offset.toString()),r?.sortColumn&&t.set("sortColumn",r.sortColumn),r?.sortOrder&&t.set("sortOrder",r.sortOrder),r?.search&&t.set("search",r.search);let i=t.toString(),s=i?`${e.url}/bucket?${i}`:`${e.url}/bucket`;return await Ke(e.fetch,s,{headers:e.headers})})}async deleteBucket(r){var e=this;return e.handleOperation(async()=>await ze(e.fetch,`${e.url}/bucket/${r}`,{},{headers:e.headers}))}from(r){var e=this;if(!Us(r))throw new yt("Invalid bucket name: File, folder, and bucket names must follow AWS object key naming guidelines and should avoid the use of any other characters.");let t=new Fr({baseUrl:this.url,catalogName:r,auth:{type:"custom",getHeaders:async()=>e.headers},fetch:this.fetch}),i=this.shouldThrowOnError;return new Proxy(t,{get(s,n){let a=s[n];return typeof a!="function"?a:async(...o)=>{try{return{data:await a.apply(s,o),error:null}}catch(l){if(i)throw l;return{data:null,error:l}}}}})}},Ws=class extends Te{constructor(r,e={},t){let i=r.replace(/\/$/,""),s=x(x({},Ve),{},{"Content-Type":"application/json"},e);super(i,s,t,"vectors")}async createIndex(r){var e=this;return e.handleOperation(async()=>await N.post(e.fetch,`${e.url}/CreateIndex`,r,{headers:e.headers})||{})}async getIndex(r,e){var t=this;return t.handleOperation(async()=>await N.post(t.fetch,`${t.url}/GetIndex`,{vectorBucketName:r,indexName:e},{headers:t.headers}))}async listIndexes(r){var e=this;return e.handleOperation(async()=>await N.post(e.fetch,`${e.url}/ListIndexes`,r,{headers:e.headers}))}async deleteIndex(r,e){var t=this;return t.handleOperation(async()=>await N.post(t.fetch,`${t.url}/DeleteIndex`,{vectorBucketName:r,indexName:e},{headers:t.headers})||{})}},Js=class extends Te{constructor(r,e={},t){let i=r.replace(/\/$/,""),s=x(x({},Ve),{},{"Content-Type":"application/json"},e);super(i,s,t,"vectors")}async putVectors(r){var e=this;if(r.vectors.length<1||r.vectors.length>500)throw new Error("Vector batch size must be between 1 and 500 items");return e.handleOperation(async()=>await N.post(e.fetch,`${e.url}/PutVectors`,r,{headers:e.headers})||{})}async getVectors(r){var e=this;return e.handleOperation(async()=>await N.post(e.fetch,`${e.url}/GetVectors`,r,{headers:e.headers}))}async listVectors(r){var e=this;if(r.segmentCount!==void 0){if(r.segmentCount<1||r.segmentCount>16)throw new Error("segmentCount must be between 1 and 16");if(r.segmentIndex!==void 0&&(r.segmentIndex<0||r.segmentIndex>=r.segmentCount))throw new Error(`segmentIndex must be between 0 and ${r.segmentCount-1}`)}return e.handleOperation(async()=>await N.post(e.fetch,`${e.url}/ListVectors`,r,{headers:e.headers}))}async queryVectors(r){var e=this;return e.handleOperation(async()=>await N.post(e.fetch,`${e.url}/QueryVectors`,r,{headers:e.headers}))}async deleteVectors(r){var e=this;if(r.keys.length<1||r.keys.length>500)throw new Error("Keys batch size must be between 1 and 500 items");return e.handleOperation(async()=>await N.post(e.fetch,`${e.url}/DeleteVectors`,r,{headers:e.headers})||{})}},Qs=class extends Te{constructor(r,e={},t){let i=r.replace(/\/$/,""),s=x(x({},Ve),{},{"Content-Type":"application/json"},e);super(i,s,t,"vectors")}async createBucket(r){var e=this;return e.handleOperation(async()=>await N.post(e.fetch,`${e.url}/CreateVectorBucket`,{vectorBucketName:r},{headers:e.headers})||{})}async getBucket(r){var e=this;return e.handleOperation(async()=>await N.post(e.fetch,`${e.url}/GetVectorBucket`,{vectorBucketName:r},{headers:e.headers}))}async listBuckets(r={}){var e=this;return e.handleOperation(async()=>await N.post(e.fetch,`${e.url}/ListVectorBuckets`,r,{headers:e.headers}))}async deleteBucket(r){var e=this;return e.handleOperation(async()=>await N.post(e.fetch,`${e.url}/DeleteVectorBucket`,{vectorBucketName:r},{headers:e.headers})||{})}},Ys=class extends Qs{constructor(r,e={}){super(r,e.headers||{},e.fetch)}from(r){return new Xs(this.url,this.headers,r,this.fetch)}async createBucket(r){var e=()=>super.createBucket,t=this;return e().call(t,r)}async getBucket(r){var e=()=>super.getBucket,t=this;return e().call(t,r)}async listBuckets(r={}){var e=()=>super.listBuckets,t=this;return e().call(t,r)}async deleteBucket(r){var e=()=>super.deleteBucket,t=this;return e().call(t,r)}},Xs=class extends Ws{constructor(r,e,t,i){super(r,e,i),this.vectorBucketName=t}async createIndex(r){var e=()=>super.createIndex,t=this;return e().call(t,x(x({},r),{},{vectorBucketName:t.vectorBucketName}))}async listIndexes(r={}){var e=()=>super.listIndexes,t=this;return e().call(t,x(x({},r),{},{vectorBucketName:t.vectorBucketName}))}async getIndex(r){var e=()=>super.getIndex,t=this;return e().call(t,t.vectorBucketName,r)}async deleteIndex(r){var e=()=>super.deleteIndex,t=this;return e().call(t,t.vectorBucketName,r)}index(r){return new Zs(this.url,this.headers,this.vectorBucketName,r,this.fetch)}},Zs=class extends Js{constructor(r,e,t,i,s){super(r,e,s),this.vectorBucketName=t,this.indexName=i}async putVectors(r){var e=()=>super.putVectors,t=this;return e().call(t,x(x({},r),{},{vectorBucketName:t.vectorBucketName,indexName:t.indexName}))}async getVectors(r){var e=()=>super.getVectors,t=this;return e().call(t,x(x({},r),{},{vectorBucketName:t.vectorBucketName,indexName:t.indexName}))}async listVectors(r={}){var e=()=>super.listVectors,t=this;return e().call(t,x(x({},r),{},{vectorBucketName:t.vectorBucketName,indexName:t.indexName}))}async queryVectors(r){var e=()=>super.queryVectors,t=this;return e().call(t,x(x({},r),{},{vectorBucketName:t.vectorBucketName,indexName:t.indexName}))}async deleteVectors(r){var e=()=>super.deleteVectors,t=this;return e().call(t,x(x({},r),{},{vectorBucketName:t.vectorBucketName,indexName:t.indexName}))}},Wr=class extends zs{constructor(r,e={},t,i){super(r,e,t,i)}from(r){return new Gs(this.url,this.headers,r,this.fetch)}get vectors(){return new Ys(this.url+"/vector",{headers:this.headers,fetch:this.fetch})}get analytics(){return new Vs(this.url+"/iceberg",this.headers,this.fetch)}};var vt="2.112.4";var z=30*1e3,Ie=3,bt=Ie*z,Jr=2*z,Qr="http://localhost:9999",Yr="supabase.auth.token";var Xr={"X-Client-Info":`gotrue-js/${vt}`};var We="X-Supabase-Api-Version",Wt={"2024-01-01":{timestamp:Date.parse("2024-01-01T00:00:00.0Z"),name:"2024-01-01"}},Zr=/^([a-z0-9_-]{4})*($|[a-z0-9_-]{3}$|[a-z0-9_-]{2}$)$/i,X="sb_flow_id",ei=5,ti=600*1e3;var re=class extends Error{constructor(e,t,i){super(e),this.__isAuthError=!0,this.name="AuthError",this.status=t,this.code=i}toJSON(){return{name:this.name,message:this.message,status:this.status,code:this.code}}};function y(r){return typeof r=="object"&&r!==null&&"__isAuthError"in r}var _t=class extends re{constructor(e,t,i){super(e,t,i),this.name="AuthApiError",this.status=t,this.code=i}};function Jt(r){return y(r)&&r.name==="AuthApiError"}var j=class extends re{constructor(e,t){super(e),this.name="AuthUnknownError",this.originalError=t}},F=class extends re{constructor(e,t,i,s){super(e,i,s),this.name=t,this.status=i}},I=class extends F{constructor(){super("Auth session missing!","AuthSessionMissingError",400,void 0)}};function Xe(r){return y(r)&&r.name==="AuthSessionMissingError"}var Z=class extends F{constructor(){super("Auth session or user missing","AuthInvalidTokenResponseError",500,void 0)}},ae=class extends F{constructor(e){super(e,"AuthInvalidCredentialsError",400,void 0)}},oe=class extends F{constructor(e,t=null){super(e,"AuthImplicitGrantRedirectError",500,void 0),this.details=null,this.details=t}toJSON(){return Object.assign(Object.assign({},super.toJSON()),{details:this.details})}};function ri(r){return y(r)&&r.name==="AuthImplicitGrantRedirectError"}var Je=class extends F{constructor(e,t=null){super(e,"AuthPKCEGrantCodeExchangeError",500,void 0),this.details=null,this.details=t}toJSON(){return Object.assign(Object.assign({},super.toJSON()),{details:this.details})}},xt=class extends F{constructor(){super("PKCE code verifier not found in storage. This can happen if the auth flow was initiated in a different browser or device, or if the storage was cleared. For SSR frameworks (Next.js, SvelteKit, etc.), use @supabase/ssr on both the server and client to store the code verifier in cookies.","AuthPKCECodeVerifierMissingError",400,"pkce_code_verifier_not_found")}};var le=class extends F{constructor(e,t){super(e,"AuthRetryableFetchError",t,void 0)}};function Ze(r){return y(r)&&r.name==="AuthRetryableFetchError"}var Qe=class extends F{constructor(e="Refresh result discarded: session state changed mid-flight (e.g., concurrent signOut)"){super(e,"AuthRefreshDiscardedError",409,void 0)}};function ii(r){return y(r)&&r.name==="AuthRefreshDiscardedError"}var Ye=class extends F{constructor(e,t,i){super(e,"AuthWeakPasswordError",t,"weak_password"),this.reasons=i}toJSON(){return Object.assign(Object.assign({},super.toJSON()),{reasons:this.reasons})}};var ie=class extends F{constructor(e){super(e,"AuthInvalidJwtError",400,"invalid_jwt")}};var kt="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".split(""),si=` 	
\r=`.split(""),en=(()=>{let r=new Array(128);for(let e=0;e<r.length;e+=1)r[e]=-1;for(let e=0;e<si.length;e+=1)r[si[e].charCodeAt(0)]=-2;for(let e=0;e<kt.length;e+=1)r[kt[e].charCodeAt(0)]=e;return r})();function ni(r,e,t){if(r!==null)for(e.queue=e.queue<<8|r,e.queuedBits+=8;e.queuedBits>=6;){let i=e.queue>>e.queuedBits-6&63;t(kt[i]),e.queuedBits-=6}else if(e.queuedBits>0)for(e.queue=e.queue<<6-e.queuedBits,e.queuedBits=6;e.queuedBits>=6;){let i=e.queue>>e.queuedBits-6&63;t(kt[i]),e.queuedBits-=6}}function ai(r,e,t){let i=en[r];if(i>-1)for(e.queue=e.queue<<6|i,e.queuedBits+=6;e.queuedBits>=8;)t(e.queue>>e.queuedBits-8&255),e.queuedBits-=8;else{if(i===-2)return;throw new Error(`Invalid Base64-URL character "${String.fromCharCode(r)}"`)}}function Qt(r){let e=[],t=a=>{e.push(String.fromCodePoint(a))},i={utf8seq:0,codepoint:0},s={queue:0,queuedBits:0},n=a=>{sn(a,i,t)};for(let a=0;a<r.length;a+=1)ai(r.charCodeAt(a),s,n);return e.join("")}function tn(r,e){if(r<=127){e(r);return}else if(r<=2047){e(192|r>>6),e(128|r&63);return}else if(r<=65535){e(224|r>>12),e(128|r>>6&63),e(128|r&63);return}else if(r<=1114111){e(240|r>>18),e(128|r>>12&63),e(128|r>>6&63),e(128|r&63);return}throw new Error(`Unrecognized Unicode codepoint: ${r.toString(16)}`)}function rn(r,e){for(let t=0;t<r.length;t+=1){let i=r.charCodeAt(t);if(i>55295&&i<=56319){let s=(i-55296)*1024&65535;i=(r.charCodeAt(t+1)-56320&65535|s)+65536,t+=1}tn(i,e)}}function sn(r,e,t){if(e.utf8seq===0){if(r<=127){t(r);return}for(let i=1;i<6;i+=1)if((r>>7-i&1)===0){e.utf8seq=i;break}if(e.utf8seq===2)e.codepoint=r&31;else if(e.utf8seq===3)e.codepoint=r&15;else if(e.utf8seq===4)e.codepoint=r&7;else throw new Error("Invalid UTF-8 sequence");e.utf8seq-=1}else if(e.utf8seq>0){if(r<=127)throw new Error("Invalid UTF-8 sequence");e.codepoint=e.codepoint<<6|r&63,e.utf8seq-=1,e.utf8seq===0&&t(e.codepoint)}}function se(r){let e=[],t={queue:0,queuedBits:0},i=s=>{e.push(s)};for(let s=0;s<r.length;s+=1)ai(r.charCodeAt(s),t,i);return new Uint8Array(e)}function oi(r){let e=[];return rn(r,t=>e.push(t)),new Uint8Array(e)}function ee(r){let e=[],t={queue:0,queuedBits:0},i=s=>{e.push(s)};return r.forEach(s=>ni(s,t,i)),ni(null,t,i),e.join("")}function li(r){return Math.round(Date.now()/1e3)+r}function ci(){return Symbol("auth-callback")}var R=()=>typeof window<"u"&&typeof document<"u",ce={tested:!1,writable:!1},Et=()=>{if(!R())return!1;try{if(typeof globalThis.localStorage!="object")return!1}catch{return!1}if(ce.tested)return ce.writable;let r=`lswt-${Math.random()}${Math.random()}`;try{globalThis.localStorage.setItem(r,r),globalThis.localStorage.removeItem(r),ce.tested=!0,ce.writable=!0}catch{ce.tested=!0,ce.writable=!1}return ce.writable};function Yt(r){let e={},t=new URL(r);if(t.hash&&t.hash[0]==="#")try{new URLSearchParams(t.hash.substring(1)).forEach((s,n)=>{e[n]=s})}catch{}return t.searchParams.forEach((i,s)=>{e[s]=i}),e}var St=r=>r?(...e)=>r(...e):(...e)=>fetch(...e),hi=r=>typeof r=="object"&&r!==null&&"status"in r&&"ok"in r&&"json"in r&&typeof r.json=="function",V=async(r,e,t)=>{await r.setItem(e,JSON.stringify(t))},O=async(r,e)=>{let t=await r.getItem(e);if(!t)return null;try{return JSON.parse(t)}catch{return null}},P=async(r,e)=>{await r.removeItem(e)},et=class r{constructor(){this.promise=new r.promiseConstructor((e,t)=>{this.resolve=e,this.reject=t})}};et.promiseConstructor=Promise;function rt(r){let e=r.split(".");if(e.length!==3)throw new ie("Invalid JWT structure");for(let i=0;i<e.length;i++)if(!Zr.test(e[i]))throw new ie("JWT not in base64url format");return{header:JSON.parse(Qt(e[0])),payload:JSON.parse(Qt(e[1])),signature:se(e[2]),raw:{header:e[0],payload:e[1]}}}async function ui(r){return await new Promise(e=>{setTimeout(()=>e(null),r)})}function di(r,e){return new Promise((i,s)=>{(async()=>{for(let n=0;n<1/0;n++)try{let a=await r(n);if(!e(n,null,a)){i(a);return}}catch(a){if(!e(n,a)){s(a);return}}})()})}function fi(r){return("0"+r.toString(16)).substr(-2)}function nn(){let e=new Uint32Array(56);if(typeof crypto>"u"){let t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~",i=t.length,s="";for(let n=0;n<56;n++)s+=t.charAt(Math.floor(Math.random()*i));return s}return crypto.getRandomValues(e),Array.from(e,fi).join("")}async function an(r){let t=new TextEncoder().encode(r),i=await crypto.subtle.digest("SHA-256",t),s=new Uint8Array(i);return Array.from(s).map(n=>String.fromCharCode(n)).join("")}async function on(r){if(!(typeof crypto<"u"&&typeof crypto.subtle<"u"&&typeof TextEncoder<"u"))return console.warn("WebCrypto API is not supported. Code challenge method will default to use plain instead of sha256."),r;let t=await an(r);return btoa(t).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}var ln=/^[a-zA-Z0-9_-]{8,64}$/;function it(r){return typeof r=="string"&&ln.test(r)?r:null}function cn(){if(typeof crypto<"u"&&typeof crypto.getRandomValues=="function"){let e=new Uint8Array(16);return crypto.getRandomValues(e),Array.from(e,fi).join("")}let r="";for(let e=0;e<32;e++)r+=Math.floor(Math.random()*16).toString(16);return r}var he=(r,e)=>`${r}-flow-${e}-code-verifier`,tt=r=>`${r}-flows-code-verifier`;async function Xt(r,e){let t=await O(r,tt(e));return Array.isArray(t)?t.filter(i=>it(i)!==null):[]}async function hn(r,e,t,i,s){await V(r,he(e,t),i);let n=(await Xt(r,e)).filter(a=>a!==t);for(n.push(t);n.length>ei;){let a=n.shift();await P(r,he(e,a)),s?.(a)}await V(r,tt(e),n),await V(r,`${e}-code-verifier`,i)}async function pi(r,e,t){if(t){let s=await O(r,he(e,t));return{verifier:typeof s=="string"?s:null,flowId:t}}let i=await O(r,`${e}-code-verifier`);return{verifier:typeof i=="string"?i:null,flowId:null}}async function D(r,e,t){let i=`${e}-code-verifier`;if(!t){await P(r,i);return}let s=he(e,t),n=await O(r,s);await P(r,s);let a=await Xt(r,e),o=a.filter(l=>l!==t);o.length!==a.length&&(o.length>0?await V(r,tt(e),o):await P(r,tt(e))),n!=null&&n===await O(r,i)&&await P(r,i)}async function gi(r,e){let t=await Xt(r,e);for(let i of t)await P(r,he(e,i));await P(r,tt(e)),await P(r,`${e}-code-verifier`)}function mi(r,e){let t=r.indexOf("#"),i=t===-1?r:r.slice(0,t),s=t===-1?"":r.slice(t),n=i.indexOf("?");if(n!==-1){let o=i.slice(0,n),l=i.slice(n+1).split("&").filter(c=>c!==""&&c!==X&&!c.startsWith(`${X}=`));i=l.length>0?`${o}?${l.join("&")}`:o}let a=i.includes("?")?"&":"?";return`${i}${a}${X}=${encodeURIComponent(e)}${s}`}async function yi(r,e,t=!1,i){let s=nn(),n=s;t&&(n+="/recovery");let a=cn();await hn(r,e,a,n,i);let o=await on(s);return[o,s===o?"plain":"s256",a]}var un=/^2[0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])$/i;function wi(r){let e=r.headers.get(We);if(!e||!e.match(un))return null;try{return new Date(`${e}T00:00:00.0Z`)}catch{return null}}function vi(r){if(!r)throw new Error("Missing exp claim");let e=Math.floor(Date.now()/1e3);if(r<=e)throw new Error("JWT has expired")}function bi(r){switch(r){case"RS256":return{name:"RSASSA-PKCS1-v1_5",hash:{name:"SHA-256"}};case"ES256":return{name:"ECDSA",namedCurve:"P-256",hash:{name:"SHA-256"}};default:throw new Error("Invalid alg claim")}}var dn=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;function W(r){if(!dn.test(r))throw new Error("@supabase/auth-js: Expected parameter to be UUID but is not")}function U(r){if(!r.passkey)throw new Error("@supabase/auth-js: the passkey API is experimental and disabled by default. Enable it by passing `auth: { experimental: { passkey: true } }` to createClient (or to the GoTrueClient constructor).")}function At(){let r={};return new Proxy(r,{get:(e,t)=>{if(t==="__isUserNotAvailableProxy")return!0;if(typeof t=="symbol"){let i=t.toString();if(i==="Symbol(Symbol.toPrimitive)"||i==="Symbol(Symbol.toStringTag)"||i==="Symbol(util.inspect.custom)")return}throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Accessing the "${t}" property of the session object is not supported. Please use getUser() instead.`)},set:(e,t)=>{throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Setting the "${t}" property of the session object is not supported. Please use getUser() to fetch a user object you can manipulate.`)},deleteProperty:(e,t)=>{throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Deleting the "${t}" property of the session object is not supported. Please use getUser() to fetch a user object you can manipulate.`)}})}function _i(r,e){return new Proxy(r,{get:(t,i,s)=>{if(i==="__isInsecureUserWarningProxy")return!0;if(typeof i=="symbol"){let n=i.toString();if(n==="Symbol(Symbol.toPrimitive)"||n==="Symbol(Symbol.toStringTag)"||n==="Symbol(util.inspect.custom)"||n==="Symbol(nodejs.util.inspect.custom)")return Reflect.get(t,i,s)}return!e.value&&typeof i=="string"&&(console.warn("Using the user object as returned from supabase.auth.getSession() or from some supabase.auth.onAuthStateChange() events could be insecure! This value comes directly from the storage medium (usually cookies on the server) and may not be authentic. Use supabase.auth.getUser() instead which authenticates the data by contacting the Supabase Auth server."),e.value=!0),Reflect.get(t,i,s)}})}function Zt(r){return JSON.parse(JSON.stringify(r))}var ue=r=>{if(typeof r=="object"&&r!==null){let e=r;if(typeof e.msg=="string")return e.msg;if(typeof e.message=="string")return e.message;if(typeof e.error_description=="string")return e.error_description;if(typeof e.error=="string")return e.error}return JSON.stringify(r)},xi=[500,501,502,503,504,520,521,522,523,524,525,526,527,528,529,530];async function ki(r){var e;if(!hi(r))throw new le(ue(r),0);let t;try{t=await r.json()}catch(n){throw xi.includes(r.status)?new le(r.statusText||`HTTP ${r.status}`,r.status):new j(ue(n),n)}if(xi.includes(r.status))throw new le(ue(t),r.status);let i,s=wi(r);if(s&&s.getTime()>=Wt["2024-01-01"].timestamp&&typeof t=="object"&&t&&typeof t.code=="string"?i=t.code:typeof t=="object"&&t&&typeof t.error_code=="string"&&(i=t.error_code),i){if(i==="weak_password")throw new Ye(ue(t),r.status,((e=t.weak_password)===null||e===void 0?void 0:e.reasons)||[]);if(i==="session_not_found")throw new I}else if(typeof t=="object"&&t&&typeof t.weak_password=="object"&&t.weak_password&&Array.isArray(t.weak_password.reasons)&&t.weak_password.reasons.length&&t.weak_password.reasons.reduce((n,a)=>n&&typeof a=="string",!0))throw new Ye(ue(t),r.status,t.weak_password.reasons);throw new _t(ue(t),r.status||500,i)}var fn=(r,e,t,i)=>{let s={method:r,headers:e?.headers||{}};return r==="GET"?s:(s.headers=Object.assign({"Content-Type":"application/json;charset=UTF-8"},e?.headers),s.body=JSON.stringify(i),Object.assign(Object.assign({},s),t))};async function v(r,e,t,i){var s;let n=Object.assign({},i?.headers);n[We]||(n[We]=Wt["2024-01-01"].name),i?.jwt&&(n.Authorization=`Bearer ${i.jwt}`);let a=(s=i?.query)!==null&&s!==void 0?s:{};i?.redirectTo&&(a.redirect_to=i.redirectTo);let o=Object.keys(a).length?"?"+new URLSearchParams(a).toString():"",l=await pn(r,e,t+o,{headers:n,noResolveJson:i?.noResolveJson},{},i?.body);return i?.xform?i?.xform(l):{data:Object.assign({},l),error:null}}async function pn(r,e,t,i,s,n){let a=fn(e,i,s,n),o;try{o=await r(t,Object.assign({},a))}catch(l){throw new le(ue(l),0)}if(o.ok||await ki(o),i?.noResolveJson)return o;try{return await o.json()}catch(l){await ki(l)}}function M(r){var e;let t=null;gn(r)&&(t=Object.assign({},r),r.expires_at||(t.expires_at=li(r.expires_in)));let i=(e=r.user)!==null&&e!==void 0?e:typeof r?.id=="string"?r:null;return{data:{session:t,user:i},error:null}}function er(r){let e=M(r);return!e.error&&r.weak_password&&typeof r.weak_password=="object"&&Array.isArray(r.weak_password.reasons)&&r.weak_password.reasons.length&&r.weak_password.message&&typeof r.weak_password.message=="string"&&r.weak_password.reasons.reduce((t,i)=>t&&typeof i=="string",!0)&&(e.data.weak_password=r.weak_password),e}function J(r){var e;return{data:{user:(e=r.user)!==null&&e!==void 0?e:r},error:null}}function Ei(r){return{data:r,error:null}}function Si(r){let{action_link:e,email_otp:t,hashed_token:i,redirect_to:s,verification_type:n}=r,a=ne(r,["action_link","email_otp","hashed_token","redirect_to","verification_type"]),o={action_link:e,email_otp:t,hashed_token:i,redirect_to:s,verification_type:n},l=Object.assign({},a);return{data:{properties:o,user:l},error:null}}function tr(r){return r}function gn(r){return!!r.access_token&&!!r.refresh_token&&!!r.expires_in}var Tt=["global","local","others"];var de=class{constructor({url:e="",headers:t={},fetch:i,experimental:s}){this.url=e,this.headers=t,this.fetch=St(i),this.experimental=s??{},this.mfa={listFactors:this._listFactors.bind(this),deleteFactor:this._deleteFactor.bind(this)},this.oauth={listClients:this._listOAuthClients.bind(this),createClient:this._createOAuthClient.bind(this),getClient:this._getOAuthClient.bind(this),updateClient:this._updateOAuthClient.bind(this),deleteClient:this._deleteOAuthClient.bind(this),regenerateClientSecret:this._regenerateOAuthClientSecret.bind(this)},this.customProviders={listProviders:this._listCustomProviders.bind(this),createProvider:this._createCustomProvider.bind(this),getProvider:this._getCustomProvider.bind(this),updateProvider:this._updateCustomProvider.bind(this),deleteProvider:this._deleteCustomProvider.bind(this)},this.passkey={listPasskeys:this._adminListPasskeys.bind(this),deletePasskey:this._adminDeletePasskey.bind(this)}}async signOut(e,t=Tt[0]){if(Tt.indexOf(t)<0)throw new Error(`@supabase/auth-js: Parameter scope must be one of ${Tt.join(", ")}`);try{return await v(this.fetch,"POST",`${this.url}/logout?scope=${t}`,{headers:this.headers,jwt:e,noResolveJson:!0}),{data:null,error:null}}catch(i){if(y(i))return{data:null,error:i};throw i}}async inviteUserByEmail(e,t={}){try{return await v(this.fetch,"POST",`${this.url}/invite`,{body:{email:e,data:t.data},headers:this.headers,redirectTo:t.redirectTo,xform:J})}catch(i){if(y(i))return{data:{user:null},error:i};throw i}}async generateLink(e){try{let{options:t}=e,i=ne(e,["options"]),s=Object.assign(Object.assign({},i),t);return"newEmail"in i&&(s.new_email=i?.newEmail,delete s.newEmail),await v(this.fetch,"POST",`${this.url}/admin/generate_link`,{body:s,headers:this.headers,xform:Si,redirectTo:t?.redirectTo})}catch(t){if(y(t))return{data:{properties:null,user:null},error:t};throw t}}async createUser(e){try{return await v(this.fetch,"POST",`${this.url}/admin/users`,{body:e,headers:this.headers,xform:J})}catch(t){if(y(t))return{data:{user:null},error:t};throw t}}async listUsers(e){var t,i,s,n,a,o,l;try{let c={nextPage:null,lastPage:0,total:0},h=await v(this.fetch,"GET",`${this.url}/admin/users`,{headers:this.headers,noResolveJson:!0,query:{page:(i=(t=e?.page)===null||t===void 0?void 0:t.toString())!==null&&i!==void 0?i:"",per_page:(n=(s=e?.perPage)===null||s===void 0?void 0:s.toString())!==null&&n!==void 0?n:""},xform:tr});if(h.error)throw h.error;let u=await h.json(),f=(a=h.headers.get("x-total-count"))!==null&&a!==void 0?a:0,d=(l=(o=h.headers.get("link"))===null||o===void 0?void 0:o.split(","))!==null&&l!==void 0?l:[];return d.length>0&&(d.forEach(p=>{let g=parseInt(p.split(";")[0].split("=")[1].substring(0,1)),m=JSON.parse(p.split(";")[1].split("=")[1]);c[`${m}Page`]=g}),c.total=parseInt(f)),{data:Object.assign(Object.assign({},u),c),error:null}}catch(c){if(y(c))return{data:{users:[]},error:c};throw c}}async getUserById(e){W(e);try{return await v(this.fetch,"GET",`${this.url}/admin/users/${e}`,{headers:this.headers,xform:J})}catch(t){if(y(t))return{data:{user:null},error:t};throw t}}async updateUserById(e,t){W(e);try{return await v(this.fetch,"PUT",`${this.url}/admin/users/${e}`,{body:t,headers:this.headers,xform:J})}catch(i){if(y(i))return{data:{user:null},error:i};throw i}}async deleteUser(e,t=!1){W(e);try{return await v(this.fetch,"DELETE",`${this.url}/admin/users/${e}`,{headers:this.headers,body:{should_soft_delete:t},xform:J})}catch(i){if(y(i))return{data:{user:null},error:i};throw i}}async _listFactors(e){W(e.userId);try{let{data:t,error:i}=await v(this.fetch,"GET",`${this.url}/admin/users/${e.userId}/factors`,{headers:this.headers,xform:s=>({data:{factors:s},error:null})});return{data:t,error:i}}catch(t){if(y(t))return{data:null,error:t};throw t}}async _deleteFactor(e){W(e.userId),W(e.id);try{return{data:await v(this.fetch,"DELETE",`${this.url}/admin/users/${e.userId}/factors/${e.id}`,{headers:this.headers}),error:null}}catch(t){if(y(t))return{data:null,error:t};throw t}}async _listOAuthClients(e){var t,i,s,n,a,o,l;try{let c={nextPage:null,lastPage:0,total:0},h=await v(this.fetch,"GET",`${this.url}/admin/oauth/clients`,{headers:this.headers,noResolveJson:!0,query:{page:(i=(t=e?.page)===null||t===void 0?void 0:t.toString())!==null&&i!==void 0?i:"",per_page:(n=(s=e?.perPage)===null||s===void 0?void 0:s.toString())!==null&&n!==void 0?n:""},xform:tr});if(h.error)throw h.error;let u=await h.json(),f=(a=h.headers.get("x-total-count"))!==null&&a!==void 0?a:0,d=(l=(o=h.headers.get("link"))===null||o===void 0?void 0:o.split(","))!==null&&l!==void 0?l:[];return d.length>0&&(d.forEach(p=>{let g=parseInt(p.split(";")[0].split("=")[1].substring(0,1)),m=JSON.parse(p.split(";")[1].split("=")[1]);c[`${m}Page`]=g}),c.total=parseInt(f)),{data:Object.assign(Object.assign({},u),c),error:null}}catch(c){if(y(c))return{data:{clients:[]},error:c};throw c}}async _createOAuthClient(e){try{return await v(this.fetch,"POST",`${this.url}/admin/oauth/clients`,{body:e,headers:this.headers,xform:t=>({data:t,error:null})})}catch(t){if(y(t))return{data:null,error:t};throw t}}async _getOAuthClient(e){try{return await v(this.fetch,"GET",`${this.url}/admin/oauth/clients/${e}`,{headers:this.headers,xform:t=>({data:t,error:null})})}catch(t){if(y(t))return{data:null,error:t};throw t}}async _updateOAuthClient(e,t){try{return await v(this.fetch,"PUT",`${this.url}/admin/oauth/clients/${e}`,{body:t,headers:this.headers,xform:i=>({data:i,error:null})})}catch(i){if(y(i))return{data:null,error:i};throw i}}async _deleteOAuthClient(e){try{return await v(this.fetch,"DELETE",`${this.url}/admin/oauth/clients/${e}`,{headers:this.headers,noResolveJson:!0}),{data:null,error:null}}catch(t){if(y(t))return{data:null,error:t};throw t}}async _regenerateOAuthClientSecret(e){try{return await v(this.fetch,"POST",`${this.url}/admin/oauth/clients/${e}/regenerate_secret`,{headers:this.headers,xform:t=>({data:t,error:null})})}catch(t){if(y(t))return{data:null,error:t};throw t}}async _listCustomProviders(e){try{let t={};return e?.type&&(t.type=e.type),await v(this.fetch,"GET",`${this.url}/admin/custom-providers`,{headers:this.headers,query:t,xform:i=>{var s;return{data:{providers:(s=i?.providers)!==null&&s!==void 0?s:[]},error:null}}})}catch(t){if(y(t))return{data:{providers:[]},error:t};throw t}}async _createCustomProvider(e){try{return await v(this.fetch,"POST",`${this.url}/admin/custom-providers`,{body:e,headers:this.headers,xform:t=>({data:t,error:null})})}catch(t){if(y(t))return{data:null,error:t};throw t}}async _getCustomProvider(e){try{return await v(this.fetch,"GET",`${this.url}/admin/custom-providers/${e}`,{headers:this.headers,xform:t=>({data:t,error:null})})}catch(t){if(y(t))return{data:null,error:t};throw t}}async _updateCustomProvider(e,t){try{return await v(this.fetch,"PUT",`${this.url}/admin/custom-providers/${e}`,{body:t,headers:this.headers,xform:i=>({data:i,error:null})})}catch(i){if(y(i))return{data:null,error:i};throw i}}async _deleteCustomProvider(e){try{return await v(this.fetch,"DELETE",`${this.url}/admin/custom-providers/${e}`,{headers:this.headers,noResolveJson:!0}),{data:null,error:null}}catch(t){if(y(t))return{data:null,error:t};throw t}}async _adminListPasskeys(e){U(this.experimental),W(e.userId);try{return await v(this.fetch,"GET",`${this.url}/admin/users/${e.userId}/passkeys`,{headers:this.headers,xform:t=>({data:t,error:null})})}catch(t){if(y(t))return{data:null,error:t};throw t}}async _adminDeletePasskey(e){U(this.experimental),W(e.userId),W(e.passkeyId);try{return await v(this.fetch,"DELETE",`${this.url}/admin/users/${e.userId}/passkeys/${e.passkeyId}`,{headers:this.headers,noResolveJson:!0}),{data:null,error:null}}catch(t){if(y(t))return{data:null,error:t};throw t}}};function rr(r={}){return{getItem:e=>r[e]||null,setItem:(e,t)=>{r[e]=t},removeItem:e=>{delete r[e]}}}var mn={debug:!!(globalThis&&Et()&&globalThis.localStorage&&globalThis.localStorage.getItem("supabase.gotrue-js.locks.debug")==="true")},It=class extends Error{constructor(e){super(e),this.isAcquireTimeout=!0}};function Ai(){if(typeof globalThis!="object")try{Object.defineProperty(Object.prototype,"__magic__",{get:function(){return this},configurable:!0}),__magic__.globalThis=__magic__,delete Object.prototype.__magic__}catch{typeof self<"u"&&(self.globalThis=self)}}function ir(r){if(!/^0x[a-fA-F0-9]{40}$/.test(r))throw new Error(`@supabase/auth-js: Address "${r}" is invalid.`);return r.toLowerCase()}function Ti(r){return parseInt(r,16)}function Ii(r){let e=new TextEncoder().encode(r);return"0x"+Array.from(e,i=>i.toString(16).padStart(2,"0")).join("")}function Ci(r){var e;let{chainId:t,domain:i,expirationTime:s,issuedAt:n=new Date,nonce:a,notBefore:o,requestId:l,resources:c,scheme:h,uri:u,version:f}=r;{if(!Number.isInteger(t))throw new Error(`@supabase/auth-js: Invalid SIWE message field "chainId". Chain ID must be a EIP-155 chain ID. Provided value: ${t}`);if(!i)throw new Error('@supabase/auth-js: Invalid SIWE message field "domain". Domain must be provided.');if(a&&a.length<8)throw new Error(`@supabase/auth-js: Invalid SIWE message field "nonce". Nonce must be at least 8 characters. Provided value: ${a}`);if(!u)throw new Error('@supabase/auth-js: Invalid SIWE message field "uri". URI must be provided.');if(f!=="1")throw new Error(`@supabase/auth-js: Invalid SIWE message field "version". Version must be '1'. Provided value: ${f}`);if(!((e=r.statement)===null||e===void 0)&&e.includes(`
`))throw new Error(`@supabase/auth-js: Invalid SIWE message field "statement". Statement must not include '\\n'. Provided value: ${r.statement}`)}let d=ir(r.address),p=h?`${h}://${i}`:i,g=r.statement?`${r.statement}
`:"",m=`${p} wants you to sign in with your Ethereum account:
${d}

${g}`,w=`URI: ${u}
Version: ${f}
Chain ID: ${t}${a?`
Nonce: ${a}`:""}
Issued At: ${n.toISOString()}`;if(s&&(w+=`
Expiration Time: ${s.toISOString()}`),o&&(w+=`
Not Before: ${o.toISOString()}`),l&&(w+=`
Request ID: ${l}`),c){let _=`
Resources:`;for(let b of c){if(!b||typeof b!="string")throw new Error(`@supabase/auth-js: Invalid SIWE message field "resources". Every resource must be a valid string. Provided value: ${b}`);_+=`
- ${b}`}w+=_}return`${m}
${w}`}var T=class extends Error{constructor({message:e,code:t,cause:i,name:s}){var n;super(e,{cause:i}),this.__isWebAuthnError=!0,this.name=(n=s??(i instanceof Error?i.name:void 0))!==null&&n!==void 0?n:"Unknown Error",this.code=t}toJSON(){return{name:this.name,message:this.message,code:this.code}}},fe=class extends T{constructor(e,t){super({code:"ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",cause:t,message:e}),this.name="WebAuthnUnknownError",this.originalError=t}};function Ri({error:r,options:e}){var t,i,s;let{publicKey:n}=e;if(!n)throw Error("options was missing required publicKey property");if(r.name==="AbortError"){if(e.signal instanceof AbortSignal)return new T({message:"Registration ceremony was sent an abort signal",code:"ERROR_CEREMONY_ABORTED",cause:r})}else if(r.name==="ConstraintError"){if(((t=n.authenticatorSelection)===null||t===void 0?void 0:t.requireResidentKey)===!0)return new T({message:"Discoverable credentials were required but no available authenticator supported it",code:"ERROR_AUTHENTICATOR_MISSING_DISCOVERABLE_CREDENTIAL_SUPPORT",cause:r});if(e.mediation==="conditional"&&((i=n.authenticatorSelection)===null||i===void 0?void 0:i.userVerification)==="required")return new T({message:"User verification was required during automatic registration but it could not be performed",code:"ERROR_AUTO_REGISTER_USER_VERIFICATION_FAILURE",cause:r});if(((s=n.authenticatorSelection)===null||s===void 0?void 0:s.userVerification)==="required")return new T({message:"User verification was required but no available authenticator supported it",code:"ERROR_AUTHENTICATOR_MISSING_USER_VERIFICATION_SUPPORT",cause:r})}else{if(r.name==="InvalidStateError")return new T({message:"The authenticator was previously registered",code:"ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED",cause:r});if(r.name==="NotAllowedError")return new T({message:r.message,code:"ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",cause:r});if(r.name==="NotSupportedError")return n.pubKeyCredParams.filter(o=>o.type==="public-key").length===0?new T({message:'No entry in pubKeyCredParams was of type "public-key"',code:"ERROR_MALFORMED_PUBKEYCREDPARAMS",cause:r}):new T({message:"No available authenticator supported any of the specified pubKeyCredParams algorithms",code:"ERROR_AUTHENTICATOR_NO_SUPPORTED_PUBKEYCREDPARAMS_ALG",cause:r});if(r.name==="SecurityError"){let a=window.location.hostname;if(sr(a)){if(n.rp.id!==a)return new T({message:`The RP ID "${n.rp.id}" is invalid for this domain`,code:"ERROR_INVALID_RP_ID",cause:r})}else return new T({message:`${window.location.hostname} is an invalid domain`,code:"ERROR_INVALID_DOMAIN",cause:r})}else if(r.name==="TypeError"){if(n.user.id.byteLength<1||n.user.id.byteLength>64)return new T({message:"User ID was not between 1 and 64 characters",code:"ERROR_INVALID_USER_ID_LENGTH",cause:r})}else if(r.name==="UnknownError")return new T({message:"The authenticator was unable to process the specified options, or could not create a new credential",code:"ERROR_AUTHENTICATOR_GENERAL_ERROR",cause:r})}return new T({message:"a Non-Webauthn related error has occurred",code:"ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",cause:r})}function Oi({error:r,options:e}){let{publicKey:t}=e;if(!t)throw Error("options was missing required publicKey property");if(r.name==="AbortError"){if(e.signal instanceof AbortSignal)return new T({message:"Authentication ceremony was sent an abort signal",code:"ERROR_CEREMONY_ABORTED",cause:r})}else{if(r.name==="NotAllowedError")return new T({message:r.message,code:"ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",cause:r});if(r.name==="SecurityError"){let i=window.location.hostname;if(sr(i)){if(t.rpId!==i)return new T({message:`The RP ID "${t.rpId}" is invalid for this domain`,code:"ERROR_INVALID_RP_ID",cause:r})}else return new T({message:`${window.location.hostname} is an invalid domain`,code:"ERROR_INVALID_DOMAIN",cause:r})}else if(r.name==="UnknownError")return new T({message:"The authenticator was unable to process the specified options, or could not create a new assertion signature",code:"ERROR_AUTHENTICATOR_GENERAL_ERROR",cause:r})}return new T({message:"a Non-Webauthn related error has occurred",code:"ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",cause:r})}var nr=class{createNewAbortSignal(){if(this.controller){let t=new Error("Cancelling existing WebAuthn API call for new one");t.name="AbortError",this.controller.abort(t)}let e=new AbortController;return this.controller=e,e.signal}cancelCeremony(){if(this.controller){let e=new Error("Manually cancelling existing WebAuthn API call");e.name="AbortError",this.controller.abort(e),this.controller=void 0}}},Ot=new nr;function ar(r){if(!r)throw new Error("Credential creation options are required");if(typeof PublicKeyCredential<"u"&&"parseCreationOptionsFromJSON"in PublicKeyCredential&&typeof PublicKeyCredential.parseCreationOptionsFromJSON=="function")return PublicKeyCredential.parseCreationOptionsFromJSON(r);let{challenge:e,user:t,excludeCredentials:i}=r,s=ne(r,["challenge","user","excludeCredentials"]),n=se(e).buffer,a=Object.assign(Object.assign({},t),{id:se(t.id).buffer}),o=Object.assign(Object.assign({},s),{challenge:n,user:a});if(i&&i.length>0){o.excludeCredentials=new Array(i.length);for(let l=0;l<i.length;l++){let c=i[l];o.excludeCredentials[l]=Object.assign(Object.assign({},c),{id:se(c.id).buffer,type:c.type||"public-key",transports:c.transports})}}return o}function or(r){if(!r)throw new Error("Credential request options are required");if(typeof PublicKeyCredential<"u"&&"parseRequestOptionsFromJSON"in PublicKeyCredential&&typeof PublicKeyCredential.parseRequestOptionsFromJSON=="function")return PublicKeyCredential.parseRequestOptionsFromJSON(r);let{challenge:e,allowCredentials:t}=r,i=ne(r,["challenge","allowCredentials"]),s=se(e).buffer,n=Object.assign(Object.assign({},i),{challenge:s});if(t&&t.length>0){n.allowCredentials=new Array(t.length);for(let a=0;a<t.length;a++){let o=t[a];n.allowCredentials[a]=Object.assign(Object.assign({},o),{id:se(o.id).buffer,type:o.type||"public-key",transports:o.transports})}}return n}function lr(r){var e;if("toJSON"in r&&typeof r.toJSON=="function")return r.toJSON();let t=r;return{id:r.id,rawId:r.id,response:{attestationObject:ee(new Uint8Array(r.response.attestationObject)),clientDataJSON:ee(new Uint8Array(r.response.clientDataJSON))},type:"public-key",clientExtensionResults:r.getClientExtensionResults(),authenticatorAttachment:(e=t.authenticatorAttachment)!==null&&e!==void 0?e:void 0}}function cr(r){var e;if("toJSON"in r&&typeof r.toJSON=="function")return r.toJSON();let t=r,i=r.getClientExtensionResults(),s=r.response;return{id:r.id,rawId:r.id,response:{authenticatorData:ee(new Uint8Array(s.authenticatorData)),clientDataJSON:ee(new Uint8Array(s.clientDataJSON)),signature:ee(new Uint8Array(s.signature)),userHandle:s.userHandle?ee(new Uint8Array(s.userHandle)):void 0},type:"public-key",clientExtensionResults:i,authenticatorAttachment:(e=t.authenticatorAttachment)!==null&&e!==void 0?e:void 0}}function sr(r){return r==="localhost"||/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(r)}function st(){var r,e;return!!(R()&&"PublicKeyCredential"in window&&window.PublicKeyCredential&&"credentials"in navigator&&typeof((r=navigator?.credentials)===null||r===void 0?void 0:r.create)=="function"&&typeof((e=navigator?.credentials)===null||e===void 0?void 0:e.get)=="function")}async function hr(r){try{let e=await navigator.credentials.create(r);return e?e instanceof PublicKeyCredential?{data:e,error:null}:{data:null,error:new fe("Browser returned unexpected credential type",e)}:{data:null,error:new fe("Empty credential response",e)}}catch(e){return{data:null,error:Ri({error:e,options:r})}}}async function ur(r){try{let e=await navigator.credentials.get(r);return e?e instanceof PublicKeyCredential?{data:e,error:null}:{data:null,error:new fe("Browser returned unexpected credential type",e)}:{data:null,error:new fe("Empty credential response",e)}}catch(e){return{data:null,error:Oi({error:e,options:r})}}}var yn={hints:["security-key"],authenticatorSelection:{authenticatorAttachment:"cross-platform",requireResidentKey:!1,userVerification:"preferred",residentKey:"discouraged"},attestation:"direct"},wn={userVerification:"preferred",hints:["security-key"],attestation:"direct"};function Ct(...r){let e=s=>s!==null&&typeof s=="object"&&!Array.isArray(s),t=s=>s instanceof ArrayBuffer||ArrayBuffer.isView(s),i={};for(let s of r)if(s)for(let n in s){let a=s[n];if(a!==void 0)if(Array.isArray(a))i[n]=a;else if(t(a))i[n]=a;else if(e(a)){let o=i[n];e(o)?i[n]=Ct(o,a):i[n]=Ct(a)}else i[n]=a}return i}function vn(r,e){return Ct(yn,r,e||{})}function bn(r,e){return Ct(wn,r,e||{})}var Rt=class{constructor(e){this.client=e,this.enroll=this._enroll.bind(this),this.challenge=this._challenge.bind(this),this.verify=this._verify.bind(this),this.authenticate=this._authenticate.bind(this),this.register=this._register.bind(this)}async _enroll(e){return this.client.mfa.enroll(Object.assign(Object.assign({},e),{factorType:"webauthn"}))}async _challenge({factorId:e,webauthn:t,friendlyName:i,signal:s},n){var a;try{let{data:o,error:l}=await this.client.mfa.challenge({factorId:e,webauthn:t});if(!o)return{data:null,error:l};let c=s??Ot.createNewAbortSignal();if(o.webauthn.type==="create"){let{user:h}=o.webauthn.credential_options.publicKey;if(!h.name){let u=i;if(u)h.name=`${h.id}:${u}`;else{let d=(await this.client.getUser()).data.user,p=((a=d?.user_metadata)===null||a===void 0?void 0:a.name)||d?.email||d?.id||"User";h.name=`${h.id}:${p}`}}h.displayName||(h.displayName=h.name)}switch(o.webauthn.type){case"create":{let h=vn(o.webauthn.credential_options.publicKey,n?.create),{data:u,error:f}=await hr({publicKey:h,signal:c});return u?{data:{factorId:e,challengeId:o.id,webauthn:{type:o.webauthn.type,credential_response:u}},error:null}:{data:null,error:f}}case"request":{let h=bn(o.webauthn.credential_options.publicKey,n?.request),{data:u,error:f}=await ur(Object.assign(Object.assign({},o.webauthn.credential_options),{publicKey:h,signal:c}));return u?{data:{factorId:e,challengeId:o.id,webauthn:{type:o.webauthn.type,credential_response:u}},error:null}:{data:null,error:f}}}}catch(o){return y(o)?{data:null,error:o}:{data:null,error:new j("Unexpected error in challenge",o)}}}async _verify({challengeId:e,factorId:t,webauthn:i}){return this.client.mfa.verify({factorId:t,challengeId:e,webauthn:i})}async _authenticate({factorId:e,webauthn:{rpId:t=typeof window<"u"?window.location.hostname:void 0,rpOrigins:i=typeof window<"u"?[window.location.origin]:void 0,signal:s}={}},n){if(!t)return{data:null,error:new re("rpId is required for WebAuthn authentication")};try{if(!st())return{data:null,error:new j("Browser does not support WebAuthn",null)};let{data:a,error:o}=await this.challenge({factorId:e,webauthn:{rpId:t,rpOrigins:i},signal:s},{request:n});if(!a)return{data:null,error:o};let{webauthn:l}=a;return this._verify({factorId:e,challengeId:a.challengeId,webauthn:{type:l.type,rpId:t,rpOrigins:i,credential_response:l.credential_response}})}catch(a){return y(a)?{data:null,error:a}:{data:null,error:new j("Unexpected error in authenticate",a)}}}async _register({friendlyName:e,webauthn:{rpId:t=typeof window<"u"?window.location.hostname:void 0,rpOrigins:i=typeof window<"u"?[window.location.origin]:void 0,signal:s}={}},n){if(!t)return{data:null,error:new re("rpId is required for WebAuthn registration")};try{if(!st())return{data:null,error:new j("Browser does not support WebAuthn",null)};let{data:a,error:o}=await this._enroll({friendlyName:e});if(!a)return await this.client.mfa.listFactors().then(h=>{var u;return(u=h.data)===null||u===void 0?void 0:u.all.find(f=>f.factor_type==="webauthn"&&f.friendly_name===e&&f.status!=="unverified")}).then(h=>h?this.client.mfa.unenroll({factorId:h?.id}):void 0),{data:null,error:o};let{data:l,error:c}=await this._challenge({factorId:a.id,friendlyName:a.friendly_name,webauthn:{rpId:t,rpOrigins:i},signal:s},{create:n});return l?this._verify({factorId:a.id,challengeId:l.challengeId,webauthn:{rpId:t,rpOrigins:i,type:l.webauthn.type,credential_response:l.webauthn.credential_response}}):{data:null,error:c}}catch(a){return y(a)?{data:null,error:a}:{data:null,error:new j("Unexpected error in register",a)}}}};Ai();var _n={url:Qr,storageKey:Yr,autoRefreshToken:!0,persistSession:!0,detectSessionInUrl:!0,headers:Xr,flowType:"implicit",debug:!1,hasCustomAuthorizationHeader:!1,throwOnError:!1,lockAcquireTimeout:5e3,skipAutoInitialize:!1,experimental:{}};var Ce={},ji=!1,jt=class r{get jwks(){var e,t;return(t=(e=Ce[this.storageKey])===null||e===void 0?void 0:e.jwks)!==null&&t!==void 0?t:{keys:[]}}set jwks(e){Ce[this.storageKey]=Object.assign(Object.assign({},Ce[this.storageKey]),{jwks:e})}get jwks_cached_at(){var e,t;return(t=(e=Ce[this.storageKey])===null||e===void 0?void 0:e.cachedAt)!==null&&t!==void 0?t:Number.MIN_SAFE_INTEGER}set jwks_cached_at(e){Ce[this.storageKey]=Object.assign(Object.assign({},Ce[this.storageKey]),{cachedAt:e})}constructor(e){var t,i,s;this.userStorage=null,this.memoryStorage=null,this.stateChangeEmitters=new Map,this.autoRefreshTicker=null,this.autoRefreshTickTimeout=null,this.visibilityChangedCallback=null,this.refreshingDeferred=null,this.lastRefreshFailure=null,this._sessionRemovalEpoch=0,this.initializePromise=null,this._pendingInitNotifications=null,this.detectSessionInUrl=!0,this.hasCustomAuthorizationHeader=!1,this.suppressGetSessionWarning=!1,this.lock=null,this.lockAcquired=!1,this.pendingInLock=[],this.broadcastChannel=null,this.logger=console.log;let n=Object.assign(Object.assign({},_n),e);if(this.storageKey=n.storageKey,this.instanceID=(t=r.nextInstanceID[this.storageKey])!==null&&t!==void 0?t:0,r.nextInstanceID[this.storageKey]=this.instanceID+1,this.logDebugMessages=!!n.debug,typeof n.debug=="function"&&(this.logger=n.debug),this.instanceID>0&&R()){let a=`${this._logPrefix()} Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.`;console.warn(a),this.logDebugMessages&&console.trace(a)}if(this.persistSession=n.persistSession,this.autoRefreshToken=n.autoRefreshToken,this.experimental=(i=n.experimental)!==null&&i!==void 0?i:{},this.admin=new de({url:n.url,headers:n.headers,fetch:n.fetch,experimental:this.experimental}),this.url=n.url,this.headers=n.headers,this.fetch=St(n.fetch),this.detectSessionInUrl=n.detectSessionInUrl,this.flowType=n.flowType,this.hasCustomAuthorizationHeader=n.hasCustomAuthorizationHeader,this.throwOnError=n.throwOnError,this.lockAcquireTimeout=n.lockAcquireTimeout,n.lock!=null&&(this.lock=n.lock,ji||(ji=!0,console.warn(`${this._logPrefix()} The "lock" option is deprecated and will be removed in v3. The client now coordinates session refreshes without a lock, so most apps can drop the option. See https://github.com/supabase/supabase-js/blob/master/packages/core/auth-js/migrations/lockless-coordination.md`))),this.jwks||(this.jwks={keys:[]},this.jwks_cached_at=Number.MIN_SAFE_INTEGER),this.mfa={verify:this._verify.bind(this),enroll:this._enroll.bind(this),unenroll:this._unenroll.bind(this),challenge:this._challenge.bind(this),listFactors:this._listFactors.bind(this),challengeAndVerify:this._challengeAndVerify.bind(this),getAuthenticatorAssuranceLevel:this._getAuthenticatorAssuranceLevel.bind(this),webauthn:new Rt(this)},this.oauth={getAuthorizationDetails:this._getAuthorizationDetails.bind(this),approveAuthorization:this._approveAuthorization.bind(this),denyAuthorization:this._denyAuthorization.bind(this),listGrants:this._listOAuthGrants.bind(this),revokeGrant:this._revokeOAuthGrant.bind(this)},this.passkey={startRegistration:this._startPasskeyRegistration.bind(this),verifyRegistration:this._verifyPasskeyRegistration.bind(this),startAuthentication:this._startPasskeyAuthentication.bind(this),verifyAuthentication:this._verifyPasskeyAuthentication.bind(this),list:this._listPasskeys.bind(this),update:this._updatePasskey.bind(this),delete:this._deletePasskey.bind(this)},this.persistSession?(n.storage?this.storage=n.storage:Et()?this.storage=globalThis.localStorage:(this.memoryStorage={},this.storage=rr(this.memoryStorage)),n.userStorage&&(this.userStorage=n.userStorage)):(this.memoryStorage={},this.storage=rr(this.memoryStorage)),R()&&globalThis.BroadcastChannel&&this.persistSession&&this.storageKey){try{this.broadcastChannel=new globalThis.BroadcastChannel(this.storageKey)}catch(a){console.error("Failed to create a new BroadcastChannel, multi-tab state changes will not be available",a)}(s=this.broadcastChannel)===null||s===void 0||s.addEventListener("message",async a=>{this._debug("received broadcast notification from other tab or client",a),(a.data.event==="TOKEN_REFRESHED"||a.data.event==="SIGNED_IN")&&(this.lastRefreshFailure=null);try{await this._notifyAllSubscribers(a.data.event,a.data.session,!1)}catch(o){this._debug("#broadcastChannel","error",o)}})}n.skipAutoInitialize||this.initialize().catch(a=>{this._debug("#initialize()","error",a)})}isThrowOnErrorEnabled(){return this.throwOnError}_returnResult(e){if(this.throwOnError&&e&&e.error)throw e.error;return e}_logPrefix(){return`GoTrueClient@${this.storageKey}:${this.instanceID} (${vt}) ${new Date().toISOString()}`}_debug(...e){return this.logDebugMessages&&this.logger(this._logPrefix(),...e),this}async initialize(){var e;if(this.initializePromise)return await this.initializePromise;this._pendingInitNotifications=[],this.initializePromise=(async()=>this.lock!=null?await this._acquireLock(this.lockAcquireTimeout,async()=>await this._initialize()):await this._initialize())();let t=await this.initializePromise,i=(e=this._pendingInitNotifications)!==null&&e!==void 0?e:[];this._pendingInitNotifications=null;for(let s of i)await this._notifyAllSubscribers(s.event,s.session,s.broadcast);return t}async _initialize(){var e;try{let t={},i="none";if(R()&&(t=Yt(window.location.href),this._isImplicitGrantCallback(t)?i="implicit":await this._isPKCECallback(t)&&(i="pkce")),R()&&this.detectSessionInUrl&&i!=="none"){let{data:s,error:n}=await this._getSessionFromURL(t,i);if(n){if(this._debug("#_initialize()","error detecting session from URL",n),ri(n)){let l=(e=n.details)===null||e===void 0?void 0:e.code;if(l==="identity_already_exists"||l==="identity_not_found"||l==="single_identity_not_deletable")return{error:n}}return{error:n}}let{session:a,redirectType:o}=s;return this._debug("#_initialize()","detected session in URL",a,"redirect type",o),await this._saveSession(a),setTimeout(async()=>{o==="recovery"?await this._notifyAllSubscribers("PASSWORD_RECOVERY",a):await this._notifyAllSubscribers("SIGNED_IN",a)},0),{error:null}}return await this._recoverAndRefresh(),{error:null}}catch(t){return y(t)?this._returnResult({error:t}):this._returnResult({error:new j("Unexpected error during initialization",t)})}finally{await this._handleVisibilityChange(),this._debug("#_initialize()","end")}}async signInAnonymously(e){var t,i,s;try{let n=await v(this.fetch,"POST",`${this.url}/signup`,{headers:this.headers,body:{data:(i=(t=e?.options)===null||t===void 0?void 0:t.data)!==null&&i!==void 0?i:{},gotrue_meta_security:{captcha_token:(s=e?.options)===null||s===void 0?void 0:s.captchaToken}},xform:M}),{data:a,error:o}=n;if(o||!a)return this._returnResult({data:{user:null,session:null},error:o});let l=a.session,c=a.user;return a.session&&(await this._saveSession(a.session),await this._notifyAllSubscribers("SIGNED_IN",l)),this._returnResult({data:{user:c,session:l},error:null})}catch(n){if(y(n))return this._returnResult({data:{user:null,session:null},error:n});throw n}}async signUp(e){var t,i,s;let n=null;try{let a;if("email"in e){let{email:u,password:f,options:d}=e,p=null,g=null;this.flowType==="pkce"&&([p,g,n]=await this._getCodeChallengeAndMethod()),a=await v(this.fetch,"POST",`${this.url}/signup`,{headers:this.headers,redirectTo:this._maybeAppendFlowIdToRedirect(d?.emailRedirectTo,n),body:{email:u,password:f,data:(t=d?.data)!==null&&t!==void 0?t:{},gotrue_meta_security:{captcha_token:d?.captchaToken},code_challenge:p,code_challenge_method:g},xform:M})}else if("phone"in e){let{phone:u,password:f,options:d}=e;a=await v(this.fetch,"POST",`${this.url}/signup`,{headers:this.headers,body:{phone:u,password:f,data:(i=d?.data)!==null&&i!==void 0?i:{},channel:(s=d?.channel)!==null&&s!==void 0?s:"sms",gotrue_meta_security:{captcha_token:d?.captchaToken}},xform:M})}else throw new ae("You must provide either an email or phone number and a password");let{data:o,error:l}=a;if(l||!o)return await D(this.storage,this.storageKey,n),this._returnResult({data:{user:null,session:null},error:l});let c=o.session,h=o.user;return o.session&&(await this._saveSession(o.session),await this._notifyAllSubscribers("SIGNED_IN",c)),this._returnResult({data:{user:h,session:c},error:null})}catch(a){if(await D(this.storage,this.storageKey,n),y(a))return this._returnResult({data:{user:null,session:null},error:a});throw a}}async signInWithPassword(e){try{let t;if("email"in e){let{email:n,password:a,options:o}=e;t=await v(this.fetch,"POST",`${this.url}/token?grant_type=password`,{headers:this.headers,body:{email:n,password:a,gotrue_meta_security:{captcha_token:o?.captchaToken}},xform:er})}else if("phone"in e){let{phone:n,password:a,options:o}=e;t=await v(this.fetch,"POST",`${this.url}/token?grant_type=password`,{headers:this.headers,body:{phone:n,password:a,gotrue_meta_security:{captcha_token:o?.captchaToken}},xform:er})}else throw new ae("You must provide either an email or phone number and a password");let{data:i,error:s}=t;if(s)return this._returnResult({data:{user:null,session:null},error:s});if(!i||!i.session||!i.user){let n=new Z;return this._returnResult({data:{user:null,session:null},error:n})}return i.session&&(await this._saveSession(i.session),await this._notifyAllSubscribers("SIGNED_IN",i.session)),this._returnResult({data:Object.assign({user:i.user,session:i.session},i.weak_password?{weakPassword:i.weak_password}:null),error:s})}catch(t){if(y(t))return this._returnResult({data:{user:null,session:null},error:t});throw t}}async signInWithOAuth(e){var t,i,s,n;return await this._handleProviderSignIn(e.provider,{redirectTo:(t=e.options)===null||t===void 0?void 0:t.redirectTo,scopes:(i=e.options)===null||i===void 0?void 0:i.scopes,queryParams:(s=e.options)===null||s===void 0?void 0:s.queryParams,skipBrowserRedirect:(n=e.options)===null||n===void 0?void 0:n.skipBrowserRedirect})}async exchangeCodeForSession(e,t){return await this.initializePromise,this.lock!=null?this._acquireLock(this.lockAcquireTimeout,async()=>this._exchangeCodeForSession(e,t)):this._exchangeCodeForSession(e,t)}async signInWithWeb3(e){let{chain:t}=e;switch(t){case"ethereum":return await this.signInWithEthereum(e);case"solana":return await this.signInWithSolana(e);default:throw new Error(`@supabase/auth-js: Unsupported chain "${t}"`)}}async signInWithEthereum(e){var t,i,s,n,a,o,l,c,h,u,f;let d,p;if("message"in e)d=e.message,p=e.signature;else{let{chain:g,wallet:m,statement:w,options:_}=e,b;if(R())if(typeof m=="object")b=m;else{let Q=window;if("ethereum"in Q&&typeof Q.ethereum=="object"&&"request"in Q.ethereum&&typeof Q.ethereum.request=="function")b=Q.ethereum;else throw new Error("@supabase/auth-js: No compatible Ethereum wallet interface on the window object (window.ethereum) detected. Make sure the user already has a wallet installed and connected for this app. Prefer passing the wallet interface object directly to signInWithWeb3({ chain: 'ethereum', wallet: resolvedUserWallet }) instead.")}else{if(typeof m!="object"||!_?.url)throw new Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");b=m}let k=new URL((t=_?.url)!==null&&t!==void 0?t:window.location.href),L=await b.request({method:"eth_requestAccounts"}).then(Q=>Q).catch(()=>{throw new Error("@supabase/auth-js: Wallet method eth_requestAccounts is missing or invalid")});if(!L||L.length===0)throw new Error("@supabase/auth-js: No accounts available. Please ensure the wallet is connected.");let E=ir(L[0]),A=(i=_?.signInWithEthereum)===null||i===void 0?void 0:i.chainId;if(!A){let Q=await b.request({method:"eth_chainId"});A=Ti(Q)}let Oe={domain:k.host,address:E,statement:w,uri:k.href,version:"1",chainId:A,nonce:(s=_?.signInWithEthereum)===null||s===void 0?void 0:s.nonce,issuedAt:(a=(n=_?.signInWithEthereum)===null||n===void 0?void 0:n.issuedAt)!==null&&a!==void 0?a:new Date,expirationTime:(o=_?.signInWithEthereum)===null||o===void 0?void 0:o.expirationTime,notBefore:(l=_?.signInWithEthereum)===null||l===void 0?void 0:l.notBefore,requestId:(c=_?.signInWithEthereum)===null||c===void 0?void 0:c.requestId,resources:(h=_?.signInWithEthereum)===null||h===void 0?void 0:h.resources};d=Ci(Oe),p=await b.request({method:"personal_sign",params:[Ii(d),E]})}try{let{data:g,error:m}=await v(this.fetch,"POST",`${this.url}/token?grant_type=web3`,{headers:this.headers,body:Object.assign({chain:"ethereum",message:d,signature:p},!((u=e.options)===null||u===void 0)&&u.captchaToken?{gotrue_meta_security:{captcha_token:(f=e.options)===null||f===void 0?void 0:f.captchaToken}}:null),xform:M});if(m)throw m;if(!g||!g.session||!g.user){let w=new Z;return this._returnResult({data:{user:null,session:null},error:w})}return g.session&&(await this._saveSession(g.session),await this._notifyAllSubscribers("SIGNED_IN",g.session)),this._returnResult({data:Object.assign({},g),error:m})}catch(g){if(y(g))return this._returnResult({data:{user:null,session:null},error:g});throw g}}async signInWithSolana(e){var t,i,s,n,a,o,l,c,h,u,f,d;let p,g;if("message"in e)p=e.message,g=e.signature;else{let{chain:m,wallet:w,statement:_,options:b}=e,k;if(R())if(typeof w=="object")k=w;else{let E=window;if("solana"in E&&typeof E.solana=="object"&&("signIn"in E.solana&&typeof E.solana.signIn=="function"||"signMessage"in E.solana&&typeof E.solana.signMessage=="function"))k=E.solana;else throw new Error("@supabase/auth-js: No compatible Solana wallet interface on the window object (window.solana) detected. Make sure the user already has a wallet installed and connected for this app. Prefer passing the wallet interface object directly to signInWithWeb3({ chain: 'solana', wallet: resolvedUserWallet }) instead.")}else{if(typeof w!="object"||!b?.url)throw new Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");k=w}let L=new URL((t=b?.url)!==null&&t!==void 0?t:window.location.href);if("signIn"in k&&k.signIn){let E=await k.signIn(Object.assign(Object.assign(Object.assign({issuedAt:new Date().toISOString()},b?.signInWithSolana),{version:"1",domain:L.host,uri:L.href}),_?{statement:_}:null)),A;if(Array.isArray(E)&&E[0]&&typeof E[0]=="object")A=E[0];else if(E&&typeof E=="object"&&"signedMessage"in E&&"signature"in E)A=E;else throw new Error("@supabase/auth-js: Wallet method signIn() returned unrecognized value");if("signedMessage"in A&&"signature"in A&&(typeof A.signedMessage=="string"||A.signedMessage instanceof Uint8Array)&&A.signature instanceof Uint8Array)p=typeof A.signedMessage=="string"?A.signedMessage:new TextDecoder().decode(A.signedMessage),g=A.signature;else throw new Error("@supabase/auth-js: Wallet method signIn() API returned object without signedMessage and signature fields")}else{if(!("signMessage"in k)||typeof k.signMessage!="function"||!("publicKey"in k)||typeof k!="object"||!k.publicKey||!("toBase58"in k.publicKey)||typeof k.publicKey.toBase58!="function")throw new Error("@supabase/auth-js: Wallet does not have a compatible signMessage() and publicKey.toBase58() API");p=[`${L.host} wants you to sign in with your Solana account:`,k.publicKey.toBase58(),..._?["",_,""]:[""],"Version: 1",`URI: ${L.href}`,`Issued At: ${(s=(i=b?.signInWithSolana)===null||i===void 0?void 0:i.issuedAt)!==null&&s!==void 0?s:new Date().toISOString()}`,...!((n=b?.signInWithSolana)===null||n===void 0)&&n.notBefore?[`Not Before: ${b.signInWithSolana.notBefore}`]:[],...!((a=b?.signInWithSolana)===null||a===void 0)&&a.expirationTime?[`Expiration Time: ${b.signInWithSolana.expirationTime}`]:[],...!((o=b?.signInWithSolana)===null||o===void 0)&&o.chainId?[`Chain ID: ${b.signInWithSolana.chainId}`]:[],...!((l=b?.signInWithSolana)===null||l===void 0)&&l.nonce?[`Nonce: ${b.signInWithSolana.nonce}`]:[],...!((c=b?.signInWithSolana)===null||c===void 0)&&c.requestId?[`Request ID: ${b.signInWithSolana.requestId}`]:[],...!((u=(h=b?.signInWithSolana)===null||h===void 0?void 0:h.resources)===null||u===void 0)&&u.length?["Resources",...b.signInWithSolana.resources.map(A=>`- ${A}`)]:[]].join(`
`);let E=await k.signMessage(new TextEncoder().encode(p),"utf8");if(!E||!(E instanceof Uint8Array))throw new Error("@supabase/auth-js: Wallet signMessage() API returned an recognized value");g=E}}try{let{data:m,error:w}=await v(this.fetch,"POST",`${this.url}/token?grant_type=web3`,{headers:this.headers,body:Object.assign({chain:"solana",message:p,signature:ee(g)},!((f=e.options)===null||f===void 0)&&f.captchaToken?{gotrue_meta_security:{captcha_token:(d=e.options)===null||d===void 0?void 0:d.captchaToken}}:null),xform:M});if(w)throw w;if(!m||!m.session||!m.user){let _=new Z;return this._returnResult({data:{user:null,session:null},error:_})}return m.session&&(await this._saveSession(m.session),await this._notifyAllSubscribers("SIGNED_IN",m.session)),this._returnResult({data:Object.assign({},m),error:w})}catch(m){if(y(m))return this._returnResult({data:{user:null,session:null},error:m});throw m}}async _exchangeCodeForSession(e,t){let i=t?.flowId!=null,s=i?it(t?.flowId):R()?it(Yt(window.location.href)[X]):null;i&&!s&&this._debug("#_exchangeCodeForSession()","provided flowId is not a valid flow id",t?.flowId);let{verifier:n,flowId:a}=i&&!s?{verifier:null,flowId:null}:await pi(this.storage,this.storageKey,s),[o,l]=(n??"").split("/");try{if(!o&&this.flowType==="pkce")throw new xt;let{data:c,error:h}=await v(this.fetch,"POST",`${this.url}/token?grant_type=pkce`,{headers:this.headers,body:{auth_code:e,code_verifier:o},xform:M});if(await D(this.storage,this.storageKey,a),h)throw h;if(!c||!c.session||!c.user){let u=new Z;return this._returnResult({data:{user:null,session:null,redirectType:null},error:u})}return c.session&&(await this._saveSession(c.session),await this._notifyAllSubscribers(l==="recovery"?"PASSWORD_RECOVERY":"SIGNED_IN",c.session)),this._returnResult({data:Object.assign(Object.assign({},c),{redirectType:l??null}),error:h})}catch(c){if(await D(this.storage,this.storageKey,a),y(c))return this._returnResult({data:{user:null,session:null,redirectType:null},error:c});throw c}}async signInWithIdToken(e){try{let{options:t,provider:i,token:s,access_token:n,nonce:a}=e,o=await v(this.fetch,"POST",`${this.url}/token?grant_type=id_token`,{headers:this.headers,body:{provider:i,id_token:s,access_token:n,nonce:a,gotrue_meta_security:{captcha_token:t?.captchaToken}},xform:M}),{data:l,error:c}=o;if(c)return this._returnResult({data:{user:null,session:null},error:c});if(!l||!l.session||!l.user){let h=new Z;return this._returnResult({data:{user:null,session:null},error:h})}return l.session&&(await this._saveSession(l.session),await this._notifyAllSubscribers("SIGNED_IN",l.session)),this._returnResult({data:l,error:c})}catch(t){if(y(t))return this._returnResult({data:{user:null,session:null},error:t});throw t}}async signInWithOtp(e){var t,i,s,n,a;let o=null;try{if("email"in e){let{email:l,options:c}=e,h=null,u=null;this.flowType==="pkce"&&([h,u,o]=await this._getCodeChallengeAndMethod());let{error:f}=await v(this.fetch,"POST",`${this.url}/otp`,{headers:this.headers,body:{email:l,data:(t=c?.data)!==null&&t!==void 0?t:{},create_user:(i=c?.shouldCreateUser)!==null&&i!==void 0?i:!0,gotrue_meta_security:{captcha_token:c?.captchaToken},code_challenge:h,code_challenge_method:u},redirectTo:this._maybeAppendFlowIdToRedirect(c?.emailRedirectTo,o)});return this._returnResult({data:{user:null,session:null},error:f})}if("phone"in e){let{phone:l,options:c}=e,{data:h,error:u}=await v(this.fetch,"POST",`${this.url}/otp`,{headers:this.headers,body:{phone:l,data:(s=c?.data)!==null&&s!==void 0?s:{},create_user:(n=c?.shouldCreateUser)!==null&&n!==void 0?n:!0,gotrue_meta_security:{captcha_token:c?.captchaToken},channel:(a=c?.channel)!==null&&a!==void 0?a:"sms"}});return this._returnResult({data:{user:null,session:null,messageId:h?.message_id},error:u})}throw new ae("You must provide either an email or phone number.")}catch(l){if(await D(this.storage,this.storageKey,o),y(l))return this._returnResult({data:{user:null,session:null},error:l});throw l}}async verifyOtp(e){var t,i;try{let s,n;"options"in e&&(s=(t=e.options)===null||t===void 0?void 0:t.redirectTo,n=(i=e.options)===null||i===void 0?void 0:i.captchaToken);let{data:a,error:o}=await v(this.fetch,"POST",`${this.url}/verify`,{headers:this.headers,body:Object.assign(Object.assign({},e),{gotrue_meta_security:{captcha_token:n}}),redirectTo:s,xform:M});if(o)throw o;if(!a)throw new Error("An error occurred on token verification.");let l=a.session,c=a.user;return l?.access_token&&(await this._saveSession(l),await this._notifyAllSubscribers(e.type=="recovery"?"PASSWORD_RECOVERY":"SIGNED_IN",l)),this._returnResult({data:{user:c,session:l},error:null})}catch(s){if(y(s))return this._returnResult({data:{user:null,session:null},error:s});throw s}}async signInWithSSO(e){var t,i,s,n;let a=null;try{let o=null,l=null;this.flowType==="pkce"&&([o,l,a]=await this._getCodeChallengeAndMethod());let c=await v(this.fetch,"POST",`${this.url}/sso`,{body:Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({},"providerId"in e?{provider_id:e.providerId}:null),"domain"in e?{domain:e.domain}:null),{redirect_to:this._maybeAppendFlowIdToRedirect((t=e.options)===null||t===void 0?void 0:t.redirectTo,a)}),!((i=e?.options)===null||i===void 0)&&i.captchaToken?{gotrue_meta_security:{captcha_token:e.options.captchaToken}}:null),{skip_http_redirect:!0,code_challenge:o,code_challenge_method:l}),headers:this.headers,xform:Ei});return!((s=c.data)===null||s===void 0)&&s.url&&R()&&!(!((n=e.options)===null||n===void 0)&&n.skipBrowserRedirect)&&window.location.assign(c.data.url),this._returnResult(c)}catch(o){if(await D(this.storage,this.storageKey,a),y(o))return this._returnResult({data:null,error:o});throw o}}async reauthenticate(){return await this.initializePromise,this.lock!=null?await this._acquireLock(this.lockAcquireTimeout,async()=>await this._reauthenticate()):await this._reauthenticate()}async _reauthenticate(){try{return await this._useSession(async e=>{let{data:{session:t},error:i}=e;if(i)throw i;if(!t)throw new I;let{error:s}=await v(this.fetch,"GET",`${this.url}/reauthenticate`,{headers:this.headers,jwt:t.access_token});return this._returnResult({data:{user:null,session:null},error:s})})}catch(e){if(y(e))return this._returnResult({data:{user:null,session:null},error:e});throw e}}async resend(e){let t=null;try{let i=`${this.url}/resend`;if("email"in e){let{email:s,type:n,options:a}=e,o=null,l=null;this.flowType==="pkce"&&([o,l,t]=await this._getCodeChallengeAndMethod());let{error:c}=await v(this.fetch,"POST",i,{headers:this.headers,body:{email:s,type:n,gotrue_meta_security:{captcha_token:a?.captchaToken},code_challenge:o,code_challenge_method:l},redirectTo:this._maybeAppendFlowIdToRedirect(a?.emailRedirectTo,t)});return c&&await D(this.storage,this.storageKey,t),this._returnResult({data:{user:null,session:null},error:c})}else if("phone"in e){let{phone:s,type:n,options:a}=e,{data:o,error:l}=await v(this.fetch,"POST",i,{headers:this.headers,body:{phone:s,type:n,gotrue_meta_security:{captcha_token:a?.captchaToken}}});return this._returnResult({data:{user:null,session:null,messageId:o?.message_id},error:l})}throw new ae("You must provide either an email or phone number and a type")}catch(i){if(await D(this.storage,this.storageKey,t),y(i))return this._returnResult({data:{user:null,session:null},error:i});throw i}}async getSession(){return await this.initializePromise,this.lock!=null?await this._acquireLock(this.lockAcquireTimeout,async()=>this._useSession(async e=>e)):await this._useSession(async e=>e)}async _acquireLock(e,t){this._debug("#_acquireLock","begin",e);try{if(this.lockAcquired){let i=this.pendingInLock.length?this.pendingInLock[this.pendingInLock.length-1]:Promise.resolve(),s=(async()=>(await i,await t()))();return this.pendingInLock.push((async()=>{try{await s}catch{}})()),s}return await this.lock(`lock:${this.storageKey}`,e,async()=>{this._debug("#_acquireLock","lock acquired for storage key",this.storageKey);try{this.lockAcquired=!0;let i=t();for(this.pendingInLock.push((async()=>{try{await i}catch{}})()),await i;this.pendingInLock.length;){let s=[...this.pendingInLock];await Promise.all(s),this.pendingInLock.splice(0,s.length)}return await i}finally{this._debug("#_acquireLock","lock released for storage key",this.storageKey),this.lockAcquired=!1}})}finally{this._debug("#_acquireLock","end")}}async _useSession(e){this._debug("#_useSession","begin");try{let t=await this.__loadSession();return await e(t)}finally{this._debug("#_useSession","end")}}async __loadSession(){this._debug("#__loadSession()","begin"),this.lock!=null&&!this.lockAcquired&&this._debug("#__loadSession()","used outside of an acquired lock!",new Error().stack);try{let e=null,t=await O(this.storage,this.storageKey);if(this._debug("#getSession()","session from storage",t),t!==null&&(this._isValidSession(t)?e=t:(this._debug("#getSession()","session from storage is not valid"),await this._removeSession())),!e)return{data:{session:null},error:null};let i=e.expires_at?e.expires_at*1e3-Date.now()<bt:!1;if(this._debug("#__loadSession()",`session has${i?"":" not"} expired`,"expires_at",e.expires_at),!i){if(this.userStorage){let a=await O(this.userStorage,this.storageKey+"-user");a?.user?e.user=a.user:e.user=At()}if(this.storage.isServer&&e.user&&!e.user.__isUserNotAvailableProxy){let a={value:this.suppressGetSessionWarning};e.user=_i(e.user,a),a.value&&(this.suppressGetSessionWarning=!0)}return{data:{session:e},error:null}}let{data:s,error:n}=await this._callRefreshToken(e.refresh_token);if(n){if(!!(e.expires_at&&e.expires_at*1e3>Date.now())){let o=await O(this.storage,this.storageKey);if(o&&o.refresh_token===e.refresh_token)return this._returnResult({data:{session:e},error:null})}return this._returnResult({data:{session:null},error:n})}return this._returnResult({data:{session:s},error:null})}finally{this._debug("#__loadSession()","end")}}async getUser(e){if(e)return await this._getUser(e);await this.initializePromise;let t;return this.lock!=null?t=await this._acquireLock(this.lockAcquireTimeout,async()=>await this._getUser()):t=await this._getUser(),t.data.user&&(this.suppressGetSessionWarning=!0),t}async _getUser(e){try{return e?await v(this.fetch,"GET",`${this.url}/user`,{headers:this.headers,jwt:e,xform:J}):await this._useSession(async t=>{var i,s,n;let{data:a,error:o}=t;if(o)throw o;return!(!((i=a.session)===null||i===void 0)&&i.access_token)&&!this.hasCustomAuthorizationHeader?{data:{user:null},error:new I}:await v(this.fetch,"GET",`${this.url}/user`,{headers:this.headers,jwt:(n=(s=a.session)===null||s===void 0?void 0:s.access_token)!==null&&n!==void 0?n:void 0,xform:J})})}catch(t){if(y(t))return Xe(t)&&await this._removeSession(),this._returnResult({data:{user:null},error:t});throw t}}async updateUser(e,t={}){return await this.initializePromise,this.lock!=null?await this._acquireLock(this.lockAcquireTimeout,async()=>await this._updateUser(e,t)):await this._updateUser(e,t)}async _updateUser(e,t={}){let i=null;try{return await this._useSession(async s=>{let{data:n,error:a}=s;if(a)throw a;if(!n.session)throw new I;let o=n.session,l=null,c=null;this.flowType==="pkce"&&e.email!=null&&([l,c,i]=await this._getCodeChallengeAndMethod());let{data:h,error:u}=await v(this.fetch,"PUT",`${this.url}/user`,{headers:this.headers,redirectTo:this._maybeAppendFlowIdToRedirect(t?.emailRedirectTo,i),body:Object.assign(Object.assign({},e),{code_challenge:l,code_challenge_method:c}),jwt:o.access_token,xform:J});if(u)throw u;return o.user=h.user,await this._saveSession(o),await this._notifyAllSubscribers("USER_UPDATED",o),this._returnResult({data:{user:o.user},error:null})})}catch(s){if(await D(this.storage,this.storageKey,i),y(s))return this._returnResult({data:{user:null},error:s});throw s}}async setSession(e){return await this.initializePromise,this.lock!=null?await this._acquireLock(this.lockAcquireTimeout,async()=>await this._setSession(e)):await this._setSession(e)}async _setSession(e){try{if(!e.access_token||!e.refresh_token)throw new I;let t=Date.now()/1e3,i=t,s=!0,n=null,{payload:a}=rt(e.access_token);if(a.exp&&(i=a.exp,s=i<=t),s){let{data:o,error:l}=await this._callRefreshToken(e.refresh_token);if(l)return this._returnResult({data:{user:null,session:null},error:l});if(!o)return{data:{user:null,session:null},error:null};n=o}else{let{data:o,error:l}=await this._getUser(e.access_token);if(l)return this._returnResult({data:{user:null,session:null},error:l});n={access_token:e.access_token,refresh_token:e.refresh_token,user:o.user,token_type:"bearer",expires_in:i-t,expires_at:i},await this._saveSession(n),await this._notifyAllSubscribers("SIGNED_IN",n)}return this._returnResult({data:{user:n.user,session:n},error:null})}catch(t){if(y(t))return this._returnResult({data:{session:null,user:null},error:t});throw t}}async refreshSession(e){return await this.initializePromise,this.lock!=null?await this._acquireLock(this.lockAcquireTimeout,async()=>await this._refreshSession(e)):await this._refreshSession(e)}async _refreshSession(e){try{return await this._useSession(async t=>{var i;if(!e){let{data:a,error:o}=t;if(o)throw o;e=(i=a.session)!==null&&i!==void 0?i:void 0}if(!e?.refresh_token)throw new I;let{data:s,error:n}=await this._callRefreshToken(e.refresh_token);return n?this._returnResult({data:{user:null,session:null},error:n}):s?this._returnResult({data:{user:s.user,session:s},error:null}):this._returnResult({data:{user:null,session:null},error:null})})}catch(t){if(y(t))return this._returnResult({data:{user:null,session:null},error:t});throw t}}async _getSessionFromURL(e,t){var i;try{if(!R())throw new oe("No browser detected.");if(e.error||e.error_description||e.error_code)throw new oe(e.error_description||"Error in URL with unspecified error_description",{error:e.error||"unspecified_error",code:e.error_code||"unspecified_code"});switch(t){case"implicit":if(this.flowType==="pkce")throw new Je("Not a valid PKCE flow url.");break;case"pkce":if(this.flowType==="implicit")throw new oe("Not a valid implicit grant flow url.");break;default:}if(t==="pkce"){if(this._debug("#_initialize()","begin","is PKCE flow",!0),!e.code)throw new Je("No code detected.");let{data:b,error:k}=await this._exchangeCodeForSession(e.code,{flowId:e[X]});if(k)throw k;let L=new URL(window.location.href);return L.searchParams.delete("code"),L.searchParams.delete(X),window.history.replaceState(window.history.state,"",L.toString()),{data:{session:b.session,redirectType:(i=b.redirectType)!==null&&i!==void 0?i:null},error:null}}let{provider_token:s,provider_refresh_token:n,access_token:a,refresh_token:o,expires_in:l,expires_at:c,token_type:h}=e;if(!a||!l||!o||!h)throw new oe("No session defined in URL");let u=Math.round(Date.now()/1e3),f=parseInt(l),d=u+f;c&&(d=parseInt(c));let p=d-u;p*1e3<=z&&console.warn(`@supabase/gotrue-js: Session as retrieved from URL expires in ${p}s, should have been closer to ${f}s`);let g=d-f;u-g>=120?console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued over 120s ago, URL could be stale",g,d,u):u-g<0&&console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued in the future? Check the device clock for skew",g,d,u);let{data:m,error:w}=await this._getUser(a);if(w)throw w;let _={provider_token:s,provider_refresh_token:n,access_token:a,expires_in:f,expires_at:d,refresh_token:o,token_type:h,user:m.user};return window.location.hash="",this._debug("#_getSessionFromURL()","clearing window.location.hash"),this._returnResult({data:{session:_,redirectType:e.type},error:null})}catch(s){if(y(s))return this._returnResult({data:{session:null,redirectType:null},error:s});throw s}}_isImplicitGrantCallback(e){return typeof this.detectSessionInUrl=="function"?this.detectSessionInUrl(new URL(window.location.href),e):!!(e.access_token||e.error||e.error_description||e.error_code)}async _isPKCECallback(e){if(!e.code)return!1;let t=it(e[X]);return t&&await O(this.storage,he(this.storageKey,t))?!0:!!await O(this.storage,`${this.storageKey}-code-verifier`)}async signOut(e={scope:"global"}){return await this.initializePromise,this.lock!=null?await this._acquireLock(this.lockAcquireTimeout,async()=>await this._signOut(e)):await this._signOut(e)}async _signOut({scope:e}={scope:"global"}){return await this._useSession(async t=>{var i;let s=async()=>{await this._removeSession()},{data:n,error:a}=t;if(a&&!Xe(a))return this._returnResult({error:a});let o=(i=n.session)===null||i===void 0?void 0:i.access_token;if(o){let{error:l}=await this.admin.signOut(o,e);if(l&&!(Jt(l)&&(l.status===404||l.status===401||l.status===403)||Xe(l)))return e!=="others"&&await s(),this._returnResult({error:l})}return e!=="others"&&await s(),this._returnResult({error:null})})}onAuthStateChange(e){let t=ci(),i={id:t,callback:e,unsubscribe:()=>{this._debug("#unsubscribe()","state change callback with id removed",t),this.stateChangeEmitters.delete(t)}};return this._debug("#onAuthStateChange()","registered callback with id",t),this.stateChangeEmitters.set(t,i),(async()=>(await this.initializePromise,this.lock!=null?await this._acquireLock(this.lockAcquireTimeout,async()=>{this._emitInitialSession(t)}):await this._emitInitialSession(t)))(),{data:{subscription:i}}}async _emitInitialSession(e){return await this._useSession(async t=>{var i,s;try{let{data:{session:n},error:a}=t;if(a)throw a;await((i=this.stateChangeEmitters.get(e))===null||i===void 0?void 0:i.callback("INITIAL_SESSION",n)),this._debug("INITIAL_SESSION","callback id",e,"session",n)}catch(n){await((s=this.stateChangeEmitters.get(e))===null||s===void 0?void 0:s.callback("INITIAL_SESSION",null)),this._debug("INITIAL_SESSION","callback id",e,"error",n),Xe(n)||Ze(n)||Jt(n)&&(n.code==="refresh_token_not_found"||n.code==="refresh_token_already_used"||n.code==="session_expired")?console.warn(n):console.error(n)}})}async resetPasswordForEmail(e,t={}){let i=null,s=null,n=null;this.flowType==="pkce"&&([i,s,n]=await this._getCodeChallengeAndMethod(!0));try{return await v(this.fetch,"POST",`${this.url}/recover`,{body:{email:e,code_challenge:i,code_challenge_method:s,gotrue_meta_security:{captcha_token:t.captchaToken}},headers:this.headers,redirectTo:this._maybeAppendFlowIdToRedirect(t.redirectTo,n)})}catch(a){if(await D(this.storage,this.storageKey,n),y(a))return this._returnResult({data:null,error:a});throw a}}async getUserIdentities(){var e;try{let{data:t,error:i}=await this.getUser();if(i)throw i;return this._returnResult({data:{identities:(e=t.user.identities)!==null&&e!==void 0?e:[]},error:null})}catch(t){if(y(t))return this._returnResult({data:null,error:t});throw t}}async linkIdentity(e){return"token"in e?this.linkIdentityIdToken(e):this.linkIdentityOAuth(e)}async linkIdentityOAuth(e){var t;let i=null;try{let{data:s,error:n}=await this._useSession(async a=>{var o,l,c,h,u;let{data:f,error:d}=a;if(d)throw d;let{url:p,flowId:g}=await this._getUrlForProvider(`${this.url}/user/identities/authorize`,e.provider,{redirectTo:(o=e.options)===null||o===void 0?void 0:o.redirectTo,scopes:(l=e.options)===null||l===void 0?void 0:l.scopes,queryParams:(c=e.options)===null||c===void 0?void 0:c.queryParams,skipBrowserRedirect:!0});return i=g,await v(this.fetch,"GET",p,{headers:this.headers,jwt:(u=(h=f.session)===null||h===void 0?void 0:h.access_token)!==null&&u!==void 0?u:void 0})});if(n)throw n;return R()&&!(!((t=e.options)===null||t===void 0)&&t.skipBrowserRedirect)&&window.location.assign(s?.url),this._returnResult({data:{provider:e.provider,url:s?.url,flowId:i},error:null})}catch(s){if(y(s))return this._returnResult({data:{provider:e.provider,url:null,flowId:i},error:s});throw s}}async linkIdentityIdToken(e){return await this._useSession(async t=>{var i;try{let{error:s,data:{session:n}}=t;if(s)throw s;let{options:a,provider:o,token:l,access_token:c,nonce:h}=e,u=await v(this.fetch,"POST",`${this.url}/token?grant_type=id_token`,{headers:this.headers,jwt:(i=n?.access_token)!==null&&i!==void 0?i:void 0,body:{provider:o,id_token:l,access_token:c,nonce:h,link_identity:!0,gotrue_meta_security:{captcha_token:a?.captchaToken}},xform:M}),{data:f,error:d}=u;return d?this._returnResult({data:{user:null,session:null},error:d}):!f||!f.session||!f.user?this._returnResult({data:{user:null,session:null},error:new Z}):(f.session&&(await this._saveSession(f.session),await this._notifyAllSubscribers("USER_UPDATED",f.session)),this._returnResult({data:f,error:d}))}catch(s){if(await D(this.storage,this.storageKey,null),y(s))return this._returnResult({data:{user:null,session:null},error:s});throw s}})}async unlinkIdentity(e){try{return await this._useSession(async t=>{var i,s;let{data:n,error:a}=t;if(a)throw a;return await v(this.fetch,"DELETE",`${this.url}/user/identities/${e.identity_id}`,{headers:this.headers,jwt:(s=(i=n.session)===null||i===void 0?void 0:i.access_token)!==null&&s!==void 0?s:void 0})})}catch(t){if(y(t))return this._returnResult({data:null,error:t});throw t}}async _refreshAccessToken(e){let t="#_refreshAccessToken()";this._debug(t,"begin");try{let i=Date.now();return await di(async s=>(s>0&&await ui(200*Math.pow(2,s-1)),this._debug(t,"refreshing attempt",s),await v(this.fetch,"POST",`${this.url}/token?grant_type=refresh_token`,{body:{refresh_token:e},headers:this.headers,xform:M})),(s,n)=>{let a=200*Math.pow(2,s);return n&&Ze(n)&&Date.now()+a-i<z})}catch(i){if(this._debug(t,"error",i),y(i))return this._returnResult({data:{session:null,user:null},error:i});throw i}finally{this._debug(t,"end")}}_isValidSession(e){return typeof e=="object"&&e!==null&&"access_token"in e&&"refresh_token"in e&&"expires_at"in e}async _handleProviderSignIn(e,t){let{url:i,flowId:s}=await this._getUrlForProvider(`${this.url}/authorize`,e,{redirectTo:t.redirectTo,scopes:t.scopes,queryParams:t.queryParams});return this._debug("#_handleProviderSignIn()","provider",e,"options",t,"url",i),R()&&!t.skipBrowserRedirect&&window.location.assign(i),{data:{provider:e,url:i,flowId:s},error:null}}async _recoverAndRefresh(){var e,t;let i="#_recoverAndRefresh()";this._debug(i,"begin");try{let s=await O(this.storage,this.storageKey);if(s&&this.userStorage){let a=await O(this.userStorage,this.storageKey+"-user");!this.storage.isServer&&Object.is(this.storage,this.userStorage)&&!a&&(a={user:s.user},await V(this.userStorage,this.storageKey+"-user",a)),s.user=(e=a?.user)!==null&&e!==void 0?e:At()}else if(s&&!s.user&&!s.user){let a=await O(this.storage,this.storageKey+"-user");a&&a?.user?(s.user=a.user,await P(this.storage,this.storageKey+"-user"),await V(this.storage,this.storageKey,s)):s.user=At()}if(this._debug(i,"session from storage",s),!this._isValidSession(s)){this._debug(i,"session is not valid"),s!==null&&await this._removeSession();return}let n=((t=s.expires_at)!==null&&t!==void 0?t:1/0)*1e3-Date.now()<bt;if(this._debug(i,`session has${n?"":" not"} expired with margin of ${bt}s`),n){if(this.autoRefreshToken&&s.refresh_token){let{error:a}=await this._callRefreshToken(s.refresh_token);a&&(ii(a)?this._debug(i,"refresh discarded by commit guard",a):this._debug(i,"refresh failed",a))}}else if(s.user&&s.user.__isUserNotAvailableProxy===!0)try{let{data:a,error:o}=await this._getUser(s.access_token);!o&&a?.user?(s.user=a.user,await this._saveSession(s),await this._notifyAllSubscribers("SIGNED_IN",s)):this._debug(i,"could not get user data, skipping SIGNED_IN notification")}catch(a){console.error("Error getting user data:",a),this._debug(i,"error getting user data, skipping SIGNED_IN notification",a)}else await this._notifyAllSubscribers("SIGNED_IN",s)}catch(s){this._debug(i,"error",s),Ze(s)?console.warn(s):console.error(s);return}finally{this._debug(i,"end")}}async _callRefreshToken(e){var t,i;if(!e)throw new I;if(this.refreshingDeferred)return this.refreshingDeferred.promise;if(this.lastRefreshFailure&&this.lastRefreshFailure.refreshToken===e&&Date.now()<this.lastRefreshFailure.expiresAt)return this._debug("#_callRefreshToken()","returning cached failure (cooldown active)"),this.lastRefreshFailure.result;let s="#_callRefreshToken()";this._debug(s,"begin");try{this.refreshingDeferred=new et,this.refreshingDeferred.promise.then(void 0,()=>{});let n=await O(this.storage,this.storageKey),{data:a,error:o}=await this._refreshAccessToken(e);if(o)throw o;if(!a.session)throw new I;let l=await O(this.storage,this.storageKey);if(n!==null&&(l===null||l.refresh_token!==n.refresh_token)){this._debug(s,"commit guard: storage changed since refresh started, discarding rotated tokens",{startedWith:"present",nowHolds:l?"replaced":"cleared"});let f={data:null,error:new Qe};return this.refreshingDeferred.resolve(f),f}let h=this._sessionRemovalEpoch;if(await this._saveSession(a.session),this._sessionRemovalEpoch!==h){this._debug(s,"commit guard (post-save): _removeSession ran during _saveSession, undoing write"),await P(this.storage,this.storageKey),this.userStorage&&await P(this.userStorage,this.storageKey+"-user");let f={data:null,error:new Qe};return this.refreshingDeferred.resolve(f),f}await this._notifyAllSubscribers("TOKEN_REFRESHED",a.session);let u={data:a.session,error:null};return this.lastRefreshFailure=null,this.refreshingDeferred.resolve(u),u}catch(n){if(this._debug(s,"error",n),y(n)){let a={data:null,error:n};if(!Ze(n)){let o=await O(this.storage,this.storageKey);!!(o?.expires_at&&o.expires_at*1e3>Date.now())?this._debug(s,"proactive refresh failed, access token still valid \u2014 preserving session"):await this._removeSession()}return this.lastRefreshFailure={refreshToken:e,result:a,expiresAt:Date.now()+Jr},(t=this.refreshingDeferred)===null||t===void 0||t.resolve(a),a}throw(i=this.refreshingDeferred)===null||i===void 0||i.reject(n),n}finally{this.refreshingDeferred=null,this._debug(s,"end")}}async _notifyAllSubscribers(e,t,i=!0){if(this._pendingInitNotifications!==null&&i){this._pendingInitNotifications.push({event:e,session:t,broadcast:i});return}let s=`#_notifyAllSubscribers(${e})`;this._debug(s,"begin",t,`broadcast = ${i}`);try{this.broadcastChannel&&i&&this.broadcastChannel.postMessage({event:e,session:t});let n=[],a=Array.from(this.stateChangeEmitters.values()).map(async o=>{try{await o.callback(e,t)}catch(l){n.push(l)}});if(await Promise.all(a),n.length>0){for(let o=0;o<n.length;o+=1)console.error(n[o]);throw n[0]}}finally{this._debug(s,"end")}}async _saveSession(e){this._debug("#_saveSession()",e),this.suppressGetSessionWarning=!0;let t=Object.assign({},e),i=t.user&&t.user.__isUserNotAvailableProxy===!0;if(this.userStorage){!i&&t.user&&await V(this.userStorage,this.storageKey+"-user",{user:t.user});let s=Object.assign({},t);delete s.user;let n=Zt(s);await V(this.storage,this.storageKey,n)}else{let s=Zt(t);await V(this.storage,this.storageKey,s)}}async _removeSession(){this._sessionRemovalEpoch+=1,this._debug("#_removeSession()"),this.lastRefreshFailure=null,this.suppressGetSessionWarning=!1,await P(this.storage,this.storageKey),await gi(this.storage,this.storageKey),await P(this.storage,this.storageKey+"-user"),this.userStorage&&await P(this.userStorage,this.storageKey+"-user"),await this._notifyAllSubscribers("SIGNED_OUT",null)}_removeVisibilityChangedCallback(){this._debug("#_removeVisibilityChangedCallback()");let e=this.visibilityChangedCallback;this.visibilityChangedCallback=null;try{e&&R()&&window?.removeEventListener&&window.removeEventListener("visibilitychange",e)}catch(t){console.error("removing visibilitychange callback failed",t)}}async _startAutoRefresh(){await this._stopAutoRefresh(),this._debug("#_startAutoRefresh()");let e=setInterval(()=>this._autoRefreshTokenTick(),z);this.autoRefreshTicker=e,e&&typeof e=="object"&&typeof e.unref=="function"?e.unref():typeof Deno<"u"&&typeof Deno.unrefTimer=="function"&&Deno.unrefTimer(e);let t=setTimeout(async()=>{await this.initializePromise,await this._autoRefreshTokenTick()},0);this.autoRefreshTickTimeout=t,t&&typeof t=="object"&&typeof t.unref=="function"?t.unref():typeof Deno<"u"&&typeof Deno.unrefTimer=="function"&&Deno.unrefTimer(t)}async _stopAutoRefresh(){this._debug("#_stopAutoRefresh()");let e=this.autoRefreshTicker;this.autoRefreshTicker=null,e&&clearInterval(e);let t=this.autoRefreshTickTimeout;this.autoRefreshTickTimeout=null,t&&clearTimeout(t)}async startAutoRefresh(){this._removeVisibilityChangedCallback(),await this._startAutoRefresh()}async stopAutoRefresh(){this._removeVisibilityChangedCallback(),await this._stopAutoRefresh()}async dispose(){var e;this._removeVisibilityChangedCallback(),await this._stopAutoRefresh(),(e=this.broadcastChannel)===null||e===void 0||e.close(),this.broadcastChannel=null,this.stateChangeEmitters.clear()}async _autoRefreshTokenTick(){if(this._debug("#_autoRefreshTokenTick()","begin"),this.lock!=null){try{await this._acquireLock(0,async()=>{try{let e=Date.now();try{return await this._useSession(async t=>{let{data:{session:i}}=t;if(!i||!i.refresh_token||!i.expires_at){this._debug("#_autoRefreshTokenTick()","no session");return}let s=Math.floor((i.expires_at*1e3-e)/z);this._debug("#_autoRefreshTokenTick()",`access token expires in ${s} ticks, a tick lasts ${z}ms, refresh threshold is ${Ie} ticks`),s<=Ie&&await this._callRefreshToken(i.refresh_token)})}catch(t){console.error("Auto refresh tick failed with error. This is likely a transient error.",t)}}finally{this._debug("#_autoRefreshTokenTick()","end")}})}catch(e){if(e instanceof It)this._debug("auto refresh token tick lock not available");else throw e}return}if(this.refreshingDeferred!==null){this._debug("#_autoRefreshTokenTick()","refresh already in flight, skipping");return}try{let e=Date.now();try{await this._useSession(async t=>{let{data:{session:i}}=t;if(!i||!i.refresh_token||!i.expires_at){this._debug("#_autoRefreshTokenTick()","no session");return}let s=Math.floor((i.expires_at*1e3-e)/z);this._debug("#_autoRefreshTokenTick()",`access token expires in ${s} ticks, a tick lasts ${z}ms, refresh threshold is ${Ie} ticks`),s<=Ie&&await this._callRefreshToken(i.refresh_token)})}catch(t){console.error("Auto refresh tick failed with error. This is likely a transient error.",t)}}finally{this._debug("#_autoRefreshTokenTick()","end")}}async _handleVisibilityChange(){if(this._debug("#_handleVisibilityChange()"),!R()||!window?.addEventListener)return this.autoRefreshToken&&this.startAutoRefresh(),!1;try{this.visibilityChangedCallback=async()=>{try{await this._onVisibilityChanged(!1)}catch(e){this._debug("#visibilityChangedCallback","error",e)}},window?.addEventListener("visibilitychange",this.visibilityChangedCallback),await this._onVisibilityChanged(!0)}catch(e){console.error("_handleVisibilityChange",e)}}async _onVisibilityChanged(e){let t=`#_onVisibilityChanged(${e})`;if(this._debug(t,"visibilityState",document.visibilityState),document.visibilityState==="visible"){if(this.autoRefreshToken&&this._startAutoRefresh(),!e)if(await this.initializePromise,this.lock!=null)await this._acquireLock(this.lockAcquireTimeout,async()=>{if(document.visibilityState!=="visible"){this._debug(t,"acquired the lock to recover the session, but the browser visibilityState is no longer visible, aborting");return}await this._recoverAndRefresh()});else{if(document.visibilityState!=="visible"){this._debug(t,"visibilityState is no longer visible, skipping recovery");return}await this._recoverAndRefresh()}}else document.visibilityState==="hidden"&&this.autoRefreshToken&&this._stopAutoRefresh()}async _getUrlForProvider(e,t,i){let s=i?.redirectTo,n=null,a=null,o=null;this.flowType==="pkce"&&([n,a,o]=await this._getCodeChallengeAndMethod(),s=this._maybeAppendFlowIdToRedirect(s,o));let l=[`provider=${encodeURIComponent(t)}`];if(s&&l.push(`redirect_to=${encodeURIComponent(s)}`),i?.scopes&&l.push(`scopes=${encodeURIComponent(i.scopes)}`),n!=null&&a!=null){let c=new URLSearchParams({code_challenge:`${encodeURIComponent(n)}`,code_challenge_method:`${encodeURIComponent(a)}`});l.push(c.toString())}if(i?.queryParams){let c=new URLSearchParams(i.queryParams);l.push(c.toString())}return i?.skipBrowserRedirect&&l.push(`skip_http_redirect=${i.skipBrowserRedirect}`),{url:`${e}?${l.join("&")}`,flowId:o}}_maybeAppendFlowIdToRedirect(e,t){return!e||!t||!this.experimental.appendPkceFlowIdToRedirects?e??void 0:mi(e,t)}async _getCodeChallengeAndMethod(e=!1){return yi(this.storage,this.storageKey,e,t=>this._debug("#_getCodeChallengeAndMethod()","evicted oldest pending PKCE verifier slot",t))}async _unenroll(e){try{return await this._useSession(async t=>{var i;let{data:s,error:n}=t;return n?this._returnResult({data:null,error:n}):await v(this.fetch,"DELETE",`${this.url}/factors/${e.factorId}`,{headers:this.headers,jwt:(i=s?.session)===null||i===void 0?void 0:i.access_token})})}catch(t){if(y(t))return this._returnResult({data:null,error:t});throw t}}async _enroll(e){try{return await this._useSession(async t=>{var i,s;let{data:n,error:a}=t;if(a)return this._returnResult({data:null,error:a});let o=Object.assign({friendly_name:e.friendlyName,factor_type:e.factorType},e.factorType==="phone"?{phone:e.phone}:e.factorType==="totp"?{issuer:e.issuer}:{}),{data:l,error:c}=await v(this.fetch,"POST",`${this.url}/factors`,{body:o,headers:this.headers,jwt:(i=n?.session)===null||i===void 0?void 0:i.access_token});return c?this._returnResult({data:null,error:c}):(e.factorType==="totp"&&l.type==="totp"&&(!((s=l?.totp)===null||s===void 0)&&s.qr_code)&&(l.totp.qr_code=`data:image/svg+xml;utf-8,${l.totp.qr_code}`),this._returnResult({data:l,error:null}))})}catch(t){if(y(t))return this._returnResult({data:null,error:t});throw t}}async _verify(e){let t=async()=>{try{return await this._useSession(async i=>{var s;let{data:n,error:a}=i;if(a)return this._returnResult({data:null,error:a});let o=Object.assign({challenge_id:e.challengeId},"webauthn"in e?{webauthn:Object.assign(Object.assign({},e.webauthn),{credential_response:e.webauthn.type==="create"?lr(e.webauthn.credential_response):cr(e.webauthn.credential_response)})}:{code:e.code}),{data:l,error:c}=await v(this.fetch,"POST",`${this.url}/factors/${e.factorId}/verify`,{body:o,headers:this.headers,jwt:(s=n?.session)===null||s===void 0?void 0:s.access_token});return c?this._returnResult({data:null,error:c}):(await this._saveSession(Object.assign({expires_at:Math.round(Date.now()/1e3)+l.expires_in},l)),await this._notifyAllSubscribers("MFA_CHALLENGE_VERIFIED",l),this._returnResult({data:l,error:c}))})}catch(i){if(y(i))return this._returnResult({data:null,error:i});throw i}};return this.lock!=null?this._acquireLock(this.lockAcquireTimeout,t):t()}async _challenge(e){let t=async()=>{try{return await this._useSession(async i=>{var s;let{data:n,error:a}=i;if(a)return this._returnResult({data:null,error:a});let o=await v(this.fetch,"POST",`${this.url}/factors/${e.factorId}/challenge`,{body:e,headers:this.headers,jwt:(s=n?.session)===null||s===void 0?void 0:s.access_token});if(o.error)return o;let{data:l}=o;if(l.type!=="webauthn")return{data:l,error:null};switch(l.webauthn.type){case"create":return{data:Object.assign(Object.assign({},l),{webauthn:Object.assign(Object.assign({},l.webauthn),{credential_options:Object.assign(Object.assign({},l.webauthn.credential_options),{publicKey:ar(l.webauthn.credential_options.publicKey)})})}),error:null};case"request":return{data:Object.assign(Object.assign({},l),{webauthn:Object.assign(Object.assign({},l.webauthn),{credential_options:Object.assign(Object.assign({},l.webauthn.credential_options),{publicKey:or(l.webauthn.credential_options.publicKey)})})}),error:null}}})}catch(i){if(y(i))return this._returnResult({data:null,error:i});throw i}};return this.lock!=null?this._acquireLock(this.lockAcquireTimeout,t):t()}async _challengeAndVerify(e){let{data:t,error:i}=await this._challenge({factorId:e.factorId});return i?this._returnResult({data:null,error:i}):await this._verify({factorId:e.factorId,challengeId:t.id,code:e.code})}async _listFactors(){var e;let{data:{user:t},error:i}=await this.getUser();if(i)return{data:null,error:i};let s={all:[],phone:[],totp:[],webauthn:[]};for(let n of(e=t?.factors)!==null&&e!==void 0?e:[])s.all.push(n),n.status==="verified"&&s[n.factor_type].push(n);return{data:s,error:null}}async _getAuthenticatorAssuranceLevel(e){var t,i,s,n;if(e)try{let{payload:d}=rt(e),p=null;d.aal&&(p=d.aal);let g=p,{data:{user:m},error:w}=await this.getUser(e);if(w)return this._returnResult({data:null,error:w});((i=(t=m?.factors)===null||t===void 0?void 0:t.filter(k=>k.status==="verified"))!==null&&i!==void 0?i:[]).length>0&&(g="aal2");let b=d.amr||[];return{data:{currentLevel:p,nextLevel:g,currentAuthenticationMethods:b},error:null}}catch(d){if(y(d))return this._returnResult({data:null,error:d});throw d}let{data:{session:a},error:o}=await this.getSession();if(o)return this._returnResult({data:null,error:o});if(!a)return{data:{currentLevel:null,nextLevel:null,currentAuthenticationMethods:[]},error:null};let{payload:l}=rt(a.access_token),c=null;l.aal&&(c=l.aal);let h=c;((n=(s=a.user.factors)===null||s===void 0?void 0:s.filter(d=>d.status==="verified"))!==null&&n!==void 0?n:[]).length>0&&(h="aal2");let f=l.amr||[];return{data:{currentLevel:c,nextLevel:h,currentAuthenticationMethods:f},error:null}}async _getAuthorizationDetails(e){try{return await this._useSession(async t=>{let{data:{session:i},error:s}=t;return s?this._returnResult({data:null,error:s}):i?await v(this.fetch,"GET",`${this.url}/oauth/authorizations/${e}`,{headers:this.headers,jwt:i.access_token,xform:n=>({data:n,error:null})}):this._returnResult({data:null,error:new I})})}catch(t){if(y(t))return this._returnResult({data:null,error:t});throw t}}async _approveAuthorization(e,t){try{return await this._useSession(async i=>{let{data:{session:s},error:n}=i;if(n)return this._returnResult({data:null,error:n});if(!s)return this._returnResult({data:null,error:new I});let a=await v(this.fetch,"POST",`${this.url}/oauth/authorizations/${e}/consent`,{headers:this.headers,jwt:s.access_token,body:{action:"approve"},xform:o=>({data:o,error:null})});return a.data&&a.data.redirect_url&&R()&&!t?.skipBrowserRedirect&&window.location.assign(a.data.redirect_url),a})}catch(i){if(y(i))return this._returnResult({data:null,error:i});throw i}}async _denyAuthorization(e,t){try{return await this._useSession(async i=>{let{data:{session:s},error:n}=i;if(n)return this._returnResult({data:null,error:n});if(!s)return this._returnResult({data:null,error:new I});let a=await v(this.fetch,"POST",`${this.url}/oauth/authorizations/${e}/consent`,{headers:this.headers,jwt:s.access_token,body:{action:"deny"},xform:o=>({data:o,error:null})});return a.data&&a.data.redirect_url&&R()&&!t?.skipBrowserRedirect&&window.location.assign(a.data.redirect_url),a})}catch(i){if(y(i))return this._returnResult({data:null,error:i});throw i}}async _listOAuthGrants(){try{return await this._useSession(async e=>{let{data:{session:t},error:i}=e;return i?this._returnResult({data:null,error:i}):t?await v(this.fetch,"GET",`${this.url}/user/oauth/grants`,{headers:this.headers,jwt:t.access_token,xform:s=>({data:s,error:null})}):this._returnResult({data:null,error:new I})})}catch(e){if(y(e))return this._returnResult({data:null,error:e});throw e}}async _revokeOAuthGrant(e){try{return await this._useSession(async t=>{let{data:{session:i},error:s}=t;return s?this._returnResult({data:null,error:s}):i?(await v(this.fetch,"DELETE",`${this.url}/user/oauth/grants`,{headers:this.headers,jwt:i.access_token,query:{client_id:e.clientId},noResolveJson:!0}),{data:{},error:null}):this._returnResult({data:null,error:new I})})}catch(t){if(y(t))return this._returnResult({data:null,error:t});throw t}}async fetchJwk(e,t={keys:[]}){let i=t.keys.find(o=>o.kid===e);if(i)return i;let s=Date.now();if(i=this.jwks.keys.find(o=>o.kid===e),i&&this.jwks_cached_at+ti>s)return i;let{data:n,error:a}=await v(this.fetch,"GET",`${this.url}/.well-known/jwks.json`,{headers:this.headers});if(a)throw a;return!n.keys||n.keys.length===0||(this.jwks=n,this.jwks_cached_at=s,i=n.keys.find(o=>o.kid===e),!i)?null:i}async getClaims(e,t={}){try{let i=e;if(!i){let{data:d,error:p}=await this.getSession();if(p||!d.session)return this._returnResult({data:null,error:p});i=d.session.access_token}let{header:s,payload:n,signature:a,raw:{header:o,payload:l}}=rt(i);if(!t?.allowExpired)try{vi(n.exp)}catch(d){throw new ie(d instanceof Error?d.message:"JWT validation failed")}let c=!s.alg||s.alg.startsWith("HS")||!s.kid||!("crypto"in globalThis&&"subtle"in globalThis.crypto)?null:await this.fetchJwk(s.kid,t?.keys?{keys:t.keys}:t?.jwks);if(!c){let{error:d}=await this.getUser(i);if(d)throw d;return{data:{claims:n,header:s,signature:a},error:null}}let h=bi(s.alg),u=await crypto.subtle.importKey("jwk",c,h,!0,["verify"]);if(!await crypto.subtle.verify(h,u,a,oi(`${o}.${l}`)))throw new ie("Invalid JWT signature");return{data:{claims:n,header:s,signature:a},error:null}}catch(i){if(y(i))return this._returnResult({data:null,error:i});throw i}}async signInWithPasskey(e){var t,i,s;U(this.experimental);try{if(!st())return this._returnResult({data:null,error:new j("Browser does not support WebAuthn",null)});let{data:n,error:a}=await this._startPasskeyAuthentication({options:{captchaToken:(t=e?.options)===null||t===void 0?void 0:t.captchaToken}});if(a||!n)return this._returnResult({data:null,error:a});let o=or(n.options),l=(s=(i=e?.options)===null||i===void 0?void 0:i.signal)!==null&&s!==void 0?s:Ot.createNewAbortSignal(),{data:c,error:h}=await ur({publicKey:o,signal:l});if(h||!c)return this._returnResult({data:null,error:h??new j("WebAuthn ceremony failed",null)});let u=cr(c);return this._verifyPasskeyAuthentication({challengeId:n.challenge_id,credential:u})}catch(n){if(y(n))return this._returnResult({data:null,error:n});throw n}}async registerPasskey(e){var t,i;U(this.experimental);try{if(!st())return this._returnResult({data:null,error:new j("Browser does not support WebAuthn",null)});let{data:s,error:n}=await this._startPasskeyRegistration();if(n||!s)return this._returnResult({data:null,error:n});let a=ar(s.options),o=(i=(t=e?.options)===null||t===void 0?void 0:t.signal)!==null&&i!==void 0?i:Ot.createNewAbortSignal(),{data:l,error:c}=await hr({publicKey:a,signal:o});if(c||!l)return this._returnResult({data:null,error:c??new j("WebAuthn ceremony failed",null)});let h=lr(l);return this._verifyPasskeyRegistration({challengeId:s.challenge_id,credential:h})}catch(s){if(y(s))return this._returnResult({data:null,error:s});throw s}}async _startPasskeyRegistration(){U(this.experimental);try{return await this._useSession(async e=>{let{data:{session:t},error:i}=e;if(i)return this._returnResult({data:null,error:i});if(!t)return this._returnResult({data:null,error:new I});let{data:s,error:n}=await v(this.fetch,"POST",`${this.url}/passkeys/registration/options`,{headers:this.headers,jwt:t.access_token,body:{}});return n?this._returnResult({data:null,error:n}):this._returnResult({data:s,error:null})})}catch(e){if(y(e))return this._returnResult({data:null,error:e});throw e}}async _verifyPasskeyRegistration(e){U(this.experimental);try{return await this._useSession(async t=>{let{data:{session:i},error:s}=t;if(s)return this._returnResult({data:null,error:s});if(!i)return this._returnResult({data:null,error:new I});let{data:n,error:a}=await v(this.fetch,"POST",`${this.url}/passkeys/registration/verify`,{headers:this.headers,jwt:i.access_token,body:{challenge_id:e.challengeId,credential:e.credential}});return a?this._returnResult({data:null,error:a}):this._returnResult({data:n,error:null})})}catch(t){if(y(t))return this._returnResult({data:null,error:t});throw t}}async _startPasskeyAuthentication(e){var t;U(this.experimental);try{let{data:i,error:s}=await v(this.fetch,"POST",`${this.url}/passkeys/authentication/options`,{headers:this.headers,body:{gotrue_meta_security:{captcha_token:(t=e?.options)===null||t===void 0?void 0:t.captchaToken}}});return s?this._returnResult({data:null,error:s}):this._returnResult({data:i,error:null})}catch(i){if(y(i))return this._returnResult({data:null,error:i});throw i}}async _verifyPasskeyAuthentication(e){U(this.experimental);try{let{data:t,error:i}=await v(this.fetch,"POST",`${this.url}/passkeys/authentication/verify`,{headers:this.headers,body:{challenge_id:e.challengeId,credential:e.credential},xform:M});return i?this._returnResult({data:null,error:i}):(t.session&&(await this._saveSession(t.session),await this._notifyAllSubscribers("SIGNED_IN",t.session)),this._returnResult({data:t,error:null}))}catch(t){if(y(t))return this._returnResult({data:null,error:t});throw t}}async _listPasskeys(){U(this.experimental);try{return await this._useSession(async e=>{let{data:{session:t},error:i}=e;if(i)return this._returnResult({data:null,error:i});if(!t)return this._returnResult({data:null,error:new I});let{data:s,error:n}=await v(this.fetch,"GET",`${this.url}/passkeys`,{headers:this.headers,jwt:t.access_token,xform:a=>({data:a,error:null})});return n?this._returnResult({data:null,error:n}):this._returnResult({data:s,error:null})})}catch(e){if(y(e))return this._returnResult({data:null,error:e});throw e}}async _updatePasskey(e){U(this.experimental);try{return await this._useSession(async t=>{let{data:{session:i},error:s}=t;if(s)return this._returnResult({data:null,error:s});if(!i)return this._returnResult({data:null,error:new I});let{data:n,error:a}=await v(this.fetch,"PATCH",`${this.url}/passkeys/${e.passkeyId}`,{headers:this.headers,jwt:i.access_token,body:{friendly_name:e.friendlyName}});return a?this._returnResult({data:null,error:a}):this._returnResult({data:n,error:null})})}catch(t){if(y(t))return this._returnResult({data:null,error:t});throw t}}async _deletePasskey(e){U(this.experimental);try{return await this._useSession(async t=>{let{data:{session:i},error:s}=t;if(s)return this._returnResult({data:null,error:s});if(!i)return this._returnResult({data:null,error:new I});let{error:n}=await v(this.fetch,"DELETE",`${this.url}/passkeys/${e.passkeyId}`,{headers:this.headers,jwt:i.access_token,noResolveJson:!0});return n?this._returnResult({data:null,error:n}):this._returnResult({data:null,error:null})})}catch(t){if(y(t))return this._returnResult({data:null,error:t});throw t}}};jt.nextInstanceID={};var dr=jt;var xn=dr,fr=xn;var kn="2.112.4",nt="",Bt;if(typeof Deno<"u")nt="deno",Bt=(Lt=Deno.version)===null||Lt===void 0?void 0:Lt.deno;else if(typeof document<"u")nt="web";else if(typeof navigator<"u"&&navigator.product==="ReactNative")nt="react-native";else{nt="node";let r=globalThis.process;Bt=r==null||(Pt=r.version)===null||Pt===void 0?void 0:Pt.replace(/^v/,"")}var Lt,Pt,Fi=[`runtime=${nt}`];Bt&&Fi.push(`runtime-version=${Bt}`);var En={"X-Client-Info":`supabase-js/${kn}; ${Fi.join("; ")}`},Sn={headers:En},An={schema:"public"},Tn={autoRefreshToken:!0,persistSession:!0,detectSessionInUrl:!0,flowType:"implicit"},In={},Cn={enabled:!1,respectSamplingDecision:!0};function Rn(r){if(!r||typeof r!="string")return null;let e=r.split("-");if(e.length!==4)return null;let[t,i,s,n]=e;if(t.length!==2||i.length!==32||s.length!==16||n.length!==2)return null;let a=/^[0-9a-f]+$/i;return!a.test(t)||!a.test(i)||!a.test(s)||!a.test(n)||i==="00000000000000000000000000000000"||s==="0000000000000000"?null:{version:t,traceId:i,parentId:s,traceFlags:n,isSampled:(parseInt(n,16)&1)===1}}function On(r,e){if(!r||!e||e.length===0)return!1;let t;if(r instanceof URL)t=r;else try{t=new URL(r)}catch{return!1}for(let i of e)try{if(typeof i=="string"){if(jn(t.hostname,i))return!0}else if(i instanceof RegExp){if(i.test(t.hostname))return!0}else if(typeof i=="function"&&i(t))return!0}catch{continue}return!1}function jn(r,e){if(e===r)return!0;if(e.startsWith("*.")){let t=e.slice(2);if(r.endsWith(t)&&(r===t||r.endsWith("."+t)))return!0}return!1}function Ln(r){let e=[];try{let t=new URL(r);e.push(t.hostname)}catch{}return e.push("*.supabase.co","*.supabase.in"),e.push("localhost","127.0.0.1","[::1]"),e}function at(r){"@babel/helpers - typeof";return at=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},at(r)}function Pn(r,e){if(at(r)!="object"||!r)return r;var t=r[Symbol.toPrimitive];if(t!==void 0){var i=t.call(r,e||"default");if(at(i)!="object")return i;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(r)}function Bn(r){var e=Pn(r,"string");return at(e)=="symbol"?e:e+""}function Nn(r,e,t){return(e=Bn(e))in r?Object.defineProperty(r,e,{value:t,enumerable:!0,configurable:!0,writable:!0}):r[e]=t,r}function Li(r,e){var t=Object.keys(r);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(r);e&&(i=i.filter(function(s){return Object.getOwnPropertyDescriptor(r,s).enumerable})),t.push.apply(t,i)}return t}function C(r){for(var e=1;e<arguments.length;e++){var t=arguments[e]!=null?arguments[e]:{};e%2?Li(Object(t),!0).forEach(function(i){Nn(r,i,t[i])}):Object.getOwnPropertyDescriptors?Object.defineProperties(r,Object.getOwnPropertyDescriptors(t)):Li(Object(t)).forEach(function(i){Object.defineProperty(r,i,Object.getOwnPropertyDescriptor(t,i))})}return r}var Un=r=>r?(...e)=>r(...e):(...e)=>fetch(...e),Mn=()=>Headers,Di=r=>r.startsWith("sb_publishable_")||r.startsWith("sb_secret_"),Fn="sb_temp_",Pi=new Set,Dn=r=>{var e,t;if(!r.startsWith("sb_")||Di(r)||r.startsWith(Fn))return;let i=(e=(t=r.match(/^sb_[a-zA-Z0-9]+_/))===null||t===void 0?void 0:t[0])!==null&&e!==void 0?e:"unknown";Pi.has(i)||(Pi.add(i),console.warn("@supabase/supabase-js: Unrecognized Supabase API key format. The client will proceed and send this key as-is; if you see authentication errors you may need to upgrade @supabase/supabase-js to a version that recognizes this key type."))},Bi=(r,e,t,i,s,n)=>{let a=Un(i),o=Mn(),l=s?.enabled===!0,c=s?.respectSamplingDecision!==!1,h=l?Ln(e):null,u=!(n?.omitApiKeyAsBearer&&Di(r));return async(f,d)=>{let p=await t(),g=new o(d?.headers);if(g.has("apikey")||g.set("apikey",r),!g.has("Authorization")){let m=p??(u?r:null);m&&g.set("Authorization",`Bearer ${m}`)}if(h){let m=$n(f,h,c);m&&(m.traceparent&&!g.has("traceparent")&&g.set("traceparent",m.traceparent),m.tracestate&&!g.has("tracestate")&&g.set("tracestate",m.tracestate),m.baggage&&!g.has("baggage")&&g.set("baggage",m.baggage))}return a(f,C(C({},d),{},{headers:g}))}},Ni=!1,Ui=!1;function $n(r,e,t){let i=gr();if(!i)return Ni||(Ni=!0,console.warn("@supabase/supabase-js: tracePropagation is enabled but the tracing runtime is not loaded, so trace headers will not be attached. Add `import '@supabase/supabase-js/tracing'` at your application entry point (requires the OpenTelemetry API package to be installed). The CDN/UMD build does not support trace propagation.")),null;if(!On(typeof r=="string"||r instanceof URL?r:r.url,e))return null;let s=i();if(!s||!s.traceparent){var n;if(!(s==null||(n=s.carrierKeys)===null||n===void 0)&&n.length&&!Ui){Ui=!0;let a=s.carrierKeys.includes("sentry-trace")?" Sentry detected: set `propagateTraceparent: true` in Sentry.init() to emit it.":" Configure your tracing SDK to emit W3C trace context on outgoing requests.";console.warn(`@supabase/supabase-js: tracePropagation is enabled and a tracing SDK is active, but its propagator wrote [${s.carrierKeys.join(", ")}] and no W3C traceparent header, so trace headers will not be attached.`+a)}return null}if(t){let a=Rn(s.traceparent);if(a&&!a.isSampled)return{traceparent:s.traceparent}}return s}function Mi(r){return typeof r=="boolean"?{enabled:r}:r}function qn(r){return r.endsWith("/")?r:r+"/"}function Hn(r,e){var t,i,s,n,a,o;let{db:l,auth:c,realtime:h,global:u}=r,{db:f,auth:d,realtime:p,global:g}=e,m=Mi(r.tracePropagation),w=Mi(e.tracePropagation),_={db:C(C({},f),l),auth:C(C({},d),c),realtime:C(C({},p),h),storage:{},global:C(C(C({},g),u),{},{headers:C(C({},(t=g?.headers)!==null&&t!==void 0?t:{}),(i=u?.headers)!==null&&i!==void 0?i:{})}),tracePropagation:{enabled:(s=(n=m?.enabled)!==null&&n!==void 0?n:w?.enabled)!==null&&s!==void 0?s:!1,respectSamplingDecision:(a=(o=m?.respectSamplingDecision)!==null&&o!==void 0?o:w?.respectSamplingDecision)!==null&&a!==void 0?a:!0},accessToken:async()=>""};return r.accessToken?_.accessToken=r.accessToken:delete _.accessToken,_}function Gn(r){let e=r?.trim();if(!e)throw new Error("supabaseUrl is required.");if(!e.match(/^https?:\/\//i))throw new Error("Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.");try{return new URL(qn(e))}catch{throw Error("Invalid supabaseUrl: Provided URL is malformed.")}}var Kn=class extends fr{constructor(r){super(r)}},zn=class{constructor(r,e,t){var i,s;this.supabaseUrl=r,this.supabaseKey=e;let n=Gn(r);if(!e)throw new Error("supabaseKey is required.");Dn(e),this.realtimeUrl=new URL("realtime/v1",n),this.realtimeUrl.protocol=this.realtimeUrl.protocol.replace("http","ws"),this.authUrl=new URL("auth/v1",n),this.storageUrl=new URL("storage/v1",n),this.functionsUrl=new URL("functions/v1",n);let a=`sb-${n.hostname.split(".")[0]}-auth-token`,o={db:An,realtime:In,auth:C(C({},Tn),{},{storageKey:a}),global:Sn,tracePropagation:Cn},l=Hn(t??{},o);if(this.settings=l,this.storageKey=(i=l.auth.storageKey)!==null&&i!==void 0?i:"",this.headers=(s=l.global.headers)!==null&&s!==void 0?s:{},l.accessToken)this.accessToken=l.accessToken,this.auth=new Proxy({},{get:(h,u)=>{throw new Error(`@supabase/supabase-js: Supabase Client is configured with the accessToken option, accessing supabase.auth.${String(u)} is not possible`)}});else{var c;this.auth=this._initSupabaseAuthClient((c=l.auth)!==null&&c!==void 0?c:{},this.headers,l.global.fetch)}this.fetch=Bi(e,r,this._getSessionToken.bind(this),l.global.fetch,l.tracePropagation),this.functionsFetch=Bi(e,r,this._getSessionToken.bind(this),l.global.fetch,l.tracePropagation,{omitApiKeyAsBearer:!0}),this.realtime=this._initRealtimeClient(C({headers:this.headers,accessToken:this._getAccessToken.bind(this),fetch:this.fetch},l.realtime)),this.accessToken&&Promise.resolve(this.accessToken()).then(h=>this.realtime.setAuth(h)).catch(h=>console.warn("Failed to set initial Realtime auth token:",h)),this.rest=new kr(new URL("rest/v1",n).href,{headers:this.headers,schema:l.db.schema,fetch:this.fetch,timeout:l.db.timeout,urlLengthLimit:l.db.urlLengthLimit,retry:l.db.retry}),this.storage=new Wr(this.storageUrl.href,this.headers,this.fetch,t?.storage),l.accessToken||this._listenForAuthEvents()}get functions(){return new Pe(this.functionsUrl.href,{headers:this.headers,customFetch:this.functionsFetch})}from(r){return this.rest.from(r)}schema(r){return this.rest.schema(r)}rpc(r,e={},t={head:!1,get:!1,count:void 0}){return this.rest.rpc(r,e,t)}channel(r,e={config:{}}){return this.realtime.channel(r,e)}getChannels(){return this.realtime.getChannels()}removeChannel(r){return this.realtime.removeChannel(r)}removeAllChannels(){return this.realtime.removeAllChannels()}async _getSessionToken(){var r=this,e,t;if(r.accessToken)return await r.accessToken();let{data:i}=await r.auth.getSession();return(e=(t=i.session)===null||t===void 0?void 0:t.access_token)!==null&&e!==void 0?e:null}async _getAccessToken(){var r=this,e;return(e=await r._getSessionToken())!==null&&e!==void 0?e:r.supabaseKey}_initSupabaseAuthClient({autoRefreshToken:r,persistSession:e,detectSessionInUrl:t,storage:i,userStorage:s,storageKey:n,flowType:a,lock:o,debug:l,throwOnError:c,experimental:h,lockAcquireTimeout:u,skipAutoInitialize:f},d,p){let g={Authorization:`Bearer ${this.supabaseKey}`,apikey:`${this.supabaseKey}`};return new Kn({url:this.authUrl.href,headers:C(C({},g),d),storageKey:n,autoRefreshToken:r,persistSession:e,detectSessionInUrl:t,storage:i,userStorage:s,flowType:a,lock:o,debug:l,throwOnError:c,experimental:h,fetch:p,lockAcquireTimeout:u,skipAutoInitialize:f,hasCustomAuthorizationHeader:Object.keys(this.headers).some(m=>m.toLowerCase()==="authorization")})}_initRealtimeClient(r){return new Se(this.realtimeUrl.href,C(C({},r),{},{params:C(C({},{apikey:this.supabaseKey}),r?.params)}))}_listenForAuthEvents(){return this.auth.onAuthStateChange((r,e)=>{this._handleTokenChanged(r,"CLIENT",e?.access_token)})}_handleTokenChanged(r,e,t){(r==="TOKEN_REFRESHED"||r==="SIGNED_IN"||r==="INITIAL_SESSION")&&this.changedAccessToken!==t?(this.changedAccessToken=t,this.realtime.setAuth(t)):r==="SIGNED_OUT"&&(this.realtime.setAuth(),e=="STORAGE"&&this.auth.signOut(),this.changedAccessToken=void 0)}},$i=(r,e,t)=>new zn(r,e,t);function Vn(){if(typeof window<"u"||globalThis.Deno!==void 0)return!1;let r=globalThis.process;if(!r)return!1;let e=r.version;if(e==null)return!1;let t=e.match(/^v(\d+)\./);return t?parseInt(t[1],10)<=20:!1}Vn()&&console.warn("\u26A0\uFE0F  Node.js 20 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 22 or later. For more information, visit: https://github.com/orgs/supabase/discussions/45715");var Re="data:image/png;base64,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";var Wn="https://vfjsaynnubxywdbevxtx.supabase.co",Jn="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmanNheW5udWJ4eXdkYmV2eHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNTA5MDEsImV4cCI6MjEwMzgyNjkwMX0.YyBCXMqwrOk5BRhQafYLFw8tiM5PC8lc8Yocodw9wf0",pr=class{constructor(){this.container=null;this.shadow=null;this.conversationId=null;this.conversationStatus="open";this.visitorName="";this.visitorEmail="";this.isOpen=!1;this.activeTab="home";this.unreadCount=0;this.messages=[];this.faqs=[];this.sections=[];this.activeSectionId=null;this.faqSearchQuery="";this.isPreChatCompleted=!1;this.csatRated=!1;this.pendingAttachment=null;this.audioCtx=null;this.config=this.parseConfig(),this.supabase=$i(this.config.supabaseUrl,this.config.supabaseKey);let e=this.config.workspaceId?`_${this.config.workspaceId.slice(0,8)}`:"";this.visitorId=this.getOrCreateVisitorId(e),this.conversationId=localStorage.getItem(`chatify_conversation_id${e}`),this.visitorName=localStorage.getItem(`chatify_visitor_name${e}`)||"",this.visitorEmail=localStorage.getItem(`chatify_visitor_email${e}`)||"",(this.visitorName||this.conversationId)&&(this.isPreChatCompleted=!0),this.initDOM(),this.bindGlobalTriggers(),this.loadWorkspaceArticles(),this.fetchWorkspaceSettingsAndApply().then(async()=>{if(this.initVisitorTracking(),this.initSPANavigationTracking(),!this.conversationId&&this.visitorId)try{let t=this.supabase.from("conversations").select("id, status").eq("visitor_id",this.visitorId).order("created_at",{ascending:!1}).limit(1);this.config.workspaceId&&(t=t.eq("workspace_id",this.config.workspaceId));let{data:i}=await t.maybeSingle();i?.id&&(this.conversationId=i.id,this.conversationStatus=i.status||"open",localStorage.setItem(`chatify_conversation_id${e}`,i.id))}catch{}this.conversationId&&(await this.loadMessageHistory(),this.subscribeToRealtime());try{let t=sessionStorage.getItem(`chatify_widget_open${e}`),i=sessionStorage.getItem(`chatify_widget_tab${e}`);t==="1"&&(this.open(i||"messages"),this.scrollToBottom(!1))}catch{}})}isImageAttachment(e){return e?e.includes("cloudinary.com")&&(e.includes("/image/upload/")||!e.includes("/raw/upload/"))?!0:!!e.match(/\.(jpeg|jpg|png|webp|gif|svg|avif|bmp)(\?.*)?$/i):!1}parseConfig(){let e=document.currentScript;e||(e=document.querySelector('script[src*="widget.js"]'));let t=typeof window<"u"?new URLSearchParams(window.location.search):null,i=t?.get("workspaceId")||t?.get("ws")||t?.get("chatify_workspace"),s=e?.getAttribute("data-api-url")||"";if(!s&&e?.src)try{s=new URL(e.src).origin}catch{}return!s&&typeof window<"u"&&(s=window.location.origin),{supabaseUrl:e?.getAttribute("data-supabase-url")||Wn,supabaseKey:e?.getAttribute("data-supabase-key")||Jn,workspaceId:i||e?.getAttribute("data-workspace-id")||null,title:e?.getAttribute("data-title")||"Support Team",subtitle:e?.getAttribute("data-subtitle")||"We reply in under 5 minutes",primaryColor:e?.getAttribute("data-color")||"#2e5bff",position:e?.getAttribute("data-position")||"bottom-right",helpTabLabel:e?.getAttribute("data-help-label")||"Help",showHelpTab:e?.getAttribute("data-show-help")!=="false",helpTabIcon:e?.getAttribute("data-help-icon")||"\u{1F4D6}",businessName:e?.getAttribute("data-business-name")||e?.getAttribute("data-company-name")||void 0,customDomain:e?.getAttribute("data-custom-domain")||void 0,apiUrl:s}}resetSession(){let e=this.config.workspaceId?`_${this.config.workspaceId.slice(0,8)}`:"";localStorage.removeItem(`chatify_visitor_id${e}`),localStorage.removeItem(`chatify_conversation_id${e}`),localStorage.removeItem(`chatify_visitor_name${e}`),localStorage.removeItem(`chatify_visitor_email${e}`),window.location.reload()}async fetchWorkspaceSettingsAndApply(){if(this.config.workspaceId)try{let{data:e,error:t}=await this.supabase.rpc("fn_get_workspace_config",{p_workspace_id:this.config.workspaceId});if(!t&&e&&(e.name&&(this.config.businessName=e.name),e.brand_color&&(this.config.primaryColor=e.brand_color),e.greeting_title&&(this.config.title=e.greeting_title),e.greeting_message&&(this.config.subtitle=e.greeting_message),e.widget_position&&(this.config.position=e.widget_position==="left"?"bottom-left":"bottom-right"),e.help_center_tab_label&&(this.config.helpTabLabel=e.help_center_tab_label),e.logo_url&&(this.config.logoUrl=e.logo_url),e.greeting_title&&(this.config.greetingTitle=e.greeting_title),typeof e.show_help_tab=="boolean"&&(this.config.showHelpTab=e.show_help_tab),e.help_center_tab_icon&&(this.config.helpTabIcon=e.help_center_tab_icon),e.custom_domain&&(this.config.customDomain=e.custom_domain),e.navbar_trigger_config&&(this.config.navbarTriggerConfig=e.navbar_trigger_config),this.initNavbarAutoTrigger(),this.updateThemeAndTexts(),e.business_hours?.enabled)){let i=this.isOutsideBusinessHours(e.business_hours),s=this.shadow?.getElementById("homeStatusPill"),n=this.shadow?.getElementById("homeCardSub"),a=this.shadow?.querySelector("#btnGoToMessages span");i?(s&&(s.innerHTML='<span class="chatify-pulse-dot away"></span> Typically replies in a few hours'),n&&(n.textContent="Leave a message and we'll reply as soon as we're back online."),a&&(a.textContent="Leave us a message")):(s&&(s.innerHTML='<span class="chatify-pulse-dot online"></span> Typically replies in 5m'),n&&(n.textContent="Ask us anything, or share your feedback."),a&&(a.textContent="Send us a message"))}await this.loadWorkspaceArticles()}catch(e){console.warn("[Chatify] Could not fetch workspace config:",e)}}isOutsideBusinessHours(e){if(!e||!e.enabled||!e.schedule)return!1;try{let t=new Date,i=e.timezone||"UTC",s=new Intl.DateTimeFormat("en-US",{weekday:"long",timeZone:i}).format(t).toLowerCase(),n=e.schedule[s];if(!n||!n.enabled)return!0;let a=new Intl.DateTimeFormat("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1,timeZone:i}).format(t);return a<n.start||a>n.end}catch{return!1}}async loadWorkspaceArticles(){if(!this.config.workspaceId){this.sections=[],this.faqs=[],this.renderFaqList();return}try{let[e,t]=await Promise.all([this.supabase.from("help_sections").select("id, name, description, icon, order_index, slug").eq("workspace_id",this.config.workspaceId).order("order_index",{ascending:!0}).order("created_at",{ascending:!0}),this.supabase.from("articles").select("id, title, slug, summary, content, category, section_id, order_index, section:help_sections(id, name, icon)").eq("workspace_id",this.config.workspaceId).eq("status","published").order("order_index",{ascending:!0}).order("created_at",{ascending:!0})]),i=t.data||[],s=e.data||[];this.faqs=i.map(o=>({id:o.id,slug:o.slug,q:o.title,summary:o.summary||"",a:o.content,category:o.section?.name||o.category||"General",icon:o.section?.icon||"\u{1F4DA}",sectionId:o.section_id||null,order_index:o.order_index??0}));let n={},a=0;if(this.faqs.forEach(o=>{o.sectionId?n[o.sectionId]=(n[o.sectionId]||0)+1:a++}),this.sections=s.map(o=>({id:o.id,name:o.name,description:o.description||null,icon:o.icon||"\u{1F4DA}",order_index:o.order_index??0,slug:o.slug||"",articleCount:n[o.id]||0})),a>0&&this.sections.push({id:"__other__",name:"General",description:null,icon:"\u{1F4DA}",order_index:9999,slug:"general",articleCount:a}),!this.config.customDomain){let{data:o}=await this.supabase.from("public_workspaces").select("custom_domain").eq("id",this.config.workspaceId).maybeSingle();o?.custom_domain&&(this.config.customDomain=o.custom_domain)}this.renderFaqList()}catch(e){console.warn("[Chatify] Failed to fetch dynamic articles or sections:",e),this.sections=[],this.faqs=[],this.renderFaqList()}}formatMarkdownToHtml(e){if(!e)return"";let t=e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");return t=t.replace(/```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g,(s,n)=>`<pre class="chatify-code-block"><code>${n.trim()}</code></pre>`),t=t.replace(/`([^`\n]+)`/g,'<code class="chatify-inline-code">$1</code>'),t=t.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g,'<img src="$2" alt="$1" class="chatify-art-img" style="max-width:100%;border-radius:6px;margin:6px 0;" />'),t=t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer" class="chatify-art-link">$1</a>'),t=t.replace(/^#### (.*$)/gim,'<h5 style="margin:10px 0 4px;font-size:12.5px;font-weight:700;color:var(--w-ink);">$1</h5>'),t=t.replace(/^### (.*$)/gim,'<h4 style="margin:12px 0 4px;font-size:13px;font-weight:700;color:var(--w-ink);">$1</h4>'),t=t.replace(/^## (.*$)/gim,'<h3 style="margin:14px 0 6px;font-size:14px;font-weight:700;color:var(--w-ink);">$1</h3>'),t=t.replace(/^# (.*$)/gim,'<h2 style="margin:16px 0 6px;font-size:15px;font-weight:700;color:var(--w-ink);">$1</h2>'),t=t.replace(/\*\*\*([^*]+)\*\*\*/g,"<strong><em>$1</em></strong>"),t=t.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"),t=t.replace(/__([^_]+)__/g,"<strong>$1</strong>"),t=t.replace(/\*([^*]+)\*/g,"<em>$1</em>"),t=t.replace(/_([^_]+)_/g,"<em>$1</em>"),t=t.replace(/^>\s?(.*$)/gim,'<blockquote style="border-left:3px solid var(--w-brand);margin:6px 0;padding-left:8px;color:var(--w-ink-2);font-style:italic;">$1</blockquote>'),t=t.replace(/((?:^(?:[-*]\s+.+)(?:\n|$))+)/gm,s=>`<ul style="margin:6px 0 8px 18px;padding:0;">${s.trim().split(`
`).map(a=>a.replace(/^[-*]\s+/,"").trim()).filter(Boolean).map(a=>`<li style="margin-bottom:3px;">${a}</li>`).join("")}</ul>`),t=t.replace(/((?:^\d+\.\s+.+(?:\n|$))+)/gm,s=>`<ol style="margin:6px 0 8px 18px;padding:0;">${s.trim().split(`
`).map(a=>a.replace(/^\d+\.\s+/,"").trim()).filter(Boolean).map(a=>`<li style="margin-bottom:3px;">${a}</li>`).join("")}</ol>`),t=t.split(/\n\s*\n/).map(s=>{let n=s.trim();return n?n.startsWith("<h")||n.startsWith("<pre")||n.startsWith("<ul")||n.startsWith("<ol")||n.startsWith("<blockquote")?n:`<p style="margin:0 0 8px 0;line-height:1.55;">${n.replace(/\n/g,"<br/>")}</p>`:""}).join(""),t}renderArticleItem(e,t,i){let s=this.config.workspaceId?this.config.customDomain?`https://${this.config.customDomain}/${e.slug||e.id}`:`/help/${this.config.workspaceId}/${e.slug||e.id}`:"";return`
      <div class="chatify-faq-item" data-idx="${t}" data-id="${e.id||""}" data-slug="${e.slug||""}">
        ${i&&e.category?`
          <div style="font-size:11px; font-weight:600; color:var(--w-brand); margin-bottom:4px; display:flex; align-items:center; gap:4px;">
            <span>${e.icon||"\u{1F4DA}"}</span>
            <span>${e.category}</span>
          </div>
        `:""}
        <div class="chatify-faq-q">
          <span>${e.q}</span>
          <span class="chatify-faq-arrow">\u203A</span>
        </div>
        <div class="chatify-faq-a">
          ${e.summary?`<p style="font-size:12px; font-weight:600; color:var(--w-ink); margin-bottom:6px; line-height:1.4;">${this.escapeHTML(e.summary)}</p>`:""}
          <div class="chatify-faq-markdown">${this.formatMarkdownToHtml(e.a)}</div>
          
          <div style="margin-top:12px; padding-top:8px; border-top:1px solid var(--w-line); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            ${s?`
              <a href="${s}" target="_blank" rel="noopener noreferrer" class="chatify-article-ext-link" title="Open full article in dedicated Help Center">
                <span>Open in full Help Center</span> \u2197
              </a>
            `:"<span></span>"}

            ${e.id?`
              <div class="chatify-vote-group" style="display:flex; align-items:center; gap:6px;">
                <span style="font-size:11px; color:var(--w-ink-3);">Helpful?</span>
                <button class="chatify-vote-btn" data-art-id="${e.id}" data-helpful="true" style="padding:3px 8px; border-radius:4px; border:1px solid var(--w-line); background:var(--w-surface); font-size:11.5px; cursor:pointer; color:var(--w-ink);">\u{1F44D} Yes</button>
                <button class="chatify-vote-btn" data-art-id="${e.id}" data-helpful="false" style="padding:3px 8px; border-radius:4px; border:1px solid var(--w-line); background:var(--w-surface); font-size:11.5px; cursor:pointer; color:var(--w-ink);">\u{1F44E} No</button>
              </div>
            `:""}
          </div>
        </div>
      </div>
    `}renderFaqList(){let e=this.shadow?.getElementById("faqList");if(!e)return;let t=this.shadow?.getElementById("cardHelpSearch");if(t&&(t.style.display=this.config.showHelpTab!==!1&&(this.faqs.length>0||this.sections.length>0)?"block":"none"),this.faqs.length===0&&this.sections.length===0){e.innerHTML=`
        <div style="padding: 36px 16px; text-align: center; color: var(--w-ink-3); font-size: 13px;">
          <div style="font-size: 28px; margin-bottom: 8px;">\u{1F4D6}</div>
          <p style="margin: 0; font-weight: 600; color: var(--w-ink-2); font-size: 13.5px;">No help articles published yet</p>
          <p style="margin: 6px 0 0; font-size: 12px; color: var(--w-ink-3); line-height: 1.5;">Articles created in your Help Desk dashboard will appear here.</p>
        </div>
      `;return}let i=(this.faqSearchQuery||"").toLowerCase().trim();if(i){let a=this.faqs.filter(o=>o.q.toLowerCase().includes(i)||o.summary&&o.summary.toLowerCase().includes(i)||o.a.toLowerCase().includes(i)||o.category&&o.category.toLowerCase().includes(i));if(a.length===0){e.innerHTML=`
          <div id="faqNoResults" style="padding: 32px 16px; text-align: center; color: var(--w-ink-3); font-size: 13px;">
            <div style="font-size: 24px; margin-bottom: 8px;">\u{1F50D}</div>
            <p style="margin: 0; font-weight: 500;">No articles match &ldquo;${this.escapeHTML(i)}&rdquo;.</p>
          </div>
        `;return}e.innerHTML=`
        <div style="font-size: 11.5px; font-weight: 600; color: var(--w-ink-3); margin-bottom: 10px; padding-left: 2px;">
          ${a.length} article${a.length===1?"":"s"} found
        </div>
        <div class="chatify-faq-list">
          ${a.map((o,l)=>this.renderArticleItem(o,l,!0)).join("")}
        </div>
      `,this.bindFaqListeners();return}if(!this.activeSectionId){if(this.sections.length===0){e.innerHTML=`
          <div class="chatify-faq-list">
            ${this.faqs.map((a,o)=>this.renderArticleItem(a,o,!0)).join("")}
          </div>
        `,this.bindFaqListeners();return}e.innerHTML=`
        <div class="chatify-section-list">
          ${this.sections.map(a=>`
            <div class="chatify-section-card" data-section-id="${a.id}">
              <div class="chatify-section-card-icon">${a.icon||"\u{1F4DA}"}</div>
              <div class="chatify-section-card-info">
                <h4 class="chatify-section-card-title">${this.escapeHTML(a.name)}</h4>
                <p class="chatify-section-card-desc">
                  ${a.description?this.escapeHTML(a.description):`${a.articleCount||0} article${(a.articleCount||0)===1?"":"s"}`}
                </p>
              </div>
              <span class="chatify-section-card-arrow">\u203A</span>
            </div>
          `).join("")}
        </div>
      `,this.bindFaqListeners();return}let s=this.sections.find(a=>a.id===this.activeSectionId)||{id:this.activeSectionId,name:"Articles",icon:"\u{1F4DA}",description:null,articleCount:0},n=this.faqs.filter(a=>a.sectionId===this.activeSectionId||this.activeSectionId==="__other__"&&!a.sectionId);e.innerHTML=`
      <div class="chatify-section-view">
        <button class="chatify-section-back-btn" id="faqBackToSections" title="Back to collections">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          <span>All Collections</span>
        </button>

        <div class="chatify-section-view-header">
          <span class="chatify-section-view-icon">${s.icon||"\u{1F4DA}"}</span>
          <div class="chatify-section-view-text">
            <h3>${this.escapeHTML(s.name)}</h3>
            ${s.description?`<p>${this.escapeHTML(s.description)}</p>`:`<p>${n.length} article${n.length===1?"":"s"}</p>`}
          </div>
        </div>

        <div class="chatify-faq-list">
          ${n.length===0?`
            <div style="padding: 32px 16px; text-align: center; color: var(--w-ink-3); font-size: 13px;">
              <p style="margin: 0; font-weight: 500;">No articles in this section yet.</p>
            </div>
          `:n.map((a,o)=>this.renderArticleItem(a,o,!1)).join("")}
        </div>
      </div>
    `,this.bindFaqListeners()}bindFaqListeners(){let e=this.shadow?.getElementById("faqBackToSections");e&&(e.onclick=()=>{this.activeSectionId=null,this.renderFaqList()}),this.shadow?.querySelectorAll(".chatify-section-card").forEach(t=>{t.onclick=()=>{let i=t.getAttribute("data-section-id");i&&(this.activeSectionId=i,this.renderFaqList())}}),this.shadow?.querySelectorAll(".chatify-faq-item").forEach(t=>{t.onclick=i=>{i.target.closest(".chatify-vote-btn")||i.target.closest(".chatify-article-ext-link")||t.classList.toggle("open")}}),this.shadow?.querySelectorAll(".chatify-vote-btn").forEach(t=>{t.onclick=async i=>{i.stopPropagation();let s=i.currentTarget,n=s.getAttribute("data-art-id"),a=s.getAttribute("data-helpful")==="true",o=s.closest(".chatify-vote-group");if(o&&(o.innerHTML='<span style="font-size:11px; color:var(--w-brand); font-weight:600;">\u2713 Feedback sent</span>'),n&&this.config.workspaceId)try{await this.supabase.rpc("fn_submit_article_feedback",{p_article_id:n,p_workspace_id:this.config.workspaceId,p_visitor_id:this.visitorId,p_is_helpful:a,p_feedback_text:null})}catch{}}})}getOrCreateVisitorId(e){let t=localStorage.getItem(`chatify_visitor_id${e}`);return t||(t="xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,i=>{let s=Math.random()*16|0;return(i==="x"?s:s&3|8).toString(16)}),localStorage.setItem(`chatify_visitor_id${e}`,t)),t}async initVisitorTracking(){let e=Intl.DateTimeFormat().resolvedOptions().timeZone||"Unknown";try{await this.supabase.rpc("fn_upsert_visitor",{p_id:this.visitorId,p_name:this.visitorName||null,p_email:this.visitorEmail||null,p_current_url:window.location.href,p_user_agent:navigator.userAgent,p_ip_address:null,p_location:e,p_workspace_id:this.config.workspaceId||null});try{await this.supabase.rpc("fn_update_visitor_meta",{p_id:this.visitorId,p_timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||null,p_language:navigator.language||null})}catch{}}catch(i){console.warn("[Chatify] Visitor tracking error:",i)}(async()=>{try{let i="",s="";try{let n=await fetch("https://ipwho.is/",{signal:AbortSignal.timeout(2500)});if(n.ok){let a=await n.json();a.success!==!1&&a.country&&(i=a.city||"",s=a.country||"")}}catch{}if(!s)try{let n=await fetch("https://ipapi.co/json/",{signal:AbortSignal.timeout(2500)});if(n.ok){let a=await n.json();a.country_name&&(i=a.city||"",s=a.country_name||"")}}catch{}if(s){let n=i?`${i}, ${s}`:s;await this.supabase.rpc("fn_upsert_visitor",{p_id:this.visitorId,p_name:this.visitorName||null,p_email:this.visitorEmail||null,p_current_url:window.location.href,p_user_agent:navigator.userAgent,p_ip_address:null,p_location:n,p_workspace_id:this.config.workspaceId||null})}}catch{}})(),setInterval(()=>{this.sendHeartbeat()},15e3);let t=()=>{try{fetch(`${this.config.supabaseUrl}/rest/v1/rpc/fn_visitor_offline`,{method:"POST",headers:{"Content-Type":"application/json",apikey:this.config.supabaseKey,Authorization:`Bearer ${this.config.supabaseKey}`},body:JSON.stringify({p_visitor_id:this.visitorId}),keepalive:!0}).catch(()=>{})}catch{}};window.addEventListener("beforeunload",t),window.addEventListener("pagehide",t)}async sendHeartbeat(){try{await this.supabase.rpc("fn_visitor_heartbeat",{p_visitor_id:this.visitorId,p_current_url:window.location.href})}catch{}}initSPANavigationTracking(){let e=()=>{setTimeout(()=>this.sendHeartbeat(),200)},t=history.pushState;history.pushState=function(...s){let n=t.apply(this,s);return e(),n};let i=history.replaceState;history.replaceState=function(...s){let n=i.apply(this,s);return e(),n},window.addEventListener("popstate",e)}playIncomingSound(){try{if(!this.audioCtx){let s=window.AudioContext||window.webkitAudioContext;this.audioCtx=new s}this.audioCtx.state==="suspended"&&this.audioCtx.resume();let e=this.audioCtx.currentTime,t=this.audioCtx.createOscillator(),i=this.audioCtx.createGain();t.type="sine",t.frequency.setValueAtTime(784,e),t.frequency.setValueAtTime(1046.5,e+.1),i.gain.setValueAtTime(0,e),i.gain.linearRampToValueAtTime(.2,e+.02),i.gain.exponentialRampToValueAtTime(.001,e+.35),t.connect(i),i.connect(this.audioCtx.destination),t.start(e),t.stop(e+.35)}catch{}}subscribeToRealtime(){this.conversationId&&this.supabase.channel(`chatify-widget-${this.conversationId}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"messages",filter:`conversation_id=eq.${this.conversationId}`},e=>{let t=e.new;t.is_internal||this.messages.some(i=>i.id===t.id)||(this.messages.push(t),this.renderMessages(),t.sender_type!=="visitor"&&(this.playIncomingSound(),!this.isOpen||this.activeTab!=="messages"?(this.unreadCount+=1,this.updateUnreadBadge(),this.markMessagesAsDelivered()):this.markMessagesAsRead()))}).on("postgres_changes",{event:"UPDATE",schema:"public",table:"messages",filter:`conversation_id=eq.${this.conversationId}`},e=>{let t=e.new,i=this.messages.findIndex(s=>s.id===t.id);i!==-1&&(this.messages[i]={...this.messages[i],...t},this.renderMessages())}).on("postgres_changes",{event:"DELETE",schema:"public",table:"messages",filter:`conversation_id=eq.${this.conversationId}`},e=>{let t=e.old?.id;t&&(this.messages=this.messages.filter(i=>i.id!==t),this.renderMessages())}).on("postgres_changes",{event:"UPDATE",schema:"public",table:"conversations",filter:`id=eq.${this.conversationId}`},e=>{let t=e.new;t.status&&(this.conversationStatus=t.status,this.renderMessages())}).subscribe()}async loadMessageHistory(){if(!this.conversationId)return;let{data:e}=await this.supabase.from("messages").select("*").eq("conversation_id",this.conversationId).or("is_internal.is.null,is_internal.eq.false").order("created_at",{ascending:!0});e&&(this.messages=e,this.renderMessages(),this.isOpen&&this.activeTab==="messages"?(this.unreadCount=0,this.markMessagesAsRead()):this.unreadCount=this.messages.filter(t=>t.sender_type!=="visitor"&&!t.read_at).length,this.updateUnreadBadge())}async markMessagesAsDelivered(){if(this.conversationId)try{await this.supabase.rpc("fn_mark_messages_delivered",{p_conversation_id:this.conversationId,p_exclude_sender:"visitor"})}catch{}}async markMessagesAsRead(){if(this.conversationId){try{await this.supabase.rpc("fn_mark_messages_read",{p_conversation_id:this.conversationId,p_exclude_sender:"visitor"})}catch{}try{await this.supabase.rpc("fn_mark_conversation_messages_as_read",{p_conversation_id:this.conversationId,p_reader_type:"visitor"})}catch{}}}async ensureConversation(){if(this.conversationId)return this.conversationId;let e=this.config.workspaceId?`_${this.config.workspaceId.slice(0,8)}`:"",{data:t,error:i}=await this.supabase.rpc("fn_get_or_create_conversation",{p_visitor_id:this.visitorId,p_workspace_id:this.config.workspaceId||null});if(i||!t){console.warn("[Chatify] fn_get_or_create_conversation fallback:",i);try{await this.supabase.from("visitors").upsert({id:this.visitorId,workspace_id:this.config.workspaceId||null,last_seen:new Date().toISOString(),is_online:!0});let{data:s,error:n}=await this.supabase.from("conversations").insert({visitor_id:this.visitorId,workspace_id:this.config.workspaceId||null,status:"open"}).select().single();if(s)t=s;else throw n||new Error("Failed to create conversation")}catch(s){throw new Error("Failed to create conversation: "+(i?.message||String(s)))}}return this.conversationId=t.id,this.conversationStatus=t.status||"open",localStorage.setItem(`chatify_conversation_id${e}`,t.id),this.subscribeToRealtime(),t.id}async sendMessage(e,t){if(!e.trim()&&!t)return;let i=await this.ensureConversation(),s={id:"temp-"+Date.now(),sender_type:"visitor",content:e.trim()||(t?"Sent a picture":""),attachment_url:t||null,created_at:new Date().toISOString(),pending:!0};this.messages.push(s),this.renderMessages(),this.conversationStatus!=="open"&&(this.conversationStatus="open",this.supabase.from("conversations").update({status:"open",closed_at:null,snoozed_until:null,updated_at:new Date().toISOString()}).eq("id",i).then(()=>{}));let{data:n}=await this.supabase.from("messages").insert({conversation_id:i,sender_type:"visitor",content:e.trim()||(t?"Sent a picture":""),attachment_url:t||null,is_internal:!1}).select().single();if(n){let a=this.messages.findIndex(o=>o.id===s.id);a!==-1&&(this.messages[a]=n,this.renderMessages())}}async submitCSAT(e){this.conversationId&&(this.csatRated=!0,await this.supabase.from("conversations").update({csat_rating:e}).eq("id",this.conversationId),this.renderMessages())}initDOM(){this.container=document.createElement("div"),this.container.id="chatify-widget-root",document.body.appendChild(this.container),this.shadow=this.container.attachShadow({mode:"open"});let e=document.createElement("style");e.id="chatify-theme-style",e.textContent=this.generateCSS(),this.shadow.appendChild(e);let t=document.createElement("button");t.className="chatify-launcher",t.id="chatifyLauncherBtn",t.innerHTML=`
      <div class="chatify-badge" id="chatifyBadge">0</div>
      <img id="chatifyIconOpen" src="${Re}" alt="Chat" class="chatify-launcher-icon" />
      <svg id="chatifyIconClose" style="display:none;" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `,t.onclick=()=>this.toggleWindow(),this.shadow.appendChild(t);let i=document.createElement("div");i.className="chatify-window",i.id="chatifyWindow",i.innerHTML=`
      <!-- TAB 1: HOME TAB -->
      <div class="chatify-tab-pane" id="tabHome" style="display: flex;">
        <div class="chatify-home-hero">
          <div class="chatify-brand-row">
            <div class="chatify-home-avatar" id="homeBrandAvatar">
              <img src="${Re}" alt="Logo" style="width:100%;height:100%;object-fit:contain;border-radius:inherit;" />
            </div>
            <button class="chatify-icon-btn" id="homeCloseBtn" title="Close Messenger">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <h2 class="chatify-home-title" id="homeGreetingTitle">Hello there \u{1F44B}</h2>
          <p class="chatify-home-sub" id="homeGreetingSub">How can our support team help you today?</p>
        </div>

        <div class="chatify-home-content">
          <!-- Active Open Conversation Card (shown when opened conversation exists) -->
          <div class="chatify-card chatify-card-action chatify-open-conv-card" id="cardOpenConv" style="display: none;">
            <div class="chatify-card-head">
              <span class="chatify-status-pill chatify-conv-status-pill" id="openConvStatusPill">
                <span class="chatify-pulse-dot online"></span>
                <span>Active conversation</span>
              </span>
              <span class="chatify-conv-time" id="openConvTime">Just now</span>
            </div>
            <div class="chatify-open-conv-preview">
              <div class="chatify-open-conv-avatar-col">
                <div class="chatify-mini-avatar" id="openConvAvatar" style="background:linear-gradient(135deg,var(--w-brand),#1e40af); width:34px; height:34px; font-size:13px; margin-left:0;">\u{1F4AC}</div>
              </div>
              <div class="chatify-open-conv-text-col">
                <div class="chatify-open-conv-sender-row">
                  <span class="chatify-open-conv-sender" id="openConvSender">Support Team</span>
                  <span class="chatify-home-unread-pill" id="openConvUnreadPill" style="display:none;">1 new</span>
                </div>
                <p class="chatify-open-conv-snippet" id="openConvSnippet">Click to view messages...</p>
              </div>
            </div>
            <button class="chatify-primary-cta" id="btnContinueConversation">
              <span id="btnContinueConvText">Continue conversation</span>
              <span class="chatify-cta-badge" id="openConvCtaBadge" style="display:none;">1</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
            <button type="button" class="chatify-new-conv-link" id="btnStartNewChat">
              <span>+ Send a new message</span>
            </button>
          </div>

          <!-- Start Chat Card (shown when no conversation exists yet) -->
          <div class="chatify-card chatify-card-action" id="cardStartChat">
            <div class="chatify-card-head">
              <div class="chatify-avatars-stack" id="homeAvatarsStack">
                <div class="chatify-mini-avatar" style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);">A</div>
                <div class="chatify-mini-avatar" style="background:linear-gradient(135deg,#8b5cf6,#6d28d9);">S</div>
                <div class="chatify-mini-avatar" style="background:linear-gradient(135deg,#10b981,#047857);">M</div>
              </div>
              <span class="chatify-status-pill" id="homeStatusPill">
                <span class="chatify-pulse-dot online"></span>
                <span>Typically replies in 5m</span>
              </span>
              <span class="chatify-home-unread-pill" id="homeCardUnreadPill" style="display:none;">1 new message</span>
            </div>
            <h4 class="chatify-card-title" id="homeCardTitle">Chat with us</h4>
            <p class="chatify-card-sub" id="homeCardSub">Ask us anything, or share your feedback.</p>
            <button class="chatify-primary-cta" id="btnGoToMessages">
              <span id="btnGoToMessagesText">Chat with us</span>
              <span class="chatify-cta-badge" id="homeCardCtaBadge" style="display:none;">1</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>

          <!-- Help Center Quick Search (shown only when workspace has published articles) -->
          <div class="chatify-card chatify-card-help" id="cardHelpSearch" style="display: none;">
            <div class="chatify-section-title" id="homeHelpSectionTitle">Knowledge Base</div>
            <p class="chatify-card-sub" style="margin-bottom:12px;">Search self-service answers and guides:</p>
            <div class="chatify-search-trigger" id="homeSearchTrigger">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <span>Search for help articles...</span>
              <span class="chatify-search-kbd">Search</span>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: MESSAGES TAB (Active Chat Thread) -->
      <div class="chatify-tab-pane" id="tabMessages" style="display: none;">
        <div class="chatify-header">
          <div class="chatify-header-info">
            <button class="chatify-back-btn" id="btnBackToHome" title="Back to Home">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
            <div class="chatify-avatar" id="chatifyHeaderAvatar">
              <img src="${Re}" alt="Logo" style="width:100%;height:100%;object-fit:contain;border-radius:inherit;" />
              <span class="chatify-online-dot"></span>
            </div>
            <div class="chatify-header-text">
              <h3 id="chatifyHeaderTitle">${this.config.title}</h3>
              <p id="chatifyHeaderSubtitle">${this.config.subtitle}</p>
            </div>
          </div>
          <button class="chatify-close-btn" id="chatifyCloseBtn" title="Close">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="chatify-body" id="chatifyBody">
          ${this.isPreChatCompleted?"":`
            <div class="chatify-prechat" id="chatifyPreChat">
              <h4>\u{1F44B} Welcome to Live Support</h4>
              <p>Please introduce yourself so our support team can best assist you.</p>
              <div class="chatify-form-group">
                <label>Your Name <span class="chatify-optional-tag">(Optional)</span></label>
                <input type="text" id="chatifyInputName" class="chatify-input" placeholder="e.g. Sarah Connor" />
              </div>
              <div class="chatify-form-group">
                <label>Email Address <span class="chatify-optional-tag">(Optional)</span></label>
                <input type="email" id="chatifyInputEmail" class="chatify-input" placeholder="sarah@example.com" />
              </div>
              <button class="chatify-start-btn" id="chatifyStartBtn">Start Live Conversation</button>
              <button type="button" class="chatify-skip-btn" id="chatifySkipBtn">
                <span>Skip &amp; start as Guest</span>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          `}
        </div>

        <!-- Attachment preview container -->
        <div id="chatifyAttachmentPreview" class="chatify-attachment-preview" style="display:none;">
          <img id="chatifyPreviewImg" class="chatify-preview-thumb" src="" alt="Preview" />
          <div class="chatify-preview-info">
            <span id="chatifyPreviewName" class="chatify-preview-name">image.png</span>
            <span id="chatifyPreviewSize" class="chatify-preview-size">0 KB</span>
          </div>
          <button type="button" id="chatifyPreviewRemove" class="chatify-preview-remove" title="Remove picture">\u2715</button>
        </div>

        <!-- Emoji Picker Popover -->
        <div id="chatifyEmojiPicker" class="chatify-emoji-popover" style="display:none;">
          <div class="chatify-emoji-grid" id="chatifyEmojiGrid"></div>
        </div>

        <!-- Hidden input for picture upload -->
        <input type="file" id="chatifyImageInput" accept="image/*" style="display:none;" />

        <div class="chatify-footer" id="chatifyFooter" style="${this.isPreChatCompleted?"display:flex;":"display:none;"}">
          <div class="chatify-footer-actions">
            <button type="button" id="chatifyImageBtn" class="chatify-action-btn" title="Send picture">
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </button>
            <button type="button" id="chatifyEmojiBtn" class="chatify-action-btn" title="Insert emoji">
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                <line x1="9" y1="9" x2="9.01" y2="9"></line>
                <line x1="15" y1="9" x2="15.01" y2="9"></line>
              </svg>
            </button>
          </div>
          <textarea id="chatifyTextarea" class="chatify-textarea" rows="1" placeholder="Type a message..."></textarea>
          <button id="chatifySendBtn" class="chatify-send-btn" title="Send message">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>

      <!-- TAB 3: HELP TAB (Knowledge Base) -->
      <div class="chatify-tab-pane" id="tabHelp" style="display: none;">
        <div class="chatify-header">
          <div class="chatify-header-text">
            <h3>Knowledge Base</h3>
            <p>Self-service guides &amp; FAQs</p>
          </div>
          <button class="chatify-close-btn" id="helpCloseBtn" title="Close">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="chatify-help-body">
          <div class="chatify-help-search-bar">
            <input type="text" id="helpSearchInput" placeholder="Search answers..." />
          </div>

          <div class="chatify-faq-list" id="faqList">
            <div style="padding: 36px 16px; text-align: center; color: var(--w-ink-3); font-size: 13px;">
              <div style="font-size: 28px; margin-bottom: 8px;">\u{1F4D6}</div>
              <p style="margin: 0; font-weight: 600; color: var(--w-ink-2); font-size: 13.5px;">No help articles published yet</p>
              <p style="margin: 6px 0 0; font-size: 12px; color: var(--w-ink-3); line-height: 1.5;">Articles created in your Help Desk dashboard will appear here.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Intercom Navigation Bar -->
      <nav class="chatify-bottom-nav">
        <button class="chatify-nav-item active" data-tab="home" id="navHome">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <span>Home</span>
        </button>
        <button class="chatify-nav-item" data-tab="messages" id="navMessages">
          <div class="nav-msg-icon-wrap">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span class="chatify-nav-badge" id="navMsgBadge" style="display:none;">1</span>
          </div>
          <span class="chatify-nav-label-wrap">
            <span id="navMessagesText">Chat</span>
            <span class="chatify-nav-inline-badge" id="navMsgInlineBadge" style="display:none;">1</span>
          </span>
        </button>
        <button class="chatify-nav-item" data-tab="help" id="navHelp">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <span>Help</span>
        </button>
      </nav>

      <!-- Image Lightbox Modal -->
      <div id="chatifyImageLightbox" class="chatify-lightbox" style="display:none;">
        <button type="button" id="chatifyLightboxClose" class="chatify-lightbox-close" title="Close">\u2715</button>
        <img id="chatifyLightboxImg" class="chatify-lightbox-img" src="" alt="Enlarged" />
        <a id="chatifyLightboxLink" class="chatify-lightbox-link" href="#" target="_blank" rel="noopener noreferrer">Open original in new tab</a>
      </div>
    `,this.shadow.appendChild(i),this.shadow.getElementById("homeCloseBtn")?.addEventListener("click",()=>this.toggleWindow()),this.shadow.getElementById("chatifyCloseBtn")?.addEventListener("click",()=>this.toggleWindow()),this.shadow.getElementById("helpCloseBtn")?.addEventListener("click",()=>this.toggleWindow()),this.shadow.querySelectorAll(".chatify-nav-item").forEach(g=>{g.addEventListener("click",m=>{let w=m.currentTarget.getAttribute("data-tab");this.switchTab(w)})}),this.shadow.getElementById("btnGoToMessages")?.addEventListener("click",()=>{this.switchTab("messages")}),this.shadow.getElementById("cardStartChat")?.addEventListener("click",g=>{g.target?.closest("#btnGoToMessages")||this.switchTab("messages")}),this.shadow.getElementById("btnContinueConversation")?.addEventListener("click",()=>{this.switchTab("messages")}),this.shadow.getElementById("cardOpenConv")?.addEventListener("click",g=>{g.target?.closest("#btnContinueConversation, #btnStartNewChat")||this.switchTab("messages")}),this.shadow.getElementById("btnStartNewChat")?.addEventListener("click",g=>{g.stopPropagation(),this.switchTab("messages"),setTimeout(()=>{this.shadow?.getElementById("chatifyTextarea")?.focus()},120)}),this.shadow.getElementById("btnBackToHome")?.addEventListener("click",()=>{this.switchTab("home")}),this.shadow.getElementById("homeSearchTrigger")?.addEventListener("click",()=>{this.switchTab("help"),setTimeout(()=>{this.shadow?.getElementById("helpSearchInput")?.focus()},100)}),this.bindFaqListeners(),this.shadow.getElementById("helpSearchInput")?.addEventListener("input",g=>{this.faqSearchQuery=g.target.value,this.renderFaqList()});let n=this.shadow.getElementById("chatifyStartBtn");n&&n.addEventListener("click",()=>this.handleStartPreChat(!1));let a=this.shadow.getElementById("chatifySkipBtn");a&&a.addEventListener("click",()=>this.handleStartPreChat(!0));let o=this.shadow.getElementById("chatifySendBtn"),l=this.shadow.getElementById("chatifyTextarea"),c=this.shadow.getElementById("chatifyImageBtn"),h=this.shadow.getElementById("chatifyImageInput"),u=this.shadow.getElementById("chatifyEmojiBtn"),f=this.shadow.getElementById("chatifyPreviewRemove"),d=this.shadow.getElementById("chatifyLightboxClose"),p=this.shadow.getElementById("chatifyImageLightbox");c?.addEventListener("click",()=>{h?.click()}),h?.addEventListener("change",g=>{let m=g.target.files?.[0];m&&this.handleSelectImage(m)}),f?.addEventListener("click",()=>{this.clearPendingAttachment()}),u?.addEventListener("click",g=>{g.stopPropagation(),this.toggleEmojiPicker()}),this.renderEmojiGrid(),this.shadow.addEventListener("click",g=>{let m=g.target;!m.closest("#chatifyEmojiPicker")&&!m.closest("#chatifyEmojiBtn")&&this.closeEmojiPicker()}),l?.addEventListener("paste",g=>{let m=g.clipboardData?.items;if(m){for(let w=0;w<m.length;w++)if(m[w].type.startsWith("image/")){let _=m[w].getAsFile();if(_){g.preventDefault(),this.handleSelectImage(_);break}}}}),d?.addEventListener("click",()=>this.closeLightbox()),p?.addEventListener("click",g=>{g.target.id==="chatifyImageLightbox"&&this.closeLightbox()}),o?.addEventListener("click",()=>this.handleSendMessage()),l?.addEventListener("keydown",g=>{g.key==="Enter"&&!g.shiftKey&&(g.preventDefault(),this.handleSendMessage())})}handleSelectImage(e){if(e.size>15*1024*1024){alert("File size exceeds maximum 15MB limit.");return}if(!e.type.startsWith("image/")){alert("Please select an image file (JPEG, PNG, WEBP, GIF, etc.).");return}this.pendingAttachment?.previewUrl&&URL.revokeObjectURL(this.pendingAttachment.previewUrl);let t=URL.createObjectURL(e);this.pendingAttachment={file:e,previewUrl:t};let i=this.shadow?.getElementById("chatifyAttachmentPreview"),s=this.shadow?.getElementById("chatifyPreviewImg"),n=this.shadow?.getElementById("chatifyPreviewName"),a=this.shadow?.getElementById("chatifyPreviewSize");i&&s&&(s.src=t,n&&(n.textContent=e.name),a&&(a.textContent=`${(e.size/1024).toFixed(0)} KB \xB7 Ready to send`),i.style.display="flex")}clearPendingAttachment(){this.pendingAttachment?.previewUrl&&URL.revokeObjectURL(this.pendingAttachment.previewUrl),this.pendingAttachment=null;let e=this.shadow?.getElementById("chatifyAttachmentPreview");e&&(e.style.display="none");let t=this.shadow?.getElementById("chatifyImageInput");t&&(t.value="")}toggleEmojiPicker(){let e=this.shadow?.getElementById("chatifyEmojiPicker");if(!e)return;let t=e.style.display==="block";e.style.display=t?"none":"block"}closeEmojiPicker(){let e=this.shadow?.getElementById("chatifyEmojiPicker");e&&(e.style.display="none")}renderEmojiGrid(){let e=this.shadow?.getElementById("chatifyEmojiGrid");if(!e)return;e.innerHTML="",["\u{1F44B}","\u{1F60A}","\u{1F44D}","\u2764\uFE0F","\u{1F525}","\u{1F389}","\u{1F680}","\u{1F64C}","\u{1F4A1}","\u2728","\u{1F64F}","\u{1F4AF}","\u{1F914}","\u{1F440}","\u{1F60E}","\u{1F91D}","\u{1F60D}","\u2B50","\u26A1","\u{1F4BB}","\u{1F4DE}","\u{1F4E9}","\u2705","\u274C"].forEach(i=>{let s=document.createElement("button");s.type="button",s.className="chatify-emoji-btn",s.textContent=i,s.addEventListener("click",n=>{n.stopPropagation(),this.insertEmoji(i)}),e.appendChild(s)})}insertEmoji(e){let t=this.shadow?.getElementById("chatifyTextarea");if(!t)return;let i=t.selectionStart||t.value.length,s=t.selectionEnd||t.value.length,n=t.value;t.value=n.substring(0,i)+e+n.substring(s),t.selectionStart=t.selectionEnd=i+e.length,t.focus(),this.closeEmojiPicker()}openLightbox(e){let t=this.shadow?.getElementById("chatifyImageLightbox"),i=this.shadow?.getElementById("chatifyLightboxImg"),s=this.shadow?.getElementById("chatifyLightboxLink");t&&i&&(i.src=e,s&&(s.href=e),t.style.display="flex")}closeLightbox(){let e=this.shadow?.getElementById("chatifyImageLightbox");e&&(e.style.display="none")}switchTab(e){this.activeTab=e;let t=this.shadow?.getElementById("tabHome"),i=this.shadow?.getElementById("tabMessages"),s=this.shadow?.getElementById("tabHelp");t&&(t.style.display=e==="home"?"flex":"none"),i&&(i.style.display=e==="messages"?"flex":"none"),s&&(s.style.display=e==="help"?"flex":"none"),this.shadow?.querySelectorAll(".chatify-nav-item").forEach(a=>{a.classList.toggle("active",a.getAttribute("data-tab")===e)});let n=this.config.workspaceId?`_${this.config.workspaceId.slice(0,8)}`:"";try{sessionStorage.setItem(`chatify_widget_tab${n}`,e)}catch{}e==="messages"&&(this.unreadCount=0,this.updateUnreadBadge(),this.markMessagesAsRead(),this.scrollToBottom(!1),setTimeout(()=>{this.shadow?.getElementById("chatifyTextarea")?.focus()},100))}updateThemeAndTexts(){let e=this.shadow?.getElementById("chatify-theme-style");e&&(e.textContent=this.generateCSS());let t=this.shadow?.getElementById("chatifyHeaderTitle");t&&(t.textContent=this.config.title);let i=this.shadow?.getElementById("chatifyHeaderSubtitle");i&&(i.textContent=this.config.subtitle);let s=this.shadow?.getElementById("homeBrandAvatar");if(s){let d=this.config.logoUrl||Re,p=Re;s.innerHTML=`<img src="${d}" onerror="this.onerror=null;this.src='${p}'" alt="Logo" style="width:100%;height:100%;object-fit:contain;border-radius:inherit;" />`}let n=this.shadow?.getElementById("homeGreetingTitle");if(n&&this.config.title){let d=this.config.title.replace(/^Welcome to\s+/i,"").replace(/Support!?/i,"").replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}️]+\s*$/u,"").trim();n.textContent=d?`Hello from ${d} \u{1F44B}`:"Hello there \u{1F44B}"}let a=this.shadow?.getElementById("homeGreetingSub");a&&this.config.subtitle&&(a.textContent=this.config.subtitle);let o=this.shadow?.querySelector("#navHelp span");o&&this.config.helpTabLabel&&(o.textContent=this.config.helpTabLabel);let l=this.shadow?.querySelector("#tabHelp .chatify-header-text h3");l&&this.config.helpTabLabel&&(l.textContent=this.config.helpTabLabel);let c=this.shadow?.querySelector("#cardHelpSearch .chatify-section-title");c&&this.config.helpTabLabel&&(c.textContent=this.config.helpTabLabel);let h=this.shadow?.querySelector("#homeSearchTrigger span");h&&this.config.helpTabLabel&&(h.textContent=`\u{1F50D} Search for ${this.config.helpTabLabel.toLowerCase()} articles...`);let u=this.shadow?.getElementById("navHelp"),f=this.shadow?.getElementById("cardHelpSearch");this.config.showHelpTab===!1?(u&&(u.style.display="none"),f&&(f.style.display="none")):(u&&(u.style.display="flex"),f&&(f.style.display=this.faqs.length>0?"block":"none"))}rgb(e){let t=(e||"").trim().replace("#","");return t.length===3&&(t=t.split("").map(i=>i+i).join("")),/^[0-9a-fA-F]{6}$/.test(t)||(t="2e5bff"),[parseInt(t.slice(0,2),16),parseInt(t.slice(2,4),16),parseInt(t.slice(4,6),16)]}luminance(e){let[t,i,s]=this.rgb(e).map(n=>{let a=n/255;return a<=.03928?a/12.92:Math.pow((a+.055)/1.055,2.4)});return .2126*t+.7152*i+.0722*s}shade(e,t){let[i,s,n]=this.rgb(e),a=t>0?255:0,o=Math.abs(t),l=c=>Math.round(c+(a-c)*o);return`rgb(${l(i)}, ${l(s)}, ${l(n)})`}alpha(e,t){let[i,s,n]=this.rgb(e);return`rgba(${i}, ${s}, ${n}, ${t})`}generateCSS(){let e=this.config.primaryColor||"#2e5bff",t=this.luminance(e)>.62?"#0b0b0f":"#ffffff",i=this.shade(e,-.34),s=this.config.position==="bottom-left";return`
      :host {
        --w-brand: ${e};
        --w-brand-deep: ${i};
        --w-on-brand: ${t};
        --w-brand-a08: ${this.alpha(e,.08)};
        --w-brand-a16: ${this.alpha(e,.16)};
        --w-brand-a28: ${this.alpha(e,.28)};

        --w-surface: #ffffff;
        --w-surface-2: #f7f7f5;
        --w-surface-3: #efefec;
        --w-canvas: #fbfbf9;

        --w-ink: #0b0b0f;
        --w-ink-2: #56575e;
        --w-ink-3: #8b8c93;

        --w-line: #e7e7e3;
        --w-line-2: #d6d6d1;

        --w-success: #0f9d76;

        --w-r-sm: 10px;
        --w-r-md: 14px;
        --w-r-lg: 18px;
        --w-r-xl: 22px;

        --w-shadow-sm: 0 1px 3px rgba(11,11,15,.07), 0 1px 2px rgba(11,11,15,.04);
        --w-shadow-md: 0 6px 18px rgba(11,11,15,.09), 0 2px 6px rgba(11,11,15,.05);
        --w-shadow-xl: 0 32px 68px rgba(11,11,15,.18), 0 12px 26px rgba(11,11,15,.10);

        --w-ease: cubic-bezier(.22,.61,.36,1);
        --w-ease-out: cubic-bezier(.16,1,.3,1);
        --w-spring: cubic-bezier(.34,1.4,.64,1);

        color-scheme: light;
      }

      /* Follows the host site's colour scheme so the messenger never looks
         pasted onto a dark page. */
      @media (prefers-color-scheme: dark) {
        :host {
          --w-surface: #101013;
          --w-surface-2: #17171b;
          --w-surface-3: #202026;
          --w-canvas: #0b0b0e;

          --w-ink: #f5f5f3;
          --w-ink-2: #a2a2aa;
          --w-ink-3: #6e6e78;

          --w-line: #232329;
          --w-line-2: #2f2f37;

          --w-success: #34d9a7;

          --w-shadow-sm: 0 1px 3px rgba(0,0,0,.5);
          --w-shadow-md: 0 6px 18px rgba(0,0,0,.55);
          --w-shadow-xl: 0 32px 68px rgba(0,0,0,.7), 0 12px 26px rgba(0,0,0,.5);

          color-scheme: dark;
        }
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
          "Helvetica Neue", Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
      }

      button { font: inherit; cursor: pointer; }

      ::-webkit-scrollbar { width: 8px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb {
        background: var(--w-line-2);
        border-radius: 999px;
        border: 2px solid transparent;
        background-clip: content-box;
      }

      /* \u2500\u2500 Launcher \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

      .chatify-launcher {
        position: fixed;
        ${s?"left: 20px;":"right: 20px;"}
        bottom: 20px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        border: none;
        background: var(--w-brand);
        color: var(--w-on-brand);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 24px var(--w-brand-a28), 0 2px 8px rgba(11,11,15,.16);
        z-index: 2147483000;
        transition: transform .28s var(--w-spring), box-shadow .2s var(--w-ease);
      }

      .chatify-launcher:hover {
        transform: scale(1.07) translateY(-1px);
        box-shadow: 0 16px 38px var(--w-brand-a28), 0 6px 14px rgba(11,11,15,.22);
      }

      .chatify-launcher:active { transform: scale(.95); }

      /* An expanding ring, drawn only while messages are waiting. A launcher
         that pulses permanently is just noise the visitor learns to ignore. */
      .chatify-launcher::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 50%;
        border: 2px solid var(--w-brand);
        opacity: 0;
        pointer-events: none;
      }

      .chatify-launcher.has-unread::after {
        animation: w-halo 2.4s var(--w-ease-out) infinite;
      }

      .chatify-launcher-icon {
        width: 36px;
        height: 36px;
        object-fit: contain;
        display: block;
        pointer-events: none;
        transition: transform .25s var(--w-ease), opacity .18s var(--w-ease);
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.22));
      }

      .chatify-launcher:hover .chatify-launcher-icon {
        transform: scale(1.1);
      }

      .chatify-launcher svg {
        width: 25px;
        height: 25px;
        fill: currentColor;
        transition: transform .25s var(--w-ease), opacity .18s var(--w-ease);
      }

      .chatify-badge {
        position: absolute;
        top: -2px;
        ${s?"left: -2px;":"right: -2px;"}
        min-width: 20px;
        height: 20px;
        padding: 0 5px;
        border-radius: 999px;
        background: #e11d48;
        color: #fff;
        font-size: 11px;
        font-weight: 700;
        display: none;
        align-items: center;
        justify-content: center;
        border: 2px solid var(--w-surface);
        animation: w-pop .28s var(--w-spring);
      }

      /* \u2500\u2500 Window \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

      .chatify-window {
        position: fixed;
        ${s?"left: 20px;":"right: 20px;"}
        bottom: 88px;
        width: 396px;
        max-width: calc(100vw - 40px);
        height: 640px;
        max-height: calc(100vh - 120px);
        background: var(--w-surface);
        border: 1px solid var(--w-line);
        border-radius: var(--w-r-xl);
        box-shadow: var(--w-shadow-xl);
        display: none;
        flex-direction: column;
        overflow: hidden;
        z-index: 2147483000;
        animation: w-window-in .34s var(--w-ease) both;
      }

      @media (max-width: 480px) {
        .chatify-window {
          left: 0; right: 0; bottom: 0;
          width: 100vw;
          max-width: 100vw;
          height: 100dvh;
          max-height: 100dvh;
          border-radius: 0;
          border: none;
        }
      }

      .chatify-tab-pane {
        flex: 1;
        min-height: 0;
        flex-direction: column;
        overflow: hidden;
        animation: w-fade .22s var(--w-ease);
      }

      /* \u2500\u2500 Home tab \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

      .chatify-home-hero {
        position: relative;
        isolation: isolate;
        overflow: hidden;
        padding: 24px 22px 56px;
        background: linear-gradient(150deg, var(--w-brand) 0%, var(--w-brand-deep) 100%);
        color: #ffffff;
        flex-shrink: 0;
      }

      /* Two offset colour pools that drift against each other. The movement is
         slow and low-contrast on purpose \u2014 it should read as depth, not as an
         animation demanding attention. */
      .chatify-home-hero::before {
        content: '';
        position: absolute;
        inset: -40%;
        z-index: -1;
        background:
          radial-gradient(38% 42% at 22% 26%, rgba(255, 255, 255, 0.30), transparent 62%),
          radial-gradient(34% 38% at 78% 12%, rgba(255, 255, 255, 0.18), transparent 60%),
          radial-gradient(44% 46% at 62% 88%, var(--w-brand-a28), transparent 64%);
        animation: w-aurora 22s var(--w-ease) infinite alternate;
      }

      /* A whisper of grain stops the gradient from banding on wide screens. */
      .chatify-home-hero::after {
        content: '';
        position: absolute;
        inset: 0;
        z-index: -1;
        opacity: 0.055;
        pointer-events: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E");
      }

      .chatify-brand-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 22px;
      }

      .chatify-home-avatar {
        width: 38px;
        height: 38px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.2);
        border: 1.5px solid rgba(255, 255, 255, 0.32);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 7px;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.16);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }

      .chatify-home-avatar img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .chatify-icon-btn {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 1px solid rgba(255, 255, 255, 0.22);
        background: rgba(255, 255, 255, 0.16);
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        transition: all .2s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .chatify-icon-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.06);
      }

      .chatify-home-title {
        font-size: 27px;
        font-weight: 700;
        letter-spacing: -0.032em;
        line-height: 1.18;
        color: #ffffff;
        text-wrap: balance;
        text-shadow: 0 1px 12px rgba(0, 0, 0, 0.14);
      }

      .chatify-home-sub {
        margin-top: 6px;
        font-size: 14px;
        line-height: 1.45;
        color: rgba(255, 255, 255, 0.9);
        font-weight: 400;
      }

      /* Each block rises a beat after the one above it. The whole sequence is
         under a third of a second, so it reads as the panel settling rather
         than as something the visitor has to wait for. */
      .chatify-home-content > * {
        animation: w-rise .34s var(--w-ease-out) both;
      }
      .chatify-home-content > *:nth-child(1) { animation-delay: .04s; }
      .chatify-home-content > *:nth-child(2) { animation-delay: .10s; }
      .chatify-home-content > *:nth-child(3) { animation-delay: .16s; }
      .chatify-home-content > *:nth-child(4) { animation-delay: .22s; }

      .chatify-home-content {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        margin-top: -30px;
        padding: 16px;
        background: var(--w-canvas);
        border-radius: 20px 20px 0 0;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .chatify-card {
        background: var(--w-surface);
        border: 1px solid rgba(0, 0, 0, 0.07);
        border-radius: 18px;
        padding: 18px;
        box-shadow: 0 4px 18px -2px rgba(15, 23, 42, 0.06), 0 10px 28px -4px rgba(15, 23, 42, 0.08);
      }

      .chatify-card-action {
        transition: box-shadow .24s var(--w-ease), transform .24s var(--w-ease);
      }

      .chatify-card-action:hover {
        box-shadow: 0 8px 28px -2px rgba(15, 23, 42, 0.10), 0 18px 42px -6px rgba(15, 23, 42, 0.14);
        transform: translateY(-2px);
        border-color: var(--w-brand-a28);
      }

      .chatify-card-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }

      .chatify-avatars-stack {
        display: flex;
        align-items: center;
      }

      .chatify-mini-avatar {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        color: #ffffff;
        font-size: 11px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid var(--w-surface);
        margin-left: -8px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      }

      .chatify-mini-avatar:first-child {
        margin-left: 0;
      }

      .chatify-status-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        height: 24px;
        padding: 0 10px;
        border-radius: 999px;
        background: var(--w-surface-2);
        border: 1px solid var(--w-line);
        font-size: 11.5px;
        font-weight: 600;
        color: var(--w-ink-2);
        white-space: nowrap;
      }

      .chatify-pulse-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        display: inline-block;
      }

      .chatify-pulse-dot.online {
        background: #10b981;
        box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.25);
      }

      .chatify-pulse-dot.away {
        background: #f59e0b;
        box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.25);
      }

      .chatify-card-title {
        font-size: 17px;
        font-weight: 700;
        color: var(--w-ink);
        letter-spacing: -0.015em;
        margin-bottom: 4px;
      }

      .chatify-card-sub {
        font-size: 13px;
        color: var(--w-ink-2);
        line-height: 1.45;
        margin-bottom: 16px;
      }

      .chatify-primary-cta {
        width: 100%;
        height: 44px;
        border-radius: 12px;
        background: var(--w-brand);
        color: #ffffff;
        font-weight: 600;
        font-size: 14px;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        box-shadow: 0 4px 14px var(--w-brand-a28);
        transition: all .2s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .chatify-primary-cta:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px var(--w-brand-a28);
        filter: brightness(1.04);
      }

      .chatify-primary-cta:active {
        transform: translateY(0);
        filter: brightness(0.98);
      }

      .chatify-home-unread-pill {
        display: none;
        align-items: center;
        gap: 5px;
        height: 24px;
        padding: 0 10px;
        border-radius: 999px;
        background: #ffe4e6;
        color: #e11d48;
        border: 1px solid #fecdd3;
        font-size: 11px;
        font-weight: 700;
        white-space: nowrap;
        animation: w-pop .28s var(--w-spring);
      }

      .chatify-cta-badge {
        min-width: 19px;
        height: 19px;
        line-height: 19px;
        padding: 0 6px;
        border-radius: 999px;
        background: #ffffff;
        color: var(--w-brand);
        font-size: 11.5px;
        font-weight: 800;
        display: none;
        align-items: center;
        justify-content: center;
        margin-left: 4px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.15);
      }

      .chatify-open-conv-card {
        cursor: pointer;
        transition: transform .2s var(--w-spring), box-shadow .2s var(--w-ease);
      }

      .chatify-open-conv-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      }

      .chatify-conv-status-pill {
        background: #ecfdf5 !important;
        border-color: #a7f3d0 !important;
        color: #047857 !important;
      }

      .chatify-conv-time {
        font-size: 11.5px;
        color: var(--w-ink-3);
        font-weight: 500;
        margin-left: auto;
      }

      .chatify-open-conv-preview {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 10px 12px;
        margin: 10px 0 14px;
        background: var(--w-surface-2);
        border: 1px solid var(--w-line);
        border-radius: 12px;
        text-align: left;
      }

      .chatify-open-conv-avatar-col {
        flex-shrink: 0;
      }

      .chatify-open-conv-text-col {
        flex: 1;
        min-width: 0;
      }

      .chatify-open-conv-sender-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        margin-bottom: 3px;
      }

      .chatify-open-conv-sender {
        font-size: 13px;
        font-weight: 700;
        color: var(--w-ink);
      }

      .chatify-open-conv-snippet {
        font-size: 12.5px;
        color: var(--w-ink-2);
        line-height: 1.45;
        margin: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .chatify-new-conv-link {
        width: 100%;
        background: transparent;
        border: none;
        padding: 8px 0 0;
        margin-top: 6px;
        font-size: 12.5px;
        font-weight: 600;
        color: var(--w-brand);
        cursor: pointer;
        text-align: center;
        transition: opacity .15s;
        display: block;
      }

      .chatify-new-conv-link:hover {
        opacity: 0.8;
        text-decoration: underline;
      }

      .chatify-chips-section {
        margin-top: 4px;
      }

      .chatify-section-title {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--w-ink-3);
        margin-bottom: 8px;
        padding-left: 2px;
      }

      .chatify-chips-grid {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .chatify-chip {
        width: 100%;
        padding: 11px 14px;
        border-radius: 12px;
        background: var(--w-surface);
        border: 1px solid var(--w-line);
        color: var(--w-ink);
        font-size: 13px;
        font-weight: 500;
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
        transition: all .18s var(--w-ease);
      }

      .chatify-chip:hover {
        background: var(--w-brand-a08);
        border-color: var(--w-brand-a28);
        transform: translateX(3px);
        box-shadow: 0 3px 12px rgba(0, 0, 0, 0.06);
      }

      .chatify-chip-arrow {
        color: var(--w-ink-3);
        font-size: 16px;
        font-weight: 600;
        transition: transform .18s var(--w-ease), color .18s var(--w-ease);
      }

      .chatify-chip:hover .chatify-chip-arrow {
        color: var(--w-brand);
        transform: translateX(3px);
      }

      .chatify-search-trigger {
        background: var(--w-surface-2);
        border: 1px solid var(--w-line);
        border-radius: 12px;
        padding: 11px 14px;
        color: var(--w-ink-3);
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        transition: all .18s var(--w-ease);
      }

      .chatify-search-trigger:hover {
        background: var(--w-surface);
        border-color: var(--w-brand-a28);
        color: var(--w-ink);
      }

      .chatify-search-kbd {
        margin-left: auto;
        font-size: 10px;
        font-weight: 600;
        padding: 2px 7px;
        border-radius: 6px;
        background: var(--w-surface);
        border: 1px solid var(--w-line);
        color: var(--w-ink-3);
      }

      /* \u2500\u2500 Thread header \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

      .chatify-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 13px 16px;
        border-bottom: 1px solid var(--w-line);
        background: var(--w-surface);
        flex-shrink: 0;
      }

      .chatify-header-info { display: flex; align-items: center; gap: 10px; min-width: 0; }

      .chatify-back-btn,
      .chatify-close-btn {
        width: 30px;
        height: 30px;
        border-radius: var(--w-r-sm);
        border: none;
        background: transparent;
        color: var(--w-ink-3);
        font-size: 15px;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: background .16s var(--w-ease), color .16s var(--w-ease);
      }

      .chatify-back-btn:hover,
      .chatify-close-btn:hover { background: var(--w-surface-3); color: var(--w-ink); }

      .chatify-avatar {
        position: relative;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: var(--w-brand);
        color: var(--w-on-brand);
        font-size: 14px;
        font-weight: 700;
        text-transform: uppercase;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .chatify-online-dot {
        position: absolute;
        right: -1px;
        bottom: -1px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--w-success);
        border: 2px solid var(--w-surface);
      }

      .chatify-header-text { min-width: 0; }

      .chatify-header-text h3 {
        font-size: 14px;
        font-weight: 600;
        letter-spacing: -.012em;
        color: var(--w-ink);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .chatify-header-text p {
        font-size: 12px;
        color: var(--w-ink-3);
        margin-top: 1px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* \u2500\u2500 Message body \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

      .chatify-body {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding: 16px;
        background: var(--w-canvas);
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .chatify-prechat {
        margin: auto 0;
        background: var(--w-surface);
        border: 1px solid var(--w-line);
        border-radius: var(--w-r-md);
        padding: 20px;
        box-shadow: var(--w-shadow-sm);
        animation: w-rise .35s var(--w-ease) both;
      }

      .chatify-prechat h4 {
        font-size: 16px;
        font-weight: 600;
        letter-spacing: -.014em;
        color: var(--w-ink);
      }

      .chatify-prechat p {
        margin: 5px 0 18px;
        font-size: 13px;
        line-height: 1.55;
        color: var(--w-ink-2);
      }

      .chatify-form-group { margin-bottom: 12px; }

      .chatify-form-group label {
        display: block;
        font-size: 12px;
        font-weight: 600;
        color: var(--w-ink-2);
        margin-bottom: 6px;
      }

      .chatify-input {
        width: 100%;
        height: 42px;
        padding: 0 12px;
        border-radius: var(--w-r-sm);
        border: 1px solid var(--w-line-2);
        background: var(--w-surface);
        color: var(--w-ink);
        font-size: 13.5px;
        outline: none;
        transition: border-color .16s var(--w-ease), box-shadow .16s var(--w-ease);
      }

      .chatify-input::placeholder { color: var(--w-ink-3); }

      .chatify-input:focus {
        border-color: var(--w-brand);
        box-shadow: 0 0 0 3px var(--w-brand-a16);
      }

      .chatify-start-btn {
        width: 100%;
        height: 44px;
        margin-top: 6px;
        border: none;
        border-radius: var(--w-r-sm);
        background: var(--w-brand);
        color: var(--w-on-brand);
        font-size: 14px;
        font-weight: 600;
        box-shadow: var(--w-shadow-sm);
        transition: filter .16s var(--w-ease), transform .12s var(--w-ease);
      }

      .chatify-start-btn:hover { filter: brightness(1.08); }
      .chatify-start-btn:active { transform: scale(.985); }

      .chatify-optional-tag {
        font-size: 11px;
        font-weight: 400;
        color: var(--w-ink-3);
        margin-left: 4px;
      }

      .chatify-skip-btn {
        width: 100%;
        height: 38px;
        margin-top: 8px;
        background: transparent;
        border: 1px solid var(--w-line-2);
        border-radius: var(--w-r-sm);
        color: var(--w-ink-2);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transition: background .16s var(--w-ease), color .16s var(--w-ease), border-color .16s var(--w-ease);
      }

      .chatify-skip-btn:hover {
        background: var(--w-surface-2);
        color: var(--w-brand);
        border-color: var(--w-brand);
      }

      .chatify-message-row {
        display: flex;
        animation: w-bubble-in .3s var(--w-ease-out) both;
      }

      .chatify-msg-visitor,
      .chatify-msg-agent {
        max-width: 82%;
        padding: 10px 13px;
        font-size: 13.5px;
        line-height: 1.55;
      }

      /* pre-wrap belongs on the text node only \u2014 on the bubble it would also
         render the markup's own indentation as blank lines. */
      .chatify-msg-quote {
        display: flex;
        flex-direction: column;
        gap: 1px;
        margin-bottom: 6px;
        padding: 5px 8px;
        border-left: 2px solid currentColor;
        border-radius: 6px;
        background: rgba(127, 127, 127, 0.14);
        opacity: 0.85;
        font-size: 12px;
        line-height: 1.35;
      }
      .chatify-msg-quote-who {
        font-weight: 600;
        font-size: 11px;
        opacity: 0.9;
      }
      .chatify-msg-quote-text {
        /* Two lines is enough to identify the message without burying the
           reply underneath the thing it is replying to. */
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        opacity: 0.85;
      }
      .chatify-msg-text {
        white-space: pre-wrap;
        word-wrap: break-word;
        overflow-wrap: anywhere;
      }

      .chatify-msg-visitor {
        margin-left: auto;
        background: linear-gradient(145deg, var(--w-brand) 0%, var(--w-brand-deep) 130%);
        color: var(--w-on-brand);
        border-radius: 18px 18px 5px 18px;
        box-shadow: 0 2px 10px var(--w-brand-a28), 0 1px 2px rgba(11, 11, 15, 0.10);
      }

      .chatify-msg-agent {
        margin-right: auto;
        background: var(--w-surface);
        color: var(--w-ink);
        border-radius: 18px 18px 18px 5px;
        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
        border: 1px solid var(--w-line);
      }

      .chatify-msg-time {
        margin-top: 4px;
        font-size: 10.5px;
        color: var(--w-ink-3);
        text-align: right;
      }

      .chatify-msg-visitor .chatify-msg-time {
        color: inherit;
        opacity: .78;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 4px;
      }

      .chatify-tick {
        display: inline-flex;
        align-items: center;
        color: currentColor;
        opacity: .85;
      }

      /* The single place colour carries meaning instead of decoration. */
      .chatify-tick-read {
        color: #53bdeb;
        opacity: 1;
      }

      /* \u2500\u2500 CSAT \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

      .chatify-csat-box {
        margin-top: 6px;
        background: var(--w-surface);
        border: 1px solid var(--w-line);
        border-radius: var(--w-r-md);
        padding: 16px;
        text-align: center;
        box-shadow: var(--w-shadow-sm);
        animation: w-rise .3s var(--w-ease) both;
      }

      .chatify-csat-title {
        font-size: 14px;
        font-weight: 600;
        letter-spacing: -.012em;
        color: var(--w-ink);
      }

      .chatify-csat-sub {
        margin-top: 3px;
        font-size: 12px;
        color: var(--w-ink-3);
      }

      .chatify-csat-emojis {
        margin-top: 12px;
        display: flex;
        justify-content: center;
        gap: 6px;
      }

      .chatify-csat-btn {
        width: 42px;
        height: 42px;
        border-radius: var(--w-r-sm);
        border: 1px solid var(--w-line);
        background: var(--w-surface-2);
        font-size: 20px;
        line-height: 1;
        transition: transform .18s var(--w-spring), border-color .16s var(--w-ease),
          background .16s var(--w-ease);
      }

      .chatify-csat-btn:hover {
        transform: scale(1.16) translateY(-2px);
        border-color: var(--w-brand);
        background: var(--w-brand-a08);
      }

      /* \u2500\u2500 Composer \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

      .chatify-footer {
        display: flex;
        align-items: flex-end;
        gap: 8px;
        padding: 12px 14px;
        border-top: 1px solid var(--w-line);
        background: var(--w-surface);
        flex-shrink: 0;
      }

      .chatify-textarea {
        flex: 1;
        min-height: 42px;
        max-height: 120px;
        padding: 11px 13px;
        border-radius: var(--w-r-md);
        border: 1px solid var(--w-line-2);
        background: var(--w-surface-2);
        color: var(--w-ink);
        font-size: 13.5px;
        line-height: 1.45;
        resize: none;
        outline: none;
        transition: border-color .16s var(--w-ease), box-shadow .16s var(--w-ease);
      }

      .chatify-textarea::placeholder { color: var(--w-ink-3); }

      .chatify-textarea:focus {
        border-color: var(--w-brand);
        box-shadow: 0 0 0 3px var(--w-brand-a16);
      }

      .chatify-send-btn {
        width: 42px;
        height: 42px;
        flex-shrink: 0;
        border: none;
        border-radius: var(--w-r-md);
        background: var(--w-brand);
        color: var(--w-on-brand);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: var(--w-shadow-sm);
        transition: filter .16s var(--w-ease), transform .12s var(--w-ease);
      }

      .chatify-send-btn:hover {
        filter: brightness(1.08);
        transform: translateY(-1px) scale(1.04);
        box-shadow: 0 6px 16px var(--w-brand-a28);
      }
      .chatify-send-btn:active { transform: scale(.94); }

      .chatify-send-btn svg { width: 19px; height: 19px; fill: currentColor; }

      .chatify-footer-actions {
        display: flex;
        align-items: center;
        gap: 3px;
        padding-bottom: 5px;
      }

      .chatify-action-btn {
        width: 34px;
        height: 34px;
        border: none;
        border-radius: var(--w-r-sm);
        background: transparent;
        color: var(--w-ink-2);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background .15s var(--w-ease), color .15s var(--w-ease), transform .12s var(--w-ease);
      }

      .chatify-action-btn:hover {
        background: var(--w-surface-2);
        color: var(--w-brand);
        transform: scale(1.08);
      }

      .chatify-action-btn svg {
        width: 19px;
        height: 19px;
      }

      .chatify-attachment-preview {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 14px;
        background: var(--w-surface-2);
        border-top: 1px solid var(--w-line);
        flex-shrink: 0;
        animation: chatifyFadeIn .15s var(--w-ease);
      }

      .chatify-preview-thumb {
        width: 38px;
        height: 38px;
        border-radius: 8px;
        object-fit: cover;
        border: 1px solid var(--w-line);
      }

      .chatify-preview-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
      }

      .chatify-preview-name {
        font-size: 12px;
        font-weight: 600;
        color: var(--w-ink);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .chatify-preview-size {
        font-size: 10.5px;
        color: var(--w-ink-3);
      }

      .chatify-preview-remove {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: none;
        background: var(--w-line);
        color: var(--w-ink-2);
        font-size: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background .15s;
      }

      .chatify-preview-remove:hover {
        background: var(--w-line-2);
        color: var(--w-ink);
      }

      .chatify-emoji-popover {
        position: absolute;
        bottom: 66px;
        left: 14px;
        z-index: 25;
        background: var(--w-surface);
        border: 1px solid var(--w-line);
        border-radius: 12px;
        padding: 8px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.14);
        max-width: 260px;
        animation: chatifyFadeIn .15s var(--w-ease);
      }

      .chatify-emoji-grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 3px;
      }

      .chatify-emoji-btn {
        font-size: 18px;
        padding: 6px 4px;
        border: none;
        background: transparent;
        border-radius: 6px;
        cursor: pointer;
        transition: transform .12s, background .15s;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .chatify-emoji-btn:hover {
        background: var(--w-surface-2);
        transform: scale(1.22);
      }

      .chatify-msg-attachment {
        margin-bottom: 6px;
      }

      .chatify-msg-img {
        max-width: 100%;
        max-height: 190px;
        border-radius: 10px;
        object-fit: cover;
        cursor: pointer;
        display: block;
        border: 1px solid rgba(0,0,0,.08);
        transition: opacity .15s, transform .15s;
      }

      .chatify-msg-img:hover {
        opacity: .94;
        transform: scale(1.01);
      }

      .chatify-msg-doc {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        background: rgba(0,0,0,0.06);
        border-radius: 8px;
        font-size: 12px;
        text-decoration: underline;
        color: inherit;
      }

      .chatify-lightbox {
        position: absolute;
        inset: 0;
        z-index: 9999;
        background: rgba(0, 0, 0, 0.88);
        backdrop-filter: blur(4px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 18px;
        animation: chatifyFadeIn .15s var(--w-ease);
      }

      .chatify-lightbox-img {
        max-width: 90%;
        max-height: 80%;
        border-radius: 12px;
        object-fit: contain;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      }

      .chatify-lightbox-close {
        position: absolute;
        top: 14px;
        right: 14px;
        background: rgba(255,255,255,0.18);
        border: none;
        color: #fff;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background .15s;
      }

      .chatify-lightbox-close:hover {
        background: rgba(255,255,255,0.35);
      }

      .chatify-lightbox-link {
        margin-top: 12px;
        color: #93c5fd;
        font-size: 12px;
        text-decoration: underline;
      }

      @keyframes chatifySpin {
        to { transform: rotate(360deg); }
      }

      /* \u2500\u2500 Help tab \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

      .chatify-help-body {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding: 14px;
        background: var(--w-canvas);
      }

      .chatify-help-search-bar { margin-bottom: 12px; }

      .chatify-help-search-bar input {
        width: 100%;
        height: 42px;
        padding: 0 13px;
        border-radius: var(--w-r-sm);
        border: 1px solid var(--w-line-2);
        background: var(--w-surface);
        color: var(--w-ink);
        font-size: 13.5px;
        outline: none;
        transition: border-color .16s var(--w-ease), box-shadow .16s var(--w-ease);
      }

      .chatify-help-search-bar input::placeholder { color: var(--w-ink-3); }

      .chatify-help-search-bar input:focus {
        border-color: var(--w-brand);
        box-shadow: 0 0 0 3px var(--w-brand-a16);
      }

      .chatify-section-list {
        display: flex;
        flex-direction: column;
        gap: 9px;
      }

      .chatify-section-card {
        display: flex;
        align-items: center;
        gap: 12px;
        background: var(--w-surface);
        border: 1px solid var(--w-line);
        border-radius: var(--w-r-md);
        padding: 13px 14px;
        cursor: pointer;
        transition: border-color .16s var(--w-ease), box-shadow .16s var(--w-ease), transform .16s var(--w-ease);
      }

      .chatify-section-card:hover {
        border-color: var(--w-line-2);
        box-shadow: var(--w-shadow-sm);
        transform: translateY(-1px);
      }

      .chatify-section-card-icon {
        width: 36px;
        height: 36px;
        border-radius: 9px;
        background: var(--w-surface-2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        flex-shrink: 0;
      }

      .chatify-section-card-info {
        flex: 1;
        min-width: 0;
      }

      .chatify-section-card-title {
        margin: 0;
        font-size: 13.5px;
        font-weight: 600;
        color: var(--w-ink);
        line-height: 1.35;
      }

      .chatify-section-card-desc {
        margin: 3px 0 0;
        font-size: 12px;
        color: var(--w-ink-3);
        line-height: 1.4;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .chatify-section-card-arrow {
        color: var(--w-ink-3);
        font-size: 18px;
        line-height: 1;
        flex-shrink: 0;
        transition: transform .18s var(--w-ease), color .18s var(--w-ease);
      }

      .chatify-section-card:hover .chatify-section-card-arrow {
        color: var(--w-brand);
        transform: translateX(2px);
      }

      .chatify-section-back-btn {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        background: none;
        border: none;
        padding: 0 0 12px 0;
        color: var(--w-brand);
        font-size: 12.5px;
        font-weight: 600;
        cursor: pointer;
        transition: opacity .16s var(--w-ease);
      }

      .chatify-section-back-btn:hover {
        opacity: 0.8;
      }

      .chatify-section-view-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 14px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--w-line);
      }

      .chatify-section-view-icon {
        font-size: 24px;
        flex-shrink: 0;
      }

      .chatify-section-view-text h3 {
        margin: 0;
        font-size: 15px;
        font-weight: 700;
        color: var(--w-ink);
      }

      .chatify-section-view-text p {
        margin: 2px 0 0;
        font-size: 12px;
        color: var(--w-ink-3);
      }

      .chatify-faq-list { display: flex; flex-direction: column; gap: 8px; }

      .chatify-faq-item {
        background: var(--w-surface);
        border: 1px solid var(--w-line);
        border-radius: var(--w-r-md);
        padding: 13px 14px;
        cursor: pointer;
        transition: border-color .16s var(--w-ease), box-shadow .16s var(--w-ease);
      }

      .chatify-faq-item:hover { border-color: var(--w-line-2); box-shadow: var(--w-shadow-sm); }
      .chatify-faq-item.open { border-color: var(--w-brand); }

      .chatify-faq-q {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        font-size: 13.5px;
        font-weight: 600;
        line-height: 1.4;
        color: var(--w-ink);
      }

      .chatify-faq-arrow {
        color: var(--w-ink-3);
        font-size: 17px;
        line-height: 1;
        flex-shrink: 0;
        transition: transform .22s var(--w-ease), color .16s var(--w-ease);
      }

      .chatify-faq-item.open .chatify-faq-arrow {
        transform: rotate(90deg);
        color: var(--w-brand);
      }

      .chatify-faq-a {
        max-height: 0;
        overflow: hidden;
        opacity: 0;
        font-size: 13px;
        line-height: 1.6;
        color: var(--w-ink-2);
        transition: max-height .28s var(--w-ease), opacity .22s var(--w-ease),
          margin-top .28s var(--w-ease);
      }

      .chatify-faq-item.open .chatify-faq-a {
        max-height: 480px;
        overflow-y: auto;
        opacity: 1;
        margin-top: 9px;
        padding-right: 4px;
      }

      .chatify-faq-markdown {
        font-size: 12.5px;
        line-height: 1.6;
        color: var(--w-ink-2);
      }
      .chatify-faq-markdown p { margin: 0 0 8px 0; }
      .chatify-faq-markdown p:last-child { margin-bottom: 0; }
      .chatify-faq-markdown pre {
        background: var(--w-surface-2, #f1f5f9);
        border: 1px solid var(--w-line);
        border-radius: 6px;
        padding: 8px 10px;
        overflow-x: auto;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 11.5px;
        margin: 8px 0;
      }
      .chatify-faq-markdown code {
        background: var(--w-surface-2, #f1f5f9);
        border-radius: 4px;
        padding: 2px 4px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 11.5px;
      }
      .chatify-faq-markdown a {
        color: var(--w-brand);
        text-decoration: underline;
      }
      .chatify-faq-markdown ul, .chatify-faq-markdown ol {
        margin: 6px 0 8px 18px;
        padding: 0;
      }
      .chatify-faq-markdown li { margin-bottom: 3px; }
      .chatify-faq-markdown blockquote {
        border-left: 3px solid var(--w-brand);
        margin: 8px 0;
        padding-left: 8px;
        color: var(--w-ink-3);
        font-style: italic;
      }
      .chatify-article-ext-link {
        font-size: 11.5px;
        color: var(--w-brand);
        text-decoration: none;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        transition: opacity .15s;
      }
      .chatify-article-ext-link:hover {
        opacity: 0.8;
        text-decoration: underline;
      }

      /* \u2500\u2500 Bottom navigation \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

      .chatify-bottom-nav {
        display: flex;
        border-top: 1px solid rgba(0, 0, 0, 0.07);
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        padding: 6px 10px calc(8px + env(safe-area-inset-bottom, 0px));
        flex-shrink: 0;
        height: 64px;
        box-sizing: border-box;
      }

      .chatify-nav-item {
        position: relative;
        flex: 1;
        border: none;
        background: transparent;
        color: #64748b;
        padding: 6px 0 4px;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        font-size: 11.5px;
        font-weight: 500;
        cursor: pointer;
        transition: all .18s var(--w-ease);
      }

      .chatify-nav-item svg {
        transition: transform .2s var(--w-spring), color .18s var(--w-ease);
      }

      .chatify-nav-item:hover {
        color: #1e293b;
        background: rgba(0, 0, 0, 0.03);
      }

      .chatify-nav-item.active {
        color: var(--w-brand);
        font-weight: 700;
      }

      .chatify-nav-item.active svg {
        transform: translateY(-1px) scale(1.08);
      }

      .chatify-nav-item.active::after {
        content: '';
        position: absolute;
        bottom: 2px;
        width: 16px;
        height: 3px;
        border-radius: 999px;
        background: var(--w-brand);
      }

      .nav-msg-icon-wrap { position: relative; display: flex; }

      .chatify-nav-badge {
        position: absolute;
        top: -3px;
        right: -6px;
        min-width: 15px;
        height: 15px;
        padding: 0 4px;
        border-radius: 999px;
        background: #e11d48;
        color: #fff;
        font-size: 9.5px;
        font-weight: 700;
        display: none;
        align-items: center;
        justify-content: center;
        border: 2px solid var(--w-surface);
      }

      .chatify-nav-label-wrap {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
      }

      .chatify-nav-inline-badge {
        min-width: 17px;
        height: 17px;
        line-height: 17px;
        padding: 0 5px;
        border-radius: 999px;
        background: #e11d48;
        color: #fff;
        font-size: 10px;
        font-weight: 700;
        display: none;
        align-items: center;
        justify-content: center;
        box-shadow: 0 1px 3px rgba(225, 29, 72, 0.35);
        animation: w-pop .28s var(--w-spring);
      }

      /* \u2500\u2500 Motion \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

      @keyframes w-bubble-in {
        from { opacity: 0; transform: translateY(8px) scale(.97); }
        to   { opacity: 1; transform: none; }
      }

      @keyframes w-aurora {
        from { transform: translate3d(-4%, -3%, 0) scale(1); }
        to   { transform: translate3d(5%, 4%, 0) scale(1.12); }
      }

      @keyframes w-halo {
        0%        { transform: scale(1);   opacity: .5; }
        70%, 100% { transform: scale(1.7); opacity: 0; }
      }

      @keyframes w-window-in {
        from { opacity: 0; transform: translateY(14px) scale(.985); }
        to   { opacity: 1; transform: none; }
      }

      @keyframes w-rise {
        from { opacity: 0; transform: translateY(7px); }
        to   { opacity: 1; transform: none; }
      }

      @keyframes w-fade { from { opacity: 0; } to { opacity: 1; } }

      @keyframes w-pop {
        from { opacity: 0; transform: scale(.6); }
        to   { opacity: 1; transform: none; }
      }

      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: .01ms !important;
          transition-duration: .01ms !important;
        }
      }
    `}async handleStartPreChat(e=!1){let t=this.shadow?.getElementById("chatifyInputName"),i=this.shadow?.getElementById("chatifyInputEmail");this.visitorName=e?"":t?.value.trim()||"",this.visitorEmail=e?"":i?.value.trim()||"";let s=this.config.workspaceId?`_${this.config.workspaceId.slice(0,8)}`:"";this.visitorName&&localStorage.setItem(`chatify_visitor_name${s}`,this.visitorName),this.visitorEmail&&localStorage.setItem(`chatify_visitor_email${s}`,this.visitorEmail),await this.supabase.rpc("fn_upsert_visitor",{p_id:this.visitorId,p_name:this.visitorName||null,p_email:this.visitorEmail||null,p_current_url:window.location.href,p_user_agent:navigator.userAgent,p_workspace_id:this.config.workspaceId||null}),this.isPreChatCompleted=!0,this.shadow?.getElementById("chatifyPreChat")?.remove();let n=this.shadow?.getElementById("chatifyFooter");n&&(n.style.display="flex");let a=await this.ensureConversation(),{data:o}=await this.supabase.from("messages").select("id").eq("conversation_id",a).limit(1);if(!o||o.length===0){let l=(this.config.businessName||this.config.title||"our company").replace(/^Welcome to\s+/i,"").replace(/\s*Support\s*$/i,"").replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}️]+\s*$/u,"").trim()||this.config.businessName||this.config.title||"our company",c=this.config.welcomeText||`welcome to the ${l}`,{data:h}=await this.supabase.from("messages").insert({conversation_id:a,sender_type:"agent",content:c,is_internal:!1}).select().single();h&&this.messages.push(h)}this.renderMessages()}async handleSendMessage(){let e=this.shadow?.getElementById("chatifyTextarea"),t=this.shadow?.getElementById("chatifySendBtn");if(!e)return;let i=e.value.trim();if(!i&&!this.pendingAttachment)return;let s=null;if(this.pendingAttachment){t&&(t.disabled=!0,t.innerHTML='<span style="width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;display:inline-block;animation:chatifySpin 0.8s linear infinite;"></span>');try{let n=new FormData;n.append("file",this.pendingAttachment.file);let a=this.config.apiUrl||"",o=await fetch(`${a}/api/upload`,{method:"POST",body:n});if(!o.ok){let c=await o.json().catch(()=>({}));throw new Error(c.error||"Failed to upload image to Cloudinary")}s=(await o.json()).url}catch(n){alert(`Image upload error: ${n.message}`),t&&(t.disabled=!1,t.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>');return}finally{t&&(t.disabled=!1,t.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>')}}e.value="",this.clearPendingAttachment(),await this.sendMessage(i,s||void 0)}renderMessages(){let e=this.shadow?.getElementById("chatifyBody");if(!(!e||!this.isPreChatCompleted)){if(e.innerHTML="",this.messages.length===0){e.innerHTML=`
        <div style="text-align:center; margin:auto 0; padding:0 18px;">
          <p style="color:var(--w-ink); font-size:15px; font-weight:600; letter-spacing:-.012em; margin-bottom:5px;">How can we help?</p>
          <p style="color:var(--w-ink-2); font-size:13px; line-height:1.55;">Send a message below and someone from our team will pick it up.</p>
        </div>
      `,this.renderRecentConversation();return}if(this.messages.forEach(t=>{if(t.is_internal)return;let i=t.sender_type==="visitor",s=new Date(t.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),n=document.createElement("div");n.className="chatify-message-row";let a=document.createElement("div");a.className=i?"chatify-msg-visitor":"chatify-msg-agent";let o=i?this.renderTicks(t):"",l=t.reply_to_message_id?this.messages.find(p=>p.id===t.reply_to_message_id):null,c=l?`<div class="chatify-msg-quote"><span class="chatify-msg-quote-who">${l.sender_type==="visitor"?"You":"Support"}</span><span class="chatify-msg-quote-text">${this.escapeHTML(l.content.length>120?`${l.content.slice(0,120)}\u2026`:l.content)}</span></div>`:"",h="";t.attachment_url&&(this.isImageAttachment(t.attachment_url)?h=`<div class="chatify-msg-attachment"><img src="${this.escapeHTML(t.attachment_url)}" alt="Attachment" class="chatify-msg-img" /></div>`:h=`<div class="chatify-msg-attachment"><a href="${this.escapeHTML(t.attachment_url)}" target="_blank" rel="noopener noreferrer" class="chatify-msg-doc">\u{1F4C4} <span>View Document</span></a></div>`);let f=!!t.metadata?.is_edited?'<span style="font-size:10px;font-style:italic;opacity:0.75;margin-left:4px;">(edited)</span>':"";a.innerHTML=c+h+(t.content?`<div class="chatify-msg-text">${this.escapeHTML(t.content)}</div>`:"")+`<div class="chatify-msg-time">${s}${f}${o}</div>`;let d=a.querySelector(".chatify-msg-img");d&&t.attachment_url&&d.addEventListener("click",()=>{this.openLightbox(t.attachment_url)}),n.appendChild(a),e.appendChild(n)}),this.conversationStatus==="closed"&&!this.csatRated){let t=document.createElement("div");t.className="chatify-csat-box",t.innerHTML=`
        <div class="chatify-csat-title">How was your conversation?</div>
        <div class="chatify-csat-sub">Please rate the support you received today:</div>
        <div class="chatify-csat-emojis">
          <button class="chatify-csat-btn" data-val="1" title="Terrible">\u{1F621}</button>
          <button class="chatify-csat-btn" data-val="2" title="Bad">\u{1F641}</button>
          <button class="chatify-csat-btn" data-val="3" title="Okay">\u{1F610}</button>
          <button class="chatify-csat-btn" data-val="4" title="Good">\u{1F642}</button>
          <button class="chatify-csat-btn" data-val="5" title="Amazing!">\u{1F929}</button>
        </div>
      `,t.querySelectorAll(".chatify-csat-btn").forEach(i=>{i.addEventListener("click",s=>{let n=parseInt(s.currentTarget.getAttribute("data-val")||"5",10);this.submitCSAT(n)})}),e.appendChild(t)}else if(this.csatRated){let t=document.createElement("div");t.style.cssText="text-align:center; padding:12px; font-size:12.5px; color:var(--w-success); font-weight:600;",t.textContent="\u2713 Thank you for rating our support!",e.appendChild(t)}e.scrollTop=e.scrollHeight,this.renderRecentConversation()}}renderTicks(e){let t='<path d="M1 5.2 3.4 7.6 9 2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',i='<path d="M1 5.2 3.4 7.6 9 2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 5.2 7.9 7.6 13.5 2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>';return e.pending?'<span class="chatify-tick" title="Sending"><svg viewBox="0 0 14 10" width="15" height="11"><circle cx="5" cy="5" r="3.6" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M5 3v2.2l1.5.9" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></span>':e.read_at?'<span class="chatify-tick chatify-tick-read" title="Read"><svg viewBox="0 0 14 10" width="15" height="11">'+i+"</svg></span>":e.delivered_at?'<span class="chatify-tick" title="Delivered"><svg viewBox="0 0 14 10" width="15" height="11">'+i+"</svg></span>":'<span class="chatify-tick" title="Sent"><svg viewBox="0 0 14 10" width="15" height="11">'+t+"</svg></span>"}escapeHTML(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}toggleWindow(){this.isOpen=!this.isOpen;let e=this.config.workspaceId?`_${this.config.workspaceId.slice(0,8)}`:"";try{sessionStorage.setItem(`chatify_widget_open${e}`,this.isOpen?"1":"0")}catch{}let t=this.shadow?.getElementById("chatifyWindow"),i=this.shadow?.getElementById("chatifyIconOpen"),s=this.shadow?.getElementById("chatifyIconClose");t&&i&&s&&(this.isOpen?(t.style.display="flex",i.style.display="none",s.style.display="block",this.activeTab==="messages"?(this.unreadCount=0,this.updateUnreadBadge(),this.markMessagesAsRead(),this.scrollToBottom(!1),setTimeout(()=>{this.shadow?.getElementById("chatifyTextarea")?.focus()},100)):this.updateUnreadBadge()):(t.style.display="none",i.style.display="block",s.style.display="none",this.updateUnreadBadge()))}updateUnreadBadge(){let e=this.shadow?.getElementById("chatifyBadge"),t=this.shadow?.getElementById("navMsgBadge"),i=this.shadow?.getElementById("navMsgInlineBadge"),s=this.shadow?.getElementById("homeCardUnreadPill"),n=this.shadow?.getElementById("homeCardCtaBadge"),a=this.shadow?.getElementById("homeCardTitle");if(this.shadow?.getElementById("chatifyLauncherBtn")?.classList.toggle("has-unread",this.unreadCount>0),this.unreadCount>0){let l=this.unreadCount>9?"9+":this.unreadCount.toString();e&&(e.textContent=l,e.style.display="flex"),t&&(t.textContent=l,t.style.display="flex"),i&&(i.textContent=l,i.style.display="inline-flex"),s&&(s.textContent=`${this.unreadCount} new ${this.unreadCount===1?"message":"messages"}`,s.style.display="inline-flex"),n&&(n.textContent=l,n.style.display="inline-flex"),a&&(a.textContent=this.unreadCount===1?"You have 1 new reply":`You have ${this.unreadCount} new replies`)}else e&&(e.style.display="none"),t&&(t.style.display="none"),i&&(i.style.display="none"),s&&(s.style.display="none"),n&&(n.style.display="none"),a&&(a.textContent="Chat with us");this.renderRecentConversation()}formatRelativeTime(e){let i=Math.floor((new Date().getTime()-e.getTime())/1e3);if(i<60)return"Just now";let s=Math.floor(i/60);if(s<60)return`${s}m ago`;let n=Math.floor(s/60);if(n<24)return`${n}h ago`;let a=Math.floor(n/24);return a===1?"Yesterday":a<7?`${a}d ago`:e.toLocaleDateString([],{month:"short",day:"numeric"})}renderRecentConversation(){let e=this.shadow?.getElementById("cardOpenConv"),t=this.shadow?.getElementById("cardStartChat"),i=this.shadow?.getElementById("openConvSnippet"),s=this.shadow?.getElementById("openConvSender"),n=this.shadow?.getElementById("openConvTime"),a=this.shadow?.getElementById("openConvUnreadPill"),o=this.shadow?.getElementById("openConvCtaBadge"),l=!!(this.messages&&this.messages.length>0);if(!this.conversationId||!l){e&&(e.style.display="none"),t&&(t.style.display="block");return}e&&(e.style.display="block"),t&&(t.style.display="none");let c=[...this.messages].reverse().find(h=>!h.is_internal);if(c){let h=(c.content||"").trim();c.attachment_url&&(h=h?`\u{1F4F7} ${h}`:"\u{1F4F7} Sent a picture"),i&&(i.textContent=h||"Active conversation"),s&&(c.sender_type==="visitor"?s.textContent="You":c.sender_type==="ai"?s.textContent="AI Assistant":s.textContent=this.config.title||"Support Team"),n&&c.created_at&&(n.textContent=this.formatRelativeTime(new Date(c.created_at)))}this.unreadCount>0?(a&&(a.textContent=`${this.unreadCount} new`,a.style.display="inline-flex"),o&&(o.textContent=this.unreadCount>9?"9+":this.unreadCount.toString(),o.style.display="inline-flex")):(a&&(a.style.display="none"),o&&(o.style.display="none"))}scrollToBottom(e=!1){let t=this.shadow?.getElementById("chatifyBody");if(!t)return;let i=()=>{t.scrollTop=t.scrollHeight;let n=t.lastElementChild;n&&n.scrollIntoView({behavior:e?"smooth":"auto",block:"end"})};i(),requestAnimationFrame(()=>i()),setTimeout(i,50),setTimeout(i,200),t.querySelectorAll("img").forEach(n=>{n.complete||(n.addEventListener("load",()=>i(),{once:!0}),n.addEventListener("error",()=>i(),{once:!0}))})}open(e){this.isOpen||this.toggleWindow(),e&&this.switchTab(e),this.activeTab==="messages"&&this.scrollToBottom(!1)}close(){this.isOpen&&this.toggleWindow()}toggle(){this.toggleWindow()}openHelp(){this.open("help"),setTimeout(()=>{this.shadow?.getElementById("helpSearchInput")?.focus()},120)}openMessages(){this.open("messages")}getIsOpen(){return this.isOpen}search(e){this.open("help"),this.activeSectionId=null,this.faqSearchQuery=(e||"").trim(),setTimeout(()=>{let t=this.shadow?.getElementById("helpSearchInput");t&&(t.value=e,t.focus()),this.renderFaqList()},100)}async openArticle(e){if(!e)return;this.open("help");let t=e.trim().toLowerCase(),i=this.faqs.find(s=>s.id&&s.id.toLowerCase()===t||s.slug&&s.slug.toLowerCase()===t);if(i){this.activeSectionId=i.sectionId||(this.sections.length>0?this.sections[0].id:null),this.faqSearchQuery="";let s=this.shadow?.getElementById("helpSearchInput");s&&(s.value=""),this.renderFaqList(),setTimeout(()=>{let n=this.shadow?.querySelectorAll(".chatify-faq-item"),a=null;if(n)for(let o=0;o<n.length;o++){let l=n[o],c=(l.getAttribute("data-id")||"").toLowerCase(),h=(l.getAttribute("data-slug")||"").toLowerCase();if(c===t||h===t){a=l;break}}if(a){let o=a;o.classList.contains("open")||o.classList.add("open"),o.scrollIntoView({behavior:"smooth",block:"center"})}},100)}}bindGlobalTriggers(){typeof document>"u"||document.addEventListener("click",e=>{let t=e.target;if(!t)return;if(t.closest("[data-chatify-help], .chatify-help-trigger")){e.preventDefault(),this.openHelp();return}let s=t.closest("[data-chatify-article]");if(s){e.preventDefault();let l=s.getAttribute("data-chatify-article")||"";l?this.openArticle(l):this.openHelp();return}let n=t.closest("[data-chatify-open], .chatify-open-trigger");if(n){e.preventDefault();let l=n.getAttribute("data-chatify-tab");this.open(l||"home");return}if(t.closest("[data-chatify-close]")){e.preventDefault(),this.close();return}if(t.closest("[data-chatify-toggle]")){e.preventDefault(),this.toggle();return}})}initNavbarAutoTrigger(){let e=this.config.navbarTriggerConfig;if(!e||e.enabled===!1)return;let t=(e.label||"FAQ").trim();if(!t)return;let i=t.toLowerCase(),s=e.action||"help",n=o=>{if(o&&o.preventDefault(),s==="messages")this.openMessages();else if(s==="redirect"){let l=this.config.customDomain;l?window.open(`https://${l}`,"_blank"):this.openHelp()}else this.openHelp()},a=()=>{if(typeof document>"u")return;let o=Array.from(document.querySelectorAll('header nav a, nav a, header .navbar a, [role="navigation"] a, header [role="menubar"] a, header a')),l=!1;for(let c of o){if(c.closest("#chatifyWidgetContainer")||c.id==="chatifyNavTriggerBtn"||c.id==="chatifyNavTriggerBtnMobile")continue;if(c.hasAttribute("data-chatify-hooked")){l=!0;break}let h=(c.textContent||"").trim().toLowerCase(),u=(c.getAttribute("href")||"").toLowerCase(),f=h===i,d=u===`/${i}`||u===`/en/${i}`||i==="faq"&&(u.endsWith("/faq")||u.includes("/faq"))||i==="help"&&(u.endsWith("/help")||u.includes("/help"));if(f||d){c.setAttribute("data-chatify-hooked","true"),c.setAttribute("data-chatify-help","true"),c.style.cursor="pointer",c.addEventListener("click",p=>n(p)),l=!0,document.getElementById("chatifyNavTriggerBtn")?.remove(),document.getElementById("chatifyNavTriggerBtnMobile")?.remove();break}}if(!l&&e.auto_inject!==!1){let c=e.target_selector||'header nav ul, nav ul, header nav, nav, [role="navigation"] ul, [role="navigation"], .navbar-nav, .navbar',h=document.querySelector(c);if(h&&!document.getElementById("chatifyNavTriggerBtn")){let u=h.tagName.toLowerCase()==="ul"||h.tagName.toLowerCase()==="ol",f=h.querySelector("a"),d=document.createElement("a");if(d.id="chatifyNavTriggerBtn",d.textContent=t,d.setAttribute("data-chatify-help","true"),d.setAttribute("data-chatify-injected","true"),s==="redirect"&&this.config.customDomain?(d.href=`https://${this.config.customDomain}`,d.target="_blank"):d.href="javascript:void(0)",e.style==="pill"?d.style.cssText=`
              display: inline-flex;
              align-items: center;
              justify-content: center;
              padding: 6px 16px;
              font-size: 14px;
              font-weight: 600;
              border-radius: 9999px;
              text-decoration: none;
              cursor: pointer;
              z-index: 10;
              transition: all 0.2s ease;
              background: ${this.config.primaryColor||"#480576"};
              color: #ffffff;
              border: 1px solid rgba(255,255,255,0.25);
              box-shadow: 0 2px 8px rgba(0,0,0,0.25);
              margin-left: 4px;
            `:f&&f.className?(d.className=f.className,f.getAttribute("style")&&d.setAttribute("style",f.getAttribute("style")||""),d.style.cursor="pointer",d.style.zIndex="10"):d.style.cssText=`
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 6px 14px;
                font-size: 14px;
                font-weight: 500;
                color: inherit;
                text-decoration: none;
                cursor: pointer;
                z-index: 10;
                transition: color 0.2s ease;
              `,d.addEventListener("click",p=>n(p)),u){let p=document.createElement("li");p.className="chatify-nav-item",p.appendChild(d),h.appendChild(p)}else h.appendChild(d)}if(!document.getElementById("chatifyNavTriggerBtnMobile")){let u=document.querySelector('header button.lg\\:hidden, header [aria-label*="Toggle" i], header [aria-label*="menu" i], header .flex.items-center.justify-end');if(u&&u.parentElement){let f=document.createElement("a");f.id="chatifyNavTriggerBtnMobile",f.textContent=t,f.setAttribute("data-chatify-help","true"),f.setAttribute("data-chatify-injected","true"),f.className="chatify-mobile-nav-btn lg:hidden",f.style.cssText=`
              display: inline-flex;
              align-items: center;
              justify-content: center;
              padding: 4px 10px;
              font-size: 12px;
              font-weight: 600;
              border-radius: 9999px;
              background: ${this.config.primaryColor||"#480576"};
              color: #ffffff;
              text-decoration: none;
              cursor: pointer;
              margin-right: 4px;
              white-space: nowrap;
            `,s==="redirect"&&this.config.customDomain?(f.href=`https://${this.config.customDomain}`,f.target="_blank"):f.href="javascript:void(0)",f.addEventListener("click",d=>n(d)),u.parentElement.insertBefore(f,u)}}}};if(a(),typeof MutationObserver<"u"&&typeof document<"u"&&document.body){let o=null;new MutationObserver(()=>{clearTimeout(o),o=setTimeout(()=>{document.getElementById("chatifyNavTriggerBtn")||a()},300)}).observe(document.body,{childList:!0,subtree:!0})}}};if(typeof window<"u"){if(!window.Chatify){let e=[],t={q:e,open:(...i)=>e.push(["open",i]),close:(...i)=>e.push(["close",i]),toggle:(...i)=>e.push(["toggle",i]),openHelp:(...i)=>e.push(["openHelp",i]),openMessages:(...i)=>e.push(["openMessages",i]),openArticle:(...i)=>e.push(["openArticle",i]),search:(...i)=>e.push(["search",i]),isOpen:()=>!1,resetSession:()=>{},switchTab:(...i)=>e.push(["switchTab",i])};window.Chatify=t}let r=()=>{let e=new pr;window.__ChatifyInstance=e;let t=window.Chatify,i=Array.isArray(t?.q)?t.q:Array.isArray(t)?t:[],s={open:n=>e.open(n),close:()=>e.close(),toggle:()=>e.toggle(),openHelp:()=>e.openHelp(),openMessages:()=>e.openMessages(),openArticle:n=>e.openArticle(n),search:n=>e.search(n),isOpen:()=>e.getIsOpen(),resetSession:()=>e.resetSession(),switchTab:n=>e.switchTab(n),instance:e};if(window.Chatify=s,i.length>0){for(let n of i)if(Array.isArray(n)){let[a,o=[]]=n;typeof s[a]=="function"&&s[a](...o)}else if(typeof n=="function")try{n(s)}catch{}}};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",r):r()}})();
