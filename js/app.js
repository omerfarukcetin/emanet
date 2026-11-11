/* Emanet — portföy, bütçe ve zekât defteri. Tek dosya, bağımlılık: js/vendor/supabase.js (isteğe bağlı). */
(function(){
"use strict";
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);
const todayISO=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10)};
const LS="emanet-state-v1",MK="emanet-market-v1",FXK="emanet-fx-v1",WK="emanet-watch-v1",OWN="emanet-owner",GUEST="emanet-guest";
const CFG=window.EMANET_CONFIG||{};
const APP_VERSION="2.4";

const KINDS={hisse:"Hisse (BIST)",abd:"ABD hissesi",fon:"Yatırım fonu (TEFAS)",ppf:"Para piyasası fonu",altin:"Altın",gumus:"Gümüş",doviz:"Döviz",kripto:"Kripto",nakit:"Nakit / Mevduat",bes:"BES",emlak:"Gayrimenkul",diger:"Diğer"};
const CASH_LBL="Nakit (gelir-gider)";
const KIND_COLOR={hisse:"--c2",abd:"--c4",fon:"--c5",ppf:"--c3",altin:"--c1",gumus:"--c7",doviz:"--c3",kripto:"--c6",nakit:"--c3",bes:"--c4",emlak:"--c6",diger:"--c7"};
const PRICED=["hisse","abd","fon","ppf","kripto","diger"];
const FUNDS=["fon","ppf"];
/* açılır listeden seçilen hazır ürünler: [kod, ad, market.gold anahtarı] */
const PRESETS={
  altin:[["GAU","Gram altın","gram"],["CEYREK","Çeyrek altın","ceyrek"],["YARIM","Yarım altın","yarim"],["TAM","Tam altın","tam"],["CUM","Cumhuriyet altını","cumhuriyet"],["RESAT","Reşat altın","resat"],["HAMIT","Hamit altın","hamit"],["ATA","Ata altın","ata"],["AZIZ","Aziz altın","aziz"]],
  gumus:[["GUMUS","Gram gümüş","gumus"]],
  doviz:[["USD","Amerikan doları",null],["EUR","Euro",null]]
};
/* yazdıkça öneri listeleri */
const SUGG={
  hisse:[["THYAO","Türk Hava Yolları"],["ASELS","Aselsan"],["GARAN","Garanti BBVA"],["AKBNK","Akbank"],["YKBNK","Yapı Kredi"],["ISCTR","İş Bankası (C)"],["HALKB","Halkbank"],["VAKBN","Vakıfbank"],["TSKB","TSKB"],["KCHOL","Koç Holding"],["SAHOL","Sabancı Holding"],["AGHOL","Anadolu Grubu Holding"],["DOHOL","Doğan Holding"],["ALARK","Alarko Holding"],["TKFEN","Tekfen Holding"],["BIMAS","BİM Mağazalar"],["MGROS","Migros"],["SOKM","Şok Marketler"],["ULKER","Ülker"],["AEFES","Anadolu Efes"],["CCOLA","Coca-Cola İçecek"],["EREGL","Ereğli Demir Çelik"],["KRDMD","Kardemir (D)"],["BRSAN","Borusan Boru"],["TUPRS","Tüpraş"],["PETKM","Petkim"],["SISE","Şişecam"],["SASA","Sasa Polyester"],["HEKTS","Hektaş"],["GUBRF","Gübre Fabrikaları"],["FROTO","Ford Otosan"],["TOASO","Tofaş"],["DOAS","Doğuş Otomotiv"],["OTKAR","Otokar"],["TTRAK","Türk Traktör"],["ARCLK","Arçelik"],["VESTL","Vestel"],["PGSUS","Pegasus"],["TAVHL","TAV Havalimanları"],["TCELL","Turkcell"],["TTKOM","Türk Telekom"],["ENKAI","Enka İnşaat"],["EKGYO","Emlak Konut GYO"],["ENJSA","Enerjisa"],["AKSEN","Aksa Enerji"],["ZOREN","Zorlu Enerji"],["ODAS","Odaş Elektrik"],["ASTOR","Astor Enerji"],["EUPWR","Europower Enerji"],["CWENE","CW Enerji"],["ALFAS","Alfa Solar"],["GESAN","Girişim Elektrik"],["KONTR","Kontrolmatik"],["MIATK","Mia Teknoloji"],["REEDR","Reeder Teknoloji"],["LOGO","Logo Yazılım"],["KAREL","Karel Elektronik"],["CIMSA","Çimsa"],["OYAKC","Oyak Çimento"],["ISMEN","İş Yatırım"],["MAVI","Mavi Giyim"],["KCAER","Kocaer Çelik"]],
  abd:[["AAPL","Apple"],["MSFT","Microsoft"],["NVDA","NVIDIA"],["AMZN","Amazon"],["GOOGL","Alphabet (A)"],["META","Meta Platforms"],["TSLA","Tesla"],["AVGO","Broadcom"],["AMD","Advanced Micro Devices"],["INTC","Intel"],["QCOM","Qualcomm"],["MU","Micron"],["TSM","TSMC"],["ASML","ASML"],["ORCL","Oracle"],["CRM","Salesforce"],["ADBE","Adobe"],["IBM","IBM"],["PLTR","Palantir"],["NFLX","Netflix"],["UBER","Uber"],["SHOP","Shopify"],["BRK.B","Berkshire Hathaway (B)"],["JPM","JPMorgan Chase"],["V","Visa"],["MA","Mastercard"],["KO","Coca-Cola"],["PEP","PepsiCo"],["JNJ","Johnson & Johnson"],["PG","Procter & Gamble"],["WMT","Walmart"],["COST","Costco"],["DIS","Walt Disney"],["NKE","Nike"],["BA","Boeing"],["LPTH","LightPath Technologies"],["SPY","SPDR S&P 500 ETF"],["VOO","Vanguard S&P 500 ETF"],["QQQ","Invesco QQQ (Nasdaq 100)"],["VTI","Vanguard Total Stock Market ETF"]],
  kripto:[["BTC","Bitcoin"],["ETH","Ethereum"],["SOL","Solana"],["XRP","XRP"],["BNB","BNB"],["ADA","Cardano"],["DOGE","Dogecoin"],["AVAX","Avalanche"],["DOT","Polkadot"],["LINK","Chainlink"],["USDT","Tether"]]
};
const trLow=s=>String(s||"").toLocaleLowerCase("tr");
const CATS={in:["Maaş","Ek ödemeler (kurs, görev, ikramiye)","Yan gelir","Kira geliri","Yatırım getirisi","Hediye","Diğer gelir"],
  out:["Kira & aidat","Faturalar","Market & mutfak","Kredi kartı harcaması","Kredi / taksit","Ulaşım & araç","Eğitim","Sağlık","Çocuk","Giyim","Ev & eşya","Dışarıda yemek & eğlence","Abonelikler","Hediye","Yardım & sadaka","Diğer gider"]};
const CAT_MAP={"Kira":"Kira & aidat","Market":"Market & mutfak","Ulaşım":"Ulaşım & araç","Ev":"Ev & eşya","Eğlence":"Dışarıda yemek & eğlence","Sadaka / Bağış":"Yardım & sadaka","Abonelik":"Abonelikler","Satış":"Yan gelir","Temettü / Faiz dışı getiri":"Yatırım getirisi","Diğer":null};

