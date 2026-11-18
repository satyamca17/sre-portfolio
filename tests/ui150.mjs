// Similar products are ranked by tags and price; the courier-charges admin screen is a simple table.
let pw;try{pw=await import(process.env.PLAYWRIGHT||"playwright")}catch{pw=await import("/home/claude/.npm-global/lib/node_modules/playwright/index.mjs")}
const B="http://localhost:8788",ok=(n,c)=>console.log(c?"PASS":"FAIL",n);
const lr=await fetch(B+"/api/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email:"admin@test.in",password:"password123"})});
const H={cookie:lr.headers.getSetCookie().map(c=>c.split(";")[0]).join("; "),"content-type":"application/json"};
const ck=lr.headers.getSetCookie().map(c=>{const [n,...v]=c.split(";")[0].split("=");return{name:n,value:v.join("="),url:B}});
const mk=async(title,price,tags,stock)=>(await (await fetch(B+"/api/shop/admin/product",{method:"POST",headers:H,body:JSON.stringify({title,category:"Home & Kitchen › Storage",price,mrp:price+100,active:1,description:"Storage item for the kitchen and home use. ".repeat(6),stock,tags})})).json()).id;
const main=await mk("Main steel jar",300,"steel,jar,kitchen",9);
const near=await mk("Nearby jar",320,"steel,jar,kitchen",9);
const tagOnly=await mk("Far priced jar",3000,"steel,jar,kitchen",9);
const cheapNoTag=await mk("Plain cheap box",310,"",9);
const gone=await mk("Sold out jar",300,"steel,jar,kitchen",0);
const br=await pw.chromium.launch();const ctx=await br.newContext({viewport:{width:1200,height:900}});await ctx.addCookies(ck);await ctx.addInitScript(()=>{try{localStorage.setItem("ps_lang","en")}catch(e){}});const pg=await ctx.newPage();const errs=[];pg.on("pageerror",e=>errs.push(e.message));pg.on("dialog",d=>d.accept());
await pg.goto(B+"/shop#/p/"+main);await pg.waitForSelector("#sim a",{timeout:15000});await pg.waitForTimeout(800);
const names=await pg.locator("#sim a b").allInnerTexts();
ok("similar products: matching tags and price first ("+names.join(" | ")+")",names[0].startsWith("Nearby")&&names.indexOf("Far priced jar")<names.indexOf("Plain cheap box")&&names[names.length-1].startsWith("Sold")&&!names.some(n=>n.startsWith("Main")));
await pg.goto(B+"/shop/admin");await pg.waitForSelector(".tab",{timeout:15000});
await pg.locator(".tab",{hasText:/pricing/i}).first().click().catch(()=>{});await pg.waitForSelector("#gfl",{timeout:15000});
ok("courier charges: one table with 3 areas x (customer pays, free above, return charge)",(await pg.locator("#gfl,#gfs,#gfo,#gxl,#gxs,#gxo,#grl,#grs,#gro").count())===9);
ok("the confusing extra options are folded away",!(await pg.locator("#gpc").isVisible()));
await pg.fill("#gfl","45");await pg.fill("#grl","30");await pg.locator("summary",{hasText:/More courier/}).click();await pg.fill("#gpc","0");
await pg.locator("#gs").click();await pg.waitForSelector("#gm .ok",{timeout:10000});
const S=await (await fetch(B+"/api/shop/admin/settings",{headers:{cookie:H.cookie}})).json();
ok("saving keeps the new values (city charge 45, return charge 30, flat)",S.fl===45&&S.rl===30&&S.pc===0);
const q=await (await fetch(B+"/api/shop/quote",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({pincode:"500081",items:[{product_id:main,qty:1}]})})).json().catch(()=>null);
ok("no page errors",errs.length===0);await br.close()
