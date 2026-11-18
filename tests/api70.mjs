// Cancelling an order: refund is automatic only while the shop has not been told; after that it waits for the owner's approval.
import {sql,dbRun} from "./lib.mjs";
const B="http://localhost:8788",CFM="http://127.0.0.1:8798";
import crypto from "crypto";
const call=async(ck,m,u,b,h)=>{const r=await fetch(B+u,{method:m,headers:{cookie:ck||"","content-type":"application/json",...(h||{})},body:b==null?undefined:(typeof b==="string"?b:JSON.stringify(b))});const t=await r.text();let j;try{j=JSON.parse(t)}catch{j=t.slice(0,80)}return[r.status,j,r.headers.getSetCookie?.().map(c=>c.split(";")[0]).join("; ")]};
const ok=(n,c)=>console.log(c?"PASS":"FAIL",n);
const cfm=async(m,p)=>(await fetch(CFM+p,{method:m})).json();
const hook=async id=>{const raw=JSON.stringify({type:"PAYMENT_SUCCESS_WEBHOOK",data:{order:{order_id:id}}}),ts=String(Date.now()),sg=crypto.createHmac("sha256","test_secret").update(ts+raw).digest("base64");return call("","POST","/api/shop/cf-webhook",raw,{"x-webhook-timestamp":ts,"x-webhook-signature":sg})};
const A=(await call("","POST","/api/auth/login",{email:"admin@test.in",password:"password123"}))[2];
const pid=(await call(A,"GET","/api/shop/products"))[1].find(p=>p.stock==null||p.stock>5).id;
const mk=async tag=>{const ph="98"+String(Math.floor(Math.random()*1e8)).padStart(8,"0");const o=(await call("","POST","/api/shop/order",{product_id:pid,qty:1,name:"Guest "+tag,phone:ph,email:tag+"@example.com",address:"Flat 1, Hitech City, Hyderabad",pincode:"500081"}))[1];await call("","POST","/api/shop/order/cf-start",{code:o.code,phone:ph});await cfm("POST","/_pay/PS-"+o.code);await hook("PS-"+o.code);return o.code};
const st=c=>sql("SELECT id,status,refund_amount FROM shop_orders WHERE code='"+c+"'")[0];
const rf=async c=>((await cfm("GET","/_log")).orders["PS-"+c].refunds||[]).length;
const set=async(id,status)=>call(A,"POST","/api/shop/admin/order",{id,status,note:"",courier_cost:"",shop_paid:false});
// 1) shop not told yet (packed): owner cancels -> automatic refund
const c1=await mk("aa");const r0=await set(st(c1).id,"cancelled");
ok("cancel before the shop is told: refunded automatically",st(c1).status==="refunded"&&await rf(c1)===1);
// 2) shop told (shop_called): cancel -> no automatic refund
const c2=await mk("bb");await set(st(c2).id,"shop_called");await set(st(c2).id,"cancelled");
ok("cancel after the shop is told: order cancelled but NOT refunded automatically",st(c2).status==="cancelled"&&await rf(c2)===0&&!(st(c2).refund_amount>0));
const [s,j]=await call(A,"POST","/api/shop/admin/order/refund",{id:st(c2).id,amount:sql("SELECT amount FROM shop_orders WHERE code='"+c2+"'")[0].amount,note:"approved"});
ok("owner approves: refund goes out through Cashfree",s===200&&await rf(c2)===1&&st(c2).refund_amount>0);
ok("customer sees the waiting message",sql("SELECT COUNT(*) n FROM shop_order_events WHERE order_id="+st(c2).id+" AND note LIKE '%after we confirm with the shop%'")[0].n===1);

// Returns: a product that is not returnable for change of mind refuses that reason on the server, but still takes damage reports.
const login=async(e,pw="password123")=>(await call("","POST","/api/auth/login",{email:e,password:pw}))[2];
const em="nr"+Date.now()%100000+"@t.in";await call("","POST","/api/auth/signup",{name:"Return Cust",email:em,password:"Cust12345"});const C=await login(em,"Cust12345");
const NP=(await call(A,"GET","/api/shop/products"))[1].find(p=>p.price>=300&&(p.stock==null||p.stock>5));
const mkd=async()=>{const o=(await call(C,"POST","/api/shop/order",{product_id:NP.id,qty:1,name:"Return Customer",phone:"98"+String(Math.floor(Math.random()*1e8)).padStart(8,"0"),address:"Flat 1, Hitech City, Hyderabad",pincode:"500081",email:em}))[1];const id=sql("SELECT id FROM shop_orders WHERE code='"+o.code+"'")[0].id;await call(A,"POST","/api/shop/admin/order",{id,status:"delivered",note:"",courier_cost:"",shop_paid:false});return o.code};
dbRun("UPDATE shop_products SET returns=0 WHERE id="+NP.id);
const n1=await mkd();let [s2,j2]=await call(C,"POST","/api/shop/me/order/return",{code:n1,reason:"I changed my mind",kind:"change"});
ok("not returnable for change of mind: the request is refused",s2===400&&/can't be returned for a change of mind/.test(j2.error||""));
[s2,j2]=await call(C,"POST","/api/shop/me/order/return",{code:n1,reason:"It arrived broken",kind:"damaged"});
ok("not returnable: a damaged-item report still needs a photo first",s2===400&&/photo/i.test(j2.error||""));
dbRun("UPDATE shop_products SET returns=1 WHERE id="+NP.id);
const n2=await mkd();[s2,j2]=await call(C,"POST","/api/shop/me/order/return",{code:n2,reason:"I changed my mind",kind:"change"});
ok("returnable product: change-of-mind request is accepted",s2===200&&j2.ok);
