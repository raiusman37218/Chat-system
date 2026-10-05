"use strict";(()=>{var Yi=Symbol.for("@supabase/supabase-js.traceContextExtractor");function _r(){return globalThis[Yi]}function ae(r,e){var t={};for(var i in r)Object.prototype.hasOwnProperty.call(r,i)&&e.indexOf(i)<0&&(t[i]=r[i]);if(r!=null&&typeof Object.getOwnPropertySymbols=="function")for(var s=0,i=Object.getOwnPropertySymbols(r);s<i.length;s++)e.indexOf(i[s])<0&&Object.prototype.propertyIsEnumerable.call(r,i[s])&&(t[i[s]]=r[i[s]]);return t}function xr(r,e,t,i){function s(n){return n instanceof t?n:new t(function(a){a(n)})}return new(t||(t=Promise))(function(n,a){function o(h){try{c(i.next(h))}catch(d){a(d)}}function l(h){try{c(i.throw(h))}catch(d){a(d)}}function c(h){h.done?n(h.value):s(h.value).then(o,l)}c((i=i.apply(r,e||[])).next())})}var kr=r=>r?(...e)=>r(...e):(...e)=>fetch(...e);var ge=class extends Error{constructor(e,t="FunctionsError",i){super(e),this.name=t,this.context=i}toJSON(){return{name:this.name,message:this.message,context:this.context}}},je=class extends ge{constructor(e){super("Failed to send a request to the Edge Function","FunctionsFetchError",e)}},me=class extends ge{constructor(e){super("Relay Error invoking the Edge Function","FunctionsRelayError",e)}},ye=class extends ge{constructor(e){super("Edge Function returned a non-2xx status code","FunctionsHttpError",e)}},$e;(function(r){r.Any="any",r.ApNortheast1="ap-northeast-1",r.ApNortheast2="ap-northeast-2",r.ApSouth1="ap-south-1",r.ApSoutheast1="ap-southeast-1",r.ApSoutheast2="ap-southeast-2",r.CaCentral1="ca-central-1",r.EuCentral1="eu-central-1",r.EuWest1="eu-west-1",r.EuWest2="eu-west-2",r.EuWest3="eu-west-3",r.SaEast1="sa-east-1",r.UsEast1="us-east-1",r.UsWest1="us-west-1",r.UsWest2="us-west-2"})($e||($e={}));var Be=class{constructor(e,{headers:t={},customFetch:i,region:s=$e.Any}={}){this.url=e,this.headers=t,this.region=s,this.fetch=kr(i)}setAuth(e){this.headers.Authorization=`Bearer ${e}`}invoke(e){return xr(this,arguments,void 0,function*(t,i={}){var s,n;let a,o,l;try{let{headers:c,method:h,body:d,signal:f,timeout:u}=i,p={},{region:g}=i;g||(g=this.region);let y=new URL(`${this.url}/${t}`);g&&g!=="any"&&(p["x-region"]=g,y.searchParams.set("forceFunctionRegion",g));let _,E=!!c&&Object.keys(c).some(C=>C.toLowerCase()==="content-type");d&&!E?typeof Blob<"u"&&d instanceof Blob||d instanceof ArrayBuffer?(p["Content-Type"]="application/octet-stream",_=d):typeof d=="string"?(p["Content-Type"]="text/plain",_=d):typeof FormData<"u"&&d instanceof FormData?_=d:(p["Content-Type"]="application/json",_=JSON.stringify(d)):d&&typeof d!="string"&&!(typeof Blob<"u"&&d instanceof Blob)&&!(d instanceof ArrayBuffer)&&!(typeof FormData<"u"&&d instanceof FormData)?_=JSON.stringify(d):_=d;let m=f;u&&(o=new AbortController,a=setTimeout(()=>o.abort(),u),f?(m=o.signal,l=()=>o.abort(),f.addEventListener("abort",l)):m=o.signal);let x=yield this.fetch(y.toString(),{method:h||"POST",headers:Object.assign(Object.assign(Object.assign({},p),this.headers),c),body:_,signal:m}).catch(C=>{throw new je(C)}),b=x.headers.get("x-relay-error");if(b&&b==="true")throw new me(x);if(!x.ok)throw new ye(x);let v=((s=x.headers.get("Content-Type"))!==null&&s!==void 0?s:"text/plain").split(";")[0].trim().toLowerCase(),T;return v==="application/json"?T=yield x.json():v==="application/octet-stream"||v==="application/pdf"?T=yield x.blob():v==="text/event-stream"?T=x:v==="multipart/form-data"?T=yield x.formData():T=yield x.text(),{data:T,error:null,response:x}}catch(c){return{data:null,error:c,response:c instanceof ye||c instanceof me?c.context:void 0}}finally{a&&clearTimeout(a),l&&((n=i.signal)===null||n===void 0||n.removeEventListener("abort",l))}})}};var Er=r=>Math.min(1e3*2**r,3e4),Qi=[520,503],Cr=["GET","HEAD","OPTIONS"],ht=class extends Error{constructor(r){super(r.message),this.name="PostgrestError",this.details=r.details,this.hint=r.hint,this.code=r.code}toJSON(){return{name:this.name,message:this.message,details:this.details,hint:this.hint,code:this.code}}};function Ne(r){"@babel/helpers - typeof";return Ne=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Ne(r)}function Xi(r,e){if(Ne(r)!="object"||!r)return r;var t=r[Symbol.toPrimitive];if(t!==void 0){var i=t.call(r,e||"default");if(Ne(i)!="object")return i;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(r)}function Zi(r){var e=Xi(r,"string");return Ne(e)=="symbol"?e:e+""}function es(r,e,t){return(e=Zi(e))in r?Object.defineProperty(r,e,{value:t,enumerable:!0,configurable:!0,writable:!0}):r[e]=t,r}function Sr(r,e){var t=Object.keys(r);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(r);e&&(i=i.filter(function(s){return Object.getOwnPropertyDescriptor(r,s).enumerable})),t.push.apply(t,i)}return t}function we(r){for(var e=1;e<arguments.length;e++){var t=arguments[e]!=null?arguments[e]:{};e%2?Sr(Object(t),!0).forEach(function(i){es(r,i,t[i])}):Object.getOwnPropertyDescriptors?Object.defineProperties(r,Object.getOwnPropertyDescriptors(t)):Sr(Object(t)).forEach(function(i){Object.defineProperty(r,i,Object.getOwnPropertyDescriptor(t,i))})}return r}function Tr(r,e){return new Promise(t=>{if(e?.aborted){t();return}let i=setTimeout(()=>{e?.removeEventListener("abort",s),t()},r);function s(){clearTimeout(i),t()}e?.addEventListener("abort",s)})}function ts(r,e,t,i){return!(!i||t>=3||!Cr.includes(r)||!Qi.includes(e))}var rs=class{constructor(r){var e,t,i,s,n;this.shouldThrowOnError=!1,this.retryEnabled=!0,this.method=r.method,this.url=r.url,this.headers=new Headers(r.headers),this.schema=r.schema,this.body=r.body,this.shouldThrowOnError=(e=r.shouldThrowOnError)!==null&&e!==void 0?e:!1,this.signal=r.signal,this.isMaybeSingle=(t=r.isMaybeSingle)!==null&&t!==void 0?t:!1,this.shouldStripNulls=(i=r.shouldStripNulls)!==null&&i!==void 0?i:!1,this.urlLengthLimit=(s=r.urlLengthLimit)!==null&&s!==void 0?s:8e3,this.retryEnabled=(n=r.retry)!==null&&n!==void 0?n:!0,r.fetch?this.fetch=r.fetch:this.fetch=fetch}throwOnError(){return this.shouldThrowOnError=!0,this}stripNulls(){if(this.headers.get("Accept")==="text/csv")throw new Error("stripNulls() cannot be used with csv()");return this.shouldStripNulls=!0,this}setHeader(r,e){return this.headers=new Headers(this.headers),this.headers.set(r,e),this}retry(r){return this.retryEnabled=r,this}then(r,e){var t=this;if(this.schema===void 0||(["GET","HEAD"].includes(this.method)?this.headers.set("Accept-Profile",this.schema):this.headers.set("Content-Profile",this.schema)),this.method!=="GET"&&this.method!=="HEAD"&&this.headers.set("Content-Type","application/json"),this.shouldStripNulls){let a=this.headers.get("Accept");a==="application/vnd.pgrst.object+json"?this.headers.set("Accept","application/vnd.pgrst.object+json;nulls=stripped"):(!a||a==="application/json")&&this.headers.set("Accept","application/vnd.pgrst.array+json;nulls=stripped")}let i=this.fetch,n=(async()=>{let a=0;for(;;){let c={};t.headers.forEach((d,f)=>{c[f]=d}),a>0&&(c["X-Retry-Count"]=String(a));let h;try{h=await i(t.url.toString(),{method:t.method,headers:c,body:JSON.stringify(t.body,(d,f)=>typeof f=="bigint"?f.toString():f),signal:t.signal})}catch(d){if(d?.name==="AbortError"||d?.code==="ABORT_ERR"||!Cr.includes(t.method))throw d;if(t.retryEnabled&&a<3){let f=Er(a);a++,await Tr(f,t.signal);continue}throw d}if(ts(t.method,h.status,a,t.retryEnabled)){var o,l;let d=(o=(l=h.headers)===null||l===void 0?void 0:l.get("Retry-After"))!==null&&o!==void 0?o:null,f=d!==null?Math.max(0,parseInt(d,10)||0)*1e3:Er(a);await h.text(),a++,await Tr(f,t.signal);continue}return await t.processResponse(h)}})();return this.shouldThrowOnError||(n=n.catch(a=>{var o;let l="",c="",h="",d=a?.cause;if(d){var f,u,p,g;let E=(f=d?.message)!==null&&f!==void 0?f:"",m=(u=d?.code)!==null&&u!==void 0?u:"";l=`${(p=a?.name)!==null&&p!==void 0?p:"FetchError"}: ${a?.message}`,l+=`

Caused by: ${(g=d?.name)!==null&&g!==void 0?g:"Error"}: ${E}`,m&&(l+=` (${m})`),d?.stack&&(l+=`
${d.stack}`)}else{var y;l=(y=a?.stack)!==null&&y!==void 0?y:""}let _=this.url.toString().length;return a?.name==="AbortError"||a?.code==="ABORT_ERR"?(h="",c="Request was aborted (timeout or manual cancellation)",_>this.urlLengthLimit&&(c+=`. Note: Your request URL is ${_} characters, which may exceed server limits. If selecting many fields, consider using views. If filtering with large arrays (e.g., .in('id', [many IDs])), consider using an RPC function to pass values server-side.`)):(d?.name==="HeadersOverflowError"||d?.code==="UND_ERR_HEADERS_OVERFLOW")&&(h="",c="HTTP headers exceeded server limits (typically 16KB)",_>this.urlLengthLimit&&(c+=`. Your request URL is ${_} characters. If selecting many fields, consider using views. If filtering with large arrays (e.g., .in('id', [200+ IDs])), consider using an RPC function instead.`)),{success:!1,error:{message:`${(o=a?.name)!==null&&o!==void 0?o:"FetchError"}: ${a?.message}`,details:l,hint:c,code:h},data:null,count:null,status:0,statusText:""}})),n.then(r,e)}async processResponse(r){var e=this;let t=null,i=null,s=null,n=r.status,a=r.statusText;if(r.ok){var o,l;if(e.method!=="HEAD"){var c;let u=await r.text();if(u!=="")if(e.headers.get("Accept")==="text/csv")i=u;else if(e.headers.get("Accept")&&(!((c=e.headers.get("Accept"))===null||c===void 0)&&c.includes("application/vnd.pgrst.plan+text")))i=u;else try{i=JSON.parse(u)}catch{if(t={message:u},i=null,e.shouldThrowOnError)throw new ht({message:u,details:"",hint:"",code:""})}}let d=(o=e.headers.get("Prefer"))===null||o===void 0?void 0:o.match(/count=(exact|planned|estimated)/),f=(l=r.headers.get("content-range"))===null||l===void 0?void 0:l.split("/");if(d&&f&&f.length>1&&(s=parseInt(f[1])),e.isMaybeSingle&&Array.isArray(i))if(i.length>1){if(t={code:"PGRST116",details:`Results contain ${i.length} rows, application/vnd.pgrst.object+json requires 1 row`,hint:null,message:"JSON object requested, multiple (or no) rows returned"},i=null,s=null,n=406,a="Not Acceptable",e.shouldThrowOnError){var h;throw new ht(we(we({},t),{},{hint:(h=t.hint)!==null&&h!==void 0?h:""}))}}else i.length===1?i=i[0]:i=null}else{let d=await r.text();try{t=JSON.parse(d),Array.isArray(t)&&r.status===404&&(i=[],t=null,n=200,a="OK")}catch{r.status===404&&d===""?(n=204,a="No Content"):t={message:d}}if(t&&e.shouldThrowOnError)throw new ht(t)}return{success:t===null,error:t,data:i,count:s,status:n,statusText:a}}returns(){return this}overrideTypes(){return this}},is=class extends rs{throwOnError(){return super.throwOnError()}select(r){let e=!1,t=(r??"*").split("").map(i=>/\s/.test(i)&&!e?"":(i==='"'&&(e=!e),i)).join("");return this.url.searchParams.set("select",t),this.headers.append("Prefer","return=representation"),this}order(r,{ascending:e=!0,nullsFirst:t,foreignTable:i,referencedTable:s=i}={}){let n=s?`${s}.order`:"order",a=this.url.searchParams.get(n);return this.url.searchParams.set(n,`${a?`${a},`:""}${r}.${e?"asc":"desc"}${t===void 0?"":t?".nullsfirst":".nullslast"}`),this}limit(r,{foreignTable:e,referencedTable:t=e}={}){let i=typeof t>"u"?"limit":`${t}.limit`;return this.url.searchParams.set(i,`${r}`),this}range(r,e,{foreignTable:t,referencedTable:i=t}={}){let s=typeof i>"u"?"offset":`${i}.offset`,n=typeof i>"u"?"limit":`${i}.limit`;return this.url.searchParams.set(s,`${r}`),this.url.searchParams.set(n,`${e-r+1}`),this}abortSignal(r){return this.signal=r,this}single(){return this.headers.set("Accept","application/vnd.pgrst.object+json"),this}maybeSingle(){return this.isMaybeSingle=!0,this}csv(){return this.headers.set("Accept","text/csv"),this}geojson(){return this.headers.set("Accept","application/geo+json"),this}explain({analyze:r=!1,verbose:e=!1,settings:t=!1,buffers:i=!1,wal:s=!1,format:n="text"}={}){var a;let o=[r?"analyze":null,e?"verbose":null,t?"settings":null,i?"buffers":null,s?"wal":null].filter(Boolean).join("|"),l=(a=this.headers.get("Accept"))!==null&&a!==void 0?a:"application/json";return this.headers.set("Accept",`application/vnd.pgrst.plan+${n}; for="${l}"; options=${o};`),n==="json"?this:this}rollback(){return this.headers.append("Prefer","tx=rollback"),this}returns(){return this}maxAffected(r){return this.headers.append("Prefer","handling=strict"),this.headers.append("Prefer",`max-affected=${r}`),this}},Ar=new RegExp("[,()]"),ve=class extends is{throwOnError(){return super.throwOnError()}eq(r,e){return this.url.searchParams.append(r,`eq.${e}`),this}neq(r,e){return this.url.searchParams.append(r,`neq.${e}`),this}gt(r,e){return this.url.searchParams.append(r,`gt.${e}`),this}gte(r,e){return this.url.searchParams.append(r,`gte.${e}`),this}lt(r,e){return this.url.searchParams.append(r,`lt.${e}`),this}lte(r,e){return this.url.searchParams.append(r,`lte.${e}`),this}like(r,e){return this.url.searchParams.append(r,`like.${e}`),this}likeAllOf(r,e){return this.url.searchParams.append(r,`like(all).{${e.join(",")}}`),this}likeAnyOf(r,e){return this.url.searchParams.append(r,`like(any).{${e.join(",")}}`),this}ilike(r,e){return this.url.searchParams.append(r,`ilike.${e}`),this}ilikeAllOf(r,e){return this.url.searchParams.append(r,`ilike(all).{${e.join(",")}}`),this}ilikeAnyOf(r,e){return this.url.searchParams.append(r,`ilike(any).{${e.join(",")}}`),this}regexMatch(r,e){return this.url.searchParams.append(r,`match.${e}`),this}regexIMatch(r,e){return this.url.searchParams.append(r,`imatch.${e}`),this}is(r,e){return this.url.searchParams.append(r,`is.${e}`),this}isDistinct(r,e){return this.url.searchParams.append(r,`isdistinct.${e}`),this}in(r,e){let t=Array.from(new Set(e)).map(i=>typeof i=="string"&&Ar.test(i)?`"${i}"`:`${i}`).join(",");return this.url.searchParams.append(r,`in.(${t})`),this}notIn(r,e){let t=Array.from(new Set(e)).map(i=>typeof i=="string"&&Ar.test(i)?`"${i}"`:`${i}`).join(",");return this.url.searchParams.append(r,`not.in.(${t})`),this}contains(r,e){return typeof e=="string"?this.url.searchParams.append(r,`cs.${e}`):Array.isArray(e)?this.url.searchParams.append(r,`cs.{${e.join(",")}}`):this.url.searchParams.append(r,`cs.${JSON.stringify(e)}`),this}containedBy(r,e){return typeof e=="string"?this.url.searchParams.append(r,`cd.${e}`):Array.isArray(e)?this.url.searchParams.append(r,`cd.{${e.join(",")}}`):this.url.searchParams.append(r,`cd.${JSON.stringify(e)}`),this}rangeGt(r,e){return this.url.searchParams.append(r,`sr.${e}`),this}rangeGte(r,e){return this.url.searchParams.append(r,`nxl.${e}`),this}rangeLt(r,e){return this.url.searchParams.append(r,`sl.${e}`),this}rangeLte(r,e){return this.url.searchParams.append(r,`nxr.${e}`),this}rangeAdjacent(r,e){return this.url.searchParams.append(r,`adj.${e}`),this}overlaps(r,e){return typeof e=="string"?this.url.searchParams.append(r,`ov.${e}`):this.url.searchParams.append(r,`ov.{${e.join(",")}}`),this}textSearch(r,e,{config:t,type:i}={}){let s="";i==="plain"?s="pl":i==="phrase"?s="ph":i==="websearch"&&(s="w");let n=t===void 0?"":`(${t})`;return this.url.searchParams.append(r,`${s}fts${n}.${e}`),this}match(r){return Object.entries(r).filter(([e,t])=>t!==void 0).forEach(([e,t])=>{this.url.searchParams.append(e,`eq.${t}`)}),this}not(r,e,t){return this.url.searchParams.append(r,`not.${e}.${t}`),this}or(r,{foreignTable:e,referencedTable:t=e}={}){let i=t?`${t}.or`:"or";return this.url.searchParams.append(i,`(${r})`),this}filter(r,e,t){return this.url.searchParams.append(r,`${e}.${t}`),this}},ss=class{constructor(r,{headers:e={},schema:t,fetch:i,urlLengthLimit:s=8e3,retry:n}){this.url=r,this.headers=new Headers(e),this.schema=t,this.fetch=i,this.urlLengthLimit=s,this.retry=n}cloneRequestState(){return{url:new URL(this.url.toString()),headers:new Headers(this.headers)}}select(r,e){let{head:t=!1,count:i}=e??{},s=t?"HEAD":"GET",n=!1,a=(r??"*").split("").map(c=>/\s/.test(c)&&!n?"":(c==='"'&&(n=!n),c)).join(""),{url:o,headers:l}=this.cloneRequestState();return o.searchParams.set("select",a),i&&l.append("Prefer",`count=${i}`),new ve({method:s,url:o,headers:l,schema:this.schema,fetch:this.fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}insert(r,{count:e,defaultToNull:t=!0}={}){var i;let s="POST",{url:n,headers:a}=this.cloneRequestState();if(e&&a.append("Prefer",`count=${e}`),t||a.append("Prefer","missing=default"),Array.isArray(r)){let o=r.reduce((l,c)=>l.concat(Object.keys(c)),[]);if(o.length>0){let l=[...new Set(o)].map(c=>`"${c}"`);n.searchParams.set("columns",l.join(","))}}return new ve({method:s,url:n,headers:a,schema:this.schema,body:r,fetch:(i=this.fetch)!==null&&i!==void 0?i:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}upsert(r,{onConflict:e,ignoreDuplicates:t=!1,count:i,defaultToNull:s=!0}={}){var n;let a="POST",{url:o,headers:l}=this.cloneRequestState();if(l.append("Prefer",`resolution=${t?"ignore":"merge"}-duplicates`),e!==void 0&&o.searchParams.set("on_conflict",e),i&&l.append("Prefer",`count=${i}`),s||l.append("Prefer","missing=default"),Array.isArray(r)){let c=r.reduce((h,d)=>h.concat(Object.keys(d)),[]);if(c.length>0){let h=[...new Set(c)].map(d=>`"${d}"`);o.searchParams.set("columns",h.join(","))}}return new ve({method:a,url:o,headers:l,schema:this.schema,body:r,fetch:(n=this.fetch)!==null&&n!==void 0?n:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}update(r,{count:e}={}){var t;let i="PATCH",{url:s,headers:n}=this.cloneRequestState();return e&&n.append("Prefer",`count=${e}`),new ve({method:i,url:s,headers:n,schema:this.schema,body:r,fetch:(t=this.fetch)!==null&&t!==void 0?t:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}delete({count:r}={}){var e;let t="DELETE",{url:i,headers:s}=this.cloneRequestState();return r&&s.append("Prefer",`count=${r}`),new ve({method:t,url:i,headers:s,schema:this.schema,fetch:(e=this.fetch)!==null&&e!==void 0?e:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}},Ir=class Rr{constructor(e,{headers:t={},schema:i,fetch:s,timeout:n,urlLengthLimit:a=8e3,retry:o}={}){this.url=e,this.headers=new Headers(t),this.schemaName=i,this.urlLengthLimit=a;let l=s??globalThis.fetch;n!==void 0&&n>0?this.fetch=(c,h)=>{let d=new AbortController,f=setTimeout(()=>d.abort(),n),u=h?.signal;if(u){if(u.aborted)return clearTimeout(f),l(c,h);let p=()=>{clearTimeout(f),d.abort()};return u.addEventListener("abort",p,{once:!0}),l(c,we(we({},h),{},{signal:d.signal})).finally(()=>{clearTimeout(f),u.removeEventListener("abort",p)})}return l(c,we(we({},h),{},{signal:d.signal})).finally(()=>clearTimeout(f))}:this.fetch=l,this.retry=o}from(e){if(!e||typeof e!="string"||e.trim()==="")throw new Error("Invalid relation name: relation must be a non-empty string.");return new ss(new URL(`${this.url}/${e}`),{headers:new Headers(this.headers),schema:this.schemaName,fetch:this.fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}schema(e){return new Rr(this.url,{headers:this.headers,schema:e,fetch:this.fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}rpc(e,t={},{head:i=!1,get:s=!1,count:n}={}){var a;let o,l=new URL(`${this.url}/rpc/${e}`),c,h=u=>u!==null&&typeof u=="object"&&(!Array.isArray(u)||u.some(h)),d=i&&Object.values(t).some(h);d?(o="POST",c=t):i||s?(o=i?"HEAD":"GET",Object.entries(t).filter(([u,p])=>p!==void 0).map(([u,p])=>[u,Array.isArray(p)?`{${p.join(",")}}`:`${p}`]).forEach(([u,p])=>{l.searchParams.append(u,p)})):(o="POST",c=t);let f=new Headers(this.headers);return d?f.set("Prefer",n?`count=${n},return=minimal`:"return=minimal"):n&&f.set("Prefer",`count=${n}`),new ve({method:o,url:l,headers:f,schema:this.schemaName,body:c,fetch:(a=this.fetch)!==null&&a!==void 0?a:fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}};var Ht=class{constructor(){}static detectEnvironment(){var e;if(typeof WebSocket<"u")return{type:"native",wsConstructor:WebSocket};let t=globalThis;if(typeof globalThis<"u"&&typeof t.WebSocket<"u")return{type:"native",wsConstructor:t.WebSocket};let i=typeof global<"u"?global:void 0;if(i&&typeof i.WebSocket<"u")return{type:"native",wsConstructor:i.WebSocket};if(typeof globalThis<"u"&&typeof t.WebSocketPair<"u"&&typeof globalThis.WebSocket>"u")return{type:"cloudflare",error:"Cloudflare Workers detected. WebSocket clients are not supported in Cloudflare Workers.",workaround:"Use Cloudflare Workers WebSocket API for server-side WebSocket handling, or deploy to a different runtime."};if(typeof globalThis<"u"&&t.EdgeRuntime||typeof navigator<"u"&&(!((e=navigator.userAgent)===null||e===void 0)&&e.includes("Vercel-Edge")))return{type:"unsupported",error:"Edge runtime detected (Vercel Edge/Netlify Edge). WebSockets are not supported in edge functions.",workaround:"Use serverless functions or a different deployment target for WebSocket functionality."};let s=globalThis.process;if(s){let n=s.versions;if(n&&n.node)return{type:"unsupported",error:"Node.js detected but native WebSocket not found.",workaround:"Ensure you are running Node.js 22+ or provide a WebSocket implementation via the transport option."}}return{type:"unsupported",error:"Unknown JavaScript runtime without WebSocket support.",workaround:"Ensure you're running in a supported environment (browser, Node.js, Deno) or provide a custom WebSocket implementation."}}static getWebSocketConstructor(){let e=this.detectEnvironment();if(e.wsConstructor)return e.wsConstructor;let t=e.error||"WebSocket not supported in this environment.";throw e.workaround&&(t+=`

Suggested solution: ${e.workaround}`),new Error(t)}static isWebSocketSupported(){try{return this.detectEnvironment().type==="native"}catch{return!1}}},Dt=Ht;var Or="2.112.4";var Pr=`realtime-js/${Or}`,Lr="1.0.0",qt="2.0.0",jr=qt;var $r=1e4;var Br=100;var z={closed:"closed",errored:"errored",joined:"joined",joining:"joining",leaving:"leaving"},dt={close:"phx_close",error:"phx_error",join:"phx_join",reply:"phx_reply",leave:"phx_leave",access_token:"access_token"};var Me={connecting:"connecting",open:"open",closing:"closing",closed:"closed"};var Ue=class{constructor(e){this.HEADER_LENGTH=1,this.USER_BROADCAST_PUSH_META_LENGTH=6,this.KINDS={userBroadcastPush:3,userBroadcast:4},this.BINARY_ENCODING=0,this.JSON_ENCODING=1,this.BROADCAST_EVENT="broadcast",this.allowedMetadataKeys=[],this.allowedMetadataKeys=e??[]}encode(e,t){if(e.event===this.BROADCAST_EVENT&&!(e.payload instanceof ArrayBuffer)&&typeof e.payload.event=="string")return t(this._binaryEncodeUserBroadcastPush(e));let i=[e.join_ref,e.ref,e.topic,e.event,e.payload];return t(JSON.stringify(i))}_binaryEncodeUserBroadcastPush(e){var t;return this._isArrayBuffer((t=e.payload)===null||t===void 0?void 0:t.payload)?this._encodeBinaryUserBroadcastPush(e):this._encodeJsonUserBroadcastPush(e)}_encodeBinaryUserBroadcastPush(e){var t,i;let s=(i=(t=e.payload)===null||t===void 0?void 0:t.payload)!==null&&i!==void 0?i:new ArrayBuffer(0);return this._encodeUserBroadcastPush(e,this.BINARY_ENCODING,s)}_encodeJsonUserBroadcastPush(e){var t,i;let s=(i=(t=e.payload)===null||t===void 0?void 0:t.payload)!==null&&i!==void 0?i:{},a=new TextEncoder().encode(JSON.stringify(s)).buffer;return this._encodeUserBroadcastPush(e,this.JSON_ENCODING,a)}_encodeUserBroadcastPush(e,t,i){var s,n;let a=new TextEncoder,o=a.encode(e.topic),l=a.encode((s=e.ref)!==null&&s!==void 0?s:""),c=a.encode((n=e.join_ref)!==null&&n!==void 0?n:""),h=a.encode(e.payload.event),d=this.allowedMetadataKeys?this._pick(e.payload,this.allowedMetadataKeys):{},f=a.encode(Object.keys(d).length===0?"":JSON.stringify(d));if(c.length>255)throw new Error(`joinRef length ${c.length} exceeds maximum of 255`);if(l.length>255)throw new Error(`ref length ${l.length} exceeds maximum of 255`);if(o.length>255)throw new Error(`topic length ${o.length} exceeds maximum of 255`);if(h.length>255)throw new Error(`userEvent length ${h.length} exceeds maximum of 255`);if(f.length>255)throw new Error(`metadata length ${f.length} exceeds maximum of 255`);let u=this.USER_BROADCAST_PUSH_META_LENGTH+c.length+l.length+o.length+h.length+f.length,p=new ArrayBuffer(this.HEADER_LENGTH+u),g=new DataView(p),y=new Uint8Array(p),_=0;g.setUint8(_++,this.KINDS.userBroadcastPush),g.setUint8(_++,c.length),g.setUint8(_++,l.length),g.setUint8(_++,o.length),g.setUint8(_++,h.length),g.setUint8(_++,f.length),g.setUint8(_++,t),y.set(c,_),_+=c.length,y.set(l,_),_+=l.length,y.set(o,_),_+=o.length,y.set(h,_),_+=h.length,y.set(f,_),_+=f.length;var E=new Uint8Array(p.byteLength+i.byteLength);return E.set(new Uint8Array(p),0),E.set(new Uint8Array(i),p.byteLength),E.buffer}decode(e,t){if(this._isArrayBuffer(e)){let i=this._binaryDecode(e);return t(i)}if(typeof e=="string"){let i=JSON.parse(e),[s,n,a,o,l]=i;return t({join_ref:s,ref:n,topic:a,event:o,payload:l})}return t({})}_binaryDecode(e){let t=new DataView(e),i=t.getUint8(0),s=new TextDecoder;if(i===this.KINDS.userBroadcast)return this._decodeUserBroadcast(e,t,s)}_decodeUserBroadcast(e,t,i){let s=t.getUint8(1),n=t.getUint8(2),a=t.getUint8(3),o=t.getUint8(4),l=this.HEADER_LENGTH+4,c=i.decode(e.slice(l,l+s));l=l+s;let h=i.decode(e.slice(l,l+n));l=l+n;let d=i.decode(e.slice(l,l+a));l=l+a;let f=e.slice(l,e.byteLength),u=o===this.JSON_ENCODING?JSON.parse(i.decode(f)):f,p={type:this.BROADCAST_EVENT,event:h,payload:u};return a>0&&(p.meta=JSON.parse(d)),{join_ref:null,ref:null,topic:c,event:this.BROADCAST_EVENT,payload:p}}_isArrayBuffer(e){var t;return e instanceof ArrayBuffer||((t=e?.constructor)===null||t===void 0?void 0:t.name)==="ArrayBuffer"}_pick(e,t){return!e||typeof e!="object"?{}:Object.fromEntries(Object.entries(e).filter(([i])=>t.includes(i)))}};var I;(function(r){r.abstime="abstime",r.bool="bool",r.date="date",r.daterange="daterange",r.float4="float4",r.float8="float8",r.int2="int2",r.int4="int4",r.int4range="int4range",r.int8="int8",r.int8range="int8range",r.json="json",r.jsonb="jsonb",r.money="money",r.numeric="numeric",r.oid="oid",r.reltime="reltime",r.text="text",r.time="time",r.timestamp="timestamp",r.timestamptz="timestamptz",r.timetz="timetz",r.tsrange="tsrange",r.tstzrange="tstzrange"})(I||(I={}));var zt=(r,e,t={})=>{var i;let s=(i=t.skipTypes)!==null&&i!==void 0?i:[];return e?Object.keys(e).reduce((n,a)=>(n[a]=ns(a,r,e,s),n),{}):{}},ns=(r,e,t,i)=>{let s=e.find(o=>o.name===r),n=s?.type,a=t[r];return n&&!i.includes(n)?Nr(n,a):Ft(a)},Nr=(r,e)=>{if(r.charAt(0)==="_"){let t=r.slice(1,r.length);return cs(e,t)}switch(r){case I.bool:return as(e);case I.float4:case I.float8:case I.int2:case I.int4:case I.int8:case I.numeric:case I.oid:return os(e);case I.json:case I.jsonb:return ls(e);case I.timestamp:return hs(e);case I.abstime:case I.date:case I.daterange:case I.int4range:case I.int8range:case I.money:case I.reltime:case I.text:case I.time:case I.timestamptz:case I.timetz:case I.tsrange:case I.tstzrange:return Ft(e);default:return Ft(e)}},Ft=r=>r,as=r=>{switch(r){case"t":return!0;case"f":return!1;default:return r}},os=r=>{if(typeof r=="string"){let e=parseFloat(r);if(!Number.isNaN(e))return e}return r},ls=r=>{if(typeof r=="string")try{return JSON.parse(r)}catch{return r}return r},cs=(r,e)=>{if(typeof r!="string")return r;let t=r.length-1,i=r[t];if(r[0]==="{"&&i==="}"){let n,a=r.slice(1,t);try{n=JSON.parse("["+a+"]")}catch{n=a?a.split(","):[]}return n.map(o=>Nr(e,o))}return r},hs=r=>typeof r=="string"?r.replace(" ","T"):r,ut=r=>{let e=new URL(r);return e.protocol=e.protocol.replace(/^ws/i,"http"),e.pathname=e.pathname.replace(/\/+$/,"").replace(/\/socket\/websocket$/i,"").replace(/\/socket$/i,"").replace(/\/websocket$/i,""),e.pathname===""||e.pathname==="/"?e.pathname="/api/broadcast":e.pathname=e.pathname+"/api/broadcast",e.href};var xe=r=>typeof r=="function"?r:function(){return r},us=typeof self<"u"?self:null,_e=typeof window<"u"?window:null,W=us||_e||globalThis,fs="2.0.0",ps=1e4,gs=1e3,ms=100,V={connecting:0,open:1,closing:2,closed:3},N={closed:"closed",errored:"errored",joined:"joined",joining:"joining",leaving:"leaving"},X={close:"phx_close",error:"phx_error",join:"phx_join",reply:"phx_reply",leave:"phx_leave"},Wt={longpoll:"longpoll",websocket:"websocket"},ys={complete:4},Vt="base64url.bearer.phx.",ft=class{constructor(r,e,t,i){this.channel=r,this.event=e,this.payload=t||function(){return{}},this.receivedResp=null,this.timeout=i,this.timeoutTimer=null,this.recHooks=[],this.sent=!1,this.ref=void 0}resend(r){this.timeout=r,this.reset(),this.send()}send(){this.hasReceived("timeout")||(this.startTimeout(),this.sent=!0,this.channel.socket.push({topic:this.channel.topic,event:this.event,payload:this.payload(),ref:this.ref,join_ref:this.channel.joinRef()}))}receive(r,e){return this.hasReceived(r)&&e(this.receivedResp.response),this.recHooks.push({status:r,callback:e}),this}reset(){this.cancelRefEvent(),this.ref=null,this.refEvent=null,this.receivedResp=null,this.sent=!1}destroy(){this.cancelRefEvent(),this.cancelTimeout()}matchReceive({status:r,response:e,_ref:t}){this.recHooks.filter(i=>i.status===r).forEach(i=>i.callback(e))}cancelRefEvent(){this.refEvent&&this.channel.off(this.refEvent)}cancelTimeout(){clearTimeout(this.timeoutTimer),this.timeoutTimer=null}startTimeout(){this.timeoutTimer&&this.cancelTimeout(),this.ref=this.channel.socket.makeRef(),this.refEvent=this.channel.replyEventName(this.ref),this.channel.on(this.refEvent,r=>{this.cancelRefEvent(),this.cancelTimeout(),this.receivedResp=r,this.matchReceive(r)}),this.timeoutTimer=setTimeout(()=>{this.trigger("timeout",{})},this.timeout)}hasReceived(r){return this.receivedResp&&this.receivedResp.status===r}trigger(r,e){this.channel.trigger(this.refEvent,{status:r,response:e})}},Mr=class{constructor(r,e){this.callback=r,this.timerCalc=e,this.timer=void 0,this.tries=0}reset(){this.tries=0,clearTimeout(this.timer)}scheduleTimeout(){clearTimeout(this.timer),this.timer=setTimeout(()=>{this.tries=this.tries+1,this.callback()},this.timerCalc(this.tries+1))}},vs=class{constructor(r,e,t){this.state=N.closed,this.topic=r,this.params=xe(e||{}),this.socket=t,this.bindings=[],this.bindingRef=0,this.timeout=this.socket.timeout,this.joinedOnce=!1,this.joinPush=new ft(this,X.join,this.params,this.timeout),this.pushBuffer=[],this.stateChangeRefs=[],this.rejoinTimer=new Mr(()=>{this.socket.isConnected()&&this.rejoin()},this.socket.rejoinAfterMs),this.stateChangeRefs.push(this.socket.onError(()=>this.rejoinTimer.reset())),this.stateChangeRefs.push(this.socket.onOpen(()=>{this.rejoinTimer.reset(),this.isErrored()&&this.rejoin()})),this.joinPush.receive("ok",()=>{this.state=N.joined,this.rejoinTimer.reset(),this.pushBuffer.forEach(i=>i.send()),this.pushBuffer=[]}),this.joinPush.receive("error",i=>{this.state=N.errored,this.socket.hasLogger()&&this.socket.log("channel",`error ${this.topic}`,i),this.socket.isConnected()&&this.rejoinTimer.scheduleTimeout()}),this.onClose(()=>{this.rejoinTimer.reset(),this.socket.hasLogger()&&this.socket.log("channel",`close ${this.topic}`),this.state=N.closed,this.socket.remove(this)}),this.onError(i=>{this.socket.hasLogger()&&this.socket.log("channel",`error ${this.topic}`,i),this.isJoining()&&this.joinPush.reset(),this.state=N.errored,this.socket.isConnected()&&this.rejoinTimer.scheduleTimeout()}),this.joinPush.receive("timeout",()=>{this.socket.hasLogger()&&this.socket.log("channel",`timeout ${this.topic}`,this.joinPush.timeout),new ft(this,X.leave,xe({}),this.timeout).send(),this.state=N.errored,this.joinPush.reset(),this.socket.isConnected()&&this.rejoinTimer.scheduleTimeout()}),this.on(X.reply,(i,s)=>{this.trigger(this.replyEventName(s),i)})}join(r=this.timeout){if(this.joinedOnce)throw new Error("tried to join multiple times. 'join' can only be called a single time per channel instance");return this.timeout=r,this.joinedOnce=!0,this.rejoin(),this.joinPush}teardown(){this.pushBuffer.forEach(r=>r.destroy()),this.pushBuffer=[],this.rejoinTimer.reset(),this.joinPush.destroy(),this.state=N.closed,this.bindings=[]}onClose(r){this.on(X.close,r)}onError(r){return this.on(X.error,e=>r(e))}on(r,e){let t=this.bindingRef++;return this.bindings.push({event:r,ref:t,callback:e}),t}off(r,e){this.bindings=this.bindings.filter(t=>!(t.event===r&&(typeof e>"u"||e===t.ref)))}canPush(){return this.socket.isConnected()&&this.isJoined()}push(r,e,t=this.timeout){if(e=e||{},!this.joinedOnce)throw new Error(`tried to push '${r}' to '${this.topic}' before joining. Use channel.join() before pushing events`);let i=new ft(this,r,function(){return e},t);return this.canPush()?i.send():(i.startTimeout(),this.pushBuffer.push(i)),i}leave(r=this.timeout){this.rejoinTimer.reset(),this.joinPush.cancelTimeout(),this.state=N.leaving;let e=()=>{this.socket.hasLogger()&&this.socket.log("channel",`leave ${this.topic}`),this.trigger(X.close,"leave")},t=new ft(this,X.leave,xe({}),r);return t.receive("ok",()=>e()).receive("timeout",()=>e()),t.send(),this.canPush()||t.trigger("ok",{}),t}onMessage(r,e,t){return e}filterBindings(r,e,t){return!0}isMember(r,e,t,i){return this.topic!==r?!1:i&&i!==this.joinRef()?(this.socket.hasLogger()&&this.socket.log("channel","dropping outdated message",{topic:r,event:e,payload:t,joinRef:i}),!1):!0}joinRef(){return this.joinPush.ref}rejoin(r=this.timeout){this.isLeaving()||(this.socket.leaveOpenTopic(this.topic),this.state=N.joining,this.joinPush.resend(r))}trigger(r,e,t,i){let s=this.onMessage(r,e,t,i);if(e&&!s)throw new Error("channel onMessage callbacks must return the payload, modified or unmodified");let n=this.bindings.filter(a=>a.event===r&&this.filterBindings(a,e,t));for(let a=0;a<n.length;a++)n[a].callback(s,t,i||this.joinRef())}replyEventName(r){return`chan_reply_${r}`}isClosed(){return this.state===N.closed}isErrored(){return this.state===N.errored}isJoined(){return this.state===N.joined}isJoining(){return this.state===N.joining}isLeaving(){return this.state===N.leaving}},gt=class{static request(r,e,t,i,s,n,a){if(W.XDomainRequest){let o=new W.XDomainRequest;return this.xdomainRequest(o,r,e,i,s,n,a)}else if(W.XMLHttpRequest){let o=new W.XMLHttpRequest;return this.xhrRequest(o,r,e,t,i,s,n,a)}else{if(W.fetch&&W.AbortController)return this.fetchRequest(r,e,t,i,s,n,a);throw new Error("No suitable XMLHttpRequest implementation found")}}static fetchRequest(r,e,t,i,s,n,a){let o={method:r,headers:t,body:i},l=null;if(s){l=new AbortController;let c=setTimeout(()=>l.abort(),s);o.signal=l.signal}return W.fetch(e,o).then(c=>c.text()).then(c=>this.parseJSON(c)).then(c=>a&&a(c)).catch(c=>{c.name==="AbortError"&&n?n():a&&a(null)}),l}static xdomainRequest(r,e,t,i,s,n,a){return r.timeout=s,r.open(e,t),r.onload=()=>{let o=this.parseJSON(r.responseText);a&&a(o)},n&&(r.ontimeout=n),r.onprogress=()=>{},r.send(i),r}static xhrRequest(r,e,t,i,s,n,a,o){r.open(e,t,!0),r.timeout=n;for(let[l,c]of Object.entries(i))r.setRequestHeader(l,c);return r.onerror=()=>o&&o(null),r.onreadystatechange=()=>{if(r.readyState===ys.complete&&o){let l=this.parseJSON(r.responseText);o(l)}},a&&(r.ontimeout=a),r.send(s),r}static parseJSON(r){if(!r||r==="")return null;try{return JSON.parse(r)}catch{return console&&console.log("failed to parse JSON response",r),null}}static serialize(r,e){let t=[];for(var i in r){if(!Object.prototype.hasOwnProperty.call(r,i))continue;let s=e?`${e}[${i}]`:i,n=r[i];typeof n=="object"?t.push(this.serialize(n,s)):t.push(encodeURIComponent(s)+"="+encodeURIComponent(n))}return t.join("&")}static appendParams(r,e){if(Object.keys(e).length===0)return r;let t=r.match(/\?/)?"&":"?";return`${r}${t}${this.serialize(e)}`}},ws=r=>{let e="",t=new Uint8Array(r),i=t.byteLength;for(let s=0;s<i;s++)e+=String.fromCharCode(t[s]);return btoa(e)},be=class{constructor(r,e){e&&e.length===2&&e[1].startsWith(Vt)&&(this.authToken=atob(e[1].slice(Vt.length))),this.endPoint=null,this.token=null,this.skipHeartbeat=!0,this.reqs=new Set,this.awaitingBatchAck=!1,this.currentBatch=null,this.currentBatchTimer=null,this.batchBuffer=[],this.onopen=function(){},this.onerror=function(){},this.onmessage=function(){},this.onclose=function(){},this.pollEndpoint=this.normalizeEndpoint(r),this.readyState=V.connecting,setTimeout(()=>this.poll(),0)}normalizeEndpoint(r){return r.replace("ws://","http://").replace("wss://","https://").replace(new RegExp("(.*)/"+Wt.websocket),"$1/"+Wt.longpoll)}endpointURL(){return gt.appendParams(this.pollEndpoint,{token:this.token})}closeAndRetry(r,e,t){this.close(r,e,t),this.readyState=V.connecting}ontimeout(){this.onerror("timeout"),this.closeAndRetry(1005,"timeout",!1)}isActive(){return this.readyState===V.open||this.readyState===V.connecting}poll(){let r={Accept:"application/json"};this.authToken&&(r["X-Phoenix-AuthToken"]=this.authToken),this.ajax("GET",r,null,()=>this.ontimeout(),e=>{if(e){var{status:t,token:i,messages:s}=e;if(t===410&&this.token!==null){this.onerror(410),this.closeAndRetry(3410,"session_gone",!1);return}this.token=i}else t=0;switch(t){case 200:s.forEach(n=>{setTimeout(()=>this.onmessage({data:n}),0)}),this.poll();break;case 204:this.poll();break;case 410:this.readyState=V.open,this.onopen({}),this.poll();break;case 403:this.onerror(403),this.close(1008,"forbidden",!1);break;case 0:case 500:this.onerror(500),this.closeAndRetry(1011,"internal server error",500);break;default:throw new Error(`unhandled poll status ${t}`)}})}send(r){typeof r!="string"&&(r=ws(r)),this.currentBatch?this.currentBatch.push(r):this.awaitingBatchAck?this.batchBuffer.push(r):(this.currentBatch=[r],this.currentBatchTimer=setTimeout(()=>{this.batchSend(this.currentBatch),this.currentBatch=null},0))}batchSend(r,e=0){this.awaitingBatchAck=!0;let t=e+ms,i=r.slice(e,t);this.ajax("POST",{"Content-Type":"application/x-ndjson"},i.join(`
`),()=>this.onerror("timeout"),s=>{!s||s.status!==200?(this.awaitingBatchAck=!1,this.onerror(s&&s.status),this.closeAndRetry(1011,"internal server error",!1)):t<r.length?this.batchSend(r,t):this.batchBuffer.length>0?(this.batchSend(this.batchBuffer),this.batchBuffer=[]):this.awaitingBatchAck=!1})}close(r,e,t){for(let s of this.reqs)s.abort();this.readyState=V.closed;let i=Object.assign({code:1e3,reason:void 0,wasClean:!0},{code:r,reason:e,wasClean:t});this.batchBuffer=[],clearTimeout(this.currentBatchTimer),this.currentBatchTimer=null,typeof CloseEvent<"u"?this.onclose(new CloseEvent("close",i)):this.onclose(i)}ajax(r,e,t,i,s){let n,a=()=>{this.reqs.delete(n),i()};n=gt.request(r,this.endpointURL(),e,t,this.timeout,a,o=>{this.reqs.delete(n),this.isActive()&&s(o)}),this.reqs.add(n)}},Ur=class He{constructor(e,t={}){let i=t.events||{state:"presence_state",diff:"presence_diff"};this.state=Object.create(null),this.pendingDiffs=[],this.channel=e,this.joinRef=null,this.caller={onJoin:function(){},onLeave:function(){},onSync:function(){}},this.channel.on(i.state,s=>{let{onJoin:n,onLeave:a,onSync:o}=this.caller;this.joinRef=this.channel.joinRef(),this.state=He.syncState(this.state,s,n,a),this.pendingDiffs.forEach(l=>{this.state=He.syncDiff(this.state,l,n,a)}),this.pendingDiffs=[],o()}),this.channel.on(i.diff,s=>{let{onJoin:n,onLeave:a,onSync:o}=this.caller;this.inPendingSyncState()?this.pendingDiffs.push(s):(this.state=He.syncDiff(this.state,s,n,a),o())})}onJoin(e){this.caller.onJoin=e}onLeave(e){this.caller.onLeave=e}onSync(e){this.caller.onSync=e}list(e){return He.list(this.state,e)}inPendingSyncState(){return!this.joinRef||this.joinRef!==this.channel.joinRef()}static syncState(e,t,i,s){let n=this.toNullProtoObj(this.clone(e));t=this.toNullProtoObj(t);let a=Object.create(null),o=Object.create(null);return this.map(n,(l,c)=>{t[l]||(o[l]=c)}),this.map(t,(l,c)=>{let h=n[l];if(h){let d=c.metas.map(g=>g.phx_ref),f=h.metas.map(g=>g.phx_ref),u=c.metas.filter(g=>f.indexOf(g.phx_ref)<0),p=h.metas.filter(g=>d.indexOf(g.phx_ref)<0);u.length>0&&(a[l]=c,a[l].metas=u),p.length>0&&(o[l]=this.clone(h),o[l].metas=p)}else a[l]=c}),this.syncDiff(n,{joins:a,leaves:o},i,s)}static syncDiff(e,t,i,s){e=this.toNullProtoObj(e);let{joins:n,leaves:a}=this.clone(t);return i||(i=function(){}),s||(s=function(){}),this.map(n,(o,l)=>{let c=e[o];if(e[o]=this.clone(l),c){let h=e[o].metas.map(f=>f.phx_ref),d=c.metas.filter(f=>h.indexOf(f.phx_ref)<0);e[o].metas.unshift(...d)}i(o,c,l)}),this.map(a,(o,l)=>{let c=e[o];if(!c)return;let h=l.metas.map(d=>d.phx_ref);c.metas=c.metas.filter(d=>h.indexOf(d.phx_ref)<0),s(o,c,l),c.metas.length===0&&delete e[o]}),e}static list(e,t){return t||(t=function(i,s){return s}),this.map(e,(i,s)=>t(i,s))}static map(e,t){return Object.getOwnPropertyNames(e).map(i=>t(i,e[i]))}static toNullProtoObj(e){if(Object.getPrototypeOf(e)===null)return e;let t=Object.create(null);return Object.getOwnPropertyNames(e).forEach(i=>{t[i]=e[i]}),t}static clone(e){return JSON.parse(JSON.stringify(e))}},pt={HEADER_LENGTH:1,META_LENGTH:4,KINDS:{push:0,reply:1,broadcast:2},encode(r,e){if(r.payload.constructor===ArrayBuffer)return e(this.binaryEncode(r));{let t=[r.join_ref,r.ref,r.topic,r.event,r.payload];return e(JSON.stringify(t))}},decode(r,e){if(r.constructor===ArrayBuffer)return e(this.binaryDecode(r));{let[t,i,s,n,a]=JSON.parse(r);return e({join_ref:t,ref:i,topic:s,event:n,payload:a})}},binaryEncode(r){let{join_ref:e,ref:t,event:i,topic:s,payload:n}=r,a=new TextEncoder,o=a.encode(e),l=a.encode(t),c=a.encode(s),h=a.encode(i);this.assertFieldSize(o.byteLength,"join_ref"),this.assertFieldSize(l.byteLength,"ref"),this.assertFieldSize(c.byteLength,"topic"),this.assertFieldSize(h.byteLength,"event");let d=this.META_LENGTH+o.byteLength+l.byteLength+c.byteLength+h.byteLength,f=new ArrayBuffer(this.HEADER_LENGTH+d),u=new Uint8Array(f),p=new DataView(f),g=0;p.setUint8(g++,this.KINDS.push),p.setUint8(g++,o.byteLength),p.setUint8(g++,l.byteLength),p.setUint8(g++,c.byteLength),p.setUint8(g++,h.byteLength),u.set(o,g),g+=o.byteLength,u.set(l,g),g+=l.byteLength,u.set(c,g),g+=c.byteLength,u.set(h,g),g+=h.byteLength;var y=new Uint8Array(f.byteLength+n.byteLength);return y.set(u,0),y.set(new Uint8Array(n),f.byteLength),y.buffer},assertFieldSize(r,e){if(r>255)throw new Error(`unable to convert ${e} to binary: must be less than or equal to 255 bytes, but is ${r} bytes`)},binaryDecode(r){let e=new DataView(r),t=e.getUint8(0),i=new TextDecoder;switch(t){case this.KINDS.push:return this.decodePush(r,e,i);case this.KINDS.reply:return this.decodeReply(r,e,i);case this.KINDS.broadcast:return this.decodeBroadcast(r,e,i)}},decodePush(r,e,t){let i=e.getUint8(1),s=e.getUint8(2),n=e.getUint8(3),a=this.HEADER_LENGTH+this.META_LENGTH-1,o=t.decode(r.slice(a,a+i));a=a+i;let l=t.decode(r.slice(a,a+s));a=a+s;let c=t.decode(r.slice(a,a+n));a=a+n;let h=r.slice(a,r.byteLength);return{join_ref:o,ref:null,topic:l,event:c,payload:h}},decodeReply(r,e,t){let i=e.getUint8(1),s=e.getUint8(2),n=e.getUint8(3),a=e.getUint8(4),o=this.HEADER_LENGTH+this.META_LENGTH,l=t.decode(r.slice(o,o+i));o=o+i;let c=t.decode(r.slice(o,o+s));o=o+s;let h=t.decode(r.slice(o,o+n));o=o+n;let d=t.decode(r.slice(o,o+a));o=o+a;let f=r.slice(o,r.byteLength),u={status:d,response:f};return{join_ref:l,ref:c,topic:h,event:X.reply,payload:u}},decodeBroadcast(r,e,t){let i=e.getUint8(1),s=e.getUint8(2),n=this.HEADER_LENGTH+2,a=t.decode(r.slice(n,n+i));n=n+i;let o=t.decode(r.slice(n,n+s));n=n+s;let l=r.slice(n,r.byteLength);return{join_ref:null,ref:null,topic:a,event:o,payload:l}}},Hr=class{constructor(r,e={}){this.stateChangeCallbacks={open:[],close:[],error:[],message:[]},this.channels=[],this.sendBuffer=[],this.ref=0,this.fallbackRef=null,this.timeout=e.timeout||ps,this.transport=e.transport||W.WebSocket||be,this.conn=void 0,this.primaryPassedHealthCheck=!1,this.longPollFallbackMs=e.longPollFallbackMs,this.fallbackTimer=null;let t=null;try{t=W&&W.sessionStorage}catch{}this.sessionStore=e.sessionStorage||t,this.establishedConnections=0,this.defaultEncoder=pt.encode.bind(pt),this.defaultDecoder=pt.decode.bind(pt),this.closeWasClean=!0,this.disconnecting=!1,this.binaryType=e.binaryType||"arraybuffer",this.connectClock=1,this.pageHidden=!1,this.encode=void 0,this.decode=void 0,this.transport!==be?(this.encode=e.encode||this.defaultEncoder,this.decode=e.decode||this.defaultDecoder):(this.encode=this.defaultEncoder,this.decode=this.defaultDecoder);let i=null;_e&&_e.addEventListener&&(_e.addEventListener("pagehide",s=>{this.conn&&(this.disconnect(),i=this.connectClock)}),_e.addEventListener("pageshow",s=>{i===this.connectClock&&(i=null,this.connect())}),_e.addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"?this.pageHidden=!0:(this.pageHidden=!1,!this.isConnected()&&!this.closeWasClean&&this.teardown(()=>this.connect()))})),this.heartbeatIntervalMs=e.heartbeatIntervalMs||3e4,this.autoSendHeartbeat=e.autoSendHeartbeat??!0,this.heartbeatCallback=e.heartbeatCallback??(()=>{}),this.rejoinAfterMs=s=>e.rejoinAfterMs?e.rejoinAfterMs(s):[1e3,2e3,5e3][s-1]||1e4,this.reconnectAfterMs=s=>e.reconnectAfterMs?e.reconnectAfterMs(s):[10,50,100,150,200,250,500,1e3,2e3][s-1]||5e3,this.logger=e.logger||null,!this.logger&&e.debug&&(this.logger=(s,n,a)=>{console.log(`${s}: ${n}`,a)}),this.longpollerTimeout=e.longpollerTimeout||2e4,this.params=xe(e.params||{}),this.endPoint=`${r}/${Wt.websocket}`,this.vsn=e.vsn||fs,this.heartbeatTimeoutTimer=null,this.heartbeatTimer=null,this.heartbeatSentAt=null,this.pendingHeartbeatRef=null,this.reconnectTimer=new Mr(()=>{if(this.pageHidden){this.log("Not reconnecting as page is hidden!"),this.teardown();return}this.teardown(async()=>{e.beforeReconnect&&await e.beforeReconnect(),this.connect()})},this.reconnectAfterMs),this.authToken=e.authToken&&xe(e.authToken)}getLongPollTransport(){return be}replaceTransport(r){this.connectClock++,this.closeWasClean=!0,clearTimeout(this.fallbackTimer),this.reconnectTimer.reset(),this.conn&&(this.conn.close(),this.conn=null),this.transport=r}protocol(){return location.protocol.match(/^https/)?"wss":"ws"}endPointURL(){let r=gt.appendParams(gt.appendParams(this.endPoint,this.params()),{vsn:this.vsn});return r.charAt(0)!=="/"?r:r.charAt(1)==="/"?`${this.protocol()}:${r}`:`${this.protocol()}://${location.host}${r}`}disconnect(r,e,t){this.connectClock++,this.disconnecting=!0,this.closeWasClean=!0,clearTimeout(this.fallbackTimer),this.reconnectTimer.reset(),this.teardown(()=>{this.disconnecting=!1,r&&r()},e,t)}connect(r){r&&(console&&console.log("passing params to connect is deprecated. Instead pass :params to the Socket constructor"),this.params=xe(r)),!(this.conn&&!this.disconnecting)&&(this.longPollFallbackMs&&this.transport!==be?this.connectWithFallback(be,this.longPollFallbackMs):this.transportConnect())}log(r,e,t){this.logger&&this.logger(r,e,t)}hasLogger(){return this.logger!==null}onOpen(r){let e=this.makeRef();return this.stateChangeCallbacks.open.push([e,r]),e}onClose(r){let e=this.makeRef();return this.stateChangeCallbacks.close.push([e,r]),e}onError(r){let e=this.makeRef();return this.stateChangeCallbacks.error.push([e,r]),e}onMessage(r){let e=this.makeRef();return this.stateChangeCallbacks.message.push([e,r]),e}onHeartbeat(r){this.heartbeatCallback=r}ping(r){if(!this.isConnected())return!1;let e=this.makeRef(),t=Date.now();this.push({topic:"phoenix",event:"heartbeat",payload:{},ref:e});let i=this.onMessage(s=>{s.ref===e&&(this.off([i]),r(Date.now()-t))});return!0}transportName(r){return r===be?"LongPoll":r.name}transportConnect(){this.connectClock++,this.closeWasClean=!1;let r;this.authToken&&(r=["phoenix",`${Vt}${btoa(this.authToken()).replace(/=/g,"")}`]),this.conn=new this.transport(this.endPointURL(),r),this.conn.binaryType=this.binaryType,this.conn.timeout=this.longpollerTimeout,this.conn.onopen=()=>this.onConnOpen(),this.conn.onerror=e=>this.onConnError(e),this.conn.onmessage=e=>this.onConnMessage(e),this.conn.onclose=e=>this.onConnClose(e)}getSession(r){return this.sessionStore&&this.sessionStore.getItem(r)}storeSession(r,e){this.sessionStore&&this.sessionStore.setItem(r,e)}connectWithFallback(r,e=2500){clearTimeout(this.fallbackTimer);let t=!1,i=!0,s,n,a=this.transportName(r),o=l=>{this.log("transport",`falling back to ${a}...`,l),this.off([s,n]),i=!1,this.replaceTransport(r),this.transportConnect()};if(this.getSession(`phx:fallback:${a}`))return o("memorized");this.fallbackTimer=setTimeout(o,e),n=this.onError(l=>{this.log("transport","error",l),i&&!t&&(clearTimeout(this.fallbackTimer),o(l))}),this.fallbackRef&&this.off([this.fallbackRef]),this.fallbackRef=this.onOpen(()=>{if(t=!0,!i){let l=this.transportName(r);return this.primaryPassedHealthCheck||this.storeSession(`phx:fallback:${l}`,"true"),this.log("transport",`established ${l} fallback`)}clearTimeout(this.fallbackTimer),this.fallbackTimer=setTimeout(o,e),this.ping(l=>{this.log("transport","connected to primary after",l),this.primaryPassedHealthCheck=!0,clearTimeout(this.fallbackTimer)})}),this.transportConnect()}clearHeartbeats(){clearTimeout(this.heartbeatTimer),clearTimeout(this.heartbeatTimeoutTimer)}onConnOpen(){this.hasLogger()&&this.log("transport",`connected to ${this.endPointURL()}`),this.closeWasClean=!1,this.disconnecting=!1,this.establishedConnections++,this.flushSendBuffer(),this.reconnectTimer.reset(),this.autoSendHeartbeat&&this.resetHeartbeat(),this.triggerStateCallbacks("open")}heartbeatTimeout(){if(this.pendingHeartbeatRef){this.pendingHeartbeatRef=null,this.heartbeatSentAt=null,this.hasLogger()&&this.log("transport","heartbeat timeout. Attempting to re-establish connection");try{this.heartbeatCallback("timeout")}catch(r){this.log("error","error in heartbeat callback",r)}this.triggerChanError(new Error("heartbeat timeout")),this.closeWasClean=!1,this.teardown(()=>this.reconnectTimer.scheduleTimeout(),gs,"heartbeat timeout")}}resetHeartbeat(){this.conn&&this.conn.skipHeartbeat||(this.pendingHeartbeatRef=null,this.clearHeartbeats(),this.heartbeatTimer=setTimeout(()=>this.sendHeartbeat(),this.heartbeatIntervalMs))}teardown(r,e,t){if(!this.conn)return r&&r();let i=this.conn;this.waitForBufferDone(i,()=>{e?i.close(e,t||""):i.close(),this.waitForSocketClosed(i,()=>{this.conn===i&&(this.conn.onopen=function(){},this.conn.onerror=function(){},this.conn.onmessage=function(){},this.conn.onclose=function(){},this.conn=null),r&&r()})})}waitForBufferDone(r,e,t=1){if(t===5||!r.bufferedAmount){e();return}setTimeout(()=>{this.waitForBufferDone(r,e,t+1)},150*t)}waitForSocketClosed(r,e,t=1){if(t===5||r.readyState===V.closed){e();return}setTimeout(()=>{this.waitForSocketClosed(r,e,t+1)},150*t)}onConnClose(r){this.conn&&(this.conn.onclose=()=>{}),this.hasLogger()&&this.log("transport","close",r),this.triggerChanError(r),this.clearHeartbeats(),this.closeWasClean||this.reconnectTimer.scheduleTimeout(),this.triggerStateCallbacks("close",r)}onConnError(r){this.hasLogger()&&this.log("transport","error",r);let e=this.transport,t=this.establishedConnections;this.triggerStateCallbacks("error",r,e,t),(e===this.transport||t>0)&&this.triggerChanError(r)}triggerChanError(r){this.channels.forEach(e=>{e.isErrored()||e.isLeaving()||e.isClosed()||e.trigger(X.error,r)})}connectionState(){switch(this.conn&&this.conn.readyState){case V.connecting:return"connecting";case V.open:return"open";case V.closing:return"closing";default:return"closed"}}isConnected(){return this.connectionState()==="open"}remove(r){this.off(r.stateChangeRefs),this.channels=this.channels.filter(e=>e!==r)}off(r){for(let e in this.stateChangeCallbacks)this.stateChangeCallbacks[e]=this.stateChangeCallbacks[e].filter(([t])=>r.indexOf(t)===-1)}channel(r,e={}){let t=new vs(r,e,this);return this.channels.push(t),t}push(r){if(this.hasLogger()){let{topic:e,event:t,payload:i,ref:s,join_ref:n}=r;this.log("push",`${e} ${t} (${n}, ${s})`,i)}this.isConnected()?this.encode(r,e=>this.conn.send(e)):this.sendBuffer.push(()=>this.encode(r,e=>this.conn.send(e)))}makeRef(){let r=this.ref+1;return r===this.ref?this.ref=0:this.ref=r,this.ref.toString()}sendHeartbeat(){if(!this.isConnected()){try{this.heartbeatCallback("disconnected")}catch(r){this.log("error","error in heartbeat callback",r)}return}if(this.pendingHeartbeatRef){this.heartbeatTimeout();return}this.pendingHeartbeatRef=this.makeRef(),this.heartbeatSentAt=Date.now(),this.push({topic:"phoenix",event:"heartbeat",payload:{},ref:this.pendingHeartbeatRef});try{this.heartbeatCallback("sent")}catch(r){this.log("error","error in heartbeat callback",r)}this.heartbeatTimeoutTimer=setTimeout(()=>this.heartbeatTimeout(),this.heartbeatIntervalMs)}flushSendBuffer(){this.isConnected()&&this.sendBuffer.length>0&&(this.sendBuffer.forEach(r=>r()),this.sendBuffer=[])}onConnMessage(r){this.decode(r.data,e=>{let{topic:t,event:i,payload:s,ref:n,join_ref:a}=e;if(n&&n===this.pendingHeartbeatRef){let o=this.heartbeatSentAt?Date.now()-this.heartbeatSentAt:void 0;this.clearHeartbeats();try{this.heartbeatCallback(s.status==="ok"?"ok":"error",o)}catch(l){this.log("error","error in heartbeat callback",l)}this.pendingHeartbeatRef=null,this.heartbeatSentAt=null,this.autoSendHeartbeat&&(this.heartbeatTimer=setTimeout(()=>this.sendHeartbeat(),this.heartbeatIntervalMs))}this.hasLogger()&&this.log("receive",`${s.status||""} ${t} ${i} ${n&&"("+n+")"||""}`.trim(),s);for(let o=0;o<this.channels.length;o++){let l=this.channels[o];l.isMember(t,i,s,a)&&l.trigger(i,s,n,a)}this.triggerStateCallbacks("message",e)})}triggerStateCallbacks(r,...e){try{this.stateChangeCallbacks[r].forEach(([t,i])=>{try{i(...e)}catch(s){this.log("error",`error in ${r} callback`,s)}})}catch(t){this.log("error",`error triggering ${r} callbacks`,t)}}leaveOpenTopic(r){let e=this.channels.find(t=>t.topic===r&&(t.isJoined()||t.isJoining()));e&&(this.hasLogger()&&this.log("transport",`leaving duplicate topic "${r}"`),e.leave())}};var De=class r{constructor(e,t){let i=_s(t);this.presence=new Ur(e.getChannel(),i),this.presence.onJoin((s,n,a)=>{let o=r.onJoinPayload(s,n,a);e.getChannel().trigger("presence",o)}),this.presence.onLeave((s,n,a)=>{let o=r.onLeavePayload(s,n,a);e.getChannel().trigger("presence",o)}),this.presence.onSync(()=>{e.getChannel().trigger("presence",{event:"sync"})})}get state(){return r.transformState(this.presence.state)}static transformState(e){return e=bs(e),Object.getOwnPropertyNames(e).reduce((t,i)=>{let s=e[i];return t[i]=mt(s),t},{})}static onJoinPayload(e,t,i){let s=Dr(t),n=mt(i);return{event:"join",key:e,currentPresences:s,newPresences:n}}static onLeavePayload(e,t,i){let s=Dr(t),n=mt(i);return{event:"leave",key:e,currentPresences:s,leftPresences:n}}};function mt(r){return r.metas.map(e=>{let t=Object.getOwnPropertyDescriptors(e),i=Object.defineProperties({},t);return i.presence_ref=i.phx_ref,delete i.phx_ref,delete i.phx_ref_prev,i})}function bs(r){return JSON.parse(JSON.stringify(r))}function _s(r){return r?.events&&{events:r.events}}function Dr(r){return r?.metas?mt(r):[]}var Kt;(function(r){r.SYNC="sync",r.JOIN="join",r.LEAVE="leave"})(Kt||(Kt={}));var ke=class{get state(){return this.presenceAdapter.state}constructor(e,t){this.channel=e,this.presenceAdapter=new De(this.channel.channelAdapter,t)}};function qr(r){if(r instanceof Error)return r;if(typeof r=="string")return new Error(r);if(r&&typeof r=="object"){let e=r;if(typeof e.code=="number"){let t=typeof e.reason=="string"&&e.reason?` (${e.reason})`:"";return new Error(`socket closed: ${e.code}${t}`,{cause:r})}return new Error("channel error: transport failure",{cause:r})}return new Error("channel error: connection lost")}var qe=class{constructor(e,t,i){let s=xs(i);this.channel=e.getSocket().channel(t,s),this.socket=e}get state(){return this.channel.state}set state(e){this.channel.state=e}get joinedOnce(){return this.channel.joinedOnce}get joinPush(){return this.channel.joinPush}get rejoinTimer(){return this.channel.rejoinTimer}on(e,t){return this.channel.on(e,t)}off(e,t){this.channel.off(e,t)}subscribe(e){return this.channel.join(e)}unsubscribe(e){return this.channel.leave(e)}teardown(){this.channel.teardown()}onClose(e){this.channel.onClose(e)}onError(e){return this.channel.onError(e)}push(e,t,i){let s;try{s=this.channel.push(e,t,i)}catch{throw new Error(`tried to push '${e}' to '${this.channel.topic}' before joining. Use channel.subscribe() before pushing events`)}if(this.channel.pushBuffer.length>Br){let n=this.channel.pushBuffer.shift();n.cancelTimeout(),this.socket.log("channel",`discarded push due to buffer overflow: ${n.event}`,n.payload())}return s}updateJoinPayload(e){let t=this.channel.joinPush.payload();this.channel.joinPush.payload=()=>Object.assign(Object.assign({},t),e)}canPush(){return this.socket.isConnected()&&this.state===z.joined}isJoined(){return this.state===z.joined}isJoining(){return this.state===z.joining}isClosed(){return this.state===z.closed}isLeaving(){return this.state===z.leaving}updateFilterBindings(e){this.channel.filterBindings=e}updatePayloadTransform(e){this.channel.onMessage=e}getChannel(){return this.channel}};function xs(r){return{config:Object.assign({broadcast:{ack:!1,self:!1},presence:{key:"",enabled:!1},private:!1},r.config)}}var ks=/[,()"\\]/,Es=r=>ks.test(r)||r!==r.trim(),Ss=r=>`"${r.replace(/\\/g,"\\\\").replace(/"/g,'\\"')}"`,Fr=r=>{let e=r===null?"null":String(r);return Es(e)?Ss(e):e},Ts=r=>r===null?"null":String(r),As=(r,e)=>{if(r==="in"){let t=Array.isArray(e)?e:[e];if(t.length===0)throw new Error("Realtime `in` filter requires at least one value.");return`in.(${Array.from(new Set(t)).map(s=>Fr(s)).join(",")})`}return r==="is"?`is.${Ts(e)}`:`${r}.${Fr(e)}`},Ee=class{constructor(){this.filters=[]}add(e,t,i,s=!1){let n=s?"not.":"";return this.filters.push(`${e}=${n}${As(t,i)}`),this}eq(e,t){return this.add(e,"eq",t)}neq(e,t){return this.add(e,"neq",t)}gt(e,t){return this.add(e,"gt",t)}gte(e,t){return this.add(e,"gte",t)}lt(e,t){return this.add(e,"lt",t)}lte(e,t){return this.add(e,"lte",t)}in(e,t){return this.add(e,"in",t)}like(e,t){return this.add(e,"like",t)}ilike(e,t){return this.add(e,"ilike",t)}match(e,t){return this.add(e,"match",t)}imatch(e,t){return this.add(e,"imatch",t)}is(e,t){return this.add(e,"is",t)}isDistinct(e,t){return this.add(e,"isdistinct",t)}not(e,t,i){return this.add(e,t,i,!0)}build(){return this.filters.join(",")}toString(){return this.build()}};var Gt;(function(r){r.ALL="*",r.INSERT="INSERT",r.UPDATE="UPDATE",r.DELETE="DELETE"})(Gt||(Gt={}));var re;(function(r){r.BROADCAST="broadcast",r.PRESENCE="presence",r.POSTGRES_CHANGES="postgres_changes",r.SYSTEM="system"})(re||(re={}));var K;(function(r){r.SUBSCRIBED="SUBSCRIBED",r.TIMED_OUT="TIMED_OUT",r.CLOSED="CLOSED",r.CHANNEL_ERROR="CHANNEL_ERROR"})(K||(K={}));var Se=class r{get state(){return this.channelAdapter.state}set state(e){this.channelAdapter.state=e}get joinedOnce(){return this.channelAdapter.joinedOnce}get timeout(){return this.socket.timeout}get joinPush(){return this.channelAdapter.joinPush}get rejoinTimer(){return this.channelAdapter.rejoinTimer}constructor(e,t={config:{}},i){var s,n;if(this.topic=e,this.params=t,this.socket=i,this.bindings={},this.subTopic=e.replace(/^realtime:/i,""),this.params.config=Object.assign({broadcast:{ack:!1,self:!1},presence:{key:"",enabled:!1},private:!1},t.config),this.channelAdapter=new qe(this.socket.socketAdapter,e,this.params),this.presence=new ke(this),this._onClose(()=>{this.socket._remove(this)}),this._updateFilterTransform(),this.broadcastEndpointURL=ut(this.socket.socketAdapter.endPointURL()),this.private=this.params.config.private||!1,!this.private&&(!((n=(s=this.params.config)===null||s===void 0?void 0:s.broadcast)===null||n===void 0)&&n.replay))throw new Error(`tried to use replay on public channel '${this.topic}'. It must be a private channel.`)}subscribe(e,t=this.timeout){var i,s,n;if(this.socket.isConnected()||this.socket.connect(),this.channelAdapter.isClosed()){let{config:{broadcast:a,presence:o,private:l}}=this.params,c=(s=(i=this.bindings.postgres_changes)===null||i===void 0?void 0:i.map(u=>u.filter))!==null&&s!==void 0?s:[],h=!!this.bindings[re.PRESENCE]&&this.bindings[re.PRESENCE].length>0||((n=this.params.config.presence)===null||n===void 0?void 0:n.enabled)===!0,d={},f={broadcast:a,presence:Object.assign(Object.assign({},o),{enabled:h}),postgres_changes:c,private:l};this.socket.accessTokenValue&&(d.access_token=this.socket.accessTokenValue),this._onError(u=>{e?.(K.CHANNEL_ERROR,qr(u))}),this._onClose(()=>e?.(K.CLOSED)),this.updateJoinPayload(Object.assign({config:f},d)),this._updateFilterMessage(),this.channelAdapter.subscribe(t).receive("ok",async({postgres_changes:u})=>{if(this.socket._isManualToken()||this.socket.setAuth(),u===void 0){e?.(K.SUBSCRIBED);return}this._updatePostgresBindings(u,e)}).receive("error",u=>{this.state=z.errored;let p=Object.values(u).join(", ")||"error";e?.(K.CHANNEL_ERROR,new Error(p,{cause:u}))}).receive("timeout",()=>{e?.(K.TIMED_OUT)})}return this}_updatePostgresBindings(e,t){var i;let s=this.bindings.postgres_changes,n=(i=s?.length)!==null&&i!==void 0?i:0,a=[];for(let o=0;o<n;o++){let l=s[o],{filter:{event:c,schema:h,table:d,filter:f}}=l,u=e&&e[o];if(u&&u.event===c&&r.isFilterValueEqual(u.schema,h)&&r.isFilterValueEqual(u.table,d)&&r.isFilterValueEqual(u.filter,f))a.push(Object.assign(Object.assign({},l),{id:u.id}));else{this.unsubscribe(),this.state=z.errored,t?.(K.CHANNEL_ERROR,new Error("mismatch between server and client bindings for postgres changes"));return}}this.bindings.postgres_changes=a,this.state!=z.errored&&t&&t(K.SUBSCRIBED)}presenceState(){return this.presence.state}async track(e,t={}){return await this.send({type:"presence",event:"track",payload:e},t)}async untrack(e={}){return await this.send({type:"presence",event:"untrack"},e)}on(e,t,i){let s=this.channelAdapter.isJoined()||this.channelAdapter.isJoining(),n=e===re.PRESENCE||e===re.POSTGRES_CHANGES;if(s&&n)throw this.socket.log("channel",`cannot add \`${e}\` callbacks for ${this.topic} after \`subscribe()\`.`),new Error(`cannot add \`${e}\` callbacks for ${this.topic} after \`subscribe()\`.`);return this._on(e,t,i)}async httpSend(e,t,i={}){var s;if(t==null)return Promise.reject(new Error("Payload is required for httpSend()"));let n=t instanceof ArrayBuffer||ArrayBuffer.isView(t),a={apikey:this.socket.apiKey?this.socket.apiKey:"","Content-Type":n?"application/octet-stream":"application/json"};this.socket.accessTokenValue&&(a.Authorization=`Bearer ${this.socket.accessTokenValue}`);let o=new URL(this.broadcastEndpointURL);o.pathname+=`/${encodeURIComponent(this.subTopic)}/events/${encodeURIComponent(e)}`,this.private&&o.searchParams.set("private","true");let l={method:"POST",headers:a,body:n?t:JSON.stringify(t)},c=await this._fetchWithTimeout(o.toString(),l,(s=i.timeout)!==null&&s!==void 0?s:this.timeout);if(c.status===202)return{success:!0};if(c.status===404)return Promise.reject(new Error("httpSend() requires Realtime server v2.97.0 or newer; the endpoint returned 404. Update your Supabase CLI to a recent version, or upgrade the Realtime server in your self-hosted setup. See https://github.com/supabase/supabase-js/blob/master/packages/core/realtime-js/migrations/httpsend-server-version.md"));let h=c.statusText;try{let d=await c.json();h=d.error||d.message||h}catch{}return Promise.reject(new Error(h))}async send(e,t={}){var i,s;if(!this.channelAdapter.canPush()&&e.type==="broadcast"){let n="Realtime send() is automatically falling back to REST API. This behavior will be deprecated in the future. Please use httpSend() explicitly for REST delivery.";this.socket.hasLogger()?this.socket.log("channel",n):console.warn(n);let{event:a,payload:o}=e,l={apikey:this.socket.apiKey?this.socket.apiKey:"","Content-Type":"application/json"};this.socket.accessTokenValue&&(l.Authorization=`Bearer ${this.socket.accessTokenValue}`);let c={method:"POST",headers:l,body:JSON.stringify({messages:[{topic:this.subTopic,event:a,payload:o,private:this.private}]})};try{let h=await this._fetchWithTimeout(this.broadcastEndpointURL,c,(i=t.timeout)!==null&&i!==void 0?i:this.timeout);return await((s=h.body)===null||s===void 0?void 0:s.cancel()),h.ok?"ok":"error"}catch(h){return h instanceof Error&&h.name==="AbortError"?"timed out":"error"}}else return new Promise(n=>{var a,o,l;let c=this.channelAdapter.push(e.type,e,t.timeout||this.timeout);e.type==="broadcast"&&!(!((l=(o=(a=this.params)===null||a===void 0?void 0:a.config)===null||o===void 0?void 0:o.broadcast)===null||l===void 0)&&l.ack)&&n("ok"),c.receive("ok",()=>n("ok")),c.receive("error",()=>n("error")),c.receive("timeout",()=>n("timed out"))})}updateJoinPayload(e){this.channelAdapter.updateJoinPayload(e)}async unsubscribe(e=this.timeout){return new Promise(t=>{this.channelAdapter.unsubscribe(e).receive("ok",()=>t("ok")).receive("timeout",()=>t("timed out")).receive("error",()=>t("error"))})}teardown(){this.channelAdapter.teardown()}async _fetchWithTimeout(e,t,i){let s=new AbortController,n=setTimeout(()=>s.abort(),i),a=await this.socket.fetch(e,Object.assign(Object.assign({},t),{signal:s.signal}));return clearTimeout(n),a}_on(e,t,i){var s;let n=e.toLocaleLowerCase(),a=t?.filter;if((a instanceof Ee||typeof a=="object"&&a!==null&&typeof a.build=="function")&&(t=Object.assign(Object.assign({},t),{filter:a.build()})),n===re.POSTGRES_CHANGES&&((s=this.bindings[n])===null||s===void 0?void 0:s.find(h=>r.isSamePostgresFilter(h.filter,t))))return this.socket.log("error",`duplicate \`postgres_changes\` binding for ${this.topic} ignored`,t),this;let o=this.channelAdapter.on(e,i),l={type:n,filter:t,callback:i,ref:o};return this.bindings[n]?this.bindings[n].push(l):this.bindings[n]=[l],this._updateFilterMessage(),this}_onClose(e){this.channelAdapter.onClose(e)}_onError(e){this.channelAdapter.onError(e)}_updateFilterMessage(){this.channelAdapter.updateFilterBindings((e,t,i)=>{var s,n,a,o,l,c,h;let d=e.event.toLocaleLowerCase();if(this._notThisChannelEvent(d,i))return!1;let f=(s=this.bindings[d])===null||s===void 0?void 0:s.find(u=>u.ref===e.ref);if(!f)return!0;if(["broadcast","presence","postgres_changes"].includes(d))if("id"in f){let u=f.id,p=(n=f.filter)===null||n===void 0?void 0:n.event;return u&&((a=t.ids)===null||a===void 0?void 0:a.includes(u))&&(p==="*"||p?.toLocaleLowerCase()===((o=t.data)===null||o===void 0?void 0:o.type.toLocaleLowerCase()))}else{let u=(c=(l=f?.filter)===null||l===void 0?void 0:l.event)===null||c===void 0?void 0:c.toLocaleLowerCase();return u==="*"||u===((h=t?.event)===null||h===void 0?void 0:h.toLocaleLowerCase())}else return f.type.toLocaleLowerCase()===d})}_notThisChannelEvent(e,t){let{close:i,error:s,leave:n,join:a}=dt;return t&&[i,s,n,a].includes(e)&&t!==this.joinPush.ref}_updateFilterTransform(){this.channelAdapter.updatePayloadTransform((e,t,i)=>{if(typeof t=="object"&&"ids"in t){let s=t.data,{schema:n,table:a,commit_timestamp:o,type:l,errors:c}=s;return Object.assign(Object.assign({},{schema:n,table:a,commit_timestamp:o,eventType:l,new:{},old:{},errors:c}),this._getPayloadRecords(s))}return t})}copyBindings(e){if(this.joinedOnce)throw new Error("cannot copy bindings into joined channel");for(let t in e.bindings)for(let i of e.bindings[t])this._on(i.type,i.filter,i.callback)}static isFilterValueEqual(e,t){return(e??void 0)===(t??void 0)}static isSamePostgresFilter(e,t){var i,s,n,a;let o=(s=(i=e?.select)===null||i===void 0?void 0:i.join())!==null&&s!==void 0?s:void 0,l=(a=(n=t?.select)===null||n===void 0?void 0:n.join())!==null&&a!==void 0?a:void 0;return e?.event===t?.event&&r.isFilterValueEqual(e?.schema,t?.schema)&&r.isFilterValueEqual(e?.table,t?.table)&&r.isFilterValueEqual(e?.filter,t?.filter)&&o===l}_getPayloadRecords(e){let t={new:{},old:{}};return(e.type==="INSERT"||e.type==="UPDATE")&&(t.new=zt(e.columns,e.record)),(e.type==="UPDATE"||e.type==="DELETE")&&(t.old=zt(e.columns,e.old_record)),t}};var Fe=class{constructor(e,t){this.socket=new Hr(e,t)}get timeout(){return this.socket.timeout}get endPoint(){return this.socket.endPoint}get transport(){return this.socket.transport}get heartbeatIntervalMs(){return this.socket.heartbeatIntervalMs}get heartbeatCallback(){return this.socket.heartbeatCallback}set heartbeatCallback(e){this.socket.heartbeatCallback=e}get heartbeatTimer(){return this.socket.heartbeatTimer}get pendingHeartbeatRef(){return this.socket.pendingHeartbeatRef}get reconnectTimer(){return this.socket.reconnectTimer}get vsn(){return this.socket.vsn}get encode(){return this.socket.encode}get decode(){return this.socket.decode}get reconnectAfterMs(){return this.socket.reconnectAfterMs}get sendBuffer(){return this.socket.sendBuffer}get stateChangeCallbacks(){return this.socket.stateChangeCallbacks}connect(){this.socket.connect()}disconnect(e,t,i,s=1e4){return new Promise(n=>{setTimeout(()=>n("timeout"),s),this.socket.disconnect(()=>{e(),n("ok")},t,i)})}push(e){this.socket.push(e)}log(e,t,i){this.socket.log(e,t,i)}hasLogger(){return this.socket.hasLogger()}makeRef(){return this.socket.makeRef()}onOpen(e){this.socket.onOpen(e)}onClose(e){this.socket.onClose(e)}onError(e){this.socket.onError(e)}onMessage(e){this.socket.onMessage(e)}isConnected(){return this.socket.isConnected()}isConnecting(){return this.socket.connectionState()==Me.connecting}isDisconnecting(){return this.socket.connectionState()==Me.closing}connectionState(){return this.socket.connectionState()}endPointURL(){return this.socket.endPointURL()}sendHeartbeat(){this.socket.sendHeartbeat()}getSocket(){return this.socket}};var zr={HEARTBEAT_INTERVAL:25e3,RECONNECT_DELAY:10,HEARTBEAT_TIMEOUT_FALLBACK:100},Is=[1e3,2e3,5e3,1e4],Rs=1e4;function Os(){let r=new Map;return{get length(){return r.size},clear(){r.clear()},getItem(e){return r.has(e)?r.get(e):null},key(e){var t;return(t=Array.from(r.keys())[e])!==null&&t!==void 0?t:null},removeItem(e){r.delete(e)},setItem(e,t){r.set(e,String(t))}}}function Ps(){try{if(typeof globalThis<"u"&&globalThis.sessionStorage)return globalThis.sessionStorage}catch{}return Os()}var Ls=`
  addEventListener("message", (e) => {
    if (e.data.event === "start") {
      setInterval(() => postMessage({ event: "keepAlive" }), e.data.interval);
    }
  });`,Te=class{get endPoint(){return this.socketAdapter.endPoint}get timeout(){return this.socketAdapter.timeout}get transport(){return this.socketAdapter.transport}get heartbeatCallback(){return this.socketAdapter.heartbeatCallback}get heartbeatIntervalMs(){return this.socketAdapter.heartbeatIntervalMs}get heartbeatTimer(){return this.worker?this._workerHeartbeatTimer:this.socketAdapter.heartbeatTimer}get pendingHeartbeatRef(){return this.worker?this._pendingWorkerHeartbeatRef:this.socketAdapter.pendingHeartbeatRef}get reconnectTimer(){return this.socketAdapter.reconnectTimer}get vsn(){return this.socketAdapter.vsn}get encode(){return this.socketAdapter.encode}get decode(){return this.socketAdapter.decode}get reconnectAfterMs(){return this.socketAdapter.reconnectAfterMs}get sendBuffer(){return this.socketAdapter.sendBuffer}get stateChangeCallbacks(){return this.socketAdapter.stateChangeCallbacks}constructor(e,t){var i;if(this.channels=new Array,this.accessTokenValue=null,this.accessToken=null,this.apiKey=null,this.httpEndpoint="",this.headers={},this.params={},this.ref=0,this.serializer=new Ue,this._manuallySetToken=!1,this._authPromise=null,this._authGeneration=0,this._workerHeartbeatTimer=void 0,this._pendingWorkerHeartbeatRef=null,this._pendingDisconnectTimer=null,this._disconnectOnEmptyChannelsAfterMs=0,this._resolveFetch=n=>n?(...a)=>n(...a):(...a)=>fetch(...a),!(!((i=t?.params)===null||i===void 0)&&i.apikey))throw new Error("API key is required to connect to Realtime");this.apiKey=t.params.apikey;let s=this._initializeOptions(t);this.socketAdapter=new Fe(e,s),this.httpEndpoint=ut(e),this.fetch=this._resolveFetch(t?.fetch)}connect(){if(!(this.isConnecting()||this.isDisconnecting()||this.isConnected())){this.accessToken&&!this._authPromise&&this._setAuthSafely("connect"),this._setupConnectionHandlers();try{this.socketAdapter.connect()}catch(e){let t=e.message;throw new Error(`WebSocket not available: ${t}`)}this._handleNodeJsRaceCondition()}}endpointURL(){return this.socketAdapter.endPointURL()}async disconnect(e,t){return this._cancelPendingDisconnect(),this.isDisconnecting()?"ok":await this.socketAdapter.disconnect(()=>{clearInterval(this._workerHeartbeatTimer),this._terminateWorker()},e,t)}getChannels(){return this.channels}async removeChannel(e){let t=await e.unsubscribe();return t==="ok"&&e.teardown(),t}async removeAllChannels(){let e=this.channels.map(async i=>{let s=await i.unsubscribe();return i.teardown(),s}),t=await Promise.all(e);return await this.disconnect(),t}log(e,t,i){this.socketAdapter.log(e,t,i)}hasLogger(){return this.socketAdapter.hasLogger()}connectionState(){return this.socketAdapter.connectionState()||Me.closed}isConnected(){return this.socketAdapter.isConnected()}isConnecting(){return this.socketAdapter.isConnecting()}isDisconnecting(){return this.socketAdapter.isDisconnecting()}channel(e,t={config:{}}){let i=`realtime:${e}`,s=this.getChannels().find(n=>n.topic===i);if(s)return s;{let n=new Se(`realtime:${e}`,t,this);return this._cancelPendingDisconnect(),this.channels.push(n),n}}push(e){this.socketAdapter.push(e)}async setAuth(e=null){let t=++this._authGeneration,i=this._performAuth(e,t);t===this._authGeneration&&(this._authPromise=i);try{await i}finally{this._authPromise===i&&(this._authPromise=null)}}_isManualToken(){return this._manuallySetToken}async sendHeartbeat(){this.socketAdapter.sendHeartbeat()}onHeartbeat(e){this.socketAdapter.heartbeatCallback=this._wrapHeartbeatCallback(e)}_makeRef(){return this.socketAdapter.makeRef()}_remove(e){this.channels=this.channels.filter(t=>t.topic!==e.topic),this.channels.length===0&&(this.log("transport","no channels remaining, scheduling disconnect"),this._schedulePendingDisconnect())}_schedulePendingDisconnect(){if(this._cancelPendingDisconnect(),this._disconnectOnEmptyChannelsAfterMs===0){this.log("transport","disconnecting immediately - no channels"),this.disconnect();return}this._pendingDisconnectTimer=setTimeout(()=>{this._pendingDisconnectTimer=null,this.channels.length===0&&(this.log("transport","deferred disconnect fired - no channels, disconnecting"),this.disconnect())},this._disconnectOnEmptyChannelsAfterMs),this.log("transport",`deferred disconnect scheduled in ${this._disconnectOnEmptyChannelsAfterMs}ms`)}_cancelPendingDisconnect(){this._pendingDisconnectTimer!==null&&(this.log("transport","pending disconnect cancelled - channel activity detected"),clearTimeout(this._pendingDisconnectTimer),this._pendingDisconnectTimer=null)}async _performAuth(e,t){let i,s=!1;if(e)i=e,s=!0;else if(this.accessToken)try{i=await this.accessToken()}catch(n){this.log("error","Error fetching access token from callback",n),i=this.accessTokenValue}else i=this.accessTokenValue;t===this._authGeneration&&(this.accessToken?this._manuallySetToken=!1:s&&(this._manuallySetToken=!0),this.accessTokenValue!=i&&(this.accessTokenValue=i,this.channels.forEach(n=>{let a={access_token:i,version:Pr};n.updateJoinPayload(a),n.joinedOnce&&n.channelAdapter.isJoined()&&n.channelAdapter.push(dt.access_token,{access_token:i})})))}async _waitForAuthIfNeeded(){this._authPromise&&await this._authPromise}_setAuthSafely(e="general"){this._isManualToken()||this.setAuth().catch(t=>{this.log("error",`Error setting auth in ${e}`,t)})}_setupConnectionHandlers(){this.socketAdapter.onOpen(()=>{(this._authPromise||(this.accessToken&&!this.accessTokenValue?this.setAuth():Promise.resolve())).catch(t=>{this.log("error","error waiting for auth on connect",t)}),this.worker&&!this.workerRef&&this._startWorkerHeartbeat()}),this.socketAdapter.onClose(()=>{this.worker&&this.workerRef&&this._terminateWorker()}),this.socketAdapter.onMessage(e=>{e.ref&&e.ref===this._pendingWorkerHeartbeatRef&&(this._pendingWorkerHeartbeatRef=null)})}_handleNodeJsRaceCondition(){this.socketAdapter.isConnected()&&this.socketAdapter.getSocket().onConnOpen()}_wrapHeartbeatCallback(e){return(t,i)=>{t!=="disconnected"&&(t=="sent"&&this._setAuthSafely(),e&&e(t,i))}}_startWorkerHeartbeat(){this.workerUrl?this.log("worker",`starting worker for from ${this.workerUrl}`):this.log("worker","starting default worker");let e=this._workerObjectUrl(this.workerUrl);this.workerRef=new Worker(e),this.workerRef.onerror=t=>{this.log("worker","worker error",t.message),this._terminateWorker(),this.disconnect()},this.workerRef.onmessage=t=>{t.data.event==="keepAlive"&&this.sendHeartbeat()},this.workerRef.postMessage({event:"start",interval:this.heartbeatIntervalMs})}_terminateWorker(){this.workerRef&&(this.log("worker","terminating worker"),this.workerRef.terminate(),this.workerRef=void 0)}_workerObjectUrl(e){let t;if(e)t=e;else{let i=new Blob([Ls],{type:"application/javascript"});t=URL.createObjectURL(i)}return t}_initializeOptions(e){var t,i,s,n,a,o,l,c,h,d,f,u;this.worker=(t=e?.worker)!==null&&t!==void 0?t:!1,this.accessToken=(i=e?.accessToken)!==null&&i!==void 0?i:null;let p={};p.timeout=(s=e?.timeout)!==null&&s!==void 0?s:$r,p.heartbeatIntervalMs=(n=e?.heartbeatIntervalMs)!==null&&n!==void 0?n:zr.HEARTBEAT_INTERVAL,this._disconnectOnEmptyChannelsAfterMs=(a=e?.disconnectOnEmptyChannelsAfterMs)!==null&&a!==void 0?a:2*((o=e?.heartbeatIntervalMs)!==null&&o!==void 0?o:zr.HEARTBEAT_INTERVAL),p.transport=(l=e?.transport)!==null&&l!==void 0?l:Dt.getWebSocketConstructor(),p.params=e?.params,p.logger=e?.logger,p.heartbeatCallback=this._wrapHeartbeatCallback(e?.heartbeatCallback),p.sessionStorage=(c=e?.sessionStorage)!==null&&c!==void 0?c:Ps(),p.reconnectAfterMs=(h=e?.reconnectAfterMs)!==null&&h!==void 0?h:(E=>Is[E-1]||Rs);let g,y,_=(d=e?.vsn)!==null&&d!==void 0?d:jr;switch(_){case Lr:g=(E,m)=>m(JSON.stringify(E)),y=(E,m)=>m(JSON.parse(E));break;case qt:g=this.serializer.encode.bind(this.serializer),y=this.serializer.decode.bind(this.serializer);break;default:throw new Error(`Unsupported serializer version: ${p.vsn}`)}if(p.vsn=_,p.encode=(f=e?.encode)!==null&&f!==void 0?f:g,p.decode=(u=e?.decode)!==null&&u!==void 0?u:y,p.beforeReconnect=this._reconnectAuth.bind(this),(e?.logLevel||e?.log_level)&&(this.logLevel=e.logLevel||e.log_level,p.params=Object.assign(Object.assign({},p.params),{log_level:this.logLevel})),this.worker){if(typeof window<"u"&&!window.Worker)throw new Error("Web Worker is not supported");this.workerUrl=e?.workerUrl,p.autoSendHeartbeat=!this.worker}return p}async _reconnectAuth(){await this._waitForAuthIfNeeded(),this.isConnected()||this.connect()}};var ze=class extends Error{constructor(r,e){super(r),this.name="IcebergError",this.status=e.status,this.icebergType=e.icebergType,this.icebergCode=e.icebergCode,this.details=e.details,this.isCommitStateUnknown=e.icebergType==="CommitStateUnknownException"||[500,502,504].includes(e.status)&&e.icebergType?.includes("CommitState")===!0}isNotFound(){return this.status===404}isConflict(){return this.status===409}isAuthenticationTimeout(){return this.status===419}};function js(r,e,t){let i=new URL(e,r);if(t)for(let[s,n]of Object.entries(t))n!==void 0&&i.searchParams.set(s,n);return i.toString()}async function $s(r){return!r||r.type==="none"?{}:r.type==="bearer"?{Authorization:`Bearer ${r.token}`}:r.type==="header"?{[r.name]:r.value}:r.type==="custom"?await r.getHeaders():{}}function Bs(r){let e=r.fetchImpl??globalThis.fetch;return{async request({method:t,path:i,query:s,body:n,headers:a}){let o=js(r.baseUrl,i,s),l=await $s(r.auth),c=await e(o,{method:t,headers:{...n?{"Content-Type":"application/json"}:{},...l,...a},body:n?JSON.stringify(n):void 0}),h=await c.text(),d=(c.headers.get("content-type")||"").includes("application/json"),f=d&&h?JSON.parse(h):h;if(!c.ok){let u=d?f:void 0,p=u?.error;throw new ze(p?.message??`Request failed with status ${c.status}`,{status:c.status,icebergType:p?.type,icebergCode:p?.code,details:u})}return{status:c.status,headers:c.headers,data:f}}}}function yt(r){return r.join("")}var Ns=class{constructor(r,e=""){this.client=r,this.prefix=e}async listNamespaces(r){let e=r?{parent:yt(r.namespace)}:void 0;return(await this.client.request({method:"GET",path:`${this.prefix}/namespaces`,query:e})).data.namespaces.map(i=>({namespace:i}))}async createNamespace(r,e){let t={namespace:r.namespace,properties:e?.properties};return(await this.client.request({method:"POST",path:`${this.prefix}/namespaces`,body:t})).data}async dropNamespace(r){await this.client.request({method:"DELETE",path:`${this.prefix}/namespaces/${yt(r.namespace)}`})}async loadNamespaceMetadata(r){return{properties:(await this.client.request({method:"GET",path:`${this.prefix}/namespaces/${yt(r.namespace)}`})).data.properties}}async namespaceExists(r){try{return await this.client.request({method:"HEAD",path:`${this.prefix}/namespaces/${yt(r.namespace)}`}),!0}catch(e){if(e instanceof ze&&e.status===404)return!1;throw e}}async createNamespaceIfNotExists(r,e){try{return await this.createNamespace(r,e)}catch(t){if(t instanceof ze&&t.status===409)return;throw t}}};function Ae(r){return r.join("")}var Ms=class{constructor(r,e="",t){this.client=r,this.prefix=e,this.accessDelegation=t}async listTables(r){return(await this.client.request({method:"GET",path:`${this.prefix}/namespaces/${Ae(r.namespace)}/tables`})).data.identifiers}async createTable(r,e){let t={};return this.accessDelegation&&(t["X-Iceberg-Access-Delegation"]=this.accessDelegation),(await this.client.request({method:"POST",path:`${this.prefix}/namespaces/${Ae(r.namespace)}/tables`,body:e,headers:t})).data.metadata}async updateTable(r,e){let t=await this.client.request({method:"POST",path:`${this.prefix}/namespaces/${Ae(r.namespace)}/tables/${r.name}`,body:e});return{"metadata-location":t.data["metadata-location"],metadata:t.data.metadata}}async dropTable(r,e){await this.client.request({method:"DELETE",path:`${this.prefix}/namespaces/${Ae(r.namespace)}/tables/${r.name}`,query:{purgeRequested:String(e?.purge??!1)}})}async loadTable(r){let e={};return this.accessDelegation&&(e["X-Iceberg-Access-Delegation"]=this.accessDelegation),(await this.client.request({method:"GET",path:`${this.prefix}/namespaces/${Ae(r.namespace)}/tables/${r.name}`,headers:e})).data.metadata}async tableExists(r){let e={};this.accessDelegation&&(e["X-Iceberg-Access-Delegation"]=this.accessDelegation);try{return await this.client.request({method:"HEAD",path:`${this.prefix}/namespaces/${Ae(r.namespace)}/tables/${r.name}`,headers:e}),!0}catch(t){if(t instanceof ze&&t.status===404)return!1;throw t}}async createTableIfNotExists(r,e){try{return await this.createTable(r,e)}catch(t){if(t instanceof ze&&t.status===409)return await this.loadTable({namespace:r.namespace,name:e.name});throw t}}},Wr=class{constructor(r){let e="v1";r.catalogName&&(e+=`/${r.catalogName}`);let t=r.baseUrl.endsWith("/")?r.baseUrl:`${r.baseUrl}/`;this.client=Bs({baseUrl:t,auth:r.auth,fetchImpl:r.fetch}),this.accessDelegation=r.accessDelegation?.join(","),this.namespaceOps=new Ns(this.client,e),this.tableOps=new Ms(this.client,e,this.accessDelegation)}async listNamespaces(r){return this.namespaceOps.listNamespaces(r)}async createNamespace(r,e){return this.namespaceOps.createNamespace(r,e)}async dropNamespace(r){await this.namespaceOps.dropNamespace(r)}async loadNamespaceMetadata(r){return this.namespaceOps.loadNamespaceMetadata(r)}async listTables(r){return this.tableOps.listTables(r)}async createTable(r,e){return this.tableOps.createTable(r,e)}async updateTable(r,e){return this.tableOps.updateTable(r,e)}async dropTable(r,e){await this.tableOps.dropTable(r,e)}async loadTable(r){return this.tableOps.loadTable(r)}async namespaceExists(r){return this.namespaceOps.namespaceExists(r)}async tableExists(r){return this.tableOps.tableExists(r)}async createNamespaceIfNotExists(r,e){return this.namespaceOps.createNamespaceIfNotExists(r,e)}async createTableIfNotExists(r,e){return this.tableOps.createTableIfNotExists(r,e)}};function Ve(r){"@babel/helpers - typeof";return Ve=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},Ve(r)}function Us(r,e){if(Ve(r)!="object"||!r)return r;var t=r[Symbol.toPrimitive];if(t!==void 0){var i=t.call(r,e||"default");if(Ve(i)!="object")return i;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(r)}function Hs(r){var e=Us(r,"string");return Ve(e)=="symbol"?e:e+""}function Ds(r,e,t){return(e=Hs(e))in r?Object.defineProperty(r,e,{value:t,enumerable:!0,configurable:!0,writable:!0}):r[e]=t,r}function Vr(r,e){var t=Object.keys(r);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(r);e&&(i=i.filter(function(s){return Object.getOwnPropertyDescriptor(r,s).enumerable})),t.push.apply(t,i)}return t}function S(r){for(var e=1;e<arguments.length;e++){var t=arguments[e]!=null?arguments[e]:{};e%2?Vr(Object(t),!0).forEach(function(i){Ds(r,i,t[i])}):Object.getOwnPropertyDescriptors?Object.defineProperties(r,Object.getOwnPropertyDescriptors(t)):Vr(Object(t)).forEach(function(i){Object.defineProperty(r,i,Object.getOwnPropertyDescriptor(t,i))})}return r}var bt=class extends Error{constructor(r,e="storage",t,i){super(r),this.__isStorageError=!0,this.namespace=e,this.name=e==="vectors"?"StorageVectorsError":"StorageError",this.status=t,this.statusCode=i}toJSON(){return{name:this.name,message:this.message,status:this.status,statusCode:this.statusCode}}};function _t(r){return typeof r=="object"&&r!==null&&"__isStorageError"in r}var vt=class extends bt{constructor(r,e,t,i="storage",s){super(r,i,e,t),this.name=i==="vectors"?"StorageVectorsApiError":"StorageApiError",this.status=e,this.statusCode=t,this.code=s}toJSON(){return S(S({},super.toJSON()),{},{code:this.code})}},Jr=class extends bt{constructor(r,e,t="storage"){super(r,t),this.name=t==="vectors"?"StorageVectorsUnknownError":"StorageUnknownError",this.originalError=e}};function wt(r,e,t){let i=S({},r),s=e.toLowerCase();for(let n of Object.keys(i))n.toLowerCase()===s&&delete i[n];return i[s]=t,i}function qs(r){let e={};for(let[t,i]of Object.entries(r))e[t.toLowerCase()]=i;return e}var Fs=r=>r?(...e)=>r(...e):(...e)=>fetch(...e),zs=r=>{if(typeof r!="object"||r===null)return!1;let e=Object.getPrototypeOf(r);return(e===null||e===Object.prototype||Object.getPrototypeOf(e)===null)&&!(Symbol.toStringTag in r)&&!(Symbol.iterator in r)},Yt=r=>{if(Array.isArray(r))return r.map(t=>Yt(t));if(typeof r=="function"||r!==Object(r))return r;let e={};return Object.entries(r).forEach(([t,i])=>{let s=t.replace(/([-_][a-z])/gi,n=>n.toUpperCase().replace(/[-_]/g,""));e[s]=Yt(i)}),e},Ws=r=>!r||typeof r!="string"||r.length===0||r.length>100||r.trim()!==r||r.includes("/")||r.includes("\\")?!1:/^[\w!.\*'() &$@=;:+,?-]+$/.test(r),Yr=r=>r.split("/").map(encodeURIComponent).join("/"),Kr=r=>{if(typeof r=="object"&&r!==null){let e=r;if(typeof e.msg=="string")return e.msg;if(typeof e.message=="string")return e.message;if(typeof e.error_description=="string")return e.error_description;if(typeof e.error=="string")return e.error;if(typeof e.error=="object"&&e.error!==null){let t=e.error;if(typeof t.message=="string")return t.message}}return JSON.stringify(r)},Vs=async(r,e,t,i)=>{if(r!==null&&typeof r=="object"&&"json"in r&&typeof r.json=="function"){let s=r,n=parseInt(String(s.status),10);Number.isFinite(n)||(n=500),s.json().then(a=>{let o=a?.statusCode||a?.code||n+"";e(new vt(Kr(a),n,o,i,a?.code))}).catch(()=>{let a=n+"";e(new vt(s.statusText||`HTTP ${n} error`,n,a,i))})}else e(new Jr(Kr(r),r,i))},Ks=(r,e,t,i)=>{let s={method:r,headers:e?.headers||{}};if(r==="GET"||r==="HEAD"||!i)return S(S({},s),t);if(zs(i)){var n;let a=e?.headers||{},o;for(let[l,c]of Object.entries(a))l.toLowerCase()==="content-type"&&(o=c);s.headers=wt(a,"Content-Type",(n=o)!==null&&n!==void 0?n:"application/json"),s.body=JSON.stringify(i)}else s.body=i;return e?.duplex&&(s.duplex=e.duplex),S(S({},s),t)};async function We(r,e,t,i,s,n,a){return new Promise((o,l)=>{r(t,Ks(e,i,s,n)).then(c=>{if(!c.ok)throw c;if(i?.noResolveJson)return c;if(a==="vectors"){let h=c.headers.get("content-type");if(c.headers.get("content-length")==="0"||c.status===204)return{};if(!h||!h.includes("application/json"))return{}}return c.json()}).then(c=>o(c)).catch(c=>Vs(c,l,i,a))})}function Qr(r="storage"){return{get:async(e,t,i,s)=>We(e,"GET",t,i,s,void 0,r),post:async(e,t,i,s,n)=>We(e,"POST",t,s,n,i,r),put:async(e,t,i,s,n)=>We(e,"PUT",t,s,n,i,r),head:async(e,t,i,s)=>We(e,"HEAD",t,S(S({},i),{},{noResolveJson:!0}),s,void 0,r),remove:async(e,t,i,s,n)=>We(e,"DELETE",t,s,n,i,r)}}var Gs=Qr("storage"),{get:Ke,post:F,put:Qt,head:Js,remove:Ge}=Gs,M=Qr("vectors"),Ce=class{constructor(r,e={},t,i="storage"){this.shouldThrowOnError=!1,this.url=r,this.headers=qs(e),this.fetch=Fs(t),this.namespace=i}throwOnError(){return this.shouldThrowOnError=!0,this}setHeader(r,e){return this.headers=wt(this.headers,r,e),this}async handleOperation(r){var e=this;try{return{data:await r(),error:null}}catch(t){if(e.shouldThrowOnError)throw t;if(_t(t))return{data:null,error:t};throw t}}},Xr;Xr=Symbol.toStringTag;var Ys=class{constructor(r,e){this.downloadFn=r,this.shouldThrowOnError=e,this[Xr]="StreamDownloadBuilder",this.promise=null}then(r,e){return this.getPromise().then(r,e)}catch(r){return this.getPromise().catch(r)}finally(r){return this.getPromise().finally(r)}getPromise(){return this.promise||(this.promise=this.execute()),this.promise}async execute(){var r=this;try{return{data:(await r.downloadFn()).body,error:null}}catch(e){if(r.shouldThrowOnError)throw e;if(_t(e))return{data:null,error:e};throw e}}},Zr;Zr=Symbol.toStringTag;var Qs=class{constructor(r,e){this.downloadFn=r,this.shouldThrowOnError=e,this[Zr]="BlobDownloadBuilder",this.promise=null}asStream(){return new Ys(this.downloadFn,this.shouldThrowOnError)}then(r,e){return this.getPromise().then(r,e)}catch(r){return this.getPromise().catch(r)}finally(r){return this.getPromise().finally(r)}getPromise(){return this.promise||(this.promise=this.execute()),this.promise}async execute(){var r=this;try{return{data:await(await r.downloadFn()).blob(),error:null}}catch(e){if(r.shouldThrowOnError)throw e;if(_t(e))return{data:null,error:e};throw e}}},Jt={limit:100,offset:0,sortBy:{column:"name",order:"asc"}},Gr={cacheControl:"3600",contentType:"text/plain;charset=UTF-8",upsert:!1},Xs=class extends Ce{constructor(r,e={},t,i){super(r,e,i,"storage"),this.bucketId=t}async uploadOrUpdate(r,e,t,i){var s=this;return s.handleOperation(async()=>{let n,a=S(S({},Gr),i),o=S(S({},s.headers),r==="POST"&&{"x-upsert":String(a.upsert)}),l=a.metadata;if(typeof Blob<"u"&&t instanceof Blob?(n=new FormData,n.append("cacheControl",a.cacheControl),l&&n.append("metadata",s.encodeMetadata(l)),n.append("",t)):typeof FormData<"u"&&t instanceof FormData?(n=t,n.has("cacheControl")||n.append("cacheControl",a.cacheControl),l&&!n.has("metadata")&&n.append("metadata",s.encodeMetadata(l))):(n=t,o["cache-control"]=`max-age=${a.cacheControl}`,o["content-type"]=a.contentType,l&&(o["x-metadata"]=s.toBase64(s.encodeMetadata(l))),(typeof ReadableStream<"u"&&n instanceof ReadableStream||n&&typeof n=="object"&&"pipe"in n&&typeof n.pipe=="function")&&!a.duplex&&(a.duplex="half")),i?.headers)for(let[f,u]of Object.entries(i.headers))o=wt(o,f,u);let c=s._removeEmptyFolders(e),h=s._getFinalPath(c),d=await(r=="PUT"?Qt:F)(s.fetch,`${s.url}/object/${h}`,n,S({headers:o},a?.duplex?{duplex:a.duplex}:{}));return{path:c,id:d.Id,fullPath:d.Key}})}async upload(r,e,t){return this.uploadOrUpdate("POST",r,e,t)}async uploadToSignedUrl(r,e,t,i){var s=this;let n=s._removeEmptyFolders(r),a=s._getFinalPath(n),o=new URL(s.url+`/object/upload/sign/${a}`);return o.searchParams.set("token",e),s.handleOperation(async()=>{let l,c=S(S({},Gr),i),h=S(S({},s.headers),{"x-upsert":String(c.upsert)}),d=c.metadata;if(typeof Blob<"u"&&t instanceof Blob?(l=new FormData,l.append("cacheControl",c.cacheControl),d&&l.append("metadata",s.encodeMetadata(d)),l.append("",t)):typeof FormData<"u"&&t instanceof FormData?(l=t,l.has("cacheControl")||l.append("cacheControl",c.cacheControl),d&&!l.has("metadata")&&l.append("metadata",s.encodeMetadata(d))):(l=t,h["cache-control"]=`max-age=${c.cacheControl}`,h["content-type"]=c.contentType,d&&(h["x-metadata"]=s.toBase64(s.encodeMetadata(d))),(typeof ReadableStream<"u"&&l instanceof ReadableStream||l&&typeof l=="object"&&"pipe"in l&&typeof l.pipe=="function")&&!c.duplex&&(c.duplex="half")),i?.headers)for(let[f,u]of Object.entries(i.headers))h=wt(h,f,u);return{path:n,fullPath:(await Qt(s.fetch,o.toString(),l,S({headers:h},c?.duplex?{duplex:c.duplex}:{}))).Key}})}async createSignedUploadUrl(r,e){var t=this;return t.handleOperation(async()=>{let i=t._getFinalPath(r),s=S({},t.headers);e?.upsert&&(s["x-upsert"]="true");let n=await F(t.fetch,`${t.url}/object/upload/sign/${i}`,{},{headers:s}),a=new URL(t.url+n.url),o=a.searchParams.get("token");if(!o)throw new bt("No token returned by API");return{signedUrl:a.toString(),path:r,token:o}})}async update(r,e,t){return this.uploadOrUpdate("PUT",r,e,t)}async move(r,e,t){var i=this;return i.handleOperation(async()=>await F(i.fetch,`${i.url}/object/move`,{bucketId:i.bucketId,sourceKey:r,destinationKey:e,destinationBucket:t?.destinationBucket},{headers:i.headers}))}async copy(r,e,t){var i=this;return i.handleOperation(async()=>({path:(await F(i.fetch,`${i.url}/object/copy`,{bucketId:i.bucketId,sourceKey:r,destinationKey:e,destinationBucket:t?.destinationBucket},{headers:i.headers})).Key}))}async createSignedUrl(r,e,t){var i=this;return i.handleOperation(async()=>{let s=i._getFinalPath(r),n=typeof t?.transform=="object"&&t.transform!==null&&Object.keys(t.transform).length>0,a=await F(i.fetch,`${i.url}/object/sign/${s}`,S({expiresIn:e},n?{transform:t.transform}:{}),{headers:i.headers}),o=new URLSearchParams;t?.download&&o.set("download",t.download===!0?"":t.download),t?.cacheNonce!=null&&o.set("cacheNonce",String(t.cacheNonce));let l=o.toString();return{signedUrl:encodeURI(`${i.url}${a.signedURL}${l?`&${l}`:""}`)}})}async createSignedUrls(r,e,t){var i=this;return i.handleOperation(async()=>{let s=await F(i.fetch,`${i.url}/object/sign/${i.bucketId}`,{expiresIn:e,paths:r},{headers:i.headers}),n=new URLSearchParams;t?.download&&n.set("download",t.download===!0?"":t.download),t?.cacheNonce!=null&&n.set("cacheNonce",String(t.cacheNonce));let a=n.toString();return s.map(o=>S(S({},o),{},{signedUrl:o.signedURL?encodeURI(`${i.url}${o.signedURL}${a?`&${a}`:""}`):null}))})}download(r,e,t){let i=typeof e?.transform=="object"&&e.transform!==null&&Object.keys(e.transform).length>0?"render/image/authenticated":"object",s=new URLSearchParams;e?.transform&&this.applyTransformOptsToQuery(s,e.transform),e?.cacheNonce!=null&&s.set("cacheNonce",String(e.cacheNonce));let n=s.toString(),a=this._getFinalPath(r),o=()=>Ke(this.fetch,`${this.url}/${i}/${a}${n?`?${n}`:""}`,{headers:this.headers,noResolveJson:!0},t);return new Qs(o,this.shouldThrowOnError)}async info(r){var e=this;let t=e._getFinalPath(r);return e.handleOperation(async()=>Yt(await Ke(e.fetch,`${e.url}/object/info/${t}`,{headers:e.headers})))}async exists(r){var e=this;let t=e._getFinalPath(r);try{return await Js(e.fetch,`${e.url}/object/${t}`,{headers:e.headers}),{data:!0,error:null}}catch(s){if(e.shouldThrowOnError)throw s;if(_t(s)){var i;let n=s instanceof vt?s.status:s instanceof Jr?(i=s.originalError)===null||i===void 0?void 0:i.status:void 0;if(n!==void 0&&[400,404].includes(n))return{data:!1,error:s}}throw s}}getPublicUrl(r,e){let t=this._getFinalPath(r),i=new URLSearchParams;e?.download&&i.set("download",e.download===!0?"":e.download),e?.transform&&this.applyTransformOptsToQuery(i,e.transform),e?.cacheNonce!=null&&i.set("cacheNonce",String(e.cacheNonce));let s=i.toString(),n=typeof e?.transform=="object"&&e.transform!==null&&Object.keys(e.transform).length>0?"render/image":"object";return{data:{publicUrl:encodeURI(`${this.url}/${n}/public/${t}`)+(s?`?${s}`:"")}}}async remove(r){var e=this;return e.handleOperation(async()=>await Ge(e.fetch,`${e.url}/object/${e.bucketId}`,{prefixes:r},{headers:e.headers}))}async purgeCache(r,e,t){var i=this;return i.handleOperation(async()=>{let s=Yr(i._getFinalPath(r)),n=new URLSearchParams;e?.transformations&&n.set("transformations","true");let a=n.toString();return await Ge(i.fetch,`${i.url}/cdn/${s}${a?`?${a}`:""}`,{},{headers:i.headers},t)})}async list(r,e,t){var i=this;return i.handleOperation(async()=>{let s=e?.sortBy?S(S({},Jt.sortBy),e.sortBy):Jt.sortBy,n=S(S(S({},Jt),e),{},{sortBy:s,prefix:r||""});return await F(i.fetch,`${i.url}/object/list/${i.bucketId}`,n,{headers:i.headers},t)})}async listV2(r,e){var t=this;return t.handleOperation(async()=>{let i=S({},r);return await F(t.fetch,`${t.url}/object/list-v2/${t.bucketId}`,i,{headers:t.headers},e)})}encodeMetadata(r){return JSON.stringify(r)}toBase64(r){return typeof Buffer<"u"?Buffer.from(r).toString("base64"):btoa(r)}_getFinalPath(r){return`${this.bucketId}/${r.replace(/^\/+/,"")}`}_removeEmptyFolders(r){return r.replace(/^\/|\/$/g,"").replace(/\/+/g,"/")}applyTransformOptsToQuery(r,e){return e.width&&r.set("width",e.width.toString()),e.height&&r.set("height",e.height.toString()),e.resize&&r.set("resize",e.resize),e.format&&r.set("format",e.format),e.quality&&r.set("quality",e.quality.toString()),r}},Zs="2.112.4",Je={"X-Client-Info":`storage-js/${Zs}`},en=class extends Ce{constructor(r,e={},t,i){let s=new URL(r);i?.useNewHostname&&/supabase\.(co|in|red)$/.test(s.hostname)&&!s.hostname.includes("storage.supabase.")&&(s.hostname=s.hostname.replace("supabase.","storage.supabase."));let n=s.href.replace(/\/$/,""),a=S(S({},Je),e);super(n,a,t,"storage")}async listBuckets(r){var e=this;return e.handleOperation(async()=>{let t=e.listBucketOptionsToQueryString(r);return await Ke(e.fetch,`${e.url}/bucket${t}`,{headers:e.headers})})}async getBucket(r){var e=this;return e.handleOperation(async()=>await Ke(e.fetch,`${e.url}/bucket/${r}`,{headers:e.headers}))}async createBucket(r,e={public:!1}){var t=this;return t.handleOperation(async()=>await F(t.fetch,`${t.url}/bucket`,{id:r,name:r,type:e.type,public:e.public,file_size_limit:e.fileSizeLimit,allowed_mime_types:e.allowedMimeTypes},{headers:t.headers}))}async updateBucket(r,e){var t=this;return t.handleOperation(async()=>await Qt(t.fetch,`${t.url}/bucket/${r}`,{id:r,name:r,public:e.public,file_size_limit:e.fileSizeLimit,allowed_mime_types:e.allowedMimeTypes},{headers:t.headers}))}async emptyBucket(r){var e=this;return e.handleOperation(async()=>await F(e.fetch,`${e.url}/bucket/${r}/empty`,{},{headers:e.headers}))}async deleteBucket(r){var e=this;return e.handleOperation(async()=>await Ge(e.fetch,`${e.url}/bucket/${r}`,{},{headers:e.headers}))}async purgeBucketCache(r,e,t){var i=this;return i.handleOperation(async()=>{let s=new URLSearchParams;e?.transformations&&s.set("transformations","true");let n=s.toString();return await Ge(i.fetch,`${i.url}/cdn/${Yr(r)}${n?`?${n}`:""}`,{},{headers:i.headers},t)})}listBucketOptionsToQueryString(r){let e={};return r&&("limit"in r&&(e.limit=String(r.limit)),"offset"in r&&(e.offset=String(r.offset)),r.search&&(e.search=r.search),r.sortColumn&&(e.sortColumn=r.sortColumn),r.sortOrder&&(e.sortOrder=r.sortOrder)),Object.keys(e).length>0?"?"+new URLSearchParams(e).toString():""}},tn=class extends Ce{constructor(r,e={},t){let i=r.replace(/\/$/,""),s=S(S({},Je),e);super(i,s,t,"storage")}async createBucket(r){var e=this;return e.handleOperation(async()=>await F(e.fetch,`${e.url}/bucket`,{name:r},{headers:e.headers}))}async listBuckets(r){var e=this;return e.handleOperation(async()=>{let t=new URLSearchParams;r?.limit!==void 0&&t.set("limit",r.limit.toString()),r?.offset!==void 0&&t.set("offset",r.offset.toString()),r?.sortColumn&&t.set("sortColumn",r.sortColumn),r?.sortOrder&&t.set("sortOrder",r.sortOrder),r?.search&&t.set("search",r.search);let i=t.toString(),s=i?`${e.url}/bucket?${i}`:`${e.url}/bucket`;return await Ke(e.fetch,s,{headers:e.headers})})}async deleteBucket(r){var e=this;return e.handleOperation(async()=>await Ge(e.fetch,`${e.url}/bucket/${r}`,{},{headers:e.headers}))}from(r){var e=this;if(!Ws(r))throw new bt("Invalid bucket name: File, folder, and bucket names must follow AWS object key naming guidelines and should avoid the use of any other characters.");let t=new Wr({baseUrl:this.url,catalogName:r,auth:{type:"custom",getHeaders:async()=>e.headers},fetch:this.fetch}),i=this.shouldThrowOnError;return new Proxy(t,{get(s,n){let a=s[n];return typeof a!="function"?a:async(...o)=>{try{return{data:await a.apply(s,o),error:null}}catch(l){if(i)throw l;return{data:null,error:l}}}}})}},rn=class extends Ce{constructor(r,e={},t){let i=r.replace(/\/$/,""),s=S(S({},Je),{},{"Content-Type":"application/json"},e);super(i,s,t,"vectors")}async createIndex(r){var e=this;return e.handleOperation(async()=>await M.post(e.fetch,`${e.url}/CreateIndex`,r,{headers:e.headers})||{})}async getIndex(r,e){var t=this;return t.handleOperation(async()=>await M.post(t.fetch,`${t.url}/GetIndex`,{vectorBucketName:r,indexName:e},{headers:t.headers}))}async listIndexes(r){var e=this;return e.handleOperation(async()=>await M.post(e.fetch,`${e.url}/ListIndexes`,r,{headers:e.headers}))}async deleteIndex(r,e){var t=this;return t.handleOperation(async()=>await M.post(t.fetch,`${t.url}/DeleteIndex`,{vectorBucketName:r,indexName:e},{headers:t.headers})||{})}},sn=class extends Ce{constructor(r,e={},t){let i=r.replace(/\/$/,""),s=S(S({},Je),{},{"Content-Type":"application/json"},e);super(i,s,t,"vectors")}async putVectors(r){var e=this;if(r.vectors.length<1||r.vectors.length>500)throw new Error("Vector batch size must be between 1 and 500 items");return e.handleOperation(async()=>await M.post(e.fetch,`${e.url}/PutVectors`,r,{headers:e.headers})||{})}async getVectors(r){var e=this;return e.handleOperation(async()=>await M.post(e.fetch,`${e.url}/GetVectors`,r,{headers:e.headers}))}async listVectors(r){var e=this;if(r.segmentCount!==void 0){if(r.segmentCount<1||r.segmentCount>16)throw new Error("segmentCount must be between 1 and 16");if(r.segmentIndex!==void 0&&(r.segmentIndex<0||r.segmentIndex>=r.segmentCount))throw new Error(`segmentIndex must be between 0 and ${r.segmentCount-1}`)}return e.handleOperation(async()=>await M.post(e.fetch,`${e.url}/ListVectors`,r,{headers:e.headers}))}async queryVectors(r){var e=this;return e.handleOperation(async()=>await M.post(e.fetch,`${e.url}/QueryVectors`,r,{headers:e.headers}))}async deleteVectors(r){var e=this;if(r.keys.length<1||r.keys.length>500)throw new Error("Keys batch size must be between 1 and 500 items");return e.handleOperation(async()=>await M.post(e.fetch,`${e.url}/DeleteVectors`,r,{headers:e.headers})||{})}},nn=class extends Ce{constructor(r,e={},t){let i=r.replace(/\/$/,""),s=S(S({},Je),{},{"Content-Type":"application/json"},e);super(i,s,t,"vectors")}async createBucket(r){var e=this;return e.handleOperation(async()=>await M.post(e.fetch,`${e.url}/CreateVectorBucket`,{vectorBucketName:r},{headers:e.headers})||{})}async getBucket(r){var e=this;return e.handleOperation(async()=>await M.post(e.fetch,`${e.url}/GetVectorBucket`,{vectorBucketName:r},{headers:e.headers}))}async listBuckets(r={}){var e=this;return e.handleOperation(async()=>await M.post(e.fetch,`${e.url}/ListVectorBuckets`,r,{headers:e.headers}))}async deleteBucket(r){var e=this;return e.handleOperation(async()=>await M.post(e.fetch,`${e.url}/DeleteVectorBucket`,{vectorBucketName:r},{headers:e.headers})||{})}},an=class extends nn{constructor(r,e={}){super(r,e.headers||{},e.fetch)}from(r){return new on(this.url,this.headers,r,this.fetch)}async createBucket(r){var e=()=>super.createBucket,t=this;return e().call(t,r)}async getBucket(r){var e=()=>super.getBucket,t=this;return e().call(t,r)}async listBuckets(r={}){var e=()=>super.listBuckets,t=this;return e().call(t,r)}async deleteBucket(r){var e=()=>super.deleteBucket,t=this;return e().call(t,r)}},on=class extends rn{constructor(r,e,t,i){super(r,e,i),this.vectorBucketName=t}async createIndex(r){var e=()=>super.createIndex,t=this;return e().call(t,S(S({},r),{},{vectorBucketName:t.vectorBucketName}))}async listIndexes(r={}){var e=()=>super.listIndexes,t=this;return e().call(t,S(S({},r),{},{vectorBucketName:t.vectorBucketName}))}async getIndex(r){var e=()=>super.getIndex,t=this;return e().call(t,t.vectorBucketName,r)}async deleteIndex(r){var e=()=>super.deleteIndex,t=this;return e().call(t,t.vectorBucketName,r)}index(r){return new ln(this.url,this.headers,this.vectorBucketName,r,this.fetch)}},ln=class extends sn{constructor(r,e,t,i,s){super(r,e,s),this.vectorBucketName=t,this.indexName=i}async putVectors(r){var e=()=>super.putVectors,t=this;return e().call(t,S(S({},r),{},{vectorBucketName:t.vectorBucketName,indexName:t.indexName}))}async getVectors(r){var e=()=>super.getVectors,t=this;return e().call(t,S(S({},r),{},{vectorBucketName:t.vectorBucketName,indexName:t.indexName}))}async listVectors(r={}){var e=()=>super.listVectors,t=this;return e().call(t,S(S({},r),{},{vectorBucketName:t.vectorBucketName,indexName:t.indexName}))}async queryVectors(r){var e=()=>super.queryVectors,t=this;return e().call(t,S(S({},r),{},{vectorBucketName:t.vectorBucketName,indexName:t.indexName}))}async deleteVectors(r){var e=()=>super.deleteVectors,t=this;return e().call(t,S(S({},r),{},{vectorBucketName:t.vectorBucketName,indexName:t.indexName}))}},ei=class extends en{constructor(r,e={},t,i){super(r,e,t,i)}from(r){return new Xs(this.url,this.headers,r,this.fetch)}get vectors(){return new an(this.url+"/vector",{headers:this.headers,fetch:this.fetch})}get analytics(){return new tn(this.url+"/iceberg",this.headers,this.fetch)}};var xt="2.112.4";var G=30*1e3,Ie=3,kt=Ie*G,ti=2*G,ri="http://localhost:9999",ii="supabase.auth.token";var si={"X-Client-Info":`gotrue-js/${xt}`};var Ye="X-Supabase-Api-Version",Xt={"2024-01-01":{timestamp:Date.parse("2024-01-01T00:00:00.0Z"),name:"2024-01-01"}},ni=/^([a-z0-9_-]{4})*($|[a-z0-9_-]{3}$|[a-z0-9_-]{2}$)$/i,Z="sb_flow_id",ai=5,oi=600*1e3;var ie=class extends Error{constructor(e,t,i){super(e),this.__isAuthError=!0,this.name="AuthError",this.status=t,this.code=i}toJSON(){return{name:this.name,message:this.message,status:this.status,code:this.code}}};function w(r){return typeof r=="object"&&r!==null&&"__isAuthError"in r}var Et=class extends ie{constructor(e,t,i){super(e,t,i),this.name="AuthApiError",this.status=t,this.code=i}};function Zt(r){return w(r)&&r.name==="AuthApiError"}var $=class extends ie{constructor(e,t){super(e),this.name="AuthUnknownError",this.originalError=t}},D=class extends ie{constructor(e,t,i,s){super(e,i,s),this.name=t,this.status=i}},O=class extends D{constructor(){super("Auth session missing!","AuthSessionMissingError",400,void 0)}};function et(r){return w(r)&&r.name==="AuthSessionMissingError"}var ee=class extends D{constructor(){super("Auth session or user missing","AuthInvalidTokenResponseError",500,void 0)}},oe=class extends D{constructor(e){super(e,"AuthInvalidCredentialsError",400,void 0)}},le=class extends D{constructor(e,t=null){super(e,"AuthImplicitGrantRedirectError",500,void 0),this.details=null,this.details=t}toJSON(){return Object.assign(Object.assign({},super.toJSON()),{details:this.details})}};function li(r){return w(r)&&r.name==="AuthImplicitGrantRedirectError"}var Qe=class extends D{constructor(e,t=null){super(e,"AuthPKCEGrantCodeExchangeError",500,void 0),this.details=null,this.details=t}toJSON(){return Object.assign(Object.assign({},super.toJSON()),{details:this.details})}},St=class extends D{constructor(){super("PKCE code verifier not found in storage. This can happen if the auth flow was initiated in a different browser or device, or if the storage was cleared. For SSR frameworks (Next.js, SvelteKit, etc.), use @supabase/ssr on both the server and client to store the code verifier in cookies.","AuthPKCECodeVerifierMissingError",400,"pkce_code_verifier_not_found")}};var ce=class extends D{constructor(e,t){super(e,"AuthRetryableFetchError",t,void 0)}};function tt(r){return w(r)&&r.name==="AuthRetryableFetchError"}var Xe=class extends D{constructor(e="Refresh result discarded: session state changed mid-flight (e.g., concurrent signOut)"){super(e,"AuthRefreshDiscardedError",409,void 0)}};function ci(r){return w(r)&&r.name==="AuthRefreshDiscardedError"}var Ze=class extends D{constructor(e,t,i){super(e,"AuthWeakPasswordError",t,"weak_password"),this.reasons=i}toJSON(){return Object.assign(Object.assign({},super.toJSON()),{reasons:this.reasons})}};var se=class extends D{constructor(e){super(e,"AuthInvalidJwtError",400,"invalid_jwt")}};var Tt="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".split(""),hi=` 	
\r=`.split(""),cn=(()=>{let r=new Array(128);for(let e=0;e<r.length;e+=1)r[e]=-1;for(let e=0;e<hi.length;e+=1)r[hi[e].charCodeAt(0)]=-2;for(let e=0;e<Tt.length;e+=1)r[Tt[e].charCodeAt(0)]=e;return r})();function di(r,e,t){if(r!==null)for(e.queue=e.queue<<8|r,e.queuedBits+=8;e.queuedBits>=6;){let i=e.queue>>e.queuedBits-6&63;t(Tt[i]),e.queuedBits-=6}else if(e.queuedBits>0)for(e.queue=e.queue<<6-e.queuedBits,e.queuedBits=6;e.queuedBits>=6;){let i=e.queue>>e.queuedBits-6&63;t(Tt[i]),e.queuedBits-=6}}function ui(r,e,t){let i=cn[r];if(i>-1)for(e.queue=e.queue<<6|i,e.queuedBits+=6;e.queuedBits>=8;)t(e.queue>>e.queuedBits-8&255),e.queuedBits-=8;else{if(i===-2)return;throw new Error(`Invalid Base64-URL character "${String.fromCharCode(r)}"`)}}function er(r){let e=[],t=a=>{e.push(String.fromCodePoint(a))},i={utf8seq:0,codepoint:0},s={queue:0,queuedBits:0},n=a=>{un(a,i,t)};for(let a=0;a<r.length;a+=1)ui(r.charCodeAt(a),s,n);return e.join("")}function hn(r,e){if(r<=127){e(r);return}else if(r<=2047){e(192|r>>6),e(128|r&63);return}else if(r<=65535){e(224|r>>12),e(128|r>>6&63),e(128|r&63);return}else if(r<=1114111){e(240|r>>18),e(128|r>>12&63),e(128|r>>6&63),e(128|r&63);return}throw new Error(`Unrecognized Unicode codepoint: ${r.toString(16)}`)}function dn(r,e){for(let t=0;t<r.length;t+=1){let i=r.charCodeAt(t);if(i>55295&&i<=56319){let s=(i-55296)*1024&65535;i=(r.charCodeAt(t+1)-56320&65535|s)+65536,t+=1}hn(i,e)}}function un(r,e,t){if(e.utf8seq===0){if(r<=127){t(r);return}for(let i=1;i<6;i+=1)if((r>>7-i&1)===0){e.utf8seq=i;break}if(e.utf8seq===2)e.codepoint=r&31;else if(e.utf8seq===3)e.codepoint=r&15;else if(e.utf8seq===4)e.codepoint=r&7;else throw new Error("Invalid UTF-8 sequence");e.utf8seq-=1}else if(e.utf8seq>0){if(r<=127)throw new Error("Invalid UTF-8 sequence");e.codepoint=e.codepoint<<6|r&63,e.utf8seq-=1,e.utf8seq===0&&t(e.codepoint)}}function ne(r){let e=[],t={queue:0,queuedBits:0},i=s=>{e.push(s)};for(let s=0;s<r.length;s+=1)ui(r.charCodeAt(s),t,i);return new Uint8Array(e)}function fi(r){let e=[];return dn(r,t=>e.push(t)),new Uint8Array(e)}function te(r){let e=[],t={queue:0,queuedBits:0},i=s=>{e.push(s)};return r.forEach(s=>di(s,t,i)),di(null,t,i),e.join("")}function pi(r){return Math.round(Date.now()/1e3)+r}function gi(){return Symbol("auth-callback")}var L=()=>typeof window<"u"&&typeof document<"u",he={tested:!1,writable:!1},At=()=>{if(!L())return!1;try{if(typeof globalThis.localStorage!="object")return!1}catch{return!1}if(he.tested)return he.writable;let r=`lswt-${Math.random()}${Math.random()}`;try{globalThis.localStorage.setItem(r,r),globalThis.localStorage.removeItem(r),he.tested=!0,he.writable=!0}catch{he.tested=!0,he.writable=!1}return he.writable};function tr(r){let e={},t=new URL(r);if(t.hash&&t.hash[0]==="#")try{new URLSearchParams(t.hash.substring(1)).forEach((s,n)=>{e[n]=s})}catch{}return t.searchParams.forEach((i,s)=>{e[s]=i}),e}var Ct=r=>r?(...e)=>r(...e):(...e)=>fetch(...e),mi=r=>typeof r=="object"&&r!==null&&"status"in r&&"ok"in r&&"json"in r&&typeof r.json=="function",J=async(r,e,t)=>{await r.setItem(e,JSON.stringify(t))},j=async(r,e)=>{let t=await r.getItem(e);if(!t)return null;try{return JSON.parse(t)}catch{return null}},B=async(r,e)=>{await r.removeItem(e)},rt=class r{constructor(){this.promise=new r.promiseConstructor((e,t)=>{this.resolve=e,this.reject=t})}};rt.promiseConstructor=Promise;function st(r){let e=r.split(".");if(e.length!==3)throw new se("Invalid JWT structure");for(let i=0;i<e.length;i++)if(!ni.test(e[i]))throw new se("JWT not in base64url format");return{header:JSON.parse(er(e[0])),payload:JSON.parse(er(e[1])),signature:ne(e[2]),raw:{header:e[0],payload:e[1]}}}async function yi(r){return await new Promise(e=>{setTimeout(()=>e(null),r)})}function vi(r,e){return new Promise((i,s)=>{(async()=>{for(let n=0;n<1/0;n++)try{let a=await r(n);if(!e(n,null,a)){i(a);return}}catch(a){if(!e(n,a)){s(a);return}}})()})}function wi(r){return("0"+r.toString(16)).substr(-2)}function fn(){let e=new Uint32Array(56);if(typeof crypto>"u"){let t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~",i=t.length,s="";for(let n=0;n<56;n++)s+=t.charAt(Math.floor(Math.random()*i));return s}return crypto.getRandomValues(e),Array.from(e,wi).join("")}async function pn(r){let t=new TextEncoder().encode(r),i=await crypto.subtle.digest("SHA-256",t),s=new Uint8Array(i);return Array.from(s).map(n=>String.fromCharCode(n)).join("")}async function gn(r){if(!(typeof crypto<"u"&&typeof crypto.subtle<"u"&&typeof TextEncoder<"u"))return console.warn("WebCrypto API is not supported. Code challenge method will default to use plain instead of sha256."),r;let t=await pn(r);return btoa(t).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}var mn=/^[a-zA-Z0-9_-]{8,64}$/;function nt(r){return typeof r=="string"&&mn.test(r)?r:null}function yn(){if(typeof crypto<"u"&&typeof crypto.getRandomValues=="function"){let e=new Uint8Array(16);return crypto.getRandomValues(e),Array.from(e,wi).join("")}let r="";for(let e=0;e<32;e++)r+=Math.floor(Math.random()*16).toString(16);return r}var de=(r,e)=>`${r}-flow-${e}-code-verifier`,it=r=>`${r}-flows-code-verifier`;async function rr(r,e){let t=await j(r,it(e));return Array.isArray(t)?t.filter(i=>nt(i)!==null):[]}async function vn(r,e,t,i,s){await J(r,de(e,t),i);let n=(await rr(r,e)).filter(a=>a!==t);for(n.push(t);n.length>ai;){let a=n.shift();await B(r,de(e,a)),s?.(a)}await J(r,it(e),n),await J(r,`${e}-code-verifier`,i)}async function bi(r,e,t){if(t){let s=await j(r,de(e,t));return{verifier:typeof s=="string"?s:null,flowId:t}}let i=await j(r,`${e}-code-verifier`);return{verifier:typeof i=="string"?i:null,flowId:null}}async function q(r,e,t){let i=`${e}-code-verifier`;if(!t){await B(r,i);return}let s=de(e,t),n=await j(r,s);await B(r,s);let a=await rr(r,e),o=a.filter(l=>l!==t);o.length!==a.length&&(o.length>0?await J(r,it(e),o):await B(r,it(e))),n!=null&&n===await j(r,i)&&await B(r,i)}async function _i(r,e){let t=await rr(r,e);for(let i of t)await B(r,de(e,i));await B(r,it(e)),await B(r,`${e}-code-verifier`)}function xi(r,e){let t=r.indexOf("#"),i=t===-1?r:r.slice(0,t),s=t===-1?"":r.slice(t),n=i.indexOf("?");if(n!==-1){let o=i.slice(0,n),l=i.slice(n+1).split("&").filter(c=>c!==""&&c!==Z&&!c.startsWith(`${Z}=`));i=l.length>0?`${o}?${l.join("&")}`:o}let a=i.includes("?")?"&":"?";return`${i}${a}${Z}=${encodeURIComponent(e)}${s}`}async function ki(r,e,t=!1,i){let s=fn(),n=s;t&&(n+="/recovery");let a=yn();await vn(r,e,a,n,i);let o=await gn(s);return[o,s===o?"plain":"s256",a]}var wn=/^2[0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])$/i;function Ei(r){let e=r.headers.get(Ye);if(!e||!e.match(wn))return null;try{return new Date(`${e}T00:00:00.0Z`)}catch{return null}}function Si(r){if(!r)throw new Error("Missing exp claim");let e=Math.floor(Date.now()/1e3);if(r<=e)throw new Error("JWT has expired")}function Ti(r){switch(r){case"RS256":return{name:"RSASSA-PKCS1-v1_5",hash:{name:"SHA-256"}};case"ES256":return{name:"ECDSA",namedCurve:"P-256",hash:{name:"SHA-256"}};default:throw new Error("Invalid alg claim")}}var bn=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;function Y(r){if(!bn.test(r))throw new Error("@supabase/auth-js: Expected parameter to be UUID but is not")}function U(r){if(!r.passkey)throw new Error("@supabase/auth-js: the passkey API is experimental and disabled by default. Enable it by passing `auth: { experimental: { passkey: true } }` to createClient (or to the GoTrueClient constructor).")}function It(){let r={};return new Proxy(r,{get:(e,t)=>{if(t==="__isUserNotAvailableProxy")return!0;if(typeof t=="symbol"){let i=t.toString();if(i==="Symbol(Symbol.toPrimitive)"||i==="Symbol(Symbol.toStringTag)"||i==="Symbol(util.inspect.custom)")return}throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Accessing the "${t}" property of the session object is not supported. Please use getUser() instead.`)},set:(e,t)=>{throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Setting the "${t}" property of the session object is not supported. Please use getUser() to fetch a user object you can manipulate.`)},deleteProperty:(e,t)=>{throw new Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Deleting the "${t}" property of the session object is not supported. Please use getUser() to fetch a user object you can manipulate.`)}})}function Ai(r,e){return new Proxy(r,{get:(t,i,s)=>{if(i==="__isInsecureUserWarningProxy")return!0;if(typeof i=="symbol"){let n=i.toString();if(n==="Symbol(Symbol.toPrimitive)"||n==="Symbol(Symbol.toStringTag)"||n==="Symbol(util.inspect.custom)"||n==="Symbol(nodejs.util.inspect.custom)")return Reflect.get(t,i,s)}return!e.value&&typeof i=="string"&&(console.warn("Using the user object as returned from supabase.auth.getSession() or from some supabase.auth.onAuthStateChange() events could be insecure! This value comes directly from the storage medium (usually cookies on the server) and may not be authentic. Use supabase.auth.getUser() instead which authenticates the data by contacting the Supabase Auth server."),e.value=!0),Reflect.get(t,i,s)}})}function ir(r){return JSON.parse(JSON.stringify(r))}var ue=r=>{if(typeof r=="object"&&r!==null){let e=r;if(typeof e.msg=="string")return e.msg;if(typeof e.message=="string")return e.message;if(typeof e.error_description=="string")return e.error_description;if(typeof e.error=="string")return e.error}return JSON.stringify(r)},Ci=[500,501,502,503,504,520,521,522,523,524,525,526,527,528,529,530];async function Ii(r){var e;if(!mi(r))throw new ce(ue(r),0);let t;try{t=await r.json()}catch(n){throw Ci.includes(r.status)?new ce(r.statusText||`HTTP ${r.status}`,r.status):new $(ue(n),n)}if(Ci.includes(r.status))throw new ce(ue(t),r.status);let i,s=Ei(r);if(s&&s.getTime()>=Xt["2024-01-01"].timestamp&&typeof t=="object"&&t&&typeof t.code=="string"?i=t.code:typeof t=="object"&&t&&typeof t.error_code=="string"&&(i=t.error_code),i){if(i==="weak_password")throw new Ze(ue(t),r.status,((e=t.weak_password)===null||e===void 0?void 0:e.reasons)||[]);if(i==="session_not_found")throw new O}else if(typeof t=="object"&&t&&typeof t.weak_password=="object"&&t.weak_password&&Array.isArray(t.weak_password.reasons)&&t.weak_password.reasons.length&&t.weak_password.reasons.reduce((n,a)=>n&&typeof a=="string",!0))throw new Ze(ue(t),r.status,t.weak_password.reasons);throw new Et(ue(t),r.status||500,i)}var _n=(r,e,t,i)=>{let s={method:r,headers:e?.headers||{}};return r==="GET"?s:(s.headers=Object.assign({"Content-Type":"application/json;charset=UTF-8"},e?.headers),s.body=JSON.stringify(i),Object.assign(Object.assign({},s),t))};async function k(r,e,t,i){var s;let n=Object.assign({},i?.headers);n[Ye]||(n[Ye]=Xt["2024-01-01"].name),i?.jwt&&(n.Authorization=`Bearer ${i.jwt}`);let a=(s=i?.query)!==null&&s!==void 0?s:{};i?.redirectTo&&(a.redirect_to=i.redirectTo);let o=Object.keys(a).length?"?"+new URLSearchParams(a).toString():"",l=await xn(r,e,t+o,{headers:n,noResolveJson:i?.noResolveJson},{},i?.body);return i?.xform?i?.xform(l):{data:Object.assign({},l),error:null}}async function xn(r,e,t,i,s,n){let a=_n(e,i,s,n),o;try{o=await r(t,Object.assign({},a))}catch(l){throw new ce(ue(l),0)}if(o.ok||await Ii(o),i?.noResolveJson)return o;try{return await o.json()}catch(l){await Ii(l)}}function H(r){var e;let t=null;kn(r)&&(t=Object.assign({},r),r.expires_at||(t.expires_at=pi(r.expires_in)));let i=(e=r.user)!==null&&e!==void 0?e:typeof r?.id=="string"?r:null;return{data:{session:t,user:i},error:null}}function sr(r){let e=H(r);return!e.error&&r.weak_password&&typeof r.weak_password=="object"&&Array.isArray(r.weak_password.reasons)&&r.weak_password.reasons.length&&r.weak_password.message&&typeof r.weak_password.message=="string"&&r.weak_password.reasons.reduce((t,i)=>t&&typeof i=="string",!0)&&(e.data.weak_password=r.weak_password),e}function Q(r){var e;return{data:{user:(e=r.user)!==null&&e!==void 0?e:r},error:null}}function Ri(r){return{data:r,error:null}}function Oi(r){let{action_link:e,email_otp:t,hashed_token:i,redirect_to:s,verification_type:n}=r,a=ae(r,["action_link","email_otp","hashed_token","redirect_to","verification_type"]),o={action_link:e,email_otp:t,hashed_token:i,redirect_to:s,verification_type:n},l=Object.assign({},a);return{data:{properties:o,user:l},error:null}}function nr(r){return r}function kn(r){return!!r.access_token&&!!r.refresh_token&&!!r.expires_in}var Rt=["global","local","others"];var fe=class{constructor({url:e="",headers:t={},fetch:i,experimental:s}){this.url=e,this.headers=t,this.fetch=Ct(i),this.experimental=s??{},this.mfa={listFactors:this._listFactors.bind(this),deleteFactor:this._deleteFactor.bind(this)},this.oauth={listClients:this._listOAuthClients.bind(this),createClient:this._createOAuthClient.bind(this),getClient:this._getOAuthClient.bind(this),updateClient:this._updateOAuthClient.bind(this),deleteClient:this._deleteOAuthClient.bind(this),regenerateClientSecret:this._regenerateOAuthClientSecret.bind(this)},this.customProviders={listProviders:this._listCustomProviders.bind(this),createProvider:this._createCustomProvider.bind(this),getProvider:this._getCustomProvider.bind(this),updateProvider:this._updateCustomProvider.bind(this),deleteProvider:this._deleteCustomProvider.bind(this)},this.passkey={listPasskeys:this._adminListPasskeys.bind(this),deletePasskey:this._adminDeletePasskey.bind(this)}}async signOut(e,t=Rt[0]){if(Rt.indexOf(t)<0)throw new Error(`@supabase/auth-js: Parameter scope must be one of ${Rt.join(", ")}`);try{return await k(this.fetch,"POST",`${this.url}/logout?scope=${t}`,{headers:this.headers,jwt:e,noResolveJson:!0}),{data:null,error:null}}catch(i){if(w(i))return{data:null,error:i};throw i}}async inviteUserByEmail(e,t={}){try{return await k(this.fetch,"POST",`${this.url}/invite`,{body:{email:e,data:t.data},headers:this.headers,redirectTo:t.redirectTo,xform:Q})}catch(i){if(w(i))return{data:{user:null},error:i};throw i}}async generateLink(e){try{let{options:t}=e,i=ae(e,["options"]),s=Object.assign(Object.assign({},i),t);return"newEmail"in i&&(s.new_email=i?.newEmail,delete s.newEmail),await k(this.fetch,"POST",`${this.url}/admin/generate_link`,{body:s,headers:this.headers,xform:Oi,redirectTo:t?.redirectTo})}catch(t){if(w(t))return{data:{properties:null,user:null},error:t};throw t}}async createUser(e){try{return await k(this.fetch,"POST",`${this.url}/admin/users`,{body:e,headers:this.headers,xform:Q})}catch(t){if(w(t))return{data:{user:null},error:t};throw t}}async listUsers(e){var t,i,s,n,a,o,l;try{let c={nextPage:null,lastPage:0,total:0},h=await k(this.fetch,"GET",`${this.url}/admin/users`,{headers:this.headers,noResolveJson:!0,query:{page:(i=(t=e?.page)===null||t===void 0?void 0:t.toString())!==null&&i!==void 0?i:"",per_page:(n=(s=e?.perPage)===null||s===void 0?void 0:s.toString())!==null&&n!==void 0?n:""},xform:nr});if(h.error)throw h.error;let d=await h.json(),f=(a=h.headers.get("x-total-count"))!==null&&a!==void 0?a:0,u=(l=(o=h.headers.get("link"))===null||o===void 0?void 0:o.split(","))!==null&&l!==void 0?l:[];return u.length>0&&(u.forEach(p=>{let g=parseInt(p.split(";")[0].split("=")[1].substring(0,1)),y=JSON.parse(p.split(";")[1].split("=")[1]);c[`${y}Page`]=g}),c.total=parseInt(f)),{data:Object.assign(Object.assign({},d),c),error:null}}catch(c){if(w(c))return{data:{users:[]},error:c};throw c}}async getUserById(e){Y(e);try{return await k(this.fetch,"GET",`${this.url}/admin/users/${e}`,{headers:this.headers,xform:Q})}catch(t){if(w(t))return{data:{user:null},error:t};throw t}}async updateUserById(e,t){Y(e);try{return await k(this.fetch,"PUT",`${this.url}/admin/users/${e}`,{body:t,headers:this.headers,xform:Q})}catch(i){if(w(i))return{data:{user:null},error:i};throw i}}async deleteUser(e,t=!1){Y(e);try{return await k(this.fetch,"DELETE",`${this.url}/admin/users/${e}`,{headers:this.headers,body:{should_soft_delete:t},xform:Q})}catch(i){if(w(i))return{data:{user:null},error:i};throw i}}async _listFactors(e){Y(e.userId);try{let{data:t,error:i}=await k(this.fetch,"GET",`${this.url}/admin/users/${e.userId}/factors`,{headers:this.headers,xform:s=>({data:{factors:s},error:null})});return{data:t,error:i}}catch(t){if(w(t))return{data:null,error:t};throw t}}async _deleteFactor(e){Y(e.userId),Y(e.id);try{return{data:await k(this.fetch,"DELETE",`${this.url}/admin/users/${e.userId}/factors/${e.id}`,{headers:this.headers}),error:null}}catch(t){if(w(t))return{data:null,error:t};throw t}}async _listOAuthClients(e){var t,i,s,n,a,o,l;try{let c={nextPage:null,lastPage:0,total:0},h=await k(this.fetch,"GET",`${this.url}/admin/oauth/clients`,{headers:this.headers,noResolveJson:!0,query:{page:(i=(t=e?.page)===null||t===void 0?void 0:t.toString())!==null&&i!==void 0?i:"",per_page:(n=(s=e?.perPage)===null||s===void 0?void 0:s.toString())!==null&&n!==void 0?n:""},xform:nr});if(h.error)throw h.error;let d=await h.json(),f=(a=h.headers.get("x-total-count"))!==null&&a!==void 0?a:0,u=(l=(o=h.headers.get("link"))===null||o===void 0?void 0:o.split(","))!==null&&l!==void 0?l:[];return u.length>0&&(u.forEach(p=>{let g=parseInt(p.split(";")[0].split("=")[1].substring(0,1)),y=JSON.parse(p.split(";")[1].split("=")[1]);c[`${y}Page`]=g}),c.total=parseInt(f)),{data:Object.assign(Object.assign({},d),c),error:null}}catch(c){if(w(c))return{data:{clients:[]},error:c};throw c}}async _createOAuthClient(e){try{return await k(this.fetch,"POST",`${this.url}/admin/oauth/clients`,{body:e,headers:this.headers,xform:t=>({data:t,error:null})})}catch(t){if(w(t))return{data:null,error:t};throw t}}async _getOAuthClient(e){try{return await k(this.fetch,"GET",`${this.url}/admin/oauth/clients/${e}`,{headers:this.headers,xform:t=>({data:t,error:null})})}catch(t){if(w(t))return{data:null,error:t};throw t}}async _updateOAuthClient(e,t){try{return await k(this.fetch,"PUT",`${this.url}/admin/oauth/clients/${e}`,{body:t,headers:this.headers,xform:i=>({data:i,error:null})})}catch(i){if(w(i))return{data:null,error:i};throw i}}async _deleteOAuthClient(e){try{return await k(this.fetch,"DELETE",`${this.url}/admin/oauth/clients/${e}`,{headers:this.headers,noResolveJson:!0}),{data:null,error:null}}catch(t){if(w(t))return{data:null,error:t};throw t}}async _regenerateOAuthClientSecret(e){try{return await k(this.fetch,"POST",`${this.url}/admin/oauth/clients/${e}/regenerate_secret`,{headers:this.headers,xform:t=>({data:t,error:null})})}catch(t){if(w(t))return{data:null,error:t};throw t}}async _listCustomProviders(e){try{let t={};return e?.type&&(t.type=e.type),await k(this.fetch,"GET",`${this.url}/admin/custom-providers`,{headers:this.headers,query:t,xform:i=>{var s;return{data:{providers:(s=i?.providers)!==null&&s!==void 0?s:[]},error:null}}})}catch(t){if(w(t))return{data:{providers:[]},error:t};throw t}}async _createCustomProvider(e){try{return await k(this.fetch,"POST",`${this.url}/admin/custom-providers`,{body:e,headers:this.headers,xform:t=>({data:t,error:null})})}catch(t){if(w(t))return{data:null,error:t};throw t}}async _getCustomProvider(e){try{return await k(this.fetch,"GET",`${this.url}/admin/custom-providers/${e}`,{headers:this.headers,xform:t=>({data:t,error:null})})}catch(t){if(w(t))return{data:null,error:t};throw t}}async _updateCustomProvider(e,t){try{return await k(this.fetch,"PUT",`${this.url}/admin/custom-providers/${e}`,{body:t,headers:this.headers,xform:i=>({data:i,error:null})})}catch(i){if(w(i))return{data:null,error:i};throw i}}async _deleteCustomProvider(e){try{return await k(this.fetch,"DELETE",`${this.url}/admin/custom-providers/${e}`,{headers:this.headers,noResolveJson:!0}),{data:null,error:null}}catch(t){if(w(t))return{data:null,error:t};throw t}}async _adminListPasskeys(e){U(this.experimental),Y(e.userId);try{return await k(this.fetch,"GET",`${this.url}/admin/users/${e.userId}/passkeys`,{headers:this.headers,xform:t=>({data:t,error:null})})}catch(t){if(w(t))return{data:null,error:t};throw t}}async _adminDeletePasskey(e){U(this.experimental),Y(e.userId),Y(e.passkeyId);try{return await k(this.fetch,"DELETE",`${this.url}/admin/users/${e.userId}/passkeys/${e.passkeyId}`,{headers:this.headers,noResolveJson:!0}),{data:null,error:null}}catch(t){if(w(t))return{data:null,error:t};throw t}}};function ar(r={}){return{getItem:e=>r[e]||null,setItem:(e,t)=>{r[e]=t},removeItem:e=>{delete r[e]}}}var En={debug:!!(globalThis&&At()&&globalThis.localStorage&&globalThis.localStorage.getItem("supabase.gotrue-js.locks.debug")==="true")},Ot=class extends Error{constructor(e){super(e),this.isAcquireTimeout=!0}};function Pi(){if(typeof globalThis!="object")try{Object.defineProperty(Object.prototype,"__magic__",{get:function(){return this},configurable:!0}),__magic__.globalThis=__magic__,delete Object.prototype.__magic__}catch{typeof self<"u"&&(self.globalThis=self)}}function or(r){if(!/^0x[a-fA-F0-9]{40}$/.test(r))throw new Error(`@supabase/auth-js: Address "${r}" is invalid.`);return r.toLowerCase()}function Li(r){return parseInt(r,16)}function ji(r){let e=new TextEncoder().encode(r);return"0x"+Array.from(e,i=>i.toString(16).padStart(2,"0")).join("")}function $i(r){var e;let{chainId:t,domain:i,expirationTime:s,issuedAt:n=new Date,nonce:a,notBefore:o,requestId:l,resources:c,scheme:h,uri:d,version:f}=r;{if(!Number.isInteger(t))throw new Error(`@supabase/auth-js: Invalid SIWE message field "chainId". Chain ID must be a EIP-155 chain ID. Provided value: ${t}`);if(!i)throw new Error('@supabase/auth-js: Invalid SIWE message field "domain". Domain must be provided.');if(a&&a.length<8)throw new Error(`@supabase/auth-js: Invalid SIWE message field "nonce". Nonce must be at least 8 characters. Provided value: ${a}`);if(!d)throw new Error('@supabase/auth-js: Invalid SIWE message field "uri". URI must be provided.');if(f!=="1")throw new Error(`@supabase/auth-js: Invalid SIWE message field "version". Version must be '1'. Provided value: ${f}`);if(!((e=r.statement)===null||e===void 0)&&e.includes(`
`))throw new Error(`@supabase/auth-js: Invalid SIWE message field "statement". Statement must not include '\\n'. Provided value: ${r.statement}`)}let u=or(r.address),p=h?`${h}://${i}`:i,g=r.statement?`${r.statement}
`:"",y=`${p} wants you to sign in with your Ethereum account:
${u}

${g}`,_=`URI: ${d}
Version: ${f}
Chain ID: ${t}${a?`
Nonce: ${a}`:""}
Issued At: ${n.toISOString()}`;if(s&&(_+=`
Expiration Time: ${s.toISOString()}`),o&&(_+=`
Not Before: ${o.toISOString()}`),l&&(_+=`
Request ID: ${l}`),c){let E=`
Resources:`;for(let m of c){if(!m||typeof m!="string")throw new Error(`@supabase/auth-js: Invalid SIWE message field "resources". Every resource must be a valid string. Provided value: ${m}`);E+=`
- ${m}`}_+=E}return`${y}
${_}`}var R=class extends Error{constructor({message:e,code:t,cause:i,name:s}){var n;super(e,{cause:i}),this.__isWebAuthnError=!0,this.name=(n=s??(i instanceof Error?i.name:void 0))!==null&&n!==void 0?n:"Unknown Error",this.code=t}toJSON(){return{name:this.name,message:this.message,code:this.code}}},pe=class extends R{constructor(e,t){super({code:"ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",cause:t,message:e}),this.name="WebAuthnUnknownError",this.originalError=t}};function Bi({error:r,options:e}){var t,i,s;let{publicKey:n}=e;if(!n)throw Error("options was missing required publicKey property");if(r.name==="AbortError"){if(e.signal instanceof AbortSignal)return new R({message:"Registration ceremony was sent an abort signal",code:"ERROR_CEREMONY_ABORTED",cause:r})}else if(r.name==="ConstraintError"){if(((t=n.authenticatorSelection)===null||t===void 0?void 0:t.requireResidentKey)===!0)return new R({message:"Discoverable credentials were required but no available authenticator supported it",code:"ERROR_AUTHENTICATOR_MISSING_DISCOVERABLE_CREDENTIAL_SUPPORT",cause:r});if(e.mediation==="conditional"&&((i=n.authenticatorSelection)===null||i===void 0?void 0:i.userVerification)==="required")return new R({message:"User verification was required during automatic registration but it could not be performed",code:"ERROR_AUTO_REGISTER_USER_VERIFICATION_FAILURE",cause:r});if(((s=n.authenticatorSelection)===null||s===void 0?void 0:s.userVerification)==="required")return new R({message:"User verification was required but no available authenticator supported it",code:"ERROR_AUTHENTICATOR_MISSING_USER_VERIFICATION_SUPPORT",cause:r})}else{if(r.name==="InvalidStateError")return new R({message:"The authenticator was previously registered",code:"ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED",cause:r});if(r.name==="NotAllowedError")return new R({message:r.message,code:"ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",cause:r});if(r.name==="NotSupportedError")return n.pubKeyCredParams.filter(o=>o.type==="public-key").length===0?new R({message:'No entry in pubKeyCredParams was of type "public-key"',code:"ERROR_MALFORMED_PUBKEYCREDPARAMS",cause:r}):new R({message:"No available authenticator supported any of the specified pubKeyCredParams algorithms",code:"ERROR_AUTHENTICATOR_NO_SUPPORTED_PUBKEYCREDPARAMS_ALG",cause:r});if(r.name==="SecurityError"){let a=window.location.hostname;if(lr(a)){if(n.rp.id!==a)return new R({message:`The RP ID "${n.rp.id}" is invalid for this domain`,code:"ERROR_INVALID_RP_ID",cause:r})}else return new R({message:`${window.location.hostname} is an invalid domain`,code:"ERROR_INVALID_DOMAIN",cause:r})}else if(r.name==="TypeError"){if(n.user.id.byteLength<1||n.user.id.byteLength>64)return new R({message:"User ID was not between 1 and 64 characters",code:"ERROR_INVALID_USER_ID_LENGTH",cause:r})}else if(r.name==="UnknownError")return new R({message:"The authenticator was unable to process the specified options, or could not create a new credential",code:"ERROR_AUTHENTICATOR_GENERAL_ERROR",cause:r})}return new R({message:"a Non-Webauthn related error has occurred",code:"ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",cause:r})}function Ni({error:r,options:e}){let{publicKey:t}=e;if(!t)throw Error("options was missing required publicKey property");if(r.name==="AbortError"){if(e.signal instanceof AbortSignal)return new R({message:"Authentication ceremony was sent an abort signal",code:"ERROR_CEREMONY_ABORTED",cause:r})}else{if(r.name==="NotAllowedError")return new R({message:r.message,code:"ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",cause:r});if(r.name==="SecurityError"){let i=window.location.hostname;if(lr(i)){if(t.rpId!==i)return new R({message:`The RP ID "${t.rpId}" is invalid for this domain`,code:"ERROR_INVALID_RP_ID",cause:r})}else return new R({message:`${window.location.hostname} is an invalid domain`,code:"ERROR_INVALID_DOMAIN",cause:r})}else if(r.name==="UnknownError")return new R({message:"The authenticator was unable to process the specified options, or could not create a new assertion signature",code:"ERROR_AUTHENTICATOR_GENERAL_ERROR",cause:r})}return new R({message:"a Non-Webauthn related error has occurred",code:"ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY",cause:r})}var cr=class{createNewAbortSignal(){if(this.controller){let t=new Error("Cancelling existing WebAuthn API call for new one");t.name="AbortError",this.controller.abort(t)}let e=new AbortController;return this.controller=e,e.signal}cancelCeremony(){if(this.controller){let e=new Error("Manually cancelling existing WebAuthn API call");e.name="AbortError",this.controller.abort(e),this.controller=void 0}}},jt=new cr;function hr(r){if(!r)throw new Error("Credential creation options are required");if(typeof PublicKeyCredential<"u"&&"parseCreationOptionsFromJSON"in PublicKeyCredential&&typeof PublicKeyCredential.parseCreationOptionsFromJSON=="function")return PublicKeyCredential.parseCreationOptionsFromJSON(r);let{challenge:e,user:t,excludeCredentials:i}=r,s=ae(r,["challenge","user","excludeCredentials"]),n=ne(e).buffer,a=Object.assign(Object.assign({},t),{id:ne(t.id).buffer}),o=Object.assign(Object.assign({},s),{challenge:n,user:a});if(i&&i.length>0){o.excludeCredentials=new Array(i.length);for(let l=0;l<i.length;l++){let c=i[l];o.excludeCredentials[l]=Object.assign(Object.assign({},c),{id:ne(c.id).buffer,type:c.type||"public-key",transports:c.transports})}}return o}function dr(r){if(!r)throw new Error("Credential request options are required");if(typeof PublicKeyCredential<"u"&&"parseRequestOptionsFromJSON"in PublicKeyCredential&&typeof PublicKeyCredential.parseRequestOptionsFromJSON=="function")return PublicKeyCredential.parseRequestOptionsFromJSON(r);let{challenge:e,allowCredentials:t}=r,i=ae(r,["challenge","allowCredentials"]),s=ne(e).buffer,n=Object.assign(Object.assign({},i),{challenge:s});if(t&&t.length>0){n.allowCredentials=new Array(t.length);for(let a=0;a<t.length;a++){let o=t[a];n.allowCredentials[a]=Object.assign(Object.assign({},o),{id:ne(o.id).buffer,type:o.type||"public-key",transports:o.transports})}}return n}function ur(r){var e;if("toJSON"in r&&typeof r.toJSON=="function")return r.toJSON();let t=r;return{id:r.id,rawId:r.id,response:{attestationObject:te(new Uint8Array(r.response.attestationObject)),clientDataJSON:te(new Uint8Array(r.response.clientDataJSON))},type:"public-key",clientExtensionResults:r.getClientExtensionResults(),authenticatorAttachment:(e=t.authenticatorAttachment)!==null&&e!==void 0?e:void 0}}function fr(r){var e;if("toJSON"in r&&typeof r.toJSON=="function")return r.toJSON();let t=r,i=r.getClientExtensionResults(),s=r.response;return{id:r.id,rawId:r.id,response:{authenticatorData:te(new Uint8Array(s.authenticatorData)),clientDataJSON:te(new Uint8Array(s.clientDataJSON)),signature:te(new Uint8Array(s.signature)),userHandle:s.userHandle?te(new Uint8Array(s.userHandle)):void 0},type:"public-key",clientExtensionResults:i,authenticatorAttachment:(e=t.authenticatorAttachment)!==null&&e!==void 0?e:void 0}}function lr(r){return r==="localhost"||/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(r)}function at(){var r,e;return!!(L()&&"PublicKeyCredential"in window&&window.PublicKeyCredential&&"credentials"in navigator&&typeof((r=navigator?.credentials)===null||r===void 0?void 0:r.create)=="function"&&typeof((e=navigator?.credentials)===null||e===void 0?void 0:e.get)=="function")}async function pr(r){try{let e=await navigator.credentials.create(r);return e?e instanceof PublicKeyCredential?{data:e,error:null}:{data:null,error:new pe("Browser returned unexpected credential type",e)}:{data:null,error:new pe("Empty credential response",e)}}catch(e){return{data:null,error:Bi({error:e,options:r})}}}async function gr(r){try{let e=await navigator.credentials.get(r);return e?e instanceof PublicKeyCredential?{data:e,error:null}:{data:null,error:new pe("Browser returned unexpected credential type",e)}:{data:null,error:new pe("Empty credential response",e)}}catch(e){return{data:null,error:Ni({error:e,options:r})}}}var Sn={hints:["security-key"],authenticatorSelection:{authenticatorAttachment:"cross-platform",requireResidentKey:!1,userVerification:"preferred",residentKey:"discouraged"},attestation:"direct"},Tn={userVerification:"preferred",hints:["security-key"],attestation:"direct"};function Pt(...r){let e=s=>s!==null&&typeof s=="object"&&!Array.isArray(s),t=s=>s instanceof ArrayBuffer||ArrayBuffer.isView(s),i={};for(let s of r)if(s)for(let n in s){let a=s[n];if(a!==void 0)if(Array.isArray(a))i[n]=a;else if(t(a))i[n]=a;else if(e(a)){let o=i[n];e(o)?i[n]=Pt(o,a):i[n]=Pt(a)}else i[n]=a}return i}function An(r,e){return Pt(Sn,r,e||{})}function Cn(r,e){return Pt(Tn,r,e||{})}var Lt=class{constructor(e){this.client=e,this.enroll=this._enroll.bind(this),this.challenge=this._challenge.bind(this),this.verify=this._verify.bind(this),this.authenticate=this._authenticate.bind(this),this.register=this._register.bind(this)}async _enroll(e){return this.client.mfa.enroll(Object.assign(Object.assign({},e),{factorType:"webauthn"}))}async _challenge({factorId:e,webauthn:t,friendlyName:i,signal:s},n){var a;try{let{data:o,error:l}=await this.client.mfa.challenge({factorId:e,webauthn:t});if(!o)return{data:null,error:l};let c=s??jt.createNewAbortSignal();if(o.webauthn.type==="create"){let{user:h}=o.webauthn.credential_options.publicKey;if(!h.name){let d=i;if(d)h.name=`${h.id}:${d}`;else{let u=(await this.client.getUser()).data.user,p=((a=u?.user_metadata)===null||a===void 0?void 0:a.name)||u?.email||u?.id||"User";h.name=`${h.id}:${p}`}}h.displayName||(h.displayName=h.name)}switch(o.webauthn.type){case"create":{let h=An(o.webauthn.credential_options.publicKey,n?.create),{data:d,error:f}=await pr({publicKey:h,signal:c});return d?{data:{factorId:e,challengeId:o.id,webauthn:{type:o.webauthn.type,credential_response:d}},error:null}:{data:null,error:f}}case"request":{let h=Cn(o.webauthn.credential_options.publicKey,n?.request),{data:d,error:f}=await gr(Object.assign(Object.assign({},o.webauthn.credential_options),{publicKey:h,signal:c}));return d?{data:{factorId:e,challengeId:o.id,webauthn:{type:o.webauthn.type,credential_response:d}},error:null}:{data:null,error:f}}}}catch(o){return w(o)?{data:null,error:o}:{data:null,error:new $("Unexpected error in challenge",o)}}}async _verify({challengeId:e,factorId:t,webauthn:i}){return this.client.mfa.verify({factorId:t,challengeId:e,webauthn:i})}async _authenticate({factorId:e,webauthn:{rpId:t=typeof window<"u"?window.location.hostname:void 0,rpOrigins:i=typeof window<"u"?[window.location.origin]:void 0,signal:s}={}},n){if(!t)return{data:null,error:new ie("rpId is required for WebAuthn authentication")};try{if(!at())return{data:null,error:new $("Browser does not support WebAuthn",null)};let{data:a,error:o}=await this.challenge({factorId:e,webauthn:{rpId:t,rpOrigins:i},signal:s},{request:n});if(!a)return{data:null,error:o};let{webauthn:l}=a;return this._verify({factorId:e,challengeId:a.challengeId,webauthn:{type:l.type,rpId:t,rpOrigins:i,credential_response:l.credential_response}})}catch(a){return w(a)?{data:null,error:a}:{data:null,error:new $("Unexpected error in authenticate",a)}}}async _register({friendlyName:e,webauthn:{rpId:t=typeof window<"u"?window.location.hostname:void 0,rpOrigins:i=typeof window<"u"?[window.location.origin]:void 0,signal:s}={}},n){if(!t)return{data:null,error:new ie("rpId is required for WebAuthn registration")};try{if(!at())return{data:null,error:new $("Browser does not support WebAuthn",null)};let{data:a,error:o}=await this._enroll({friendlyName:e});if(!a)return await this.client.mfa.listFactors().then(h=>{var d;return(d=h.data)===null||d===void 0?void 0:d.all.find(f=>f.factor_type==="webauthn"&&f.friendly_name===e&&f.status!=="unverified")}).then(h=>h?this.client.mfa.unenroll({factorId:h?.id}):void 0),{data:null,error:o};let{data:l,error:c}=await this._challenge({factorId:a.id,friendlyName:a.friendly_name,webauthn:{rpId:t,rpOrigins:i},signal:s},{create:n});return l?this._verify({factorId:a.id,challengeId:l.challengeId,webauthn:{rpId:t,rpOrigins:i,type:l.webauthn.type,credential_response:l.webauthn.credential_response}}):{data:null,error:c}}catch(a){return w(a)?{data:null,error:a}:{data:null,error:new $("Unexpected error in register",a)}}}};Pi();var In={url:ri,storageKey:ii,autoRefreshToken:!0,persistSession:!0,detectSessionInUrl:!0,headers:si,flowType:"implicit",debug:!1,hasCustomAuthorizationHeader:!1,throwOnError:!1,lockAcquireTimeout:5e3,skipAutoInitialize:!1,experimental:{}};var Re={},Mi=!1,$t=class r{get jwks(){var e,t;return(t=(e=Re[this.storageKey])===null||e===void 0?void 0:e.jwks)!==null&&t!==void 0?t:{keys:[]}}set jwks(e){Re[this.storageKey]=Object.assign(Object.assign({},Re[this.storageKey]),{jwks:e})}get jwks_cached_at(){var e,t;return(t=(e=Re[this.storageKey])===null||e===void 0?void 0:e.cachedAt)!==null&&t!==void 0?t:Number.MIN_SAFE_INTEGER}set jwks_cached_at(e){Re[this.storageKey]=Object.assign(Object.assign({},Re[this.storageKey]),{cachedAt:e})}constructor(e){var t,i,s;this.userStorage=null,this.memoryStorage=null,this.stateChangeEmitters=new Map,this.autoRefreshTicker=null,this.autoRefreshTickTimeout=null,this.visibilityChangedCallback=null,this.refreshingDeferred=null,this.lastRefreshFailure=null,this._sessionRemovalEpoch=0,this.initializePromise=null,this._pendingInitNotifications=null,this.detectSessionInUrl=!0,this.hasCustomAuthorizationHeader=!1,this.suppressGetSessionWarning=!1,this.lock=null,this.lockAcquired=!1,this.pendingInLock=[],this.broadcastChannel=null,this.logger=console.log;let n=Object.assign(Object.assign({},In),e);if(this.storageKey=n.storageKey,this.instanceID=(t=r.nextInstanceID[this.storageKey])!==null&&t!==void 0?t:0,r.nextInstanceID[this.storageKey]=this.instanceID+1,this.logDebugMessages=!!n.debug,typeof n.debug=="function"&&(this.logger=n.debug),this.instanceID>0&&L()){let a=`${this._logPrefix()} Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.`;console.warn(a),this.logDebugMessages&&console.trace(a)}if(this.persistSession=n.persistSession,this.autoRefreshToken=n.autoRefreshToken,this.experimental=(i=n.experimental)!==null&&i!==void 0?i:{},this.admin=new fe({url:n.url,headers:n.headers,fetch:n.fetch,experimental:this.experimental}),this.url=n.url,this.headers=n.headers,this.fetch=Ct(n.fetch),this.detectSessionInUrl=n.detectSessionInUrl,this.flowType=n.flowType,this.hasCustomAuthorizationHeader=n.hasCustomAuthorizationHeader,this.throwOnError=n.throwOnError,this.lockAcquireTimeout=n.lockAcquireTimeout,n.lock!=null&&(this.lock=n.lock,Mi||(Mi=!0,console.warn(`${this._logPrefix()} The "lock" option is deprecated and will be removed in v3. The client now coordinates session refreshes without a lock, so most apps can drop the option. See https://github.com/supabase/supabase-js/blob/master/packages/core/auth-js/migrations/lockless-coordination.md`))),this.jwks||(this.jwks={keys:[]},this.jwks_cached_at=Number.MIN_SAFE_INTEGER),this.mfa={verify:this._verify.bind(this),enroll:this._enroll.bind(this),unenroll:this._unenroll.bind(this),challenge:this._challenge.bind(this),listFactors:this._listFactors.bind(this),challengeAndVerify:this._challengeAndVerify.bind(this),getAuthenticatorAssuranceLevel:this._getAuthenticatorAssuranceLevel.bind(this),webauthn:new Lt(this)},this.oauth={getAuthorizationDetails:this._getAuthorizationDetails.bind(this),approveAuthorization:this._approveAuthorization.bind(this),denyAuthorization:this._denyAuthorization.bind(this),listGrants:this._listOAuthGrants.bind(this),revokeGrant:this._revokeOAuthGrant.bind(this)},this.passkey={startRegistration:this._startPasskeyRegistration.bind(this),verifyRegistration:this._verifyPasskeyRegistration.bind(this),startAuthentication:this._startPasskeyAuthentication.bind(this),verifyAuthentication:this._verifyPasskeyAuthentication.bind(this),list:this._listPasskeys.bind(this),update:this._updatePasskey.bind(this),delete:this._deletePasskey.bind(this)},this.persistSession?(n.storage?this.storage=n.storage:At()?this.storage=globalThis.localStorage:(this.memoryStorage={},this.storage=ar(this.memoryStorage)),n.userStorage&&(this.userStorage=n.userStorage)):(this.memoryStorage={},this.storage=ar(this.memoryStorage)),L()&&globalThis.BroadcastChannel&&this.persistSession&&this.storageKey){try{this.broadcastChannel=new globalThis.BroadcastChannel(this.storageKey)}catch(a){console.error("Failed to create a new BroadcastChannel, multi-tab state changes will not be available",a)}(s=this.broadcastChannel)===null||s===void 0||s.addEventListener("message",async a=>{this._debug("received broadcast notification from other tab or client",a),(a.data.event==="TOKEN_REFRESHED"||a.data.event==="SIGNED_IN")&&(this.lastRefreshFailure=null);try{await this._notifyAllSubscribers(a.data.event,a.data.session,!1)}catch(o){this._debug("#broadcastChannel","error",o)}})}n.skipAutoInitialize||this.initialize().catch(a=>{this._debug("#initialize()","error",a)})}isThrowOnErrorEnabled(){return this.throwOnError}_returnResult(e){if(this.throwOnError&&e&&e.error)throw e.error;return e}_logPrefix(){return`GoTrueClient@${this.storageKey}:${this.instanceID} (${xt}) ${new Date().toISOString()}`}_debug(...e){return this.logDebugMessages&&this.logger(this._logPrefix(),...e),this}async initialize(){var e;if(this.initializePromise)return await this.initializePromise;this._pendingInitNotifications=[],this.initializePromise=(async()=>this.lock!=null?await this._acquireLock(this.lockAcquireTimeout,async()=>await this._initialize()):await this._initialize())();let t=await this.initializePromise,i=(e=this._pendingInitNotifications)!==null&&e!==void 0?e:[];this._pendingInitNotifications=null;for(let s of i)await this._notifyAllSubscribers(s.event,s.session,s.broadcast);return t}async _initialize(){var e;try{let t={},i="none";if(L()&&(t=tr(window.location.href),this._isImplicitGrantCallback(t)?i="implicit":await this._isPKCECallback(t)&&(i="pkce")),L()&&this.detectSessionInUrl&&i!=="none"){let{data:s,error:n}=await this._getSessionFromURL(t,i);if(n){if(this._debug("#_initialize()","error detecting session from URL",n),li(n)){let l=(e=n.details)===null||e===void 0?void 0:e.code;if(l==="identity_already_exists"||l==="identity_not_found"||l==="single_identity_not_deletable")return{error:n}}return{error:n}}let{session:a,redirectType:o}=s;return this._debug("#_initialize()","detected session in URL",a,"redirect type",o),await this._saveSession(a),setTimeout(async()=>{o==="recovery"?await this._notifyAllSubscribers("PASSWORD_RECOVERY",a):await this._notifyAllSubscribers("SIGNED_IN",a)},0),{error:null}}return await this._recoverAndRefresh(),{error:null}}catch(t){return w(t)?this._returnResult({error:t}):this._returnResult({error:new $("Unexpected error during initialization",t)})}finally{await this._handleVisibilityChange(),this._debug("#_initialize()","end")}}async signInAnonymously(e){var t,i,s;try{let n=await k(this.fetch,"POST",`${this.url}/signup`,{headers:this.headers,body:{data:(i=(t=e?.options)===null||t===void 0?void 0:t.data)!==null&&i!==void 0?i:{},gotrue_meta_security:{captcha_token:(s=e?.options)===null||s===void 0?void 0:s.captchaToken}},xform:H}),{data:a,error:o}=n;if(o||!a)return this._returnResult({data:{user:null,session:null},error:o});let l=a.session,c=a.user;return a.session&&(await this._saveSession(a.session),await this._notifyAllSubscribers("SIGNED_IN",l)),this._returnResult({data:{user:c,session:l},error:null})}catch(n){if(w(n))return this._returnResult({data:{user:null,session:null},error:n});throw n}}async signUp(e){var t,i,s;let n=null;try{let a;if("email"in e){let{email:d,password:f,options:u}=e,p=null,g=null;this.flowType==="pkce"&&([p,g,n]=await this._getCodeChallengeAndMethod()),a=await k(this.fetch,"POST",`${this.url}/signup`,{headers:this.headers,redirectTo:this._maybeAppendFlowIdToRedirect(u?.emailRedirectTo,n),body:{email:d,password:f,data:(t=u?.data)!==null&&t!==void 0?t:{},gotrue_meta_security:{captcha_token:u?.captchaToken},code_challenge:p,code_challenge_method:g},xform:H})}else if("phone"in e){let{phone:d,password:f,options:u}=e;a=await k(this.fetch,"POST",`${this.url}/signup`,{headers:this.headers,body:{phone:d,password:f,data:(i=u?.data)!==null&&i!==void 0?i:{},channel:(s=u?.channel)!==null&&s!==void 0?s:"sms",gotrue_meta_security:{captcha_token:u?.captchaToken}},xform:H})}else throw new oe("You must provide either an email or phone number and a password");let{data:o,error:l}=a;if(l||!o)return await q(this.storage,this.storageKey,n),this._returnResult({data:{user:null,session:null},error:l});let c=o.session,h=o.user;return o.session&&(await this._saveSession(o.session),await this._notifyAllSubscribers("SIGNED_IN",c)),this._returnResult({data:{user:h,session:c},error:null})}catch(a){if(await q(this.storage,this.storageKey,n),w(a))return this._returnResult({data:{user:null,session:null},error:a});throw a}}async signInWithPassword(e){try{let t;if("email"in e){let{email:n,password:a,options:o}=e;t=await k(this.fetch,"POST",`${this.url}/token?grant_type=password`,{headers:this.headers,body:{email:n,password:a,gotrue_meta_security:{captcha_token:o?.captchaToken}},xform:sr})}else if("phone"in e){let{phone:n,password:a,options:o}=e;t=await k(this.fetch,"POST",`${this.url}/token?grant_type=password`,{headers:this.headers,body:{phone:n,password:a,gotrue_meta_security:{captcha_token:o?.captchaToken}},xform:sr})}else throw new oe("You must provide either an email or phone number and a password");let{data:i,error:s}=t;if(s)return this._returnResult({data:{user:null,session:null},error:s});if(!i||!i.session||!i.user){let n=new ee;return this._returnResult({data:{user:null,session:null},error:n})}return i.session&&(await this._saveSession(i.session),await this._notifyAllSubscribers("SIGNED_IN",i.session)),this._returnResult({data:Object.assign({user:i.user,session:i.session},i.weak_password?{weakPassword:i.weak_password}:null),error:s})}catch(t){if(w(t))return this._returnResult({data:{user:null,session:null},error:t});throw t}}async signInWithOAuth(e){var t,i,s,n;return await this._handleProviderSignIn(e.provider,{redirectTo:(t=e.options)===null||t===void 0?void 0:t.redirectTo,scopes:(i=e.options)===null||i===void 0?void 0:i.scopes,queryParams:(s=e.options)===null||s===void 0?void 0:s.queryParams,skipBrowserRedirect:(n=e.options)===null||n===void 0?void 0:n.skipBrowserRedirect})}async exchangeCodeForSession(e,t){return await this.initializePromise,this.lock!=null?this._acquireLock(this.lockAcquireTimeout,async()=>this._exchangeCodeForSession(e,t)):this._exchangeCodeForSession(e,t)}async signInWithWeb3(e){let{chain:t}=e;switch(t){case"ethereum":return await this.signInWithEthereum(e);case"solana":return await this.signInWithSolana(e);default:throw new Error(`@supabase/auth-js: Unsupported chain "${t}"`)}}async signInWithEthereum(e){var t,i,s,n,a,o,l,c,h,d,f;let u,p;if("message"in e)u=e.message,p=e.signature;else{let{chain:g,wallet:y,statement:_,options:E}=e,m;if(L())if(typeof y=="object")m=y;else{let A=window;if("ethereum"in A&&typeof A.ethereum=="object"&&"request"in A.ethereum&&typeof A.ethereum.request=="function")m=A.ethereum;else throw new Error("@supabase/auth-js: No compatible Ethereum wallet interface on the window object (window.ethereum) detected. Make sure the user already has a wallet installed and connected for this app. Prefer passing the wallet interface object directly to signInWithWeb3({ chain: 'ethereum', wallet: resolvedUserWallet }) instead.")}else{if(typeof y!="object"||!E?.url)throw new Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");m=y}let x=new URL((t=E?.url)!==null&&t!==void 0?t:window.location.href),b=await m.request({method:"eth_requestAccounts"}).then(A=>A).catch(()=>{throw new Error("@supabase/auth-js: Wallet method eth_requestAccounts is missing or invalid")});if(!b||b.length===0)throw new Error("@supabase/auth-js: No accounts available. Please ensure the wallet is connected.");let v=or(b[0]),T=(i=E?.signInWithEthereum)===null||i===void 0?void 0:i.chainId;if(!T){let A=await m.request({method:"eth_chainId"});T=Li(A)}let C={domain:x.host,address:v,statement:_,uri:x.href,version:"1",chainId:T,nonce:(s=E?.signInWithEthereum)===null||s===void 0?void 0:s.nonce,issuedAt:(a=(n=E?.signInWithEthereum)===null||n===void 0?void 0:n.issuedAt)!==null&&a!==void 0?a:new Date,expirationTime:(o=E?.signInWithEthereum)===null||o===void 0?void 0:o.expirationTime,notBefore:(l=E?.signInWithEthereum)===null||l===void 0?void 0:l.notBefore,requestId:(c=E?.signInWithEthereum)===null||c===void 0?void 0:c.requestId,resources:(h=E?.signInWithEthereum)===null||h===void 0?void 0:h.resources};u=$i(C),p=await m.request({method:"personal_sign",params:[ji(u),v]})}try{let{data:g,error:y}=await k(this.fetch,"POST",`${this.url}/token?grant_type=web3`,{headers:this.headers,body:Object.assign({chain:"ethereum",message:u,signature:p},!((d=e.options)===null||d===void 0)&&d.captchaToken?{gotrue_meta_security:{captcha_token:(f=e.options)===null||f===void 0?void 0:f.captchaToken}}:null),xform:H});if(y)throw y;if(!g||!g.session||!g.user){let _=new ee;return this._returnResult({data:{user:null,session:null},error:_})}return g.session&&(await this._saveSession(g.session),await this._notifyAllSubscribers("SIGNED_IN",g.session)),this._returnResult({data:Object.assign({},g),error:y})}catch(g){if(w(g))return this._returnResult({data:{user:null,session:null},error:g});throw g}}async signInWithSolana(e){var t,i,s,n,a,o,l,c,h,d,f,u;let p,g;if("message"in e)p=e.message,g=e.signature;else{let{chain:y,wallet:_,statement:E,options:m}=e,x;if(L())if(typeof _=="object")x=_;else{let v=window;if("solana"in v&&typeof v.solana=="object"&&("signIn"in v.solana&&typeof v.solana.signIn=="function"||"signMessage"in v.solana&&typeof v.solana.signMessage=="function"))x=v.solana;else throw new Error("@supabase/auth-js: No compatible Solana wallet interface on the window object (window.solana) detected. Make sure the user already has a wallet installed and connected for this app. Prefer passing the wallet interface object directly to signInWithWeb3({ chain: 'solana', wallet: resolvedUserWallet }) instead.")}else{if(typeof _!="object"||!m?.url)throw new Error("@supabase/auth-js: Both wallet and url must be specified in non-browser environments.");x=_}let b=new URL((t=m?.url)!==null&&t!==void 0?t:window.location.href);if("signIn"in x&&x.signIn){let v=await x.signIn(Object.assign(Object.assign(Object.assign({issuedAt:new Date().toISOString()},m?.signInWithSolana),{version:"1",domain:b.host,uri:b.href}),E?{statement:E}:null)),T;if(Array.isArray(v)&&v[0]&&typeof v[0]=="object")T=v[0];else if(v&&typeof v=="object"&&"signedMessage"in v&&"signature"in v)T=v;else throw new Error("@supabase/auth-js: Wallet method signIn() returned unrecognized value");if("signedMessage"in T&&"signature"in T&&(typeof T.signedMessage=="string"||T.signedMessage instanceof Uint8Array)&&T.signature instanceof Uint8Array)p=typeof T.signedMessage=="string"?T.signedMessage:new TextDecoder().decode(T.signedMessage),g=T.signature;else throw new Error("@supabase/auth-js: Wallet method signIn() API returned object without signedMessage and signature fields")}else{if(!("signMessage"in x)||typeof x.signMessage!="function"||!("publicKey"in x)||typeof x!="object"||!x.publicKey||!("toBase58"in x.publicKey)||typeof x.publicKey.toBase58!="function")throw new Error("@supabase/auth-js: Wallet does not have a compatible signMessage() and publicKey.toBase58() API");p=[`${b.host} wants you to sign in with your Solana account:`,x.publicKey.toBase58(),...E?["",E,""]:[""],"Version: 1",`URI: ${b.href}`,`Issued At: ${(s=(i=m?.signInWithSolana)===null||i===void 0?void 0:i.issuedAt)!==null&&s!==void 0?s:new Date().toISOString()}`,...!((n=m?.signInWithSolana)===null||n===void 0)&&n.notBefore?[`Not Before: ${m.signInWithSolana.notBefore}`]:[],...!((a=m?.signInWithSolana)===null||a===void 0)&&a.expirationTime?[`Expiration Time: ${m.signInWithSolana.expirationTime}`]:[],...!((o=m?.signInWithSolana)===null||o===void 0)&&o.chainId?[`Chain ID: ${m.signInWithSolana.chainId}`]:[],...!((l=m?.signInWithSolana)===null||l===void 0)&&l.nonce?[`Nonce: ${m.signInWithSolana.nonce}`]:[],...!((c=m?.signInWithSolana)===null||c===void 0)&&c.requestId?[`Request ID: ${m.signInWithSolana.requestId}`]:[],...!((d=(h=m?.signInWithSolana)===null||h===void 0?void 0:h.resources)===null||d===void 0)&&d.length?["Resources",...m.signInWithSolana.resources.map(T=>`- ${T}`)]:[]].join(`
`);let v=await x.signMessage(new TextEncoder().encode(p),"utf8");if(!v||!(v instanceof Uint8Array))throw new Error("@supabase/auth-js: Wallet signMessage() API returned an recognized value");g=v}}try{let{data:y,error:_}=await k(this.fetch,"POST",`${this.url}/token?grant_type=web3`,{headers:this.headers,body:Object.assign({chain:"solana",message:p,signature:te(g)},!((f=e.options)===null||f===void 0)&&f.captchaToken?{gotrue_meta_security:{captcha_token:(u=e.options)===null||u===void 0?void 0:u.captchaToken}}:null),xform:H});if(_)throw _;if(!y||!y.session||!y.user){let E=new ee;return this._returnResult({data:{user:null,session:null},error:E})}return y.session&&(await this._saveSession(y.session),await this._notifyAllSubscribers("SIGNED_IN",y.session)),this._returnResult({data:Object.assign({},y),error:_})}catch(y){if(w(y))return this._returnResult({data:{user:null,session:null},error:y});throw y}}async _exchangeCodeForSession(e,t){let i=t?.flowId!=null,s=i?nt(t?.flowId):L()?nt(tr(window.location.href)[Z]):null;i&&!s&&this._debug("#_exchangeCodeForSession()","provided flowId is not a valid flow id",t?.flowId);let{verifier:n,flowId:a}=i&&!s?{verifier:null,flowId:null}:await bi(this.storage,this.storageKey,s),[o,l]=(n??"").split("/");try{if(!o&&this.flowType==="pkce")throw new St;let{data:c,error:h}=await k(this.fetch,"POST",`${this.url}/token?grant_type=pkce`,{headers:this.headers,body:{auth_code:e,code_verifier:o},xform:H});if(await q(this.storage,this.storageKey,a),h)throw h;if(!c||!c.session||!c.user){let d=new ee;return this._returnResult({data:{user:null,session:null,redirectType:null},error:d})}return c.session&&(await this._saveSession(c.session),await this._notifyAllSubscribers(l==="recovery"?"PASSWORD_RECOVERY":"SIGNED_IN",c.session)),this._returnResult({data:Object.assign(Object.assign({},c),{redirectType:l??null}),error:h})}catch(c){if(await q(this.storage,this.storageKey,a),w(c))return this._returnResult({data:{user:null,session:null,redirectType:null},error:c});throw c}}async signInWithIdToken(e){try{let{options:t,provider:i,token:s,access_token:n,nonce:a}=e,o=await k(this.fetch,"POST",`${this.url}/token?grant_type=id_token`,{headers:this.headers,body:{provider:i,id_token:s,access_token:n,nonce:a,gotrue_meta_security:{captcha_token:t?.captchaToken}},xform:H}),{data:l,error:c}=o;if(c)return this._returnResult({data:{user:null,session:null},error:c});if(!l||!l.session||!l.user){let h=new ee;return this._returnResult({data:{user:null,session:null},error:h})}return l.session&&(await this._saveSession(l.session),await this._notifyAllSubscribers("SIGNED_IN",l.session)),this._returnResult({data:l,error:c})}catch(t){if(w(t))return this._returnResult({data:{user:null,session:null},error:t});throw t}}async signInWithOtp(e){var t,i,s,n,a;let o=null;try{if("email"in e){let{email:l,options:c}=e,h=null,d=null;this.flowType==="pkce"&&([h,d,o]=await this._getCodeChallengeAndMethod());let{error:f}=await k(this.fetch,"POST",`${this.url}/otp`,{headers:this.headers,body:{email:l,data:(t=c?.data)!==null&&t!==void 0?t:{},create_user:(i=c?.shouldCreateUser)!==null&&i!==void 0?i:!0,gotrue_meta_security:{captcha_token:c?.captchaToken},code_challenge:h,code_challenge_method:d},redirectTo:this._maybeAppendFlowIdToRedirect(c?.emailRedirectTo,o)});return this._returnResult({data:{user:null,session:null},error:f})}if("phone"in e){let{phone:l,options:c}=e,{data:h,error:d}=await k(this.fetch,"POST",`${this.url}/otp`,{headers:this.headers,body:{phone:l,data:(s=c?.data)!==null&&s!==void 0?s:{},create_user:(n=c?.shouldCreateUser)!==null&&n!==void 0?n:!0,gotrue_meta_security:{captcha_token:c?.captchaToken},channel:(a=c?.channel)!==null&&a!==void 0?a:"sms"}});return this._returnResult({data:{user:null,session:null,messageId:h?.message_id},error:d})}throw new oe("You must provide either an email or phone number.")}catch(l){if(await q(this.storage,this.storageKey,o),w(l))return this._returnResult({data:{user:null,session:null},error:l});throw l}}async verifyOtp(e){var t,i;try{let s,n;"options"in e&&(s=(t=e.options)===null||t===void 0?void 0:t.redirectTo,n=(i=e.options)===null||i===void 0?void 0:i.captchaToken);let{data:a,error:o}=await k(this.fetch,"POST",`${this.url}/verify`,{headers:this.headers,body:Object.assign(Object.assign({},e),{gotrue_meta_security:{captcha_token:n}}),redirectTo:s,xform:H});if(o)throw o;if(!a)throw new Error("An error occurred on token verification.");let l=a.session,c=a.user;return l?.access_token&&(await this._saveSession(l),await this._notifyAllSubscribers(e.type=="recovery"?"PASSWORD_RECOVERY":"SIGNED_IN",l)),this._returnResult({data:{user:c,session:l},error:null})}catch(s){if(w(s))return this._returnResult({data:{user:null,session:null},error:s});throw s}}async signInWithSSO(e){var t,i,s,n;let a=null;try{let o=null,l=null;this.flowType==="pkce"&&([o,l,a]=await this._getCodeChallengeAndMethod());let c=await k(this.fetch,"POST",`${this.url}/sso`,{body:Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({},"providerId"in e?{provider_id:e.providerId}:null),"domain"in e?{domain:e.domain}:null),{redirect_to:this._maybeAppendFlowIdToRedirect((t=e.options)===null||t===void 0?void 0:t.redirectTo,a)}),!((i=e?.options)===null||i===void 0)&&i.captchaToken?{gotrue_meta_security:{captcha_token:e.options.captchaToken}}:null),{skip_http_redirect:!0,code_challenge:o,code_challenge_method:l}),headers:this.headers,xform:Ri});return!((s=c.data)===null||s===void 0)&&s.url&&L()&&!(!((n=e.options)===null||n===void 0)&&n.skipBrowserRedirect)&&window.location.assign(c.data.url),this._returnResult(c)}catch(o){if(await q(this.storage,this.storageKey,a),w(o))return this._returnResult({data:null,error:o});throw o}}async reauthenticate(){return await this.initializePromise,this.lock!=null?await this._acquireLock(this.lockAcquireTimeout,async()=>await this._reauthenticate()):await this._reauthenticate()}async _reauthenticate(){try{return await this._useSession(async e=>{let{data:{session:t},error:i}=e;if(i)throw i;if(!t)throw new O;let{error:s}=await k(this.fetch,"GET",`${this.url}/reauthenticate`,{headers:this.headers,jwt:t.access_token});return this._returnResult({data:{user:null,session:null},error:s})})}catch(e){if(w(e))return this._returnResult({data:{user:null,session:null},error:e});throw e}}async resend(e){let t=null;try{let i=`${this.url}/resend`;if("email"in e){let{email:s,type:n,options:a}=e,o=null,l=null;this.flowType==="pkce"&&([o,l,t]=await this._getCodeChallengeAndMethod());let{error:c}=await k(this.fetch,"POST",i,{headers:this.headers,body:{email:s,type:n,gotrue_meta_security:{captcha_token:a?.captchaToken},code_challenge:o,code_challenge_method:l},redirectTo:this._maybeAppendFlowIdToRedirect(a?.emailRedirectTo,t)});return c&&await q(this.storage,this.storageKey,t),this._returnResult({data:{user:null,session:null},error:c})}else if("phone"in e){let{phone:s,type:n,options:a}=e,{data:o,error:l}=await k(this.fetch,"POST",i,{headers:this.headers,body:{phone:s,type:n,gotrue_meta_security:{captcha_token:a?.captchaToken}}});return this._returnResult({data:{user:null,session:null,messageId:o?.message_id},error:l})}throw new oe("You must provide either an email or phone number and a type")}catch(i){if(await q(this.storage,this.storageKey,t),w(i))return this._returnResult({data:{user:null,session:null},error:i});throw i}}async getSession(){return await this.initializePromise,this.lock!=null?await this._acquireLock(this.lockAcquireTimeout,async()=>this._useSession(async e=>e)):await this._useSession(async e=>e)}async _acquireLock(e,t){this._debug("#_acquireLock","begin",e);try{if(this.lockAcquired){let i=this.pendingInLock.length?this.pendingInLock[this.pendingInLock.length-1]:Promise.resolve(),s=(async()=>(await i,await t()))();return this.pendingInLock.push((async()=>{try{await s}catch{}})()),s}return await this.lock(`lock:${this.storageKey}`,e,async()=>{this._debug("#_acquireLock","lock acquired for storage key",this.storageKey);try{this.lockAcquired=!0;let i=t();for(this.pendingInLock.push((async()=>{try{await i}catch{}})()),await i;this.pendingInLock.length;){let s=[...this.pendingInLock];await Promise.all(s),this.pendingInLock.splice(0,s.length)}return await i}finally{this._debug("#_acquireLock","lock released for storage key",this.storageKey),this.lockAcquired=!1}})}finally{this._debug("#_acquireLock","end")}}async _useSession(e){this._debug("#_useSession","begin");try{let t=await this.__loadSession();return await e(t)}finally{this._debug("#_useSession","end")}}async __loadSession(){this._debug("#__loadSession()","begin"),this.lock!=null&&!this.lockAcquired&&this._debug("#__loadSession()","used outside of an acquired lock!",new Error().stack);try{let e=null,t=await j(this.storage,this.storageKey);if(this._debug("#getSession()","session from storage",t),t!==null&&(this._isValidSession(t)?e=t:(this._debug("#getSession()","session from storage is not valid"),await this._removeSession())),!e)return{data:{session:null},error:null};let i=e.expires_at?e.expires_at*1e3-Date.now()<kt:!1;if(this._debug("#__loadSession()",`session has${i?"":" not"} expired`,"expires_at",e.expires_at),!i){if(this.userStorage){let a=await j(this.userStorage,this.storageKey+"-user");a?.user?e.user=a.user:e.user=It()}if(this.storage.isServer&&e.user&&!e.user.__isUserNotAvailableProxy){let a={value:this.suppressGetSessionWarning};e.user=Ai(e.user,a),a.value&&(this.suppressGetSessionWarning=!0)}return{data:{session:e},error:null}}let{data:s,error:n}=await this._callRefreshToken(e.refresh_token);if(n){if(!!(e.expires_at&&e.expires_at*1e3>Date.now())){let o=await j(this.storage,this.storageKey);if(o&&o.refresh_token===e.refresh_token)return this._returnResult({data:{session:e},error:null})}return this._returnResult({data:{session:null},error:n})}return this._returnResult({data:{session:s},error:null})}finally{this._debug("#__loadSession()","end")}}async getUser(e){if(e)return await this._getUser(e);await this.initializePromise;let t;return this.lock!=null?t=await this._acquireLock(this.lockAcquireTimeout,async()=>await this._getUser()):t=await this._getUser(),t.data.user&&(this.suppressGetSessionWarning=!0),t}async _getUser(e){try{return e?await k(this.fetch,"GET",`${this.url}/user`,{headers:this.headers,jwt:e,xform:Q}):await this._useSession(async t=>{var i,s,n;let{data:a,error:o}=t;if(o)throw o;return!(!((i=a.session)===null||i===void 0)&&i.access_token)&&!this.hasCustomAuthorizationHeader?{data:{user:null},error:new O}:await k(this.fetch,"GET",`${this.url}/user`,{headers:this.headers,jwt:(n=(s=a.session)===null||s===void 0?void 0:s.access_token)!==null&&n!==void 0?n:void 0,xform:Q})})}catch(t){if(w(t))return et(t)&&await this._removeSession(),this._returnResult({data:{user:null},error:t});throw t}}async updateUser(e,t={}){return await this.initializePromise,this.lock!=null?await this._acquireLock(this.lockAcquireTimeout,async()=>await this._updateUser(e,t)):await this._updateUser(e,t)}async _updateUser(e,t={}){let i=null;try{return await this._useSession(async s=>{let{data:n,error:a}=s;if(a)throw a;if(!n.session)throw new O;let o=n.session,l=null,c=null;this.flowType==="pkce"&&e.email!=null&&([l,c,i]=await this._getCodeChallengeAndMethod());let{data:h,error:d}=await k(this.fetch,"PUT",`${this.url}/user`,{headers:this.headers,redirectTo:this._maybeAppendFlowIdToRedirect(t?.emailRedirectTo,i),body:Object.assign(Object.assign({},e),{code_challenge:l,code_challenge_method:c}),jwt:o.access_token,xform:Q});if(d)throw d;return o.user=h.user,await this._saveSession(o),await this._notifyAllSubscribers("USER_UPDATED",o),this._returnResult({data:{user:o.user},error:null})})}catch(s){if(await q(this.storage,this.storageKey,i),w(s))return this._returnResult({data:{user:null},error:s});throw s}}async setSession(e){return await this.initializePromise,this.lock!=null?await this._acquireLock(this.lockAcquireTimeout,async()=>await this._setSession(e)):await this._setSession(e)}async _setSession(e){try{if(!e.access_token||!e.refresh_token)throw new O;let t=Date.now()/1e3,i=t,s=!0,n=null,{payload:a}=st(e.access_token);if(a.exp&&(i=a.exp,s=i<=t),s){let{data:o,error:l}=await this._callRefreshToken(e.refresh_token);if(l)return this._returnResult({data:{user:null,session:null},error:l});if(!o)return{data:{user:null,session:null},error:null};n=o}else{let{data:o,error:l}=await this._getUser(e.access_token);if(l)return this._returnResult({data:{user:null,session:null},error:l});n={access_token:e.access_token,refresh_token:e.refresh_token,user:o.user,token_type:"bearer",expires_in:i-t,expires_at:i},await this._saveSession(n),await this._notifyAllSubscribers("SIGNED_IN",n)}return this._returnResult({data:{user:n.user,session:n},error:null})}catch(t){if(w(t))return this._returnResult({data:{session:null,user:null},error:t});throw t}}async refreshSession(e){return await this.initializePromise,this.lock!=null?await this._acquireLock(this.lockAcquireTimeout,async()=>await this._refreshSession(e)):await this._refreshSession(e)}async _refreshSession(e){try{return await this._useSession(async t=>{var i;if(!e){let{data:a,error:o}=t;if(o)throw o;e=(i=a.session)!==null&&i!==void 0?i:void 0}if(!e?.refresh_token)throw new O;let{data:s,error:n}=await this._callRefreshToken(e.refresh_token);return n?this._returnResult({data:{user:null,session:null},error:n}):s?this._returnResult({data:{user:s.user,session:s},error:null}):this._returnResult({data:{user:null,session:null},error:null})})}catch(t){if(w(t))return this._returnResult({data:{user:null,session:null},error:t});throw t}}async _getSessionFromURL(e,t){var i;try{if(!L())throw new le("No browser detected.");if(e.error||e.error_description||e.error_code)throw new le(e.error_description||"Error in URL with unspecified error_description",{error:e.error||"unspecified_error",code:e.error_code||"unspecified_code"});switch(t){case"implicit":if(this.flowType==="pkce")throw new Qe("Not a valid PKCE flow url.");break;case"pkce":if(this.flowType==="implicit")throw new le("Not a valid implicit grant flow url.");break;default:}if(t==="pkce"){if(this._debug("#_initialize()","begin","is PKCE flow",!0),!e.code)throw new Qe("No code detected.");let{data:m,error:x}=await this._exchangeCodeForSession(e.code,{flowId:e[Z]});if(x)throw x;let b=new URL(window.location.href);return b.searchParams.delete("code"),b.searchParams.delete(Z),window.history.replaceState(window.history.state,"",b.toString()),{data:{session:m.session,redirectType:(i=m.redirectType)!==null&&i!==void 0?i:null},error:null}}let{provider_token:s,provider_refresh_token:n,access_token:a,refresh_token:o,expires_in:l,expires_at:c,token_type:h}=e;if(!a||!l||!o||!h)throw new le("No session defined in URL");let d=Math.round(Date.now()/1e3),f=parseInt(l),u=d+f;c&&(u=parseInt(c));let p=u-d;p*1e3<=G&&console.warn(`@supabase/gotrue-js: Session as retrieved from URL expires in ${p}s, should have been closer to ${f}s`);let g=u-f;d-g>=120?console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued over 120s ago, URL could be stale",g,u,d):d-g<0&&console.warn("@supabase/gotrue-js: Session as retrieved from URL was issued in the future? Check the device clock for skew",g,u,d);let{data:y,error:_}=await this._getUser(a);if(_)throw _;let E={provider_token:s,provider_refresh_token:n,access_token:a,expires_in:f,expires_at:u,refresh_token:o,token_type:h,user:y.user};return window.location.hash="",this._debug("#_getSessionFromURL()","clearing window.location.hash"),this._returnResult({data:{session:E,redirectType:e.type},error:null})}catch(s){if(w(s))return this._returnResult({data:{session:null,redirectType:null},error:s});throw s}}_isImplicitGrantCallback(e){return typeof this.detectSessionInUrl=="function"?this.detectSessionInUrl(new URL(window.location.href),e):!!(e.access_token||e.error||e.error_description||e.error_code)}async _isPKCECallback(e){if(!e.code)return!1;let t=nt(e[Z]);return t&&await j(this.storage,de(this.storageKey,t))?!0:!!await j(this.storage,`${this.storageKey}-code-verifier`)}async signOut(e={scope:"global"}){return await this.initializePromise,this.lock!=null?await this._acquireLock(this.lockAcquireTimeout,async()=>await this._signOut(e)):await this._signOut(e)}async _signOut({scope:e}={scope:"global"}){return await this._useSession(async t=>{var i;let s=async()=>{await this._removeSession()},{data:n,error:a}=t;if(a&&!et(a))return this._returnResult({error:a});let o=(i=n.session)===null||i===void 0?void 0:i.access_token;if(o){let{error:l}=await this.admin.signOut(o,e);if(l&&!(Zt(l)&&(l.status===404||l.status===401||l.status===403)||et(l)))return e!=="others"&&await s(),this._returnResult({error:l})}return e!=="others"&&await s(),this._returnResult({error:null})})}onAuthStateChange(e){let t=gi(),i={id:t,callback:e,unsubscribe:()=>{this._debug("#unsubscribe()","state change callback with id removed",t),this.stateChangeEmitters.delete(t)}};return this._debug("#onAuthStateChange()","registered callback with id",t),this.stateChangeEmitters.set(t,i),(async()=>(await this.initializePromise,this.lock!=null?await this._acquireLock(this.lockAcquireTimeout,async()=>{this._emitInitialSession(t)}):await this._emitInitialSession(t)))(),{data:{subscription:i}}}async _emitInitialSession(e){return await this._useSession(async t=>{var i,s;try{let{data:{session:n},error:a}=t;if(a)throw a;await((i=this.stateChangeEmitters.get(e))===null||i===void 0?void 0:i.callback("INITIAL_SESSION",n)),this._debug("INITIAL_SESSION","callback id",e,"session",n)}catch(n){await((s=this.stateChangeEmitters.get(e))===null||s===void 0?void 0:s.callback("INITIAL_SESSION",null)),this._debug("INITIAL_SESSION","callback id",e,"error",n),et(n)||tt(n)||Zt(n)&&(n.code==="refresh_token_not_found"||n.code==="refresh_token_already_used"||n.code==="session_expired")?console.warn(n):console.error(n)}})}async resetPasswordForEmail(e,t={}){let i=null,s=null,n=null;this.flowType==="pkce"&&([i,s,n]=await this._getCodeChallengeAndMethod(!0));try{return await k(this.fetch,"POST",`${this.url}/recover`,{body:{email:e,code_challenge:i,code_challenge_method:s,gotrue_meta_security:{captcha_token:t.captchaToken}},headers:this.headers,redirectTo:this._maybeAppendFlowIdToRedirect(t.redirectTo,n)})}catch(a){if(await q(this.storage,this.storageKey,n),w(a))return this._returnResult({data:null,error:a});throw a}}async getUserIdentities(){var e;try{let{data:t,error:i}=await this.getUser();if(i)throw i;return this._returnResult({data:{identities:(e=t.user.identities)!==null&&e!==void 0?e:[]},error:null})}catch(t){if(w(t))return this._returnResult({data:null,error:t});throw t}}async linkIdentity(e){return"token"in e?this.linkIdentityIdToken(e):this.linkIdentityOAuth(e)}async linkIdentityOAuth(e){var t;let i=null;try{let{data:s,error:n}=await this._useSession(async a=>{var o,l,c,h,d;let{data:f,error:u}=a;if(u)throw u;let{url:p,flowId:g}=await this._getUrlForProvider(`${this.url}/user/identities/authorize`,e.provider,{redirectTo:(o=e.options)===null||o===void 0?void 0:o.redirectTo,scopes:(l=e.options)===null||l===void 0?void 0:l.scopes,queryParams:(c=e.options)===null||c===void 0?void 0:c.queryParams,skipBrowserRedirect:!0});return i=g,await k(this.fetch,"GET",p,{headers:this.headers,jwt:(d=(h=f.session)===null||h===void 0?void 0:h.access_token)!==null&&d!==void 0?d:void 0})});if(n)throw n;return L()&&!(!((t=e.options)===null||t===void 0)&&t.skipBrowserRedirect)&&window.location.assign(s?.url),this._returnResult({data:{provider:e.provider,url:s?.url,flowId:i},error:null})}catch(s){if(w(s))return this._returnResult({data:{provider:e.provider,url:null,flowId:i},error:s});throw s}}async linkIdentityIdToken(e){return await this._useSession(async t=>{var i;try{let{error:s,data:{session:n}}=t;if(s)throw s;let{options:a,provider:o,token:l,access_token:c,nonce:h}=e,d=await k(this.fetch,"POST",`${this.url}/token?grant_type=id_token`,{headers:this.headers,jwt:(i=n?.access_token)!==null&&i!==void 0?i:void 0,body:{provider:o,id_token:l,access_token:c,nonce:h,link_identity:!0,gotrue_meta_security:{captcha_token:a?.captchaToken}},xform:H}),{data:f,error:u}=d;return u?this._returnResult({data:{user:null,session:null},error:u}):!f||!f.session||!f.user?this._returnResult({data:{user:null,session:null},error:new ee}):(f.session&&(await this._saveSession(f.session),await this._notifyAllSubscribers("USER_UPDATED",f.session)),this._returnResult({data:f,error:u}))}catch(s){if(await q(this.storage,this.storageKey,null),w(s))return this._returnResult({data:{user:null,session:null},error:s});throw s}})}async unlinkIdentity(e){try{return await this._useSession(async t=>{var i,s;let{data:n,error:a}=t;if(a)throw a;return await k(this.fetch,"DELETE",`${this.url}/user/identities/${e.identity_id}`,{headers:this.headers,jwt:(s=(i=n.session)===null||i===void 0?void 0:i.access_token)!==null&&s!==void 0?s:void 0})})}catch(t){if(w(t))return this._returnResult({data:null,error:t});throw t}}async _refreshAccessToken(e){let t="#_refreshAccessToken()";this._debug(t,"begin");try{let i=Date.now();return await vi(async s=>(s>0&&await yi(200*Math.pow(2,s-1)),this._debug(t,"refreshing attempt",s),await k(this.fetch,"POST",`${this.url}/token?grant_type=refresh_token`,{body:{refresh_token:e},headers:this.headers,xform:H})),(s,n)=>{let a=200*Math.pow(2,s);return n&&tt(n)&&Date.now()+a-i<G})}catch(i){if(this._debug(t,"error",i),w(i))return this._returnResult({data:{session:null,user:null},error:i});throw i}finally{this._debug(t,"end")}}_isValidSession(e){return typeof e=="object"&&e!==null&&"access_token"in e&&"refresh_token"in e&&"expires_at"in e}async _handleProviderSignIn(e,t){let{url:i,flowId:s}=await this._getUrlForProvider(`${this.url}/authorize`,e,{redirectTo:t.redirectTo,scopes:t.scopes,queryParams:t.queryParams});return this._debug("#_handleProviderSignIn()","provider",e,"options",t,"url",i),L()&&!t.skipBrowserRedirect&&window.location.assign(i),{data:{provider:e,url:i,flowId:s},error:null}}async _recoverAndRefresh(){var e,t;let i="#_recoverAndRefresh()";this._debug(i,"begin");try{let s=await j(this.storage,this.storageKey);if(s&&this.userStorage){let a=await j(this.userStorage,this.storageKey+"-user");!this.storage.isServer&&Object.is(this.storage,this.userStorage)&&!a&&(a={user:s.user},await J(this.userStorage,this.storageKey+"-user",a)),s.user=(e=a?.user)!==null&&e!==void 0?e:It()}else if(s&&!s.user&&!s.user){let a=await j(this.storage,this.storageKey+"-user");a&&a?.user?(s.user=a.user,await B(this.storage,this.storageKey+"-user"),await J(this.storage,this.storageKey,s)):s.user=It()}if(this._debug(i,"session from storage",s),!this._isValidSession(s)){this._debug(i,"session is not valid"),s!==null&&await this._removeSession();return}let n=((t=s.expires_at)!==null&&t!==void 0?t:1/0)*1e3-Date.now()<kt;if(this._debug(i,`session has${n?"":" not"} expired with margin of ${kt}s`),n){if(this.autoRefreshToken&&s.refresh_token){let{error:a}=await this._callRefreshToken(s.refresh_token);a&&(ci(a)?this._debug(i,"refresh discarded by commit guard",a):this._debug(i,"refresh failed",a))}}else if(s.user&&s.user.__isUserNotAvailableProxy===!0)try{let{data:a,error:o}=await this._getUser(s.access_token);!o&&a?.user?(s.user=a.user,await this._saveSession(s),await this._notifyAllSubscribers("SIGNED_IN",s)):this._debug(i,"could not get user data, skipping SIGNED_IN notification")}catch(a){console.error("Error getting user data:",a),this._debug(i,"error getting user data, skipping SIGNED_IN notification",a)}else await this._notifyAllSubscribers("SIGNED_IN",s)}catch(s){this._debug(i,"error",s),tt(s)?console.warn(s):console.error(s);return}finally{this._debug(i,"end")}}async _callRefreshToken(e){var t,i;if(!e)throw new O;if(this.refreshingDeferred)return this.refreshingDeferred.promise;if(this.lastRefreshFailure&&this.lastRefreshFailure.refreshToken===e&&Date.now()<this.lastRefreshFailure.expiresAt)return this._debug("#_callRefreshToken()","returning cached failure (cooldown active)"),this.lastRefreshFailure.result;let s="#_callRefreshToken()";this._debug(s,"begin");try{this.refreshingDeferred=new rt,this.refreshingDeferred.promise.then(void 0,()=>{});let n=await j(this.storage,this.storageKey),{data:a,error:o}=await this._refreshAccessToken(e);if(o)throw o;if(!a.session)throw new O;let l=await j(this.storage,this.storageKey);if(n!==null&&(l===null||l.refresh_token!==n.refresh_token)){this._debug(s,"commit guard: storage changed since refresh started, discarding rotated tokens",{startedWith:"present",nowHolds:l?"replaced":"cleared"});let f={data:null,error:new Xe};return this.refreshingDeferred.resolve(f),f}let h=this._sessionRemovalEpoch;if(await this._saveSession(a.session),this._sessionRemovalEpoch!==h){this._debug(s,"commit guard (post-save): _removeSession ran during _saveSession, undoing write"),await B(this.storage,this.storageKey),this.userStorage&&await B(this.userStorage,this.storageKey+"-user");let f={data:null,error:new Xe};return this.refreshingDeferred.resolve(f),f}await this._notifyAllSubscribers("TOKEN_REFRESHED",a.session);let d={data:a.session,error:null};return this.lastRefreshFailure=null,this.refreshingDeferred.resolve(d),d}catch(n){if(this._debug(s,"error",n),w(n)){let a={data:null,error:n};if(!tt(n)){let o=await j(this.storage,this.storageKey);!!(o?.expires_at&&o.expires_at*1e3>Date.now())?this._debug(s,"proactive refresh failed, access token still valid \u2014 preserving session"):await this._removeSession()}return this.lastRefreshFailure={refreshToken:e,result:a,expiresAt:Date.now()+ti},(t=this.refreshingDeferred)===null||t===void 0||t.resolve(a),a}throw(i=this.refreshingDeferred)===null||i===void 0||i.reject(n),n}finally{this.refreshingDeferred=null,this._debug(s,"end")}}async _notifyAllSubscribers(e,t,i=!0){if(this._pendingInitNotifications!==null&&i){this._pendingInitNotifications.push({event:e,session:t,broadcast:i});return}let s=`#_notifyAllSubscribers(${e})`;this._debug(s,"begin",t,`broadcast = ${i}`);try{this.broadcastChannel&&i&&this.broadcastChannel.postMessage({event:e,session:t});let n=[],a=Array.from(this.stateChangeEmitters.values()).map(async o=>{try{await o.callback(e,t)}catch(l){n.push(l)}});if(await Promise.all(a),n.length>0){for(let o=0;o<n.length;o+=1)console.error(n[o]);throw n[0]}}finally{this._debug(s,"end")}}async _saveSession(e){this._debug("#_saveSession()",e),this.suppressGetSessionWarning=!0;let t=Object.assign({},e),i=t.user&&t.user.__isUserNotAvailableProxy===!0;if(this.userStorage){!i&&t.user&&await J(this.userStorage,this.storageKey+"-user",{user:t.user});let s=Object.assign({},t);delete s.user;let n=ir(s);await J(this.storage,this.storageKey,n)}else{let s=ir(t);await J(this.storage,this.storageKey,s)}}async _removeSession(){this._sessionRemovalEpoch+=1,this._debug("#_removeSession()"),this.lastRefreshFailure=null,this.suppressGetSessionWarning=!1,await B(this.storage,this.storageKey),await _i(this.storage,this.storageKey),await B(this.storage,this.storageKey+"-user"),this.userStorage&&await B(this.userStorage,this.storageKey+"-user"),await this._notifyAllSubscribers("SIGNED_OUT",null)}_removeVisibilityChangedCallback(){this._debug("#_removeVisibilityChangedCallback()");let e=this.visibilityChangedCallback;this.visibilityChangedCallback=null;try{e&&L()&&window?.removeEventListener&&window.removeEventListener("visibilitychange",e)}catch(t){console.error("removing visibilitychange callback failed",t)}}async _startAutoRefresh(){await this._stopAutoRefresh(),this._debug("#_startAutoRefresh()");let e=setInterval(()=>this._autoRefreshTokenTick(),G);this.autoRefreshTicker=e,e&&typeof e=="object"&&typeof e.unref=="function"?e.unref():typeof Deno<"u"&&typeof Deno.unrefTimer=="function"&&Deno.unrefTimer(e);let t=setTimeout(async()=>{await this.initializePromise,await this._autoRefreshTokenTick()},0);this.autoRefreshTickTimeout=t,t&&typeof t=="object"&&typeof t.unref=="function"?t.unref():typeof Deno<"u"&&typeof Deno.unrefTimer=="function"&&Deno.unrefTimer(t)}async _stopAutoRefresh(){this._debug("#_stopAutoRefresh()");let e=this.autoRefreshTicker;this.autoRefreshTicker=null,e&&clearInterval(e);let t=this.autoRefreshTickTimeout;this.autoRefreshTickTimeout=null,t&&clearTimeout(t)}async startAutoRefresh(){this._removeVisibilityChangedCallback(),await this._startAutoRefresh()}async stopAutoRefresh(){this._removeVisibilityChangedCallback(),await this._stopAutoRefresh()}async dispose(){var e;this._removeVisibilityChangedCallback(),await this._stopAutoRefresh(),(e=this.broadcastChannel)===null||e===void 0||e.close(),this.broadcastChannel=null,this.stateChangeEmitters.clear()}async _autoRefreshTokenTick(){if(this._debug("#_autoRefreshTokenTick()","begin"),this.lock!=null){try{await this._acquireLock(0,async()=>{try{let e=Date.now();try{return await this._useSession(async t=>{let{data:{session:i}}=t;if(!i||!i.refresh_token||!i.expires_at){this._debug("#_autoRefreshTokenTick()","no session");return}let s=Math.floor((i.expires_at*1e3-e)/G);this._debug("#_autoRefreshTokenTick()",`access token expires in ${s} ticks, a tick lasts ${G}ms, refresh threshold is ${Ie} ticks`),s<=Ie&&await this._callRefreshToken(i.refresh_token)})}catch(t){console.error("Auto refresh tick failed with error. This is likely a transient error.",t)}}finally{this._debug("#_autoRefreshTokenTick()","end")}})}catch(e){if(e instanceof Ot)this._debug("auto refresh token tick lock not available");else throw e}return}if(this.refreshingDeferred!==null){this._debug("#_autoRefreshTokenTick()","refresh already in flight, skipping");return}try{let e=Date.now();try{await this._useSession(async t=>{let{data:{session:i}}=t;if(!i||!i.refresh_token||!i.expires_at){this._debug("#_autoRefreshTokenTick()","no session");return}let s=Math.floor((i.expires_at*1e3-e)/G);this._debug("#_autoRefreshTokenTick()",`access token expires in ${s} ticks, a tick lasts ${G}ms, refresh threshold is ${Ie} ticks`),s<=Ie&&await this._callRefreshToken(i.refresh_token)})}catch(t){console.error("Auto refresh tick failed with error. This is likely a transient error.",t)}}finally{this._debug("#_autoRefreshTokenTick()","end")}}async _handleVisibilityChange(){if(this._debug("#_handleVisibilityChange()"),!L()||!window?.addEventListener)return this.autoRefreshToken&&this.startAutoRefresh(),!1;try{this.visibilityChangedCallback=async()=>{try{await this._onVisibilityChanged(!1)}catch(e){this._debug("#visibilityChangedCallback","error",e)}},window?.addEventListener("visibilitychange",this.visibilityChangedCallback),await this._onVisibilityChanged(!0)}catch(e){console.error("_handleVisibilityChange",e)}}async _onVisibilityChanged(e){let t=`#_onVisibilityChanged(${e})`;if(this._debug(t,"visibilityState",document.visibilityState),document.visibilityState==="visible"){if(this.autoRefreshToken&&this._startAutoRefresh(),!e)if(await this.initializePromise,this.lock!=null)await this._acquireLock(this.lockAcquireTimeout,async()=>{if(document.visibilityState!=="visible"){this._debug(t,"acquired the lock to recover the session, but the browser visibilityState is no longer visible, aborting");return}await this._recoverAndRefresh()});else{if(document.visibilityState!=="visible"){this._debug(t,"visibilityState is no longer visible, skipping recovery");return}await this._recoverAndRefresh()}}else document.visibilityState==="hidden"&&this.autoRefreshToken&&this._stopAutoRefresh()}async _getUrlForProvider(e,t,i){let s=i?.redirectTo,n=null,a=null,o=null;this.flowType==="pkce"&&([n,a,o]=await this._getCodeChallengeAndMethod(),s=this._maybeAppendFlowIdToRedirect(s,o));let l=[`provider=${encodeURIComponent(t)}`];if(s&&l.push(`redirect_to=${encodeURIComponent(s)}`),i?.scopes&&l.push(`scopes=${encodeURIComponent(i.scopes)}`),n!=null&&a!=null){let c=new URLSearchParams({code_challenge:`${encodeURIComponent(n)}`,code_challenge_method:`${encodeURIComponent(a)}`});l.push(c.toString())}if(i?.queryParams){let c=new URLSearchParams(i.queryParams);l.push(c.toString())}return i?.skipBrowserRedirect&&l.push(`skip_http_redirect=${i.skipBrowserRedirect}`),{url:`${e}?${l.join("&")}`,flowId:o}}_maybeAppendFlowIdToRedirect(e,t){return!e||!t||!this.experimental.appendPkceFlowIdToRedirects?e??void 0:xi(e,t)}async _getCodeChallengeAndMethod(e=!1){return ki(this.storage,this.storageKey,e,t=>this._debug("#_getCodeChallengeAndMethod()","evicted oldest pending PKCE verifier slot",t))}async _unenroll(e){try{return await this._useSession(async t=>{var i;let{data:s,error:n}=t;return n?this._returnResult({data:null,error:n}):await k(this.fetch,"DELETE",`${this.url}/factors/${e.factorId}`,{headers:this.headers,jwt:(i=s?.session)===null||i===void 0?void 0:i.access_token})})}catch(t){if(w(t))return this._returnResult({data:null,error:t});throw t}}async _enroll(e){try{return await this._useSession(async t=>{var i,s;let{data:n,error:a}=t;if(a)return this._returnResult({data:null,error:a});let o=Object.assign({friendly_name:e.friendlyName,factor_type:e.factorType},e.factorType==="phone"?{phone:e.phone}:e.factorType==="totp"?{issuer:e.issuer}:{}),{data:l,error:c}=await k(this.fetch,"POST",`${this.url}/factors`,{body:o,headers:this.headers,jwt:(i=n?.session)===null||i===void 0?void 0:i.access_token});return c?this._returnResult({data:null,error:c}):(e.factorType==="totp"&&l.type==="totp"&&(!((s=l?.totp)===null||s===void 0)&&s.qr_code)&&(l.totp.qr_code=`data:image/svg+xml;utf-8,${l.totp.qr_code}`),this._returnResult({data:l,error:null}))})}catch(t){if(w(t))return this._returnResult({data:null,error:t});throw t}}async _verify(e){let t=async()=>{try{return await this._useSession(async i=>{var s;let{data:n,error:a}=i;if(a)return this._returnResult({data:null,error:a});let o=Object.assign({challenge_id:e.challengeId},"webauthn"in e?{webauthn:Object.assign(Object.assign({},e.webauthn),{credential_response:e.webauthn.type==="create"?ur(e.webauthn.credential_response):fr(e.webauthn.credential_response)})}:{code:e.code}),{data:l,error:c}=await k(this.fetch,"POST",`${this.url}/factors/${e.factorId}/verify`,{body:o,headers:this.headers,jwt:(s=n?.session)===null||s===void 0?void 0:s.access_token});return c?this._returnResult({data:null,error:c}):(await this._saveSession(Object.assign({expires_at:Math.round(Date.now()/1e3)+l.expires_in},l)),await this._notifyAllSubscribers("MFA_CHALLENGE_VERIFIED",l),this._returnResult({data:l,error:c}))})}catch(i){if(w(i))return this._returnResult({data:null,error:i});throw i}};return this.lock!=null?this._acquireLock(this.lockAcquireTimeout,t):t()}async _challenge(e){let t=async()=>{try{return await this._useSession(async i=>{var s;let{data:n,error:a}=i;if(a)return this._returnResult({data:null,error:a});let o=await k(this.fetch,"POST",`${this.url}/factors/${e.factorId}/challenge`,{body:e,headers:this.headers,jwt:(s=n?.session)===null||s===void 0?void 0:s.access_token});if(o.error)return o;let{data:l}=o;if(l.type!=="webauthn")return{data:l,error:null};switch(l.webauthn.type){case"create":return{data:Object.assign(Object.assign({},l),{webauthn:Object.assign(Object.assign({},l.webauthn),{credential_options:Object.assign(Object.assign({},l.webauthn.credential_options),{publicKey:hr(l.webauthn.credential_options.publicKey)})})}),error:null};case"request":return{data:Object.assign(Object.assign({},l),{webauthn:Object.assign(Object.assign({},l.webauthn),{credential_options:Object.assign(Object.assign({},l.webauthn.credential_options),{publicKey:dr(l.webauthn.credential_options.publicKey)})})}),error:null}}})}catch(i){if(w(i))return this._returnResult({data:null,error:i});throw i}};return this.lock!=null?this._acquireLock(this.lockAcquireTimeout,t):t()}async _challengeAndVerify(e){let{data:t,error:i}=await this._challenge({factorId:e.factorId});return i?this._returnResult({data:null,error:i}):await this._verify({factorId:e.factorId,challengeId:t.id,code:e.code})}async _listFactors(){var e;let{data:{user:t},error:i}=await this.getUser();if(i)return{data:null,error:i};let s={all:[],phone:[],totp:[],webauthn:[]};for(let n of(e=t?.factors)!==null&&e!==void 0?e:[])s.all.push(n),n.status==="verified"&&s[n.factor_type].push(n);return{data:s,error:null}}async _getAuthenticatorAssuranceLevel(e){var t,i,s,n;if(e)try{let{payload:u}=st(e),p=null;u.aal&&(p=u.aal);let g=p,{data:{user:y},error:_}=await this.getUser(e);if(_)return this._returnResult({data:null,error:_});((i=(t=y?.factors)===null||t===void 0?void 0:t.filter(x=>x.status==="verified"))!==null&&i!==void 0?i:[]).length>0&&(g="aal2");let m=u.amr||[];return{data:{currentLevel:p,nextLevel:g,currentAuthenticationMethods:m},error:null}}catch(u){if(w(u))return this._returnResult({data:null,error:u});throw u}let{data:{session:a},error:o}=await this.getSession();if(o)return this._returnResult({data:null,error:o});if(!a)return{data:{currentLevel:null,nextLevel:null,currentAuthenticationMethods:[]},error:null};let{payload:l}=st(a.access_token),c=null;l.aal&&(c=l.aal);let h=c;((n=(s=a.user.factors)===null||s===void 0?void 0:s.filter(u=>u.status==="verified"))!==null&&n!==void 0?n:[]).length>0&&(h="aal2");let f=l.amr||[];return{data:{currentLevel:c,nextLevel:h,currentAuthenticationMethods:f},error:null}}async _getAuthorizationDetails(e){try{return await this._useSession(async t=>{let{data:{session:i},error:s}=t;return s?this._returnResult({data:null,error:s}):i?await k(this.fetch,"GET",`${this.url}/oauth/authorizations/${e}`,{headers:this.headers,jwt:i.access_token,xform:n=>({data:n,error:null})}):this._returnResult({data:null,error:new O})})}catch(t){if(w(t))return this._returnResult({data:null,error:t});throw t}}async _approveAuthorization(e,t){try{return await this._useSession(async i=>{let{data:{session:s},error:n}=i;if(n)return this._returnResult({data:null,error:n});if(!s)return this._returnResult({data:null,error:new O});let a=await k(this.fetch,"POST",`${this.url}/oauth/authorizations/${e}/consent`,{headers:this.headers,jwt:s.access_token,body:{action:"approve"},xform:o=>({data:o,error:null})});return a.data&&a.data.redirect_url&&L()&&!t?.skipBrowserRedirect&&window.location.assign(a.data.redirect_url),a})}catch(i){if(w(i))return this._returnResult({data:null,error:i});throw i}}async _denyAuthorization(e,t){try{return await this._useSession(async i=>{let{data:{session:s},error:n}=i;if(n)return this._returnResult({data:null,error:n});if(!s)return this._returnResult({data:null,error:new O});let a=await k(this.fetch,"POST",`${this.url}/oauth/authorizations/${e}/consent`,{headers:this.headers,jwt:s.access_token,body:{action:"deny"},xform:o=>({data:o,error:null})});return a.data&&a.data.redirect_url&&L()&&!t?.skipBrowserRedirect&&window.location.assign(a.data.redirect_url),a})}catch(i){if(w(i))return this._returnResult({data:null,error:i});throw i}}async _listOAuthGrants(){try{return await this._useSession(async e=>{let{data:{session:t},error:i}=e;return i?this._returnResult({data:null,error:i}):t?await k(this.fetch,"GET",`${this.url}/user/oauth/grants`,{headers:this.headers,jwt:t.access_token,xform:s=>({data:s,error:null})}):this._returnResult({data:null,error:new O})})}catch(e){if(w(e))return this._returnResult({data:null,error:e});throw e}}async _revokeOAuthGrant(e){try{return await this._useSession(async t=>{let{data:{session:i},error:s}=t;return s?this._returnResult({data:null,error:s}):i?(await k(this.fetch,"DELETE",`${this.url}/user/oauth/grants`,{headers:this.headers,jwt:i.access_token,query:{client_id:e.clientId},noResolveJson:!0}),{data:{},error:null}):this._returnResult({data:null,error:new O})})}catch(t){if(w(t))return this._returnResult({data:null,error:t});throw t}}async fetchJwk(e,t={keys:[]}){let i=t.keys.find(o=>o.kid===e);if(i)return i;let s=Date.now();if(i=this.jwks.keys.find(o=>o.kid===e),i&&this.jwks_cached_at+oi>s)return i;let{data:n,error:a}=await k(this.fetch,"GET",`${this.url}/.well-known/jwks.json`,{headers:this.headers});if(a)throw a;return!n.keys||n.keys.length===0||(this.jwks=n,this.jwks_cached_at=s,i=n.keys.find(o=>o.kid===e),!i)?null:i}async getClaims(e,t={}){try{let i=e;if(!i){let{data:u,error:p}=await this.getSession();if(p||!u.session)return this._returnResult({data:null,error:p});i=u.session.access_token}let{header:s,payload:n,signature:a,raw:{header:o,payload:l}}=st(i);if(!t?.allowExpired)try{Si(n.exp)}catch(u){throw new se(u instanceof Error?u.message:"JWT validation failed")}let c=!s.alg||s.alg.startsWith("HS")||!s.kid||!("crypto"in globalThis&&"subtle"in globalThis.crypto)?null:await this.fetchJwk(s.kid,t?.keys?{keys:t.keys}:t?.jwks);if(!c){let{error:u}=await this.getUser(i);if(u)throw u;return{data:{claims:n,header:s,signature:a},error:null}}let h=Ti(s.alg),d=await crypto.subtle.importKey("jwk",c,h,!0,["verify"]);if(!await crypto.subtle.verify(h,d,a,fi(`${o}.${l}`)))throw new se("Invalid JWT signature");return{data:{claims:n,header:s,signature:a},error:null}}catch(i){if(w(i))return this._returnResult({data:null,error:i});throw i}}async signInWithPasskey(e){var t,i,s;U(this.experimental);try{if(!at())return this._returnResult({data:null,error:new $("Browser does not support WebAuthn",null)});let{data:n,error:a}=await this._startPasskeyAuthentication({options:{captchaToken:(t=e?.options)===null||t===void 0?void 0:t.captchaToken}});if(a||!n)return this._returnResult({data:null,error:a});let o=dr(n.options),l=(s=(i=e?.options)===null||i===void 0?void 0:i.signal)!==null&&s!==void 0?s:jt.createNewAbortSignal(),{data:c,error:h}=await gr({publicKey:o,signal:l});if(h||!c)return this._returnResult({data:null,error:h??new $("WebAuthn ceremony failed",null)});let d=fr(c);return this._verifyPasskeyAuthentication({challengeId:n.challenge_id,credential:d})}catch(n){if(w(n))return this._returnResult({data:null,error:n});throw n}}async registerPasskey(e){var t,i;U(this.experimental);try{if(!at())return this._returnResult({data:null,error:new $("Browser does not support WebAuthn",null)});let{data:s,error:n}=await this._startPasskeyRegistration();if(n||!s)return this._returnResult({data:null,error:n});let a=hr(s.options),o=(i=(t=e?.options)===null||t===void 0?void 0:t.signal)!==null&&i!==void 0?i:jt.createNewAbortSignal(),{data:l,error:c}=await pr({publicKey:a,signal:o});if(c||!l)return this._returnResult({data:null,error:c??new $("WebAuthn ceremony failed",null)});let h=ur(l);return this._verifyPasskeyRegistration({challengeId:s.challenge_id,credential:h})}catch(s){if(w(s))return this._returnResult({data:null,error:s});throw s}}async _startPasskeyRegistration(){U(this.experimental);try{return await this._useSession(async e=>{let{data:{session:t},error:i}=e;if(i)return this._returnResult({data:null,error:i});if(!t)return this._returnResult({data:null,error:new O});let{data:s,error:n}=await k(this.fetch,"POST",`${this.url}/passkeys/registration/options`,{headers:this.headers,jwt:t.access_token,body:{}});return n?this._returnResult({data:null,error:n}):this._returnResult({data:s,error:null})})}catch(e){if(w(e))return this._returnResult({data:null,error:e});throw e}}async _verifyPasskeyRegistration(e){U(this.experimental);try{return await this._useSession(async t=>{let{data:{session:i},error:s}=t;if(s)return this._returnResult({data:null,error:s});if(!i)return this._returnResult({data:null,error:new O});let{data:n,error:a}=await k(this.fetch,"POST",`${this.url}/passkeys/registration/verify`,{headers:this.headers,jwt:i.access_token,body:{challenge_id:e.challengeId,credential:e.credential}});return a?this._returnResult({data:null,error:a}):this._returnResult({data:n,error:null})})}catch(t){if(w(t))return this._returnResult({data:null,error:t});throw t}}async _startPasskeyAuthentication(e){var t;U(this.experimental);try{let{data:i,error:s}=await k(this.fetch,"POST",`${this.url}/passkeys/authentication/options`,{headers:this.headers,body:{gotrue_meta_security:{captcha_token:(t=e?.options)===null||t===void 0?void 0:t.captchaToken}}});return s?this._returnResult({data:null,error:s}):this._returnResult({data:i,error:null})}catch(i){if(w(i))return this._returnResult({data:null,error:i});throw i}}async _verifyPasskeyAuthentication(e){U(this.experimental);try{let{data:t,error:i}=await k(this.fetch,"POST",`${this.url}/passkeys/authentication/verify`,{headers:this.headers,body:{challenge_id:e.challengeId,credential:e.credential},xform:H});return i?this._returnResult({data:null,error:i}):(t.session&&(await this._saveSession(t.session),await this._notifyAllSubscribers("SIGNED_IN",t.session)),this._returnResult({data:t,error:null}))}catch(t){if(w(t))return this._returnResult({data:null,error:t});throw t}}async _listPasskeys(){U(this.experimental);try{return await this._useSession(async e=>{let{data:{session:t},error:i}=e;if(i)return this._returnResult({data:null,error:i});if(!t)return this._returnResult({data:null,error:new O});let{data:s,error:n}=await k(this.fetch,"GET",`${this.url}/passkeys`,{headers:this.headers,jwt:t.access_token,xform:a=>({data:a,error:null})});return n?this._returnResult({data:null,error:n}):this._returnResult({data:s,error:null})})}catch(e){if(w(e))return this._returnResult({data:null,error:e});throw e}}async _updatePasskey(e){U(this.experimental);try{return await this._useSession(async t=>{let{data:{session:i},error:s}=t;if(s)return this._returnResult({data:null,error:s});if(!i)return this._returnResult({data:null,error:new O});let{data:n,error:a}=await k(this.fetch,"PATCH",`${this.url}/passkeys/${e.passkeyId}`,{headers:this.headers,jwt:i.access_token,body:{friendly_name:e.friendlyName}});return a?this._returnResult({data:null,error:a}):this._returnResult({data:n,error:null})})}catch(t){if(w(t))return this._returnResult({data:null,error:t});throw t}}async _deletePasskey(e){U(this.experimental);try{return await this._useSession(async t=>{let{data:{session:i},error:s}=t;if(s)return this._returnResult({data:null,error:s});if(!i)return this._returnResult({data:null,error:new O});let{error:n}=await k(this.fetch,"DELETE",`${this.url}/passkeys/${e.passkeyId}`,{headers:this.headers,jwt:i.access_token,noResolveJson:!0});return n?this._returnResult({data:null,error:n}):this._returnResult({data:null,error:null})})}catch(t){if(w(t))return this._returnResult({data:null,error:t});throw t}}};$t.nextInstanceID={};var mr=$t;var Rn=mr,yr=Rn;var On="2.112.4",ot="",Mt;if(typeof Deno<"u")ot="deno",Mt=(Bt=Deno.version)===null||Bt===void 0?void 0:Bt.deno;else if(typeof document<"u")ot="web";else if(typeof navigator<"u"&&navigator.product==="ReactNative")ot="react-native";else{ot="node";let r=globalThis.process;Mt=r==null||(Nt=r.version)===null||Nt===void 0?void 0:Nt.replace(/^v/,"")}var Bt,Nt,Wi=[`runtime=${ot}`];Mt&&Wi.push(`runtime-version=${Mt}`);var Pn={"X-Client-Info":`supabase-js/${On}; ${Wi.join("; ")}`},Ln={headers:Pn},jn={schema:"public"},$n={autoRefreshToken:!0,persistSession:!0,detectSessionInUrl:!0,flowType:"implicit"},Bn={},Nn={enabled:!1,respectSamplingDecision:!0};function Mn(r){if(!r||typeof r!="string")return null;let e=r.split("-");if(e.length!==4)return null;let[t,i,s,n]=e;if(t.length!==2||i.length!==32||s.length!==16||n.length!==2)return null;let a=/^[0-9a-f]+$/i;return!a.test(t)||!a.test(i)||!a.test(s)||!a.test(n)||i==="00000000000000000000000000000000"||s==="0000000000000000"?null:{version:t,traceId:i,parentId:s,traceFlags:n,isSampled:(parseInt(n,16)&1)===1}}function Un(r,e){if(!r||!e||e.length===0)return!1;let t;if(r instanceof URL)t=r;else try{t=new URL(r)}catch{return!1}for(let i of e)try{if(typeof i=="string"){if(Hn(t.hostname,i))return!0}else if(i instanceof RegExp){if(i.test(t.hostname))return!0}else if(typeof i=="function"&&i(t))return!0}catch{continue}return!1}function Hn(r,e){if(e===r)return!0;if(e.startsWith("*.")){let t=e.slice(2);if(r.endsWith(t)&&(r===t||r.endsWith("."+t)))return!0}return!1}function Dn(r){let e=[];try{let t=new URL(r);e.push(t.hostname)}catch{}return e.push("*.supabase.co","*.supabase.in"),e.push("localhost","127.0.0.1","[::1]"),e}function lt(r){"@babel/helpers - typeof";return lt=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(e){return typeof e}:function(e){return e&&typeof Symbol=="function"&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},lt(r)}function qn(r,e){if(lt(r)!="object"||!r)return r;var t=r[Symbol.toPrimitive];if(t!==void 0){var i=t.call(r,e||"default");if(lt(i)!="object")return i;throw new TypeError("@@toPrimitive must return a primitive value.")}return(e==="string"?String:Number)(r)}function Fn(r){var e=qn(r,"string");return lt(e)=="symbol"?e:e+""}function zn(r,e,t){return(e=Fn(e))in r?Object.defineProperty(r,e,{value:t,enumerable:!0,configurable:!0,writable:!0}):r[e]=t,r}function Ui(r,e){var t=Object.keys(r);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(r);e&&(i=i.filter(function(s){return Object.getOwnPropertyDescriptor(r,s).enumerable})),t.push.apply(t,i)}return t}function P(r){for(var e=1;e<arguments.length;e++){var t=arguments[e]!=null?arguments[e]:{};e%2?Ui(Object(t),!0).forEach(function(i){zn(r,i,t[i])}):Object.getOwnPropertyDescriptors?Object.defineProperties(r,Object.getOwnPropertyDescriptors(t)):Ui(Object(t)).forEach(function(i){Object.defineProperty(r,i,Object.getOwnPropertyDescriptor(t,i))})}return r}var Wn=r=>r?(...e)=>r(...e):(...e)=>fetch(...e),Vn=()=>Headers,Vi=r=>r.startsWith("sb_publishable_")||r.startsWith("sb_secret_"),Kn="sb_temp_",Hi=new Set,Gn=r=>{var e,t;if(!r.startsWith("sb_")||Vi(r)||r.startsWith(Kn))return;let i=(e=(t=r.match(/^sb_[a-zA-Z0-9]+_/))===null||t===void 0?void 0:t[0])!==null&&e!==void 0?e:"unknown";Hi.has(i)||(Hi.add(i),console.warn("@supabase/supabase-js: Unrecognized Supabase API key format. The client will proceed and send this key as-is; if you see authentication errors you may need to upgrade @supabase/supabase-js to a version that recognizes this key type."))},Di=(r,e,t,i,s,n)=>{let a=Wn(i),o=Vn(),l=s?.enabled===!0,c=s?.respectSamplingDecision!==!1,h=l?Dn(e):null,d=!(n?.omitApiKeyAsBearer&&Vi(r));return async(f,u)=>{let p=await t(),g=new o(u?.headers);if(g.has("apikey")||g.set("apikey",r),!g.has("Authorization")){let y=p??(d?r:null);y&&g.set("Authorization",`Bearer ${y}`)}if(h){let y=Jn(f,h,c);y&&(y.traceparent&&!g.has("traceparent")&&g.set("traceparent",y.traceparent),y.tracestate&&!g.has("tracestate")&&g.set("tracestate",y.tracestate),y.baggage&&!g.has("baggage")&&g.set("baggage",y.baggage))}return a(f,P(P({},u),{},{headers:g}))}},qi=!1,Fi=!1;function Jn(r,e,t){let i=_r();if(!i)return qi||(qi=!0,console.warn("@supabase/supabase-js: tracePropagation is enabled but the tracing runtime is not loaded, so trace headers will not be attached. Add `import '@supabase/supabase-js/tracing'` at your application entry point (requires the OpenTelemetry API package to be installed). The CDN/UMD build does not support trace propagation.")),null;if(!Un(typeof r=="string"||r instanceof URL?r:r.url,e))return null;let s=i();if(!s||!s.traceparent){var n;if(!(s==null||(n=s.carrierKeys)===null||n===void 0)&&n.length&&!Fi){Fi=!0;let a=s.carrierKeys.includes("sentry-trace")?" Sentry detected: set `propagateTraceparent: true` in Sentry.init() to emit it.":" Configure your tracing SDK to emit W3C trace context on outgoing requests.";console.warn(`@supabase/supabase-js: tracePropagation is enabled and a tracing SDK is active, but its propagator wrote [${s.carrierKeys.join(", ")}] and no W3C traceparent header, so trace headers will not be attached.`+a)}return null}if(t){let a=Mn(s.traceparent);if(a&&!a.isSampled)return{traceparent:s.traceparent}}return s}function zi(r){return typeof r=="boolean"?{enabled:r}:r}function Yn(r){return r.endsWith("/")?r:r+"/"}function Qn(r,e){var t,i,s,n,a,o;let{db:l,auth:c,realtime:h,global:d}=r,{db:f,auth:u,realtime:p,global:g}=e,y=zi(r.tracePropagation),_=zi(e.tracePropagation),E={db:P(P({},f),l),auth:P(P({},u),c),realtime:P(P({},p),h),storage:{},global:P(P(P({},g),d),{},{headers:P(P({},(t=g?.headers)!==null&&t!==void 0?t:{}),(i=d?.headers)!==null&&i!==void 0?i:{})}),tracePropagation:{enabled:(s=(n=y?.enabled)!==null&&n!==void 0?n:_?.enabled)!==null&&s!==void 0?s:!1,respectSamplingDecision:(a=(o=y?.respectSamplingDecision)!==null&&o!==void 0?o:_?.respectSamplingDecision)!==null&&a!==void 0?a:!0},accessToken:async()=>""};return r.accessToken?E.accessToken=r.accessToken:delete E.accessToken,E}function Xn(r){let e=r?.trim();if(!e)throw new Error("supabaseUrl is required.");if(!e.match(/^https?:\/\//i))throw new Error("Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.");try{return new URL(Yn(e))}catch{throw Error("Invalid supabaseUrl: Provided URL is malformed.")}}var Zn=class extends yr{constructor(r){super(r)}},ea=class{constructor(r,e,t){var i,s;this.supabaseUrl=r,this.supabaseKey=e;let n=Xn(r);if(!e)throw new Error("supabaseKey is required.");Gn(e),this.realtimeUrl=new URL("realtime/v1",n),this.realtimeUrl.protocol=this.realtimeUrl.protocol.replace("http","ws"),this.authUrl=new URL("auth/v1",n),this.storageUrl=new URL("storage/v1",n),this.functionsUrl=new URL("functions/v1",n);let a=`sb-${n.hostname.split(".")[0]}-auth-token`,o={db:jn,realtime:Bn,auth:P(P({},$n),{},{storageKey:a}),global:Ln,tracePropagation:Nn},l=Qn(t??{},o);if(this.settings=l,this.storageKey=(i=l.auth.storageKey)!==null&&i!==void 0?i:"",this.headers=(s=l.global.headers)!==null&&s!==void 0?s:{},l.accessToken)this.accessToken=l.accessToken,this.auth=new Proxy({},{get:(h,d)=>{throw new Error(`@supabase/supabase-js: Supabase Client is configured with the accessToken option, accessing supabase.auth.${String(d)} is not possible`)}});else{var c;this.auth=this._initSupabaseAuthClient((c=l.auth)!==null&&c!==void 0?c:{},this.headers,l.global.fetch)}this.fetch=Di(e,r,this._getSessionToken.bind(this),l.global.fetch,l.tracePropagation),this.functionsFetch=Di(e,r,this._getSessionToken.bind(this),l.global.fetch,l.tracePropagation,{omitApiKeyAsBearer:!0}),this.realtime=this._initRealtimeClient(P({headers:this.headers,accessToken:this._getAccessToken.bind(this),fetch:this.fetch},l.realtime)),this.accessToken&&Promise.resolve(this.accessToken()).then(h=>this.realtime.setAuth(h)).catch(h=>console.warn("Failed to set initial Realtime auth token:",h)),this.rest=new Ir(new URL("rest/v1",n).href,{headers:this.headers,schema:l.db.schema,fetch:this.fetch,timeout:l.db.timeout,urlLengthLimit:l.db.urlLengthLimit,retry:l.db.retry}),this.storage=new ei(this.storageUrl.href,this.headers,this.fetch,t?.storage),l.accessToken||this._listenForAuthEvents()}get functions(){return new Be(this.functionsUrl.href,{headers:this.headers,customFetch:this.functionsFetch})}from(r){return this.rest.from(r)}schema(r){return this.rest.schema(r)}rpc(r,e={},t={head:!1,get:!1,count:void 0}){return this.rest.rpc(r,e,t)}channel(r,e={config:{}}){return this.realtime.channel(r,e)}getChannels(){return this.realtime.getChannels()}removeChannel(r){return this.realtime.removeChannel(r)}removeAllChannels(){return this.realtime.removeAllChannels()}async _getSessionToken(){var r=this,e,t;if(r.accessToken)return await r.accessToken();let{data:i}=await r.auth.getSession();return(e=(t=i.session)===null||t===void 0?void 0:t.access_token)!==null&&e!==void 0?e:null}async _getAccessToken(){var r=this,e;return(e=await r._getSessionToken())!==null&&e!==void 0?e:r.supabaseKey}_initSupabaseAuthClient({autoRefreshToken:r,persistSession:e,detectSessionInUrl:t,storage:i,userStorage:s,storageKey:n,flowType:a,lock:o,debug:l,throwOnError:c,experimental:h,lockAcquireTimeout:d,skipAutoInitialize:f},u,p){let g={Authorization:`Bearer ${this.supabaseKey}`,apikey:`${this.supabaseKey}`};return new Zn({url:this.authUrl.href,headers:P(P({},g),u),storageKey:n,autoRefreshToken:r,persistSession:e,detectSessionInUrl:t,storage:i,userStorage:s,flowType:a,lock:o,debug:l,throwOnError:c,experimental:h,fetch:p,lockAcquireTimeout:d,skipAutoInitialize:f,hasCustomAuthorizationHeader:Object.keys(this.headers).some(y=>y.toLowerCase()==="authorization")})}_initRealtimeClient(r){return new Te(this.realtimeUrl.href,P(P({},r),{},{params:P(P({},{apikey:this.supabaseKey}),r?.params)}))}_listenForAuthEvents(){return this.auth.onAuthStateChange((r,e)=>{this._handleTokenChanged(r,"CLIENT",e?.access_token)})}_handleTokenChanged(r,e,t){(r==="TOKEN_REFRESHED"||r==="SIGNED_IN"||r==="INITIAL_SESSION")&&this.changedAccessToken!==t?(this.changedAccessToken=t,this.realtime.setAuth(t)):r==="SIGNED_OUT"&&(this.realtime.setAuth(),e=="STORAGE"&&this.auth.signOut(),this.changedAccessToken=void 0)}},Ki=(r,e,t)=>new ea(r,e,t);function ta(){if(typeof window<"u"||globalThis.Deno!==void 0)return!1;let r=globalThis.process;if(!r)return!1;let e=r.version;if(e==null)return!1;let t=e.match(/^v(\d+)\./);return t?parseInt(t[1],10)<=20:!1}ta()&&console.warn("\u26A0\uFE0F  Node.js 20 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 22 or later. For more information, visit: https://github.com/orgs/supabase/discussions/45715");var vr="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAp9UlEQVR4AezB93Oc930g4Ofz7otGAmyg2KlqiSpWddzLxY4T2+NcMpnMJP9ifkjuh+SSmzjtEltWbMuRdLaKKcmqrGInQBLA7n5uct+57OwAJAEQ4C6w7/NEZmo0GqOp0mg0Rlal0WiMrEqj0RhZlUajMbIqjUZjZFUajcbIqjQajZFVaTQaI6vSaDRGVqXRaIysSqPRGFmVRqMxsiqNRmNkVRqNxsiqNBqNkVVpNBojq9JoNEZWpdFojKxKo9EYWbXGvQiEIhAIdPVUqNBChRYqBAKhJxRpZWl1Qk9Ym9AvrF7aHIlEF1100UYHXSRCkUgkUpEaK6o1VisQCHT1BMYxg/3Yj12Yxk5MYQcmMYlJTKJGC4FA6JeKVCRST1pZIBQVwuqFfmHt0sZLdNDGIhZwEzcwh+u4ggs4i0u4jg4SgUCgq0gNtcadhH4TmMIkpjCFKcxgFodxGHuxCzPYgR2YwiQmMYUaLQQqK0skUpFIPWm5QCAQqKxeWC6sTdpYiUQHbSzhFm5hHtdxDRdxFh/hHC5iHvOYxwJu4Sa6CD1pRNUaKwlFhVQEZnAUj+ERPIRD2I9dmMFOtFChQiBQIVAhEAhFuL3UL61OKEJPuruweRKhX1qdMUUikeiiiy7aWMQNXMNlfIrf4n18hE9xWpEIpCKNoFrj/wuEIjCOHdiHB3AcD+FBHMYs9mAaUxjHBGqEIqwsLBeWS4R+qScUqSf0C0Ui9AuDlQiE1Um3l+hiF2ZxGMfwJC7iPE7jI3yCUziPOdzUL42IWuM/BSqMYQIz2IsDeBCP4fN4BIcxhVqRSEUgEAj9QpEIqxP6JUIRegKJcHuhX7h/EqFIPaEI9yYRaKHCOKbxAEJxA5dwCr/GW3gXp3Ee17GANgJpBNRGWyBQocIsHsEX8Swexx5MYxLjGEcLgUDqF4qwsrCyQLqzcHuBcG/C6qWeQLq90BPWL6wsFIlA6EkkxrAP03gIv4tLeBu/xE/xEa4pEom0jdVGUygqzOIIHsajeBQn8BAOYRwtdJFIBEIR+oW1C0UgrU+4N2FtAqknkAYrFGG5FlqYwh4kjmIWR/AQ3scn+BBncQ2p6NqGaqMlFC2MYRyP4yv4Lp7EQVSKUHQRCGsX1iasLBE2Trh3oV8YPoHQLxEYxyN4GF/DJ3gLP8LP8SEW0cWSnrRN1EZHIFDhGJ7AF/B5nMAhzKBCIPQLpNUJGy/cu9D4T6Go9IzjCKZxCF/G63gdJ3EVbT1pG6iNhsAY9uIYXsCLeAkPYj8qBBJhZYHU2C5CEQjMYAazOIYHcRgH8BbO4zq6irTF1ba3UFSYwgn8Eb6FJzGGQCAQ7i70JMJwC43bCT2hZwJHcARP4kX8FX6OdxUd20Btewo90ziI7+AreBGHMY5Kv7Q2YfiExmolwnIVAoG9+Dx24Cn8FL/AGSQSaYuqbU+BMezGQ3gWf4QXsV9P2F5CY6MEEpM4jKM4iH3o4HWcxxK6SFtQbfupUGEPvoZv45s4iF0IRdgeQmM1wuqFnkCii+OYwR4cwl/iBpbQsQXVto9AC+M4gRfxLTyLhzGOliJsD6FxP4RiArN4EYnEz/AuFtC1xdS2jwo7cQDfxPfwEnYhUCFsH2HrCCtLW0coahzDJA4gcQ3nsIiOLaS29QUqTOJx/DG+iqewExUCYfsIW0cgEba+UCRm8Dj+FPvxVziNm0ikLaC2tQVaGMdL+Ca+g0ewD4lAKMLWF7aOsP2EYhx78SwqzOMVvI0FdJCGXG1rC4xjN/4QP8SDGFNUitAT7izcWbo/wtYUlgvLpfsnbLwKiVm8iAcwhtO4gltIQ662NQVq7McX8X28hAOoEQhF2FihSP3CylJj0BJh44SeFnbiGL6HHfhfeA/XkIZYbWuawD58Ab+PP8QMJhEIhOXCnYXVC6S7C6TGoCXCxgoExjGG5zGNWxjDr7CAtiFV23oq7MYJ/Dm+hH1ooUIoAqkn3FlYu7A64e4SobGZUr+wsrQ2gcBePIMZ7MYZXMQ80hCqbR2BFibwIn6IZ/EAxhB6QhG2jrA1hX5p60jrF5ZrYQpH8U208Xd4CzeRSEOktnUEpnAcX8Uf4AB2oNKTGo3NFVYWqDGDZ7Ef53EZH2PJkKkNv0AgcAB/im/hICYQilSExv2WRke4uwo7cBj/DXM4i7YiDYna1hA4gufxVTyKSYR+odHYPGF1AjV24jlcwtv4AJcMkdpwC1So8SS+jqfxgCIUidBodBxv4R/wEv4eZ7CANKRq21OgRhuf49t4EvexjDYCgdBoDLI6uIxT+AbewB4kUqMxJCqDE4pE4Gf4Dt7CR/i/eBE3EUgEUqMxdCo6fIlreBsv42/xFJ5FojGkKoMTikDgJ3gZ/wUv4kM8j4/RRqLRGEKVXoObeAW/i9/Ff8S/43k8h1RjSFUGp6u3gEt4Hb+D1/E6XsdbeAfncRFdpEajMQRqA1dxE+/ht/B3+A/4O/w3vIEruIFUIq03vAKhNjj7MY5DuIBTeBX/A9/B7+MNvI5XsIA2utY25Cp7cQBfwQv4f/EaXsN/xk/xLi7iOrqK1Ghs5tAjce9l3MQFnMIb+E/4Fn6A38M/wVewH7vRQqCycUKBCoEKh3EYj+Mr+HP8Dr6Pb+NpPI7DeAKHMIZKEVZnrL+2sQIT2I89OI5j+Dq+gf8Xz+JP8U18G4/i+ziGQ5hAhVCE1QurldbvHhxEB0/iaXwF/489OO/N0rs883u/e5+39+69994793vv1Z3uVl9u93Xv7q5uV1/d7rvb1e62O45jx7ETJ3ZiB0cChAATwhZCRiChKCGkCCkQEgIJgZAgJJQQkggpECYhIYSUhJCEhBAChISQhBACEkKCEBICCUJICSSEkBCSEBIChJAEQsgIISEg5AghQghCCAlChJAgRNgIIdhIQogQIkRIIQghhISQhBCEkIQI20cIITF9hJAghBD2V4h9CCFsnyGEfQgbhBAiIYTtKYRECDZCCDZC2F8h9hBCCEIIe7eEEBLC9hBC2F4h9hBCiBBC2N9+Yk8hhCCE7SGEEEJChO0nhBD2V4j9CCHsXyH2IYR9CCFsf2F/hRBCiLARIUIIW9hfIdhf2D5CiP0VghBCQthfIYTtJYTtKYSQEIQQQggJIWwfIYQQQggJIewvhLC9hBACIUJICEEIYSNChBACIUJICCEhBCGE/RVCiBAiREghhBCChBDC/gohhBCEEIJAAuF/AQYA7aP9v4V7c7sAAAAASUVORK5CYII=",Gi=vr;var ct=[{id:"smileys",name:"Smileys & Emotions",icon:"\u{1F600}",emojis:["\u{1F600}","\u{1F603}","\u{1F604}","\u{1F601}","\u{1F606}","\u{1F605}","\u{1F602}","\u{1F923}","\u{1F60A}","\u{1F607}","\u{1F642}","\u{1F643}","\u{1F609}","\u{1F60C}","\u{1F60D}","\u{1F970}","\u{1F618}","\u{1F617}","\u{1F619}","\u{1F61A}","\u{1F60B}","\u{1F61B}","\u{1F61C}","\u{1F92A}","\u{1F61D}","\u{1F911}","\u{1F917}","\u{1F92D}","\u{1F92B}","\u{1F914}","\u{1F910}","\u{1F928}","\u{1F610}","\u{1F611}","\u{1F636}","\u{1F60F}","\u{1F612}","\u{1F644}","\u{1F62C}","\u{1F925}","\u{1F60C}","\u{1F614}","\u{1F62A}","\u{1F924}","\u{1F634}","\u{1F637}","\u{1F912}","\u{1F915}","\u{1F922}","\u{1F92E}","\u{1F927}","\u{1F975}","\u{1F976}","\u{1F974}","\u{1F635}","\u{1F92F}","\u{1F920}","\u{1F973}","\u{1F60E}","\u{1F913}","\u{1F9D0}","\u{1F615}","\u{1F61F}","\u{1F641}","\u{1F62E}","\u{1F62F}","\u{1F632}","\u{1F633}","\u{1F97A}","\u{1F626}","\u{1F627}","\u{1F628}","\u{1F630}","\u{1F625}","\u{1F622}","\u{1F62D}","\u{1F631}","\u{1F616}","\u{1F623}","\u{1F61E}","\u{1F613}","\u{1F629}","\u{1F62B}","\u{1F971}","\u{1F624}","\u{1F621}","\u{1F620}","\u{1F92C}","\u{1F608}","\u{1F47F}","\u{1F480}","\u2620\uFE0F","\u{1F4A9}","\u{1F921}","\u{1F479}","\u{1F47A}","\u{1F47B}","\u{1F47D}","\u{1F47E}","\u{1F916}"]},{id:"people",name:"People & Gestures",icon:"\u{1F44B}",emojis:["\u{1F44B}","\u{1F91A}","\u{1F590}\uFE0F","\u270B","\u{1F596}","\u{1F44C}","\u{1F90C}","\u{1F90F}","\u270C\uFE0F","\u{1F91E}","\u{1FAF0}","\u{1F91F}","\u{1F918}","\u{1F919}","\u{1F448}","\u{1F449}","\u{1F446}","\u{1F595}","\u{1F447}","\u261D\uFE0F","\u{1F44D}","\u{1F44E}","\u270A","\u{1F44A}","\u{1F91B}","\u{1F91C}","\u{1F44F}","\u{1F64C}","\u{1F450}","\u{1F932}","\u{1F91D}","\u{1F64F}","\u270D\uFE0F","\u{1F485}","\u{1F933}","\u{1F4AA}","\u{1F9BE}","\u{1F9BF}","\u{1F9B5}","\u{1F9B6}","\u{1F442}","\u{1F9BB}","\u{1F443}","\u{1F9E0}","\u{1FAC0}","\u{1FAC1}","\u{1F9B7}","\u{1F9B4}","\u{1F440}","\u{1F441}\uFE0F","\u{1F445}","\u{1F444}","\u{1F48B}","\u{1FAC2}","\u{1F476}","\u{1F467}","\u{1F9D2}","\u{1F466}","\u{1F469}","\u{1F9D1}","\u{1F468}","\u{1F9D1}\u200D\u{1F9B1}","\u{1F468}\u200D\u{1F9B1}","\u{1F469}\u200D\u{1F9B1}","\u{1F9D1}\u200D\u{1F9B0}","\u{1F468}\u200D\u{1F9B0}","\u{1F469}\u200D\u{1F9B0}","\u{1F471}","\u{1F471}\u200D\u2642\uFE0F","\u{1F471}\u200D\u2640\uFE0F","\u{1F9D1}\u200D\u{1F9B3}","\u{1F468}\u200D\u{1F9B3}","\u{1F469}\u200D\u{1F9B3}","\u{1F9D1}\u200D\u{1F9B2}","\u{1F468}\u200D\u{1F9B2}","\u{1F469}\u200D\u{1F9B2}","\u{1F9D4}","\u{1F9D3}","\u{1F474}","\u{1F475}"]},{id:"hearts",name:"Hearts & Love",icon:"\u2764\uFE0F",emojis:["\u2764\uFE0F","\u{1F9E1}","\u{1F49B}","\u{1F49A}","\u{1F499}","\u{1F49C}","\u{1F5A4}","\u{1F90D}","\u{1F90E}","\u{1F494}","\u2763\uFE0F","\u{1F495}","\u{1F49E}","\u{1F493}","\u{1F497}","\u{1F496}","\u{1F498}","\u{1F49D}","\u{1F49F}","\u{1F48C}","\u{1F48B}","\u{1F48D}","\u{1F48E}","\u{1F490}","\u{1F339}","\u{1F940}","\u{1F33A}","\u{1F338}","\u{1F337}","\u{1F33B}"]},{id:"animals",name:"Animals & Nature",icon:"\u{1F436}",emojis:["\u{1F436}","\u{1F431}","\u{1F42D}","\u{1F439}","\u{1F430}","\u{1F98A}","\u{1F43B}","\u{1F43C}","\u{1F428}","\u{1F42F}","\u{1F981}","\u{1F42E}","\u{1F437}","\u{1F43D}","\u{1F438}","\u{1F435}","\u{1F648}","\u{1F649}","\u{1F64A}","\u{1F412}","\u{1F414}","\u{1F427}","\u{1F426}","\u{1F424}","\u{1F423}","\u{1F425}","\u{1F986}","\u{1F985}","\u{1F989}","\u{1F987}","\u{1F43A}","\u{1F417}","\u{1F434}","\u{1F984}","\u{1F41D}","\u{1FAB1}","\u{1F41B}","\u{1F98B}","\u{1F40C}","\u{1F41E}","\u{1F41C}","\u{1FAB0}","\u{1FAB2}","\u{1FAB3}","\u{1F99F}","\u{1F997}","\u{1F577}\uFE0F","\u{1F578}\uFE0F","\u{1F982}","\u{1F422}","\u{1F40D}","\u{1F98E}","\u{1F996}","\u{1F995}","\u{1F419}","\u{1F991}","\u{1F990}","\u{1F99E}","\u{1F980}","\u{1F421}","\u{1F420}","\u{1F41F}","\u{1F42C}","\u{1F433}","\u{1F40B}","\u{1F988}","\u{1F40A}","\u{1F405}","\u{1F406}","\u{1F993}","\u{1F98D}","\u{1F9A7}","\u{1F9A3}","\u{1F418}","\u{1F99B}","\u{1F98F}","\u{1F42A}","\u{1F42B}","\u{1F992}","\u{1F998}","\u{1F403}","\u{1F402}","\u{1F404}","\u{1F40E}","\u{1F416}","\u{1F40F}","\u{1F411}","\u{1F999}","\u{1F410}","\u{1F98C}","\u{1F415}","\u{1F429}","\u{1F9AE}","\u{1F415}\u200D\u{1F9BA}","\u{1F408}","\u{1F408}\u200D\u2B1B","\u{1F413}","\u{1F983}","\u{1F99A}","\u{1F99C}"]},{id:"food",name:"Food & Drink",icon:"\u{1F355}",emojis:["\u{1F34F}","\u{1F34E}","\u{1F350}","\u{1F34A}","\u{1F34B}","\u{1F34C}","\u{1F349}","\u{1F347}","\u{1F353}","\u{1FAD0}","\u{1F348}","\u{1F352}","\u{1F351}","\u{1F96D}","\u{1F34D}","\u{1F965}","\u{1F95D}","\u{1F345}","\u{1F346}","\u{1F951}","\u{1F966}","\u{1F96C}","\u{1F952}","\u{1F336}\uFE0F","\u{1FAD1}","\u{1F33D}","\u{1F955}","\u{1F9C4}","\u{1F9C5}","\u{1F954}","\u{1F360}","\u{1F950}","\u{1F96F}","\u{1F35E}","\u{1F956}","\u{1F968}","\u{1F9C0}","\u{1F95A}","\u{1F373}","\u{1F9C8}","\u{1F95E}","\u{1F9C7}","\u{1F953}","\u{1F969}","\u{1F357}","\u{1F356}","\u{1F32D}","\u{1F354}","\u{1F35F}","\u{1F355}","\u{1FAD3}","\u{1F96A}","\u{1F959}","\u{1F9C6}","\u{1F32E}","\u{1F32F}","\u{1FAD4}","\u{1F957}","\u{1F958}","\u{1FAD5}","\u{1F372}","\u{1F35C}","\u{1F35D}","\u{1F363}","\u{1F371}","\u{1F95F}","\u{1F364}","\u{1F359}","\u{1F35A}","\u{1F358}","\u{1F366}","\u{1F367}","\u{1F368}","\u{1F369}","\u{1F36A}","\u{1F382}","\u{1F370}","\u{1F9C1}","\u{1F36B}","\u{1F36C}","\u{1F36D}","\u{1F36E}","\u{1F36F}","\u{1F37C}","\u{1F95B}","\u2615","\u{1FAD6}","\u{1F375}","\u{1F376}","\u{1F37E}","\u{1F377}","\u{1F378}","\u{1F379}","\u{1F37A}","\u{1F37B}","\u{1F942}","\u{1F943}","\u{1F964}","\u{1F9C3}","\u{1F9CB}"]},{id:"activity",name:"Activities & Sports",icon:"\u26BD",emojis:["\u26BD","\u{1F3C0}","\u{1F3C8}","\u26BE","\u{1F94E}","\u{1F3BE}","\u{1F3D0}","\u{1F3C9}","\u{1F94F}","\u{1F3B1}","\u{1FA80}","\u{1F3D3}","\u{1F3F8}","\u{1F3D2}","\u{1F3D1}","\u{1F94D}","\u{1F3CF}","\u{1FA83}","\u{1F945}","\u26F3","\u{1FA81}","\u{1F3F9}","\u{1F3A3}","\u{1F93F}","\u{1F94A}","\u{1F94B}","\u{1F3BD}","\u{1F6F9}","\u{1F6FC}","\u{1F6F7}","\u26F8\uFE0F","\u{1F94C}","\u{1F3BF}","\u26F7\uFE0F","\u{1F3C2}","\u{1FA82}","\u{1F3CB}\uFE0F","\u{1F93C}","\u{1F938}","\u{1F93A}","\u26F9\uFE0F","\u{1F93E}","\u{1F9D7}","\u{1F3CC}\uFE0F","\u{1F3C4}","\u{1F3CA}","\u{1F6B4}","\u{1F6B5}","\u{1F3C7}","\u{1F3C6}","\u{1F947}","\u{1F948}","\u{1F949}","\u{1F3C5}","\u{1F396}\uFE0F","\u{1F3F5}\uFE0F","\u{1F397}\uFE0F","\u{1F3AB}","\u{1F39F}\uFE0F","\u{1F3AA}","\u{1F939}","\u{1F3AD}","\u{1FA70}","\u{1F3A8}","\u{1F3AC}","\u{1F3A4}","\u{1F3A7}","\u{1F3BC}","\u{1F3B9}","\u{1F941}","\u{1FA98}","\u{1F3B7}","\u{1F3BA}","\u{1FA97}","\u{1F3B8}","\u{1FA95}","\u{1F3BB}","\u{1F3B2}","\u265F\uFE0F","\u{1F3AF}","\u{1F3B3}","\u{1F3AE}","\u{1F3B0}","\u{1F9E9}","\u{1F3B3}","\u{1F579}\uFE0F","\u{1FA84}","\u{1F52E}","\u{1F0CF}","\u{1F004}"]},{id:"objects",name:"Objects & Tech",icon:"\u{1F4A1}",emojis:["\u{1F4F1}","\u{1F4F2}","\u{1F4BB}","\u2328\uFE0F","\u{1F5A5}\uFE0F","\u{1F5A8}\uFE0F","\u{1F5B1}\uFE0F","\u{1F579}\uFE0F","\u{1F4BD}","\u{1F4BE}","\u{1F4BF}","\u{1F4C0}","\u{1F4F7}","\u{1F4F8}","\u{1F4F9}","\u{1F3A5}","\u{1F4FD}\uFE0F","\u{1F39E}\uFE0F","\u{1F4DE}","\u260E\uFE0F","\u{1F4DF}","\u{1F4E0}","\u{1F4FA}","\u{1F4FB}","\u{1F399}\uFE0F","\u{1F39A}\uFE0F","\u{1F39B}\uFE0F","\u23F1\uFE0F","\u23F2\uFE0F","\u23F0","\u{1F570}\uFE0F","\u231B","\u23F3","\u{1F4E1}","\u{1F50B}","\u{1F50C}","\u{1F4A1}","\u{1F526}","\u{1F56F}\uFE0F","\u{1F9EF}","\u{1F5D1}\uFE0F","\u{1F6E2}\uFE0F","\u{1F6D2}","\u{1F6CD}\uFE0F","\u{1F381}","\u{1F388}","\u{1F38F}","\u{1F380}","\u{1FA84}","\u{1F38A}","\u{1F389}","\u{1F38E}","\u{1F3EE}","\u{1F390}","\u2709\uFE0F","\u{1F4E9}","\u{1F4E8}","\u{1F4E7}","\u{1F4E6}","\u{1F3F7}\uFE0F","\u{1F4EA}","\u{1F4EB}","\u{1F4EC}","\u{1F4ED}","\u{1F4EE}","\u{1F4EF}","\u{1F4DC}","\u{1F4C3}","\u{1F4C4}","\u{1F4D1}","\u{1F9FE}","\u{1F4CA}","\u{1F4C8}","\u{1F4C9}","\u{1F5D2}\uFE0F","\u{1F5D3}\uFE0F","\u{1F4C5}","\u{1F4C6}","\u{1F4C7}","\u{1F4C1}","\u{1F4C2}","\u{1F5C2}\uFE0F","\u{1F5DE}\uFE0F","\u{1F4F0}","\u{1F4D3}","\u{1F4D5}","\u{1F4D7}","\u{1F4D8}","\u{1F4D9}","\u{1F4DA}","\u{1F4D6}","\u{1F516}","\u{1F517}","\u{1F4CE}","\u{1F587}\uFE0F","\u{1F4D0}","\u{1F4CF}","\u{1F4CC}","\u{1F4CD}","\u2702\uFE0F","\u{1F58A}\uFE0F","\u{1F58B}\uFE0F","\u2712\uFE0F","\u{1F58C}\uFE0F","\u{1F58D}\uFE0F","\u{1F4DD}","\u270F\uFE0F","\u{1F50D}","\u{1F50E}","\u{1F512}","\u{1F513}","\u{1F50F}","\u{1F510}","\u{1F511}","\u{1F5DD}\uFE0F","\u{1F528}","\u{1FA93}","\u26CF\uFE0F","\u{1F527}","\u{1FA9B}","\u{1F529}","\u2699\uFE0F","\u{1F5DC}\uFE0F","\u2696\uFE0F","\u{1F9AF}","\u26D3\uFE0F","\u{1FA9D}","\u{1F9F0}","\u{1F9F2}"]},{id:"symbols",name:"Symbols & Badges",icon:"\u2728",emojis:["\u{1F4AF}","\u{1F525}","\u2728","\u26A1","\u2B50","\u{1F31F}","\u{1F4AB}","\u{1F4A5}","\u{1F4A2}","\u{1F4A6}","\u{1F4A8}","\u{1F573}\uFE0F","\u{1F4A3}","\u{1F4AC}","\u{1F5E8}\uFE0F","\u{1F5EF}\uFE0F","\u{1F4AD}","\u{1F4A4}","\u{1F310}","\u{1F514}","\u{1F515}","\u{1F4E3}","\u{1F4E2}","\u26A0\uFE0F","\u26D4","\u{1F6AB}","\u2705","\u274C","\u2B55","\u2757","\u2753","\u2755","\u2754","\u203C\uFE0F","\u2049\uFE0F","\u2714\uFE0F","\u2611\uFE0F","\u2795","\u2796","\u2797","\u2716\uFE0F","\u{1F7F0}","\u267E\uFE0F","\u{1F4B2}","\u{1F4B1}","\xA9\uFE0F","\xAE\uFE0F","\u2122\uFE0F","\u{1F534}","\u{1F7E2}","\u{1F535}","\u{1F7E1}","\u{1F7E0}","\u{1F7E3}","\u26AB","\u26AA","\u{1F7E4}","\u{1F53A}","\u{1F53B}","\u{1F680}"]}],Ji=ct.flatMap(r=>r.emojis);var ra="https://vfjsaynnubxywdbevxtx.supabase.co",ia="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmanNheW5udWJ4eXdkYmV2eHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNTA5MDEsImV4cCI6MjEwMzgyNjkwMX0.YyBCXMqwrOk5BRhQafYLFw8tiM5PC8lc8Yocodw9wf0",wr=class{constructor(){this.container=null;this.shadow=null;this.conversationId=null;this.conversationStatus="open";this.visitorName="";this.visitorEmail="";this.isOpen=!1;this.activeTab="home";this.unreadCount=0;this.messages=[];this.faqs=[];this.sections=[];this.activeSectionId=null;this.faqSearchQuery="";this.isPreChatCompleted=!1;this.csatRated=!1;this.pendingAttachment=null;this.activeEmojiCategory="smileys";this.emojiSearchQuery="";this.currentPopupMsgId=null;this.popupCloseTimer=null;this.workspaceAgents=[];this.presenceInterval=null;this.audioCtx=null;this.botTyping=!1;this.agentTyping=!1;this.agentTypingTimer=null;this.realtimeChannel=null;this.typingChannel=null;this.forceNewConversation=!1;this.previousConversations=[];this.config=this.parseConfig(),this.supabase=Ki(this.config.supabaseUrl,this.config.supabaseKey);let e=this.config.workspaceId?`_${this.config.workspaceId.slice(0,8)}`:"";this.visitorId=this.getOrCreateVisitorId(e),this.conversationId=localStorage.getItem(`zentry_conversation_id${e}`)||localStorage.getItem(`chatify_conversation_id${e}`),this.visitorName=localStorage.getItem(`zentry_visitor_name${e}`)||localStorage.getItem(`chatify_visitor_name${e}`)||"",this.visitorEmail=localStorage.getItem(`zentry_visitor_email${e}`)||localStorage.getItem(`chatify_visitor_email${e}`)||"",this.visitorEmail&&(this.isPreChatCompleted=!0),this.initDOM(),this.fetchWorkspaceSettingsAndApply().then(async t=>{if(this.shadow?.getElementById("chatifyLauncherBtn")?.classList.remove("is-loading"),t!==!1){if(this.bindGlobalTriggers(),this.initVisitorTracking(),this.initSPANavigationTracking(),!this.conversationId&&this.visitorId)try{let i=this.supabase.from("conversations").select("id, status").eq("visitor_id",this.visitorId).order("created_at",{ascending:!1}).limit(1);this.config.workspaceId&&(i=i.eq("workspace_id",this.config.workspaceId));let{data:s}=await i.maybeSingle();s?.id&&(this.conversationId=s.id,this.conversationStatus=s.status||"open",localStorage.setItem(`zentry_conversation_id${e}`,s.id),localStorage.setItem(`chatify_conversation_id${e}`,s.id))}catch{}this.conversationId?(await this.loadMessageHistory(),this.subscribeToRealtime()):this.visitorId&&this.subscribeToVisitorConversations(e);try{let i=sessionStorage.getItem(`zentry_widget_open${e}`)||sessionStorage.getItem(`chatify_widget_open${e}`),s=sessionStorage.getItem(`zentry_widget_tab${e}`)||sessionStorage.getItem(`chatify_widget_tab${e}`);i==="1"&&(this.open(s||"messages"),this.scrollToBottom(!1))}catch{}this.initProactiveWelcome(),this.loadPreviousConversations()}})}isImageAttachment(e){return e?e.includes("cloudinary.com")&&(e.includes("/image/upload/")||!e.includes("/raw/upload/"))?!0:!!e.match(/\.(jpeg|jpg|png|webp|gif|svg|avif|bmp)(\?.*)?$/i):!1}parseConfig(){let e=document.currentScript;e||(e=document.querySelector('script[src*="widget.js"]'));let t=typeof window<"u"?new URLSearchParams(window.location.search):null,i=t?.get("workspaceId")||t?.get("ws")||t?.get("zentry_workspace")||t?.get("chatify_workspace"),s=t?.get("logo")||t?.get("logoUrl")||t?.get("logo_url"),n=t?.get("show_launcher_logo")??t?.get("launcher_logo"),a=t?.get("widget_icon")||t?.get("icon"),o=e?.getAttribute("data-api-url")||"";if(!o&&e?.src)try{o=new URL(e.src).origin}catch{}return!o&&typeof window<"u"&&(o=window.location.origin),{supabaseUrl:e?.getAttribute("data-supabase-url")||ra,supabaseKey:e?.getAttribute("data-supabase-key")||ia,workspaceId:i||e?.getAttribute("data-workspace-id")||null,title:e?.getAttribute("data-title")||"Support Team",subtitle:e?.getAttribute("data-subtitle")||"We reply in under 5 minutes",primaryColor:e?.getAttribute("data-color")||"#2e5bff",position:e?.getAttribute("data-position")||"bottom-right",helpTabLabel:e?.getAttribute("data-help-label")||"Help",showHelpTab:e?.getAttribute("data-show-help")!=="false",helpTabIcon:e?.getAttribute("data-help-icon")||"\u{1F4D6}",logoUrl:s||e?.getAttribute("data-logo-url")||e?.getAttribute("data-logo")||void 0,showLauncherLogo:n!==null?n!=="false":e?.getAttribute("data-show-launcher-logo")!=="false",widgetIcon:a||e?.getAttribute("data-widget-icon")||e?.getAttribute("data-icon")||void 0,welcomeText:e?.getAttribute("data-welcome-text")||void 0,businessName:e?.getAttribute("data-business-name")||e?.getAttribute("data-company-name")||void 0,customDomain:e?.getAttribute("data-custom-domain")||void 0,apiUrl:o,offsetBottom:e?.hasAttribute("data-offset-bottom")?parseInt(e.getAttribute("data-offset-bottom"),10):20,offsetSide:e?.hasAttribute("data-offset-side")?parseInt(e.getAttribute("data-offset-side"),10):20,zIndex:e?.hasAttribute("data-z-index")?parseInt(e.getAttribute("data-z-index"),10):2147483e3,enableProactiveWelcome:e?.getAttribute("data-enable-proactive-welcome")!=="false"&&e?.getAttribute("data-proactive-welcome")!=="false",proactiveDelaySeconds:Math.max(8,parseInt(e?.getAttribute("data-proactive-delay")||"8",10))}}resetSession(){let e=this.config.workspaceId?`_${this.config.workspaceId.slice(0,8)}`:"";localStorage.removeItem(`zentry_visitor_id${e}`),localStorage.removeItem(`zentry_conversation_id${e}`),localStorage.removeItem(`zentry_visitor_name${e}`),localStorage.removeItem(`zentry_visitor_email${e}`),localStorage.removeItem(`chatify_visitor_id${e}`),localStorage.removeItem(`chatify_conversation_id${e}`),localStorage.removeItem(`chatify_visitor_name${e}`),localStorage.removeItem(`chatify_visitor_email${e}`),window.location.reload()}async fetchWorkspaceSettingsAndApply(){if(!this.config.workspaceId)return!0;try{let{data:e,error:t}=await this.supabase.rpc("fn_get_workspace_config",{p_workspace_id:this.config.workspaceId});return t||!e?(console.warn("[Zen-try] Workspace is suspended, inactive, or not found. Widget will not load."),this.container&&this.container.parentNode&&this.container.parentNode.removeChild(this.container),!1):(e.name&&(this.config.businessName=e.name),e.brand_color&&(this.config.primaryColor=e.brand_color),e.greeting_title&&(this.config.title=e.greeting_title),e.greeting_message&&(this.config.subtitle=e.greeting_message,this.config.welcomeText=e.greeting_message),typeof e.launcher_offset_bottom=="number"?this.config.offsetBottom=e.launcher_offset_bottom:e.navbar_trigger_config?.launcher_offset_bottom!==void 0&&(this.config.offsetBottom=Number(e.navbar_trigger_config.launcher_offset_bottom)),typeof e.launcher_offset_side=="number"?this.config.offsetSide=e.launcher_offset_side:e.navbar_trigger_config?.launcher_offset_side!==void 0&&(this.config.offsetSide=Number(e.navbar_trigger_config.launcher_offset_side)),typeof e.widget_z_index=="number"?this.config.zIndex=e.widget_z_index:e.navbar_trigger_config?.widget_z_index!==void 0&&(this.config.zIndex=Number(e.navbar_trigger_config.widget_z_index)),typeof e.enable_proactive_welcome=="boolean"?this.config.enableProactiveWelcome=e.enable_proactive_welcome:e.navbar_trigger_config?.enable_proactive_welcome!==void 0&&(this.config.enableProactiveWelcome=!!e.navbar_trigger_config.enable_proactive_welcome),typeof e.proactive_delay_seconds=="number"?this.config.proactiveDelaySeconds=Math.max(8,e.proactive_delay_seconds):e.navbar_trigger_config?.proactive_delay_seconds!==void 0&&(this.config.proactiveDelaySeconds=Math.max(8,Number(e.navbar_trigger_config.proactive_delay_seconds))),e.widget_position&&(this.config.position=e.widget_position==="left"?"bottom-left":"bottom-right"),e.help_center_tab_label&&(this.config.helpTabLabel=e.help_center_tab_label),e.logo_url&&(this.config.logoUrl=e.logo_url),typeof e.show_launcher_logo=="boolean"&&(this.config.showLauncherLogo=e.show_launcher_logo),e.navbar_trigger_config?.widget_icon?this.config.widgetIcon=e.navbar_trigger_config.widget_icon:e.widget_icon&&(this.config.widgetIcon=e.widget_icon),e.greeting_title&&(this.config.greetingTitle=e.greeting_title),typeof e.show_help_tab=="boolean"&&(this.config.showHelpTab=e.show_help_tab),e.help_center_tab_icon&&(this.config.helpTabIcon=e.help_center_tab_icon),e.custom_domain&&e.custom_domain_status==="verified"&&(this.config.customDomain=e.custom_domain),e.slug&&(this.config.helpSlug=e.slug),e.navbar_trigger_config&&(this.config.navbarTriggerConfig=e.navbar_trigger_config),e.business_hours&&(this.config.businessHours=e.business_hours),Array.isArray(e.agents)&&(this.workspaceAgents=e.agents),this.initNavbarAutoTrigger(),this.updateThemeAndTexts(),this.renderAvatarsStack(this.workspaceAgents),this.updatePresenceAndTexts(),this.subscribeToAgentsRealtime(),await this.loadWorkspaceArticles(),!0)}catch(e){return console.warn("[Zen-try] Could not fetch workspace config:",e),!0}}isOutsideBusinessHours(e){if(!e||!e.enabled||!e.schedule)return!1;try{let t=new Date,i=e.timezone||"UTC",s=new Intl.DateTimeFormat("en-US",{weekday:"long",timeZone:i}).format(t).toLowerCase(),n=e.schedule[s];if(!n||!n.enabled)return!0;let a=new Intl.DateTimeFormat("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!1,timeZone:i}).format(t);return a<n.start||a>n.end}catch{return!1}}async loadWorkspaceArticles(){if(!this.config.workspaceId){this.sections=[],this.faqs=[],this.renderFaqList();return}try{let[e,t]=await Promise.all([this.supabase.from("help_sections").select("id, name, description, icon, order_index, slug").eq("workspace_id",this.config.workspaceId).order("order_index",{ascending:!0}).order("created_at",{ascending:!0}),this.supabase.from("articles").select("id, title, slug, summary, content, category, section_id, order_index, section:help_sections(id, name, icon)").eq("workspace_id",this.config.workspaceId).eq("status","published").order("order_index",{ascending:!0}).order("created_at",{ascending:!0})]),i=t.data||[],s=e.data||[];this.faqs=i.map(h=>({id:h.id,slug:h.slug,q:h.title,summary:h.summary||"",a:h.content,category:h.section?.name||h.section_id&&h.category||"Other",icon:h.section?.icon||"\u{1F4DA}",sectionId:h.section_id||null,order_index:h.order_index??0}));let n={},a=0;this.faqs.forEach(h=>{h.sectionId?n[h.sectionId]=(n[h.sectionId]||0)+1:a++});let o=s.filter(h=>(n[h.id]||0)>0).map(h=>({id:h.id,name:h.name,description:h.description||null,icon:h.icon||"\u{1F4DA}",order_index:h.order_index??0,slug:h.slug||"",articleCount:n[h.id]||0})),l=new Set,c=[];for(let h of o){let d=(h.name||"").trim().toLowerCase();d&&!l.has(d)&&(l.add(d),c.push(h))}if(a>0){let h="Other";l.has("other")&&(h="More Articles"),l.add(h.toLowerCase()),c.push({id:"__other__",name:h,description:null,icon:"\u{1F4DA}",order_index:9999,slug:"other",articleCount:a})}if(this.sections=c,!this.config.customDomain||!this.config.helpSlug){let{data:h}=await this.supabase.from("public_workspaces").select("custom_domain, custom_domain_status, slug").eq("id",this.config.workspaceId).maybeSingle();h&&(h.custom_domain&&h.custom_domain_status==="verified"&&(this.config.customDomain=h.custom_domain),h.slug&&(this.config.helpSlug=h.slug))}this.renderFaqList(),this.updateThemeAndTexts(),this.initNavbarAutoTrigger()}catch(e){console.warn("[Zen-try] Failed to fetch dynamic articles or sections:",e),this.sections=[],this.faqs=[],this.renderFaqList(),this.updateThemeAndTexts(),this.initNavbarAutoTrigger()}}formatChatMarkdown(e){let t=l=>{let c=this.escapeHTML(l);return c=c.replace(/`([^`]+)`/g,'<code class="chatify-inline-code">$1</code>'),c=c.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'),c=c.replace(/(^|[\s(*])(https?:\/\/[^\s<)*]+)/g,'$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>'),c=c.replace(/(^|[\s(*])([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g,'$1<a href="mailto:$2">$2</a>'),c=c.replace(/\*\*([^*]+?)\*\*/g,"<strong>$1</strong>"),c=c.replace(/(^|[^*\w])\*(?!\s)([^*]+?)\*(?!\w)/g,"$1<em>$2</em>"),c},i=[],s=null,n=[],a=()=>{n.length&&i.push(`<p>${n.map(t).join("<br/>")}</p>`),n=[]},o=()=>{s&&i.push(`<${s.tag}>${s.items.map(l=>`<li>${l}</li>`).join("")}</${s.tag}>`),s=null};for(let l of e.replace(/\r\n/g,`
`).split(`
`)){let c=l.trim(),h=c.match(/^(#{1,4})\s+(.+)$/),d=c.match(/^[-*•]\s+(.+)$/),f=c.match(/^\d+[.)]\s+(.+)$/);if(!c)a(),o();else if(h){a(),o();let u=Math.min(Math.max(h[1].length,2)+1,5);i.push(`<h${u}>${t(h[2].replace(/\*\*/g,""))}</h${u}>`)}else if(/^(-{3,}|\*{3,})$/.test(c))a(),o(),i.push("<hr/>");else if(d||f){a();let u=d?"ul":"ol";s&&s.tag!==u&&o(),s||(s={tag:u,items:[]}),s.items.push(t((d||f)[1]))}else s&&/^\s{2,}/.test(l)?s.items[s.items.length-1]+=`<br/>${t(c)}`:(o(),n.push(c))}return a(),o(),i.join("")}formatMarkdownToHtml(e){if(!e)return"";let t=e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");return t=t.replace(/```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g,(s,n)=>`<pre class="chatify-code-block"><code>${n.trim()}</code></pre>`),t=t.replace(/`([^`\n]+)`/g,'<code class="chatify-inline-code">$1</code>'),t=t.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g,'<img src="$2" alt="$1" class="chatify-art-img" style="max-width:100%;border-radius:6px;margin:6px 0;" />'),t=t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer" class="chatify-art-link">$1</a>'),t=t.replace(/^#### (.*$)/gim,'<h5 style="margin:10px 0 4px;font-size:12.5px;font-weight:700;color:var(--w-ink);">$1</h5>'),t=t.replace(/^### (.*$)/gim,'<h4 style="margin:12px 0 4px;font-size:13px;font-weight:700;color:var(--w-ink);">$1</h4>'),t=t.replace(/^## (.*$)/gim,'<h3 style="margin:14px 0 6px;font-size:14px;font-weight:700;color:var(--w-ink);">$1</h3>'),t=t.replace(/^# (.*$)/gim,'<h2 style="margin:16px 0 6px;font-size:15px;font-weight:700;color:var(--w-ink);">$1</h2>'),t=t.replace(/\*\*\*([^*]+)\*\*\*/g,"<strong><em>$1</em></strong>"),t=t.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"),t=t.replace(/__([^_]+)__/g,"<strong>$1</strong>"),t=t.replace(/\*([^*]+)\*/g,"<em>$1</em>"),t=t.replace(/_([^_]+)_/g,"<em>$1</em>"),t=t.replace(/^>\s?(.*$)/gim,'<blockquote style="border-left:3px solid var(--w-brand);margin:6px 0;padding-left:8px;color:var(--w-ink-2);font-style:italic;">$1</blockquote>'),t=t.replace(/((?:^(?:[-*]\s+.+)(?:\n|$))+)/gm,s=>`<ul style="margin:6px 0 8px 18px;padding:0;">${s.trim().split(`
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
    `}renderFaqList(){let e=this.shadow?.getElementById("faqList");if(!e)return;let t=this.shadow?.getElementById("cardHelpSearch");if(t&&(t.style.display=this.config.showHelpTab!==!1&&this.faqs.length>0?"block":"none"),this.faqs.length===0){e.innerHTML="";return}let i=(this.faqSearchQuery||"").toLowerCase().trim();if(i){let a=this.faqs.filter(o=>o.q.toLowerCase().includes(i)||o.summary&&o.summary.toLowerCase().includes(i)||o.a.toLowerCase().includes(i)||o.category&&o.category.toLowerCase().includes(i));if(a.length===0){e.innerHTML=`
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
    `,this.bindFaqListeners()}bindFaqListeners(){let e=this.shadow?.getElementById("faqBackToSections");e&&(e.onclick=()=>{this.activeSectionId=null,this.renderFaqList()}),this.shadow?.querySelectorAll(".chatify-section-card").forEach(t=>{t.onclick=()=>{let i=t.getAttribute("data-section-id");i&&(this.activeSectionId=i,this.renderFaqList())}}),this.shadow?.querySelectorAll(".chatify-faq-item").forEach(t=>{t.onclick=i=>{i.target.closest(".chatify-vote-btn")||i.target.closest(".chatify-article-ext-link")||t.classList.toggle("open")}}),this.shadow?.querySelectorAll(".chatify-vote-btn").forEach(t=>{t.onclick=async i=>{i.stopPropagation();let s=i.currentTarget,n=s.getAttribute("data-art-id"),a=s.getAttribute("data-helpful")==="true",o=s.closest(".chatify-vote-group");if(o&&(o.innerHTML='<span style="font-size:11px; color:var(--w-brand); font-weight:600;">\u2713 Feedback sent</span>'),n&&this.config.workspaceId)try{await this.supabase.rpc("fn_submit_article_feedback",{p_article_id:n,p_workspace_id:this.config.workspaceId,p_visitor_id:this.visitorId,p_is_helpful:a,p_feedback_text:null})}catch{}}})}getOrCreateVisitorId(e){let t=localStorage.getItem(`zentry_visitor_id${e}`)||localStorage.getItem(`chatify_visitor_id${e}`);return t?localStorage.setItem(`zentry_visitor_id${e}`,t):(t="xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,i=>{let s=Math.random()*16|0;return(i==="x"?s:s&3|8).toString(16)}),localStorage.setItem(`zentry_visitor_id${e}`,t),localStorage.setItem(`chatify_visitor_id${e}`,t)),t}async initVisitorTracking(){let e=Intl.DateTimeFormat().resolvedOptions().timeZone||"Unknown";try{await this.supabase.rpc("fn_upsert_visitor",{p_id:this.visitorId,p_name:this.visitorName||null,p_email:this.visitorEmail||null,p_current_url:window.location.href,p_user_agent:navigator.userAgent,p_ip_address:null,p_location:e,p_workspace_id:this.config.workspaceId||null});try{await this.supabase.rpc("fn_update_visitor_meta",{p_id:this.visitorId,p_timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||null,p_language:navigator.language||null})}catch{}}catch(i){console.warn("[Zen-try] Visitor tracking error:",i)}(async()=>{try{let i="",s="";try{let n=await fetch("https://ipwho.is/",{signal:AbortSignal.timeout(2500)});if(n.ok){let a=await n.json();a.success!==!1&&a.country&&(i=a.city||"",s=a.country||"")}}catch{}if(!s)try{let n=await fetch("https://ipapi.co/json/",{signal:AbortSignal.timeout(2500)});if(n.ok){let a=await n.json();a.country_name&&(i=a.city||"",s=a.country_name||"")}}catch{}if(s){let n=i?`${i}, ${s}`:s;await this.supabase.rpc("fn_upsert_visitor",{p_id:this.visitorId,p_name:this.visitorName||null,p_email:this.visitorEmail||null,p_current_url:window.location.href,p_user_agent:navigator.userAgent,p_ip_address:null,p_location:n,p_workspace_id:this.config.workspaceId||null})}}catch{}})(),setInterval(()=>{this.sendHeartbeat()},15e3);let t=()=>{try{fetch(`${this.config.supabaseUrl}/rest/v1/rpc/fn_visitor_offline`,{method:"POST",headers:{"Content-Type":"application/json",apikey:this.config.supabaseKey,Authorization:`Bearer ${this.config.supabaseKey}`},body:JSON.stringify({p_visitor_id:this.visitorId}),keepalive:!0}).catch(()=>{})}catch{}};window.addEventListener("beforeunload",t),window.addEventListener("pagehide",t)}async sendHeartbeat(){try{await this.supabase.rpc("fn_visitor_heartbeat",{p_visitor_id:this.visitorId,p_current_url:window.location.href})}catch{}}initSPANavigationTracking(){let e=()=>{setTimeout(()=>this.sendHeartbeat(),200)},t=history.pushState;history.pushState=function(...s){let n=t.apply(this,s);return e(),n};let i=history.replaceState;history.replaceState=function(...s){let n=i.apply(this,s);return e(),n},window.addEventListener("popstate",e)}playIncomingSound(){try{if(!this.audioCtx){let s=window.AudioContext||window.webkitAudioContext;this.audioCtx=new s}this.audioCtx.state==="suspended"&&this.audioCtx.resume();let e=this.audioCtx.currentTime,t=this.audioCtx.createOscillator(),i=this.audioCtx.createGain();t.type="sine",t.frequency.setValueAtTime(784,e),t.frequency.setValueAtTime(1046.5,e+.1),i.gain.setValueAtTime(0,e),i.gain.linearRampToValueAtTime(.2,e+.02),i.gain.exponentialRampToValueAtTime(.001,e+.35),t.connect(i),i.connect(this.audioCtx.destination),t.start(e),t.stop(e+.35)}catch{}}subscribeToRealtime(){if(this.conversationId){if(this.realtimeChannel){try{this.supabase.removeChannel(this.realtimeChannel)}catch{}this.realtimeChannel=null}this.subscribeToTyping(),this.realtimeChannel=this.supabase.channel(`chatify-widget-${this.conversationId}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"messages",filter:`conversation_id=eq.${this.conversationId}`},e=>{let t=e.new;if(t.is_internal||this.messages.some(s=>s.id===t.id))return;let i=this.messages.findIndex(s=>(s.id.startsWith("temp-")||s.pending)&&s.sender_type===t.sender_type&&(s.content===t.content||s.attachment_url===t.attachment_url));if(i!==-1){this.messages[i]=t,this.renderMessages();return}t.sender_type!=="visitor"&&(this.botTyping=!1,this.agentTyping=!1),this.messages.push(t),this.renderMessages(),t.sender_type!=="visitor"&&(this.playIncomingSound(),!this.isOpen||this.activeTab!=="messages"?(this.unreadCount+=1,this.updateUnreadBadge(),this.markMessagesAsDelivered(),this.isOpen||this.showMessagePopup(t)):this.markMessagesAsRead())}).on("postgres_changes",{event:"UPDATE",schema:"public",table:"messages",filter:`conversation_id=eq.${this.conversationId}`},e=>{let t=e.new,i=this.messages.findIndex(s=>s.id===t.id);i!==-1&&(this.messages[i]={...this.messages[i],...t},this.renderMessages())}).on("postgres_changes",{event:"DELETE",schema:"public",table:"messages",filter:`conversation_id=eq.${this.conversationId}`},e=>{let t=e.old?.id;t&&(this.messages=this.messages.filter(i=>i.id!==t),this.renderMessages())}).on("postgres_changes",{event:"UPDATE",schema:"public",table:"conversations",filter:`id=eq.${this.conversationId}`},e=>{let t=e.new;t.status&&(this.conversationStatus=t.status,this.renderMessages())}).subscribe()}}async loadMessageHistory(){if(!this.conversationId)return;let{data:e}=await this.supabase.from("messages").select("*").eq("conversation_id",this.conversationId).or("is_internal.is.null,is_internal.eq.false").order("created_at",{ascending:!0});if(e){if(this.messages=e,this.renderMessages(),this.isOpen&&this.activeTab==="messages")this.unreadCount=0,this.markMessagesAsRead();else if(this.unreadCount=this.messages.filter(t=>t.sender_type!=="visitor"&&!t.read_at).length,!this.isOpen&&this.unreadCount>0){let t=[...this.messages].reverse().find(i=>i.sender_type!=="visitor"&&!i.read_at);if(t)try{sessionStorage.getItem(`chatify_popup_dismissed_${t.id}`)||this.showMessagePopup(t)}catch{}}this.updateUnreadBadge()}}async markMessagesAsDelivered(){if(this.conversationId)try{await this.supabase.rpc("fn_mark_messages_delivered",{p_conversation_id:this.conversationId,p_exclude_sender:"visitor"})}catch{}}async markMessagesAsRead(){if(this.conversationId){try{await this.supabase.rpc("fn_mark_messages_read",{p_conversation_id:this.conversationId,p_exclude_sender:"visitor"})}catch{}try{await this.supabase.rpc("fn_mark_conversation_messages_as_read",{p_conversation_id:this.conversationId,p_reader_type:"visitor"})}catch{}}}async ensureConversation(){if(this.conversationId)return this.conversationId;let e=this.config.workspaceId?`_${this.config.workspaceId.slice(0,8)}`:"",t=null,i=null;if(this.forceNewConversation)i=new Error("forced new conversation");else{let s=await this.supabase.rpc("fn_get_or_create_conversation",{p_visitor_id:this.visitorId,p_workspace_id:this.config.workspaceId||null});t=s.data,i=s.error}if(this.forceNewConversation=!1,i||!t){console.warn("[Zen-try] fn_get_or_create_conversation fallback:",i);try{await this.supabase.from("visitors").upsert({id:this.visitorId,workspace_id:this.config.workspaceId||null,last_seen:new Date().toISOString(),is_online:!0});let{data:s,error:n}=await this.supabase.from("conversations").insert({visitor_id:this.visitorId,workspace_id:this.config.workspaceId||null,status:"open"}).select().single();if(s)t=s;else throw n||new Error("Failed to create conversation")}catch(s){throw new Error("Failed to create conversation: "+(i?.message||String(s)))}}return this.conversationId=t.id,this.conversationStatus=t.status||"open",localStorage.setItem(`chatify_conversation_id${e}`,t.id),this.subscribeToRealtime(),t.id}async sendMessage(e,t){if(!e.trim()&&!t)return;let i=await this.ensureConversation(),s={id:"temp-"+Date.now(),sender_type:"visitor",content:e.trim()||(t?"Sent a picture":""),attachment_url:t||null,created_at:new Date().toISOString(),pending:!0};this.messages.push(s),this.renderMessages(),this.conversationStatus!=="open"&&(this.conversationStatus="open",this.supabase.from("conversations").update({status:"open",closed_at:null,snoozed_until:null,updated_at:new Date().toISOString()}).eq("id",i).then(()=>{}));let{data:n,error:a}=await this.supabase.from("messages").insert({conversation_id:i,sender_type:"visitor",content:e.trim()||(t?"Sent a picture":""),attachment_url:t||null,is_internal:!1}).select().single();if(a){console.error("[Zen-try] Error sending message:",a),s.pending=!1,this.renderMessages();return}if(n){let o=this.messages.findIndex(l=>l.id===s.id);o!==-1&&(this.messages[o]=n,this.renderMessages())}if(e.trim()&&fetch(`${this.config.apiUrl||""}/api/translation/process-message`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messageId:n?.id,conversationId:i,text:e.trim(),workspaceId:this.config.workspaceId})}).catch(()=>{}),this.config.workspaceId){let o=setTimeout(()=>this.setBotTyping(!0),700);fetch(`${this.config.apiUrl||""}/api/ai/auto-respond`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({conversation_id:i,workspace_id:this.config.workspaceId,message_id:n?.id})}).catch(()=>{}).finally(()=>{clearTimeout(o),this.setBotTyping(!1)})}}setBotTyping(e){this.botTyping!==e&&(this.botTyping=e,this.renderMessages())}subscribeToTyping(){if(this.typingChannel){try{this.supabase.removeChannel(this.typingChannel)}catch{}this.typingChannel=null}this.conversationId&&(this.typingChannel=this.supabase.channel(`chatify-typing-${this.conversationId}`).on("broadcast",{event:"typing"},e=>{e?.payload?.sender!=="visitor"&&(this.agentTyping=!0,this.agentTypingTimer&&clearTimeout(this.agentTypingTimer),this.agentTypingTimer=setTimeout(()=>{this.agentTyping=!1,this.renderMessages()},4e3),this.renderMessages())}).subscribe())}startNewConversation(){let e=this.config.workspaceId?`_${this.config.workspaceId.slice(0,8)}`:"";if(this.realtimeChannel){try{this.supabase.removeChannel(this.realtimeChannel)}catch{}this.realtimeChannel=null}this.conversationId=null,this.conversationStatus="open",this.forceNewConversation=!0,this.csatRated=!1,this.messages=[],this.unreadCount=0,this.botTyping=!1,this.agentTyping=!1;try{localStorage.removeItem(`chatify_conversation_id${e}`)}catch{}this.subscribeToTyping(),this.updateUnreadBadge(),this.renderMessages(),this.loadPreviousConversations(),setTimeout(()=>{this.shadow?.getElementById("chatifyTextarea")?.focus()},100)}async loadPreviousConversations(){if(this.visitorId){try{let{data:e}=await this.supabase.rpc("fn_get_visitor_conversations",{p_visitor_id:this.visitorId,p_workspace_id:this.config.workspaceId||null});this.previousConversations=Array.isArray(e)?e:[]}catch{}this.renderPreviousConversations()}}renderPreviousConversations(){let e=this.shadow?.getElementById("cardPrevConvs"),t=this.shadow?.getElementById("prevConvsList");if(!e||!t)return;let i=this.previousConversations.filter(s=>s.id!==this.conversationId&&s.last_message).slice(0,5);if(i.length===0){e.style.display="none";return}e.style.display="block",t.innerHTML=i.map(s=>{let a=(s.last_message?.content||"").replace(/^#{1,6}\s+/gm,"").replace(/\*\*|__|`/g,"").replace(/\s+/g," ").trim()||(s.last_message?.attachment_url?"Sent a picture":"Conversation"),o=this.formatRelativeTime(new Date(s.updated_at||s.created_at)),l=s.status==="closed";return`<button type="button" class="chatify-prev-item" data-id="${this.escapeHTML(s.id)}"><span class="chatify-prev-text"><span class="chatify-prev-snippet">${this.escapeHTML(a.length>70?a.slice(0,70)+"\u2026":a)}</span><span class="chatify-prev-meta">${this.escapeHTML(o)} \xB7 ${l?"Closed":"Open"}</span></span><span class="chatify-prev-chevron">\u203A</span></button>`}).join(""),t.querySelectorAll(".chatify-prev-item").forEach(s=>{s.addEventListener("click",()=>{this.openPreviousConversation(s.getAttribute("data-id")||"")})})}async openPreviousConversation(e){if(!e)return;let t=this.previousConversations.find(s=>s.id===e),i=this.config.workspaceId?`_${this.config.workspaceId.slice(0,8)}`:"";this.conversationId=e,this.conversationStatus=t?.status||"open",this.csatRated=!!t?.csat_rating,this.messages=[],this.botTyping=!1,this.agentTyping=!1;try{localStorage.setItem(`zentry_conversation_id${i}`,e),localStorage.setItem(`chatify_conversation_id${i}`,e)}catch{}this.subscribeToRealtime(),this.switchTab("messages"),await this.loadMessageHistory(),this.renderPreviousConversations()}async submitCSAT(e){this.conversationId&&(this.csatRated=!0,await this.supabase.from("conversations").update({csat_rating:e}).eq("id",this.conversationId),this.renderMessages())}renderLauncherIconHTML(){if((this.config.widgetIcon==="custom_logo"||!this.config.widgetIcon&&this.config.showLauncherLogo!==!1&&!!this.config.logoUrl)&&this.config.logoUrl)return`<img src="${this.escapeHTML(this.config.logoUrl)}" alt="Chat" class="chatify-launcher-icon chatify-custom-logo" onerror="this.src='${vr||Gi}';this.classList.remove('chatify-custom-logo');" />`;let t=this.config.primaryColor||"#2e5bff";switch(this.config.widgetIcon){case"double_bubble":return`<svg viewBox="0 0 28 28" fill="none" class="chatify-launcher-icon" width="28" height="28" style="display:block;">
          <path d="M9 4.5h11a2.5 2.5 0 012.5 2.5v7a2.5 2.5 0 01-2.5 2.5h-1v2.5a.6.6 0 01-1.02.42L15 16.5H9a2.5 2.5 0 01-2.5-2.5V7A2.5 2.5 0 019 4.5z" fill="#ffffff" opacity="0.88"/>
          <path d="M5.5 7.5h10.5a2.5 2.5 0 012.5 2.5V17a2.5 2.5 0 01-2.5 2.5h-4.8l-3.2 2.6a.6.6 0 01-.98-.46V19.5H5.5A2.5 2.5 0 013 17v-7a2.5 2.5 0 012.5-2.5z" fill="#ffffff" stroke="${t}" stroke-width="1.2"/>
        </svg>`;case"dots_bubble":return`<svg viewBox="0 0 28 28" fill="none" class="chatify-launcher-icon" width="28" height="28" style="display:block;">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M14 4C7.925 4 3 8.477 3 14c0 2.87 1.34 5.46 3.48 7.31L5.2 24.8a.7.7 0 001 .8l4.2-2c1.14.26 2.34.4 3.6.4 6.075 0 11-4.477 11-10S20.075 4 14 4zm-4.75 11.25a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm4.75 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm4.75 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" fill="#ffffff"/>
        </svg>`;case"smile_line":return`<svg viewBox="0 0 28 28" fill="none" class="chatify-launcher-icon" width="28" height="28" style="display:block;">
          <path d="M5 4.5h16a2.5 2.5 0 012.5 2.5v10a2.5 2.5 0 01-2.5 2.5h-4.5l-3.5 2.8a.7.7 0 01-1.14-.54V19.5H5A2.5 2.5 0 012.5 17V7A2.5 2.5 0 015 4.5z" fill="#ffffff"/>
          <path d="M8 12.2c1.5 2.2 5.5 2.4 7.2.2.4-.5 1.1-.3 1.2.2" stroke="${t}" stroke-width="2.2" stroke-linecap="round"/>
        </svg>`;default:return`<svg viewBox="0 0 28 28" fill="none" class="chatify-launcher-icon" width="28" height="28" style="display:block;">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M5 4C3.895 4 3 4.895 3 6v13c0 1.105.895 2 2 2h4.5v3.2a.8.8 0 001.36.57L15 21h8c1.105 0 2-.895 2-2V6c0-1.105-.895-2-2-2H5zm4 10.5a5 5 0 0010 0H9z" fill="#ffffff"/>
        </svg>`}}initDOM(){this.container=document.createElement("div"),this.container.id="zentry-widget-root",this.container.className="zentry-widget-root chatify-widget-root",this.container.setAttribute("data-zentry-root","true"),document.body.appendChild(this.container),this.shadow=this.container.attachShadow({mode:"open"});let e=window.visualViewport;if(e&&this.container){let b=this.container,v=()=>{b.style.setProperty("--w-vvh",`${Math.round(e.height)}px`),b.style.setProperty("--w-vv-top",`${Math.round(e.offsetTop)}px`)};v(),e.addEventListener("resize",v),e.addEventListener("scroll",v)}["keydown","keyup","keypress"].forEach(b=>{this.shadow?.addEventListener(b,v=>{v.stopPropagation()}),this.container?.addEventListener(b,v=>{v.stopPropagation()})}),this.shadow.addEventListener("keydown",b=>{let v=b;if(v.key==="Escape"){let T=this.shadow?.getElementById("chatifyEmojiPicker");if(!!(T&&T.style.display!=="none"&&T.style.display!=="")){v.preventDefault(),this.closeEmojiPicker(),this.shadow?.getElementById("chatifyTextarea")?.focus();return}let A=this.shadow?.getElementById("chatifyImageLightbox");if(!!(A&&A.style.display==="flex")){v.preventDefault(),this.closeLightbox();return}this.isOpen&&(v.preventDefault(),this.close())}});let t=document.createElement("style");t.id="chatify-theme-style",t.textContent=this.generateCSS(),this.shadow.appendChild(t);let i=document.createElement("button");i.className=this.config.workspaceId?"chatify-launcher is-loading":"chatify-launcher",i.id="chatifyLauncherBtn",i.setAttribute("aria-label","Open chat"),i.innerHTML=`
      <div class="chatify-badge" id="chatifyBadge">0</div>
      <span id="chatifyIconOpen" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;">
        ${this.renderLauncherIconHTML()}
      </span>
      <svg id="chatifyIconClose" style="display:none;" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `,i.onclick=()=>this.toggleWindow(),this.shadow.appendChild(i);let s=document.createElement("div");s.className="chatify-message-popup",s.id="chatifyMessagePopup",s.style.display="none",s.innerHTML=`
      <div class="chatify-popup-card" id="chatifyPopupCard" title="Click to view conversation">
        <div class="chatify-popup-avatar-wrap">
          <div class="chatify-popup-avatar" id="chatifyPopupAvatar">TD</div>
          <span class="chatify-popup-status-dot"></span>
        </div>
        <div class="chatify-popup-content">
          <div class="chatify-popup-header">
            <span class="chatify-popup-title" id="chatifyPopupTitle">Trader Care Desk</span>
            <button type="button" class="chatify-popup-close" id="chatifyPopupCloseBtn" title="Dismiss" aria-label="Close message preview">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <p class="chatify-popup-message" id="chatifyPopupMessageText">Hi, how can we help?</p>
        </div>
      </div>
      <div class="chatify-popup-reply-bar" id="chatifyPopupReplyBar">
        <input type="text" class="chatify-popup-input" id="chatifyPopupInput" placeholder="Write your message..." autocomplete="off" />
        <button type="button" class="chatify-popup-send" id="chatifyPopupSendBtn" title="Send message" aria-label="Send message">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    `,this.shadow.appendChild(s);let n=document.createElement("div");n.className="chatify-window",n.id="chatifyWindow",n.innerHTML=`
      <!-- TAB 1: HOME TAB -->
      <div class="chatify-tab-pane" id="tabHome" style="display: flex;">
        <div class="chatify-home-hero">
          <div class="chatify-brand-row">
            <div class="chatify-home-avatar" id="homeBrandAvatar">
              ${this.renderBrandAvatarHTML(!1)}
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
                <div class="chatify-mini-avatar" id="openConvAvatar" style="background:var(--w-brand); width:34px; height:34px; font-size:13px; margin-left:0; color:var(--w-on-brand); font-weight:700; display:flex; align-items:center; justify-content:center; border-radius:50%; overflow:hidden;">
                  ${this.renderBrandAvatarHTML(!1)}
                </div>
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
              <div class="chatify-avatars-stack" id="homeAvatarsStack"></div>
              <span class="chatify-status-pill" id="homeStatusPill">
                <span class="chatify-pulse-dot away"></span>
                <span>We're away, leave a message and we'll reply by email</span>
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

          <!-- Previous conversations (shown only when the visitor has others) -->
          <div class="chatify-card chatify-card-prev" id="cardPrevConvs" style="display: none;">
            <div class="chatify-section-title">Previous conversations</div>
            <div class="chatify-prev-list" id="prevConvsList"></div>
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
              ${this.renderBrandAvatarHTML(!0)}
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
                <label>Email Address <span class="chatify-required-tag" style="color:#ef4444; font-weight:700;">*</span></label>
                <input type="email" id="chatifyInputEmail" class="chatify-input" placeholder="sarah@example.com" autocomplete="email" inputmode="email" required aria-required="true" aria-describedby="chatifyEmailError" />
                <div id="chatifyEmailError" class="chatify-field-error" role="alert" aria-live="polite" style="display:none;"></div>
              </div>
              <button class="chatify-start-btn" id="chatifyStartBtn">Start Live Conversation</button>
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

        <!-- Emoji Picker Popover (WhatsApp Style) -->
        <div id="chatifyEmojiPicker" class="chatify-emoji-popover" style="display:none;">
          <div class="chatify-emoji-header">
            <input type="text" id="chatifyEmojiSearch" class="chatify-emoji-search" placeholder="Search emojis..." />
          </div>
          <div class="chatify-emoji-categories" id="chatifyEmojiCategories"></div>
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

          <div class="chatify-faq-list" id="faqList"></div>
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
          </span>
        </button>
        <button class="chatify-nav-item" data-tab="help" id="navHelp" style="display:none;">
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
    `,this.shadow.appendChild(n),this.shadow.getElementById("homeCloseBtn")?.addEventListener("click",()=>this.toggleWindow()),this.shadow.getElementById("chatifyCloseBtn")?.addEventListener("click",()=>this.toggleWindow()),this.shadow.getElementById("helpCloseBtn")?.addEventListener("click",()=>this.toggleWindow()),this.shadow.querySelectorAll(".chatify-nav-item").forEach(b=>{b.addEventListener("click",v=>{let T=v.currentTarget.getAttribute("data-tab");this.switchTab(T)})}),this.shadow.getElementById("btnGoToMessages")?.addEventListener("click",()=>{this.switchTab("messages")}),this.shadow.getElementById("cardStartChat")?.addEventListener("click",b=>{b.target?.closest("#btnGoToMessages")||this.switchTab("messages")}),this.shadow.getElementById("btnContinueConversation")?.addEventListener("click",()=>{this.switchTab("messages")}),this.shadow.getElementById("cardOpenConv")?.addEventListener("click",b=>{b.target?.closest("#btnContinueConversation, #btnStartNewChat")||this.switchTab("messages")}),this.shadow.getElementById("btnStartNewChat")?.addEventListener("click",b=>{b.stopPropagation(),this.switchTab("messages"),setTimeout(()=>{this.shadow?.getElementById("chatifyTextarea")?.focus()},120)}),this.shadow.getElementById("btnBackToHome")?.addEventListener("click",()=>{this.switchTab("home")}),this.shadow.getElementById("chatifyPopupCloseBtn")?.addEventListener("click",b=>{b.stopPropagation(),this.dismissMessagePopup()}),this.shadow.getElementById("chatifyPopupCard")?.addEventListener("click",b=>{b.target?.closest("#chatifyPopupCloseBtn")||(this.hideMessagePopup(!1),this.open("messages"))});let a=this.shadow.getElementById("chatifyPopupInput"),o=this.shadow.getElementById("chatifyPopupSendBtn");a?.addEventListener("input",()=>{o?.classList.toggle("active",!!a.value.trim())}),a?.addEventListener("keydown",async b=>{b.key==="Enter"&&(b.preventDefault(),await this.sendPopupReply())}),o?.addEventListener("click",async b=>{b.stopPropagation(),await this.sendPopupReply()}),this.shadow.getElementById("homeSearchTrigger")?.addEventListener("click",()=>{this.switchTab("help"),setTimeout(()=>{this.shadow?.getElementById("helpSearchInput")?.focus()},100)}),this.bindFaqListeners(),this.shadow.getElementById("helpSearchInput")?.addEventListener("input",b=>{this.faqSearchQuery=b.target.value,this.renderFaqList()});let c=this.shadow.getElementById("chatifyStartBtn");c&&c.addEventListener("click",()=>this.handleStartPreChat());let h=this.shadow.getElementById("chatifyInputEmail"),d=this.shadow.getElementById("chatifyInputName"),f=b=>{b.key==="Enter"&&(b.preventDefault(),this.handleStartPreChat())};h?.addEventListener("keydown",f),d?.addEventListener("keydown",f),h?.addEventListener("blur",()=>{h.value.trim()&&this.validatePrechatEmail()}),h?.addEventListener("input",()=>{h.getAttribute("aria-invalid")==="true"&&this.validatePrechatEmail()});let u=this.shadow.getElementById("chatifySendBtn"),p=this.shadow.getElementById("chatifyTextarea"),g=this.shadow.getElementById("chatifyImageBtn"),y=this.shadow.getElementById("chatifyImageInput"),_=this.shadow.getElementById("chatifyEmojiBtn"),E=this.shadow.getElementById("chatifyPreviewRemove"),m=this.shadow.getElementById("chatifyLightboxClose"),x=this.shadow.getElementById("chatifyImageLightbox");g?.addEventListener("click",()=>{y?.click()}),y?.addEventListener("change",b=>{let v=b.target.files?.[0];v&&this.handleSelectImage(v)}),E?.addEventListener("click",()=>{this.clearPendingAttachment()}),_?.addEventListener("click",b=>{b.stopPropagation(),this.toggleEmojiPicker()}),this.renderEmojiGrid(),this.shadow.addEventListener("click",b=>{let v=b.target;!v.closest("#chatifyEmojiPicker")&&!v.closest("#chatifyEmojiBtn")&&this.closeEmojiPicker()}),p?.addEventListener("paste",b=>{let v=b.clipboardData?.items;if(v){for(let T=0;T<v.length;T++)if(v[T].type.startsWith("image/")){let C=v[T].getAsFile();if(C){b.preventDefault(),this.handleSelectImage(C);break}}}}),m?.addEventListener("click",()=>this.closeLightbox()),x?.addEventListener("click",b=>{b.target.id==="chatifyImageLightbox"&&this.closeLightbox()}),u?.addEventListener("click",()=>this.handleSendMessage()),p?.addEventListener("input",()=>{this.adjustTextareaHeight()}),p?.addEventListener("keydown",b=>{b.key==="Enter"&&!b.shiftKey?(b.preventDefault(),this.handleSendMessage()):b.key==="Enter"&&b.shiftKey&&setTimeout(()=>this.adjustTextareaHeight(),0)}),this.renderAvatarsStack(this.workspaceAgents),this.updatePresenceAndTexts(),this.presenceInterval||(this.presenceInterval=setInterval(()=>{this.updatePresenceAndTexts()},6e4))}handleSelectImage(e){if(e.size>15*1024*1024){alert("File size exceeds maximum 15MB limit.");return}if(!e.type.startsWith("image/")){alert("Please select an image file (JPEG, PNG, WEBP, GIF, etc.).");return}this.pendingAttachment?.previewUrl&&URL.revokeObjectURL(this.pendingAttachment.previewUrl);let t=URL.createObjectURL(e);this.pendingAttachment={file:e,previewUrl:t};let i=this.shadow?.getElementById("chatifyAttachmentPreview"),s=this.shadow?.getElementById("chatifyPreviewImg"),n=this.shadow?.getElementById("chatifyPreviewName"),a=this.shadow?.getElementById("chatifyPreviewSize");i&&s&&(s.src=t,n&&(n.textContent=e.name),a&&(a.textContent=`${(e.size/1024).toFixed(0)} KB \xB7 Ready to send`),i.style.display="flex")}clearPendingAttachment(){this.pendingAttachment?.previewUrl&&URL.revokeObjectURL(this.pendingAttachment.previewUrl),this.pendingAttachment=null;let e=this.shadow?.getElementById("chatifyAttachmentPreview");e&&(e.style.display="none");let t=this.shadow?.getElementById("chatifyImageInput");t&&(t.value="")}toggleEmojiPicker(){let e=this.shadow?.getElementById("chatifyEmojiPicker");if(!e)return;let t=e.style.display==="block";e.style.display=t?"none":"block"}closeEmojiPicker(){let e=this.shadow?.getElementById("chatifyEmojiPicker");e&&(e.style.display="none")}renderEmojiGrid(){let e=this.shadow?.getElementById("chatifyEmojiGrid"),t=this.shadow?.getElementById("chatifyEmojiCategories");if(!e)return;t&&t.children.length===0&&(t.innerHTML="",ct.forEach(n=>{let a=document.createElement("button");a.type="button",a.className=`chatify-emoji-cat-btn ${n.id===this.activeEmojiCategory?"active":""}`,a.textContent=n.icon,a.title=n.name,a.addEventListener("click",o=>{o.stopPropagation(),this.activeEmojiCategory=n.id,this.shadow?.querySelectorAll(".chatify-emoji-cat-btn").forEach(c=>c.classList.remove("active")),a.classList.add("active");let l=this.shadow?.getElementById("chatifyEmojiSearch");l&&(l.value=""),this.emojiSearchQuery="",this.renderEmojiGrid()}),t.appendChild(a)}),this.shadow?.getElementById("chatifyEmojiSearch")?.addEventListener("input",n=>{this.emojiSearchQuery=n.target.value.toLowerCase().trim(),this.renderEmojiGrid()})),e.innerHTML="";let i=[];if(this.emojiSearchQuery)i=Ji;else{let s=ct.find(n=>n.id===this.activeEmojiCategory);i=s?s.emojis:ct[0].emojis}i.forEach(s=>{let n=document.createElement("button");n.type="button",n.className="chatify-emoji-btn",n.textContent=s,n.addEventListener("click",a=>{a.stopPropagation(),this.insertEmoji(s)}),e.appendChild(n)})}adjustTextareaHeight(){let e=this.shadow?.getElementById("chatifyTextarea");if(!e)return;e.style.height="auto";let t=window.getComputedStyle(e),i=parseFloat(t.lineHeight)||19.6,s=parseFloat(t.paddingTop)||11,n=parseFloat(t.paddingBottom)||11,a=parseFloat(t.borderTopWidth)||1,o=parseFloat(t.borderBottomWidth)||1,l=s+n+a+o,c=Math.round(i*1+l),h=Math.round(i*5+l),d=e.scrollHeight;if(d>h)e.style.height=`${h}px`,e.style.overflowY="auto";else{let f=Math.max(c,d);e.style.height=`${f}px`,e.style.overflowY="hidden"}}insertEmoji(e){let t=this.shadow?.getElementById("chatifyTextarea");if(!t)return;let i=t.selectionStart||t.value.length,s=t.selectionEnd||t.value.length,n=t.value;t.value=n.substring(0,i)+e+n.substring(s),t.selectionStart=t.selectionEnd=i+e.length,this.adjustTextareaHeight(),t.focus(),this.closeEmojiPicker()}openLightbox(e){let t=this.shadow?.getElementById("chatifyImageLightbox"),i=this.shadow?.getElementById("chatifyLightboxImg"),s=this.shadow?.getElementById("chatifyLightboxLink");t&&i&&(i.src=e,s&&(s.href=e),t.style.display="flex")}closeLightbox(){let e=this.shadow?.getElementById("chatifyImageLightbox");e&&(e.style.display="none")}switchTab(e){e==="help"&&(this.config.showHelpTab===!1||this.faqs.length===0)&&(e="home"),this.activeTab=e;let t=this.shadow?.getElementById("tabHome"),i=this.shadow?.getElementById("tabMessages"),s=this.shadow?.getElementById("tabHelp");t&&(t.style.display=e==="home"?"flex":"none"),i&&(i.style.display=e==="messages"?"flex":"none"),s&&(s.style.display=e==="help"?"flex":"none"),this.shadow?.querySelectorAll(".chatify-nav-item").forEach(a=>{a.classList.toggle("active",a.getAttribute("data-tab")===e)});let n=this.config.workspaceId?`_${this.config.workspaceId.slice(0,8)}`:"";try{sessionStorage.setItem(`chatify_widget_tab${n}`,e)}catch{}e==="messages"&&(this.unreadCount=0,this.updateUnreadBadge(),this.markMessagesAsRead(),this.scrollToBottom(!1),this.adjustTextareaHeight(),setTimeout(()=>{this.shadow?.getElementById("chatifyTextarea")?.focus()},100))}getReplyTimeText(){return this.config.subtitle&&this.config.subtitle.trim()?this.config.subtitle.trim():"Typically replies in under 5 minutes"}checkIsOnline(){let e=this.workspaceAgents.some(n=>n.status==="online"),t=this.config.businessHours,s=!!(t&&t.enabled)&&!this.isOutsideBusinessHours(t);return!!(e||s)}updatePresenceAndTexts(){let e=this.checkIsOnline(),t=this.getReplyTimeText(),i="We're away, leave a message and we'll reply by email",s=this.shadow?.getElementById("homeStatusPill");s&&(e?(s.title="Online",s.innerHTML=`<span class="chatify-pulse-dot online"></span> <span>${t}</span>`):(s.title=i,s.innerHTML=`<span class="chatify-pulse-dot away"></span> <span>${i}</span>`));let n=this.shadow?.getElementById("homeCardSub");n&&(n.textContent=e?"Ask us anything, or share your feedback.":i);let a=this.shadow?.querySelector("#btnGoToMessages span");a&&(a.textContent=e?"Send us a message":"Leave us a message");let o=this.shadow?.getElementById("chatifyHeaderSubtitle");o&&(o.textContent=e?t:i);let l=this.shadow?.querySelector("#chatifyHeaderAvatar .chatify-online-dot");l&&(l.style.display=e?"block":"none");let c=this.shadow?.querySelector(".chatify-popup-status-dot");c&&(c.style.display=e?"block":"none")}renderAvatarsStack(e){let t=this.shadow?.getElementById("homeAvatarsStack");if(!t)return;t.innerHTML="";let i=["linear-gradient(135deg, #3b82f6, #1d4ed8)","linear-gradient(135deg, #8b5cf6, #6d28d9)","linear-gradient(135deg, #10b981, #047857)","linear-gradient(135deg, #f59e0b, #d97706)","linear-gradient(135deg, #ec4899, #be185d)"],s=e&&e.length>0?e.slice(0,3):[];if(s.length===0){let n=document.createElement("div");if(n.className="chatify-mini-avatar",n.style.background=i[0],this.config.logoUrl)n.innerHTML=`<img src="${this.config.logoUrl}" alt="Support" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" />`;else{let a=this.getSenderInitials(this.config.businessName||this.config.title||"Support");n.textContent=a}t.appendChild(n);return}s.forEach((n,a)=>{let o=document.createElement("div");if(o.className="chatify-mini-avatar",o.style.background=i[a%i.length],o.title=n.name||"Agent",n.avatar_url){let l=document.createElement("img");l.src=n.avatar_url,l.alt=n.name||"Agent",l.style.cssText="width:100%;height:100%;object-fit:cover;border-radius:inherit;",l.onerror=()=>{o.innerHTML="",o.textContent=this.getSenderInitials(n.name||"Agent")},o.appendChild(l)}else o.textContent=this.getSenderInitials(n.name||"Agent");t.appendChild(o)})}subscribeToAgentsRealtime(){this.config.workspaceId&&this.supabase.channel(`chatify-agents-${this.config.workspaceId}`).on("postgres_changes",{event:"*",schema:"public",table:"agents",filter:`workspace_id=eq.${this.config.workspaceId}`},async()=>{try{let{data:e}=await this.supabase.from("agents").select("id, name, avatar_url, status").eq("workspace_id",this.config.workspaceId);e&&(this.workspaceAgents=e,this.renderAvatarsStack(this.workspaceAgents),this.updatePresenceAndTexts())}catch(e){console.warn("[Zen-try] Error updating agent presence:",e)}}).subscribe()}updateThemeAndTexts(){let e=this.shadow?.getElementById("chatify-theme-style");e&&(e.textContent=this.generateCSS());let t=this.shadow?.getElementById("chatifyHeaderTitle");t&&(t.textContent=this.config.title);let i=this.shadow?.getElementById("chatifyHeaderSubtitle");i&&(i.textContent=this.config.subtitle);let s=this.shadow?.getElementById("chatifyPopupTitle");if(s){let m=this.config.businessName||this.config.title||"Trader Care Desk";s.textContent=m;let x=this.shadow?.getElementById("chatifyPopupAvatar");x&&(this.config.logoUrl?x.innerHTML=`<img src="${this.config.logoUrl}" alt="Logo" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.parentElement.textContent='${this.getSenderInitials(m)}'" />`:x.querySelector("img")||(x.textContent=this.getSenderInitials(m)))}let n=this.shadow?.getElementById("chatifyIconOpen");n&&(n.innerHTML=this.renderLauncherIconHTML());let a=this.shadow?.getElementById("chatifyHeaderAvatar");a&&(a.innerHTML=this.renderBrandAvatarHTML(!0));let o=this.shadow?.getElementById("homeBrandAvatar");o&&(o.innerHTML=this.renderBrandAvatarHTML(!1));let l=this.shadow?.getElementById("openConvAvatar");l&&(l.innerHTML=this.renderBrandAvatarHTML(!1));let c=this.shadow?.getElementById("homeGreetingTitle");if(c&&this.config.title){let m=this.config.title.replace(/^Welcome to\s+/i,"").replace(/Support!?/i,"").replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}️]+\s*$/u,"").trim();c.textContent=m?`Hello from ${m} \u{1F44B}`:"Hello there \u{1F44B}"}let h=this.shadow?.getElementById("homeGreetingSub");h&&this.config.subtitle&&(h.textContent=this.config.subtitle);let d=this.shadow?.querySelector("#navHelp span");d&&this.config.helpTabLabel&&(d.textContent=this.config.helpTabLabel);let f=this.shadow?.querySelector("#tabHelp .chatify-header-text h3");f&&this.config.helpTabLabel&&(f.textContent=this.config.helpTabLabel);let u=this.shadow?.querySelector("#cardHelpSearch .chatify-section-title");u&&this.config.helpTabLabel&&(u.textContent=this.config.helpTabLabel);let p=this.shadow?.querySelector("#homeSearchTrigger span");p&&this.config.helpTabLabel&&(p.textContent=`\u{1F50D} Search for ${this.config.helpTabLabel.toLowerCase()} articles...`);let g=this.shadow?.getElementById("navHelp"),y=this.shadow?.getElementById("cardHelpSearch"),_=this.shadow?.getElementById("tabHelp"),E=this.faqs.length>0;this.config.showHelpTab===!1||!E?(g&&(g.style.display="none"),y&&(y.style.display="none"),_&&(_.style.display="none"),this.activeTab==="help"&&this.switchTab("home")):(g&&(g.style.display="flex"),y&&(y.style.display="block")),this.renderAvatarsStack(this.workspaceAgents),this.updatePresenceAndTexts()}rgb(e){let t=(e||"").trim().replace("#","");return t.length===3&&(t=t.split("").map(i=>i+i).join("")),/^[0-9a-fA-F]{6}$/.test(t)||(t="2e5bff"),[parseInt(t.slice(0,2),16),parseInt(t.slice(2,4),16),parseInt(t.slice(4,6),16)]}luminance(e){let[t,i,s]=this.rgb(e).map(n=>{let a=n/255;return a<=.03928?a/12.92:Math.pow((a+.055)/1.055,2.4)});return .2126*t+.7152*i+.0722*s}shade(e,t){let[i,s,n]=this.rgb(e),a=t>0?255:0,o=Math.abs(t),l=c=>Math.round(c+(a-c)*o);return`rgb(${l(i)}, ${l(s)}, ${l(n)})`}alpha(e,t){let[i,s,n]=this.rgb(e);return`rgba(${i}, ${s}, ${n}, ${t})`}generateCSS(){let e=this.config.primaryColor||"#2e5bff",t=this.luminance(e)>.62?"#0b0b0f":"#ffffff",i=this.shade(e,-.34),s=this.config.position==="bottom-left",n=typeof this.config.offsetBottom=="number"?this.config.offsetBottom:20,a=typeof this.config.offsetSide=="number"?this.config.offsetSide:20,o=typeof this.config.zIndex=="number"?this.config.zIndex:2147483e3,l=n+66,c=n+68;return`
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
        ${s?`left: ${a}px;`:`right: ${a}px;`}
        bottom: ${n}px;
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
        z-index: ${o};
        transition: transform .28s var(--w-spring), box-shadow .2s var(--w-ease);
      }

      .chatify-launcher:hover {
        transform: scale(1.07) translateY(-1px);
        box-shadow: 0 16px 38px var(--w-brand-a28), 0 6px 14px rgba(11,11,15,.22);
      }

      .chatify-launcher:active { transform: scale(.95); }

      .chatify-launcher.is-loading {
        background: #e7e9ef;
        box-shadow: 0 6px 18px rgba(11,11,15,.10);
        overflow: hidden;
        animation: w-launcher-in .3s var(--w-ease) both;
      }
      .chatify-launcher.is-loading > * { opacity: 0; }
      .chatify-launcher.is-loading::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: linear-gradient(100deg, transparent 20%, rgba(255,255,255,.75) 50%, transparent 80%);
        transform: translateX(-100%);
        animation: w-launcher-shimmer 1.4s infinite;
      }
      .chatify-launcher-icon,
      .chatify-launcher svg { transition: opacity .2s var(--w-ease); }
      @keyframes w-launcher-shimmer { to { transform: translateX(100%); } }
      @keyframes w-launcher-in { from { opacity: 0; transform: scale(.85); } to { opacity: 1; transform: none; } }

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

      .chatify-launcher-icon.chatify-custom-logo {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        object-fit: cover;
        background: #ffffff;
        padding: 2px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.22);
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

      /* \u2500\u2500 Unread Message Popup (Intercom-style Preview) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

      .chatify-message-popup {
        position: fixed;
        ${s?`left: ${a}px;`:`right: ${a}px;`}
        bottom: ${l}px;
        width: 350px;
        max-width: calc(100vw - 40px);
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: ${o-5};
        pointer-events: auto;
        animation: chatifyPopupSlideIn 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }

      @keyframes chatifyPopupSlideIn {
        0% {
          opacity: 0;
          transform: translateY(16px) scale(0.96);
        }
        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .chatify-message-popup.closing {
        animation: chatifyPopupSlideOut 0.2s cubic-bezier(0.4, 0, 1, 1) forwards;
      }

      @keyframes chatifyPopupSlideOut {
        0% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        100% {
          opacity: 0;
          transform: translateY(12px) scale(0.96);
        }
      }

      /* Card 1: Top Message Card */
      .chatify-popup-card {
        background: #ffffff;
        border-radius: 18px;
        padding: 14px 16px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
        display: flex;
        align-items: flex-start;
        gap: 12px;
        cursor: pointer;
        transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s cubic-bezier(0.16, 1, 0.3, 1);
        border: 1px solid rgba(0, 0, 0, 0.05);
        color: #111827;
      }

      .chatify-popup-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 14px 34px rgba(0, 0, 0, 0.16), 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      .chatify-popup-avatar-wrap {
        position: relative;
        width: 44px;
        height: 44px;
        flex-shrink: 0;
      }

      .chatify-popup-avatar {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: #5c5be5;
        color: #ffffff;
        font-weight: 700;
        font-size: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        letter-spacing: 0.5px;
        box-shadow: 0 2px 8px rgba(92, 91, 229, 0.32);
        overflow: hidden;
      }

      .chatify-popup-avatar img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .chatify-popup-status-dot {
        position: absolute;
        bottom: 0px;
        right: 0px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #22c55e;
        border: 2.5px solid #ffffff;
      }

      .chatify-popup-content {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
      }

      .chatify-popup-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 3px;
      }

      .chatify-popup-title {
        font-size: 13.5px;
        font-weight: 600;
        color: #475569;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .chatify-popup-close {
        background: transparent;
        border: none;
        color: #9ca3af;
        cursor: pointer;
        padding: 2px;
        margin-right: -4px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        transition: color 0.15s, background-color 0.15s;
      }

      .chatify-popup-close:hover {
        color: #374151;
        background-color: #f1f5f9;
      }

      .chatify-popup-message {
        font-size: 15px;
        font-weight: 500;
        color: #111827;
        line-height: 1.38;
        word-break: break-word;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      /* Card 2: Bottom Reply Bar */
      .chatify-popup-reply-bar {
        background: #ffffff;
        border-radius: 9999px;
        padding: 5px 6px 5px 18px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.10), 0 2px 6px rgba(0, 0, 0, 0.05);
        border: 1px solid rgba(0, 0, 0, 0.05);
        display: flex;
        align-items: center;
        gap: 8px;
        transition: box-shadow 0.2s, border-color 0.2s;
      }

      .chatify-popup-reply-bar:focus-within {
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.14), 0 0 0 2px var(--w-brand, #5c5be5);
        border-color: transparent;
      }

      .chatify-popup-input {
        flex: 1;
        border: none;
        outline: none;
        background: transparent;
        font-size: 14px;
        color: #111827;
        min-width: 0;
        padding: 7px 0;
        font-family: inherit;
      }

      .chatify-popup-input::placeholder {
        color: #9ca3af;
      }

      .chatify-popup-send {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: none;
        background: #e2e8f0;
        color: #64748b;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        flex-shrink: 0;
        transition: background-color 0.2s, color 0.2s, transform 0.15s;
      }

      .chatify-popup-send.active {
        background: var(--w-brand, #5c5be5);
        color: #ffffff;
      }

      .chatify-popup-send:hover {
        transform: scale(1.05);
      }

      .chatify-popup-send:active {
        transform: scale(0.95);
      }

      /* \u2500\u2500 Window \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */

      .chatify-window {
        position: fixed;
        ${s?`left: ${a}px;`:`right: ${a}px;`}
        bottom: ${c}px;
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
        z-index: ${o};
        animation: w-window-in .34s var(--w-ease) both;
      }

      .chatify-avatar-initial {
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        text-transform: uppercase;
        border-radius: inherit;
        background: var(--w-brand);
        color: var(--w-on-brand);
        user-select: none;
      }

      .chatify-system-line {
        align-self: center;
        text-align: center;
        max-width: 88%;
        margin: 8px auto;
        padding: 8px 12px;
        font-size: 12px;
        line-height: 1.5;
        color: var(--w-ink-2);
        background: var(--w-surface-2);
        border: 1px solid var(--w-line);
        border-radius: 12px;
      }

      .chatify-closed-notice {
        align-self: center;
        margin: 14px auto 6px;
        font-size: 12.5px;
        font-weight: 600;
        color: var(--w-ink-2);
        text-align: center;
      }

      .chatify-new-conversation-btn {
        align-self: center;
        margin: 10px auto 14px;
        padding: 10px 18px;
        border: none;
        border-radius: 999px;
        background: var(--w-brand);
        color: var(--w-on-brand);
        font-size: 13px;
        font-weight: 600;
      }

      .chatify-typing {
        display: inline-flex !important;
        align-items: center;
        gap: 4px;
        padding: 12px 14px !important;
      }

      .chatify-typing span {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--w-ink-3);
        animation: w-typing 1.2s infinite ease-in-out;
      }

      .chatify-typing span:nth-child(2) { animation-delay: .15s; }
      .chatify-typing span:nth-child(3) { animation-delay: .3s; }

      @keyframes w-typing {
        0%, 60%, 100% { transform: translateY(0); opacity: .4; }
        30% { transform: translateY(-4px); opacity: 1; }
      }

      .chatify-prev-list { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }

      .chatify-prev-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        width: 100%;
        padding: 10px 12px;
        text-align: left;
        background: var(--w-surface-2);
        border: 1px solid var(--w-line);
        border-radius: 12px;
        color: var(--w-ink);
      }

      .chatify-prev-item:hover { background: var(--w-surface-3); }
      .chatify-prev-text { display: flex; flex-direction: column; min-width: 0; gap: 2px; }
      .chatify-prev-snippet { font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .chatify-prev-meta { font-size: 11.5px; color: var(--w-ink-3); }
      .chatify-prev-chevron { font-size: 18px; color: var(--w-ink-3); }

      @media (max-width: 480px) {
        .chatify-window {
          inset: 0 !important;
          left: 0 !important;
          right: 0 !important;
          top: var(--w-vv-top, 0px) !important;
          bottom: auto !important;
          width: 100vw !important;
          max-width: 100vw !important;
          height: 100% !important;
          height: var(--w-vvh, 100dvh) !important;
          max-height: var(--w-vvh, 100dvh) !important;
          border-radius: 0 !important;
          border: none !important;
          box-shadow: none !important;
          z-index: ${o+1} !important;
        }

        .chatify-launcher.widget-is-open {
          display: none !important;
        }

        .chatify-message-popup {
          left: 12px !important;
          right: 12px !important;
          width: auto !important;
          max-width: calc(100vw - 24px) !important;
          bottom: ${n+64}px !important;
        }

        /* 16px stops iOS from zooming the page when a field is focused. */
        .chatify-textarea,
        .chatify-input {
          font-size: 16px !important;
        }

        .chatify-messages,
        .chatify-body {
          overscroll-behavior: contain;
        }

        .chatify-close-btn,
        .chatify-icon-btn#homeCloseBtn {
          width: 44px !important;
          height: 44px !important;
          min-width: 44px !important;
          min-height: 44px !important;
          border-radius: 50% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          cursor: pointer !important;
          touch-action: manipulation !important;
        }

        .chatify-close-btn {
          background: var(--w-surface-2) !important;
          color: var(--w-ink) !important;
          border: 1px solid var(--w-line-2) !important;
        }

        .chatify-icon-btn#homeCloseBtn {
          background: rgba(255, 255, 255, 0.25) !important;
          color: #ffffff !important;
          border: 1px solid rgba(255, 255, 255, 0.35) !important;
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
        max-width: calc(100% - 70px);
      }

      .chatify-status-pill span:not(.chatify-pulse-dot) {
        overflow: hidden;
        text-overflow: ellipsis;
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

      .chatify-input.chatify-input-invalid,
      .chatify-input.chatify-input-invalid:focus {
        border-color: #ef4444;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, .14);
      }

      .chatify-field-error {
        margin-top: 6px;
        font-size: 12px;
        line-height: 1.4;
        font-weight: 500;
        color: #dc2626;
      }

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

      /* Formatted replies: structure comes from the markup, not whitespace. */
      .chatify-msg-rich { white-space: normal; }
      .chatify-msg-rich > :first-child { margin-top: 0; }
      .chatify-msg-rich > :last-child { margin-bottom: 0; }
      .chatify-msg-rich p { margin: 0 0 8px; }
      .chatify-msg-rich h3, .chatify-msg-rich h4, .chatify-msg-rich h5, .chatify-msg-rich h6 {
        margin: 12px 0 6px;
        font-size: 14px;
        line-height: 1.35;
        font-weight: 700;
        letter-spacing: -0.01em;
        color: var(--w-ink);
      }
      .chatify-msg-rich h5, .chatify-msg-rich h6 { font-size: 13px; }
      .chatify-msg-rich ul, .chatify-msg-rich ol { margin: 4px 0 8px; padding-left: 18px; }
      .chatify-msg-rich li { margin: 0 0 4px; }
      .chatify-msg-rich li::marker { color: var(--w-brand); }
      .chatify-msg-rich strong { font-weight: 650; color: var(--w-ink); }
      .chatify-msg-rich a { color: var(--w-brand); text-decoration: underline; text-underline-offset: 2px; word-break: break-all; }
      .chatify-msg-rich hr { border: 0; border-top: 1px solid var(--w-line); margin: 10px 0; }
      .chatify-msg-rich code { font-size: 12px; padding: 1px 4px; border-radius: 4px; background: var(--w-surface-2, rgba(15,23,42,.06)); }

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
        box-sizing: border-box;
        height: 44px;
        min-height: 44px;
        max-height: 122px;
        padding: 11px 13px;
        border-radius: var(--w-r-md);
        border: 1px solid var(--w-line-2);
        background: var(--w-surface-2);
        color: var(--w-ink);
        font-size: 13.5px;
        line-height: 1.45;
        resize: none;
        outline: none;
        overflow-y: hidden;
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
        z-index: 35;
        background: var(--w-surface);
        border: 1px solid var(--w-line);
        border-radius: 14px;
        padding: 8px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.18);
        width: 295px;
        box-sizing: border-box;
        animation: chatifyFadeIn .15s var(--w-ease);
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .chatify-emoji-header {
        width: 100%;
      }

      .chatify-emoji-search {
        width: 100%;
        box-sizing: border-box;
        padding: 6px 10px;
        font-size: 12.5px;
        border: 1px solid var(--w-line);
        border-radius: 8px;
        background: var(--w-surface-2);
        color: var(--w-ink);
        outline: none;
      }

      .chatify-emoji-search:focus {
        border-color: var(--w-brand);
      }

      .chatify-emoji-categories {
        display: flex;
        align-items: center;
        gap: 2px;
        padding-bottom: 4px;
        border-bottom: 1px solid var(--w-line);
        overflow-x: auto;
      }

      .chatify-emoji-cat-btn {
        background: transparent;
        border: none;
        border-radius: 6px;
        padding: 4px 6px;
        font-size: 15px;
        cursor: pointer;
        opacity: 0.65;
        transition: opacity .15s, background .15s;
        line-height: 1;
      }

      .chatify-emoji-cat-btn:hover {
        opacity: 1;
        background: var(--w-surface-2);
      }

      .chatify-emoji-cat-btn.active {
        opacity: 1;
        background: var(--w-surface-2);
        box-shadow: inset 0 -2px 0 var(--w-brand);
      }

      .chatify-emoji-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;
        max-height: 190px;
        overflow-y: auto;
        padding-right: 2px;
      }

      .chatify-emoji-btn {
        font-size: 19px;
        padding: 5px 2px;
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
    `}validatePrechatEmail(){let e=this.shadow?.getElementById("chatifyInputEmail"),t=this.shadow?.getElementById("chatifyEmailError"),i=(e?.value||"").trim(),n=i?/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(i)?"":"That doesn't look like a valid email \u2014 try name@company.com.":"Please enter your email so we can follow up.";return e&&(e.classList.toggle("chatify-input-invalid",!!n),e.setAttribute("aria-invalid",n?"true":"false")),t&&(t.textContent=n,t.style.display=n?"block":"none"),!n}async handleStartPreChat(){let e=this.shadow?.getElementById("chatifyInputName"),t=this.shadow?.getElementById("chatifyInputEmail"),i=(t?.value||"").trim();if(!this.validatePrechatEmail()){t?.focus();return}this.visitorName=e?.value.trim()||"",this.visitorEmail=i;let s=this.config.workspaceId?`_${this.config.workspaceId.slice(0,8)}`:"";this.visitorName&&(localStorage.setItem(`zentry_visitor_name${s}`,this.visitorName),localStorage.setItem(`chatify_visitor_name${s}`,this.visitorName)),localStorage.setItem(`zentry_visitor_email${s}`,this.visitorEmail),localStorage.setItem(`chatify_visitor_email${s}`,this.visitorEmail),await this.supabase.rpc("fn_upsert_visitor",{p_id:this.visitorId,p_name:this.visitorName||null,p_email:this.visitorEmail||null,p_current_url:window.location.href,p_user_agent:navigator.userAgent,p_workspace_id:this.config.workspaceId||null}),this.isPreChatCompleted=!0,this.shadow?.getElementById("chatifyPreChat")?.remove();let n=this.shadow?.getElementById("chatifyFooter");n&&(n.style.display="flex");let a=await this.ensureConversation(),{data:o}=await this.supabase.from("messages").select("id").eq("conversation_id",a).limit(1);if(!o||o.length===0){let l=(this.config.businessName||this.config.title||"our company").replace(/^Welcome to\s+/i,"").replace(/\s*Support\s*$/i,"").replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}️]+\s*$/u,"").replace(/^the\s+/i,"").trim()||this.config.businessName||this.config.title||"our company",c=this.config.welcomeText?.trim(),h=c?c.charAt(0).toUpperCase()+c.slice(1):`Welcome to ${l}`,{data:d}=await this.supabase.from("messages").insert({conversation_id:a,sender_type:"agent",content:h,is_internal:!1}).select().single();d&&this.messages.push(d)}this.renderMessages()}async handleSendMessage(){let e=this.shadow?.getElementById("chatifyTextarea"),t=this.shadow?.getElementById("chatifySendBtn");if(!e)return;let i=e.value.trim();if(!i&&!this.pendingAttachment)return;let s=null;if(this.pendingAttachment){t&&(t.disabled=!0,t.innerHTML='<span style="width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;display:inline-block;animation:chatifySpin 0.8s linear infinite;"></span>');try{let n=new FormData;n.append("file",this.pendingAttachment.file);let a=this.config.apiUrl||"",o=await fetch(`${a}/api/upload`,{method:"POST",body:n});if(!o.ok){let c=await o.json().catch(()=>({}));throw new Error(c.error||"Failed to upload image to Cloudinary")}s=(await o.json()).url}catch(n){alert(`Image upload error: ${n.message}`),t&&(t.disabled=!1,t.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>');return}finally{t&&(t.disabled=!1,t.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>')}}e.value="",this.adjustTextareaHeight(),this.clearPendingAttachment(),await this.sendMessage(i,s||void 0)}renderMessages(){let e=this.shadow?.getElementById("chatifyBody");if(!e||!this.isPreChatCompleted)return;if(e.innerHTML="",this.messages.length===0){e.innerHTML=`
        <div style="text-align:center; margin:auto 0; padding:0 18px;">
          <p style="color:var(--w-ink); font-size:15px; font-weight:600; letter-spacing:-.012em; margin-bottom:5px;">How can we help?</p>
          <p style="color:var(--w-ink-2); font-size:13px; line-height:1.55;">Send a message below and someone from our team will pick it up.</p>
        </div>
      `,this.renderRecentConversation();return}this.messages.forEach(i=>{if(i.is_internal)return;if(i.metadata?.system_event==="handover"){let y=document.createElement("div");y.className="chatify-system-line";let _=(this.visitorEmail||"").trim();y.innerHTML=this.escapeHTML("We've passed this to our team. We usually reply within 10\u201315 minutes.")+(_?" "+this.escapeHTML(`We'll also email you at ${_}.`):""),e.appendChild(y);return}let s=i.sender_type==="visitor",n=new Date(i.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),a=document.createElement("div");a.className="chatify-message-row";let o=document.createElement("div");o.className=s?"chatify-msg-visitor":"chatify-msg-agent";let l=s?this.renderTicks(i):"",c=i.reply_to_message_id&&i.sender_type!=="ai"?this.messages.find(y=>y.id===i.reply_to_message_id):null,h=c?`<div class="chatify-msg-quote"><span class="chatify-msg-quote-who">${c.sender_type==="visitor"?"You":"Support"}</span><span class="chatify-msg-quote-text">${this.escapeHTML(c.content.length>120?`${c.content.slice(0,120)}\u2026`:c.content)}</span></div>`:"",d="";i.attachment_url&&(this.isImageAttachment(i.attachment_url)?d=`<div class="chatify-msg-attachment"><img src="${this.escapeHTML(i.attachment_url)}" alt="Attachment" class="chatify-msg-img" /></div>`:d=`<div class="chatify-msg-attachment"><a href="${this.escapeHTML(i.attachment_url)}" target="_blank" rel="noopener noreferrer" class="chatify-msg-doc">\u{1F4C4} <span>View Document</span></a></div>`);let u=!!i.metadata?.is_edited?'<span style="font-size:10px;font-style:italic;opacity:0.75;margin-left:4px;">(edited)</span>':"",p=!s&&i.metadata?.translation?.translated_text?i.metadata.translation.translated_text:!s&&i.metadata?.translated_text?i.metadata.translated_text:i.content;o.innerHTML=h+d+(p?s?`<div class="chatify-msg-text">${this.escapeHTML(p)}</div>`:`<div class="chatify-msg-text chatify-msg-rich">${this.formatChatMarkdown(p)}</div>`:"")+`<div class="chatify-msg-time">${n}${u}${l}</div>`;let g=o.querySelector(".chatify-msg-img");g&&i.attachment_url&&g.addEventListener("click",()=>{this.openLightbox(i.attachment_url)}),a.appendChild(o),e.appendChild(a)});let t=this.conversationStatus==="closed";if(t){let i=document.createElement("div");i.className="chatify-closed-notice",i.textContent="This conversation was closed",e.appendChild(i)}if(this.conversationStatus==="closed"&&!this.csatRated){let i=document.createElement("div");i.className="chatify-csat-box",i.innerHTML=`
        <div class="chatify-csat-title">How was your conversation?</div>
        <div class="chatify-csat-sub">Please rate the support you received today:</div>
        <div class="chatify-csat-emojis">
          <button class="chatify-csat-btn" data-val="1" title="Terrible">\u{1F621}</button>
          <button class="chatify-csat-btn" data-val="2" title="Bad">\u{1F641}</button>
          <button class="chatify-csat-btn" data-val="3" title="Okay">\u{1F610}</button>
          <button class="chatify-csat-btn" data-val="4" title="Good">\u{1F642}</button>
          <button class="chatify-csat-btn" data-val="5" title="Amazing!">\u{1F929}</button>
        </div>
      `,i.querySelectorAll(".chatify-csat-btn").forEach(s=>{s.addEventListener("click",n=>{let a=parseInt(n.currentTarget.getAttribute("data-val")||"5",10);this.submitCSAT(a)})}),e.appendChild(i)}else if(this.csatRated){let i=document.createElement("div");i.style.cssText="text-align:center; padding:12px; font-size:12.5px; color:var(--w-success); font-weight:600;",i.textContent="\u2713 Thank you for rating our support!",e.appendChild(i)}if(t){let i=document.createElement("button");i.type="button",i.className="chatify-new-conversation-btn",i.textContent="Start a new conversation",i.addEventListener("click",()=>this.startNewConversation()),e.appendChild(i)}if(this.botTyping||this.agentTyping){let i=document.createElement("div");i.className="chatify-message-row",i.innerHTML='<div class="chatify-msg-agent chatify-typing" aria-label="Typing"><span></span><span></span><span></span></div>',e.appendChild(i)}e.scrollTop=e.scrollHeight,this.renderRecentConversation()}renderTicks(e){let t='<path d="M1 5.2 3.4 7.6 9 2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',i='<path d="M1 5.2 3.4 7.6 9 2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 5.2 7.9 7.6 13.5 2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>';return e.pending?'<span class="chatify-tick" title="Sending"><svg viewBox="0 0 14 10" width="15" height="11"><circle cx="5" cy="5" r="3.6" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M5 3v2.2l1.5.9" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg></span>':e.read_at?'<span class="chatify-tick chatify-tick-read" title="Read"><svg viewBox="0 0 14 10" width="15" height="11">'+i+"</svg></span>":e.delivered_at?'<span class="chatify-tick" title="Delivered"><svg viewBox="0 0 14 10" width="15" height="11">'+i+"</svg></span>":'<span class="chatify-tick" title="Sent"><svg viewBox="0 0 14 10" width="15" height="11">'+t+"</svg></span>"}escapeHTML(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}toggleWindow(){this.isOpen=!this.isOpen;let e=this.config.workspaceId?`_${this.config.workspaceId.slice(0,8)}`:"";try{sessionStorage.setItem(`zentry_widget_open${e}`,this.isOpen?"1":"0"),sessionStorage.setItem(`chatify_widget_open${e}`,this.isOpen?"1":"0")}catch{}let t=this.shadow?.getElementById("chatifyWindow"),i=this.shadow?.getElementById("chatifyIconOpen"),s=this.shadow?.getElementById("chatifyIconClose"),n=this.shadow?.getElementById("chatifyLauncherBtn");n&&n.classList.toggle("widget-is-open",this.isOpen),this.container&&this.container.classList.toggle("widget-is-open",this.isOpen),t&&i&&s&&(this.isOpen?(this.hideMessagePopup(!1),t.style.display="flex",this.loadPreviousConversations(),i.style.display="none",s.style.display="block",this.activeTab==="messages"?(this.unreadCount=0,this.updateUnreadBadge(),this.markMessagesAsRead(),this.scrollToBottom(!1),this.adjustTextareaHeight(),setTimeout(()=>{this.shadow?.getElementById("chatifyTextarea")?.focus()},100)):this.updateUnreadBadge()):(t.style.display="none",i.style.display="flex",s.style.display="none",this.closeEmojiPicker(),this.updateUnreadBadge()))}updateUnreadBadge(){let e=this.shadow?.getElementById("chatifyBadge"),t=this.shadow?.getElementById("navMsgBadge"),i=this.shadow?.getElementById("homeCardUnreadPill"),s=this.shadow?.getElementById("homeCardCtaBadge"),n=this.shadow?.getElementById("homeCardTitle");if(this.shadow?.getElementById("chatifyLauncherBtn")?.classList.toggle("has-unread",this.unreadCount>0),this.unreadCount>0){let o=this.unreadCount>9?"9+":this.unreadCount.toString();e&&(e.textContent=o,e.style.display="flex"),t&&(t.textContent=o,t.style.display="flex"),i&&(i.textContent=`${this.unreadCount} new ${this.unreadCount===1?"message":"messages"}`,i.style.display="inline-flex"),s&&(s.textContent=o,s.style.display="inline-flex"),n&&(n.textContent=this.unreadCount===1?"You have 1 new reply":`You have ${this.unreadCount} new replies`)}else e&&(e.style.display="none"),t&&(t.style.display="none"),i&&(i.style.display="none"),s&&(s.style.display="none"),n&&(n.textContent="Chat with us");this.renderRecentConversation()}formatRelativeTime(e){let i=Math.floor((new Date().getTime()-e.getTime())/1e3);if(i<60)return"Just now";let s=Math.floor(i/60);if(s<60)return`${s}m ago`;let n=Math.floor(s/60);if(n<24)return`${n}h ago`;let a=Math.floor(n/24);return a===1?"Yesterday":a<7?`${a}d ago`:e.toLocaleDateString([],{month:"short",day:"numeric"})}renderRecentConversation(){let e=this.shadow?.getElementById("cardOpenConv"),t=this.shadow?.getElementById("cardStartChat"),i=this.shadow?.getElementById("openConvSnippet"),s=this.shadow?.getElementById("openConvSender"),n=this.shadow?.getElementById("openConvTime"),a=this.shadow?.getElementById("openConvUnreadPill"),o=this.shadow?.getElementById("openConvCtaBadge"),l=!!(this.messages&&this.messages.length>0);if(!this.conversationId||!l){e&&(e.style.display="none"),t&&(t.style.display="block");return}e&&(e.style.display="block"),t&&(t.style.display="none");let c=[...this.messages].reverse().find(h=>!h.is_internal);if(c){let h=(c.content||"").replace(/^#{1,6}\s+/gm,"").replace(/^\s*[-*•]\s+/gm,"").replace(/\*\*|__|`/g,"").replace(/\s+/g," ").trim();c.attachment_url&&(h=h?`\u{1F4F7} ${h}`:"\u{1F4F7} Sent a picture"),i&&(i.textContent=h||"Active conversation"),s&&(c.sender_type==="visitor"?s.textContent="You":c.sender_type==="ai"?s.textContent="AI Assistant":s.textContent=this.config.title||"Support Team"),n&&c.created_at&&(n.textContent=this.formatRelativeTime(new Date(c.created_at)))}this.unreadCount>0?(a&&(a.textContent=`${this.unreadCount} new`,a.style.display="inline-flex"),o&&(o.textContent=this.unreadCount>9?"9+":this.unreadCount.toString(),o.style.display="inline-flex")):(a&&(a.style.display="none"),o&&(o.style.display="none"))}scrollToBottom(e=!1){let t=this.shadow?.getElementById("chatifyBody");if(!t)return;let i=()=>{t.scrollTop=t.scrollHeight;let n=t.lastElementChild;n&&n.scrollIntoView({behavior:e?"smooth":"auto",block:"end"})};i(),requestAnimationFrame(()=>i()),setTimeout(i,50),setTimeout(i,200),t.querySelectorAll("img").forEach(n=>{n.complete||(n.addEventListener("load",()=>i(),{once:!0}),n.addEventListener("error",()=>i(),{once:!0}))})}open(e){this.hideMessagePopup(!1),this.isOpen||this.toggleWindow(),e&&this.switchTab(e),this.activeTab==="messages"&&this.scrollToBottom(!1)}close(){this.isOpen&&this.toggleWindow()}toggle(){this.toggleWindow()}openHelp(){if(this.config.showHelpTab===!1||this.faqs.length===0){this.open("home");return}this.open("help"),setTimeout(()=>{this.shadow?.getElementById("helpSearchInput")?.focus()},120)}openMessages(){this.open("messages")}getIsOpen(){return this.isOpen}getBrandInitial(){return((this.config.businessName||this.config.title||"Support").replace(/^Welcome to\s+/i,"").replace(/\s*Support\s*$/i,"").replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}️]+\s*$/u,"").replace(/^the\s+/i,"").trim().charAt(0)||"S").toUpperCase()}renderBrandAvatarHTML(e=!1){let t=this.getBrandInitial(),i=e?'<span class="chatify-online-dot"></span>':"";return this.config.logoUrl?`
        <img src="${this.config.logoUrl}" alt="Logo" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" onerror="this.style.display='none';if(this.nextElementSibling){this.nextElementSibling.style.display='flex';}" />
        <span class="chatify-avatar-initial" style="display:none;width:100%;height:100%;border-radius:inherit;background:var(--w-brand);color:var(--w-on-brand);align-items:center;justify-content:center;font-weight:700;font-size:inherit;">${t}</span>
        ${i}
      `:`
      <span class="chatify-avatar-initial" style="display:flex;width:100%;height:100%;border-radius:inherit;background:var(--w-brand);color:var(--w-on-brand);align-items:center;justify-content:center;font-weight:700;font-size:inherit;">${t}</span>
      ${i}
    `}hasHostModalOrOverlay(){if(typeof document>"u")return!1;try{let e=document.querySelectorAll('dialog[open], [role="dialog"], [role="alertdialog"], [aria-modal="true"]');for(let s=0;s<e.length;s++){let n=e[s];if(this.container&&(n===this.container||this.container.contains(n)))continue;let a=window.getComputedStyle(n);if(a.display!=="none"&&a.visibility!=="hidden"&&a.opacity!=="0"){let o=n.getBoundingClientRect();if(o.width>0&&o.height>0)return!0}}let t=window.innerWidth||document.documentElement.clientWidth||0,i=window.innerHeight||document.documentElement.clientHeight||0;if(t>0&&i>0){let s=document.querySelectorAll('div, section, aside, [class*="modal"], [class*="overlay"], [class*="backdrop"]');for(let n=0;n<s.length;n++){let a=s[n];if(this.container&&(a===this.container||this.container.contains(a)))continue;let o=window.getComputedStyle(a);if((o.position==="fixed"||o.position==="absolute")&&o.display!=="none"&&o.visibility!=="hidden"&&parseFloat(o.opacity||"1")>.05){let c=a.getBoundingClientRect();if(c.width>=t*.7&&c.height>=i*.7)return!0}}}}catch{}return!1}initProactiveWelcome(){if(this.config.enableProactiveWelcome===!1)return;let e=Math.max(8,this.config.proactiveDelaySeconds||8);setTimeout(()=>{if(this.isOpen||this.messages.length>0)return;try{if(sessionStorage.getItem("zentry_proactive_welcome_dismissed")==="1"||sessionStorage.getItem("chatify_proactive_welcome_dismissed")==="1")return}catch{}if(this.hasHostModalOrOverlay())return;let t=(this.config.businessName||this.config.title||"Support").replace(/^Welcome to\s+/i,"").replace(/\s*Support\s*$/i,"").replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}️]+\s*$/u,"").replace(/^the\s+/i,"").trim()||"Support",i=this.config.welcomeText?.trim(),s=i?i.charAt(0).toUpperCase()+i.slice(1):`Welcome to ${t}`;this.showMessagePopup({id:"proactive-welcome",content:s},t)},e*1e3)}getSenderInitials(e){if(!e)return"TD";let t=e.trim().split(/\s+/).filter(Boolean);return t.length===0?"TD":t.length===1?t[0].slice(0,2).toUpperCase():(t[0][0]+t[t.length-1][0]).toUpperCase()}showMessagePopup(e,t){if(this.isOpen||this.hasHostModalOrOverlay())return;let i=this.shadow?.getElementById("chatifyMessagePopup");if(!i)return;this.popupCloseTimer&&(clearTimeout(this.popupCloseTimer),this.popupCloseTimer=null),this.currentPopupMsgId=e.id||null;let s=t||this.config.businessName||this.config.title||"Trader Care Desk",n=this.getSenderInitials(s),a=this.shadow?.getElementById("chatifyPopupTitle");a&&(a.textContent=s);let o=this.shadow?.getElementById("chatifyPopupAvatar");o&&(this.config.logoUrl?o.innerHTML=`<img src="${this.config.logoUrl}" alt="Avatar" onerror="this.parentElement.textContent='${n}'" />`:o.textContent=n);let l=this.shadow?.getElementById("chatifyPopupMessageText");l&&(l.textContent=e.content||(e.attachment_url?"Sent an attachment \u{1F4CE}":"New message")),i.classList.remove("closing"),i.style.display="flex"}hideMessagePopup(e=!0){let t=this.shadow?.getElementById("chatifyMessagePopup");if(!(!t||t.style.display==="none")){if(!e){t.style.display="none",t.classList.remove("closing");return}t.classList.add("closing"),this.popupCloseTimer&&clearTimeout(this.popupCloseTimer),this.popupCloseTimer=setTimeout(()=>{t.style.display="none",t.classList.remove("closing"),this.popupCloseTimer=null},200)}}dismissMessagePopup(){if(this.currentPopupMsgId)try{sessionStorage.setItem(`zentry_popup_dismissed_${this.currentPopupMsgId}`,"1"),sessionStorage.setItem(`chatify_popup_dismissed_${this.currentPopupMsgId}`,"1")}catch{}try{sessionStorage.setItem("zentry_proactive_welcome_dismissed","1"),sessionStorage.setItem("chatify_proactive_welcome_dismissed","1")}catch{}this.hideMessagePopup(!0)}async sendPopupReply(){let e=this.shadow?.getElementById("chatifyPopupInput"),t=this.shadow?.getElementById("chatifyPopupSendBtn"),i=e?.value.trim()||"";i&&(e&&(e.value=""),t?.classList.remove("active"),this.hideMessagePopup(!1),this.open("messages"),await this.sendMessage(i))}showPopup(e,t){this.showMessagePopup({id:"test-"+Date.now(),content:e||"Hi, how can we help?"},t||"Trader Care Desk")}hidePopup(){this.hideMessagePopup(!0)}subscribeToVisitorConversations(e){this.visitorId&&this.supabase.channel(`zen-try-visitor-convs-${this.visitorId}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"conversations",filter:`visitor_id=eq.${this.visitorId}`},async t=>{let i=t.new;i?.id&&(!this.config.workspaceId||i.workspace_id===this.config.workspaceId)&&(this.conversationId=i.id,this.conversationStatus=i.status||"open",localStorage.setItem(`zentry_conversation_id${e}`,i.id),localStorage.setItem(`chatify_conversation_id${e}`,i.id),await this.loadMessageHistory(),this.subscribeToRealtime())}).subscribe()}search(e){this.open("help"),this.activeSectionId=null,this.faqSearchQuery=(e||"").trim(),setTimeout(()=>{let t=this.shadow?.getElementById("helpSearchInput");t&&(t.value=e,t.focus()),this.renderFaqList()},100)}async openArticle(e){if(!e)return;this.open("help");let t=e.trim().toLowerCase(),i=this.faqs.find(s=>s.id&&s.id.toLowerCase()===t||s.slug&&s.slug.toLowerCase()===t);if(i){this.activeSectionId=i.sectionId||(this.sections.length>0?this.sections[0].id:null),this.faqSearchQuery="";let s=this.shadow?.getElementById("helpSearchInput");s&&(s.value=""),this.renderFaqList(),setTimeout(()=>{let n=this.shadow?.querySelectorAll(".chatify-faq-item"),a=null;if(n)for(let o=0;o<n.length;o++){let l=n[o],c=(l.getAttribute("data-id")||"").toLowerCase(),h=(l.getAttribute("data-slug")||"").toLowerCase();if(c===t||h===t){a=l;break}}if(a){let o=a;o.classList.contains("open")||o.classList.add("open"),o.scrollIntoView({behavior:"smooth",block:"center"})}},100)}}bindGlobalTriggers(){typeof document>"u"||document.addEventListener("click",e=>{let t=e.target;if(!t)return;if(t.closest("[data-zentry-help], [data-chatify-help], .zentry-help-trigger, .chatify-help-trigger")){if(e.preventDefault(),this.config.showHelpTab===!1||this.faqs.length===0)return;this.openHelp();return}let s=t.closest("[data-zentry-article], [data-chatify-article]");if(s){e.preventDefault();let l=s.getAttribute("data-zentry-article")||s.getAttribute("data-chatify-article")||"";l?this.openArticle(l):this.openHelp();return}let n=t.closest("[data-zentry-open], [data-chatify-open], .zentry-open-trigger, .chatify-open-trigger");if(n){e.preventDefault();let l=n.getAttribute("data-zentry-tab")||n.getAttribute("data-chatify-tab");this.open(l||"home");return}if(t.closest("[data-zentry-close], [data-chatify-close]")){e.preventDefault(),this.close();return}if(t.closest("[data-zentry-toggle], [data-chatify-toggle]")){e.preventDefault(),this.toggle();return}})}initNavbarAutoTrigger(){if(typeof document>"u"||typeof window>"u")return;let e=this.config.navbarTriggerConfig,t=()=>{document.querySelectorAll("[data-zentry-nav], [data-chatify-nav]").forEach(m=>m.remove()),document.getElementById("zentryNavTriggerBtn")?.remove(),document.getElementById("zentryNavTriggerBtnMobile")?.remove(),document.getElementById("chatifyNavTriggerBtn")?.remove(),document.getElementById("chatifyNavTriggerBtnMobile")?.remove(),document.querySelectorAll("[data-zentry-hooked], [data-chatify-hooked]").forEach(m=>{m.removeAttribute("data-zentry-hooked"),m.removeAttribute("data-chatify-hooked"),m.removeAttribute("data-zentry-help"),m.removeAttribute("data-chatify-help")})};if(!e||e.enabled!==!0){t();return}if(!(Array.isArray(this.faqs)&&this.faqs.length>0)){t();return}let s=window.location.hostname.toLowerCase(),n=window.location.pathname.toLowerCase(),a=(this.config.customDomain||"").toLowerCase().trim().replace(/^https?:\/\//,"").replace(/\/$/,""),o=(this.config.helpSlug||"").toLowerCase().trim();if(a&&(s===a||s===`www.${a}`||s.replace(/^www\./,"")===a.replace(/^www\./,""))||s.endsWith("zentryhelp.com")||s.endsWith("chatifyhelp.com")||n.startsWith("/help")){t();return}let l="";if(a?l=`https://${a}`:o?l=`https://${o}.zentryhelp.com`:this.config.workspaceId&&(l=`/help/${this.config.workspaceId}`),Array.from(document.querySelectorAll('header a, nav a, [role="navigation"] a, .navbar a, [class*="nav" i] a')).some(m=>{if(m.hasAttribute("data-zentry-nav")||m.hasAttribute("data-chatify-nav"))return!1;let x=(m.getAttribute("href")||"").toLowerCase().trim();return!x||x==="#"||x.startsWith("javascript:")?!1:!!(a&&x.includes(a)||o&&(x.includes(`/${o}`)||x.includes(`${o}.`))||this.config.workspaceId&&x.includes(`/help/${this.config.workspaceId.toLowerCase()}`)||x.includes("zentryhelp.com")||x.includes("chatifyhelp.com")||x.includes("zen-try"))})){t();return}let d=(e.label||"Help").trim();if(!d)return;let f=e.action||"help",u=e.position||"end",p=e.style||"navbar_link",g=m=>{f==="help"?(m.preventDefault(),this.openHelp()):f==="messages"&&(m.preventDefault(),this.openMessages())},y=(m,x)=>{let b=m.tagName.toLowerCase()==="ul"||m.tagName.toLowerCase()==="ol",v=document.createElement("a");v.textContent=d,v.setAttribute("data-zentry-nav",x?"mobile":"desktop"),v.setAttribute("data-chatify-nav",x?"mobile":"desktop"),f==="redirect"&&l?(v.href=l,v.target="_blank",v.rel="noopener noreferrer"):v.href="javascript:void(0)",v.addEventListener("click",g);let T=m.querySelector("a:not([data-zentry-nav]):not([data-chatify-nav])");if(p==="pill"){let C=this.config.primaryColor||"#2563eb";v.style.cssText=`
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: ${x?"4px 12px":"6px 16px"};
          font-size: ${x?"13px":"14px"};
          font-weight: 600;
          border-radius: 9999px;
          background-color: ${C};
          color: #ffffff !important;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          white-space: nowrap;
          line-height: 1.4;
        `,v.onmouseenter=()=>{v.style.filter="brightness(1.1)"},v.onmouseleave=()=>{v.style.filter="none"}}else if(T){T.className&&(v.className=T.className);try{let C=window.getComputedStyle(T);v.style.color=C.color,v.style.fontFamily=C.fontFamily,v.style.fontSize=C.fontSize,v.style.fontWeight=C.fontWeight,v.style.letterSpacing=C.letterSpacing,v.style.textTransform=C.textTransform,v.style.lineHeight=C.lineHeight,v.style.padding=C.padding,v.style.display=C.display==="inline"?"inline-block":C.display,v.style.cursor="pointer",v.style.textDecoration="none"}catch{}}else v.style.cssText=`
            display: inline-flex;
            align-items: center;
            font-size: 14px;
            font-weight: 500;
            color: inherit;
            text-decoration: none;
            cursor: pointer;
            padding: 6px 12px;
          `;if(b){let C=document.createElement("li");C.setAttribute("data-zentry-nav",x?"mobile":"desktop"),C.setAttribute("data-chatify-nav",x?"mobile":"desktop");let A=m.querySelector("li:not([data-zentry-nav]):not([data-chatify-nav])");return A&&A.className&&(C.className=A.className),C.appendChild(v),C}return v},_=()=>{let m=e.target_selector?.trim();if(m)try{let A=document.querySelector(m);if(A&&!A.closest("#zentry-widget-root, #chatify-widget-root, #chatifyWidgetContainer, [data-zentry-root]"))return{desktop:A,mobile:null}}catch{}let x=Array.from(document.querySelectorAll('header nav ul, header nav, nav ul, nav, [role="navigation"] ul, [role="navigation"], .navbar-nav, .navbar, [class*="nav" i] ul')).filter(A=>{if(A.closest("#zentry-widget-root, #chatify-widget-root, #chatifyWidgetContainer, [data-zentry-root]"))return!1;let Oe=window.getComputedStyle(A);return Oe.display!=="none"&&Oe.visibility!=="hidden"}),b=null,v=-1;for(let A of x){let Oe=A.tagName.toLowerCase()==="ul"||A.tagName.toLowerCase()==="ol",Pe=0;if(Oe?Pe=Array.from(A.children).filter(Ut=>Ut.tagName.toLowerCase()==="li").filter(Ut=>Ut.querySelector("a")).length:Pe=Array.from(A.querySelectorAll("a")).filter(br=>!br.closest("#zentry-widget-root, #chatify-widget-root, #chatifyWidgetContainer, [data-zentry-root]")).length,Pe<2)continue;let Le=Pe*3;(A.tagName.toLowerCase()==="nav"||A.getAttribute("role")==="navigation")&&(Le+=10),A.closest("header")&&(Le+=5),(A.closest('[class*="mobile" i]')||A.closest('[id*="mobile" i]'))&&(Le-=20),Le>v&&(v=Le,b=A)}let T=null,C=Array.from(document.querySelectorAll('[class*="mobile" i] nav ul, [class*="mobile" i] nav, [id*="mobile" i] ul, [id*="mobile" i] nav, [class*="drawer" i] ul, [class*="drawer" i] nav, nav[class*="mobile" i]')).filter(A=>!(A.closest("#zentry-widget-root, #chatify-widget-root, #chatifyWidgetContainer, [data-zentry-root]")||A===b||A.contains(b)||b?.contains(A)));return C.length>0&&(T=C[0]),{desktop:b,mobile:T}},E=()=>{let{desktop:m,mobile:x}=_();if(!(!m&&!x)){if(m&&!document.querySelector('[data-zentry-nav="desktop"], [data-chatify-nav="desktop"]')){let b=y(m,!1);u==="start"&&m.firstChild?m.insertBefore(b,m.firstChild):m.appendChild(b)}if(x&&!document.querySelector('[data-zentry-nav="mobile"], [data-chatify-nav="mobile"]')){let b=y(x,!0);u==="start"&&x.firstChild?x.insertBefore(b,x.firstChild):x.appendChild(b)}}};if(E(),typeof MutationObserver<"u"&&document.body){this.__navObserver&&this.__navObserver.disconnect();let m=null,x=new MutationObserver(()=>{clearTimeout(m),m=setTimeout(()=>{document.querySelector("[data-zentry-nav], [data-chatify-nav]")||E()},300)});x.observe(document.body,{childList:!0,subtree:!0}),this.__navObserver=x}}};if(typeof window<"u"){let r=()=>{let i=[];return{q:i,open:(...n)=>i.push(["open",n]),close:(...n)=>i.push(["close",n]),toggle:(...n)=>i.push(["toggle",n]),openHelp:(...n)=>i.push(["openHelp",n]),openMessages:(...n)=>i.push(["openMessages",n]),openArticle:(...n)=>i.push(["openArticle",n]),search:(...n)=>i.push(["search",n]),isOpen:()=>!1,resetSession:()=>{},switchTab:(...n)=>i.push(["switchTab",n]),showPopup:(...n)=>i.push(["showPopup",n]),hidePopup:(...n)=>i.push(["hidePopup",n])}},e=window.Zentry||window["Zen-try"]||window.Chatify||r();window.Zentry=e,window["Zen-try"]=e,window.Chatify=e;let t=()=>{let i=new wr;window.__ZentryInstance=i,window.__ChatifyInstance=i;let s=window.Zentry||window["Zen-try"]||window.Chatify,n=Array.isArray(s?.q)?s.q:Array.isArray(s)?s:[],a={open:o=>i.open(o),close:()=>i.close(),toggle:()=>i.toggle(),openHelp:()=>i.openHelp(),openMessages:()=>i.openMessages(),openArticle:o=>i.openArticle(o),search:o=>i.search(o),isOpen:()=>i.getIsOpen(),resetSession:()=>i.resetSession(),switchTab:o=>i.switchTab(o),showPopup:(o,l)=>i.showPopup(o,l),hidePopup:()=>i.hidePopup(),instance:i};if(window.Zentry=a,window["Zen-try"]=a,window.Chatify=a,n.length>0){for(let o of n)if(Array.isArray(o)){let[l,c=[]]=o;typeof a[l]=="function"&&a[l](...c)}else if(typeof o=="function")try{o(a)}catch{}}};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",t):t()}})();
