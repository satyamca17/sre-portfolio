let pw;try{pw=await import(process.env.PLAYWRIGHT||"playwright")}catch{pw=await import("/home/claude/.npm-global/lib/node_modules/playwright/index.mjs")}
import {sql} from "./lib.mjs";
import {writeFileSync} from "node:fs";
const B="http://localhost:8788",ok=(n,c)=>console.log(c?"PASS":"FAIL",n);
const J=async(m,u,b,ck)=>{const r=await fetch(B+u,{method:m,headers:{cookie:ck||"","content-type":"application/json"},body:b?JSON.stringify(b):undefined});return[r,await r.json().catch(()=>({}))]};
const [lr]=await J("POST","/api/auth/login",{email:"admin@test.in",password:"password123"});const A=lr.headers.getSetCookie().map(c=>c.split(";")[0]).join("; ");
const prods=await (await fetch(B+"/api/shop/products")).json();const pid=prods.find(p=>p.stock==null||p.stock>5).id;sql("UPDATE shop_products SET returns=1 WHERE id="+pid);
await J("POST","/api/auth/signup",{name:"UI106",email:"u106@example.com",password:"password123"});
const [cr]=await J("POST","/api/auth/login",{email:"u106@example.com",password:"password123"});const ck=cr.headers.getSetCookie().map(c=>{const [n,...v]=c.split(";")[0].split("=");return{name:n,value:v.join("="),url:B}});
const uid=sql("SELECT id FROM users WHERE email='u106@example.com'")[0].id;
const mk=async()=>{const [,o]=await J("POST","/api/shop/order",{name:"Test Buyer",phone:"9812345678",address:"Flat 1, Hitech City, Hyderabad",pincode:"500081",product_id:pid,qty:1,accept:true});sql("UPDATE shop_orders SET user_id="+uid+",status='delivered',delivered_at="+(Date.now()-864e5)+" WHERE code='"+o.code+"'");return o.code};
// a real small PNG
const png=Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==","base64");writeFileSync("/tmp/ui106.png",png);writeFileSync("/tmp/ui106.txt","not a picture");
const code=await mk(),code2=await mk();
const br=await pw.chromium.launch();const ctx=await br.newContext({viewport:{width:400,height:900}});await ctx.addCookies(ck);await ctx.addInitScript(()=>{try{localStorage.setItem("ps_lang","en")}catch(e){}});const pg=await ctx.newPage();
const errs=[];pg.on("pageerror",e=>errs.push(e.message));
let uploads=0,returns=[];pg.on("request",r=>{if(r.method()==="POST"&&/return-proof/.test(r.url()))uploads++;if(r.method()==="POST"&&/me\/order\/return$/.test(r.url()))returns.push(r.postData())});
await pg.goto(B+"/shop#/o/"+code);await pg.waitForSelector("#rt");await pg.click("#rt");
ok("the form has a problem type, a photo picker and a note",await pg.locator("#rk").count()===1&&await pg.locator("#rtf").count()===1&&/optional/i.test(await pg.locator("#rtb").innerText()));
ok("the picker accepts photos and videos",/image/.test(await pg.getAttribute("#rtf","accept"))&&/video/.test(await pg.getAttribute("#rtf","accept")));
await pg.click("#rts");ok("nothing chosen: asked to pick the problem",/choose what the problem/i.test(await pg.innerText("#rte"))&&returns.length===0);
await pg.selectOption("#rk","damaged");await pg.fill("#rtx","Screen cracked on arrival");await pg.click("#rts");
ok("damaged without a photo: asked for a photo, nothing sent",/at least one clear photo/i.test(await pg.innerText("#rte"))&&uploads===0&&returns.length===0);
await pg.setInputFiles("#rtf","/tmp/ui106.txt");await pg.click("#rts");await pg.waitForTimeout(800);
ok("a non-image file is not sent",/Only photos/i.test(await pg.innerText("#rte"))&&uploads===0&&returns.length===0);
await pg.setInputFiles("#rtf","/tmp/ui106.png");ok("the chosen file is listed",/1 photo selected/.test(await pg.innerText("#rtn")));
await pg.click("#rts");await pg.waitForFunction(()=>/photo\/video attached/.test(document.body.innerText),null,{timeout:15000}).catch(()=>{});
ok("photo uploaded, then the request sent with its type",uploads===1&&returns.length===1&&/"kind":"damaged"/.test(returns[0]));
ok("the order page shows the request with the attachment count",/Screen cracked on arrival/.test(await pg.innerText("body"))&&/1 photo\/video attached/.test(await pg.innerText("body")));
ok("stored with the order",sql("SELECT COUNT(*) n FROM shop_return_proofs p JOIN shop_orders o ON o.id=p.order_id WHERE o.code='"+code+"'")[0].n===1);
// change of mind needs no photo
await pg.goto(B+"/shop#/o/"+code2);await pg.waitForSelector("#rt");await pg.click("#rt");await pg.selectOption("#rk","change");await pg.fill("#rtx","Does not fit me");await pg.click("#rts");
await pg.waitForFunction(()=>/Does not fit me/.test(document.body.innerText),null,{timeout:15000}).catch(()=>{});
ok("change of mind goes through without a photo",/Does not fit me/.test(await pg.innerText("body")));
ok("no page errors",errs.length===0);
await br.close();
