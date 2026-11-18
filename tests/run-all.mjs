// Runs every API test against a throw-away local copy of the shop. Needs Node 22+ and wrangler (npx wrangler).
//   node tests/run-all.mjs            all tests
//   node tests/run-all.mjs api32      only matching tests
// Your wrangler.toml and your real database are never touched.
import {spawn,execSync} from "node:child_process";import fs from "node:fs";import path from "node:path";import os from "node:os";import {fileURLToPath} from "node:url";import {DatabaseSync} from "node:sqlite";
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),".."),T=path.join(ROOT,"tests"),PORT=8788,B="http://localhost:"+PORT;
const only=process.argv.slice(2),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const SB=fs.mkdtempSync(path.join(os.tmpdir(),"pstest-"));
const cp=(a,b)=>fs.cpSync(a,b,{recursive:true});
cp(path.join(ROOT,"src"),path.join(SB,"src"));cp(path.join(ROOT,"public"),path.join(SB,"public"));
for(const f of fs.readdirSync(T))if(/\.(mjs|toml)$/.test(f))fs.copyFileSync(path.join(T,f),path.join(SB,f));
fs.renameSync(path.join(SB,"wrangler.test.toml"),path.join(SB,"wrangler.toml"));
fs.cpSync(path.join(T,"fixtures"),path.join(SB,"fixtures"),{recursive:true});{const b=Buffer.alloc(6e6);b[0]=0xff;b[1]=0xd8;b[2]=0xff;fs.writeFileSync(path.join(SB,"fixtures/big.jpg"),b)}
const files=fs.readdirSync(T).filter(f=>/^(api|ui)\d+\.mjs$/.test(f)).sort((a,b)=>(a[0]==="u")-(b[0]==="u")||parseInt(a.replace(/\D/g,""))-parseInt(b.replace(/\D/g,""))).filter(f=>!only.length||only.some(o=>f.startsWith(o)));
const CF=["--var","CASHFREE_APP_ID:test_app","--var","CASHFREE_SECRET:test_secret","--var","CASHFREE_URL:http://127.0.0.1:8798/pg"];
const EXTRA={ui126:CF,api66:CF,api70:CF,api67:CF,api64:[],api65:["--var","APP_SECRET:test-secret-123"],api54:CF,api55:[...CF,"--var","SHOP_PUBLIC:0"],ui104:CF,api56:CF,api57:CF,api58:["--accept-on"],ui105:["--accept-on"],api59:["--accept-on"],api60:["--accept-on"],ui106:["--accept-on"],ui107:["--var","SHOP_PUBLIC:0"],ui108:["--var","SHOP_PUBLIC:0","--var","AMAZON_STORE:1"],ui109:["--var","AMAZON_STORE:1"],ui110:["--var","AMAZON_STORE:0","--var","SHOP_PUBLIC:0"],ui111:["--var","AMAZON_STORE:0","--var","SHOP_PUBLIC:1"],ui112:["--var","SHOP_PUBLIC:1"],api61:[],ui116:["--var","SHOP_PUBLIC:1","--var","AMAZON_STORE:1"],api62:[],api63:[],ui121:["--var","SHOP_PUBLIC:1","--var","AMAZON_STORE:1"],ui122:["--var","AMAZON_STORE:1","--var","SHOP_PUBLIC:1"],ui124:["--var","AMAZON_STORE:1","--var","SHOP_PUBLIC:1"],ui125:["--var","AMAZON_STORE:1","--var","SHOP_PUBLIC:1"],api64:[],ui123:["--var","AMAZON_STORE:1","--var","SHOP_PUBLIC:1"],ui113:["--var","SHOP_PUBLIC:1","--var","AMAZON_STORE:1"],api33:["--var","LOGIN_2FA:1"],api14:["--var","SHOP_EMAIL_ON_PLACE:0"],api34:["--test-scheduled"]};
const procs=[];const kill=()=>{for(const p of procs)try{process.kill(-p.pid)}catch(e){}};process.on("exit",kill);process.on("SIGINT",()=>{kill();process.exit(1)});
const start=(cmd,args,log,env)=>{const p=spawn(cmd,args,{cwd:SB,detached:true,stdio:["ignore",fs.openSync(path.join(SB,log),"a"),fs.openSync(path.join(SB,log),"a")],env:{...process.env,...env,CI:"1"}});procs.push(p);return p};
const mig=["schema.sql","migration-shop.sql","migration-shop-te.sql","migration-shop-owners.sql","migration-shop-account.sql","migration-admin-products.sql","migration-folders.sql","migration-password-reset.sql","migration-verify.sql","migration-push.sql","migration-reviews.sql","migration-support.sql","migration-support-read.sql","migration-support-reply.sql","migration-telugu.sql","migration-views.sql","migration-security.sql","migration-shop-alerts.sql","migration-shop-variants.sql","migration-shop-weight.sql","migration-shop-tags.sql","migration-shop-qa.sql","migration-shop-pricehist.sql","migration-shop-notify.sql","migration-shop-couponshow.sql","migration-shop-pwatch.sql","migration-shop-banners.sql","migration-shop-banners2.sql"];
const waitUp=async()=>{for(let i=0;i<60;i++){try{const r=await fetch(B+"/robots.txt");if(r.ok)return true}catch(e){}await sleep(1000)}return false};
const stop=async p=>{try{process.kill(-p.pid)}catch(e){}await sleep(2500)};
const dbFile=()=>{const d=path.join(SB,".wrangler/state/v3/d1/miniflare-D1DatabaseObject");return fs.existsSync(d)?fs.readdirSync(d).filter(f=>f.endsWith(".sqlite")).map(f=>path.join(d,f))[0]:null};
const npx=process.env.WRANGLER||(fs.existsSync(path.join(ROOT,"node_modules/.bin/wrangler"))?path.join(ROOT,"node_modules/.bin/wrangler"):"npx wrangler");
// 1. create the empty database and load every migration (already-applied statements are skipped)
const WR=(x0=[])=>{const on=x0.includes("--accept-on"),x=[...(on?[]:["--var","SHOP_REQUIRE_ACCEPT:0"]),...(x0.some(v=>/^AMAZON_STORE:/.test(v))?[]:["--var","AMAZON_STORE:1"]),...x0.filter(v=>v!=="--accept-on")];return npx.includes(" ")?["npx",["wrangler","dev","--port",String(PORT),...x],"dev.log"]:[npx,["dev","--port",String(PORT),...x],"dev.log"]};
let srv=start(...WR());
if(!await waitUp()){console.log("Could not start the local server. See",path.join(SB,"dev.log"));process.exit(1)}
await fetch(B+"/api/products").catch(()=>{});await sleep(1500);
const DB=dbFile();if(!DB){console.log("Local database file not found");process.exit(1)}
{const d=new DatabaseSync(DB);for(const f of mig){const p=path.join(ROOT,f);if(!fs.existsSync(p))continue;
 const txt=fs.readFileSync(p,"utf8").split("\n").filter(l=>!/^\s*--/.test(l)).join("\n");
 for(const st of txt.split(/;\s*(?:\n|$)/).map(x=>x.trim()).filter(Boolean)){try{d.exec(st)}catch(e){if(!/duplicate column|already exists/i.test(String(e.message)))console.log("  migration note ("+f+"):",String(e.message).slice(0,90))}}}
 d.close()}