const CURS=["TRY","USD","EUR"];
const HM=["Muharrem","Safer","Rebiülevvel","Rebiülahir","Cemaziyelevvel","Cemaziyelahir","Recep","Şaban","Ramazan","Şevval","Zilkade","Zilhicce"];
const COINS=[["cumhuriyet","Cumhuriyet altını"],["hamit","Hamit lira"],["aziz","Aziz lira"],["resat","Reşat lira"]];
const MONTHS=["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

/* hicri takvim */
let HCAL="islamic-umalqura";
try{if(new Intl.DateTimeFormat("en-u-ca-islamic-umalqura").resolvedOptions().calendar!=="islamic-umalqura")HCAL="islamic"}catch(e){HCAL="islamic"}
const HF=new Intl.DateTimeFormat("en-US-u-ca-"+HCAL+"-nu-latn",{year:"numeric",month:"numeric",day:"numeric",timeZone:"UTC"});
function toH(iso){const p=HF.formatToParts(new Date(iso+"T00:00:00Z"));const g=t=>+((p.find(x=>x.type===t)||{}).value||"").replace(/\D/g,"");return{y:g("year"),m:g("month"),d:g("day")}}
function fromH(y,m,d){
  const ap=Date.UTC(622,6,16)+((y-1)*354.36667+(m-1)*29.5306+(d-1))*864e5;
  for(let k=0;k<=50;k++)for(const s of k?[k,-k]:[0]){const iso=new Date(ap+s*864e5).toISOString().slice(0,10);const h=toH(iso);if(h.y===y&&h.m===m&&h.d===d)return iso}
  return d>29?fromH(y,m,29):null;
}
const fmtH=iso=>{if(!iso)return"";const h=toH(iso);return h.d+" "+HM[h.m-1]+" "+h.y};
const defaultSettings=()=>({theme:"system",accent:"kobalt",fontSize:"m",compact:false,base:"TRY",rates:{USD:44,EUR:51},goldGram:0,coins:{cumhuriyet:0,hamit:0,aziz:0,resat:0},ratesUpdated:null,autoPrices:true,feeRate:0,tone:"gri",nisabGram:96,hawlH:null,hawlStart:"",hawlSet:true,zakatRecv:true,zakatDebt:true,zakatKinds:{hisse:true,abd:true,fon:true,ppf:true,altin:true,gumus:true,doviz:true,kripto:true,nakit:true,bes:false,emlak:false,diger:true},hide:false,start:"ozet"});
const emptyState=()=>({v:1,updatedAt:0,settings:defaultSettings(),portfolios:[],tx:[],debts:[],zakatPaid:[],cards:[],recurring:[],goals:[],budgets:{}});

let ufe=null;
let fxhist={}, market=null, lastWatch="[]", fxBusy=false;
let sb=null, sbUser=null;
try{fxhist=JSON.parse(localStorage.getItem(FXK)||"{}")||{}}catch(e){}
try{market=JSON.parse(localStorage.getItem(MK)||"null")}catch(e){}
try{lastWatch=localStorage.getItem(WK)||"[]"}catch(e){}
let state=null, ready=false, mode="pending", saving=false, pendingSave=false, saveTimer=null, lastLocalWrite=0;
let view={ozPf:(()=>{try{return localStorage.getItem("emanet-ozpf")}catch(e){return null}})(),tab:"ozet",pf:null,owner:"all",zOwner:null,month:todayISO().slice(0,7),txType:"all",debtDir:"lent"};

function normalize(s){
  const e=emptyState(); s=Object.assign(e,s||{});
  s.settings=Object.assign(defaultSettings(),s.settings||{});
  s.settings.rates=Object.assign({USD:44,EUR:51},s.settings.rates||{});
  s.settings.zakatKinds=Object.assign(defaultSettings().zakatKinds,s.settings.zakatKinds||{});
  s.settings.coins=Object.assign({cumhuriyet:0,hamit:0,aziz:0,resat:0},s.settings.coins||{});
  if(!s.settings.nisabGramSet){s.settings.nisabGram=96;s.settings.nisabGramSet=true}
  if(!s.settings.hawlSet){s.settings.hawlH=null;s.settings.hawlStart="";s.settings.hawlSet=true}
  if(s.settings.hawlH&&!s.settings.hawlH.y)s.settings.hawlH=null;
  if(!s.settings.hawlBy){s.settings.hawlBy={};if(s.settings.hawlH)s.settings.hawlBy[s.settings.mainOwner||"Ben"]=s.settings.hawlH}
  s.settings.hawlH=null;
  ["portfolios","tx","debts","zakatPaid","cards","recurring","goals"].forEach(k=>{if(!Array.isArray(s[k]))s[k]=[]});
  if(!s.hist||typeof s.hist!=="object"||Array.isArray(s.hist))s.hist={};
  if(!s.budgets||typeof s.budgets!=="object")s.budgets={};
  s.tx.forEach(t=>{if(t.cat in CAT_MAP)t.cat=CAT_MAP[t.cat]||(t.type==="in"?"Diğer gelir":"Diğer gider")});
  s.portfolios.forEach(p=>{if(!Array.isArray(p.holdings))p.holdings=[];if(!p.owner)p.owner=s.settings.mainOwner||"Ben";if(p.inSummary===undefined)p.inSummary=true;
    p.holdings.forEach(h=>{if(h.kind==="hisse"&&h.cur==="USD")h.kind="abd";
      if(h.kind==="bes"&&!h.bes){const pr=(+h.qty||0)*(+h.cost||0),v=(+h.qty||0)*(+h.price||0);h.bes={principal:pr,gain:v-pr,state:0,stateGain:0};h.qty=1;h.cost=pr;h.price=v;h.trades=[]}})});
  s.debts.forEach(d=>{if(!Array.isArray(d.payments))d.payments=[]});
  /* zekât portföy bazında: kişi bazlı eski kayıtları portföye taşı */
  {const mo=s.settings.mainOwner||"Ben",own=p=>p.owner||mo;
   const pfFor=o=>{const m=s.portfolios.find(p=>p.id===s.settings.mainPf);if(m&&own(m)===o)return m.id;const f=s.portfolios.find(p=>own(p)===o);return f?f.id:(m||s.portfolios[0]||{}).id};
   if(!s.settings.hawlPf){s.settings.hawlPf={};Object.entries(s.settings.hawlBy||{}).forEach(([o,v])=>{const id=pfFor(o);if(id&&v)s.settings.hawlPf[id]=v})}
   s.zakatPaid.forEach(z=>{if(!z.pf)z.pf=pfFor(z.owner||mo)});
   const mp=(s.portfolios.find(p=>p.id===s.settings.mainPf)||s.portfolios[0]||{}).id;
   s.debts.forEach(d=>{if(!d.pf&&mp)d.pf=mp})}
  return s;
}
try{const c=localStorage.getItem(LS);if(c){state=normalize(JSON.parse(c));view.tab=state.settings.start||"ozet"}}catch(e){}

/* ---------- money ---------- */
const S=()=>state.settings;
const AUTO=()=>S().autoPrices!==false&&!!market;
const rate=c=>{if(c==="TRY")return 1;if(AUTO()&&market.fx&&+market.fx[c]>0)return +market.fx[c];return +S().rates[c]||0};
const GOLDMAP=[["GAU","gram"],["GRAM","gram"],["CUM","cumhuriyet"],["CUMHURIYET","cumhuriyet"],["RESAT","resat"],["REŞAT","resat"],["HAMIT","hamit"],["AZIZ","aziz"],["ATA","ata"],["CEYREK","ceyrek"],["ÇEYREK","ceyrek"],["YARIM","yarim"],["TAM","tam"]];
function goldKey(h){const sy=(h.symbol||"").toUpperCase().trim();const f=GOLDMAP.find(([k])=>k===sy);if(f)return f[1];
  const n=(h.name||"").toLocaleLowerCase("tr");if(n.includes("gram"))return"gram";if(n.includes("çeyrek"))return"ceyrek";if(n.includes("yarım"))return"yarim";if(n.includes("cumhuriyet"))return"cumhuriyet";if(n.includes("reşat"))return"resat";if(n.includes("hamit"))return"hamit";if(n.includes("aziz"))return"aziz";if(n.includes("ata"))return"ata";if(n.includes("tam"))return"tam";return null}
function effPrice(h){
  if(AUTO()){
    if(h.kind==="altin"){const k=goldKey(h);const v=k&&market.gold&&+market.gold[k];if(v>0&&h.cur==="TRY")return{p:v,auto:true}}
    if(h.kind==="gumus"){const v=market.gold&&+market.gold.gumus;if(v>0&&h.cur==="TRY")return{p:v,auto:true}}
    const sy=(h.symbol||"").toUpperCase().trim();
    const q=market.quotes&&sy&&(market.quotes[h.kind+":"+sy]||(h.kind==="abd"?market.quotes["hisse:"+sy]:null));
    if(q&&+q.p>0&&(!q.cur||q.cur===h.cur))return{p:+q.p,auto:true,t:q.t};
  }
  return{p:+h.price||0,auto:false};
}
const toBase=(a,c)=>{const r=rate(c||"TRY"),b=rate(S().base);return b?(+a||0)*r/b:0};
function fmt(v,cur,opts={}){
  cur=cur||S().base;
  if(S().hide&&!opts.show) return "••••";
  const a=Math.abs(v), d=opts.dec!=null?opts.dec:(a>=1000||Math.abs(a-Math.round(a))<1e-9?0:2);
  try{return new Intl.NumberFormat("tr-TR",{style:"currency",currency:cur,minimumFractionDigits:d,maximumFractionDigits:d}).format(v||0)}catch(e){return (v||0).toFixed(d)+" "+cur}
}
const fmtN=(v,d=2)=>new Intl.NumberFormat("tr-TR",{maximumFractionDigits:d}).format(v||0);
const fmtPct=v=>(v>0?"+":"")+new Intl.NumberFormat("tr-TR",{maximumFractionDigits:1,minimumFractionDigits:1}).format(v||0)+"%";
const fmtDate=d=>{if(!d)return"";const x=new Date(d+"T00:00:00");return x.toLocaleDateString("tr-TR",{day:"numeric",month:"short",year:x.getFullYear()!==new Date().getFullYear()?"numeric":undefined})};
const daysBetween=(a,b)=>Math.round((new Date(b+"T00:00:00")-new Date(a+"T00:00:00"))/864e5);

/* ---------- calcs ---------- */
const hVal=h=>toBase((+h.qty||0)*effPrice(h).p,h.cur);
function fxOf(h,c){if(c==="TRY")return 1;if(h.fxAt&&+h.fxAt[c]>0)return +h.fxAt[c];return rate(c)}
function costIn(h,c){const raw=(+h.qty||0)*(+h.cost||0);if(c===h.cur)return raw;const tl=raw*fxOf(h,h.cur);return tl/(fxOf(h,c)||1)}
const hCost=h=>toBase(costIn(h,"TRY"),"TRY");
const gramPrice=()=>AUTO()&&market.gold&&+market.gold.gram>0?+market.gold.gram:goldInfo().gram;
function eqv(baseVal){const tl=baseVal*rate(S().base);const g=gramPrice();return{USD:rate("USD")?tl/rate("USD"):0,EUR:rate("EUR")?tl/rate("EUR"):0,g:g?tl/g:0}}
/* TL ve dolar bazında kâr/zarar: dolar maliyeti her alımın kendi günündeki kurla */
/* ---------- günlük kâr/zarar ----------
   state.day: bugünün ve bir önceki kayıt gününün birim değerleri (TL) ve dolar kuru.
   Günlük K/Z = miktar × (şimdiki birim değer − önceki günün birim değeri). Bugün alınan varlıkta baz, alış maliyetidir. */
function dayRoll(){
  const d=todayISO();let ch=false;
  const D=state.day=state.day&&state.day.cur?state.day:{d,cur:{},ref:null};
  if(D.d!==d){if(Object.keys(D.cur).length)D.ref={d:D.d,h:D.cur};D.d=d;D.cur={};ch=true}
  const usd=+rate("USD").toFixed(4),live=new Set();
  state.portfolios.forEach(p=>p.holdings.forEach(h=>{if(!(+h.qty>0))return;live.add(h.id);
    const u=+(effPrice(h).p*rate(h.cur)).toFixed(6),o=D.cur[h.id];
    if(!o||o.u!==u||o.s!==usd){D.cur[h.id]={u,s:usd};ch=true}}));
  Object.keys(D.cur).forEach(id=>{if(!live.has(id)){delete D.cur[id];ch=true}});
  return ch;
}
const dayRef=()=>state.day&&state.day.ref&&state.day.d===todayISO()?state.day.ref:null;
function dayPL(h){
  const ref=dayRef(),q=+h.qty||0;if(!ref||!(q>0))return null;
  const uNow=effPrice(h).p*rate(h.cur),usd=rate("USD"),r=ref.h[h.id];
  let u0,s0;
  if(r){u0=r.u;s0=r.s}
  else if(h.buyDate&&h.buyDate>ref.d){u0=costIn(h,"TRY")/q;s0=fxOf(h,"USD")}
  else return null;
  if(!(u0>0)||!(s0>0)||!(usd>0))return null;
  return{pl:q*(uNow-u0)/rate(S().base),base:q*u0/rate(S().base),plU:q*(uNow/usd-u0/s0),baseU:q*u0/s0};
}
function daySum(hs){let pl=0,b=0,plU=0,bU=0,n=0;hs.forEach(h=>{const d=dayPL(h);if(d){pl+=d.pl;b+=d.base;plU+=d.plU;bU+=d.baseU;n++}});return n?{pl,pct:b?pl/b*100:0,plU,pctU:bU?plU/bU*100:0}:null}
const dayLabel=()=>{const r=dayRef();if(!r)return"";const g=daysBetween(r.d,todayISO());return g<=1?"bugün":"son "+g+" günde"};
const plMode=()=>S().plMode==="day"?"day":"total";
/* Tutarın hemen altındaki iki rozet: Günlük ve Toplam kâr/zarar. Para birimi karttaki ₺/$ seçiciyle değişir.
   Rozete dokunmak, varlık tablosundaki K/Z sütununun günlük mü toplam mı olacağını seçer. */
const plCur=()=>S().plCur==="USD"?"USD":"TRY";
const curSeg=()=>`<div class="curseg h" role="group" aria-label="Kâr/zarar para birimi">${[["TRY","₺"],["USD","$"]].map(([k,l])=>`<button data-act="plcur" data-k="${k}" aria-pressed="${plCur()===k}" aria-label="${k==="TRY"?"Türk lirası":"Dolar"}">${l}</button>`).join("")}</div>`;
function plChips(hs,v,c){
  if(!hs.length)return"";
  const usd=plCur()==="USD",day=plMode()==="day",cur=usd?"USD":S().base;
  const vU=rate("USD")?v*rate(S().base)/rate("USD"):0,cU=hs.reduce((a,h)=>a+costIn(h,"USD"),0);
  const tot=usd?{pl:vU-cU,pct:cU?(vU-cU)/cU*100:0}:{pl:v-c,pct:c?(v-c)/c*100:0};
  const d=daySum(hs),dd=d?(usd?{pl:d.plU,pct:d.pctU}:{pl:d.pl,pct:d.pct}):null;
  const chip=(k,label,x,on)=>`<button class="delta ${x?(x.pl>=0?"up":"down"):""}" data-act="plmode" data-k="${k}" aria-pressed="${on}" aria-label="${label} kâr/zarar; varlık tablosunda göster"><small>${label}</small>${x?`<b>${x.pl>=0?"▲":"▼"} ${S().hide?"••••":fmt(Math.abs(x.pl),cur,{dec:0})}</b><span>%${fmtN(Math.abs(x.pct),x===dd?2:1)}</span>`:`<b>—</b><span>yarın</span>`}</button>`;
  const dl=d&&dayLabel()!=="bugün"?"Son "+dayLabel().replace(/^son /,""):"Günlük";
  return `<div class="plchips">${chip("day",dl,dd,day)}${chip("total","Toplam",tot,!day)}</div>`;
}
function eqvChips(baseVal){const e=eqv(baseVal);if(S().hide)return`<div class="eqv"><span>≈ ••••</span></div>`;return `<div class="eqv"><span>${fmt(e.USD,"USD",{dec:0})}</span><span>${fmt(e.EUR,"EUR",{dec:0})}</span>${e.g?`<span>${fmtN(e.g,1)} g altın</span>`:""}</div>`}
const eyeBtn=()=>`<button class="icon-btn" data-act="hide" aria-label="${S().hide?"Tutarları göster":"Tutarları gizle"}" aria-pressed="${S().hide}">${S().hide?I.eyeOff:I.eye}</button>`;
function eqvLine(baseVal){const e=eqv(baseVal);if(S().hide)return"≈ •••• ";return "≈ "+fmt(e.USD,"USD",{dec:0})+" · "+fmt(e.EUR,"EUR",{dec:0})+(e.g?" · "+fmtN(e.g,1)+" g altın":"")}
/* Gelir-gider bakiyesi: ana portföyün nakdi sayılır.
   Bakiye = başlangıç + gelirler − giderler (bugüne kadar). Kartla yapılan harcama gider sayıldığı için
   ödenmemiş kart borcu kendiliğinden düşülmüş olur; kart ödemesi tekrar düşülmez. */
const cashOn=()=>S().cashLink!==false&&!!mainPf();
function cashBal(){
  const s=S(),from=s.cashStartDate||"",t=todayISO();let b=toBase(+s.cashStart||0,s.cashStartCur||"TRY");
  state.tx.forEach(x=>{if(!x.date||x.date>t||(from&&x.date<from))return;if(x.type==="in")b+=toBase(x.amount,x.cur);else if(x.type==="out")b-=toBase(x.amount,x.cur)});
  return b;
}
const isMainPf=p=>!!p&&mainPf()===p;
function pfTotals(p){let v=0,c=0;p.holdings.forEach(h=>{v+=hVal(h);c+=hCost(h)});return{v,c,pl:v-c,plp:c?(v-c)/c*100:0}}
const MAIN=()=>S().mainOwner||"Ben";
const ownerOf=p=>p.owner||MAIN();
const mainPf=()=>state.portfolios.find(p=>p.id===S().mainPf)||state.portfolios[0]||null;
function owners(){const o=[MAIN()];state.portfolios.forEach(p=>{const x=ownerOf(p);if(!o.includes(x))o.push(x)});return o}
const getHawl=id=>(S().hawlPf||{})[id]||null;
function setHawl(id,v){S().hawlPf=S().hawlPf||{};if(v)S().hawlPf[id]=v;else delete S().hawlPf[id]}
/* zekât hesabı portföy bazında; zOwner seçili portföyün kimliğini döndürür */
const zOwner=()=>{if(!view.zOwner||!state.portfolios.some(p=>p.id===view.zOwner))view.zOwner=(mainPf()||{}).id||"";return view.zOwner};
const pfName=id=>{const p=state.portfolios.find(x=>x.id===id);return p?p.name+(owners().length>1?" ("+ownerOf(p)+")":""):"Portföy"};
function allHoldings(pfId,owner){return state.portfolios.filter(p=>(pfId==="all"||p.id===pfId)&&(!owner||owner==="all"||ownerOf(p)===owner)).flatMap(p=>p.holdings.map(h=>({...h,_pf:p})))}
const debtPaid=d=>d.payments.reduce((s,p)=>s+(+p.amount||0),0);
const debtLeft=d=>Math.max(0,(+d.amount||0)-debtPaid(d));
function debtSum(dir,pf){return state.debts.filter(d=>d.dir===dir&&(!pf||(d.pf||(mainPf()||{}).id)===pf)).reduce((s,d)=>s+toBase(debtLeft(d),d.cur),0)}
function monthTx(m){return state.tx.filter(t=>(t.date||"").slice(0,7)===m)}
function monthSum(m){let i=0,o=0;monthTx(m).forEach(t=>{const v=toBase(t.amount,t.cur);if(t.type==="in")i+=v;else if(t.type==="out")o+=v});return{i,o}}
const dim=(y,m)=>new Date(y,m,0).getDate();
function dayIn(month,day){const[y,m]=month.split("-").map(Number);return month+"-"+String(Math.min(+day||1,dim(y,m))).padStart(2,"0")}
const cardById=id=>state.cards.find(c=>c.id===id);
function cardBal(c){const t=todayISO();let sp=0,pd=0;state.tx.forEach(x=>{if(x.type==="out"&&x.method===c.id&&x.date<=t)sp+=toBase(x.amount,x.cur);if(x.type==="card"&&x.card===c.id)pd+=toBase(x.amount,x.cur)});return{sp,pd,bal:sp-pd}}
function nextDue(day){const t=todayISO();let d=dayIn(t.slice(0,7),day);if(d<t){const[y,m]=t.slice(0,7).split("-").map(Number);const n=new Date(y,m,1);d=dayIn(n.getFullYear()+"-"+String(n.getMonth()+1).padStart(2,"0"),day)}return d}
const recPaid=(r,month)=>state.tx.find(x=>x.rid===r.id&&(x.date||"").slice(0,7)===month);
function hawl(o){
  const h=getHawl(o||zOwner()), t=todayISO();
  if(!h)return null;
  let y=h.y, start=fromH(y,h.m,h.d)||t, next=fromH(y+1,h.m,h.d)||addDays(start,354), i=0;
  while(next<=t&&i++<200){y++;start=next;next=fromH(y+1,h.m,h.d)||addDays(start,354)}
  return{start,next,left:daysBetween(t,next),total:Math.max(1,daysBetween(start,next)),started:start<=t};
}
function goldInfo(){
  if(AUTO()&&market.gold&&+market.gold.resatAlis>0)return{gram:+market.gold.resatAlis/7.2,coin:{k:"resatAlis",n:"Reşat altın alışı"+(market.gold.resatKaynak?", "+market.gold.resatKaynak:""),v:+market.gold.resatAlis}};
  const c=Object.assign({},S().coins||{});
  if(AUTO()&&market.gold)COINS.forEach(([k])=>{if(+market.gold[k]>0)c[k]=+market.gold[k]});
  let best=null;
  COINS.forEach(([k,n])=>{const v=+c[k]||0;if(v>0&&(!best||v<best.v))best={k,n,v}});
  return best?{gram:best.v/7.2,coin:best}:{gram:0,coin:null};
}
function addDays(d,n){const x=new Date(d+"T00:00:00");x.setDate(x.getDate()+n);return new Date(x.getTime()-x.getTimezoneOffset()*6e4).toISOString().slice(0,10)}
function zakat(o){
  o=o||zOwner();
  const s=S(); const byKind={}; let assets=0;const isMain=!!mainPf()&&mainPf().id===o;
  state.portfolios.filter(p=>p.id===o).forEach(p=>p.holdings.forEach(h=>{if(s.zakatKinds[h.kind]){const v=hVal(h);byKind[h.kind]=(byKind[h.kind]||0)+v;assets+=v}}));
  const recv=s.zakatRecv?debtSum("lent",o):0, debt=s.zakatDebt?debtSum("borrowed",o):0;
  const cash=isMain&&cashOn()&&s.zakatCash!==false?cashBal():0;
  const net=assets+cash+recv-debt;
  const gi=goldInfo();
  const nisab=toBase((+s.nisabGram||0)*gi.gram,"TRY");
  const netGram=gi.gram?(net*rate(s.base))/gi.gram:0;
  const due=net>=nisab&&nisab>0?net*0.025:0;
  const h=hawl(o);
  const paid=!h?0:state.zakatPaid.filter(z=>z.pf===o&&z.date>=h.start&&z.date<h.next).reduce((a,z)=>a+toBase(z.amount,z.cur),0);
  return{byKind,assets,cash,recv,debt,net,nisab,due,paid,left:Math.max(0,due-paid),hawl:h,reached:net>=nisab&&nisab>0,gold:gi,netGram,owner:o,isMain};
}

/* ---------- persistence ---------- */
function cacheLocal(){try{localStorage.setItem(LS,JSON.stringify(state))}catch(e){}notifSnap()}
/* ---------- değer geçmişi: her portföy için günde bir kayıt [tarih, değer TL, maliyet TL, dolar kuru, gram altın] ---------- */
function snapshot(){
  if(!state||!ready)return false;
  const d=todayISO(),usd=rate("USD"),g=gramPrice();let ch=dayRoll();
  state.hist=state.hist||{};
  const live=new Set(state.portfolios.map(p=>p.id));
  Object.keys(state.hist).forEach(k=>{if(!live.has(k)){delete state.hist[k];ch=true}});
  state.portfolios.forEach(p=>{
    if(/\(örnek\)/.test(p.name||"")&&!p.holdings.length)return;
    const t=pfTotals(p),b=rate(S().base),v=Math.round(t.v*b),c=Math.round(t.c*b);
    if(!(v>0)&&!(state.hist[p.id]||[]).length)return;
    const a=state.hist[p.id]=state.hist[p.id]||[],last=a[a.length-1],row=[d,v,c,+usd.toFixed(4),Math.round(g)];
    if(last&&last[0]===d){if(last[1]!==v||last[2]!==c){a[a.length-1]=row;ch=true}}
    else{a.push(row);if(a.length>1500)a.splice(0,a.length-1500);ch=true}
  });
  return ch;
}
/* fiyat güncellenince ya da gün değişince: kayıt değiştiyse sessizce kaydet */
function snapshotSave(){if(snapshot()){state.updatedAt=Date.now();cacheLocal();scheduleSave();return true}return false}
function histSeries(ids,unit,range){
  const by={};
  ids.forEach(id=>(state.hist&&state.hist[id]||[]).forEach(r=>{const o=by[r[0]]=by[r[0]]||{v:0,c:0,usd:r[3],g:r[4]};o.v+=r[1];o.c+=r[2]}));
  let rows=Object.keys(by).sort().map(d=>({d,...by[d]}));
  if(range&&range!=="all"){const from=addDays(todayISO(),-range);rows=rows.filter(r=>r.d>=from)}
  const conv=r=>unit==="USD"?(r.usd?r.v/r.usd:0):unit==="GAU"?(r.g?r.v/r.g:0):r.v;
  return rows.map(r=>({d:r.d,y:conv(r)}));
}
/* büyük tutar: para birimi simgesi küçük ve soluk */
const money=(v,cur,o)=>fmt(v,cur,o).replace(/([₺$€])/,'<span class="cur">$1</span>');
function histSum(ids){const by={};ids.forEach(id=>(state.hist&&state.hist[id]||[]).forEach(r=>{by[r[0]]=(by[r[0]]||0)+r[1]}));return Object.keys(by).sort().map(d=>({d,y:by[d]}))}
/* bir önceki kayıt gününe göre değişim rozeti */
/* toplam kartının içindeki ince eğilim çizgisi (son 60 kayıt) */
let sparkDrawn=false;
function spark(ids){
  const a=histSum(ids).slice(-60);if(a.length<3)return"";
  const W=300,H=56,ys=a.map(p=>p.y),mn=Math.min(...ys),mx=Math.max(...ys),sp=(mx-mn)||1;
  const X=i=>(W*i/(a.length-1)).toFixed(1),Y=v=>(4+(H-8)*(1-(v-mn)/sp)).toFixed(1);
  const d=a.map((p,i)=>(i?"L":"M")+X(i)+" "+Y(p.y)).join(" ");
  const first=!sparkDrawn;sparkDrawn=true;
  return `<svg class="hero-spark${first?" draw":""}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><path d="${d} L${W} ${H} L0 ${H} Z" fill="url(#sg)"/><path class="ln" d="${d}" pathLength="1" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>`;
}
function histCard(ids,title){
  const unit=view.hUnit||"TRY",range=view.hRange||90;
  const all=histSeries(ids,unit,"all"),pts=histSeries(ids,unit,range);
  const segU=`<div class="seg" role="group" aria-label="Birim">${[["TRY","₺"],["USD","$"],["GAU","g altın"]].map(([k,l])=>`<button data-act="hunit" data-k="${k}" aria-pressed="${unit===k}">${l}</button>`).join("")}</div>`;
  const segR=`<div class="seg" role="group" aria-label="Dönem">${[[30,"1A"],[90,"3A"],[365,"1Y"],["all","Tümü"]].map(([k,l])=>`<button data-act="hrange" data-k="${k}" aria-pressed="${String(range)===String(k)}">${l}</button>`).join("")}</div>`;
  const fu=v=>unit==="GAU"?fmtN(v,1)+" g":fmt(v,unit,{dec:0});
  let body;
  if(all.length<2)body=`<div class="sub">Grafik günlük kayıtlardan oluşur. İlk kayıt bugün alındı; uygulamayı açtığınız her gün yeni bir nokta eklenir.</div>`;
  else if(pts.length<2)body=`<div class="sub">Bu dönemde yeterli kayıt yok. Daha uzun bir dönem seçin.</div>`;
  else{
    const W=640,H=200,pl=6,pr=6,pt=14,pb=24,ys=pts.map(p=>p.y),mn=Math.min(...ys),mx=Math.max(...ys),sp=(mx-mn)||Math.abs(mx)||1,lo=mn-sp*.12,hi=mx+sp*.12;
    const t0=new Date(pts[0].d).getTime(),t1=new Date(pts[pts.length-1].d).getTime()||t0+1;
    const X=p=>pl+(W-pl-pr)*((new Date(p.d).getTime()-t0)/((t1-t0)||1)),Y=p=>pt+(H-pt-pb)*(1-(p.y-lo)/(hi-lo));
    const line=pts.map((p,i)=>(i?"L":"M")+X(p).toFixed(1)+" "+Y(p).toFixed(1)).join(" ");
    const first=pts[0],last=pts[pts.length-1],chg=last.y-first.y,pct=first.y?chg/first.y*100:0,up=chg>=0;
    const col=up?"var(--pos)":"var(--neg)";
    body=`<div class="hist-top"><div><div class="num hist-val ${up?"pos-t":"neg-t"}">${S().hide?"••••":(up?"+":"")+fu(chg)} <small>${fmtPct(pct)}</small></div><div class="sub">${fmtDate(first.d)} – ${fmtDate(last.d)} arası değişim</div></div></div>
    <svg class="hist" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${esc(title)}: ${fmtDate(first.d)} ile ${fmtDate(last.d)} arası değişim ${fmtPct(pct)}">
      <defs><linearGradient id="hg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".22"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>
      ${[0,.5,1].map(f=>`<line x1="${pl}" x2="${W-pr}" y1="${(pt+(H-pt-pb)*f).toFixed(1)}" y2="${(pt+(H-pt-pb)*f).toFixed(1)}" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/>`).join("")}
      <path d="${line} L${X(last).toFixed(1)} ${H-pb} L${X(first).toFixed(1)} ${H-pb} Z" fill="url(#hg)"/>
      <path d="${line}" fill="none" stroke="${col}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
    </svg>
    <div class="hist-x"><span>${fmtDate(first.d)}</span><span>en düşük ${S().hide?"••":fu(mn)} · en yüksek ${S().hide?"••":fu(mx)}</span><span>${fmtDate(last.d)}</span></div>`;
  }
  const CH=`<svg class="chev" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`;
  let sum=`<span class="sub">kayıt birikiyor</span>`;
  if(pts.length>=2){const f=pts[0],l=pts[pts.length-1],c=l.y-f.y,pc=f.y?c/f.y*100:0;sum=`<span class="num ${c>=0?"pos-t":"neg-t"}">${S().hide?"••••":(c>=0?"+":"")+fu(c)} <small>${fmtPct(pc)}</small></span>`}
  if(!view.histOpen)return `<section class="card fold"><button class="foldh" data-act="histtoggle" aria-expanded="false"><h2>${esc(title)}</h2>${sum}${CH}</button></section>`;
  return `<section class="card fold open"><div class="sec" style="margin-bottom:10px;flex-wrap:wrap"><button class="foldh" data-act="histtoggle" aria-expanded="true" style="width:auto"><h2>${esc(title)}</h2>${CH}</button>${segU}</div>${body}${all.length>=2?`<div style="margin-top:12px">${segR}</div>`:""}</section>`;
}
function commit(msg){snapshot();state.updatedAt=Date.now();lastLocalWrite=state.updatedAt;cacheLocal();applyPrefs();render();if(msg)toast(msg);scheduleSave();syncWatch()}
function watchItems(){const seen={},out=[];state.portfolios.filter(p=>!/\(örnek\)/.test(p.name||"")).forEach(p=>p.holdings.forEach(h=>{if(+h.qty>0&&PRICED.includes(h.kind)&&h.symbol){const s=h.symbol.toUpperCase().trim(),k=h.kind+":"+s;if(/^[A-Z0-9.\-]{1,12}$/.test(s)&&!seen[k]){seen[k]=1;out.push({k:h.kind,s,c:h.cur})}}}));return out}
/* İzlenen kodlar: giriş yapıldıysa ortak izleme listesine eklenir; fiyat işi (GitHub Actions) bu listeyi okur. */
async function syncWatch(){
  ensureFx();
  if(!state)return;
  const items=watchItems(),j=JSON.stringify(items.map(i=>i.k+":"+i.s).sort());
  if(j===lastWatch)return;
  let known=[];try{known=JSON.parse(lastWatch||"[]")}catch(e){}
  const fresh=items.filter(i=>!known.includes(i.k+":"+i.s));
  if(!fresh.length){lastWatch=j;try{localStorage.setItem(WK,j)}catch(e){}return}
  if(!sb||!sbUser)return;
  try{
    const{error}=await sb.from("emanet_watch").upsert(fresh.map(i=>({kind:i.k,symbol:i.s,cur:i.c})),{onConflict:"kind,symbol",ignoreDuplicates:true});
    if(error)return;
    lastWatch=j;try{localStorage.setItem(WK,j)}catch(e){}
    if(S().autoPrices!==false&&fresh.some(i=>!(market&&market.quotes&&market.quotes[i.k+":"+i.s])))toast("Yeni ürünün fiyatı en geç yarım saat içinde gelir");
  }catch(e){}
}
/* Geçmiş tarihli alımlar için o günün kuru (Avrupa Merkez Bankası referans kuru, frankfurter.dev) */
async function fxFetch(d){
  const urls=["https://api.frankfurter.dev/v1/"+d+"?base=USD&symbols=TRY,EUR","https://api.frankfurter.app/"+d+"?from=USD&to=TRY,EUR"];
  for(const u of urls){try{const r=await fetch(u);if(!r.ok)continue;const j=await r.json();const usd=+(j.rates||{}).TRY,e=+(j.rates||{}).EUR;if(usd>0)return{USD:usd,EUR:e>0?usd/e:0,src:"AMB kuru "+(j.date||d)}}catch(e){}}
  return null;
}
async function ensureFx(){
  if(fxBusy||!state)return;
  const dates=[...new Set(state.portfolios.flatMap(p=>p.holdings).flatMap(pendingFxDates))].filter(d=>!fxhist[d]).slice(0,20);
  if(!dates.length)return;
  fxBusy=true;let n=0;
  for(const d of dates){const f=await fxFetch(d);if(f){fxhist[d]=f;n++}}
  fxBusy=false;
  if(n){try{localStorage.setItem(FXK,JSON.stringify(fxhist))}catch(e){}fillFx()}
}
/* ---------- alış günü kuru ----------
   Her alım işlemi kendi gününün kurunu taşır (t.fx). Varlığın alış kuru (h.fxAt),
   alımların TL tutarına göre ağırlıklı ortalamasıdır; satışlar maliyeti orantılı azaltır.
   Böylece dolar maliyeti = her alımın TL tutarı ÷ o günün dolar kuru toplamıdır. */
function fxLookup(d){
  if(!d||d>todayISO())return null;
  if(d===todayISO())return{USD:rate("USD"),EUR:rate("EUR"),src:"Güncel kur ("+fmtDate(d)+")"};
  const f=fxhist[d];if(f&&+f.USD>0)return{USD:+f.USD,EUR:+f.EUR||0,src:f.src||("Kur "+d)};
  return null;
}
const buysOf=h=>(h.trades||[]).filter(t=>t.type==="buy");
function pendingFxDates(h){
  const t=todayISO(),b=buysOf(h);
  if(b.length>=2)return b.filter(x=>!x.fx&&x.date&&x.date<t&&!fxhist[x.date]).map(x=>x.date);
  return h.buyDate&&!h.fxAt&&h.buyDate<t&&!fxhist[h.buyDate]?[h.buyDate]:[];
}
const fxWaiting=h=>(!h.fxAt&&!!h.buyDate&&h.buyDate<todayISO())||!!(h.fxAt&&h.fxAt.pending);
function recalcFx(h){
  const b=buysOf(h);
  if(b.length<2){
    if(!h.buyDate){h.fxAt=null;return}
    if(h.fxAt&&!h.fxAt.pending&&!h.fxAt.multi&&(!h.fxAt.date||h.fxAt.date===h.buyDate))return;
    const t0=b[0]&&b[0].date===h.buyDate?b[0]:null;
    const f=(t0&&t0.fx)||fxLookup(h.buyDate);
    if(f&&t0&&!t0.fx)t0.fx=f;
    h.fxAt=f?{USD:+f.USD,EUR:+f.EUR||0,src:f.src,date:h.buyDate}:null;return;
  }
  const tr=(h.trades||[]).slice().sort((a,c)=>(a.date||"").localeCompare(c.date||""));
  let q=0,T=0,U=0,E=0,pend=false;
  tr.forEach(t=>{
    if(t.type==="buy"){
      if(!t.fx){const f=fxLookup(t.date);if(f)t.fx=f}
      let f=t.fx;if(!f){pend=true;f={USD:rate("USD"),EUR:rate("EUR")}}
      const amt=(+t.qty||0)*(+t.price||0)+(+t.fee||0);
      const tl=amt*(h.cur==="TRY"?1:(+f[h.cur]||rate(h.cur)));
      T+=tl;U+=f.USD?tl/f.USD:0;E+=+f.EUR?tl/f.EUR:0;q+=+t.qty||0;
    }else if(t.type==="sell"&&q>0){const r=Math.min(1,(+t.qty||0)/q);T*=1-r;U*=1-r;E*=1-r;q-=+t.qty||0}
  });
  h.fxAt=U>0?{USD:T/U,EUR:E>0?T/E:0,src:"Alımların ağırlıklı ortalaması",multi:true,pending:pend||undefined}:null;
}
/* ---------- Yİ-ÜFE ile endeksleme ----------
   Maliyet, alış ayından bir önceki ayın endeksinden son yayımlanan aya (bugünden bir önceki ay) taşınır. */
const prevMonth=d=>{const[y,m]=d.slice(0,7).split("-").map(Number);return new Date(Date.UTC(y,m-2,1)).toISOString().slice(0,7)};
const fmtYM=ym=>{const[y,m]=ym.split("-").map(Number);return MONTHS[m-1]+" "+y};
const ufeAt=ym=>ufe&&ufe.idx&&+ufe.idx[ym]||0;
function ufeEnd(){const want=prevMonth(todayISO()),l=ufe&&ufe.latest;const ym=l&&l<want?l:want;return{ym,v:ufeAt(ym)}}
function ufeRatio(date){if(!date)return null;const b=prevMonth(date),e=ufeEnd();if(!e.v)return null;if(b>=e.ym)return 1;const bv=ufeAt(b);return bv?e.v/bv:null}
function ufeInfo(h){
  const b=buysOf(h);let r=null,from=null;
  if(b.length&&b.every(t=>t.date)){
    const tr=(h.trades||[]).slice().sort((a,c)=>(a.date||"").localeCompare(c.date||""));
    let q=0,T=0,X=0;
    for(const t of tr){
      if(t.type==="buy"){const amt=(+t.qty||0)*(+t.price||0)+(+t.fee||0);const fx=h.cur==="TRY"?1:((t.fx&&+t.fx[h.cur])||fxOf(h,h.cur));const tl=amt*fx;const k=ufeRatio(t.date);if(k==null)return null;T+=tl;X+=tl*k;q+=+t.qty||0;if(!from||t.date<from)from=t.date}
      else if(t.type==="sell"&&q>0){const s=Math.min(1,(+t.qty||0)/q);T*=1-s;X*=1-s;q-=+t.qty||0}
    }
    r=T>0?X/T:null;
  }else if(h.buyDate){r=ufeRatio(h.buyDate);from=h.buyDate}
  if(r==null)return null;
  const tl=costIn(h,"TRY");return{ratio:r,costTL:tl*r,cost:toBase(tl*r,"TRY"),from:prevMonth(from),to:ufeEnd().ym,multi:b.length>1};
}
function ufeSum(hs){let c=0,v=0,n=0;hs.forEach(h=>{const u=ufeInfo(h);if(u){c+=u.cost;v+=hVal(h)}else n++});return{c,v,n,pl:v-c,plp:c?(v-c)/c*100:0}}
/* ---------- işlem defteri: miktar, ortalama maliyet ve gerçekleşen K/Z işlemlerden hesaplanır ---------- */
const byDate=(a,c)=>(a.date||"").localeCompare(c.date||"");
function tradeQty(h){let q=0;(h.trades||[]).slice().sort(byDate).forEach(t=>{q+=t.type==="buy"?(+t.qty||0):-(+t.qty||0)});return q}
function ensureTrades(h){
  h.trades=h.trades||[];
  const sold=h.trades.filter(t=>t.type==="sell").reduce((s,t)=>s+(+t.qty||0),0);
  if(!buysOf(h).length){
    if(!(+h.qty>0)&&!sold)return;
    const first=h.trades.map(t=>t.date).filter(Boolean).sort()[0];
    h.trades.unshift({id:uid(),type:"buy",date:h.buyDate||first||"",qty:(+h.qty||0)+sold,price:+h.cost||0,fee:0,legacy:true,fx:h.fxAt&&!h.fxAt.pending&&!h.fxAt.multi?{USD:+h.fxAt.USD,EUR:+h.fxAt.EUR||0,src:h.fxAt.src}:undefined});
    h.realizedLegacy=0;return;
  }
  /* elle düzenlenmiş eski kayıt: işlemler miktarı tutmuyorsa tek açılış kaydına indir */
  if(Math.abs(tradeQty(h)-(+h.qty||0))>1e-9){
    h.realizedLegacy=+h.realized||0;
    h.trades=+h.qty>0?[{id:uid(),type:"buy",date:h.buyDate||"",qty:+h.qty,price:+h.cost||0,fee:0,legacy:true,fx:h.fxAt&&!h.fxAt.pending?{USD:+h.fxAt.USD,EUR:+h.fxAt.EUR||0,src:h.fxAt.src}:undefined}]:[];
  }
}
function rebuild(h){
  const tr=(h.trades||[]).slice().sort(byDate);let q=0,c=0,real=+h.realizedLegacy||0;
  for(const t of tr){
    const tq=+t.qty||0,amt=tq*(+t.price||0);
    if(t.type==="buy"){c=(q*c+amt+(+t.fee||0))/(q+tq);q+=tq}
    else{if(tq>q+1e-9)return fmtDate(t.date)+" tarihli satış, o tarihte elinizdeki miktardan fazla.";const gross=amt-(+t.fee||0)-tq*c;const tax=t.taxAmt!=null&&t.taxAmt!==""?+t.taxAmt||0:Math.max(0,gross)*(+t.taxRate||0)/100;t.tax=tax;const pl=gross-tax;t.pl=pl;real+=pl;q-=tq}
  }
  h.qty=Math.max(0,q);if(tr.some(t=>t.type==="buy"))h.cost=c;h.realized=real;
  const bd=buysOf(h).map(t=>t.date).filter(Boolean).sort()[0];if(bd)h.buyDate=bd;
  h.fxAt=null;recalcFx(h);return null;
}
const hKey=h=>h.kind==="bes"?"bes|"+h.id:[h.kind,h.cur,(h.symbol||"").toLocaleUpperCase("tr").trim()||(h.kind==="altin"&&goldKey(h))||trLow(h.name).trim()].join("|");
function mergeInto(a,b){
  const snapA=JSON.stringify(a);ensureTrades(a);ensureTrades(b);
  a.trades=a.trades.concat(b.trades||[]);a.realizedLegacy=(+a.realizedLegacy||0)+(+b.realizedLegacy||0);
  if(!a.symbol&&b.symbol)a.symbol=b.symbol;
  const err=rebuild(a);if(err){Object.assign(a,JSON.parse(snapA));return false}return true;
}
function mergeDuplicates(){
  let n=0;
  state.portfolios.forEach(p=>{const seen={};p.holdings=p.holdings.filter(h=>{const k=hKey(h);const a=seen[k];if(a&&mergeInto(a,h)){n++;return false}if(!a)seen[k]=h;return true})});
  return n;
}
function fillFx(){
  if(!ready||!state)return;let n=0;setTimeout(ensureFx,0);
  const merged=mergeDuplicates();
  state.portfolios.forEach(p=>p.holdings.forEach(h=>{const before=JSON.stringify([h.fxAt,h.trades]);recalcFx(h);if(JSON.stringify([h.fxAt,h.trades])!==before)n++}));
  if(merged)commit(merged+" tekrar eden varlık tek satırda birleştirildi");
  else if(n)commit(n+" varlığın alış günü kuru güncellendi");
}
function marketWhen(){if(!market||!market.updatedAt)return"";const d=new Date(market.updatedAt);return d.toLocaleDateString("tr-TR",{day:"numeric",month:"short"})+" "+d.toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"})}

/* ---------- piyasa verisi ----------
   Fiyatlar depodaki data/market.json dosyasından okunur; dosyayı .github/workflows/prices.yml yarım saatte bir günceller. */
function marketUrls(){
  const u=[];if(CFG.marketUrl)u.push(CFG.marketUrl);
  const m=location.hostname.match(/^([^.]+)\.github\.io$/),repo=location.pathname.split("/").filter(Boolean)[0];
  if(m&&repo&&!/\.html?$/.test(repo))u.push("https://raw.githubusercontent.com/"+m[1]+"/"+repo+"/"+(CFG.branch||"main")+"/data/market.json");
  u.push("data/market.json");return u;
}
async function getJSON(url){const r=await fetch(url+(url.includes("?")?"&":"?")+"t="+Math.floor(Date.now()/6e4),{cache:"no-store"});if(!r.ok)throw new Error(String(r.status));return r.json()}
async function loadMarket(announce){
  let got=null;
  for(const u of marketUrls()){try{const d=await getJSON(u);if(d&&d.updatedAt){got=d;break}}catch(e){}}
  if(!got){if(announce)toast("Fiyat dosyasına ulaşılamadı; internet bağlantınızı kontrol edin");return}
  const changed=!market||market.updatedAt!==got.updatedAt;
  market=got;try{localStorage.setItem(MK,JSON.stringify(got))}catch(e){}
  if(changed&&ready){snapshotSave();render();fillFx()}
  if(announce)toast(changed?"Fiyatlar güncellendi":"Fiyatlar güncel · "+marketWhen());
}
let bench=null;
async function loadBench(){for(const u of marketUrls().map(x=>x.replace("market.json","bench.json"))){try{const d=await getJSON(u);if(d&&d.xu100){bench=d;if(ready&&view.tab==="portfoy")render();return}}catch(e){}}}
async function loadUfe(){try{const d=await getJSON("data/ufe.json");if(d&&d.idx){ufe=d;if(ready)render()}}catch(e){}}
async function refreshNow(btn){btn.disabled=true;btn.textContent="Denetleniyor…";await loadMarket(true);btn.disabled=false;btn.textContent="Şimdi denetle"}

/* ---------- bulut: Supabase (e-posta ile giriş, satır başına bir kullanıcı) ---------- */
/* Eşitleme durumu yalnızca dikkat gerektiğinde görünür (çevrimdışı, kaydedilemedi, buluta ulaşılamadı). */
const QUIET=/^(Bu cihazda tutuluyor|Girişsiz · bu cihazda|Eşitlendi|Eşitleniyor…|Kaydediliyor…|Yükleniyor)$/;
function setSync(kind,text){const el=$("#sync");el.className="sync"+(kind==="cloud"?" cloud":"")+(QUIET.test(text)?" quiet":"");el.querySelector("span").textContent=text}
const cloudOn=()=>!!(sb&&sbUser);
function scheduleSave(){if(!cloudOn())return;clearTimeout(saveTimer);saveTimer=setTimeout(flush,800)}
async function flush(){
  if(!cloudOn()||!state)return;
  if(saving){pendingSave=true;return}
  saving=true;setSync("cloud","Kaydediliyor…");
  let err=null;
  try{const r=await sb.from("emanet_state").upsert({user_id:sbUser.id,data:state,updated_at:state.updatedAt});err=r.error}catch(e){err=e}
  saving=false;
  if(err)setSync("local","Kaydedilemedi · cihazda duruyor");else setSync("cloud","Eşitlendi");
  if(pendingSave){pendingSave=false;flush()}
}
async function pull(first){
  if(!cloudOn()||saving)return;
  let data=null,error=null;
  try{const r=await sb.from("emanet_state").select("data,updated_at").eq("user_id",sbUser.id).maybeSingle();data=r.data;error=r.error}catch(e){error=e}
  if(error){mode="local";setSync("local","Buluta ulaşılamadı · cihazda duruyor");return}
  mode="cloud";
  const rAt=data?+data.updated_at||0:0,lAt=state&&state.updatedAt||0;
  if(data&&rAt>lAt){state=normalize(data.data);cacheLocal();if(first)view.tab=state.settings.start||"ozet";applyPrefs();render();setTimeout(fillFx,0)}
  else if(lAt>rAt)scheduleSave();
  setSync("cloud","Eşitlendi");
}
async function onLogin(user){
  sbUser=user;let owner=null;try{owner=localStorage.getItem(OWN)}catch(e){}
  /* başka bir hesabın önbelleği bu hesaba yüklenmesin */
  if(owner&&owner!==user.id){state=null;try{localStorage.removeItem(LS)}catch(e){}}
  try{localStorage.setItem(OWN,user.id);localStorage.removeItem(GUEST)}catch(e){}
  hideAuth();mode="cloud";setSync("cloud","Eşitleniyor…");
  await pull(true);
  ready=true;applyPrefs();if(state&&state.updatedAt)snapshotSave();render();setTimeout(()=>{fillFx();syncWatch()},0);
}
async function signOut(){
  try{clearTimeout(saveTimer);await flush()}catch(e){}
  try{await sb.auth.signOut()}catch(e){}
  sbUser=null;state=null;try{localStorage.removeItem(LS);localStorage.removeItem(OWN)}catch(e){}
  view.tab="ozet";showAuth();
}
async function boot(){
  loadMarket();loadUfe();loadBench();
  setInterval(()=>{if(!document.hidden)loadMarket()},10*6e4);
  document.addEventListener("visibilitychange",()=>{if(!document.hidden){loadMarket();pull()}});
  const net=()=>{if(!navigator.onLine)setSync("local","Çevrimdışı · değişiklikler cihazda");else if(cloudOn()){pull()}else if(ready)setSync("local",sb?"Girişsiz · bu cihazda":"Bu cihazda tutuluyor")};
  window.addEventListener("offline",net);window.addEventListener("online",net);
  if("serviceWorker" in navigator&&(location.protocol==="https:"||location.hostname==="localhost"))navigator.serviceWorker.register("sw.js").catch(()=>{});
  if(!(CFG.supabaseUrl&&CFG.supabaseKey&&window.supabase)){goLocal();return}
  try{sb=window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseKey)}catch(e){sb=null;goLocal();return}
  sb.auth.onAuthStateChange((ev,session)=>{
    if(ev==="PASSWORD_RECOVERY")setTimeout(newPassSheet,0);
    else if(ev==="SIGNED_IN"&&session&&(!sbUser||sbUser.id!==session.user.id))setTimeout(()=>onLogin(session.user),0);
  });
  let session=null;try{session=(await sb.auth.getSession()).data.session}catch(e){}
  if(session){if(!sbUser)await onLogin(session.user)}
  else{let g=null;try{g=localStorage.getItem(GUEST)}catch(e){}if(g)goLocal("Girişsiz · bu cihazda");else showAuth()}
}
function goLocal(msg){mode="local";ready=true;hideAuth();setSync("local",msg||"Bu cihazda tutuluyor");applyPrefs();if(state&&state.updatedAt)snapshotSave();render();setTimeout(fillFx,0)}

/* ---------- giriş ekranı ---------- */
const AUTH_ERR={"Invalid login credentials":"E-posta veya şifre hatalı.","Email not confirmed":"E-posta adresiniz henüz onaylanmamış. Gelen kutunuzdaki bağlantıya tıklayın.","User already registered":"Bu e-posta ile zaten bir hesap var. Giriş yapın."};
const authMsg=e=>{const m=e&&e.message||"";return AUTH_ERR[m]||(/rate limit/i.test(m)?"Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar deneyin.":/password/i.test(m)?"Şifre en az 6 karakter olmalı.":/fetch|network/i.test(m)?"Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.":"İşlem tamamlanamadı: "+m)};
function hideAuth(){$("#auth").hidden=true}
function showAuth(){
  const el=$("#auth");el.hidden=false;
  el.innerHTML=`<div class="auth-card">
    <div class="auth-brand">${STAR}<b>Emanet</b></div>
    <h2>Birikiminiz, zekâtınız ve bütçeniz tek defterde.</h2>
    <form id="authF" novalidate class="form">
      <div class="field"><label for="auE">E-posta</label><input id="auE" type="email" autocomplete="email" inputmode="email" placeholder="ornek@eposta.com"></div>
      <div class="field"><label for="auP">Şifre</label><div class="pw"><input id="auP" type="password" autocomplete="current-password" placeholder="En az 6 karakter"><button type="button" class="btn ghost sm" id="auShow" aria-pressed="false">Göster</button></div></div>
      <div class="err" id="auErr" role="alert"></div>
      <button class="btn primary" type="submit" id="auIn">Giriş yap</button>
      <button class="btn" type="button" id="auUp">Hesap oluştur</button>
    </form>
    <div class="auth-links"><button class="btn ghost sm" id="auReset">Şifremi unuttum</button><button class="btn ghost sm" id="auGuest">Girişsiz dene</button></div>
    <p class="sub">Verileriniz hesabınıza özel saklanır; başka kimse göremez. Girişsiz denerseniz kayıtlar yalnızca bu cihazda kalır.</p>
  </div>`;
  const E=el.querySelector("#auE"),P=el.querySelector("#auP"),err=el.querySelector("#auErr");
  const say=(t,ok)=>{err.textContent=t;err.classList.toggle("ok",!!ok)};
  const need=pw=>{if(!/^\S+@\S+\.\S+$/.test(E.value.trim())){say("Geçerli bir e-posta adresi girin.");E.focus();return false}if(pw&&P.value.length<6){say("Şifre en az 6 karakter olmalı.");P.focus();return false}return true};
  const busy=(b,on,label)=>{b.disabled=on;if(label)b.textContent=label};
  const back=location.origin+location.pathname;
  el.querySelector("#authF").onsubmit=async e=>{e.preventDefault();if(!need(true))return;const b=el.querySelector("#auIn");busy(b,true,"Giriş yapılıyor…");say("");
    const{data,error}=await sb.auth.signInWithPassword({email:E.value.trim(),password:P.value});busy(b,false,"Giriş yap");
    if(error)say(authMsg(error));else if(data&&data.user&&!sbUser)onLogin(data.user)};
  el.querySelector("#auUp").onclick=async()=>{if(!need(true))return;const b=el.querySelector("#auUp");busy(b,true,"Hesap açılıyor…");say("");
    const{data,error}=await sb.auth.signUp({email:E.value.trim(),password:P.value,options:{emailRedirectTo:back}});busy(b,false,"Hesap oluştur");
    if(error)say(authMsg(error));else if(data&&data.session){if(!sbUser)onLogin(data.session.user)}else say("Onay e-postası gönderildi. Gelen kutunuzdaki bağlantıya tıklayın, sonra giriş yapın.",true)};
  el.querySelector("#auReset").onclick=async()=>{if(!need(false))return;const{error}=await sb.auth.resetPasswordForEmail(E.value.trim(),{redirectTo:back});say(error?authMsg(error):"Şifre yenileme bağlantısı e-posta adresinize gönderildi.",!error)};
  el.querySelector("#auShow").onclick=e=>{const on=P.type==="password";P.type=on?"text":"password";e.currentTarget.textContent=on?"Gizle":"Göster";e.currentTarget.setAttribute("aria-pressed",on)};
  el.querySelector("#auGuest").onclick=()=>{try{localStorage.setItem(GUEST,"1")}catch(e){}goLocal("Girişsiz · bu cihazda")};
}
function newPassSheet(){
  formSheet({title:"Yeni şifre belirleyin",fields:[{id:"pw",label:"Yeni şifre",type:"password",value:"",ph:"En az 6 karakter"}],
    onSave:v=>{if((v.pw||"").length<6)return"Şifre en az 6 karakter olmalı.";sb.auth.updateUser({password:v.pw}).then(r=>toast(r.error?authMsg(r.error):"Şifreniz değiştirildi"))}});
}

/* ---------- prefs ---------- */
function applyPrefs(){
  const r=document.documentElement;
  if(!state){return}
  const s=S();
  if(s.theme==="system")r.removeAttribute("data-app-theme");else r.setAttribute("data-app-theme",s.theme);
  r.setAttribute("data-fs",s.fontSize||"m");
  r.setAttribute("data-accent",s.accent||"kobalt");
  if(s.tone&&s.tone!=="gri")r.setAttribute("data-tone",s.tone);else r.removeAttribute("data-tone");
  r.setAttribute("data-compact",s.compact?"1":"0");
  $("#eyeBtn").innerHTML=s.hide?I.eyeOff:I.eye;
  $("#eyeBtn").setAttribute("aria-pressed",s.hide?"true":"false");
}

/* ---------- icons ---------- */
const STAR=`<svg class="star" viewBox="0 0 48 48" aria-hidden="true"><path fill="currentColor" d="M24 4.2 29.8 10H38v8.2l5.8 5.8-5.8 5.8V38h-8.2L24 43.8 18.2 38H10v-8.2L4.2 24 10 18.2V10h8.2z"/><circle cx="24" cy="24" r="6.5" fill="var(--star-hole,#fff)"/></svg>`;
const sv=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
/* Tek tip ikon seti: 24'lük ızgara, 1.8 çizgi, yuvarlak uç. Hepsi aynı elden; emoji ya da harf yok. */
const I={
  ozet:sv('<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>'),
  portfoy:sv('<path d="M11 4a8.5 8.5 0 1 0 9 9h-9z"/><path d="M14.5 3.2a8 8 0 0 1 6.3 6.3h-6.3z"/>'),
  akis:sv('<path d="M7 20V5M7 5 3.5 8.5M7 5l3.5 3.5M17 4v15M17 19l-3.5-3.5M17 19l3.5-3.5"/>'),
  borc:sv('<path d="M4 8h15M19 8l-3.5-3.5M19 8l-3.5 3.5M20 16H5M5 16l3.5-3.5M5 16l3.5 3.5"/>'),
  zekat:sv('<circle cx="14.5" cy="6.5" r="3"/><path d="M3 14h3l3.2-1.5a3 3 0 0 1 2.4-.1l3.2 1.3a1.5 1.5 0 0 1-.6 2.9H11"/><path d="M14.6 16.4l4.4-2a1.55 1.55 0 0 1 1.4 2.8l-5.6 3.1a4 4 0 0 1-3 .3L6 19H3"/>'),
  plus:sv('<path d="M12 5v14M5 12h14"/>'),
  x:sv('<path d="M6 6l12 12M18 6 6 18"/>'),
  check:sv('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  trash:sv('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>'),
  eye:sv('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  eyeOff:sv('<path d="M3 3l18 18M10.6 5.1A9.8 9.8 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.6 9.6 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>'),
  left:sv('<path d="M15 6l-6 6 6 6"/>'),right:sv('<path d="M9 6l6 6-6 6"/>'),
  edit:sv('<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>'),
  buy:sv('<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/>'),
  sell:sv('<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 19.5h14"/>'),
  card:sv('<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h3"/>'),
  wallet:sv('<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H17v3"/><path d="M4 7.5V17a2.5 2.5 0 0 0 2.5 2.5H20V8H6.5A2.5 2.5 0 0 1 4 7.5z"/><path d="M16 13.75h.01"/>'),
  repeat:sv('<path d="M4 11V9.5A3.5 3.5 0 0 1 7.5 6H19M19 6l-3-3M19 6l-3 3M20 13v1.5a3.5 3.5 0 0 1-3.5 3.5H5M5 18l3-3M5 18l3 3"/>'),
  target:sv('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><path d="M12 12h.01"/>'),
  home:sv('<path d="M4 11l8-6.5 8 6.5"/><path d="M6 9.5v10h12v-10"/><path d="M10 19.5v-5h4v5"/>'),
  cart:sv('<path d="M3 4h2.5l2.2 10.5h9.8l2-7.5H6.5"/><circle cx="9" cy="18.5" r="1.4"/><circle cx="16.5" cy="18.5" r="1.4"/>'),
  bolt:sv('<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/>'),
  car:sv('<path d="M5 17v-5l1.8-4.6A2 2 0 0 1 8.7 6h6.6a2 2 0 0 1 1.9 1.4L19 12v5"/><path d="M5 12h14M4 17h16M6.5 17v2M17.5 17v2M8 14.5h.01M16 14.5h.01"/>'),
  book:sv('<path d="M5 4.5h10.5A2.5 2.5 0 0 1 18 7v13H7.5A2.5 2.5 0 0 1 5 17.5z"/><path d="M5 17.5A2.5 2.5 0 0 1 7.5 15H18"/>'),
  health:sv('<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8.5v7M8.5 12h7"/>'),
  child:sv('<circle cx="12" cy="12" r="8.5"/><path d="M8.5 14a4 4 0 0 0 7 0M9 9.8h.01M15 9.8h.01"/>'),
  shirt:sv('<path d="M8.5 4 4 7l2 3.5 2-1V20h8V9.5l2 1L20 7l-4.5-3a3.5 3.5 0 0 1-7 0z"/>'),
  sofa:sv('<path d="M5 11V8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3"/><path d="M3 13a2 2 0 0 1 4 0v2h10v-2a2 2 0 0 1 4 0v5H3z"/><path d="M6 18v2M18 18v2"/>'),
  food:sv('<path d="M7 3v18M4.5 3v4.5a2.5 2.5 0 0 0 5 0V3"/><path d="M17 21V3c-2.2 1.2-3.5 3.6-3.5 6.5V13H17"/>'),
  play:sv('<rect x="3.5" y="5" width="17" height="12" rx="2.5"/><path d="M10.5 9v4l3.5-2zM8 20.5h8"/>'),
  gift:sv('<rect x="4" y="9" width="16" height="4" rx="1"/><path d="M5.5 13v7h13v-7M12 9v11"/><path d="M12 9C10.8 5.5 6.5 5 6.5 7.5S9.5 9 12 9zm0 0c1.2-3.5 5.5-4 5.5-1.5S14.5 9 12 9z"/>'),
  heart:sv('<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.2 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>'),
  bank:sv('<path d="M4 9.5 12 4l8 5.500z"/><path d="M6.5 12.500v5M10.2 12.500v5M13.8 12.500v5M17.5 12.500v5M4 20h16"/>'),
  brief:sv('<rect x="3.5" y="7.5" width="17" height="12" rx="2.5"/><path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.500M3.5 13h17"/>'),
  spark:sv('<path d="M12 4l1.9 5.100L19 11l-5.1 1.900L12 18l-1.9-5.100L5 11l5.1-1.900z"/>'),
  trend:sv('<path d="M4 16.500l5-5 3.5 3.500L20 7.5"/><path d="M14.5 7.500H20V13"/>'),
  key:sv('<circle cx="8" cy="15" r="4"/><path d="M11 12l8.5-8.500M16 7l2.5 2.500M13.5 9.500l2 2"/>'),
  dots:sv('<path d="M6 12h.01M12 12h.01M18 12h.01"/>'),
  candle:sv('<path d="M7 4v3M7 15v4M17 5v4M17 15v5"/><rect x="5" y="7" width="4" height="8" rx="1"/><rect x="15" y="9" width="4" height="6" rx="1"/>'),
  globe:sv('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.500c2.6 2.4 3.8 5.2 3.8 8.500s-1.2 6.1-3.8 8.500c-2.6-2.4-3.8-5.2-3.8-8.500S9.4 5.9 12 3.500z"/>'),
  layers:sv('<path d="M12 4 3.5 8.5 12 13l8.5-4.500z"/><path d="M3.5 12.5 12 17l8.5-4.500M3.5 16 12 20.5 20.5 16"/>'),
  note:sv('<rect x="3" y="6.5" width="18" height="11" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6.5 12h.01M17.5 12h.01"/>'),
  ingot:sv('<path d="M8.5 5.500h7l2 5.500h-11z"/><path d="M5 13h6.500l1.8 5.500H3.200zM14.5 13H19l1.8 5.500h-7.5"/>'),
  coin:sv('<circle cx="12" cy="12" r="8.5"/><path d="M14.6 9.300c-.5-.9-1.4-1.4-2.6-1.4-1.5 0-2.6.8-2.6 2s1 1.8 2.7 2.100c1.8.3 2.8.9 2.8 2.200s-1.2 2.1-2.8 2.100c-1.3 0-2.4-.6-2.9-1.600M12 6v1.900M12 16.300V18"/>'),
  hex:sv('<path d="M12 3.500l7.4 4.250v8.500L12 20.500l-7.4-4.250v-8.500z"/><path d="M12 8.500l3 1.750v3.500L12 15.500l-3-1.750v-3.500z"/>'),
  umbrella:sv('<path d="M3.5 12a8.5 8.5 0 0 1 17 0z"/><path d="M12 12v6.500a2 2 0 0 1-4 0M12 3.500v-1"/>'),
  bell:sv('<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2.2 2.2 0 0 0 4 0"/>'),
  user:sv('<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>'),
  search:sv('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>'),
  brush:sv('<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17"/><path d="M12 7.5h4.5M12 12h6M12 16.5h4.5"/>'),
  building:sv('<path d="M5 20.500v-15A1.5 1.5 0 0 1 6.5 4h7A1.5 1.5 0 0 1 15 5.500v15M15 10h3a1.5 1.5 0 0 1 1.5 1.500v9M3.5 20.500h17M8.5 8h3M8.5 11.500h3M8.5 15h3"/>')
};
const ic=(svg,n=16)=>svg.replace('aria-hidden="true"',`width="${n}" height="${n}" aria-hidden="true"`);
const KIND_ICON={hisse:I.candle,abd:I.globe,fon:I.layers,ppf:I.note,altin:I.ingot,gumus:I.ingot,doviz:I.coin,kripto:I.hex,nakit:I.wallet,bes:I.umbrella,emlak:I.building,diger:I.dots};
/* kategori adından ikon: kullanıcı eski ya da kendi kategori adını da taşıyor olabilir, bu yüzden anahtar kelimeyle eşleşir */
const CAT_ICONS=[[/maaş/i,"brief"],[/ek ödeme|ikramiye/i,"spark"],[/kira gelir/i,"key"],[/yatırım|temettü/i,"trend"],[/yan gelir|satış/i,"wallet"],[/kira|aidat/i,"home"],[/fatura/i,"bolt"],[/market|mutfak/i,"cart"],[/kart/i,"card"],[/kredi|taksit/i,"bank"],[/ulaşım|araç/i,"car"],[/eğitim/i,"book"],[/sağlık/i,"health"],[/çocuk/i,"child"],[/giyim/i,"shirt"],[/ev\b|eşya/i,"sofa"],[/yemek|eğlence/i,"food"],[/abone/i,"play"],[/hediye/i,"gift"],[/yardım|sadaka|bağış/i,"heart"]];
const catIcon=c=>{const m=CAT_ICONS.find(([re])=>re.test(c||""));return I[m?m[1]:"dots"]};
const TABS=[["ozet","Özet"],["portfoy","Portföy"],["akis","Gelir-Gider"],["borc","Borç"],["zekat","Zekât"]];

/* ---------- render ---------- */
const wide=()=>window.matchMedia("(min-width:900px)").matches;
/* ---------- ortak liste satırı ----------
   [işaret] başlık + alt yazı | tutar + durum ya da tek bir eylem düğmesi.
   Satırın tamamı dokunulabilir (düzenleme/ayrıntı açar); sondaki düğme yalnızca kendi işini yapar. */
const mk=(inner,color)=>`<span class="mk" style="color:var(${color||"--muted"})">${inner}</span>`;
const mkIcon=(svg,color)=>mk(ic(svg,18),color);
/* Geniş ekranda iki sütun: "side" işaretli kartlar sağ sütuna, toplam kartından sonraki diğer her şey sola taşınır.
   Telefonda hiçbir şey taşınmaz; sıra, şablonda yazıldığı gibidir. */
const wide2=()=>window.matchMedia("(min-width:1160px)").matches;
function twoCol(m){
  const side=[...m.querySelectorAll(".side")],on=wide2()&&side.length>0;
  document.body.classList.toggle("has-cols",on);
  if(!on)return;
  const kids=[...m.children],first=kids.findIndex(k=>k.matches(".hero,.card"));
  if(first<0)return;
  const cols=document.createElement("div"),a=document.createElement("div"),b=document.createElement("div");
  cols.className="cols";a.className="col";b.className="col col-side";
  kids.slice(first).forEach(k=>{if(!k.classList.contains("side"))a.appendChild(k)});
  side.forEach(x=>b.appendChild(x));
  cols.append(a,b);m.appendChild(cols);
}
window.matchMedia("(min-width:1160px)").addEventListener("change",()=>{if(state)render()});
function li(o){
  return `<div class="row li" ${o.act?`role="button" tabindex="0" data-act="${o.act}" data-id="${o.id||""}"`:""}>${o.mark||""}<div class="main"><div class="t">${o.title}</div>${o.sub?`<div class="s">${o.sub}</div>`:""}${o.extra||""}</div><div class="end">${o.amount!=null?`<div class="num am ${o.cls||""}">${o.amount}</div>`:""}${o.trail||""}</div></div>`;
}
const subTabs=()=>`<div class="seg full subtabs" role="group" aria-label="Bölüm">${[["akis","Gelir-Gider"],["borc","Borç ve alacak"]].map(([k,l])=>`<button data-tab="${k}" aria-pressed="${view.tab===k}">${l}</button>`).join("")}</div>`;
function render(){
  /* telefonda 5 öğe: Özet, Portföy, +, Gelir-Gider, Zekât. Borç, Gelir-Gider ekranının içindeki sekmedir (geniş ekranda kenar çubuğunda da durur). */
  const cur=k=>view.tab===k||(k==="akis"&&view.tab==="borc"&&!wide());
  const tabBtn=([k,l])=>`<button data-tab="${k}" ${k==="borc"?'class="only-wide"':""} ${cur(k)?'aria-current="page"':""}>${I[k]}<span>${l}</span></button>`;
  $("#nav").innerHTML=TABS.slice(0,2).map(tabBtn).join("")+`<button class="nav-add" id="navAdd" aria-label="Ekle">${I.plus}<span>Ekle</span></button>`+TABS.slice(2).map(tabBtn).join("");
  $("#screenTitle").textContent=view.tab==="ayarlar"?"Ayarlar":(TABS.find(t=>t[0]===view.tab)||["","Emanet"])[1];
  const m=$("#main"), fab=$("#fab");
  if(!ready&&!state){m.innerHTML='<div class="skel" aria-label="Verileriniz yükleniyor" role="status"><i class="sk-hero"></i><i></i><i></i></div>';fab.hidden=true;return}
  if(!state||(!state.updatedAt&&!state.portfolios.length&&!state.tx.length&&!state.debts.length)){
    if(!state)state=emptyState();
    if(view.tab!=="ayarlar"){m.innerHTML=onboarding();fab.hidden=true;return}
  }
  const R={ozet:rOzet,portfoy:rPortfoy,akis:rAkis,borc:rBorc,zekat:rZekat,ayarlar:rAyarlar}[view.tab]||rOzet;
  m.innerHTML=(view.tab==="akis"||view.tab==="borc"?subTabs():"")+R();
  const F={portfoy:["Varlık ekle",()=>holdingSheet()],akis:["İşlem ekle",()=>txSheet()],borc:["Kayıt ekle",()=>debtSheet()],zekat:["Ödeme ekle",()=>zakatSheet()],ozet:["İşlem ekle",()=>txSheet()]}[view.tab];
  if(F){fab.hidden=false;fab.innerHTML=I.plus+"<span>"+F[0]+"</span>";fab.onclick=F[1]}else fab.hidden=true;
  const na=$("#navAdd");if(na){na.disabled=!F;na.setAttribute("aria-label",F?F[0]:"Ekle");na.title=F?F[0]:"";na.lastElementChild.textContent=F?F[0]:"Ekle";na.onclick=F?F[1]:null}
  twoCol(m);
}

function onboarding(){
  return `<section class="card onb">
    <span class="label">Emanet'e hoş geldiniz</span>
    <h2>Varlıklarınızı, nakit akışınızı ve zekâtınızı tek yerde tutun.</h2>
    <ul><li>Birden fazla portföy, TL / USD / EUR varlıklar</li><li>Aylık gelir ve gider takibi</li><li>Verdiğiniz ve aldığınız borçlar, taksit ödemeleri</li><li>96 g altın nisabı ve hicri zekât günüyle zekât hesabı</li></ul>
    <div class="note">Verileriniz yalnızca size görünür. Altın, döviz, hisse ve fon fiyatları kendiliğinden güncellenir.</div>
    <div class="btns"><button class="btn primary" data-act="start-empty">Boş başla</button><button class="btn" data-act="start-sample">Örnek verilerle dene</button></div>
  </section>`;
}

/* Özet'te görüntülenen portföy: yalnızca bu cihazdaki görünümü değiştirir, ana portföyü değiştirmez.
   Gelir-gider, nakit bakiyesi, hedefler ve vadeler her zaman ana portföye bağlıdır. */
const ozPf=()=>state.portfolios.find(p=>p.id===view.ozPf)||mainPf();
function rOzet(){
  const mp=ozPf(),onMain=!mp||isMainPf(mp);
  const t=mp?pfTotals(mp):{v:0,c:0,pl:0,plp:0};
  const recv=debtSum("lent"),pay=debtSum("borrowed");
  const net=t.v+recv-pay;
  const cm=view.month=todayISO().slice(0,7); const ms=monthSum(cm);
  const upcoming=state.debts.filter(d=>d.due&&debtLeft(d)>0).sort((a,b)=>a.due.localeCompare(b.due)).slice(0,3);
  const hs=mp?mp.holdings.filter(h=>+h.qty>0).sort((a,b)=>hVal(b)-hVal(a)):[];
  const byK={};hs.forEach(h=>byK[h.kind]=(byK[h.kind]||0)+hVal(h));
  const kinds=Object.entries(byK).filter(e=>e[1]>0).sort((a,b)=>b[1]-a[1]);
  const others=state.portfolios.length-(mp?1:0);
  return `
  <section class="hero net">
    <div class="hero-top"><div style="min-width:0">
      ${state.portfolios.length>1?`<label class="pfsel"><span class="sr">Görüntülenen portföy</span><select data-act="ozpf" aria-label="Görüntülenen portföy">${state.portfolios.map(p=>`<option value="${p.id}" ${mp&&p.id===mp.id?"selected":""}>${esc(p.name)}${isMainPf(p)?" (ana)":""}${owners().length>1?" · "+esc(ownerOf(p)):""}</option>`).join("")}</select></label>`:`<span class="label">${mp?esc(mp.name):"Net varlık"}</span>`}
    </div><div class="hero-acts">${mp&&hs.length?curSeg():""}${eyeBtn()}</div></div>
    <div class="bigrow"><div class="big amt">${money(t.v)}</div>${mp?spark([mp.id]):""}</div>
    ${mp?plChips(hs,t.v,t.c):""}
    <div class="subrow">${eqvChips(t.v)}</div>
  </section>
  ${mp&&hs.length?histCard([mp.id],"Değer geçmişi"):""}
  ${mp?`<section class="card">
    <div class="sec" style="margin-bottom:8px"><h2>Varlıklar</h2><button class="btn ghost sm" data-act="open-pf" data-id="${mp.id}">Portföye git${ic(I.right,14)}</button></div>
    ${kinds.length?`<div class="stack" aria-hidden="true">${kinds.map(([k,v])=>`<i style="flex:${v};background:var(${k==="__cash"?"--c3":(KIND_COLOR[k]||"--c7")})"></i>`).join("")}</div>
    <div class="klist one">${kinds.map(([k,v])=>`<span><i class="dot" style="background:var(${k==="__cash"?"--c3":(KIND_COLOR[k]||"--c7")})"></i>${esc(k==="__cash"?CASH_LBL:(KINDS[k]||k))} <b class="num">%${fmtN(v/t.v*100,0)}</b></span>`).join("")}</div>
    <div class="list tbl">${hHead(hs.length)}${hs.map(h=>hLine(h,mp.id)).join("")}</div>`
    :`<div class="empty"><b>Bu portföyde varlık yok</b>Portföy sekmesinden varlık ekleyebilirsiniz.</div>`}
    ${others>0?`<div class="sub" style="margin-top:8px">${others} portföy daha var; hepsini Portföy sekmesinde görebilirsiniz.</div>`:""}
  </section>`
  :`<section class="card"><div class="empty"><b>Henüz portföy yok</b>Yatırımlarınızı gruplamak için bir portföy oluşturun.</div><div style="text-align:center"><button class="btn primary" data-act="new-pf">Portföy oluştur</button></div></section>`}
  ${onMain?"":`<div class="note">Gelir-gider, birikim hedefleri ve vadeler ana portföye (${esc((mainPf()||{}).name||"")}) bağlıdır; bu portföyde gösterilmez. Bu portföyün zekâtını Zekât sekmesinden ayrıca hesaplayabilirsiniz.</div>`}
  ${!onMain?"":`<section class="card side">
    <div class="sec" style="margin-bottom:10px"><h2>${MONTHS[+cm.slice(5)-1]} nakit akışı</h2><button class="btn ghost sm" data-tab="akis">Tümü${ic(I.right,14)}</button></div>
    <div class="flow">
      <dl class="flow-n">
        <div><dt><i class="dot" style="background:var(--pos)"></i>Gelir</dt><dd class="num">${fmt(ms.i)}</dd></div>
        <div><dt><i class="dot" style="background:var(--neg);opacity:.6"></i>Gider</dt><dd class="num">${fmt(ms.o)}</dd></div>
        <div class="tot"><dt>Kalan</dt><dd class="num ${ms.i-ms.o>=0?"pos-t":"neg-t"}">${fmt(ms.i-ms.o)}</dd></div>
      </dl>
      ${flowChart(true)}
    </div>
  </section>`}
  ${onMain?goalsCard().replace('<section class="card"','<section class="card side"'):""}
  ${onMain&&upcoming.length?`<section class="card side"><div class="sec" style="margin-bottom:6px"><h2>Yaklaşan vadeler</h2><button class="btn ghost sm" data-tab="borc">Tümü${ic(I.right,14)}</button></div><div class="list">${upcoming.map(debtRow).join("")}</div></section>`:""}
  `;
}

function flowChart(compact){
  const months=[];const [y,mo]=todayISO().slice(0,7).split("-").map(Number);
  for(let k=5;k>=0;k--){const d=new Date(y,mo-1-k,1);months.push(d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"))}
  const data=months.map(m=>({m,...monthSum(m)}));
  const max=Math.max(1,...data.flatMap(d=>[d.i,d.o]));
  if(data.every(d=>!d.i&&!d.o))return `<div class="sub">Son 6 ayda kayıt yok.</div>`;
  if(compact){
    const W=168,H=78,pb=14,bw=7,gw=W/6;
    const bars=data.map((d,k)=>{const x=k*gw+gw/2,hi=(H-pb-4)*d.i/max,ho=(H-pb-4)*d.o/max,cur=k===5;
      return `<rect x="${(x-bw-1).toFixed(1)}" y="${(H-pb-hi).toFixed(1)}" width="${bw}" height="${Math.max(hi,0).toFixed(1)}" rx="${Math.min(3.5,hi/2).toFixed(1)}" fill="var(--pos)" opacity="${cur?1:.45}"/><rect x="${(x+1).toFixed(1)}" y="${(H-pb-ho).toFixed(1)}" width="${bw}" height="${Math.max(ho,0).toFixed(1)}" rx="${Math.min(3.5,ho/2).toFixed(1)}" fill="var(--neg)" opacity="${cur?.75:.3}"/><text x="${x.toFixed(1)}" y="${H-2}" text-anchor="middle" font-size="9" font-weight="${cur?700:500}" fill="var(${cur?"--fg":"--muted"})">${MONTHS[+d.m.slice(5)-1].slice(0,1)}</text>`}).join("");
    return `<svg class="flow-c" viewBox="0 0 ${W} ${H}" role="img" aria-label="Son altı ay gelir ve gider; bu ay vurgulu">${bars}</svg>`;
  }
  const W=320,H=130,pb=20,bw=9,gw=W/6;
  const bars=data.map((d,k)=>{const x=k*gw+gw/2;const hi=(H-pb-8)*d.i/max,ho=(H-pb-8)*d.o/max;
    return `<rect x="${x-bw-1.5}" y="${H-pb-hi}" width="${bw}" height="${Math.max(hi,0)}" rx="${Math.min(4.5,hi/2)}" fill="var(--pos)"/><rect x="${x+1.5}" y="${H-pb-ho}" width="${bw}" height="${Math.max(ho,0)}" rx="${Math.min(4.5,ho/2)}" fill="var(--neg)" opacity=".6"/><text x="${x}" y="${H-5}" text-anchor="middle" font-size="10" fill="var(--muted)">${MONTHS[+d.m.slice(5)-1].slice(0,3)}</text>`}).join("");
  return `<div class="chart-wrap"><svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:520px;display:block" role="img" aria-label="Son altı ay gelir ve gider">${[.33,.66].map(f=>`<line x1="0" x2="${W}" y1="${(8+(H-pb-8)*f).toFixed(1)}" y2="${(8+(H-pb-8)*f).toFixed(1)}" stroke="var(--line)" stroke-dasharray="2 4"/>`).join("")}<line x1="0" x2="${W}" y1="${H-pb}" y2="${H-pb}" stroke="var(--line)"/>${bars}</svg></div><div class="sub" style="display:flex;gap:14px"><span><span class="dot" style="display:inline-block;background:var(--pos)"></span> Gelir</span><span><span class="dot" style="display:inline-block;background:var(--neg)"></span> Gider</span></div>`;
}

function donut(parts){
  const total=parts.reduce((s,p)=>s+p.v,0);if(!total)return"";
  const R=56,W=16,C=2*Math.PI*R,gap=parts.length>1?2.2:0;let off=0;
  const segs=parts.map(p=>{const len=p.v/total*C;const vis=Math.max(.8,len-gap);
    const s=`<circle r="${R}" cx="80" cy="80" fill="none" stroke="var(${p.c})" stroke-width="${W}" stroke-dasharray="${vis} ${C-vis}" stroke-dashoffset="${-off-gap/2}" transform="rotate(-90 80 80)"><title>${esc(p.n)} %${fmtN(p.v/total*100,1)}</title></circle>`;off+=len;return s}).join("");
  const tv=S().hide?"••••":fmt(total,null,{dec:0});
  return `<div class="donut-row"><svg viewBox="0 0 160 160" role="img" aria-label="Varlık dağılımı"><circle r="${R}" cx="80" cy="80" fill="none" stroke="var(--surface-2)" stroke-width="${W}"/>${segs}
    <text x="80" y="74" text-anchor="middle" class="ctr-l">Toplam</text><text x="80" y="94" text-anchor="middle" class="ctr-v" ${tv.length>11?'textLength="100" lengthAdjust="spacingAndGlyphs"':""}>${esc(tv)}</text></svg>
    <div class="legend">${parts.map(p=>`<div class="li"><span class="sw2" style="background:var(${p.c})"></span><span class="n">${esc(p.n)}</span><span class="p">%${fmtN(p.v/total*100,1)}</span><span class="a">${fmt(p.v)}</span></div>`).join("")}</div></div>`;
}

function rPortfoy(){
  const ows=owners();if(view.owner!=="all"&&!ows.includes(view.owner))view.owner="all";
  if(view.pf==null)view.pf=(mainPf()||{}).id||"all";
  const vis=state.portfolios.filter(p=>view.owner==="all"||ownerOf(p)===view.owner);
  if(view.pf!=="all"&&!vis.find(p=>p.id===view.pf))view.pf="all";
  const hsAll=allHoldings(view.pf,view.owner);
  const realized=hsAll.reduce((s,h)=>s+toBase(+h.realized||0,h.cur),0);
  const closed=hsAll.filter(h=>!(+h.qty>0));
  const hs=hsAll.filter(h=>+h.qty>0);
  const mpv=mainPf(),cashIn=false,cb=0;
  let v=cb,c=cb;hs.forEach(h=>{v+=hVal(h);c+=hCost(h)});const pl=v-c,plp=c?pl/c*100:0;
  const byK={};hs.forEach(h=>byK[h.kind]=(byK[h.kind]||0)+hVal(h));if(cb>0)byK.__cash=cb;
  const parts=Object.entries(byK).filter(e=>e[1]>0).sort((a,b)=>b[1]-a[1]).map(([k,val])=>({n:k==="__cash"?CASH_LBL:(KINDS[k]||k),v:val,c:k==="__cash"?"--c3":(KIND_COLOR[k]||"--c7")}));
  const cur=state.portfolios.find(p=>p.id===view.pf);
  const multi=!cur&&vis.length>1;
  return `
  ${ows.length>1?`<div class="seg" role="group" aria-label="Kişi seçimi" style="align-self:flex-start">${[["all","Herkes"],...ows.map(o=>[o,o])].map(([k,l])=>`<button data-act="owner" data-k="${esc(k)}" aria-pressed="${view.owner===k}">${esc(l)}</button>`).join("")}</div>`:""}
  <div class="chips" role="group" aria-label="Portföy seçimi">
    <button class="chip" data-act="pf" data-id="all" aria-pressed="${view.pf==="all"}">Tümü</button>
    ${vis.map(p=>`<button class="chip" data-act="pf" data-id="${p.id}" aria-pressed="${view.pf===p.id}">${esc(p.name)}</button>`).join("")}
    <button class="chip add" data-act="new-pf">+ Yeni portföy</button>
  </div>
  <section class="hero flat">
    <div class="hero-top"><div style="min-width:0"><span class="label">${cur?esc(cur.name)+(ows.length>1?" · "+esc(ownerOf(cur)):""):(view.owner==="all"?"Tüm portföyler":esc(view.owner)+" · tüm portföyler")}</span></div><div class="hero-acts">${hs.length?curSeg():""}${eyeBtn()}${cur?`<button class="icon-btn" data-act="edit-pf" data-id="${cur.id}" aria-label="Portföyü düzenle">${I.edit}</button>`:""}</div></div>
    <div class="bigrow"><div class="big">${money(v)}</div>${spark((cur?[cur]:vis).map(p=>p.id))}</div>
    ${plChips(hs,v,c)}
    <div class="subrow">${eqvChips(v)}</div>
    ${(()=>{const u=ufeSum(hs);if(!u.c)return ufe?"":"";return `<div class="ufe-line"><div><span class="label">Yİ-ÜFE maliyeti</span><div class="v num">${fmt(u.c)}</div></div><div><span class="label">Reel kâr / zarar</span><div class="v num ${u.pl>=0?"pos-t":"neg-t"}">${fmt(u.pl)} <small>${fmtPct(u.plp)}</small></div></div></div><div class="sub" style="margin-top:-6px">TL maliyet, alış ayından önceki aydan ${fmtYM(ufeEnd().ym)}'a kadar Yİ-ÜFE artışıyla güncellendi${u.n?`; alış tarihi olmayan ${u.n} varlık hariç`:""}.</div>`})()}
    ${cashIn?`<div class="sub">${esc(mpv.name)} içinde gelir-gider bakiyesi: <b class="num">${fmt(cb)}</b></div>`:""}
    ${realized?`<div class="sub">Gerçekleşen kâr/zarar (satışlar, komisyon düşülmüş): <b class="num ${realized>=0?"pos-t":"neg-t"}">${fmt(realized)}</b></div>`:""}
  </section>
  ${multi?pfListCard(vis,v):""}
  ${parts.length?`<section class="card side"><h2 style="margin-bottom:12px">Dağılım</h2>${donut(parts)}</section>`:""}
  ${hs.length?histCard((cur?[cur]:vis).map(p=>p.id),"Değer geçmişi").replace(/^(\s*<(?:section|details)\b[^>]*class=")/,"$1side "):""}
  ${hs.length?benchCard((cur?[cur]:vis).map(p=>p.id)):""}
  ${hs.length?eqvCard(v,hs).replace(/^(\s*<(?:section|details)\b[^>]*class=")/,"$1side "):""}
  ${multi?vis.map(p=>{const ph=p.holdings.filter(h=>+h.qty>0).map(h=>({...h,_pf:p})).sort((a,b)=>hVal(b)-hVal(a)),pc=p.holdings.filter(h=>!(+h.qty>0)).map(h=>({...h,_pf:p})),pt=pfTotals(p);
    return `<section class="card pf-group"><div class="sec"><button class="btn ghost" data-act="pf" data-id="${p.id}" style="padding:0;color:var(--fg);display:flex;align-items:center;gap:8px;min-width:0"><span class="dot" style="background:var(${p.color||"--c1"})"></span><h2 style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.name)}</h2>${mainPf()===p?`<span class="pill">Ana</span>`:""}</button><div class="end" style="text-align:right"><div class="num">${fmt(pt.v)}</div><span class="pill ${pt.pl>=0?"pos":"neg"}">${fmtPct(pt.plp)}</span></div></div>
      ${ph.length||pc.length?`<div class="list tbl">${hHead(ph.length)}${ph.map(h=>hRow(h,false)).join("")}${pc.map(closedRow).join("")}</div>`:`<div class="sub" style="padding:8px 0">Bu portföyde varlık yok.</div>`}</section>`}).join("")
  :`<section class="card">
    <div class="sec" style="margin-bottom:6px"><h2>Varlıklar</h2><span class="sub">${AUTO()?"Fiyatlar "+marketWhen()+" (otomatik)":"Dokunarak fiyat güncelleyin"}</span></div>
    ${hs.length||closed.length?`<div class="list tbl">${hHead(hs.length)}${hs.sort((a,b)=>hVal(b)-hVal(a)).map(h=>hRow(h,view.pf==="all")).join("")}
      ${closed.map(closedRow).join("")}</div>`
    :`<div class="empty"><b>${state.portfolios.length?"Bu portföyde varlık yok":"Önce bir portföy oluşturun"}</b>${state.portfolios.length?"Hisse, fon, altın, döviz veya nakit ekleyebilirsiniz.":""}</div><div style="text-align:center">${state.portfolios.length?`<button class="btn primary" data-act="add-h">Varlık ekle</button>`:`<button class="btn primary" data-act="new-pf">Portföy oluştur</button>`}</div>`}
  </section>`}
  ${(()=>{const all=[];hsAll.forEach(h=>{const ph=h._pf.holdings.find(x=>x.id===h.id)||h;(ph.trades||[]).forEach(t=>all.push({h:ph,t,pf:h._pf.id}))});
    if(!all.length)return"";all.sort((a,b)=>(b.t.date||"").localeCompare(a.t.date||""));const N=view.trN||15;
    return `<section class="card"><div class="sec" style="margin-bottom:6px"><h2>İşlemler</h2><span class="sub">${all.length} kayıt</span></div><div class="list">${all.slice(0,N).map(x=>tradeRow(x.h,x.t,true,x.pf)).join("")}</div>${all.length>N?`<div style="text-align:center;margin-top:8px"><button class="btn sm" data-act="more-tr">Daha fazla göster</button></div>`:""}</section>`})()}
  ${multi&&AUTO()?`<p class="sub" style="margin:0">Fiyatlar ${marketWhen()} (otomatik)</p>`:""}`;
}
/* bir varlığın TL ve dolar bazında kâr/zararı (liste satırı için) */
function hPL(h){const val=hVal(h),cs=hCost(h),pl=val-cs;
  const vU=rate("USD")?val*rate(S().base)/rate("USD"):0,cU=costIn(h,"USD"),plU=vU-cU;
  if(S().hide)return`<div class="hpl">••••</div>`;
  const sg=v=>v>0?"+":"";
  return `<div class="hpl"><span class="${pl>=0?"pos-t":"neg-t"}">${sg(pl)}${fmt(pl,null,{dec:0})}</span><span class="${plU>=0?"pos-t":"neg-t"}">${sg(plU)}${fmt(plU,"USD",{dec:0})}</span></div>`}
/* iki satırlık kompakt varlık satırı: ad · değer / alt bilgi · kâr-zarar */
/* otomatik fiyatı beklenen ama gelmeyen ya da bayatlamış varlıklar için uyarı etiketi */
function priceFlag(h){
  if(S().autoPrices===false||!market||!(+h.qty>0))return"";
  const wants=(PRICED.includes(h.kind)&&h.kind!=="diger"&&!!h.symbol)||h.kind==="altin"||h.kind==="gumus";
  if(!wants)return"";
  const ep=effPrice(h);
  if(!ep.auto)return h.cur==="TRY"||PRICED.includes(h.kind)?` <span class="flag" title="Otomatik fiyat henüz gelmedi; elle girilen fiyat kullanılıyor">fiyat elle</span>`:"";
  if(ep.t){const age=(Date.now()-new Date(ep.t).getTime())/864e5;if(age>5)return ` <span class="flag" title="Son fiyat ${esc(fmtDate(String(ep.t).slice(0,10)))} tarihli">fiyat eski</span>`}
  return"";
}
/* Varlık tablosu: tek satır = ad | değer | K/Z. K/Z sütunu başlığına dokununca %, ₺ ve $ arasında döner;
   toplam kartındaki Toplam/Günlük seçimi bu sütuna da uygulanır. Ayrıntılar satıra dokununca açılır. */
/* tablo sütunu: yüzde ya da tutar; tutarın para birimi karttaki ₺/$ seçimini izler */
const plCol=()=>S().plCol&&S().plCol!=="pct"?(S().plCur==="USD"?"usd":"tl"):"pct";
function hHead(n,label){
  const c=plCol(),day=plMode()==="day";
  return `<div class="row th"><span>${label||"Varlık"} · ${n}</span><span>Değer</span><button class="thb" data-act="plcol" aria-label="Kâr/zarar sütunu: ${c==="pct"?"yüzde":c==="tl"?"TL tutarı":"dolar tutarı"}. Değiştirmek için dokunun">${day?"Günlük":"K/Z"} ${c==="pct"?"%":c==="tl"?"₺":"$"}<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4v16M7 4 4 7M7 4l3 3M17 20V4M17 20l-3-3M17 20l3-3"/></svg></button></div>`;
}
function hLine(h,pfId){
  const val=hVal(h),cs=hCost(h);
  let pl=val-cs,p=cs?pl/cs*100:0,plU=(rate("USD")?val*rate(S().base)/rate("USD"):0)-costIn(h,"USD"),none=false;
  if(plMode()==="day"){const d=dayPL(h);if(d){pl=d.pl;p=d.base?d.pl/d.base*100:0;plU=d.plU}else none=true}
  const sg=v=>v>0?"+":"",c=plCol();
  const cell=none?`<span class="sub">—</span>`:c==="pct"?`<b class="chg ${pl>=0?"up":"down"}">${fmtPct(p)}</b>`
    :S().hide?"••••":c==="tl"?`<span class="${pl>=0?"pos-t":"neg-t"}">${sg(pl)}${fmt(pl,null,{dec:0})}</span>`:`<span class="${plU>=0?"pos-t":"neg-t"}">${sg(plU)}${fmt(plU,"USD",{dec:0})}</span>`;
  return `<button class="row tr" data-act="edit-h" data-pf="${pfId}" data-id="${h.id}"><span class="tn"><i class="dot" style="background:var(${KIND_COLOR[h.kind]||"--c7"})"></i><span class="t">${esc(h.name)}</span>${priceFlag(h)}</span><span class="num tv">${fmt(val)}</span><span class="num tk">${cell}</span></button>`;
}
function hRow(h){return hLine(h,h._pf.id)}
const closedRow=h=>`<button class="row tr closed" data-act="edit-h" data-pf="${h._pf.id}" data-id="${h.id}"><span class="tn"><i class="dot" style="background:var(--faint)"></i><span class="t">${esc(h.name)}</span></span><span class="sub tv">satıldı</span><span class="num tk ${(+h.realized||0)>=0?"pos-t":"neg-t"}">${S().hide?"••••":fmt(+h.realized||0,h.cur,{dec:0})}</span></button>`;
function pfListCard(vis,total){
  const tots=vis.map(p=>({p,t:pfTotals(p)})).sort((a,b)=>b.t.v-a.t.v);
  return `<section class="card"><div class="sec" style="margin-bottom:6px"><h2>Portföyler</h2><button class="btn ghost sm" data-act="new-pf">Yeni portföy</button></div><div class="list">${tots.map(({p,t})=>{const sh=total?t.v/total*100:0;return `<button class="row" data-act="pf" data-id="${p.id}"><span class="dot" style="background:var(${p.color||"--c1"})"></span><div class="main"><div class="t">${esc(p.name)}${mainPf()===p?` <span class="pill">Ana</span>`:""}</div><div class="s">${owners().length>1?esc(ownerOf(p))+" · ":""}${p.holdings.filter(h=>+h.qty>0).length} varlık · %${fmtN(sh,0)}</div><div class="share"><i style="width:${sh}%;background:var(${p.color||"--c1"})"></i></div></div><div class="end"><div class="num">${fmt(t.v)}</div><span class="pill ${t.pl>=0?"pos":"neg"}">${fmtPct(t.plp)}</span></div></button>`}).join("")}</div></section>`;
}

function eqvCard(v,hs){
  const e=eqv(v);
  const cU=hs.reduce((s,h)=>s+costIn(h,"USD"),0),cE=hs.reduce((s,h)=>s+costIn(h,"EUR"),0);
  const pU=cU?(e.USD-cU)/cU*100:0,pE=cE?(e.EUR-cE)/cE*100:0;
  const missing=hs.filter(h=>!h.fxAt||h.fxAt.pending).length;
  const tile=(l,val,sub,cls)=>`<div><span class="label">${l}</span><div class="v num" style="font-size:1.05rem">${val}</div>${sub?`<div class="sub ${cls||""}">${sub}</div>`:""}</div>`;
  return `<section class="card"><div class="sec" style="margin-bottom:10px"><h2>Döviz ve altın karşılığı</h2><span class="sub" style="white-space:nowrap">${AUTO()?marketWhen():"elle girilen kur"}</span></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:14px">
      ${tile("Dolar",fmt(e.USD,"USD",{dec:0}),"Maliyet "+fmt(cU,"USD",{dec:0})+" · "+fmtPct(pU),pU>=0?"pos-t":"neg-t")}
      ${tile("Euro",fmt(e.EUR,"EUR",{dec:0}),"Maliyet "+fmt(cE,"EUR",{dec:0})+" · "+fmtPct(pE),pE>=0?"pos-t":"neg-t")}
      ${tile("Gram altın",e.g?(S().hide?"••••":fmtN(e.g,2)+" g"):"—",gramPrice()?"Gram "+fmt(gramPrice(),"TRY",{dec:0,show:true}):"")}
    </div>
    <div class="sub" style="margin-top:10px">Dolar ve euro maliyeti, her alımın TL tutarının o günkü kura bölünmesiyle bulunur.${missing?` ${missing} varlığın alış günü kuru henüz yok; bunlarda geçici olarak güncel kur kullanıldı.`:""}</div>
  </section>`;
}
function rAkis(){
  const m=view.month;const [y,mo]=m.split("-").map(Number);
  let list=monthTx(m).slice().sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  const ms=monthSum(m);
  const cats={};list.filter(t=>t.type==="out").forEach(t=>cats[t.cat]=(cats[t.cat]||0)+toBase(t.amount,t.cur));
  const bud=state.budgets||{};Object.keys(bud).forEach(c=>{if(+bud[c]>0&&!(c in cats))cats[c]=0});
  const catArr=Object.entries(cats).sort((a,b)=>b[1]-a[1]);const cmax=Math.max(1,...catArr.map(([c,v])=>Math.max(v,+bud[c]||0)));
  const budTot=Object.values(bud).reduce((a,v)=>a+(+v||0),0);
  if(view.txType!=="all")list=list.filter(t=>view.txType==="out"?(t.type==="out"||t.type==="card"):t.type===view.txType);
  const groups={};list.forEach(t=>(groups[t.date]=groups[t.date]||[]).push(t));
  const savings=ms.i?((ms.i-ms.o)/ms.i*100):0;
  const recs=state.recurring.slice().sort((a,b)=>(+a.day||1)-(+b.day||1));
  const recOut=recs.filter(r=>r.type==="out"),recIn=recs.filter(r=>r.type==="in");
  const recPend=recs.filter(r=>!recPaid(r,m));
  const pendOut=recPend.filter(r=>r.type==="out").reduce((a,r)=>a+toBase(r.amount,r.cur),0);
  const curM=m===todayISO().slice(0,7);
  /* Günlük harcama limiti: (gelir − gider − bekleyen sabit ödemeler) ÷ ayın kalan günleri (bugün dahil).
     Bugünkü harcama limite geri eklenir ki limit gün içinde harcadıkça küçülmesin; "bugün kalan" ayrıca gösterilir. */
  const dLeft=curM?dim(y,mo)-(+todayISO().slice(8))+1:0;
  const todayOut=curM?monthTx(m).filter(t=>t.type==="out"&&t.date===todayISO()).reduce((a,t)=>a+toBase(t.amount,t.cur),0):0;
  const spendable=ms.i-ms.o-pendOut, dayLimit=dLeft?(spendable+todayOut)/dLeft:0, todayLeft=dayLimit-todayOut;
  const dayRow=!curM||!(ms.i>0||ms.o>0)?"":dayLimit>0
    ?`<div class="dayrow"><div><span class="label">Günlük harcama limiti</span><div class="v num">${fmt(dayLimit,null,{dec:0})}</div></div><div class="dr-r"><b class="num ${todayLeft>=0?"pos-t":"neg-t"}">${S().hide?"••••":todayLeft>=0?"bugün "+fmt(todayLeft,null,{dec:0})+" kaldı":"bugün "+fmt(-todayLeft,null,{dec:0})+" aşıldı"}</b><small>${dLeft} gün kaldı · harcanabilir ${fmt(spendable,null,{dec:0})}</small></div>
      <div class="bar" aria-hidden="true"><i style="width:${Math.min(100,dayLimit?todayOut/dayLimit*100:0)}%;background:var(${todayLeft<0?"--neg":todayOut>dayLimit*.8?"--warn":"--pos"})"></i></div></div>`
    :`<div class="dayrow"><div><span class="label">Günlük harcama limiti</span><div class="v num neg-t">${fmt(0)}</div></div><div class="dr-r"><b class="neg-t">Bu ay harcanabilir tutar kalmadı</b><small>${dLeft} gün kaldı · açık ${fmt(-spendable,null,{dec:0})}</small></div></div>`;
  const recRow=r=>{const pd=recPaid(r,m),late=!pd&&curM&&dayIn(m,r.day)<todayISO(),c=r.method&&cardById(r.method);
    return li({act:"rec-edit",id:r.id,mark:mk(String(r.day||1).padStart(2,"0"),r.type==="in"?"--pos":"--muted"),title:esc(r.name),sub:esc(r.cat)+(c?" · "+esc(c.name):""),amount:fmt(r.amount,r.cur),
      trail:pd?`<span class="pill pos">${r.type==="in"?"Alındı":"Ödendi"}</span>`:`<button class="btn sm ${late?"primary":""}" data-act="rec-pay" data-id="${r.id}">${r.type==="in"?"Alındı":"Öde"}</button>`})};
  return `
  <div class="sec"><div class="month-sw"><button class="icon-btn" data-act="month" data-d="-1" aria-label="Önceki ay">${I.left}</button><b>${MONTHS[mo-1]} ${y}</b><button class="icon-btn" data-act="month" data-d="1" aria-label="Sonraki ay">${I.right}</button></div></div>
  <section class="hero flat">
    <div class="hero-top"><div><span class="label">Aylık net</span><div class="big ${ms.i-ms.o>=0?"":"neg-t"}">${money(ms.i-ms.o)}</div>${ms.i?`<div class="sub">Gelirin %${fmtN(savings,1)}'i kaldı${pendOut?` · bekleyen sabit ödemeler ${fmt(pendOut)}`:""}</div>`:pendOut?`<div class="sub">Bekleyen sabit ödemeler ${fmt(pendOut)}</div>`:""}</div>${eyeBtn()}</div>
    <div class="trio"><div><span class="label">Gelir</span><div class="v pos-t">${fmt(ms.i)}</div></div><div><span class="label">Gider</span><div class="v neg-t">${fmt(ms.o)}</div></div><div><span class="label">${budTot?"Bütçeden kalan":"İşlem"}</span><div class="v ${budTot&&budTot-ms.o<0?"neg-t":""}">${budTot?fmt(budTot-ms.o):monthTx(m).length}</div></div></div>
    ${budTot?`<div class="bar" aria-label="Bütçe kullanımı"><i style="width:${Math.min(100,ms.o/budTot*100)}%;background:var(${ms.o>budTot?"--neg":ms.o>budTot*.9?"--warn":"--accent"})"></i></div>`:""}
    ${dayRow}
  </section>
  ${mainPf()?`<section class="card side"><div class="sec"><div style="min-width:0"><h2>Nakit bakiyesi</h2><div class="sub">${cashOn()?`${esc(mainPf().name)} portföyünün zekâtına dahil · özet ve portföyde gösterilmez${S().cashStartDate?" · "+fmtDate(S().cashStartDate)+" tarihinden beri":""}`:"Portföye bağlı değil"}</div></div><div class="end" style="text-align:right"><div class="num" style="font-size:1.15rem;font-weight:600">${cashOn()?`<span class="${cashBal()<0?"neg-t":""}">${fmt(cashBal())}</span>`:"—"}</div><button class="btn ghost sm" data-act="cash-set">Ayarla</button></div></div></section>`:""}
  <section class="card side">
    <div class="sec" style="margin-bottom:6px"><h2>Sabit ödemeler</h2><button class="btn ghost sm" data-act="rec-new">Ekle</button></div>
    ${recs.length?`${recOut.length?`<div class="list">${recOut.map(recRow).join("")}</div>`:""}${recIn.length?`<div class="label" style="margin-top:10px">Düzenli gelirler</div><div class="list">${recIn.map(recRow).join("")}</div>`:""}`
      :`<div class="empty"><b>Sabit ödeme yok</b>Kira, faturalar, abonelikler ve maaş gibi her ay tekrar eden kalemleri ekleyin; her ay tek dokunuşla işaretleyin.</div>`}
  </section>
  <section class="card side">
    <div class="sec" style="margin-bottom:6px"><h2>Kredi kartları</h2><button class="btn ghost sm" data-act="card-new">Kart ekle</button></div>
    ${state.cards.length?`<div class="list">${state.cards.map(c=>{const b=cardBal(c),nd=nextDue(c.dueDay),n=daysBetween(todayISO(),nd);
      return li({act:"card-edit",id:c.id,mark:mkIcon(I.card,"--c2"),title:esc(c.name),sub:`Son ödeme ${fmtDate(nd)} · ${n} gün${c.limit?` · limit ${fmt(+c.limit,"TRY",{dec:0})}`:""}`,
        extra:c.limit?`<div class="share"><i style="width:${Math.min(100,b.bal/c.limit*100)}%;background:var(${b.bal>c.limit*.9?"--neg":"--c2"})"></i></div>`:"",amount:fmt(b.bal),cls:b.bal>0?"neg-t":"",
        trail:b.bal>0?`<button class="btn sm ${n<=3?"primary":""}" data-act="card-pay" data-id="${c.id}">Öde</button>`:`<span class="pill pos">Borç yok</span>`})}).join("")}</div>
      <div class="sub" style="margin-top:8px">Kartla yapılan harcamalar gider olarak o aya yazılır; kart ödemesi tekrar gider sayılmaz, yalnızca kart borcunu düşürür.</div>`
      :`<div class="empty"><b>Kart eklenmedi</b>Kart ekleyince harcamaları karta bağlayabilir, taksitleri aylara bölebilir ve kart borcunu izleyebilirsiniz.</div>`}
  </section>
  <section class="card">
    <div class="sec" style="margin-bottom:10px"><h2>Kategoriler ve bütçe</h2><button class="btn ghost sm" data-act="budget">${budTot?"Bütçeyi düzenle":"Bütçe belirle"}</button></div>
    ${catArr.length?`<div style="display:flex;flex-direction:column;gap:12px">${catArr.map(([c,v])=>{const lim=+bud[c]||0;const over=lim&&v>lim,near=lim&&v>lim*.9;
      return `<div><div style="display:flex;justify-content:space-between;gap:8px;font-size:.88rem;margin-bottom:4px"><span>${esc(c)}</span><span class="num ${over?"neg-t":""}">${fmt(v)}${lim?` <span class="sub">/ ${fmt(lim)}</span>`:""}</span></div><div class="bar" style="position:relative"><i style="width:${(lim?Math.min(100,v/lim*100):v/cmax*100)}%;background:var(${over?"--neg":near?"--warn":lim?"--accent":"--c7"});opacity:${lim?1:.55}"></i></div></div>`}).join("")}</div>`
      :`<div class="sub">Bu ay gider yok.</div>`}
  </section>
  <section class="card">
    <div class="sec" style="margin-bottom:8px;flex-wrap:wrap"><h2>İşlemler</h2><div class="seg" role="group">${[["all","Tümü"],["in","Gelir"],["out","Gider"]].map(([k,l])=>`<button data-act="txtype" data-k="${k}" aria-pressed="${view.txType===k}">${l}</button>`).join("")}</div></div>
    ${txFilterBar()}<div id="txList">${txList()}</div>
  </section>`;
}

/* ---------- gün sonu bildirimi ----------
   Sunucu yalnızca içi boş bir "uyandırma" bildirimi yollar. Günlük kâr/zararı servis çalışanı hesaplar;
   bunun için gereken en küçük veri (miktarlar, fiyatın nereden okunacağı, önceki günün birim değerleri)
   bu cihazın önbelleğine yazılır. Açma/kapama cihaz başınadır. */
const NK="emanet-notif";
const notifOnLocal=()=>{try{return localStorage.getItem(NK)==="1"}catch(e){return false}};
const notifKey=()=>new URL("__notif/snap",location.href).href;
async function notifSnap(){
  if(!notifOnLocal()||!state||!("caches" in window))return;
  try{
    const D=state.day,t=todayISO(),mp=mainPf();
    const ref=D?(D.d===t?D.ref:(D.cur&&Object.keys(D.cur).length?{d:D.d,h:D.cur}:D.ref)):null;
    const snap={at:Date.now(),hide:!!S().hide,auto:S().autoPrices!==false,rates:S().rates,urls:marketUrls().map(u=>new URL(u,location.href).href),open:location.href.split("#")[0],
      ref:ref&&ref.h?{d:ref.d,u:Object.fromEntries(Object.entries(ref.h).map(([k,v])=>[k,v.u]))}:null,
      pfs:state.portfolios.map(p=>({n:p.name,main:!!mp&&p.id===mp.id,hs:p.holdings.filter(h=>+h.qty>0).map(h=>{
        const sy=(h.symbol||"").toUpperCase().trim(),gk=h.cur==="TRY"?(h.kind==="altin"?goldKey(h):h.kind==="gumus"?"gumus":null):null;
        return{id:h.id,q:+h.qty,cur:h.cur,last:effPrice(h).p,g:gk||undefined,k:!gk&&sy?[h.kind+":"+sy].concat(h.kind==="abd"?["hisse:"+sy]:[]):undefined,buy:h.buyDate||undefined,cu:costIn(h,"TRY")/+h.qty}})})).filter(p=>p.hs.length)};
    await(await caches.open(NK)).put(notifKey(),new Response(JSON.stringify(snap),{headers:{"content-type":"application/json"}}));
  }catch(e){}
}
const b64uBytes=x=>{x=x.replace(/-/g,"+").replace(/_/g,"/");const b=atob(x+"=".repeat((4-x.length%4)%4));return Uint8Array.from(b,c=>c.charCodeAt(0))};
const notifSupport=()=>"serviceWorker" in navigator&&"PushManager" in window&&"Notification" in window;
const swReady=()=>Promise.race([navigator.serviceWorker.ready,new Promise((_,r)=>setTimeout(()=>r(new Error("Uygulama dosyaları henüz hazır değil; sayfayı yenileyip yeniden deneyin.")),8000))]);
async function notifSet(on){
  try{
    const reg=await swReady();let sub=await reg.pushManager.getSubscription();
    if(on){
      if(await Notification.requestPermission()!=="granted")throw new Error("Bildirim izni verilmedi.");
      if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64uBytes(CFG.vapidPublicKey)});
      const {error}=await sb.from("emanet_push").upsert({endpoint:sub.endpoint,user_id:sbUser.id},{onConflict:"endpoint"});
      if(error)throw new Error(/emanet_push|relation|schema cache|not find/i.test(error.message||"")?"Bildirim tablosu henüz kurulmamış; Supabase'de kurulum SQL'ini bir kez çalıştırmak gerekiyor.":"Cihaz kaydedilemedi: "+(error.message||"bilinmeyen hata"));
      localStorage.setItem(NK,"1");await notifSnap();toast("Gün sonu bildirimi bu cihazda açıldı");
    }else{
      if(sub){try{if(sb)await sb.from("emanet_push").delete().eq("endpoint",sub.endpoint)}catch(e){}await sub.unsubscribe()}
      localStorage.removeItem(NK);try{await caches.delete(NK)}catch(e){}
      toast("Gün sonu bildirimi bu cihazda kapatıldı");
    }
  }catch(e){toast(e.message||"Bildirim ayarlanamadı")}
  render();
}
async function notifTest(){
  try{await notifSnap();const reg=await swReady();if(!reg.active)throw new Error("Uygulama dosyaları henüz hazır değil.");reg.active.postMessage({type:"gun-sonu",test:true});toast("Deneme bildirimi gönderildi")}
  catch(e){toast(e.message||"Deneme bildirimi gönderilemedi")}
}
function notifCard(){
  const on=notifOnLocal();
  const why=!notifSupport()?"Bu tarayıcı bildirimi desteklemiyor. iPhone ve iPad'de önce Safari'de Paylaş → Ana Ekrana Ekle ile uygulamayı kurun, sonra uygulamanın içinden burayı açın."
    :!cloudOn()?"Bildirim için e-posta ile giriş yapmış olmanız gerekir."
    :!CFG.vapidPublicKey?"Bildirim anahtarı tanımlı değil."
    :Notification.permission==="denied"?"Bu site için bildirim izni kapalı. Telefonun ya da tarayıcının ayarlarından Emanet için bildirime izin verin.":"";
  return `<section class="card"><div class="set-group">
    <div class="set-row"><div class="lbl"><b>Gün sonu bildirimi</b><small>Hafta içi her akşam 18:40 civarında ana portföyünüzün günlük kâr/zararı bu cihaza bildirim olarak gelir. Başka portföyleriniz varsa onlar da bildirimin altında yazar.</small></div><label class="toggle"><input type="checkbox" id="notifTog" ${on?"checked":""} ${why&&!on?"disabled":""}><span></span></label></div>
    ${why?`<div class="note warn">${why}</div>`:""}
    ${on?`<div class="set-row"><div class="lbl"><b>Deneme</b><small>Bildirimin bu cihazda nasıl görüneceğini şimdi gösterir</small></div><button class="btn sm" data-act="notif-test">Deneme bildirimi</button></div>`:""}
    <div class="note">Bildirim her cihazda ayrı açılır. Tutarlarınız sunucuya gönderilmez; hesap bu cihazda yapılır. “Tutarları gizle” açıksa bildirimde yalnızca yüzde yazar. Bildirim birkaç dakika gecikebilir; telefon pil tasarrufundaysa daha da gecikebilir.</div>
  </div></section>`;
}

/* ---------- getiri karşılaştırması ----------
   Portföy getirisi "zaman ağırlıklı" hesaplanır: para ekleyip çekmek getiriyi değiştirmez, yalnızca fiyat hareketi ölçülür.
   Günler arası para girişi = maliyet değişimi; satışta elde edilen para maliyet + kâr olduğundan satış kârı ayrıca düşülür.
   Altın ve dolar, her günün kaydındaki gram fiyatı ve kurdan; BIST 100, fiyat görevinin tuttuğu günlük kapanışlardan gelir. */
function histRows(ids,range){
  const by={};
  ids.forEach(id=>(state.hist&&state.hist[id]||[]).forEach(r=>{const o=by[r[0]]=by[r[0]]||{v:0,c:0,usd:r[3],g:r[4]};o.v+=r[1];o.c+=r[2]}));
  let rows=Object.keys(by).sort().map(d=>({d,...by[d]}));
  if(range&&range!=="all"){const from=addDays(todayISO(),-range);rows=rows.filter(r=>r.d>=from)}
  return rows;
}
function benchAt(d){const x=bench&&bench.xu100;if(!x)return 0;for(let i=0;i<8;i++){const v=+x[addDays(d,-i)];if(v>0)return v}return 0}
function ufeLevel(d){
  if(!ufe||!ufe.idx)return null;
  const L=ufe.latest||Object.keys(ufe.idx).sort().pop(),gl=ufeAt(L)/(ufeAt(prevMonth(L+"-15"))||ufeAt(L));
  const mdiff=(a,b)=>(+b.slice(0,4)-+a.slice(0,4))*12+(+b.slice(5,7)-+a.slice(5,7));
  const at=ym=>ufeAt(ym)||(ym>L?ufeAt(L)*Math.pow(gl,mdiff(L,ym)):0);
  const ym=d.slice(0,7),v0=at(prevMonth(d)),v1=at(ym);if(!v0||!v1)return null;
  return{v:v0*Math.pow(v1/v0,(+d.slice(8))/dim(+ym.slice(0,4),+ym.slice(5,7))),est:ym>L};
}
function benchCalc(ids,range){
  const rows=histRows(ids,range);if(rows.length<2)return null;
  const a=rows[0],z=rows[rows.length-1];
  const sellPL={};state.portfolios.filter(p=>ids.includes(p.id)).forEach(p=>p.holdings.forEach(h=>(h.trades||[]).forEach(t=>{if(t.type==="sell"&&t.date&&t.pl!=null)sellPL[t.date]=(sellPL[t.date]||0)+(+t.pl||0)*rate(h.cur)})));
  const sd=Object.keys(sellPL);
  let idx=1;
  for(let i=1;i<rows.length;i++){const p=rows[i-1],r=rows[i];if(!(p.v>0))continue;
    let F=r.c-p.c;sd.forEach(d=>{if(d>p.d&&d<=r.d)F-=sellPL[d]});
    const g=(r.v-F)/p.v;if(g>0&&isFinite(g))idx*=g}
  const items=[{k:"pf",n:"Portföy",v:(idx-1)*100}];
  if(a.g>0&&z.g>0)items.push({k:"g",n:"Gram altın",v:(z.g/a.g-1)*100});
  if(a.usd>0&&z.usd>0)items.push({k:"usd",n:"Dolar",v:(z.usd/a.usd-1)*100});
  const x0=benchAt(a.d),x1=benchAt(z.d);if(x0>0&&x1>0)items.push({k:"xu",n:"BIST 100",v:(x1/x0-1)*100});
  const u0=ufeLevel(a.d),u1=ufeLevel(z.d);let est=false;
  if(u0&&u1){items.push({k:"ufe",n:"Enflasyon (Yİ-ÜFE)",v:(u1.v/u0.v-1)*100});est=u0.est||u1.est}
  return{from:a.d,to:z.d,days:daysBetween(a.d,z.d),items,est};
}
function benchCard(ids){
  const range=view.hRange||90,b=benchCalc(ids,range);
  const segR=`<div class="seg" role="group" aria-label="Dönem">${[[30,"1A"],[90,"3A"],[365,"1Y"],["all","Tümü"]].map(([k,l])=>`<button data-act="hrange" data-k="${k}" aria-pressed="${String(range)===String(k)}">${l}</button>`).join("")}</div>`;
  if(!b)return `<section class="card side"><div class="sec"><h2>Getiri karşılaştırması</h2></div><div class="sub" style="margin-top:6px">Karşılaştırma için en az iki ayrı günün kaydı gerekir. Uygulamayı açtığınız her gün portföy değeri kaydedilir; ${histRows(ids,"all").length>=2?"daha uzun bir dönem seçerseniz görünür.":"yarından itibaren burada görünür."}</div>${histRows(ids,"all").length>=2?`<div style="margin-top:10px">${segR}</div>`:""}</section>`;
  const it=b.items.slice().sort((x,y)=>y.v-x.v),mx=Math.max(...it.map(i=>Math.abs(i.v)),.01);
  const pf=b.items[0],ufeI=b.items.find(i=>i.k==="ufe"),alt=it.filter(i=>i.k!=="pf"&&i.k!=="ufe"),best=alt[0];
  const pts=v=>fmtN(Math.abs(v),1)+" puan";
  let verdict="";
  if(best)verdict=pf.v>=best.v?`Portföyünüz bu dönemde altın, dolar ve borsanın hepsinden iyi getirdi; en yakını ${best.n} (${pts(pf.v-best.v)} geride).`:`Bu dönemin en iyisi ${best.n} oldu; portföyünüz ondan ${pts(best.v-pf.v)} geride kaldı.`;
  const real=ufeI?((1+pf.v/100)/(1+ufeI.v/100)-1)*100:null;
  return `<section class="card side"><div class="sec" style="margin-bottom:10px;flex-wrap:wrap"><h2>Getiri karşılaştırması</h2>${segR}</div>
    <div class="bn" role="list">${it.map(i=>`<div class="bn-row ${i.k==="pf"?"me":""}" role="listitem"><span class="bn-n">${i.n}</span><span class="bn-bar" aria-hidden="true"><i class="${i.v<0?"neg":""}" style="width:${Math.max(2,Math.abs(i.v)/mx*100).toFixed(1)}%"></i></span><b class="num ${i.v>=0?"pos-t":"neg-t"}">${fmtPct(i.v)}</b></div>`).join("")}</div>
    ${verdict?`<p class="bn-v">${verdict}${real!=null?` Enflasyondan arındırılmış getiriniz <b class="${real>=0?"pos-t":"neg-t"}">${fmtPct(real)}</b>.`:""}</p>`:""}
    <div class="sub">${fmtDate(b.from)} – ${fmtDate(b.to)} · ${b.days} gün. Para ekleyip çekmeniz getiriyi değiştirmez; yalnızca fiyat hareketi ölçülür.${b.est?" Son ayın enflasyonu henüz açıklanmadığı için tahminidir.":""}${b.items.some(i=>i.k==="xu")?"":" BIST 100 verisi birkaç saat içinde eklenecek."}</div></section>`;
}

/* ---------- gelir-gider: arama ve süzme ---------- */
function txRow(t){const card=t.type==="card"?cardById(t.card):null,mc=t.method&&cardById(t.method),inc=t.type==="in",cp=t.type==="card";
  return li({act:"edit-tx",id:t.id,mark:mkIcon(cp?I.card:catIcon(t.cat),inc?"--pos":cp?"--c2":"--accent"),title:cp?"Kart ödemesi":esc(t.cat),
    sub:[cp?esc(card?card.name:"kart"):"",mc?esc(mc.name):"",t.inst?"Taksit "+t.inst:"",t.rid?"Sabit":"",esc(t.note||"")].filter(Boolean).join(" · "),
    amount:(inc?"+":cp?"":"−")+fmt(t.amount,t.cur),cls:inc?"pos-t":""})}
function txMatch(){
  const q=trLow((view.txQ||"").trim()),cat=view.txCat||"",ty=view.txType||"all";
  const dq=q.replace(/[.\s₺]/g,"").replace(",","."),isNum=/^\d+(\.\d+)?$/.test(dq);
  const list=(q?state.tx:monthTx(view.month)).filter(t=>{
    if(ty!=="all"&&!(ty==="out"?(t.type==="out"||t.type==="card"):t.type===ty))return false;
    if(cat&&t.cat!==cat)return false;
    if(!q)return true;
    const c=cardById(t.card)||cardById(t.method);
    if(trLow([t.cat,t.note,c&&c.name,fmtDate(t.date),t.type==="card"?"kart ödemesi":""].filter(Boolean).join(" ")).includes(q))return true;
    return isNum&&String(+t.amount).startsWith(String(+dq));
  }).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  return{list,q,active:!!(q||cat)};
}
function txList(){
  const {list,q,active}=txMatch();
  if(!list.length)return `<div class="empty"><b>${active?"Eşleşen işlem yok":"Bu ay kayıt yok"}</b>${active?"Aramayı ya da kategori seçimini değiştirin.":"Gelir veya gider eklemek için “İşlem ekle” düğmesini kullanın."}</div>`;
  let i=0,o=0;list.forEach(t=>{const v=toBase(t.amount,t.cur);if(t.type==="in")i+=v;else if(t.type==="out")o+=v});
  const N=200,groups={};list.slice(0,N).forEach(t=>(groups[t.date]=groups[t.date]||[]).push(t));
  return (active?`<div class="tx-sum"><span>${q?"Tüm aylarda ":""}<b>${list.length}</b> işlem</span>${o?`<span>Gider <b class="num">${fmt(o)}</b></span>`:""}${i?`<span>Gelir <b class="num pos-t">${fmt(i)}</b></span>`:""}<button class="btn ghost sm" data-act="txclear">Temizle</button></div>`:"")
    +Object.entries(groups).map(([d,ts])=>`<div class="label" style="margin-top:10px">${fmtDate(d)}</div><div class="list">${ts.map(txRow).join("")}</div>`).join("")
    +(list.length>N?`<div class="sub" style="margin-top:8px">İlk ${N} işlem gösteriliyor; aramayı daraltın.</div>`:"");
}
function txFilterBar(){
  const cats=[...new Set([...CATS.out,...CATS.in,...state.tx.map(t=>t.cat).filter(Boolean)])];
  return `<div class="txf"><label class="search">${ic(I.search,18)}<span class="sr">İşlemlerde ara</span><input id="txQ" type="search" enterkeyhint="search" placeholder="Not, kategori ya da tutar ara" value="${esc(view.txQ||"")}" autocomplete="off"></label>
    <select id="txCat" aria-label="Kategoriye göre süz"><option value="">Tüm kategoriler</option>${cats.map(c=>`<option value="${esc(c)}" ${view.txCat===c?"selected":""}>${esc(c)}</option>`).join("")}</select></div>`;
}
document.addEventListener("input",e=>{if(e.target.id==="txQ"){view.txQ=e.target.value;const l=$("#txList");if(l)l.innerHTML=txList()}});
document.addEventListener("change",e=>{
  if(e.target.id==="txCat"){view.txCat=e.target.value;render()}
  if(e.target.id==="notifTog"){e.target.disabled=true;notifSet(e.target.checked)}
});

function debtRow(d){
  const left=debtLeft(d),tot=+d.amount||0,pct=tot?(tot-left)/tot*100:0,lent=d.dir==="lent";
  let st="";
  if(left<=0)st=`<span class="pill pos">Kapandı</span>`;
  else if(d.due){const n=daysBetween(todayISO(),d.due);st=n<0?`<span class="pill neg">${-n} gün gecikti</span>`:n<=14?`<span class="pill warn">${n} gün kaldı</span>`:`<span class="pill">${fmtDate(d.due)}</span>`}
  const pf=state.portfolios.length>1&&d.pf?(state.portfolios.find(p=>p.id===d.pf)||{}).name:"";
  return li({act:"open-debt",id:d.id,mark:mk(esc((d.person||"?").trim().slice(0,1).toUpperCase()),lent?"--pos":"--neg"),title:esc(d.person),
    sub:(lent?"Alacak":"Borç")+(pf?" · "+esc(pf):"")+" · "+fmt(tot-left,d.cur)+" / "+fmt(tot,d.cur)+" ödendi",
    extra:`<div class="share"><i style="width:${pct}%;background:var(${lent?"--pos":"--neg"})"></i></div>`,amount:fmt(left,d.cur),trail:st});
}
function rBorc(){
  const bp=view.debtPf&&view.debtPf!=="all"&&state.portfolios.some(p=>p.id===view.debtPf)?view.debtPf:null;
  const inPf=d=>!bp||(d.pf||(mainPf()||{}).id)===bp;
  const list=state.debts.filter(d=>d.dir===view.debtDir&&inPf(d)).sort((a,b)=>(debtLeft(b)>0)-(debtLeft(a)>0)||(a.due||"9").localeCompare(b.due||"9"));
  const recv=debtSum("lent",bp),pay=debtSum("borrowed",bp);
  return `
  ${state.portfolios.length>1?`<div class="chips" role="group" aria-label="Portföy filtresi"><button class="chip" data-act="dpf" data-k="all" aria-pressed="${!bp}">Tümü</button>${state.portfolios.map(p=>`<button class="chip" data-act="dpf" data-k="${p.id}" aria-pressed="${bp===p.id}">${esc(p.name)}</button>`).join("")}</div>`:""}
  <section class="hero flat"><div class="trio" style="border:0;padding:0;grid-template-columns:1fr 1fr 1fr">
    <div><span class="label">Alacaklarım</span><div class="v pos-t">${fmt(recv)}</div></div>
    <div><span class="label">Borçlarım</span><div class="v neg-t">${fmt(pay)}</div></div>
    <div><span class="label">Fark</span><div class="v">${fmt(recv-pay)}</div></div>
  </div></section>
  <div class="seg full" role="group">${[["lent","Verdiğim borçlar"],["borrowed","Aldığım borçlar"]].map(([k,l])=>`<button data-act="ddir" data-k="${k}" aria-pressed="${view.debtDir===k}">${l}</button>`).join("")}</div>
  <section class="card">${list.length?`<div class="list">${list.map(debtRow).join("")}</div>`:`<div class="empty"><b>${view.debtDir==="lent"?"Verdiğiniz bir borç yok":"Aldığınız bir borç yok"}</b>Kişiyi, tutarı ve vadeyi girin; ödemeleri parça parça işleyin.</div>`}</section>`;
}

function rZekat(){
  const z=zakat(),s=S(),g=z.gold,ows=owners();
  const autoFresh=AUTO()&&market.updatedAt&&(Date.now()-new Date(market.updatedAt))<4*864e5;
  const stale=!autoFresh&&(!s.ratesUpdated||daysBetween(s.ratesUpdated,todayISO())>7);
  const gTxt=v=>s.hide?"••":fmtN(v,2)+" g";
  return `
  ${state.portfolios.length>1?`<div class="chips" role="group" aria-label="Hangi portföyün zekâtı">${state.portfolios.map(p=>`<button class="chip" data-act="zowner" data-k="${p.id}" aria-pressed="${z.owner===p.id}">${esc(p.name)}${ows.length>1?" · "+esc(ownerOf(p)):""}</button>`).join("")}</div>
  <div class="sub" style="margin-top:-6px">Her portföyün zekâtı, nisabı ve zekât günü ayrı hesaplanır.${s.zakatRecv||s.zakatDebt?" Borç ve alacaklar, kaydederken seçtiğiniz portföyün hesabına girer.":""}</div>`:""}
  ${!g.gram?`<div class="note warn">Nisabı hesaplamak için altın lira fiyatlarını girin. <button class="btn ghost sm" data-act="rates" style="padding:0;color:inherit;text-decoration:underline">Fiyatları gir</button></div>`
    :stale?`<div class="note warn">Altın ve kur fiyatları ${s.ratesUpdated?fmtDate(s.ratesUpdated)+" tarihinden beri":"bir süredir"} güncellenmedi. <button class="btn ghost sm" data-act="rates" style="padding:0;color:inherit;text-decoration:underline">Güncelle</button></div>`:""}
  <section class="hero flat">
    <div><span class="label">${z.reached?(z.hawl?"Bu dönem ödenecek zekât":"Nisaba ulaşıldı · tahmini zekât"):"Zekât durumu"}</span>
      <div class="big">${!g.gram?"Fiyat bekleniyor":z.reached?money(z.left):"Nisap altında"}</div>
      <div class="sub">${!g.gram?"":z.reached?`Toplam ${fmt(z.due)} · ödenen ${fmt(z.paid)}`:`Nisaba ${gTxt(Math.max(0,s.nisabGram-z.netGram))} altın karşılığı kaldı`}</div></div>
    <div class="trio"><div><span class="label">Tabi varlık</span><div class="v">${gTxt(z.netGram)}</div></div><div><span class="label">Nisap</span><div class="v">${fmtN(s.nisabGram)} g</div></div><div><span class="label">Havl</span><div class="v">${z.hawl?z.hawl.left+" gün":"—"}</div></div></div>
    ${g.gram?`<div class="bar" aria-hidden="true"><i style="width:${Math.min(100,z.netGram/s.nisabGram*100)}%"></i></div>`:""}
  </section>
  <div class="grid2">
  <section class="card"><h2 style="margin-bottom:8px">Hesap dökümü</h2><div class="kv">
    ${Object.entries(z.byKind).map(([k,v])=>`<div><span>${esc(k==="__cash"?CASH_LBL:(KINDS[k]||k))}</span><span>${fmt(v)}</span></div>`).join("")||(z.cash?"":`<div><span>Zekâta tabi varlık</span><span>${fmt(0)}</span></div>`)}
    ${z.cash?`<div><span>Nakit (gelir-gider bakiyesi)</span><span class="${z.cash<0?"neg-t":""}">${fmt(z.cash)}</span></div>`:""}
    ${s.zakatRecv?`<div><span>Tahsili umulan alacaklar</span><span class="pos-t">+${fmt(z.recv)}</span></div>`:""}
    ${s.zakatDebt?`<div><span>Borçlar</span><span class="neg-t">−${fmt(z.debt)}</span></div>`:""}
    <div class="total"><span>Net (TL karşılığı)</span><span>${fmt(z.net)}</span></div>
    <div><span>Gram altın fiyatı${g.coin?` (${esc(g.coin.n)} ÷ 7,2${AUTO()&&market.gold&&+market.gold[g.coin.k]>0?", "+marketWhen():""})`:""}</span><span>${g.gram?fmt(g.gram,"TRY",{dec:2,show:true}):"—"}</span></div>
    <div class="total"><span>Altın karşılığı</span><span>${g.gram?gTxt(z.netGram):"—"}</span></div>
    <div><span>Nisap (${fmtN(s.nisabGram)} g)</span><span>${g.gram?fmt(z.nisab):"—"}</span></div>
    <div class="total"><span>Zekât (%2,5)</span><span>${fmt(z.due)}</span></div>
  </div></section>
  <section class="card side" style="display:flex;flex-direction:column;gap:10px"><h2>Hicri yıl (havl)</h2>
    ${z.hawl?`<div class="kv"><div><span>Dönem başı</span><span style="font-family:var(--f-body)">${fmtH(z.hawl.start)}<br><small class="sub">${fmtDate(z.hawl.start)}</small></span></div><div><span>Zekât günü</span><span style="font-family:var(--f-body)">${fmtH(z.hawl.next)}<br><small class="sub">${fmtDate(z.hawl.next)}</small></span></div><div><span>Kalan</span><span>${z.hawl.left} gün</span></div></div>
    <div class="bar"><i style="width:${Math.min(100,Math.max(0,(z.hawl.total-z.hawl.left)/z.hawl.total*100))}%"></i></div>
    <div class="sub">Bugün ${fmtH(todayISO())}. Zekât günü her yıl aynı hicri tarihte döner.</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" data-act="zset">Tarihi değiştir</button><button class="btn sm danger" data-act="hawl-clear">Tarihi kaldır</button></div>`
    :`<div class="sub">${z.reached?"Varlığınız nisabı aştı ama zekât günü belirlenmedi. Nisaba ulaştığınız hicri tarihi girin; bir hicri yıl dolunca zekât vacip olur.":"Nisaba ulaşmadığınız için zekât günü yok. Nisaba ulaştığınızda buradan başlatın."}</div>
    <div class="sub">Bugün ${fmtH(todayISO())}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">${z.reached?`<button class="btn sm primary" data-act="hawl-today">Bugünü zekât günü yap</button>`:""}<button class="btn sm" data-act="zset">Tarih gir</button></div>`}
  </section>
  </div>
  <section class="card side"><div class="sec" style="margin-bottom:6px"><h2>Ödenen zekâtlar</h2></div>
    ${state.zakatPaid.some(p=>p.pf===z.owner)?`<div class="list">${state.zakatPaid.filter(p=>p.pf===z.owner).slice().sort((a,b)=>b.date.localeCompare(a.date)).map(p=>li({act:"edit-zp",id:p.id,mark:mkIcon(I.zekat,"--accent"),title:esc(p.note||"Zekât ödemesi"),sub:fmtH(p.date)+" · "+fmtDate(p.date),amount:fmt(p.amount,p.cur)})).join("")}</div>`:`<div class="empty"><b>Henüz ödeme kaydı yok</b>Verdiğiniz zekâtı kaydederek kalan tutarı izleyin.</div>`}
  </section>
  <p class="sub" style="margin:0">Gram fiyatı, Reşat altının alış fiyatı 7,2'ye bölünerek bulunur. Hesap bilgilendirme amaçlıdır; fıkhi ayrıntılar için bir hocaya danışın.</p>`;
}

/* vurgu renkleri: [anahtar, ad, açık tema rengi, koyu tema rengi]; tonlar: [anahtar, ad, açık (zemin, kart, dolgu, çizgi), koyu (…)] — theme.css ile aynı değerler */
const ACCENTS=[["kobalt","Kobalt","#2443b6","#93a9ff"],["lacivert","Lacivert","#1f3a68","#9fbbe8"],["turkuaz","Turkuaz","#0c8a93","#63d6dc"],["zumrut","Zümrüt","#15775a","#62d3ab"],["kehribar","Kehribar","#a45a06","#f3bd6a"],["mercan","Mercan","#c7452c","#ff9c87"],["gul","Gül","#bf2f6b","#ff9ec2"],["mor","Mor","#6a3fc0","#b7a3ff"]];
const TONES=[["gri","Porselen",["#f2f4f9","#ffffff","#e9edf5","#dce2ed"],["#0b1020","#131a2e","#1b2440","#263050"]],["krem","Krem",["#f6f1e8","#fffdf9","#eee6d8","#e2d9c8"],["#15120d","#1e1a14","#28231b","#393226"]],["mavi","Buz mavisi",["#e6edf8","#ffffff","#d9e3f3","#c9d5e9"],["#081326","#0f1d36","#172949","#22365c"]],["adacayi","Adaçayı",["#ecf2ee","#fbfdfb","#dfe9e2","#cfdcd3"],["#0d1511","#141e19","#1c2922","#29382f"]],["lavanta","Lavanta",["#eeebf7","#fefdff","#e2ddf1","#d3cce6"],["#100d1c","#181429","#221d38","#30294c"]],["gul","Gül kurusu",["#f7ecee","#fffdfd","#f0dde1","#e5cdd2"],["#190e11","#22151a","#2e1d23","#402a32"]]];
function rAyarlar(){
  const s=S(), zo=zOwner(), hh=getHawl(zo);
  const seg=(key,opts)=>`<div class="seg" role="group">${opts.map(([v,l])=>`<button data-act="set" data-k="${key}" data-v="${v}" aria-pressed="${s[key]===v}">${l}</button>`).join("")}</div>`;
  const tog=(key,label,small,path)=>{const val=path?s[path][key]:s[key];return `<div class="set-row"><div class="lbl"><b>${label}</b>${small?`<small>${small}</small>`:""}</div><label class="toggle"><input type="checkbox" id="t-${path||"s"}-${key}" data-act="tog" data-k="${key}" ${path?`data-p="${path}"`:""} ${val?"checked":""}><span></span></label></div>`};
  const num=(id,label,val,small)=>`<div class="set-row"><div class="lbl"><b>${label}</b>${small?`<small>${small}</small>`:""}</div><input class="inline-in" id="${id}" inputmode="decimal" data-act="num" data-k="${id}" value="${esc(String(val).replace(".",","))}"></div>`;
  const dark=s.theme==="dark"||(s.theme!=="light"&&window.matchMedia("(prefers-color-scheme:dark)").matches);
  const acc=ACCENTS.some(x=>x[0]===s.accent)?s.accent:"kobalt",tone=TONES.some(x=>x[0]===s.tone)?s.tone:"gri";
  const G={};
  G.gorunum=`<section class="card"><div class="set-group">
    <div class="set-row"><div class="lbl"><b>Tema</b></div>${seg("theme",[["system","Sistem"],["light","Açık"],["dark","Koyu"]])}</div>
    <div class="set-row col"><div class="lbl"><b>Vurgu rengi</b><small>${(ACCENTS.find(x=>x[0]===acc)||ACCENTS[0])[1]}</small></div><div class="swatches">${ACCENTS.map(([k,l,c,d])=>`<button class="sw" data-act="set" data-k="accent" data-v="${k}" aria-pressed="${acc===k}" aria-label="${l}" title="${l}" style="--sw:${dark?d:c};color:${dark?"#0b1020":"#fff"}">${acc===k?ic(I.check,18):""}</button>`).join("")}</div></div>
    <div class="set-row col"><div class="lbl"><b>Arka plan tonu</b><small>Sayfanın ve kartların zemin rengi</small></div><div class="tones">${TONES.map(([k,l,lt,dk])=>{const c=dark?dk:lt;return `<button class="tone" data-act="set" data-k="tone" data-v="${k}" aria-pressed="${tone===k}" aria-label="${l}"><span class="tone-p" style="background:${c[0]};border-color:${c[3]}" aria-hidden="true"><span style="background:${c[1]};border-color:${c[3]}"><i style="background:var(--accent)"></i><i style="background:${c[2]}"></i><i style="background:${c[2]}"></i></span></span><span class="tone-n">${tone===k?ic(I.check,14):""}${l}</span></button>`}).join("")}</div></div>
    <div class="set-row"><div class="lbl"><b>Yazı boyutu</b></div>${seg("fontSize",[["s","Küçük"],["m","Normal"],["l","Büyük"],["xl","Çok büyük"]])}</div>
    ${tog("compact","Sıkı yerleşim","Kartlar arası boşluğu azaltır")}
    ${tog("hide","Tutarları gizle","Başkalarının yanında açarken")}
    <div class="set-row"><div class="lbl"><b>Açılış ekranı</b></div><select class="inline-in" style="text-align:left;font-family:var(--f-body);width:auto" id="startSel" data-act="startsel">${TABS.map(([k,l])=>`<option value="${k}" ${s.start===k?"selected":""}>${l}</option>`).join("")}</select></div>
  </div></section>`;
  G.islem=`<section class="card"><div class="set-group">
    <div class="set-row"><div class="lbl"><b>Varsayılan komisyon oranı</b><small>Alım ve satışta komisyon boş bırakılırsa tutarın bu yüzdesi kullanılır (ör. 0,2)</small></div><div style="display:flex;align-items:center;gap:6px"><span>%</span><input class="inline-in" style="width:5.5em" id="feeRateIn" inputmode="decimal" data-act="feerate" value="${esc(String(s.feeRate||0).replace(".",","))}"></div></div>
    <div class="set-row"><div class="lbl"><b>Varsayılan stopaj oranları</b><small>Satış ekranına önceden yazılır; her satışta değiştirebilirsiniz. Oranlar dönemsel değişir, aracı kurumunuzdan kontrol edin.</small></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">${[["fon","Fon"],["ppf","Para piyasası"],["hisse","BIST hisse"],["abd","ABD hisse"]].map(([k,l])=>`<label style="display:flex;align-items:center;gap:4px;font-size:.82rem">${l} %<input class="inline-in" style="width:4.2em" id="wht_${k}" data-act="wht" data-k="${k}" inputmode="decimal" placeholder="0" value="${(s.whtRates||{})[k]!=null&&(s.whtRates||{})[k]!==""?esc(String(s.whtRates[k]).replace(".",",")):""}"></label>`).join("")}</div></div>
  </div></section>`;
  G.fiyat=`<section class="card" id="ratesCard"><div class="set-group">
    ${tog("autoPrices","Fiyatları otomatik al","Döviz, altın, hisse, fon ve kripto fiyatları yaklaşık yarım saatte bir kendiliğinden yenilenir")}
    <div class="set-row"><div class="lbl"><b>Son güncelleme</b><small>${market?marketWhen()+(market.source?" · "+esc(market.source):""):"Henüz otomatik fiyat yok"}${market&&market.errors&&market.errors.length?"<br>Alınamayanlar: "+esc(market.errors.join("; ")):""}</small></div><button class="btn sm" data-act="refresh">Şimdi denetle</button></div>
    ${AUTO()?`<div class="note">Otomatik fiyat bulunan kalemlerde aşağıdaki elle girilen değerler kullanılmaz; bulunamayanlarda yedek olarak kullanılır. Hisse ve fonlarda varlığa kod girmeniz yeterli (ör. THYAO, AAPL, TTE).</div>`:""}
    <div class="set-row"><div class="lbl"><b>Gösterim para birimi</b><small>Toplamlar bu birimde gösterilir</small></div>${seg("base",CURS.map(c=>[c,c]))}</div>
    ${AUTO()&&market.fx&&+market.fx.USD>0?`<div class="set-row"><div class="lbl"><b>USD / TRY</b><small>Otomatik</small></div><span class="num">${fmtN(rate("USD"),4)}</span></div><div class="set-row"><div class="lbl"><b>EUR / TRY</b><small>Otomatik</small></div><span class="num">${fmtN(rate("EUR"),4)}</span></div>`
      :num("rUSD","USD / TRY",s.rates.USD)+num("rEUR","EUR / TRY",s.rates.EUR)}
    ${AUTO()&&market.gold&&+market.gold.resatAlis>0?`<div class="set-row"><div class="lbl"><b>Reşat altın alış</b><small>Otomatik · nisap için 7,2'ye bölünür</small></div><span class="num">${fmtN(market.gold.resatAlis,2)}</span></div>`:`<div class="label" style="margin-top:12px">Damgalı altın lira fiyatları (TL), otomatik fiyat yokken kullanılır</div>
    ${COINS.map(([k,n])=>num("coin_"+k,n+(AUTO()&&market.gold&&+market.gold[k]>0?" · oto "+fmtN(market.gold[k],0):""),s.coins[k]||"")).join("")}`}
    <div class="set-row"><div class="lbl"><b>Zekât için gram fiyatı</b><small>${goldInfo().coin?esc(goldInfo().coin.n)+" ÷ 7,2":"En az bir lira fiyatı girin"}</small></div><span class="num">${goldInfo().gram?fmt(goldInfo().gram,"TRY",{dec:2,show:true}):"—"}</span></div>
    ${AUTO()&&market.fx&&+market.fx.USD>0&&market.gold&&+market.gold.resatAlis>0?"":`<div class="set-row"><div class="lbl"><small>Elle güncelleme: ${s.ratesUpdated?fmtDate(s.ratesUpdated):"hiç"}</small></div><button class="btn primary sm" data-act="save-rates">Fiyatları kaydet</button></div>`}
  </div></section>`;
  G.zekat=`<section class="card" id="zakatCard"><div class="set-group">
    <div class="set-row"><div class="lbl"><b>Nisap</b><small>Gram cinsinden altın miktarı</small></div><div style="display:flex;align-items:center;gap:6px"><input class="inline-in" style="width:5em" id="nisabIn" inputmode="decimal" data-act="nisabin" value="${esc(String(s.nisabGram).replace(".",","))}"><span>g</span></div></div>
    <div class="set-row"><div class="lbl"><b>Zekât günü (hicri)${state.portfolios.length>1?" · "+esc(pfName(zo)):""}</b><small>${state.portfolios.length>1?`<select class="inline-in" style="width:auto;font-family:var(--f-body);text-align:left;margin:4px 0" id="zoSel" data-act="zosel" aria-label="Portföy">${state.portfolios.map(p=>`<option value="${p.id}" ${p.id===zo?"selected":""}>${esc(pfName(p.id))}</option>`).join("")}</select><br>`:""}${hh?"Nisaba ilk ulaşılan hicri tarih. Miladi karşılığı: "+fmtDate(fromH(hh.y,hh.m,hh.d)):"Belirlenmedi. Nisaba ulaşmadıysanız boş bırakın."}</small></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <select class="inline-in" style="width:auto;font-family:var(--f-body);text-align:left" id="hD" data-act="hijri" aria-label="Gün"><option value="" ${!hh?"selected":""}>Gün</option>${Array.from({length:30},(_,i)=>`<option value="${i+1}" ${hh&&hh.d===i+1?"selected":""}>${i+1}</option>`).join("")}</select>
        <select class="inline-in" style="width:auto;font-family:var(--f-body);text-align:left" id="hM" data-act="hijri" aria-label="Ay"><option value="" ${!hh?"selected":""}>Ay</option>${HM.map((n,i)=>`<option value="${i+1}" ${hh&&hh.m===i+1?"selected":""}>${n}</option>`).join("")}</select>
        <input class="inline-in" style="width:5.5em" id="hY" data-act="hijri" inputmode="numeric" aria-label="Yıl" placeholder="${toH(todayISO()).y}" value="${hh?hh.y:""}">
        ${hh?`<button class="btn sm danger" data-act="hawl-clear">Kaldır</button>`:""}
      </div></div>
    ${tog("zakatRecv","Alacakları dahil et","Tahsili umulan alacaklar")}
    ${tog("zakatDebt","Borçları düş")}
    <div class="label" style="margin-top:12px">Dahil edilen varlık türleri</div>
    ${Object.keys(KINDS).map(k=>tog(k,KINDS[k],"","zakatKinds")).join("")}
  </div></section>`;
  G.veri=`<section class="card"><div class="set-group">
    ${cloudOn()?`<div class="set-row"><div class="lbl"><b>Hesap</b><small>${esc(sbUser.email||"")} · veriler hesabınızda saklanır, diğer cihazlarınızda da açılır</small></div><button class="btn sm" data-act="signout">Çıkış yap</button></div>`
      :`<div class="set-row"><div class="lbl"><b>Kayıt yeri</b><small>Yalnızca bu cihazda. ${sb?"Giriş yaparsanız verileriniz hesabınıza taşınır ve diğer cihazlarınızda da açılır.":"Bulut eşitleme henüz kurulmadı; yedek almayı unutmayın."}</small></div>${sb?`<button class="btn sm primary" data-act="signin">Giriş yap</button>`:""}</div>`}
    <div class="set-row"><div class="lbl"><b>Yedek</b><small>Tüm veriler JSON dosyası olarak</small></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" data-act="export">Yedeği indir</button><label class="btn sm" for="importIn" style="cursor:pointer">Yedek yükle</label><input type="file" id="importIn" accept="application/json,.json" hidden></div></div>
    <div class="set-row"><div class="lbl"><b>Excel'e aktar</b><small>Excel ve Google E-Tablolar'da açılan CSV dosyaları</small></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" data-act="csv-h">Varlıklar</button><button class="btn sm" data-act="csv-t">Gelir-gider</button></div></div>
    <div class="set-row"><div class="lbl"><b>Tüm verileri sil</b><small>Portföyler, işlemler, borçlar ve zekât kayıtları silinir; ayarlar kalır</small></div><button class="btn sm danger" data-act="wipe">Sil</button></div>
  </div></section>`;
  G.bildirim=notifCard();
  const GN=[["gorunum","Görünüm",I.brush],["fiyat","Fiyat ve kur",I.trend],["islem","Alım-satım",I.buy],["zekat","Zekât",I.zekat],["bildirim","Bildirim",I.bell],["veri","Hesap ve veri",I.user]];
  const g=G[view.setG]?view.setG:"gorunum";
  return `
  <div class="chips setnav" role="group" aria-label="Ayar grubu">${GN.map(([k,l,icn])=>`<button class="chip" data-act="setg" data-k="${k}" aria-pressed="${g===k}">${ic(icn,16)}${l}</button>`).join("")}</div>
  ${G[g]}
  <button class="btn" data-tab="${s.start||"ozet"}" style="align-self:flex-start">Geri dön</button>
  <p class="sub" style="margin:0;text-align:center">Emanet ${APP_VERSION} · <a href="https://github.com/omerfarukcetin/emanet" target="_blank" rel="noopener">kaynak kod</a></p>`;
}

/* ---------- sheet ---------- */
let sheetOnClose=null;
function openSheet(html,bind){const w=$("#sheetWrap"),sh=$("#sheet");sh.innerHTML=html.replace(/<h3>([\s\S]*?)<\/h3>/,(_,t)=>`<div class="sh-head"><div class="grip"></div><div class="sh-title"><h3>${t}</h3><button type="button" class="icon-btn sh-x" aria-label="Kapat">${I.x}</button></div></div>`);const xb=sh.querySelector(".sh-x");if(xb)xb.onclick=closeSheet;sh.scrollTop=0;w.hidden=false;document.body.style.overflow="hidden";bind&&bind(sh);const f=sh.querySelector(".field.big input")||sh.querySelector("input:not([type=hidden]),select,button:not(.btn.ghost):not(.sh-x)");f&&setTimeout(()=>f.focus({preventScroll:true}),50)}
function closeSheet(){$("#sheetWrap").hidden=true;$("#sheet").innerHTML="";document.body.style.overflow=""}
$("#scrim").onclick=closeSheet;
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("#sheetWrap").hidden)closeSheet()});

const parseNum=v=>{if(v==null)return NaN;v=String(v).trim().replace(/\s/g,"");if(/,\d+$/.test(v)||(v.includes(",")&&!v.includes(".")))v=v.replace(/\./g,"").replace(",",".");return parseFloat(v)};
function field(f){
  const id="f_"+f.id;
  if(f.type==="select")return `<div class="field" id="w_${f.id}" ${f.hidden?"hidden":""}><label for="${id}">${f.label}</label><select id="${id}" name="${f.id}">${f.options.map(o=>{const[v,l]=Array.isArray(o)?o:[o,o];return `<option value="${esc(v)}" ${String(f.value)===String(v)?"selected":""}>${esc(l)}</option>`}).join("")}</select></div>`;
  if(f.type==="seg")return `<div class="field"><label>${f.label}</label><div class="seg full" role="group" data-seg="${f.id}">${f.options.map(([v,l])=>`<button type="button" data-v="${v}" aria-pressed="${f.value===v}">${l}</button>`).join("")}</div><input type="hidden" name="${f.id}" value="${esc(f.value)}"></div>`;
  const dl=f.list?`<datalist id="${id}_dl">${f.list.map(o=>`<option value="${esc(o)}">`).join("")}</datalist>`:"";
  return `<div class="field${f.big?" big":""}" id="w_${f.id}"><label for="${id}">${f.label}</label>${dl}<input ${f.list?`list="${id}_dl"`:""} id="${id}" name="${f.id}" type="${f.type==="number"?"text":f.type||"text"}" ${f.type==="number"?'inputmode="decimal"':""} value="${esc(f.type==="number"&&f.value!==""&&f.value!=null?String(f.value).replace(".",","):f.value??"")}" ${f.ph?`placeholder="${esc(f.ph)}"`:""} autocomplete="off"></div>`;
}
/* yazdıkça öneri: kod başlangıcına veya adın içine göre eşleşir */
function attachSugg(inp,getList,onPick){
  const wrap=inp.closest(".field");let box=null,items=[],ix=-1;
  const close=()=>{if(box){box.remove();box=null}ix=-1};
  const show=()=>{
    const q=trLow(inp.value.trim());const L=getList();
    if(!q||!L.length){close();return}
    items=L.filter(([c,n])=>trLow(c).startsWith(q)||trLow(n).includes(q)).sort((a,b)=>(trLow(b[0]).startsWith(q))-(trLow(a[0]).startsWith(q))).slice(0,8);
    if(!items.length||(items.length===1&&(trLow(items[0][0])===q||trLow(items[0][1])===q))){close();return}
    if(!box){box=document.createElement("div");box.className="sugg";box.setAttribute("role","listbox");wrap.appendChild(box)}
    box.innerHTML=items.map(([c,n],i)=>`<button type="button" role="option" data-i="${i}" class="${i===ix?"on":""}"><b>${esc(c)}</b><span>${esc(n)}</span></button>`).join("");
  };
  inp.setAttribute("autocomplete","off");
  inp.addEventListener("input",()=>{ix=-1;show()});
  inp.addEventListener("focus",show);
  inp.addEventListener("keydown",e=>{if(!box)return;
    if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();ix=(ix+(e.key==="ArrowDown"?1:-1)+items.length)%items.length;show()}
    else if(e.key==="Enter"&&ix>=0){e.preventDefault();const it=items[ix];onPick(it[0],it[1]);close()}
    else if(e.key==="Escape"){e.stopPropagation();close()}});
  inp.addEventListener("blur",()=>setTimeout(close,150));
  inp.addEventListener("sugg-close",close);
  wrap.addEventListener("mousedown",e=>{const b=e.target.closest(".sugg button");if(!b)return;e.preventDefault();const it=items[+b.dataset.i];onPick(it[0],it[1]);close()});
}
function formSheet({title,fields,onSave,onDelete,extra="",onChange,onOpen}){
  const rows=fields.map(f=>Array.isArray(f)?`<div class="frow">${f.map(field).join("")}</div>`:field(f)).join("");
  openSheet(`<h3>${title}</h3><form class="form" id="sf" novalidate>${rows}${extra}<div class="err" id="sfErr"></div><div class="actions">${onDelete?`<button type="button" class="btn danger" id="sfDel">${ic(I.trash,18)}<span>Sil</span></button>`:""}<button type="submit" class="btn primary grow">Kaydet</button></div></form>`,sh=>{
    const form=sh.querySelector("#sf");
    sh.querySelectorAll("[data-seg]").forEach(g=>g.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;g.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b));form.elements[g.dataset.seg].value=b.dataset.v;onChange&&onChange(form,g.dataset.seg)}));
    form.addEventListener("change",e=>onChange&&onChange(form,e.target.name));
    form.addEventListener("submit",e=>{e.preventDefault();const vals={};[...form.elements].forEach(el=>{if(el.name)vals[el.name]=el.value});const err=onSave(vals);if(err){sh.querySelector("#sfErr").textContent=err}else closeSheet()});
    if(onDelete){const d=sh.querySelector("#sfDel");d.onclick=()=>{if(d.dataset.c){withUndo(onDelete);closeSheet()}else{d.dataset.c="1";d.textContent="Evet, sil";d.classList.add("solid")}}}
    onOpen&&onOpen(form,sh);
  });
}

function pfSheet(p){
  const colors=["--c1","--c2","--c3","--c4","--c5","--c6"];
  formSheet({title:p?"Portföyü düzenle":"Yeni portföy",fields:[{id:"name",label:"Portföy adı",value:p?p.name:"",ph:"Örn. Uzun vade, Çocuk için, BES"},
    {id:"owner",label:"Kimin portföyü",value:p?ownerOf(p):(view.owner!=="all"?view.owner:MAIN()),list:[...new Set([...owners(),"Eşim","Oğlum","Kızım"])],ph:"Örn. Ben, Eşim"},
    {id:"isMain",label:"Ana portföy (gelir-gider ve nakit bakiyesi buna bağlanır)",type:"seg",value:p&&state.portfolios.length&&mainPf()===p?"1":(!state.portfolios.length?"1":"0"),options:[["1","Evet"],["0","Hayır"]]},
    {id:"color",label:"Renk",type:"select",value:p?p.color:colors[state.portfolios.length%6],options:[["--c1","Altın sarısı"],["--c2","Mavi"],["--c3","Yeşil"],["--c4","Gül"],["--c5","Mor"],["--c6","Kiremit"]]}],
    onSave:v=>{if(!v.name.trim())return"Portföy adı girin.";const ow=v.owner.trim()||MAIN(),mk=v.isMain==="1";if(p){p.name=v.name.trim();p.color=v.color;p.owner=ow;if(mk)S().mainPf=p.id;else if(mainPf()===p&&state.portfolios.length>1)S().mainPf=(state.portfolios.find(x=>x!==p)||{}).id}else{const n={id:uid(),name:v.name.trim(),color:v.color,owner:ow,holdings:[]};state.portfolios.push(n);if(mk)S().mainPf=n.id;view.pf=n.id;if(view.tab!=="portfoy")view.tab="portfoy"}commit(p?"Portföy güncellendi":"Portföy oluşturuldu")},
    onDelete:p?()=>{state.portfolios=state.portfolios.filter(x=>x!==p);view.pf="all";commit("Portföy silindi")}:null});
}
/* ---------- BES: ana para dışındaki her şey (fon getirisi + devlet katkısı + DK getirisi) kâr sayılır ---------- */
const besTot=b=>(+b.principal||0)+(+b.gain||0)+(+b.state||0)+(+b.stateGain||0);
function besApply(h){const b=h.bes;h.kind="bes";h.cur="TRY";h.qty=1;h.cost=+b.principal||0;h.price=besTot(b);h.trades=[];h.realized=0}
function besSheet(pfId,h){
  const b=h&&h.bes||{};const pid=pfId||(h?null:(view.pf&&view.pf!=="all"?view.pf:(mainPf()||state.portfolios[0]).id));
  formSheet({title:h?"BES sözleşmesini düzenle":"BES ekle",fields:[
    {id:"pf",label:"Portföy",type:"select",value:pid||(state.portfolios.find(p=>p.holdings.includes(h))||{}).id,options:state.portfolios.map(p=>[p.id,pfName(p.id)])},
    [{id:"name",label:"Sözleşme / şirket",value:h?h.name:"",ph:"Örn. Anadolu Hayat BES"},{id:"buyDate",label:"Başlangıç tarihi",type:"date",value:h?(h.buyDate||""):""}],
    [{id:"principal",label:"Ana para (yatırdığınız toplam)",type:"number",value:h?b.principal:"",ph:"0"},{id:"gain",label:"Fon getirisi (kâr)",type:"number",value:h?b.gain:"",ph:"0"}],
    [{id:"state",label:"Devlet katkısı",type:"number",value:h?b.state:"",ph:"0"},{id:"stateGain",label:"Devlet katkısı getirisi",type:"number",value:h?(b.stateGain||""):"",ph:"0"}]],
    extra:`<div class="note" id="besNote">Değerleri BES şirketinizin uygulamasındaki son ekstreden girin. Ana para dışındaki tutarlar (fon getirisi, devlet katkısı ve getirisi) kâr olarak hesaplanır. Birden fazla sözleşme ekleyebilirsiniz; hepsi "BES" kategorisinde toplanır.</div>`,
    onOpen:(form,sh)=>{const E=form.elements,upd=()=>{const v=k=>{const x=parseNum(E[k].value);return isNaN(x)?0:x};const pr=v("principal"),tot=pr+v("gain")+v("state")+v("stateGain");sh.querySelector("#besNote").innerHTML=`Toplam birikim: <b class="num">${fmt(tot,"TRY",{show:true})}</b> · Kâr: <b class="num">${fmt(tot-pr,"TRY",{show:true})}</b>${pr?" ("+fmtPct((tot-pr)/pr*100)+")":""}<br>Ana para dışındaki tutarlar kâr sayılır. Birden fazla sözleşme ekleyebilirsiniz; hepsi "BES" kategorisinde toplanır.`};form.addEventListener("input",upd);upd()},
    onSave:v=>{const n=k=>{const x=v[k].trim()?parseNum(v[k]):0;return x};const nb={principal:n("principal"),gain:n("gain"),state:n("state"),stateGain:n("stateGain")};
      if(!v.name.trim())return"Sözleşme adını girin.";if(Object.values(nb).some(x=>isNaN(x)))return"Tutarları kontrol edin.";if(!(nb.principal>0))return"Ana parayı girin.";if(nb.state<0||nb.stateGain<0)return"Devlet katkısı eksi olamaz.";
      if(v.buyDate&&v.buyDate>todayISO())return"Tarih ileri olamaz.";
      const target=state.portfolios.find(p=>p.id===v.pf);
      if(h){const from=state.portfolios.find(p=>p.holdings.includes(h));Object.assign(h,{name:v.name.trim(),buyDate:v.buyDate||"",bes:nb});if(h.buyDate!==v.buyDate)h.fxAt=null;besApply(h);recalcFx(h);if(from!==target){from.holdings=from.holdings.filter(x=>x!==h);target.holdings.push(h)}commit("BES güncellendi");return}
      const nh={id:uid(),name:v.name.trim(),symbol:"",buyDate:v.buyDate||"",fxAt:null,bes:nb};besApply(nh);recalcFx(nh);target.holdings.push(nh);commit("BES eklendi")},
    onDelete:h?()=>{state.portfolios.forEach(p=>p.holdings=p.holdings.filter(x=>x!==h));commit("BES silindi")}:null});
}
function holdingSheet(pfId,h){
  if(h&&h.kind==="bes")return besSheet(pfId,h);
  if(!state.portfolios.length){pfSheet();return}
  const pid=pfId||(view.pf&&view.pf!=="all"?view.pf:state.portfolios[0].id);
  const k0=h?h.kind:"hisse";
  const presetOpts=k=>[...(PRESETS[k]||[]).map(([c,n])=>[c,n]),["","Diğer (elle yazın)"]];
  const curPreset=h&&PRESETS[h.kind]?((PRESETS[h.kind].find(([c])=>c===(h.symbol||"").toUpperCase().trim())||[""])[0]):(PRESETS[k0]?PRESETS[k0][0][0]:"");
  const multiT=!!(h&&(h.trades||[]).length>1);
  const PH={hisse:["Örn. Türk Hava Yolları","THYAO"],abd:["Örn. Apple","AAPL"],fon:["Fon adı","TEFAS kodu, örn. TTE"],ppf:["Örn. ... Para Piyasası Fonu","TEFAS kodu"],kripto:["Örn. Bitcoin","BTC"]};
  formSheet({title:h?"Varlığı düzenle":"Varlık ekle",fields:[
    {id:"pf",label:"Portföy",type:"select",value:pid,options:state.portfolios.map(p=>[p.id,p.name+(owners().length>1?" ("+ownerOf(p)+")":"")])},
    [{id:"kind",label:"Tür",type:"select",value:k0,options:Object.entries(KINDS)},{id:"cur",label:"Para birimi",type:"select",value:h?h.cur:"TRY",options:CURS}],
    {id:"preset",label:"Ürün",type:"select",value:curPreset,options:presetOpts(k0),hidden:!PRESETS[k0]},
    {id:"name",label:"Varlık adı",value:h?h.name:"",ph:"Adını veya kodunu yazmaya başlayın"},
    ...(multiT?[{id:"symbol",label:"Kod",value:h.symbol||"",ph:"Örn. THYAO"},{id:"price",label:"Güncel fiyat (otomatik yoksa)",type:"number",value:h.price,ph:"0"}]
    :[[{id:"symbol",label:"Kod",value:h?h.symbol:"",ph:"Örn. THYAO"},{id:"buyDate",label:"Alış tarihi",type:"date",value:h?(h.buyDate||""):todayISO()}]]),
    ...(multiT?[]:h?[[{id:"qty",label:"Adet / miktar",type:"number",value:h.qty,ph:"0"},{id:"cost",label:"Ortalama maliyet (komisyon dahil)",type:"number",value:h.cost,ph:"0"}],{id:"price",label:"Güncel fiyat (otomatik yoksa)",type:"number",value:h.price,ph:"0"}]
      :[[{id:"qty",label:"Adet / miktar",type:"number",value:"",ph:"0"},{id:"bp",label:"Alış fiyatı (birim)",type:"number",value:"",ph:"0"}],[{id:"fee",label:"Komisyon (toplam)",type:"number",value:"",ph:S().feeRate?"Otomatik %"+fmtN(S().feeRate,3):"0"},{id:"price",label:"Güncel fiyat (otomatik yoksa)",type:"number",value:"",ph:"Boşsa alış fiyatı"}]])],
    extra:`<div class="note" id="hNote"></div>${h&&h.fxAt?`<div class="note">Alış kuru: USD ${fmtN(h.fxAt.USD,4)} · EUR ${fmtN(h.fxAt.EUR,4)} (${esc(h.fxAt.src||"")})<br>Dolar maliyeti: ${fmt(costIn(h,"USD"),"USD",{show:true})}</div>`:""}`,
    onOpen:(form,sh)=>{
      const E=form.elements;
      const note=()=>{const k=E.kind.value;sh.querySelector("#hNote").textContent=
        (PRESETS[k]&&E.preset.value?"Fiyat otomatik takip edilir; alış fiyatı güncel satış fiyatıyla dolduruldu, değiştirebilirsiniz.":
        k==="abd"?"ABD borsasındaki hisseler dolar cinsinden izlenir. Kodu girin (ör. AAPL); fiyat en geç yarım saat içinde gelir.":
        k==="hisse"?"Borsa İstanbul hisseleri. Adını veya kodunu yazdıkça öneriler çıkar.":
        k==="fon"?"TEFAS fon kodunu girin (ör. TTE); birim pay fiyatı en geç yarım saat içinde gelir. Satışta stopaj kesintisini girebilirsiniz.":
        k==="ppf"?"Para piyasası fonları da TEFAS'tan fiyatlanır. Fon kodunu girin; fiyat en geç yarım saat içinde gelir. Satışta stopaj kesintisini girebilirsiniz.":
        "Otomatik fiyat yoksa güncel fiyatı kendiniz girebilirsiniz.")+(multiT?" Bu varlıkta birden fazla işlem var; miktar ve maliyet işlemlerden hesaplanır. Değiştirmek için işlem geçmişinden ilgili alımı veya satışı düzenleyin.":" Geçmiş tarihli alımda o günün dolar ve euro kuru maliyete işlenir."+(h?"":" Aynı ürünü daha önce eklediyseniz bu alım o satıra eklenir; komisyon maliyete eklenir."))};
      const applyPreset=fill=>{const k=E.kind.value,c=E.preset.value;if(!PRESETS[k]||!c)return;const p=PRESETS[k].find(x=>x[0]===c);if(!p)return;
        E.name.value=p[1];E.symbol.value=p[0];
        if(k==="doviz"){E.cur.value=c;if(E.bp&&fill)E.bp.value="1"}
        else{E.cur.value="TRY";const mv=p[2]&&market&&market.gold&&+market.gold[p[2]];if(E.bp&&fill&&mv>0)E.bp.value=String(Math.round(mv*100)/100).replace(".",",")}};
      const setKind=first=>{const k=E.kind.value,pr=!!PRESETS[k];
        if(k==="bes"&&!h){closeSheet();setTimeout(()=>besSheet(E.pf.value),0);return}
        [E.name,E.symbol].forEach(i=>i.dispatchEvent(new Event("sugg-close")));
        sh.querySelector("#w_preset").hidden=!pr;
        if(!first){E.preset.innerHTML=presetOpts(k).map(([v,l])=>`<option value="${esc(v)}">${esc(l)}</option>`).join("");
          if(pr){E.preset.value=PRESETS[k][0][0];applyPreset(true)}
          else{if(PRESETS[form.dataset.lastKind||""]){E.name.value="";E.symbol.value=""}
            E.cur.value=k==="abd"?"USD":(["hisse","fon","ppf"].includes(k)?"TRY":E.cur.value)}}
        const ph=PH[k];E.name.placeholder=ph?ph[0]:"Örn. Katılım hesabı";E.symbol.placeholder=ph?ph[1]:"İsteğe bağlı";
        form.dataset.lastKind=k;note()};
      form.addEventListener("change",e=>{if(e.target.name==="kind")setKind(false);if(e.target.name==="preset"){applyPreset(!h);note()}});
      setKind(true);if(!h&&PRESETS[k0])applyPreset(true);
      /* yazdıkça öneri */
      const pick=(c,n)=>{E.symbol.value=c;E.name.value=n};
      [E.name,E.symbol].forEach(inp=>attachSugg(inp,()=>SUGG[E.kind.value]||[],pick));
    },
    onSave:v=>{const qty=multiT?+h.qty:parseNum(v.qty);if(multiT)v.buyDate=h.buyDate||"";
      let cost,fee=0,bp=NaN;
      if(h)cost=multiT?+h.cost:parseNum(v.cost);else{bp=parseNum(v.bp);fee=v.fee.trim()?parseNum(v.fee):(qty*bp*(+S().feeRate||0)/100);if(isNaN(fee)||fee<0)return"Komisyonu kontrol edin.";cost=qty>0?(qty*bp+fee)/qty:NaN}
      const price=isNaN(parseNum(v.price))?(h?cost:bp):parseNum(v.price);
      if(!v.name.trim())return"Varlık adını girin.";if(!(qty>0)&&!h)return"Miktar sıfırdan büyük olmalı.";if(isNaN(cost)||(!h&&isNaN(bp)))return h?"Ortalama maliyeti girin.":"Alış fiyatını girin.";
      if(v.buyDate&&v.buyDate>todayISO())return"Alış tarihi ileri bir tarih olamaz.";
      const data={name:v.name.trim(),symbol:v.symbol.trim(),kind:v.kind,cur:v.cur,qty,cost,price:isNaN(price)?cost:price,buyDate:v.buyDate||""};
      if(data.kind==="abd"&&data.cur==="TRY")return"ABD hisseleri için para birimi USD olmalı.";
      const target=state.portfolios.find(p=>p.id===v.pf);
      if(h){
        const from=state.portfolios.find(p=>p.holdings.includes(h));const dateChanged=h.buyDate!==data.buyDate;
        Object.assign(h,data);
        const tr=h.trades||[];
        if(tr.length<=1){/* tek alım: işlem kaydını formla eşitle */
          if(tr[0]&&tr[0].type==="buy"){if(dateChanged){tr[0].date=data.buyDate||tr[0].date;delete tr[0].fx}tr[0].qty=qty;tr[0].price=cost;tr[0].fee=0}
          if(dateChanged)h.fxAt=null;
        }
        recalcFx(h);
        if(from!==target){from.holdings=from.holdings.filter(x=>x!==h);target.holdings.push(h)}
        const m=mergeDuplicates();commit(m?"Varlık güncellendi ve aynı ürünle birleştirildi":"Varlık güncellendi");return}
      const d0=data.buyDate||todayISO();const nh={id:uid(),...data,fxAt:null,realized:0,trades:[{id:uid(),type:"buy",date:d0,qty,price:bp,fee,fx:fxLookup(d0)||undefined}]};recalcFx(nh);
      const ex=target.holdings.find(x=>hKey(x)===hKey(nh));
      if(ex){if(!mergeInto(ex,nh))return"Bu alım mevcut kayıtla birleştirilemedi; tarihleri kontrol edin.";if(!isNaN(parseNum(v.price)))ex.price=parseNum(v.price);commit("Mevcut "+ex.name+" satırına alım olarak eklendi");return}
      target.holdings.push(nh);commit("Varlık eklendi")},
    onDelete:h?()=>{state.portfolios.forEach(p=>p.holdings=p.holdings.filter(x=>x!==h));commit("Varlık silindi")}:null});
}
function fxForDate(d){if(!d||d===todayISO())return{USD:rate("USD"),EUR:rate("EUR"),approx:false};const f=fxhist[d];if(f&&+f.USD>0)return{USD:+f.USD,EUR:+f.EUR||rate("EUR"),approx:false};return{USD:rate("USD"),EUR:rate("EUR"),approx:true}}
function holdingDetail(pfId,h){
  const pf=state.portfolios.find(p=>p.id===pfId);const ep=effPrice(h);const val=hVal(h),cs=hCost(h);
  const tr=(h.trades||[]).slice().sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  const pl=val-cs,plp=cs?pl/cs*100:0;
  const rest=`      ${(()=>{const u=ufeInfo(h);if(!u)return ufe&&!h.buyDate?`<div><span>Yİ-ÜFE'ye göre</span><span class="sub" style="font-family:var(--f-body)">alış tarihi gerekli</span></div>`:"";const inc=(u.ratio-1)*100;
        return `<div><span>Yİ-ÜFE ile güncel TL maliyet<br><small class="sub">${u.multi?"alımlar ayrı ayrı · ":""}${fmtYM(u.from)} → ${fmtYM(u.to)} · endeks artışı ${fmtPct(inc)}</small></span><span>${fmt(u.cost)}</span></div>
        <div><span>Reel kâr/zarar (Yİ-ÜFE)</span><span class="${val>=u.cost?"pos-t":"neg-t"}">${fmt(val-u.cost)} (${fmtPct(u.cost?(val-u.cost)/u.cost*100:0)})</span></div>
        ${inc>=10?`<div><span class="sub" style="font-family:var(--f-body);text-align:left">Endeks artışı %10'u aştığı için değer artış kazancı vergisinde maliyet bu yöntemle endekslenebilir. Vergi durumu varlık türüne ve elde tutma süresine göre değişir.</span></div>`:""}`})()}
      ${+h.realized?`<div><span>Gerçekleşen kâr/zarar</span><span class="${h.realized>=0?"pos-t":"neg-t"}">${fmt(+h.realized,h.cur)}</span></div>`:""}
      ${h.fxAt?`<div><span>Alış günü kuru${h.fxAt.multi?" (ağırlıklı)":""}<br><small class="sub">${esc(h.fxAt.src||"")}${h.fxAt.pending?" · bazı alımların kuru bekleniyor":""}</small></span><span>USD ${fmtN(h.fxAt.USD,4)}${+h.fxAt.EUR?"<br>EUR "+fmtN(h.fxAt.EUR,4):""}</span></div>
      <div><span>${h.cur==="USD"?"TL maliyeti":"Dolar maliyeti"}</span><span>${h.cur==="USD"?fmt(costIn(h,"TRY"),"TRY"):fmt(costIn(h,"USD"),"USD")}</span></div>
      ${h.cur==="USD"?"":`<div><span>Dolar bazında kâr/zarar</span><span class="${(val*rate(S().base)/rate("USD"))>=costIn(h,"USD")?"pos-t":"neg-t"}">${fmt(val*rate(S().base)/rate("USD")-costIn(h,"USD"),"USD")}</span></div>`}`:fxWaiting(h)?`<div><span>Alış günü kuru</span><span style="font-family:var(--f-body)" class="sub">bekleniyor</span></div>`:""}`.trim();
  openSheet(`<h3>${mkIcon(KIND_ICON[h.kind]||I.dots,KIND_COLOR[h.kind]||"--c7")}<span class="h3-t">${esc(h.name)}<small>${[h.symbol,KINDS[h.kind]].filter(Boolean).map(esc).join(" · ")}</small></span></h3>
    <div class="dsum"><div><span class="label">Değer</span><div class="dv num">${fmt(val)}</div></div><span class="chg ${pl>=0?"up":"down"}"><b class="num">${pl>=0?"▲":"▼"} ${fmt(Math.abs(pl))}</b><span class="num">%${fmtN(Math.abs(plp),1)}</span></span></div>
    <div class="tiles">
      <div><span class="label">Miktar</span><b class="num">${fmtN(h.qty,4)}</b></div>
      <div><span class="label">Toplam maliyet</span><b class="num">${fmt(cs)}</b></div>
      <div><span class="label">Ortalama maliyet</span><b class="num">${S().hide?"••":fmtN(h.cost,4)+" "+esc(h.cur)}</b></div>
      <div><span class="label">Güncel fiyat${ep.auto?" · otomatik":""}</span><b class="num">${S().hide?"••":fmtN(ep.p,4)+" "+esc(h.cur)}</b></div>
    </div>
    ${rest?`<div class="kv">${rest}</div>`:""}
    <div class="label sh-sec">İşlem geçmişi</div>
    ${tr.length?`<div class="list">${tr.map(t=>tradeRow(h,t,false,pfId)).join("")}</div><div class="sub" style="margin-top:6px">Düzenlemek veya silmek için bir işleme dokunun.</div>`:`<div class="sub" style="padding:4px 0 8px">Bu varlık için işlem kaydı yok. Yeni alım ve satışlar burada listelenir.</div>`}
    <div class="actions eq"><button class="btn primary" id="hBuy">${ic(I.buy)}Alım ekle</button>${+h.qty>0?`<button class="btn" id="hSell">${ic(I.sell)}Satış yap</button>`:""}<button class="btn" id="hEdit">${ic(I.edit)}Düzenle</button></div>`,sh=>{
      sh.querySelector("#hEdit").onclick=()=>{closeSheet();holdingSheet(pfId,h)};
      sh.querySelector("#hBuy").onclick=()=>{closeSheet();tradeSheet(pfId,h,"buy")};
      const sb=sh.querySelector("#hSell");if(sb)sb.onclick=()=>{closeSheet();tradeSheet(pfId,h,"sell")};
      sh.querySelectorAll('[data-act="edit-tr"]').forEach(b=>b.onclick=()=>{const t=(h.trades||[]).find(x=>x.id===b.dataset.id);if(t){closeSheet();tradeSheet(pfId,h,t.type,t)}});
    });
}
const defTax=h=>{const r=(S().whtRates||{})[h.kind];return r!=null&&r!==""?r:""};
function tradeSheet(pfId,h,type,tr){
  const buy=(tr?tr.type:type)==="buy";
  formSheet({title:(tr?(buy?"Alımı düzenle":"Satışı düzenle"):(buy?"Alım ekle":"Satış yap"))+" · "+esc(h.name),fields:[
    [{id:"qty",label:buy?"Alınan miktar":"Satılan miktar"+(tr?"":" (en çok "+fmtN(h.qty,4)+")"),type:"number",value:tr?tr.qty:"",ph:"0"},{id:"date",label:"Tarih",type:"date",value:tr?(tr.date||""):todayISO()}],
    [{id:"price",label:(buy?"Alış":"Satış")+" fiyatı (birim, "+h.cur+")",type:"number",value:tr?tr.price:(buy?"":effPrice(h).p),ph:"0"},{id:"fee",label:"Komisyon (toplam)",type:"number",value:tr?(tr.fee||0):"",ph:S().feeRate?"Otomatik %"+fmtN(S().feeRate,3):"0"}],
    ...(buy?[]:[[{id:"taxRate",label:"Stopaj oranı (%)",type:"number",value:tr?(tr.taxRate??""):defTax(h),ph:"0"},{id:"taxAmt",label:"Stopaj tutarı (boşsa orandan)",type:"number",value:tr&&tr.taxAmt!=null?tr.taxAmt:"",ph:"Otomatik"}]]),
    {id:"note",label:"Not",value:tr?(tr.note||""):"",ph:"İsteğe bağlı, örn. kuyumcu, aracı kurum"}],
    extra:`<div class="note">${buy?"Alımlar aynı satırda toplanır; ortalama maliyet komisyonla birlikte yeniden hesaplanır. Alış günü kuru ayrıca kaydedilir.":"Gerçekleşen kâr/zarar = satış tutarı − komisyon − ortalama maliyet − stopaj. Stopaj yalnızca kazanca uygulanır; oran fon türüne ve alış tarihine göre değişir, aracı kurum ekstrenizden veya fonun izahnamesinden kontrol edin. Kesilen tutarı biliyorsanız doğrudan girin."}${tr&&tr.legacy?" Bu kayıt, işlem geçmişi tutulmadan önce girilen pozisyondan oluşturuldu.":""}</div>`,
    onSave:v=>{const q=parseNum(v.qty),p=parseNum(v.price);if(!(q>0))return"Miktar sıfırdan büyük olmalı.";if(!(p>=0)||(!tr&&!(p>0)))return"Fiyat girin.";
      if(v.date&&v.date>todayISO())return"Tarih ileri olamaz.";
      const fee=v.fee.trim()?parseNum(v.fee):q*p*(+S().feeRate||0)/100;if(isNaN(fee)||fee<0)return"Komisyonu kontrol edin.";
      const d=v.date||(tr?"":todayISO());
      const snap=JSON.stringify(h);
      ensureTrades(h);
      let t=tr&&h.trades.find(x=>x.id===tr.id);
      if(!t){t={id:uid(),type:buy?"buy":"sell"};h.trades.push(t)}
      if(t.date!==d){delete t.fx}
      Object.assign(t,{date:d,qty:q,price:p,fee,note:v.note.trim()||undefined});delete t.legacy;
      if(!buy){const tr_=v.taxRate.trim()?parseNum(v.taxRate):0,ta=v.taxAmt.trim()?parseNum(v.taxAmt):null;
        if(isNaN(tr_)||tr_<0||tr_>100||(ta!=null&&(isNaN(ta)||ta<0))){Object.keys(h).forEach(k=>delete h[k]);Object.assign(h,JSON.parse(snap));return"Stopaj oranını veya tutarını kontrol edin."}
        t.taxRate=tr_;if(ta!=null)t.taxAmt=ta;else delete t.taxAmt}
      if(t.type==="buy"&&!t.fx){const f=fxLookup(d);if(f)t.fx=f}
      const err=rebuild(h);if(err){Object.keys(h).forEach(k=>delete h[k]);Object.assign(h,JSON.parse(snap));return err}
      commit(tr?"İşlem güncellendi":buy?"Alım eklendi"+(h.fxAt&&h.fxAt.pending?" · alış günü kuru birazdan gelecek":""):(h.qty>0?"Satış kaydedildi":"Pozisyon kapandı")+(+t.tax?" · stopaj "+fmt(t.tax,h.cur):"")+" · net K/Z "+fmt(t.pl||0,h.cur));
    },
    onDelete:tr?()=>{const snap=JSON.stringify(h);h.trades=(h.trades||[]).filter(x=>x.id!==tr.id);
      if(!h.trades.length){state.portfolios.forEach(p=>p.holdings=p.holdings.filter(x=>x!==h));commit("Son işlem silindi, varlık kaldırıldı");return}
      const err=rebuild(h);if(err){Object.keys(h).forEach(k=>delete h[k]);Object.assign(h,JSON.parse(snap));toast(err);return}commit("İşlem silindi")}:null});
}
function tradeRow(h,t,showName,pfId){
  const tot=(+t.qty||0)*(+t.price||0),buy=t.type==="buy";
  return `<button class="row" type="button" data-act="edit-tr" data-pf="${pfId}" data-h="${h.id}" data-id="${t.id}">${mkIcon(buy?I.buy:I.sell,buy?"--pos":"--neg")}<span class="sr">${buy?"Alım":"Satış"}</span><div class="main"><div class="t">${showName?esc(h.name):`<span class="num">${fmtN(t.qty,4)} × ${S().hide?"••":fmtN(t.price,4)} ${esc(h.cur)}</span>`}</div><div class="s">${showName?`<span class="num">${fmtN(t.qty,4)} × ${S().hide?"••":fmtN(t.price,4)}</span> · `:""}${t.date?fmtDate(t.date):"tarih yok"}${+t.fee?" · komisyon "+(S().hide?"••":fmtN(t.fee,2)):""}${buy&&t.fx&&h.cur!=="USD"?" · USD "+fmtN(t.fx.USD,2):""}${buy&&t.fx&&h.cur==="USD"?" · kur "+fmtN(t.fx.USD,2):""}${!buy&&+t.tax?" · stopaj "+(S().hide?"••":fmtN(t.tax,2)):""}${t.legacy?" · açılış kaydı":""}${t.note?" · "+esc(t.note):""}</div></div><div class="end"><div class="num">${buy?"":"+"}${fmt(tot,h.cur)}</div>${!buy&&t.pl!=null?`<span class="pill ${t.pl>=0?"pos":"neg"}">K/Z ${fmt(t.pl,h.cur)}</span>`:""}</div></button>`;
}
function methodOpts(){return [["cash","Nakit / banka kartı"],...state.cards.map(c=>[c.id,"Kart · "+c.name])]}
function txSheet(t,preset){
  const type=t?t.type:(preset&&preset.type)||"out";
  const catOpts=ty=>ty==="in"?CATS.in:CATS.out;
  const hasCards=state.cards.length>0;
  formSheet({title:t?"İşlemi düzenle":"Gelir / gider ekle",fields:[
    {id:"type",label:"Tür",type:"seg",value:type,options:hasCards?[["out","Gider"],["in","Gelir"],["card","Kart ödemesi"]]:[["out","Gider"],["in","Gelir"]]},
    [{id:"amount",label:"Tutar",type:"number",big:true,value:t?t.amount:(preset&&preset.amount)||"",ph:"0"},{id:"cur",label:"Para birimi",type:"select",value:t?t.cur:"TRY",options:CURS}],
    [{id:"cat",label:"Kategori",type:"select",value:t?t.cat:catOpts(type)[0],options:catOpts(type)},{id:"date",label:"Tarih",type:"date",value:t?t.date:todayISO()}],
    ...(hasCards?[[{id:"method",label:"Ödeme şekli",type:"select",value:t?(t.method||"cash"):"cash",options:methodOpts()},{id:"inst",label:"Taksit sayısı",type:"select",value:"1",options:[["1","Tek çekim"],...[2,3,4,5,6,9,12].map(n=>[String(n),n+" taksit"])]}],
      {id:"card",label:"Ödenen kart",type:"select",value:t&&t.card||(preset&&preset.card)||state.cards[0].id,options:state.cards.map(c=>[c.id,c.name])}]:[]),
    {id:"note",label:"Not",value:t?t.note:"",ph:"İsteğe bağlı"}],
    extra:hasCards?`<div class="note" id="txHint"></div>`:"",
    onChange:(form)=>sync(form),
    onSave:v=>{const a=parseNum(v.amount);if(!(a>0))return"Tutar sıfırdan büyük olmalı.";if(!v.date)return"Tarih seçin.";
      if(v.type==="card"){const d={type:"card",card:v.card,amount:a,cur:v.cur,date:v.date,note:v.note.trim(),cat:"Kart ödemesi"};
        if(t){Object.assign(t,d);delete t.method}else state.tx.push({id:uid(),...d});view.month=v.date.slice(0,7);commit("Kart ödemesi kaydedildi");return}
      const method=v.type==="out"&&v.method&&v.method!=="cash"?v.method:"";
      const n=t?1:Math.max(1,+v.inst||1);
      if(t){Object.assign(t,{type:v.type,amount:a,cur:v.cur,cat:v.cat,date:v.date,note:v.note.trim(),method});delete t.card}
      else if(n>1&&method){const g=uid(),per=Math.round(a/n*100)/100;
        for(let k=0;k<n;k++){const[y,m]=v.date.slice(0,7).split("-").map(Number);const dt=new Date(y,m-1+k,1);const mm=dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0");
          state.tx.push({id:uid(),type:"out",amount:k===n-1?Math.round((a-per*(n-1))*100)/100:per,cur:v.cur,cat:v.cat,date:dayIn(mm,+v.date.slice(8)),note:v.note.trim(),method,inst:(k+1)+"/"+n,grp:g})}}
      else state.tx.push({id:uid(),type:v.type,amount:a,cur:v.cur,cat:v.cat,date:v.date,note:v.note.trim(),method,...(preset&&preset.rid?{rid:preset.rid}:{})});
      view.month=v.date.slice(0,7);commit(t?"İşlem güncellendi":(v.type==="in"?"Gelir eklendi":n>1?n+" taksit aylara bölündü":"Gider eklendi"))},
    onDelete:t?()=>{if(t.grp&&state.tx.filter(x=>x.grp===t.grp).length>1){state.tx=state.tx.filter(x=>x.grp!==t.grp||x.date<t.date);commit("Bu ve sonraki taksitler silindi")}else{state.tx=state.tx.filter(x=>x!==t);commit("İşlem silindi")}}:null});
  function sync(form){
    const ty=form.elements.type.value,el=form.elements;
    const show=(name,on)=>{const f=el[name];if(f){const box=f.closest(".field");box.hidden=!on;const row=box.parentElement;if(row.classList.contains("frow"))row.hidden=[...row.children].every(c=>c.hidden)}};
    const cat=el.cat;if(ty!=="card"&&cat.dataset.ty!==ty){const cur=cat.value;cat.innerHTML=catOpts(ty).map(c=>`<option ${c===cur?"selected":""}>${esc(c)}</option>`).join("");cat.dataset.ty=ty}
    show("cat",ty!=="card");show("method",ty==="out");show("inst",ty==="out"&&el.method&&el.method.value!=="cash"&&!t);show("card",ty==="card");
    const h=document.getElementById("txHint");if(h){h.hidden=!(ty==="card"||(ty==="out"&&el.method&&el.method.value!=="cash"));h.textContent=ty==="card"?"Kart ödemesi gider sayılmaz; kart borcunu düşürür.":"Kartla harcama bu ayın giderine yazılır ve kart borcuna eklenir. Taksitli alım aylara bölünür."}
  }
  setTimeout(()=>{const f=document.getElementById("sf");if(f){f.elements.cat.dataset.ty=type;sync(f)}},0);
}
function recSheet(r){
  formSheet({title:r?"Sabit kalemi düzenle":"Sabit ödeme / gelir ekle",fields:[
    {id:"type",label:"Tür",type:"seg",value:r?r.type:"out",options:[["out","Ödeme"],["in","Gelir"]]},
    {id:"name",label:"Adı",value:r?r.name:"",ph:"Örn. Kira, Elektrik, İnternet, Maaş"},
    [{id:"amount",label:"Tutar (yaklaşık)",type:"number",value:r?r.amount:"",ph:"0"},{id:"day",label:"Ayın kaçında",type:"select",value:r?String(r.day):"1",options:Array.from({length:31},(_,i)=>[String(i+1),String(i+1)])}],
    [{id:"cat",label:"Kategori",type:"select",value:r?r.cat:CATS.out[0],options:r&&r.type==="in"?CATS.in:CATS.out},{id:"cur",label:"Para birimi",type:"select",value:r?r.cur:"TRY",options:CURS}],
    ...(state.cards.length?[{id:"method",label:"Ödeme şekli",type:"select",value:r?(r.method||"cash"):"cash",options:methodOpts()}]:[])],
    extra:`<div class="note">Her ay listede görünür. "Öde"ye dokununca o ayın tarihiyle işlem olarak eklenir; tutar değiştiyse işlemi açıp düzeltebilirsiniz.</div>`,
    onChange:(form,name)=>{if(name==="type"){const c=form.elements.cat;c.innerHTML=(form.elements.type.value==="in"?CATS.in:CATS.out).map(x=>`<option>${esc(x)}</option>`).join("")}},
    onSave:v=>{const a=parseNum(v.amount);if(!v.name.trim())return"Ad girin.";if(!(a>0))return"Tutar sıfırdan büyük olmalı.";
      const d={type:v.type,name:v.name.trim(),amount:a,day:+v.day,cat:v.cat,cur:v.cur,method:v.type==="out"&&v.method&&v.method!=="cash"?v.method:""};
      if(r)Object.assign(r,d);else state.recurring.push({id:uid(),...d});commit(r?"Sabit kalem güncellendi":"Sabit kalem eklendi")},
    onDelete:r?()=>{state.recurring=state.recurring.filter(x=>x!==r);commit("Sabit kalem silindi (geçmiş işlemler duruyor)")}:null});
}
function cardSheet(c){
  formSheet({title:c?"Kartı düzenle":"Kredi kartı ekle",fields:[
    {id:"name",label:"Kart adı",value:c?c.name:"",ph:"Örn. Bonus, World, Maximum"},
    [{id:"cutDay",label:"Hesap kesim günü",type:"select",value:c?String(c.cutDay):"1",options:Array.from({length:31},(_,i)=>[String(i+1),String(i+1)])},{id:"dueDay",label:"Son ödeme günü",type:"select",value:c?String(c.dueDay):"10",options:Array.from({length:31},(_,i)=>[String(i+1),String(i+1)])}],
    {id:"limit",label:"Limit (isteğe bağlı)",type:"number",value:c&&c.limit?c.limit:"",ph:"0"}],
    onSave:v=>{if(!v.name.trim())return"Kart adı girin.";const lim=v.limit.trim()?parseNum(v.limit):0;if(isNaN(lim)||lim<0)return"Limiti kontrol edin.";
      const d={name:v.name.trim(),cutDay:+v.cutDay,dueDay:+v.dueDay,limit:lim};if(c)Object.assign(c,d);else state.cards.push({id:uid(),...d});commit(c?"Kart güncellendi":"Kart eklendi")},
    onDelete:c?()=>{state.cards=state.cards.filter(x=>x!==c);state.tx.forEach(x=>{if(x.method===c.id)x.method=""});commit("Kart silindi")}:null});
}
function cashSheet(){
  const s=S();
  formSheet({title:"Nakit bakiyesi",fields:[
    {id:"link",label:"Ana portföyün zekât hesabına dahil et",type:"seg",value:s.cashLink===false?"0":"1",options:[["1","Dahil"],["0","Hariç"]]},
    [{id:"start",label:"Başlangıç bakiyesi",type:"number",value:s.cashStart||"",ph:"0"},{id:"cur",label:"Para birimi",type:"select",value:s.cashStartCur||"TRY",options:CURS}],
    {id:"date",label:"Başlangıç tarihi (bu tarihten önceki işlemler sayılmaz)",type:"date",value:s.cashStartDate||""}],
    extra:`<div class="note">Bakiye = başlangıç + gelirler − giderler. Yalnızca ana portföyün zekât hesabında kullanılır; Özet ve Portföy ekranlarındaki toplamlara eklenmez. Örneğin bugün hesabınızda ve elinizde toplam ne kadar nakit varsa onu başlangıç bakiyesi olarak bugünün tarihiyle girin; sonraki gelir ve giderler üzerine eklenir. Bankadaki parayı ayrıca "Nakit / Mevduat" varlığı olarak eklediyseniz iki kez sayılmaması için birini kaldırın.</div>`,
    onSave:v=>{const a=v.start.trim()?parseNum(v.start):0;if(isNaN(a))return"Başlangıç bakiyesini kontrol edin.";if(v.date&&v.date>todayISO())return"Tarih ileri olamaz.";
      s.cashLink=v.link==="1";s.zakatCash=true;s.cashStart=a;s.cashStartCur=v.cur;s.cashStartDate=v.date||"";commit("Nakit bakiyesi ayarlandı")}});
}
/* ---------- birikim hedefleri ---------- */
const GUNITS=[["TRY","TL"],["USD","Dolar"],["EUR","Euro"],["GAU","Gram altın"]];
function toUnit(baseVal,u){const tl=baseVal*rate(S().base);if(u==="GAU"){const g=gramPrice();return g?tl/g:0}const r=rate(u);return r?tl/r:0}
const fmtU=(v,u)=>u==="GAU"?(S().hide?"••••":fmtN(v,1)+" g"):fmt(v,u,{dec:0});
const goalHs=g=>state.portfolios.flatMap(p=>p.holdings).filter(h=>(g.hs||[]).includes(h.id));
const goalSrcTxt=g=>g.src==="pf"?esc((state.portfolios.find(p=>p.id===g.pf)||{}).name||"portföy"):g.src==="hs"?esc(goalHs(g).map(h=>h.symbol||h.name).join(", ")||"varlık seçilmedi"):"";
function goalProg(g){
  let cur=0;
  if(g.src==="pf"){const p=state.portfolios.find(x=>x.id===g.pf);cur=p?toUnit(pfTotals(p).v,g.unit):0}
  else if(g.src==="hs"){cur=toUnit(goalHs(g).reduce((a,h)=>a+hVal(h),0),g.unit)}
  else cur=(g.saves||[]).reduce((a,x)=>a+(+x.amount||0),0);
  const tgt=+g.target||0,left=Math.max(0,tgt-cur),pct=tgt?Math.min(100,cur/tgt*100):0;
  let months=null,monthly=null;
  if(g.due){const t=new Date(todayISO()+"T00:00:00"),d=new Date(g.due+"T00:00:00");months=Math.max(0,(d.getFullYear()-t.getFullYear())*12+d.getMonth()-t.getMonth()+(d.getDate()>=t.getDate()?0:-1));monthly=left>0?left/Math.max(1,months):0}
  return{cur,tgt,left,pct,months,monthly,done:tgt>0&&cur>=tgt};
}
function goalsCard(){
  const gs=state.goals||[];
  return `<section class="card"><div class="sec" style="margin-bottom:${gs.length?8:0}px"><h2>Birikim hedefleri</h2><button class="btn ghost sm" data-act="goal-new">Hedef ekle</button></div>
  ${gs.length?`<div class="list">${gs.map(g=>{const r=goalProg(g);return `<button class="row" data-act="goal-open" data-id="${g.id}" style="display:block">
    <div style="display:flex;justify-content:space-between;gap:10px;align-items:baseline"><span class="t" style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(g.name)}</span><span class="num" style="font-weight:700;white-space:nowrap">${fmtU(r.cur,g.unit)} <span class="sub">/ ${fmtU(r.tgt,g.unit)}</span></span></div>
    <div class="bar" style="margin:7px 0 5px"><i style="width:${r.pct}%;background:var(${r.done?"--pos":"--accent"})"></i></div>
    <div style="display:flex;justify-content:space-between;gap:10px" class="s"><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">%${fmtN(r.pct,0)}${g.src!=="manual"?" · "+goalSrcTxt(g):""}</span><span>${r.done?`<span class="pos-t">Hedefe ulaşıldı</span>`:g.due?(r.months>0?`${r.months} ay · aylık ${fmtU(r.monthly,g.unit)}`:`<span class="neg-t">Süre doldu · ${fmtU(r.left,g.unit)} kaldı</span>`):`${fmtU(r.left,g.unit)} kaldı`}</span></div></button>`}).join("")}</div>`
  :`<div class="sub" style="margin-top:6px">Ev peşinatı, araba, hac/umre, çocuğun eğitimi gibi hedefler koyun; ilerlemeyi ve aylık ne kadar ayırmanız gerektiğini görün.</div>`}</section>`;
}
function goalSheet(g){
  formSheet({title:g?"Hedefi düzenle":"Birikim hedefi ekle",fields:[
    {id:"name",label:"Hedef adı",value:g?g.name:"",ph:"Örn. Ev peşinatı, Umre, Araba"},
    [{id:"target",label:"Hedef tutar",type:"number",value:g?g.target:"",ph:"0"},{id:"unit",label:"Birim",type:"select",value:g?g.unit:"TRY",options:GUNITS}],
    {id:"due",label:"Hedef tarih (isteğe bağlı)",type:"date",value:g?(g.due||""):""},
    {id:"src",label:"İlerleme nereden hesaplansın",type:"seg",value:g?g.src:"hs",options:[["hs","Seçtiğim varlıklar"],["manual","Ayırdığım tutarlar"],["pf","Bir portföy"]]},
    {id:"pf",label:"Portföy",type:"select",value:g&&g.pf||(state.portfolios[0]||{}).id||"",options:state.portfolios.map(p=>[p.id,pfName(p.id)])}],
    extra:`<div class="field" id="w_hsel"><label>Hedefe ait varlıklar</label><div class="hsel">${state.portfolios.flatMap(p=>p.holdings.filter(h=>+h.qty>0).map(h=>`<label class="hck"><input type="checkbox" name="hsel" value="${h.id}" ${g&&(g.hs||[]).includes(h.id)?"checked":""}><span><b>${esc(h.name)}</b><small>${esc(h.symbol||KINDS[h.kind]||"")} · ${esc(p.name)} · ${fmt(hVal(h),null,{dec:0})}</small></span></label>`)).join("")||`<div class="sub">Önce portföye varlık ekleyin.</div>`}</div></div>
    <div class="note">"Seçtiğim varlıklar": örneğin KLU fonu ve para piyasası fonunuzu işaretlerseniz, bu varlıkların güncel değeri hedefe ilerleme sayılır; alım yaptıkça hedef de kendiliğinden ilerler. "Ayırdığım tutarlar" seçilirse hedefe her para ayırdığınızda kaydedersiniz. "Bir portföyün değeri" seçilirse, örneğin hedef için açtığınız ayrı bir portföyün güncel değeri ilerleme sayılır.</div>`,
    onOpen:(form,sh)=>{const upd=()=>{if(!sh.querySelector("#w_pf"))return;const v=form.elements.src.value;sh.querySelector("#w_pf").hidden=v!=="pf";sh.querySelector("#w_hsel").hidden=v!=="hs"};form.addEventListener("click",()=>setTimeout(upd,0));upd()},
    onSave:v=>{const t=parseNum(v.target);if(!v.name.trim())return"Hedef adını girin.";if(!(t>0))return"Hedef tutarı girin.";if(v.src==="pf"&&!v.pf)return"Önce bir portföy oluşturun.";
      const hs=[...document.querySelectorAll('#sf input[name="hsel"]:checked')].map(x=>x.value);if(v.src==="hs"&&!hs.length)return"Hedefe ait en az bir varlık seçin.";
      const d={name:v.name.trim(),target:t,unit:v.unit,due:v.due||"",src:v.src,pf:v.src==="pf"?v.pf:"",hs:v.src==="hs"?hs:[]};
      if(g)Object.assign(g,d);else state.goals.push({id:uid(),saves:[],created:todayISO(),...d});commit(g?"Hedef güncellendi":"Hedef eklendi")},
    onDelete:g?()=>{state.goals=state.goals.filter(x=>x!==g);commit("Hedef silindi")}:null});
}
function goalDetail(g){
  const r=goalProg(g),sv=(g.saves||[]).slice().sort((a,b)=>b.date.localeCompare(a.date));
  openSheet(`<h3>${esc(g.name)}</h3>
    <div class="dsum"><div><span class="label">Biriken</span><div class="dv num">${fmtU(r.cur,g.unit)}</div></div><span class="chg ${r.done?"up":""}"><b class="num">%${fmtN(r.pct,0)}</b><span>${r.done?"tamamlandı":"tamam"}</span></span></div>
    <div class="bar"><i style="width:${r.pct}%;background:var(${r.done?"--pos":"--accent"})"></i></div>
    <div class="tiles">
      <div><span class="label">Hedef</span><b class="num">${fmtU(r.tgt,g.unit)}</b></div>
      <div><span class="label">Kalan</span><b class="num">${fmtU(r.left,g.unit)}</b></div>
      ${g.due?`<div><span class="label">Hedef tarih</span><b>${fmtDate(g.due)}</b></div>${r.left>0&&r.months>0?`<div><span class="label">Aylık ayırmanız gereken · ${r.months} ay</span><b class="num">${fmtU(r.monthly,g.unit)}</b></div>`:""}`:""}
    </div>
    ${g.src==="manual"?`<form class="form" id="gsF" novalidate><div class="label sh-sec">Para ayır</div><div class="frow"><div class="field"><label for="gsA">Tutar (${esc((GUNITS.find(u=>u[0]===g.unit)||[0,g.unit])[1])})</label><input id="gsA" inputmode="decimal" placeholder="0"></div><div class="field"><label for="gsD">Tarih</label><input id="gsD" type="date" value="${todayISO()}"></div></div><div class="err" id="gsErr"></div><div style="display:flex;gap:8px"><button class="btn primary" type="submit">Ekle</button><button class="btn" type="button" id="gsW">Çek</button></div></form>
    <div class="label sh-sec">Hareketler</div>${sv.length?`<div class="list">${sv.map(x=>`<div class="row"><div class="main"><div class="t num ${x.amount<0?"neg-t":""}">${x.amount>0?"+":""}${fmtU(x.amount,g.unit)}</div><div class="s">${fmtDate(x.date)}</div></div><button class="icon-btn sm" data-del-gs="${x.id}" aria-label="Kaydı kaldır">${ic(I.trash,16)}</button></div>`).join("")}</div>`:`<div class="sub" style="padding:8px 0">Henüz kayıt yok.</div>`}`
    :g.src==="hs"?`<div class="label">Hedefe ait varlıklar</div><div class="list">${goalHs(g).map(h=>`<div class="row"><div class="main"><div class="t">${esc(h.name)}</div><div class="s">${esc(h.symbol||KINDS[h.kind]||"")}</div></div><div class="end num">${fmtU(toUnit(hVal(h),g.unit),g.unit)}</div></div>`).join("")||`<div class="sub">Seçili varlık bulunamadı; hedefi düzenleyip yeniden seçin.</div>`}</div>`
    :`<div class="note">İlerleme, ${esc((state.portfolios.find(p=>p.id===g.pf)||{}).name||"seçili portföy")} portföyünün güncel değerinden hesaplanıyor.</div>`}
    <div class="actions eq"><button class="btn" id="gEdit">${ic(I.edit)}Düzenle</button></div>`,sh=>{
      sh.querySelector("#gEdit").onclick=()=>{closeSheet();goalSheet(g)};
      const f=sh.querySelector("#gsF");
      const add=sign=>{const a=parseNum(sh.querySelector("#gsA").value);if(!(a>0)){sh.querySelector("#gsErr").textContent="Geçerli bir tutar girin.";return}g.saves=g.saves||[];g.saves.push({id:uid(),amount:sign*a,date:sh.querySelector("#gsD").value||todayISO()});commit(sign>0?"Hedefe eklendi":"Hedeften çekildi");goalDetail(g)};
      if(f){f.onsubmit=e=>{e.preventDefault();add(1)};sh.querySelector("#gsW").onclick=()=>add(-1)}
      sh.querySelectorAll("[data-del-gs]").forEach(b=>b.onclick=()=>{g.saves=g.saves.filter(x=>x.id!==b.dataset.delGs);commit("Kayıt kaldırıldı");goalDetail(g)});
    });
}
function budgetSheet(){
  const b=state.budgets||{};
  openSheet(`<h3>Aylık bütçe</h3><form class="form" id="bf" novalidate><div class="sub">Her kategori için aylık üst sınır girin (${esc(S().base)}). Boş bırakılanlar bütçeye dahil edilmez.</div>
    ${CATS.out.map((c,i)=>`<div class="set-row" style="padding:6px 0"><label for="b_${i}" class="lbl">${esc(c)}</label><input class="inline-in" id="b_${i}" data-c="${esc(c)}" inputmode="decimal" placeholder="—" value="${+b[c]>0?String(b[c]).replace(".",","):""}"></div>`).join("")}
    <div class="err" id="bErr"></div><div class="actions"><button class="btn primary grow" type="submit">Kaydet</button></div></form>`,sh=>{
    sh.querySelector("#bf").onsubmit=e=>{e.preventDefault();const nb={};for(const inp of sh.querySelectorAll("input[data-c]")){const raw=inp.value.trim();if(!raw)continue;const v=parseNum(raw);if(isNaN(v)||v<0){sh.querySelector("#bErr").textContent=inp.dataset.c+" için geçerli bir tutar girin.";return}if(v>0)nb[inp.dataset.c]=v}
      state.budgets=nb;closeSheet();commit("Bütçe kaydedildi")};
  });
}
function debtSheet(d){
  formSheet({title:d?"Kaydı düzenle":"Borç / alacak ekle",fields:[
    {id:"dir",label:"Yön",type:"seg",value:d?d.dir:view.debtDir,options:[["lent","Borç verdim"],["borrowed","Borç aldım"]]},
    {id:"person",label:"Kişi / kurum",value:d?d.person:"",ph:"Örn. Ahmet, Banka kredisi"},
    ...(state.portfolios.length?[{id:"pf",label:"Hangi portföye ait (zekât hesabı için)",type:"select",value:d?(d.pf||(mainPf()||{}).id):(view.debtPf&&view.debtPf!=="all"?view.debtPf:(mainPf()||{}).id),options:state.portfolios.map(p=>[p.id,pfName(p.id)])}]:[]),
    [{id:"amount",label:"Toplam tutar",type:"number",value:d?d.amount:"",ph:"0"},{id:"cur",label:"Para birimi",type:"select",value:d?d.cur:"TRY",options:CURS}],
    [{id:"date",label:"Tarih",type:"date",value:d?d.date:todayISO()},{id:"due",label:"Vade (isteğe bağlı)",type:"date",value:d?d.due:""}],
    {id:"note",label:"Not",value:d?d.note:"",ph:"İsteğe bağlı"}],
    onSave:v=>{const a=parseNum(v.amount);if(!v.person.trim())return"Kişi veya kurum adını girin.";if(!(a>0))return"Tutar sıfırdan büyük olmalı.";
      const x={dir:v.dir,person:v.person.trim(),amount:a,cur:v.cur,date:v.date,due:v.due,note:v.note.trim(),pf:v.pf||(mainPf()||{}).id};
      if(d)Object.assign(d,x);else state.debts.push({id:uid(),payments:[],...x});view.debtDir=v.dir;commit(d?"Kayıt güncellendi":"Kayıt eklendi")},
    onDelete:d?()=>{state.debts=state.debts.filter(y=>y!==d);commit("Kayıt silindi")}:null});
}
function debtDetail(d){
  const left=debtLeft(d);
  openSheet(`<h3>${esc(d.person)}</h3>
    <div class="dsum"><div><span class="label">${d.dir==="lent"?"Kalan alacak":"Kalan borç"}</span><div class="dv num">${fmt(left,d.cur)}</div></div>${left<=0?`<span class="chg up"><b>Kapandı</b></span>`:d.due?(n=>`<span class="chg ${n<0?"down":""}"><b>${n<0?-n+" gün gecikti":n+" gün kaldı"}</b></span>`)(daysBetween(todayISO(),d.due)):""}</div>
    <div class="bar"><i style="width:${+d.amount?Math.min(100,debtPaid(d)/d.amount*100):0}%;background:var(${d.dir==="lent"?"--pos":"--neg"})"></i></div>
    <div class="tiles">
      <div><span class="label">${d.dir==="lent"?"Verdiğim":"Aldığım"} tutar</span><b class="num">${fmt(d.amount,d.cur)}</b></div>
      <div><span class="label">${d.dir==="lent"?"Tahsil edilen":"Ödenen"}</span><b class="num">${fmt(debtPaid(d),d.cur)}</b></div>
      ${d.due?`<div><span class="label">Vade</span><b>${fmtDate(d.due)}</b></div>`:""}
      ${d.note?`<div class="w2"><span class="label">Not</span><b class="txt">${esc(d.note)}</b></div>`:""}
    </div>
    ${left>0?`<form class="form" id="payF" novalidate><div class="label sh-sec">${d.dir==="lent"?"Tahsilat ekle":"Ödeme ekle"}</div><div class="frow"><div class="field"><label for="payA">Tutar (${esc(d.cur)})</label><input id="payA" inputmode="decimal" placeholder="${esc(fmtN(left))}"></div><div class="field"><label for="payD">Tarih</label><input id="payD" type="date" value="${todayISO()}"></div></div><div class="err" id="payErr"></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" type="submit">Ekle</button><button class="btn" type="button" id="payAll">Tamamını kapat</button></div></form>`:`<div class="note">Bu kayıt tamamen kapandı.</div>`}
    <div class="label sh-sec">Ödeme geçmişi</div>
    ${d.payments.length?`<div class="list">${d.payments.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(p=>`<div class="row"><div class="main"><div class="t num">${fmt(p.amount,d.cur)}</div><div class="s">${fmtDate(p.date)}</div></div><button class="icon-btn sm" data-del-pay="${p.id}" aria-label="Ödemeyi kaldır">${ic(I.trash,16)}</button></div>`).join("")}</div>`:`<div class="sub" style="padding:8px 0">Henüz ödeme yok.</div>`}
    <div class="actions eq"><button class="btn" id="dEdit">${ic(I.edit)}Düzenle</button></div>`,sh=>{
      sh.querySelector("#dEdit").onclick=()=>{closeSheet();debtSheet(d)};
      const f=sh.querySelector("#payF");
      const add=a=>{d.payments.push({id:uid(),amount:a,date:sh.querySelector("#payD").value||todayISO()});commit(debtLeft(d)<=0?"Kayıt kapandı":"Ödeme eklendi");debtDetail(d)};
      if(f){f.onsubmit=e=>{e.preventDefault();const a=parseNum(sh.querySelector("#payA").value);if(!(a>0)){sh.querySelector("#payErr").textContent="Geçerli bir tutar girin.";return}if(a>left+1e-9){sh.querySelector("#payErr").textContent="Tutar kalan borçtan fazla olamaz.";return}add(a)};
        sh.querySelector("#payAll").onclick=()=>add(left)}
      sh.querySelectorAll("[data-del-pay]").forEach(b=>b.onclick=()=>{d.payments=d.payments.filter(p=>p.id!==b.dataset.delPay);commit("Ödeme kaldırıldı");debtDetail(d)});
    });
}
function zakatSheet(p){
  const z=zakat();
  formSheet({title:(p?"Zekât ödemesini düzenle":"Zekât ödemesi ekle")+(state.portfolios.length>1?" · "+esc(pfName(p?p.pf:zOwner())):""),fields:[
    [{id:"amount",label:"Tutar",type:"number",value:p?p.amount:(z.left?Math.round(z.left):""),ph:"0"},{id:"cur",label:"Para birimi",type:"select",value:p?p.cur:S().base,options:CURS}],
    {id:"date",label:"Tarih",type:"date",value:p?p.date:todayISO()},
    {id:"note",label:"Kime / not",value:p?p.note:"",ph:"Örn. Akraba, dernek"}],
    onSave:v=>{const a=parseNum(v.amount);if(!(a>0))return"Tutar sıfırdan büyük olmalı.";const x={amount:a,cur:v.cur,date:v.date||todayISO(),note:v.note.trim()};if(p)Object.assign(p,x);else state.zakatPaid.push({id:uid(),pf:zOwner(),...x});commit("Zekât ödemesi kaydedildi")},
    onDelete:p?()=>{state.zakatPaid=state.zakatPaid.filter(x=>x!==p);commit("Ödeme silindi")}:null});
}

/* ---------- sample ---------- */
function sample(){
  const s=emptyState(); s.settings=state&&state.settings?state.settings:defaultSettings();
  const d=n=>addDays(todayISO(),n);
  s.portfolios=[
    {id:uid(),name:"Uzun Vade (örnek)",color:"--c1",holdings:[
      {id:uid(),name:"Gram altın",symbol:"GAU",kind:"altin",cur:"TRY",qty:42,cost:4300,price:5800},
      {id:uid(),name:"Cumhuriyet altını",symbol:"CUM",kind:"altin",cur:"TRY",qty:3,cost:28500,price:38900},
      {id:uid(),name:"Katılım hisse fonu",symbol:"FON",kind:"fon",cur:"TRY",qty:12000,cost:1.84,price:2.31},
      {id:uid(),name:"BIST hisse sepeti",symbol:"BIST",kind:"hisse",cur:"TRY",qty:350,cost:118,price:132.5}]},
    {id:uid(),name:"Döviz & Nakit (örnek)",color:"--c2",holdings:[
      {id:uid(),name:"Dolar hesabı",symbol:"USD",kind:"doviz",cur:"USD",qty:2500,cost:1,price:1},
      {id:uid(),name:"Katılım hesabı",symbol:"TL",kind:"nakit",cur:"TRY",qty:85000,cost:1,price:1}]},
    {id:uid(),name:"BES (örnek)",color:"--c4",holdings:[{id:uid(),name:"BES birikimi (örnek)",symbol:"",kind:"bes",cur:"TRY",qty:1,cost:96000,price:121500,trades:[],bes:{principal:96000,gain:14200,state:9600,stateGain:1700}}]}
  ];
  const m0=todayISO().slice(0,8);const tx=[];
  for(let k=0;k<6;k++){const base=addDays(todayISO(),-30*k).slice(0,8);
    tx.push({type:"in",cat:"Maaş",amount:68000,date:base+"05"},{type:"in",cat:"Yan gelir",amount:6000+k*900,date:base+"12"},{type:"out",cat:"Kira & aidat",amount:22000,date:base+"03"},{type:"out",cat:"Market & mutfak",amount:11800+k*400,date:base+"09"},{type:"out",cat:"Faturalar",amount:4200,date:base+"15"},{type:"out",cat:"Ulaşım & araç",amount:3100,date:base+"18"},{type:"out",cat:"Eğitim",amount:2500,date:base+"20"},{type:"out",cat:"Yardım & sadaka",amount:1500,date:base+"22"})}
  s.tx=tx.filter(t=>t.date<=todayISO()).map(t=>({id:uid(),cur:"TRY",note:"Örnek",...t}));
  s.debts=[{id:uid(),dir:"lent",person:"Mehmet (örnek)",amount:30000,cur:"TRY",date:d(-80),due:d(10),note:"",payments:[{id:uid(),amount:10000,date:d(-20)}]},
    {id:uid(),dir:"borrowed",person:"Kredi kartı taksidi (örnek)",amount:18000,cur:"TRY",date:d(-60),due:d(25),note:"6 taksit",payments:[{id:uid(),amount:6000,date:d(-30)}]}];
  s.settings.hawlPf={[s.portfolios[0].id]:toH(d(-220))};s.settings.mainPf=s.portfolios[0].id;
  if(!Object.values(s.settings.coins||{}).some(v=>+v>0)){s.settings.coins={cumhuriyet:41800,hamit:41500,aziz:41350,resat:41200};s.settings.ratesUpdated=null}
  s.recurring=[{id:uid(),type:"out",name:"Kira",amount:22000,day:3,cat:"Kira & aidat",cur:"TRY",method:""},{id:uid(),type:"out",name:"İnternet",amount:650,day:12,cat:"Faturalar",cur:"TRY",method:""},{id:uid(),type:"in",name:"Maaş",amount:68000,day:15,cat:"Maaş",cur:"TRY",method:""}];
  s.zakatPaid=[{id:uid(),pf:s.portfolios[0].id,amount:5000,cur:"TRY",date:d(-15),note:"Örnek ödeme"}];
  void m0;return s;
}

/* ---------- events ---------- */
document.addEventListener("click",e=>{
  const t=e.target.closest("[data-tab],[data-act]");if(!t||t.closest("#sheet"))return;
  if(t.dataset.tab){view.tab=t.dataset.tab;render();window.scrollTo({top:0});return}
  const a=t.dataset.act,id=t.dataset.id;
  if(a==="start-empty"){state=state||emptyState();state.updatedAt=Date.now();commit();pfSheet();return}
  if(a==="start-sample"){state=normalize(sample());commit("Örnek veriler yüklendi");return}
  if(a==="new-pf")return pfSheet();
  if(a==="edit-pf")return pfSheet(state.portfolios.find(p=>p.id===id));
  if(a==="open-pf"){view.pf=id;view.tab="portfoy";render();window.scrollTo({top:0});return}
  if(a==="pf"){view.pf=id;render();if(!t.closest(".chips"))window.scrollTo({top:0});return}
  if(a==="add-h")return holdingSheet();
  if(a==="hide"){S().hide=!S().hide;commit();return}
  if(a==="edit-tr"){const p=state.portfolios.find(p=>p.id===t.dataset.pf),h=p&&p.holdings.find(x=>x.id===t.dataset.h),tr=h&&(h.trades||[]).find(x=>x.id===id);if(tr)tradeSheet(p.id,h,tr.type,tr);return}
  if(a==="more-tr"){view.trN=(view.trN||15)+30;render();return}
  if(a==="edit-h"){const p=state.portfolios.find(p=>p.id===t.dataset.pf);const hh=p.holdings.find(h=>h.id===id);return hh&&hh.kind==="bes"?besSheet(p.id,hh):holdingDetail(p.id,hh)}
  if(a==="month"){const[y,m]=view.month.split("-").map(Number);const d=new Date(y,m-1+(+t.dataset.d),1);view.month=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");render();return}
  if(a==="txtype"){view.txType=t.dataset.k;render();return}
  if(a==="edit-tx")return txSheet(state.tx.find(x=>x.id===id));
  if(a==="rec-new")return recSheet();
  if(a==="rec-edit")return recSheet(state.recurring.find(x=>x.id===id));
  if(a==="rec-pay"){const r=state.recurring.find(x=>x.id===id);if(!r)return;let d=dayIn(view.month,r.day);if(d>todayISO()&&view.month===todayISO().slice(0,7))d=todayISO();
    state.tx.push({id:uid(),type:r.type,amount:r.amount,cur:r.cur,cat:r.cat,date:d,note:r.name,method:r.method||"",rid:r.id});commit(r.name+(r.type==="in"?" alındı":" ödendi"));return}
  if(a==="card-new")return cardSheet();
  if(a==="card-edit")return cardSheet(cardById(id));
  if(a==="card-pay"){const c=cardById(id);const b=cardBal(c);return txSheet(null,{type:"card",amount:Math.round(b.bal*100)/100,card:c.id})}
  if(a==="budget")return budgetSheet();
  if(a==="goal-new")return goalSheet();
  if(a==="goal-open"){const g=state.goals.find(x=>x.id===id);return g&&goalDetail(g)}
  if(a==="cash-set")return cashSheet();
  if(a==="ddir"){view.debtDir=t.dataset.k;render();return}
  if(a==="dpf"){view.debtPf=t.dataset.k;render();return}
  if(a==="open-debt")return debtDetail(state.debts.find(x=>x.id===id));
  if(a==="edit-zp")return zakatSheet(state.zakatPaid.find(x=>x.id===id));
  if(a==="setg"){view.setG=t.dataset.k;render();return}
  if(a==="txclear"){view.txQ="";view.txCat="";render();return}
  if(a==="notif-test"){notifTest();return}
  if(a==="rates"||a==="zset"){view.tab="ayarlar";view.setG=a==="rates"?"fiyat":"zekat";render();setTimeout(()=>{const el=$(a==="rates"?"#ratesCard":"#zakatCard");el&&el.scrollIntoView({behavior:"smooth",block:"start"})},30);return}
  if(a==="set"){S()[t.dataset.k]=t.dataset.v;commit();return}
  if(a==="nisab"){S().nisabGram=+t.dataset.v;commit();return}
  if(a==="save-rates"){const u=$("#rUSD")?parseNum($("#rUSD").value):S().rates.USD,eu=$("#rEUR")?parseNum($("#rEUR").value):S().rates.EUR;
    if(!(u>0&&eu>0)){toast("Kurlar sıfırdan büyük olmalı");return}
    const c={};for(const [k] of COINS){const el=$("#coin_"+k);const raw=el?el.value.trim():String(S().coins[k]||"");const v=raw?parseNum(raw):0;if(isNaN(v)||v<0){toast("Altın lira fiyatlarını kontrol edin");return}c[k]=v}
    if(!Object.values(c).some(v=>v>0)&&!goldInfo().gram){toast("En az bir altın lira fiyatı girin");return}
    S().rates.USD=u;S().rates.EUR=eu;S().coins=c;S().ratesUpdated=todayISO();commit("Fiyatlar kaydedildi");return}
  if(a==="export")return exportData();
  if(a==="plcur"){S().plCur=t.dataset.k==="USD"?"USD":"TRY";commit();return}
  if(a==="plmode"){S().plMode=t.dataset.k==="day"?"day":"total";commit();return}
  if(a==="histtoggle"){view.histOpen=!view.histOpen;render();return}
  if(a==="plcol"){S().plCol=plCol()==="pct"?"amt":"pct";commit();return}
  if(a==="hunit"){view.hUnit=t.dataset.k;render();return}
  if(a==="hrange"){view.hRange=t.dataset.k==="all"?"all":+t.dataset.k;render();return}
  if(a==="csv-h")return exportCSV("varliklar");
  if(a==="csv-t")return exportCSV("islemler");
  if(a==="signout")return signOut();
  if(a==="signin"){try{localStorage.removeItem(GUEST)}catch(e){}return showAuth()}
  if(a==="owner"){view.owner=t.dataset.k;view.pf="all";render();return}
  if(a==="zowner"){view.zOwner=t.dataset.k;render();return}
  if(a==="hawl-clear"){setHawl(zOwner(),null);commit("Zekât günü kaldırıldı");return}
  if(a==="hawl-today"){setHawl(zOwner(),toH(todayISO()));commit("Zekât günü "+fmtH(todayISO())+" olarak başlatıldı");return}
  if(a==="refresh")return refreshNow(t);
  if(a==="wipe"){if(t.dataset.c){withUndo(()=>{state.portfolios=[];state.tx=[];state.debts=[];state.zakatPaid=[];state.cards=[];state.recurring=[];state.goals=[];state.budgets={};state.hist={};commit("Tüm kayıtlar silindi")})}else{t.dataset.c="1";t.textContent="Evet, hepsini sil";t.classList.add("solid")}return}
});
document.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.matches&&e.target.matches('.row.li[role="button"]')){e.preventDefault();e.target.click()}});
document.addEventListener("change",e=>{
  const t=e.target;
  if(t.dataset.act==="tog"){if(t.dataset.p)S()[t.dataset.p][t.dataset.k]=t.checked;else S()[t.dataset.k]=t.checked;commit();return}
  if(t.dataset.act==="hijri"){const y=parseInt($("#hY").value,10),m=+$("#hM").value,d=+$("#hD").value;
    if(!m||!d||!$("#hY").value.trim())return;
    if(!(y>1300&&y<1600)){toast("Geçerli bir hicri yıl girin (ör. "+toH(todayISO()).y+")");return}
    const g=fromH(y,m,d);if(!g){toast("Bu hicri tarih bulunamadı");return}
    const realD=toH(g).d;setHawl(zOwner(),{y,m,d:realD});commit("Zekât günü "+fmtH(g)+" olarak ayarlandı");return}
  if(t.dataset.act==="nisabin"){const v=parseNum(t.value);if(!(v>0)){toast("Nisap sıfırdan büyük olmalı");return}S().nisabGram=v;commit("Nisap güncellendi");return}
  if(t.dataset.act==="wht"){const raw=t.value.trim();S().whtRates=S().whtRates||{};if(!raw){delete S().whtRates[t.dataset.k];commit();return}const v=parseNum(raw);if(isNaN(v)||v<0||v>100){toast("Stopaj oranı 0 ile 100 arasında olmalı");return}S().whtRates[t.dataset.k]=v;commit("Stopaj oranı kaydedildi");return}
  if(t.dataset.act==="feerate"){const v=parseNum(t.value);if(isNaN(v)||v<0||v>10){toast("Oran 0 ile 10 arasında olmalı");return}S().feeRate=v;commit("Komisyon oranı kaydedildi");return}
  if(t.dataset.act==="zosel"){view.zOwner=t.value;render();return}
  if(t.dataset.act==="ozpf"){view.ozPf=t.value;try{localStorage.setItem("emanet-ozpf",t.value)}catch(e){}render();return}
  if(t.dataset.act==="startsel"){S().start=t.value;commit();return}
  if(t.id==="importIn"&&t.files&&t.files[0]){const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!d||!Array.isArray(d.portfolios))throw 0;state=normalize(d);commit("Yedek yüklendi")}catch(err){toast("Dosya okunamadı. Emanet yedeği olan bir .json seçin.")}};r.readAsText(t.files[0])}
});
$("#setBtn").onclick=()=>{view.tab=view.tab==="ayarlar"?(S().start||"ozet"):"ayarlar";render();window.scrollTo({top:0})};
$("#eyeBtn").onclick=()=>{if(!state)return;S().hide=!S().hide;commit()};

function exportData(){
  const name="emanet-yedek-"+todayISO()+".json";
  try{const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:"application/json"}));
    const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);toast("Yedek indirildi")}
  catch(e){toast("Yedek indirilemedi")}
}

function saveFile(name,text,type){
  try{const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);return true}catch(e){return false}
}
/* Excel'in Türkçe ayarlarla doğrudan açabildiği CSV: noktalı virgül ayraç, ondalık virgül, UTF-8 BOM */
function exportCSV(kind){
  const n=v=>v==null||v===""||isNaN(v)?"":String(Math.round(v*1e6)/1e6).replace(".",",");
  const q=v=>{v=String(v??"");return /[;"\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};
  let rows;
  if(kind==="varliklar"){
    rows=[["Portföy","Sahibi","Varlık","Kod","Tür","Para birimi","Miktar","Ortalama maliyet","Güncel fiyat","Değer (TL)","Maliyet (TL)","Kâr/Zarar (TL)","Kâr/Zarar %","Dolar maliyeti","Dolar değeri","Alış tarihi"]];
    state.portfolios.forEach(p=>p.holdings.filter(h=>+h.qty>0).forEach(h=>{const b=rate(S().base),v=hVal(h)*b,c=hCost(h)*b;
      rows.push([p.name,ownerOf(p),h.name,h.symbol||"",KINDS[h.kind]||h.kind,h.cur,n(+h.qty),n(+h.cost),n(effPrice(h).p),n(v),n(c),n(v-c),n(c?(v-c)/c*100:0),n(costIn(h,"USD")),n(rate("USD")?v/rate("USD"):0),h.buyDate||""])}));
  }else{
    rows=[["Tarih","Tür","Kategori","Tutar","Para birimi","Ödeme şekli","Taksit","Not"]];
    state.tx.slice().sort((a,b)=>(a.date||"").localeCompare(b.date||"")).forEach(t=>{const c=cardById(t.type==="card"?t.card:t.method);
      rows.push([t.date||"",t.type==="in"?"Gelir":t.type==="card"?"Kart ödemesi":"Gider",t.cat||"",n(+t.amount),t.cur||"TRY",c?c.name:(t.type==="out"?"Nakit / banka kartı":""),t.inst||"",t.note||""])});
  }
  if(rows.length<2){toast("Aktarılacak kayıt yok");return}
  const ok=saveFile("emanet-"+kind+"-"+todayISO()+".csv","\ufeff"+rows.map(r=>r.map(q).join(";")).join("\r\n"),"text/csv;charset=utf-8");
  toast(ok?"Dosya indirildi":"Dosya indirilemedi");
}
let toastT;
function toast(m,undoSnap){
  const t=$("#toast");t.textContent=m;clearTimeout(toastT);
  if(undoSnap){const b=document.createElement("button");b.type="button";b.textContent="Geri al";b.onclick=()=>{try{state=normalize(JSON.parse(undoSnap))}catch(e){return}commit("Geri alındı")};t.appendChild(b)}
  t.hidden=false;toastT=setTimeout(()=>t.hidden=true,undoSnap?7000:2400);
}
/* silme işlemlerinden sonra birkaç saniye "Geri al" sunar */
function withUndo(fn){const snap=JSON.stringify(state);fn();const t=$("#toast");toast(t.hidden?"Silindi":t.textContent,snap)}

applyPrefs();render();boot();
})();