// 2. every test file starts from an empty database
const wipe=()=>{const d=new DatabaseSync(DB);const tabs=d.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name NOT LIKE 'd1_%'").all();for(const t of tabs)d.exec('DELETE FROM "'+t.name+'"');try{d.exec("DELETE FROM sqlite_sequence")}catch(e){}d.close()};
const mock=start("node",["mailmock.mjs"],"mock.log");const cfm=start("node",["cfmock.mjs"],"cfmock.log");await sleep(800);
let total=0,bad=0;const rows=[];
for(const f of files){
 const name=f.replace(".mjs",""),extra=EXTRA[name];
 if(extra){await stop(srv);srv=start(...WR(extra));await waitUp()}
 wipe();if(name!=="api40"){const d=new DatabaseSync(DB);d.exec("INSERT OR REPLACE INTO shop_settings(k,v) VALUES('zon','0')");d.close()}fs.writeFileSync(path.join(SB,"mails.json"),"[]");
 for(let t=0;t<6;t++){const r=await fetch(B+"/api/auth/signup",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:"Admin",email:"admin@test.in",password:"password123"})}).catch(()=>null);if(r&&(r.status===200||r.status===409))break;if(t===5)console.log("  could not create the seed admin for",name);await sleep(1500)}
 {const J=async(ck,m,u,b)=>{const r=await fetch(B+u,{method:m,headers:{cookie:ck||"","content-type":"application/json"},body:b==null?undefined:JSON.stringify(b)});return[r,await r.json().catch(()=>({}))]};
  const [lr]=await J("","POST","/api/auth/login",{email:"admin@test.in",password:"password123"}),A=(lr.headers.getSetCookie()||[]).map(c=>c.split(";")[0]).join("; ");
  await J(A,"POST","/api/shop/admin/settings",{ctype:"percent",cval:20,fee:40,free:500,ccost:0,cmin:60,minord:0,pins:"",qmax:12,cmax:5,tmax:12,lmax:6,pmax:20});
  await J(A,"POST","/api/shop/admin/shopowners",{name:"Seed Shop",email:"seed@test.in",mobile:"9876500000",password:"Owner12345"});
  const [or]=await J("","POST","/api/auth/login",{email:"seed@test.in",password:"Owner12345"}),O=(or.headers.getSetCookie()||[]).map(c=>c.split(";")[0]).join("; ");
  for(const [t,pc,cat] of [["Seed Product",100,"Kitchen"],["Seed Cup",150,"Kitchen"],["Seed Bag",300,"Bags"]]){const [,pr]=await J(O,"POST","/api/shop/owner/product",{title:t,price:pc,mrp:pc*2,category:cat});
   if(pr.id){await J(A,"POST","/api/shop/admin/approve",{id:pr.id,approve:true});await J(A,"POST","/api/shop/admin/stock",{id:pr.id,stock:500})}}}
 let out="";try{out=execSync("node "+f,{cwd:SB,encoding:"utf8",timeout:420000,env:{...process.env,DBFILE:DB},stdio:["ignore","pipe","pipe"]})}catch(e){out=(e.stdout||"")+"\n"+(e.stderr||"")+"\nCRASH"}
 fs.writeFileSync(path.join(SB,"out-"+name+".txt"),out);const pass=(out.match(/^PASS/gm)||[]).length,fail=(out.match(/^FAIL.*/gm)||[]),crash=/CRASH/.test(out);
 total+=pass+fail.length;bad+=fail.length+(crash?1:0);rows.push([name,pass,fail.length,crash]);
 console.log(`${fail.length||crash?"✗":"✓"} ${name}: ${pass} passed${fail.length?", "+fail.length+" FAILED":""}${crash?", CRASHED":""}`);
 for(const l of fail)console.log("    "+l);if(crash)console.log("    "+out.split("\n").filter(l=>/Error|\.mjs:\d+/.test(l)).slice(0,3).join("\n    "));
 if(extra){await stop(srv);srv=start(...WR());await waitUp()}
}
console.log(`\n${bad?"SOME TESTS FAILED":"ALL TESTS PASSED"}: ${total} checks, ${bad} problems. Logs: ${SB}`);kill();process.exit(bad?1:0);
