/* Emanet — portföy, bütçe ve zekât defteri. Tek dosya, bağımlılık: js/vendor/supabase.js (isteğe bağlı). */
(function(){
"use strict";
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const uid=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);
const todayISO=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10)};
const LS="emanet-state-v1",MK="emanet-market-v1",FXK="emanet-fx-v1",WK="emanet-watch-v1",OWN="emanet-owner",GUEST="emanet-guest";
const CFG=window.EMANET_CONFIG||{};
const APP_VERSION="2.35";

const KINDS={hisse:"Hisse (BIST)",abd:"ABD hissesi",fon:"Yatırım fonu (TEFAS)",ppf:"Para piyasası fonu",altin:"Altın",gumus:"Gümüş",doviz:"Döviz",kripto:"Kripto",nakit:"Nakit",mevduat:"Mevduat / katılım hesabı",bes:"BES",emlak:"Gayrimenkul",diger:"Diğer"};
const CASH_LBL="Nakit (gelir-gider)";
const KIND_COLOR={hisse:"--c2",abd:"--c8",fon:"--c5",ppf:"--c3",altin:"--c1",gumus:"--c7",doviz:"--c9",kripto:"--c6",nakit:"--c3",mevduat:"--c10",bes:"--c4",emlak:"--c6",diger:"--c7"};
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
/* Kategoriler: hazır liste başlangıçtır; kullanıcı ekleyip çıkarabilir, sıralayabilir (ayarlarda cats alanında tutulur). */
const DEF_CATS={in:["Maaş","Ek ödemeler (kurs, görev, ikramiye)","Yan gelir","Kira geliri","Yatırım getirisi","Hediye","Diğer gelir"],
  out:["Kira & aidat","Faturalar","Market & mutfak","Kredi kartı harcaması","Kredi / taksit","Ulaşım & araç","Eğitim","Sağlık","Çocuk","Giyim","Ev & eşya","Dışarıda yemek & eğlence","Abonelikler","Hediye","Yardım & sadaka","Diğer gider"],
  save:["Birikim","Altın","Fon ve yatırım","Döviz","Acil durum fonu","BES"]};
const catList=t=>{const c=state&&state.settings&&state.settings.cats;return c&&Array.isArray(c[t])&&c[t].length?c[t]:DEF_CATS[t]};
const CATS={get in(){return catList("in")},get out(){return catList("out")},get save(){return catList("save")}};
const CAT_MAP={"Kira":"Kira & aidat","Market":"Market & mutfak","Ulaşım":"Ulaşım & araç","Ev":"Ev & eşya","Eğlence":"Dışarıda yemek & eğlence","Sadaka / Bağış":"Yardım & sadaka","Abonelik":"Abonelikler","Satış":"Yan gelir","Temettü / Faiz dışı getiri":"Yatırım getirisi","Diğer":null};

const CURS=["TRY","USD","EUR"];
/* Borç/alacak için ek birimler: altın ve gümüş adet/gram olarak tutulur, TL karşılığı güncel fiyattan hesaplanır */
const DUNITS={gram:["Gram altın","gr altın"],ceyrek:["Çeyrek altın","çeyrek"],yarim:["Yarım altın","yarım"],tam:["Tam altın","tam"],cumhuriyet:["Cumhuriyet altını","cumhuriyet"],ata:["Ata altın","ata"],resat:["Reşat altın","reşat"],hamit:["Hamit altın","hamit"],gumus:["Gram gümüş","gr gümüş"]};
const DEBT_UNITS=[["TRY","TL"],["USD","Dolar"],["EUR","Euro"],...Object.entries(DUNITS).map(([k,v])=>["G:"+k,v[0]])];
const isG=c=>typeof c==="string"&&c.slice(0,2)==="G:";
const unitName=c=>isG(c)?(DUNITS[c.slice(2)]||[c])[0]:c;
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
const defaultSettings=()=>({theme:"system",accent:"kobalt",fontSize:"m",compact:false,base:"TRY",rates:{USD:44,EUR:51},goldGram:0,coins:{cumhuriyet:0,hamit:0,aziz:0,resat:0},ratesUpdated:null,autoPrices:true,feeRate:0,tone:"gri",nisabGram:96,hawlH:null,hawlStart:"",hawlSet:true,zakatRecv:true,zakatDebt:true,zakatKinds:{hisse:true,abd:true,fon:true,ppf:true,altin:true,gumus:true,doviz:true,kripto:true,nakit:true,mevduat:true,bes:false,emlak:false,diger:true},hide:false,start:"ozet"});
const emptyState=()=>({v:1,updatedAt:0,settings:defaultSettings(),portfolios:[],tx:[],debts:[],zakatPaid:[],cards:[],recurring:[],goals:[],alerts:[],budgets:{}});

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
  // BIST kodları en az 4 karakterdir; "hisse" olarak girilmiş 3 karakterli kodlar TEFAS fonudur
  (s.portfolios||[]).forEach(p=>(p.holdings||[]).forEach(h=>{if(h&&h.kind==="hisse"&&/^[A-Za-z0-9]{3}$/.test((h.symbol||"").trim()))h.kind="fon"}));
  ["portfolios","tx","debts","zakatPaid","cards","recurring","goals","alerts"].forEach(k=>{if(!Array.isArray(s[k]))s[k]=[]});
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
const rate=c=>{if(c==="TRY")return 1;if(isG(c)){const v=market&&market.gold&&+market.gold[c.slice(2)];return v>0?v:+S().rates[c]||0}if(AUTO()&&market.fx&&+market.fx[c]>0)return +market.fx[c];return +S().rates[c]||0};
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
  if(isG(cur))return(v<0?"−":"")+fmtN(Math.abs(v||0),3)+" "+(DUNITS[cur.slice(2)]||[0,cur])[1];
  const a=Math.abs(v), d=opts.dec!=null?opts.dec:(a>=1000||Math.abs(a-Math.round(a))<1e-9?0:2);
  try{return new Intl.NumberFormat("tr-TR",{style:"currency",currency:cur,minimumFractionDigits:d,maximumFractionDigits:d}).format(v||0).replace(/^-/,"−")}catch(e){return (v||0).toFixed(d)+" "+cur}
}
const fmtN=(v,d=2)=>new Intl.NumberFormat("tr-TR",{maximumFractionDigits:d}).format(v||0);
const fmtPct=v=>(v>0.04?"+":v<-0.04?"−":"")+"%"+new Intl.NumberFormat("tr-TR",{maximumFractionDigits:1,minimumFractionDigits:1}).format(Math.abs(v||0));
const fmtDate=d=>{if(!d)return"";const x=new Date(d+"T00:00:00");return x.toLocaleDateString("tr-TR",{day:"numeric",month:"short",year:x.getFullYear()!==new Date().getFullYear()?"numeric":undefined})};
const daysBetween=(a,b)=>Math.round((new Date(b+"T00:00:00")-new Date(a+"T00:00:00"))/864e5);

/* ---------- calcs ---------- */
const hVal=h=>toBase((+h.qty||0)*effPrice(h).p,h.cur);
function fxOf(h,c){if(c==="TRY")return 1;if(h.fxAt&&+h.fxAt[c]>0)return +h.fxAt[c];return rate(c)}
function costIn(h,c){const raw=(+h.qty||0)*(+h.cost||0);if(c===h.cur)return raw;const tl=raw*fxOf(h,h.cur);return tl/(fxOf(h,c)||1)}
const hCost=h=>toBase(costIn(h,"TRY"),"TRY");
/* alınan temettü ve kâr payları (net): toplam getiriye eklenir */
const hDiv=h=>+h.divs>0?toBase(+h.divs,h.cur):0;
const divOf=list=>list.reduce((a,h)=>a+hDiv(h),0);
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
    const a=effPrice(h).auto?1:0;if(!o||o.u!==u||o.s!==usd||o.a!==a){D.cur[h.id]={u,s:usd,a};ch=true}}));
  Object.keys(D.cur).forEach(id=>{if(!live.has(id)){delete D.cur[id];ch=true}});
  return ch;
}
const dayRef=()=>state.day&&state.day.ref&&state.day.d===todayISO()?state.day.ref:null;
/* Önceki günün kapanışı (fiyat dalındaki data/close.json): sunucu her 10 dakikada yazar, cihazın o gün açılıp açılmamasına bağlı değildir.
   Varlık için kapanış fiyatı varsa günlük K/Z ondan hesaplanır; yoksa cihazda tutulan son görülen değere düşülür. */
let closeD=null;
const closeOK=()=>closeD&&closeD.prev&&closeD.prev.p&&closeD.d===todayISO()?closeD.prev:null;
function closeKey(h){
  if(h.kind==="altin"){const k=goldKey(h);return k&&h.cur==="TRY"?["gold:"+k]:[]}
  if(h.kind==="gumus")return h.cur==="TRY"?["gold:gumus"]:[];
  const sy=(h.symbol||"").toUpperCase().trim();if(!sy)return[];
  return h.kind==="abd"?["q:abd:"+sy,"q:hisse:"+sy]:["q:"+h.kind+":"+sy];
}
function dayPL(h){
  const q=+h.qty||0;if(!(q>0))return null;
  const ep=effPrice(h),uNow=ep.p*rate(h.cur),usd=rate("USD");let u0,s0;
  const cp=closeOK(),k=cp&&ep.auto?closeKey(h).find(x=>+cp.p[x]>0):null;
  const fx0=c=>c==="TRY"?1:+cp.p["fx:"+c]||0;
  if(cp&&h.buyDate&&h.buyDate>cp.d){u0=costIn(h,"TRY")/q;s0=fxOf(h,"USD")}           // kapanıştan sonra alındı: baz alış maliyeti
  else if(k){u0=+cp.p[k]*fx0(h.cur);s0=fx0("USD")}
  else{
    const ref=dayRef();if(!ref)return null;const r=ref.h[h.id];
    if(r&&!(r.a===0&&ep.auto)){u0=r.u;s0=r.s}                                         // elle girilen fiyattan otomatiğe geçtiyse karşılaştırılmaz
    else if(h.buyDate&&h.buyDate>ref.d){u0=costIn(h,"TRY")/q;s0=fxOf(h,"USD")}
    else return null;
  }
  if(!(u0>0)||!(s0>0)||!(usd>0))return null;
  return{pl:q*(uNow-u0)/rate(S().base),base:q*u0/rate(S().base),plU:q*(uNow/usd-u0/s0),baseU:q*u0/s0};
}
function daySum(hs){let pl=0,b=0,plU=0,bU=0,n=0;hs.forEach(h=>{const d=dayPL(h);if(d){pl+=d.pl;b+=d.base;plU+=d.plU;bU+=d.baseU;n++}});return n?{pl,pct:b?pl/b*100:0,plU,pctU:bU?plU/bU*100:0}:null}
const dayLabel=()=>{if(closeOK())return"bugün";const r=dayRef();if(!r)return"";const g=daysBetween(r.d,todayISO());return g<=1?"bugün":"son "+g+" günde"};
/* Varlık tablosunun sağ sütunu beş bilgi arasında döner: değer, günlük K/Z, toplam K/Z, adet, fiyat */
const COLS=[["val","Değer"],["day","Günlük"],["total","Toplam"],["qty","Adet"],["price","Fiyat"]];
const colMode=()=>COLS.some(c=>c[0]===S().col)?S().col:"val";
const plMode=()=>S().plMode==="total"?"total":"day";
/* Tutarın hemen altındaki iki rozet: Günlük ve Toplam kâr/zarar. Para birimi karttaki ₺/$ seçiciyle değişir.
   Rozete dokunmak, varlık tablosundaki K/Z sütununun günlük mü toplam mı olacağını seçer. */
const plCur=()=>S().plCur==="USD"?"USD":"TRY";
const curSeg=()=>`<div class="curseg h" role="group" aria-label="Kâr/zarar para birimi">${[["TRY","₺"],["USD","$"]].map(([k,l])=>`<button data-act="plcur" data-k="${k}" aria-pressed="${plCur()===k}" aria-label="${k==="TRY"?"Türk lirası":"Dolar"}">${l}</button>`).join("")}</div>`;
function plChips(hs,v,c){
  if(!hs.length)return"";
  const usd=plCur()==="USD",day=plMode()==="day",cur=usd?"USD":S().base;
  const vU=rate("USD")?v*rate(S().base)/rate("USD"):0,cU=hs.reduce((a,h)=>a+costIn(h,"USD"),0);
  const dv=divOf(hs),dvU=rate("USD")?dv*rate(S().base)/rate("USD"):0;
  const tot=usd?{pl:vU-cU+dvU,pct:cU?(vU-cU+dvU)/cU*100:0}:{pl:v-c+dv,pct:c?(v-c+dv)/c*100:0};
  const d=daySum(hs),dd=d?(usd?{pl:d.plU,pct:d.pctU}:{pl:d.pl,pct:d.pct}):null;
  // tek rozet: dokununca Günlük ↔ Toplam arasında değişir
  const dl=d&&dayLabel()!=="bugün"?"Son "+dayLabel().replace(/^son /,""):"Günlük",x=day?dd:tot,label=day?dl:"Toplam",other=day?"toplam":"günlük";
  return `<div class="plchips"><button class="delta one ${x?(x.pl>=0?"up":"down"):""}" data-act="plmode" aria-label="${label} kâr/zarar. ${other[0].toLocaleUpperCase("tr")+other.slice(1)} değişimi görmek için dokunun"><small>${label}</small>${x?`<b>${x.pl>=0?"▲":"▼"} ${S().hide?"••••":fmt(Math.abs(x.pl),cur,{dec:0})}</b><span>%${fmtN(Math.abs(x.pct),day?2:1)}</span>`:`<b>—</b><span>yarın</span>`}<i class="swap" aria-hidden="true">${ic(I.akis,13)}</i></button></div>`;
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
  state.tx.forEach(x=>{if(!x.date||x.date>t||(from&&x.date<from))return;if(x.type==="in")b+=toBase(x.amount,x.cur);else if(x.type==="out"||x.type==="save")b-=toBase(x.amount,x.cur)});
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
function monthSum(m){let i=0,o=0,s=0;monthTx(m).forEach(t=>{const v=toBase(t.amount,t.cur);if(t.type==="in")i+=v;else if(t.type==="out")o+=v;else if(t.type==="save")s+=v});return{i,o,s}}
/* aylık tasarruf hedefi: sabit tutar ya da o ayın gelirinin yüzdesi */
function saveTarget(ms){const t=S().saveTarget;if(!t||!(+t.v>0))return 0;return t.mode==="pct"?ms.i*(+t.v)/100:toBase(+t.v,"TRY")}
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
/* Değer geçmişi ve getiri hesapları yatırımları izler: nakit ve mevduat hariç tutulur (para eklemek "değer arttı" gibi görünmesin).
   Yeni kayıtlar nakit tutarını ayrıca saklar; eski kayıtlarda, nakit varlığın alım tarihine bakılarak tahmin edilir.
   Portföy yalnızca nakit/mevduattan oluşuyorsa olduğu gibi gösterilir. */
const CASH_KINDS=["nakit","mevduat"];
const cashOnly=p=>{const hs=p.holdings.filter(h=>+h.qty>0);return hs.length>0&&hs.every(h=>CASH_KINDS.includes(h.kind))};
function cashAt(p,d){let v=0,c=0;const b=rate(S().base);
  p.holdings.forEach(h=>{if(!CASH_KINDS.includes(h.kind))return;const tr=h.trades||[];let q;
    if(tr.length){q=0;tr.forEach(t=>{if((t.date||"")<=d)q+=(t.type==="sell"?-1:t.type==="buy"?1:0)*(+t.qty||0)})}else q=h.buyDate&&h.buyDate>d?0:(+h.qty||0);
    if(q>0){const u=toBase(effPrice(h).p,h.cur)*b;v+=q*u;c+=+h.qty>0?q*hCost(h)*b/+h.qty:q*u}});
  return{v,c}}
function histOf(id){
  const a=state.hist&&state.hist[id]||[],p=state.portfolios.find(x=>x.id===id);
  if(!p||cashOnly(p)||!p.holdings.some(h=>CASH_KINDS.includes(h.kind))&&!a.some(r=>r[5]>0))return a;
  return a.map(r=>{let xv=r[5],xc=r[6];if(xv==null){const e=cashAt(p,r[0]);xv=e.v;xc=e.c}return[r[0],Math.max(0,r[1]-xv),Math.max(0,r[2]-(xc||0)),r[3],r[4]]});
}
const histHasCash=ids=>ids.some(id=>{const p=state.portfolios.find(x=>x.id===id);return p&&!cashOnly(p)&&p.holdings.some(h=>CASH_KINDS.includes(h.kind)&&+h.qty>0)});
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
    const ch_=p.holdings.filter(h=>CASH_KINDS.includes(h.kind)),xv=Math.round(ch_.reduce((s,h)=>s+hVal(h),0)*b),xc=Math.round(ch_.reduce((s,h)=>s+hCost(h),0)*b);
    const a=state.hist[p.id]=state.hist[p.id]||[],last=a[a.length-1],row=[d,v,c,+usd.toFixed(4),Math.round(g),xv,xc];
    if(last&&last[0]===d){if(last[1]!==v||last[2]!==c||last[5]!==xv||last[6]!==xc){a[a.length-1]=row;ch=true}}
    else{a.push(row);if(a.length>1500)a.splice(0,a.length-1500);ch=true}
  });
  return ch;
}
/* fiyat güncellenince ya da gün değişince: kayıt değiştiyse sessizce kaydet */
function snapshotSave(){if(snapshot()){state.updatedAt=Date.now();cacheLocal();scheduleSave();return true}return false}
function histSeries(ids,unit,range){
  const by={};
  ids.forEach(id=>histOf(id).forEach(r=>{const o=by[r[0]]=by[r[0]]||{v:0,c:0,usd:r[3],g:r[4]};o.v+=r[1];o.c+=r[2]}));
  let rows=Object.keys(by).sort().map(d=>({d,...by[d]}));
  if(range&&range!=="all"){const from=addDays(todayISO(),-range);rows=rows.filter(r=>r.d>=from)}
  const conv=r=>unit==="USD"?(r.usd?r.v/r.usd:0):unit==="GAU"?(r.g?r.v/r.g:0):r.v;
  return rows.map(r=>({d:r.d,y:conv(r)}));
}
/* büyük tutar: para birimi simgesi küçük ve soluk */
const money=(v,cur,o)=>fmt(v,cur,o).replace(/([₺$€])/,'<span class="cur">$1</span>');
function histSum(ids){const by={};ids.forEach(id=>histOf(id).forEach(r=>{by[r[0]]=(by[r[0]]||0)+r[1]}));return Object.keys(by).sort().map(d=>({d,y:by[d]}))}
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
    <div class="hist-wrap" data-pts='${JSON.stringify(pts.map(p=>[+(X(p)/W).toFixed(4),+(Y(p)/H).toFixed(4),fmtDate(p.d),S().hide?"••••":fu(p.y)])).replace(/'/g,"&#39;")}'><svg class="hist" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${esc(title)}: ${fmtDate(first.d)} ile ${fmtDate(last.d)} arası değişim ${fmtPct(pct)}">
      <defs><linearGradient id="hg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".22"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>
      ${[0,.5,1].map(f=>`<line x1="${pl}" x2="${W-pr}" y1="${(pt+(H-pt-pb)*f).toFixed(1)}" y2="${(pt+(H-pt-pb)*f).toFixed(1)}" stroke="var(--line)" stroke-width="1" vector-effect="non-scaling-stroke"/>`).join("")}
      <path d="${line} L${X(last).toFixed(1)} ${H-pb} L${X(first).toFixed(1)} ${H-pb} Z" fill="url(#hg)"/>
      <path d="${line}" fill="none" stroke="${col}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
    </svg><div class="hcur" hidden><i class="hl"></i><i class="hd" style="background:${col}"></i><span class="ht"></span></div></div>
    <div class="hist-x"><span>${fmtDate(first.d)}</span><span>en düşük ${S().hide?"••":fu(mn)} · en yüksek ${S().hide?"••":fu(mx)}</span><span>${fmtDate(last.d)}</span></div>`;
  }
  const CH=`<svg class="chev" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`;
  let sum=`<span class="sub">kayıt birikiyor</span>`;
  if(pts.length>=2){const f=pts[0],l=pts[pts.length-1],c=l.y-f.y,pc=f.y?c/f.y*100:0;sum=`<span class="num ${c>=0?"pos-t":"neg-t"}">${S().hide?"••••":(c>=0?"+":"")+fu(c)} <small>${fmtPct(pc)}</small></span>`}
  if(!view.histOpen)return `<section class="card fold"><button class="foldh" data-act="histtoggle" aria-expanded="false"><h2>${esc(title)}</h2>${sum}${CH}</button></section>`;
  return `<section class="card fold open"><div class="sec" style="margin-bottom:10px;flex-wrap:wrap"><button class="foldh" data-act="histtoggle" aria-expanded="true" style="width:auto"><h2>${esc(title)}</h2>${CH}</button>${segU}</div>${body}${all.length>=2?`<div style="margin-top:12px">${segR}</div>`:""}${histHasCash(ids)?`<div class="sub" style="margin-top:8px">Nakit ve mevduat bu grafiğe dahil değildir; yalnızca yatırımların değeri izlenir.</div>`:""}</section>`;
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
    if(S().autoPrices!==false&&fresh.some(i=>!(market&&market.quotes&&market.quotes[i.k+":"+i.s])))toast("Yeni ürünün fiyatı birkaç dakika içinde gelir");
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
  const extra=h.cur==="TRY"?[]:(h.trades||[]).filter(x=>(x.type==="sell"||x.type==="div")&&!x.fx&&x.date&&x.date<t&&!fxhist[x.date]).map(x=>x.date);
  return [...pendingFxDates0(h,t,b),...extra];
}
function pendingFxDates0(h,t,b){
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
/* Her alım ayrı bir parti olarak izlenir; satışlar en eski partiden düşülür (ilk giren ilk çıkar, vergide de böyledir).
   Her partinin TL maliyeti kendi alış ayının endeksiyle güncellenir:
   - reel maliyet: tüm partiler endekslenir (ekonomik karşılaştırma için);
   - vergi için maliyet: yalnızca endeks artışı %10'u bulan partiler endekslenir (GVK mük. 81, değer artış kazancı). */
function ufeLots(h){
  const b=buysOf(h);if(!b.length||!b.every(t=>t.date))return null;
  const tr=(h.trades||[]).filter(t=>t.type==="buy"||t.type==="sell").slice().sort((a,c)=>(a.date||"").localeCompare(c.date||""));
  const lots=[];
  for(const t of tr){
    if(t.type==="buy"){const q=+t.qty||0;if(!(q>0))continue;const fx=h.cur==="TRY"?1:((t.fx&&+t.fx[h.cur])||fxOf(h,h.cur));const k=ufeRatio(t.date);if(k==null)return null;
      lots.push({date:t.date,q,unit:((+t.price||0)*q+(+t.fee||0))*fx/q,k,fxPending:h.cur!=="TRY"&&!(t.fx&&+t.fx[h.cur])})}
    else{let r=+t.qty||0;while(r>1e-9&&lots.length){const l=lots[0],x=Math.min(l.q,r);l.q-=x;r-=x;if(l.q<=1e-9)lots.shift()}}
  }
  return lots.filter(l=>l.q>1e-9);
}
function ufeInfo(h){
  let lots=ufeLots(h),from=null;
  if(lots===null&&h.buyDate){const k=ufeRatio(h.buyDate);if(k==null)return null;lots=[{date:h.buyDate,q:+h.qty||0,unit:+h.qty?costIn(h,"TRY")/+h.qty:0,k}]}
  if(!lots||!lots.length)return null;
  let T=0,X=0,XT=0;lots.forEach(l=>{const c=l.q*l.unit;l.cost=c;l.real=c*l.k;l.tax=l.k>=1.1?c*l.k:c;T+=c;X+=l.real;XT+=l.tax;if(!from||l.date<from)from=l.date});
  if(!(T>0))return null;
  return{ratio:X/T,costTL:X,cost:toBase(X,"TRY"),taxCost:toBase(XT,"TRY"),baseTL:T,from:prevMonth(from),to:ufeEnd().ym,multi:lots.length>1,lots};
}
function ufeSum(hs){let c=0,v=0,n=0;hs.forEach(h=>{const u=ufeInfo(h);if(u){c+=u.cost;v+=hVal(h)}else n++});return{c,v,n,pl:v-c,plp:c?(v-c)/c*100:0}}
/* ---------- işlem defteri: miktar, ortalama maliyet ve gerçekleşen K/Z işlemlerden hesaplanır ---------- */
const byDate=(a,c)=>(a.date||"").localeCompare(c.date||"");
function tradeQty(h){let q=0;(h.trades||[]).slice().sort(byDate).forEach(t=>{q+=t.type==="buy"?(+t.qty||0):t.type==="sell"?-(+t.qty||0):0});return q}
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
  const tr=(h.trades||[]).slice().sort(byDate);let q=0,c=0,real=+h.realizedLegacy||0,divs=0;
  for(const t of tr){
    const tq=+t.qty||0,amt=tq*(+t.price||0);
    if(t.type==="div"){divs+=+t.amount||0;continue}
    if(t.type==="buy"){c=(q*c+amt+(+t.fee||0))/(q+tq);q+=tq}
    else{if(tq>q+1e-9)return fmtDate(t.date)+" tarihli satış, o tarihte elinizdeki miktardan fazla.";const gross=amt-(+t.fee||0)-tq*c;const tax=t.taxAmt!=null&&t.taxAmt!==""?+t.taxAmt||0:Math.max(0,gross)*(+t.taxRate||0)/100;t.tax=tax;const pl=gross-tax;t.pl=pl;real+=pl;q-=tq}
  }
  h.qty=Math.max(0,q);if(tr.some(t=>t.type==="buy"))h.cost=c;h.realized=real;if(divs)h.divs=divs;else delete h.divs;
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
   Fiyatlar depodaki data/market.json dosyasından okunur; dosyayı .github/workflows/prices.yml 10 dakikada bir günceller ("fiyat" dalında). */
function marketUrls(){
  const u=[];if(CFG.marketUrl)u.push(CFG.marketUrl);
  const m=location.hostname.match(/^([^.]+)\.github\.io$/),repo=location.pathname.split("/").filter(Boolean)[0];
  if(m&&repo&&!/\.html?$/.test(repo))u.push("https://raw.githubusercontent.com/"+m[1]+"/"+repo+"/"+(CFG.dataBranch||CFG.branch||"main")+"/data/market.json");
  u.push("data/market.json");return u;
}
async function getJSON(url){const r=await fetch(url+(url.includes("?")?"&":"?")+"t="+Math.floor(Date.now()/6e4),{cache:"no-store"});if(!r.ok)throw new Error(String(r.status));return r.json()}
async function loadMarket(announce){
  let got=null;
  for(const u of marketUrls()){try{const d=await getJSON(u);if(d&&d.updatedAt){got=d;break}}catch(e){}}
  if(got&&market&&market.updatedAt&&got.updatedAt<market.updatedAt)got=market;   // yedek kopya elimizdekinden eskiyse kullanma
  if(!got){if(announce)toast("Fiyat dosyasına ulaşılamadı; internet bağlantınızı kontrol edin");return}
  const changed=!market||market.updatedAt!==got.updatedAt;
  market=got;try{localStorage.setItem(MK,JSON.stringify(got))}catch(e){}
  if(changed&&ready){snapshotSave();render();fillFx()}
  if(changed||!closeD)loadClose();
  if(announce)toast(changed?"Fiyatlar güncellendi":"Fiyatlar güncel · "+marketWhen());
}
let bench=null;
async function loadClose(){for(const u of marketUrls().map(x=>x.replace("market.json","close.json"))){try{const d=await getJSON(u);if(d&&d.d){const ch=JSON.stringify(d.prev)!==JSON.stringify(closeD&&closeD.prev)||!closeD||closeD.d!==d.d;closeD=d;if(ch&&ready)render();return}}catch(e){}}}
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
  if(err)setSync("local","Kaydedilemedi · cihazda duruyor");else{setSync("cloud","Eşitlendi");backupNow()}
  if(pendingSave){pendingSave=false;flush()}
}
/* Otomatik yedek: her günün son hâli ayrı bir kayıt olarak saklanır (35 gün). Boş veri yedeklenmez.
   Aynı gün içinde en çok yarım saatte bir yazılır; böylece hatalı bir kayıt dünkü yedeği ezemez. */
const BK="emanet-bak";
async function backupNow(){
  if(!cloudOn()||!state||!(state.portfolios.length||state.tx.length))return;
  const day=todayISO(),now=Date.now();let last={};try{last=JSON.parse(localStorage.getItem(BK)||"{}")||{}}catch(e){}
  if(last.u===sbUser.id&&last.d===day&&now-last.t<30*60e3)return;
  try{
    const meta={pf:state.portfolios.length,h:state.portfolios.reduce((a,p)=>a+p.holdings.filter(h=>+h.qty>0).length,0),tx:state.tx.length,v:Math.round(state.portfolios.reduce((a,p)=>a+pfTotals(p).v,0)*rate(S().base))};
    const {error}=await sb.from("emanet_backup").upsert({user_id:sbUser.id,day,data:state,meta,updated_at:new Date().toISOString()},{onConflict:"user_id,day"});
    if(error)return;
    localStorage.setItem(BK,JSON.stringify({u:sbUser.id,d:day,t:now}));
    if(last.d!==day)sb.from("emanet_backup").delete().eq("user_id",sbUser.id).lt("day",addDays(day,-35)).then(()=>{},()=>{});
  }catch(e){}
}
async function backupSheet(){
  openSheet(`<h3>Otomatik yedekler</h3><div class="sub" id="bkBody">Yedekler getiriliyor…</div>`);
  let rows=null,msg="";
  try{const r=await sb.from("emanet_backup").select("day,meta,updated_at").eq("user_id",sbUser.id).order("day",{ascending:false}).limit(40);if(r.error)msg=/emanet_backup|relation|schema cache|not find/i.test(r.error.message||"")?"Yedek tablosu henüz kurulmamış; Supabase'de kurulum SQL'inin son hâlini bir kez çalıştırmak gerekiyor.":"Yedekler okunamadı: "+(r.error.message||"");else rows=r.data||[]}catch(e){msg="Yedekler okunamadı; bağlantıyı kontrol edin."}
  const body=document.getElementById("bkBody");if(!body)return;
  if(!rows){body.textContent=msg;return}
  if(!rows.length){body.textContent="Henüz yedek yok. İlk yedek, bir sonraki kayıtta kendiliğinden alınır.";return}
  const t=todayISO();
  body.className="";body.innerHTML=`<div class="note" style="margin-bottom:8px">Her günün son hâli saklanır (35 gün). Geri yüklemek, şu anki verinizin yerine o günkü hâli koyar; hemen ardından “Geri al” ile vazgeçebilirsiniz.</div><div class="list">${rows.map(r=>{const m=r.meta||{},n=daysBetween(r.day,t);
    return `<div class="row"><div class="main"><div class="t">${fmtDate(r.day)}${n===0?" · bugün":n===1?" · dün":" · "+n+" gün önce"}</div><div class="s">${m.pf||0} portföy · ${m.h||0} varlık · ${m.tx||0} işlem${m.v?" · "+fmt(m.v/rate(S().base),null,{dec:0}):""}</div></div><button class="btn sm" data-bk="${r.day}">Geri yükle</button></div>`}).join("")}</div><div class="err" id="bkErr"></div>`;
  body.querySelectorAll("[data-bk]").forEach(b=>b.onclick=async()=>{
    if(!b.dataset.c){body.querySelectorAll("[data-bk]").forEach(x=>{delete x.dataset.c;x.textContent="Geri yükle";x.classList.remove("primary")});b.dataset.c="1";b.textContent="Evet, yükle";b.classList.add("primary");return}
    b.disabled=true;b.textContent="Yükleniyor…";
    try{const r=await sb.from("emanet_backup").select("data").eq("user_id",sbUser.id).eq("day",b.dataset.bk).single();if(r.error||!r.data||!r.data.data)throw new Error("yok");
      const snap=JSON.stringify(state);state=normalize(r.data.data);closeSheet();commit();toast(fmtDate(b.dataset.bk)+" yedeği yüklendi",snap)}
    catch(e){b.disabled=false;b.textContent="Geri yükle";delete b.dataset.c;const er=document.getElementById("bkErr");if(er)er.textContent="Yedek yüklenemedi; yeniden deneyin."}
  });
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
/* ilk yüklemede (cihazda önbellek yokken) rakamlar yerine yer tutucular */
function skeleton(){const m=$("#main");if(!m)return;const bar=w=>`<span class="sk" style="width:${w}"></span>`;
  m.innerHTML=`<div class="skel" aria-busy="true" aria-label="Verileriniz getiriliyor"><section class="hero net">${bar("40%")}${bar("62%").replace('class="sk"','class="sk big"')}${bar("50%")}</section>${[0,1,2].map(()=>`<section class="card">${bar("35%")}${[0,1,2].map(()=>`<div class="sk-row">${bar("44%")}${bar("22%")}</div>`).join("")}</section>`).join("")}</div>`}
async function onLogin(user){
  sbUser=user;let owner=null;try{owner=localStorage.getItem(OWN)}catch(e){}
  /* başka bir hesabın önbelleği bu hesaba yüklenmesin */
  if(owner&&owner!==user.id){state=null;try{localStorage.removeItem(LS)}catch(e){}}
  try{localStorage.setItem(OWN,user.id);localStorage.removeItem(GUEST)}catch(e){}
  hideAuth();mode="cloud";setSync("cloud","Eşitleniyor…");
  if(!state)skeleton();
  await pull(true);
  ready=true;applyPrefs();if(state&&state.updatedAt)snapshotSave();render();setTimeout(()=>{fillFx();syncWatch()},0);
}
async function signOut(){
  try{clearTimeout(saveTimer);await flush()}catch(e){}
  try{await sb.auth.signOut()}catch(e){}
  sbUser=null;state=null;try{localStorage.removeItem(LS);localStorage.removeItem(OWN)}catch(e){}
  view.tab="ozet";showAuth();
}
/* bildirimden gelen bağlantı (#zekat gibi) ilgili sekmeyi açar */
function hashTab(){const h=location.hash.slice(1);if(TABS.some(t=>t[0]===h)){view.tab=h;try{history.replaceState(null,"",location.pathname+location.search)}catch(e){}return true}return false}
window.addEventListener("hashchange",()=>{if(hashTab()&&ready)render()});
async function boot(){
  hashTab();
  loadMarket();loadUfe();loadBench();
  setInterval(()=>{if(!document.hidden)loadMarket()},3*6e4);
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
  requestAnimationFrame(()=>{try{const bg=getComputedStyle(document.body).backgroundColor;document.querySelectorAll('meta[name="theme-color"]').forEach(m=>m.setAttribute("content",bg))}catch(e){}});
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
  camera:sv('<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7H8l1.5-2.5h5L16 7h2.5A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.5"/>'),
  building:sv('<path d="M5 20.500v-15A1.5 1.5 0 0 1 6.5 4h7A1.5 1.5 0 0 1 15 5.500v15M15 10h3a1.5 1.5 0 0 1 1.5 1.500v9M3.5 20.500h17M8.5 8h3M8.5 11.500h3M8.5 15h3"/>')
};
const ic=(svg,n=16)=>svg.replace('aria-hidden="true"',`width="${n}" height="${n}" aria-hidden="true"`);
const KIND_ICON={hisse:I.candle,abd:I.globe,fon:I.layers,ppf:I.note,altin:I.ingot,gumus:I.ingot,doviz:I.coin,kripto:I.hex,nakit:I.wallet,mevduat:I.bank,bes:I.umbrella,emlak:I.building,diger:I.dots};
/* kategori adından ikon: kullanıcı eski ya da kendi kategori adını da taşıyor olabilir, bu yüzden anahtar kelimeyle eşleşir */
const CAT_ICONS=[[/birikim/i,"target"],[/acil durum/i,"umbrella"],[/^altın$/i,"ingot"],[/fon ve yatırım/i,"layers"],[/^döviz$/i,"coin"],[/^bes$/i,"umbrella"],[/maaş/i,"brief"],[/ek ödeme|ikramiye/i,"spark"],[/kira gelir/i,"key"],[/yatırım|temettü/i,"trend"],[/yan gelir|satış/i,"wallet"],[/kira|aidat/i,"home"],[/fatura/i,"bolt"],[/market|mutfak/i,"cart"],[/kart/i,"card"],[/kredi|taksit/i,"bank"],[/ulaşım|araç/i,"car"],[/eğitim/i,"book"],[/sağlık/i,"health"],[/çocuk/i,"child"],[/giyim/i,"shirt"],[/ev\b|eşya/i,"sofa"],[/yemek|eğlence/i,"food"],[/abone/i,"play"],[/hediye/i,"gift"],[/yardım|sadaka|bağış/i,"heart"]];
const catIconKey=c=>{const u=state&&state.settings&&state.settings.catIcons&&state.settings.catIcons[c];if(u&&I[u])return u;const m=CAT_ICONS.find(([re])=>re.test(c||""));return m?m[1]:"dots"};
const catIcon=c=>I[catIconKey(c)];
/* her kategoriye simgesine göre sabit bir renk: listeler tek renk görünmesin */
const ICON_COLOR={cart:"--c3",home:"--c9",bolt:"--c1",car:"--c2",book:"--c5",health:"--c4",child:"--c10",shirt:"--c4",sofa:"--c6",food:"--c9",play:"--c5",gift:"--c4",heart:"--c4",bank:"--c7",brief:"--c3",spark:"--c1",trend:"--c3",key:"--c8",card:"--c2",wallet:"--c3",target:"--c5",umbrella:"--c8",ingot:"--c1",coin:"--c9",layers:"--c5",globe:"--c8",building:"--c6",repeat:"--c10",bell:"--c1",dots:"--c7"};
const catColor=c=>ICON_COLOR[catIconKey(c)]||"--c7";
const kindBadge=k=>`<span class="kbadge" style="color:var(${KIND_COLOR[k]||"--c7"})">${KIND_ICON[k]||I.dots}</span>`;
const ICON_CHOICES=["cart","home","bolt","car","book","health","child","shirt","sofa","food","play","gift","heart","bank","brief","spark","trend","key","card","wallet","target","umbrella","ingot","coin","layers","globe","building","repeat","bell","dots"];
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
/* Boş durum: simge, başlık, kısa açıklama ve (varsa) tek bir eylem */
const emptyIc=svg=>`<span class="empty-ic" aria-hidden="true">${ic(svg,26)}</span>`;
const emptyBtn=(act,label)=>`<button class="btn primary sm" data-act="${act}">${ic(I.plus,16)}${label}</button>`;
function li(o){
  return `<div class="row li" title="${String(o.title||"").replace(/<[^>]+>/g,"").replace(/"/g,"&quot;")}" ${o.act?`role="button" tabindex="0" data-act="${o.act}" data-id="${o.id||""}"`:""}>${o.mark||""}<div class="main"><div class="t">${o.title}</div>${o.sub?`<div class="s">${o.sub}</div>`:""}${o.extra||""}</div><div class="end">${o.amount!=null?`<div class="num am ${o.cls||""}">${o.amount}</div>`:""}${o.trail||""}</div></div>`;
}
const subTabs=()=>`<div class="seg full subtabs" role="group" aria-label="Bölüm">${[["akis","Gelir-Gider"],["borc","Borç ve alacak"]].map(([k,l])=>`<button data-tab="${k}" aria-pressed="${view.tab===k}">${l}</button>`).join("")}</div>`;
function render(){
  /* telefonda 5 öğe: Özet, Portföy, +, Gelir-Gider, Zekât. Borç, Gelir-Gider ekranının içindeki sekmedir (geniş ekranda kenar çubuğunda da durur). */
  const cur=k=>view.tab===k||(k==="akis"&&(view.tab==="rapor"||(view.tab==="borc"&&!wide())));
  const tabBtn=([k,l])=>`<button data-tab="${k}" ${k==="borc"?'class="only-wide"':""} ${cur(k)?'aria-current="page"':""}>${I[k]}<span>${l}</span></button>`;
  $("#nav").innerHTML=TABS.slice(0,2).map(tabBtn).join("")+`<button class="nav-add" id="navAdd" aria-label="Ekle">${I.plus}<span>Ekle</span></button>`+TABS.slice(2).map(tabBtn).join("");
  $("#screenTitle").textContent=view.tab==="ayarlar"?"Ayarlar":view.tab==="rapor"?"Rapor":(TABS.find(t=>t[0]===view.tab)||["","Emanet"])[1];
  const m=$("#main"), fab=$("#fab");
  if(!ready&&!state){m.innerHTML='<div class="skel" aria-label="Verileriniz yükleniyor" role="status"><i class="sk-hero"></i><i></i><i></i></div>';fab.hidden=true;return}
  if(!state||(!state.updatedAt&&!state.portfolios.length&&!state.tx.length&&!state.debts.length)){
    if(!state)state=emptyState();
    if(view.tab!=="ayarlar"){m.innerHTML=onboarding();fab.hidden=true;return}
  }
  const R={ozet:rOzet,portfoy:rPortfoy,akis:rAkis,borc:rBorc,zekat:rZekat,ayarlar:rAyarlar,rapor:rRapor}[view.tab]||rOzet;
  const prevN=motionBefore(m);
  m.innerHTML=(view.tab==="akis"||view.tab==="borc"?subTabs():"")+R();
  const F={portfoy:["Varlık ekle",()=>holdingSheet()],akis:["İşlem ekle",()=>txSheet()],borc:["Kayıt ekle",()=>debtSheet()],zekat:["Ödeme ekle",()=>zakatSheet()],ozet:["İşlem ekle",()=>txSheet()]}[view.tab];
  if(F){fab.hidden=false;fab.innerHTML=I.plus+"<span>"+F[0]+"</span>";fab.onclick=F[1]}else fab.hidden=true;
  const na=$("#navAdd");if(na){na.disabled=!F;na.setAttribute("aria-label",F?F[0]:"Ekle");na.title=F?F[0]:"";na.lastElementChild.textContent=F?F[0]:"Ekle";na.onclick=F?F[1]:null}
  twoCol(m);
  motionAfter(m,prevN);
  view.kJust=null;
}
/* Ölçülü hareket: değişen ana tutar kısa bir saymayla güncellenir, yeni eklenen kayıt bir an vurgulanır,
   açılan kategori ve kartın içeriği yumuşakça belirir. Hareket azaltma ayarı açıksa hiçbiri olmaz. */
const reduceMotion=()=>window.matchMedia&&window.matchMedia("(prefers-reduced-motion:reduce)").matches;
let knownIds=null;
const allIds=()=>{const o=[];state.tx.forEach(t=>o.push(t.id));state.portfolios.forEach(p=>p.holdings.forEach(h=>{o.push(h.id);(h.trades||[]).forEach(t=>o.push(t.id))}));
  ["debts","recurring","goals","alerts","zakatPaid","cards"].forEach(k=>(state[k]||[]).forEach(x=>o.push(x.id)));return new Set(o)};
function motionBefore(m){const n={};m.querySelectorAll("[data-cnt]").forEach(e=>n[e.dataset.cnt]=+e.dataset.v);return n}
function motionAfter(m,prevN){
  const ids=allIds(),fresh=knownIds?[...ids].filter(x=>!knownIds.has(x)):[];knownIds=ids;
  if(reduceMotion())return;
  if(fresh.length&&fresh.length<=3)fresh.forEach(id=>m.querySelectorAll(`[data-id="${id}"]`).forEach(el=>{el.classList.remove("flash");void el.offsetWidth;el.classList.add("flash")}));
  if(S().hide)return;
  m.querySelectorAll("[data-cnt]").forEach(el=>{const a=prevN[el.dataset.cnt],b=+el.dataset.v;if(a==null||!isFinite(a)||Math.abs(b-a)<1)return;
    el.innerHTML=money(a);const t0=performance.now(),D=550,step=now=>{const k=Math.min(1,(now-t0)/D),e=1-Math.pow(1-k,3);if(!document.body.contains(el))return;el.innerHTML=money(a+(b-a)*e);if(k<1)requestAnimationFrame(step)};requestAnimationFrame(step)});
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
/* Özet ve Portföy aynı portföy seçimini paylaşır; seçim bu cihazda hatırlanır. Portföy'deki "Tümü" yalnızca o sayfaya özgüdür. */
function setPf(id){view.pf=id;view.ozPf=id;try{localStorage.setItem("emanet-ozpf",id)}catch(e){}}
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
  ${state.portfolios.length>1?`<div class="chips" role="group" aria-label="Görüntülenen portföy">${state.portfolios.map(p=>`<button class="chip" data-act="ozpf" data-id="${p.id}" aria-pressed="${!!mp&&p.id===mp.id}">${esc(p.name)}${owners().length>1?` <small>${esc(ownerOf(p))}</small>`:""}</button>`).join("")}</div>`:""}
  <section class="hero net">
    <div class="hero-top"><div style="min-width:0">
      <span class="label">${mp?esc(mp.name)+(state.portfolios.length>1&&isMainPf(mp)?" · ana portföy":""):"Net varlık"}</span>
    </div><div class="hero-acts">${mp&&hs.length?curSeg():""}${eyeBtn()}</div></div>
    <div class="bigrow"><div class="big amt" data-cnt="h:${mp?mp.id:"all"}" data-v="${t.v}">${money(t.v)}</div></div>
    ${mp?plChips(hs,t.v,t.c):""}
    <div class="subrow">${eqvChips(t.v)}</div>
  </section>
  ${onMain?attnCard():""}
  ${mp?`<section class="card">
    <div class="sec" style="margin-bottom:8px"><h2>Varlıklar</h2><button class="btn ghost sm" data-act="open-pf" data-id="${mp.id}">Ayrıntı${ic(I.right,14)}</button></div>
    ${kinds.length?kindList(hs,t.v,mp.id)
    :`<div class="empty">${emptyIc(I.portfoy)}<b>Bu portföyde varlık yok</b>Hisse, fon, altın, döviz ya da nakit ekleyin.${emptyBtn("add-h","Varlık ekle")}</div>`}
  </section>${others>0?familyCard(mp):""}`
  :`<section class="card"><div class="empty">${emptyIc(I.portfoy)}<b>Henüz portföy yok</b>Yatırımlarınızı gruplamak için bir portföy oluşturun.</div><div style="text-align:center"><button class="btn primary" data-act="new-pf">Portföy oluştur</button></div></section>`}
  ${onMain?"":`<div class="note">Gelir-gider, birikim hedefleri ve vadeler ana portföye (${esc((mainPf()||{}).name||"")}) bağlıdır; bu portföyde gösterilmez. Bu portföyün zekâtını Zekât sekmesinden ayrıca hesaplayabilirsiniz.</div>`}
  ${!onMain?"":`<section class="card side">
    <div class="sec" style="margin-bottom:10px"><h2>${MONTHS[+cm.slice(5)-1]} nakit akışı</h2><button class="btn ghost sm" data-tab="akis">Tümü${ic(I.right,14)}</button></div>
    <div class="flow">
      <dl class="flow-n">
        <div><dt><i class="dot" style="background:var(--pos)"></i>Gelir</dt><dd class="num">${fmt(ms.i)}</dd></div>
        <div><dt><i class="dot" style="background:var(--neg);opacity:.6"></i>Gider</dt><dd class="num">${fmt(ms.o)}</dd></div>
        ${ms.s?`<div><dt><i class="dot" style="background:var(--c5)"></i>Tasarruf</dt><dd class="num">${fmt(ms.s)}</dd></div>`:""}
        <div class="tot"><dt>Kalan</dt><dd class="num ${ms.i-ms.o-ms.s>=0?"pos-t":"neg-t"}">${fmt(ms.i-ms.o-ms.s)}</dd></div>
      </dl>
      ${flowChart(true)}
    </div>
  </section>`}
  ${onMain?goalsCard().replace('<section class="card"','<section class="card side"'):""}
  ${onMain&&upcoming.length?`<section class="card side"><div class="sec" style="margin-bottom:6px"><h2>Yaklaşan vadeler</h2><button class="btn ghost sm" data-tab="borc">Tümü${ic(I.right,14)}</button></div><div class="list">${upcoming.map(debtRow).join("")}</div></section>`:""}
  `;
}

/* Aile özeti: tüm portföylerin toplamı, her birinin değeri, payı ve günlük değişimi. Satıra dokunmak Özet'i o portföye geçirir. */
const PF_COLORS=["--c2","--c4","--c3","--c9","--c5","--c8","--c1","--c10"];
function familyCard(cur){
  const rows=state.portfolios.map(p=>{const hs=p.holdings.filter(h=>+h.qty>0);return{p,hs,v:hs.reduce((a,h)=>a+hVal(h),0)}}).sort((a,b)=>b.v-a.v);
  const all=rows.flatMap(r=>r.hs),T=rows.reduce((a,r)=>a+r.v,0),xt=cellData(all,T),dt=xt.day;
  const ows=owners().length>1;
  return `<section class="card fam"><div class="sec" style="margin-bottom:6px"><h2>Aile özeti</h2><button class="btn ghost sm" data-act="pf-all">Tümü${ic(I.right,14)}</button></div>
    <div class="fam-tot"><div><span class="label">${state.portfolios.length} portföy toplamı</span><b class="num">${fmt(xt.v,xt.cur,{dec:0})}</b></div>${dt?`<span class="delta one ${dt.pl>=0?"up":"down"}"><small>Günlük</small><b>${dt.pl>=0?"▲":"▼"} ${S().hide?"••••":fmt(Math.abs(dt.pl),xt.cur,{dec:0})}</b><span>%${fmtN(Math.abs(dt.pct),2)}</span></span>`:""}</div>
    <div class="fam-list">${rows.map(({p,hs,v})=>{const x=cellData(hs,T),d=x.day,col=p.color||PF_COLORS[state.portfolios.indexOf(p)%PF_COLORS.length],on=cur&&cur.id===p.id;
      return `<button class="fam-r${on?" on":""}" data-act="ozpf" data-id="${p.id}" aria-pressed="${on}"><span class="fam-av" style="color:var(${col})">${esc((p.name||"?").trim().slice(0,1).toLocaleUpperCase("tr"))}</span>
        <span class="fam-m"><span class="fam-n"><b>${esc(p.name)}</b>${ows?`<small>${esc(ownerOf(p))}</small>`:""}<small class="num">%${fmtN(x.share,0)}</small></span><span class="kbar"><i style="width:${Math.max(2,x.share).toFixed(1)}%;background:var(${col})"></i></span></span>
        <span class="fam-v"><b class="num">${fmt(x.v,x.cur,{dec:0})}</b>${d?`<small class="num ${d.pct>=0?"pos-t":"neg-t"}">${fmtPct(d.pct)}</small>`:`<small class="sub">${hs.length} varlık</small>`}</span></button>`}).join("")}</div>
  </section>`;
}
/* Yatırım kategorileri: her türün değeri, payı, günlük ve toplam değişimi. Para birimi karttaki ₺/$ seçiciye uyar. */
function kindCard(hs,total){
  const usd=plCur()==="USD",cur=usd?"USD":S().base,ru=rate("USD"),rb=rate(S().base);
  const by={};hs.forEach(h=>(by[h.kind]=by[h.kind]||[]).push(h));
  const rows=Object.entries(by).map(([k,list])=>{
    const v=list.reduce((a,h)=>a+hVal(h),0),c=list.reduce((a,h)=>a+hCost(h),0),vU=ru?v*rb/ru:0,cU=list.reduce((a,h)=>a+costIn(h,"USD"),0),d=daySum(list);
    return{k,n:list.length,v,tot:usd?{pl:vU-cU,pct:cU?(vU-cU)/cU*100:0}:{pl:v-c,pct:c?(v-c)/c*100:0},day:d?(usd?{pl:d.plU,pct:d.pctU}:{pl:d.pl,pct:d.pct}):null,vShow:usd?vU:v};
  }).sort((a,b)=>b.v-a.v);
  const cell=(x,dec)=>x?`<span class="kc ${x.pl>=0?"pos-t":"neg-t"}"><b class="num">${fmtPct(x.pct)}</b><small class="num">${S().hide?"••••":(x.pl>=0?"+":"−")+fmt(Math.abs(x.pl),cur,{dec:0})}</small></span>`:`<span class="kc"><b class="sub">—</b><small>yarın</small></span>`;
  const dl=dayRef()&&dayLabel()!=="bugün"?"Son "+dayLabel().replace(/^son /,"").replace(/de$|da$/,""):"Günlük";
  return `<section class="card"><div class="sec" style="margin-bottom:10px"><h2>Kategoriler</h2><span class="sub">${usd?"dolar bazında":"günlük ve toplam değişim"}</span></div>
    <div class="stack" aria-hidden="true">${rows.map(r=>`<i style="flex:${r.v};background:var(${KIND_COLOR[r.k]||"--c7"})"></i>`).join("")}</div>
    <div class="ktbl" role="table" aria-label="Kategorilere göre değer ve değişim">
      <div class="kr kh" role="row"><span role="columnheader">Kategori</span><span role="columnheader">${dl}</span><span role="columnheader">Toplam</span><span role="columnheader">Değer</span></div>
      ${rows.map(r=>`<div class="kr" role="row"><span class="kn" role="cell"><i class="dot" style="background:var(${KIND_COLOR[r.k]||"--c7"})"></i><span title="${esc(KINDS[r.k]||r.k)} · ${r.n} varlık"><b>${esc((KINDS[r.k]||r.k).replace(/\s*\(.*\)/,""))}</b><small>%${fmtN(total?r.v/total*100:0,0)} · ${r.n} varlık</small></span></span>${cell(r.day)}${cell(r.tot)}<span class="kv2 num" role="cell">${fmt(r.vShow,cur,{dec:0})}</span></div>`).join("")}
    </div></section>`;
}

/* ---------- rapor: aylık ve yıllık özet, yazdırılabilir ---------- */
function monthAgg(ym){const tx=monthTx(ym);let i=0,o=0,s=0;const co={},ci={};tx.forEach(t=>{const v=toBase(t.amount,t.cur);if(t.type==="in"){i+=v;ci[t.cat]=(ci[t.cat]||0)+v}else if(t.type==="out"){o+=v;co[t.cat]=(co[t.cat]||0)+v}else if(t.type==="save")s+=v});return{ym,i,o,s,net:i-o,rate:i?(i-o)/i*100:null,co,ci,n:tx.filter(t=>t.type!=="card").length}}
const catBars=(obj,total,color,extra)=>{const arr=Object.entries(obj).sort((a,b)=>b[1]-a[1]),mx=Math.max(1,...arr.map(a=>a[1]));
  return arr.length?`<div class="rp-cats">${arr.slice(0,10).map(([c,v])=>`<div class="rp-cat">${mkIcon(catIcon(c),catColor(c))}<div class="main"><div class="t"><span>${esc(c)}</span><b class="num">${fmt(v,null,{dec:0})}</b></div><div class="share"><i style="width:${(v/mx*100).toFixed(1)}%;background:var(${catColor(c)})"></i></div><div class="s">%${fmtN(total?v/total*100:0,0)}${extra?extra(c,v):""}</div></div></div>`).join("")}${arr.length>10?`<div class="sub">ve ${arr.length-10} kategori daha · ${fmt(arr.slice(10).reduce((a,x)=>a+x[1],0),null,{dec:0})}</div>`:""}</div>`:`<div class="sub">Kayıt yok.</div>`};
/* ---------- vergi raporu: yurt dışı hisse satışları ve temettüler ----------
   Satışlar en eski alımdan düşülür (FIFO). Her parçanın TL maliyeti kendi alış günü kuruyla, satış tutarı satış günü kuruyla bulunur.
   Endeksleme: alış ayından önceki ayın Yİ-ÜFE'si ile satış ayından önceki ayın Yİ-ÜFE'si arasındaki artış %10'u bulursa maliyet bu oranla artırılır.
   Bu bir hesap yardımıdır; beyan için mali müşavir kontrolü gerekir. */
function taxCalc(h,Y){
  const fxD=(t)=>{const f=t.fx||fxLookup(t.date);const v=f&&+f[h.cur];return v>0?{v,ok:true}:{v:rate(h.cur),ok:false}};
  const tr=(h.trades||[]).filter(t=>t.date&&(t.type==="buy"||t.type==="sell"||t.type==="div")).slice().sort((a,c)=>a.date.localeCompare(c.date)||(a.type==="buy"?-1:1));
  const lots=[],sells=[],divs=[];let pend=false;
  for(const t of tr){
    if(t.type==="buy"){const q=+t.qty||0;if(!(q>0))continue;const f=fxD(t);if(!f.ok)pend=true;lots.push({date:t.date,q,unit:((+t.price||0)*q+(+t.fee||0))*f.v/q})}
    else if(t.type==="sell"){
      let r=+t.qty||0;const parts=[];while(r>1e-9&&lots.length){const l=lots[0],x=Math.min(l.q,r);parts.push({date:l.date,q:x,cost:x*l.unit});l.q-=x;r-=x;if(l.q<=1e-9)lots.shift()}
      if(t.date.slice(0,4)!==String(Y))continue;
      const f=fxD(t);if(!f.ok)pend=true;
      const sale=((+t.qty||0)*(+t.price||0)-(+t.fee||0))*f.v;
      const endYm=prevMonth(t.date),ev=ufeAt(endYm)||(ufe&&ufe.latest&&ufeAt(ufe.latest))||0,prov=!ufeAt(endYm);
      let cost=0,idx=0,nIdx=0;parts.forEach(pt=>{cost+=pt.cost;const bv=ufeAt(prevMonth(pt.date)),k=bv&&ev?ev/bv:1;pt.k=k;if(k>=1.1){idx+=pt.cost*k;nIdx++}else idx+=pt.cost});
      sells.push({t,date:t.date,qty:+t.qty||0,sale,cost,idx,gain:sale-idx,parts,fx:f.v,fxOk:f.ok,prov,nIdx,unmatched:r>1e-9});
    }else if(t.date.slice(0,4)===String(Y)){const f=fxD(t);if(!f.ok)pend=true;const net=+t.amount||0,tax=+t.tax||0;divs.push({date:t.date,net,tax,gross:net+tax,fx:f.v,tl:(net+tax)*f.v,taxTL:tax*f.v})}
  }
  return{sells,divs,pend};
}
function taxReport(Y){
  const pfs=state.portfolios,sel=pfs.find(p=>p.id===view.taxPf)||mainPf();
  if(!sel)return `<section class="card"><div class="empty"><b>Portföy yok</b></div></section>`;
  const hs=sel.holdings.filter(h=>h.cur!=="TRY"&&(h.trades||[]).length);
  const rows=hs.map(h=>({h,...taxCalc(h,Y)})).filter(r=>r.sells.length||r.divs.length);
  const S_=rows.flatMap(r=>r.sells.map(x=>({...x,h:r.h}))).sort((a,b)=>a.date.localeCompare(b.date));
  const D_=rows.flatMap(r=>r.divs.map(x=>({...x,h:r.h}))).sort((a,b)=>a.date.localeCompare(b.date));
  const sum=(a,k)=>a.reduce((s,x)=>s+x[k],0),pend=rows.some(r=>r.pend),tl=v=>fmt(v,"TRY",{dec:0});
  const gain=sum(S_,"gain"),pos=S_.filter(x=>x.gain>0).reduce((s,x)=>s+x.gain,0),neg=S_.filter(x=>x.gain<0).reduce((s,x)=>s+x.gain,0);
  const tile=(l,v,cls,sub)=>`<div><span class="label">${l}</span><b class="num ${cls||""}">${v}</b>${sub?`<small>${sub}</small>`:""}</div>`;
  return `${pfs.length>1?`<div class="chips noprint" role="group" aria-label="Kimin raporu">${pfs.map(p=>`<button class="chip" data-act="taxpf" data-id="${p.id}" aria-pressed="${p===sel}">${esc(p.name)}</button>`).join("")}</div>`:""}
  <section class="card"><div class="sec" style="margin-bottom:8px"><h2>${esc(sel.name)} · yabancı para cinsinden menkul kıymetler</h2></div>
    <div class="tiles rp-tiles">${tile("Satış kazancı (net)",tl(gain),gain>=0?"pos-t":"neg-t",S_.length+" satış")}${tile("Kârlı satışlar",tl(pos),"pos-t")}${tile("Zararlı satışlar",tl(neg),neg<0?"neg-t":"")}${tile("Temettü (brüt)",tl(sum(D_,"tl")),"",D_.length?D_.length+" ödeme · yurt dışı stopaj "+tl(sum(D_,"taxTL")):"yok")}</div>
    ${pend?`<div class="note">Bazı işlem günlerinin kuru henüz alınamadı; bu satırlarda bugünkü kur kullanıldı. İnternete bağlıyken rapor kendiliğinden düzelir.</div>`:""}
  </section>
  <section class="card"><h2 style="margin-bottom:8px">Satışlar</h2>
  ${S_.length?`<div class="tx-tbl">${S_.map(x=>`<div class="tx-r">
      <div class="tx-h"><b>${esc(x.h.symbol||x.h.name)}</b><span class="sub">${fmtDate(x.date)} · ${fmtN(x.qty,4)} adet · kur ${fmtN(x.fx,4)}${x.fxOk?"":" (geçici)"}</span><b class="num ${x.gain>=0?"pos-t":"neg-t"}">${tl(x.gain)}</b></div>
      <div class="tx-k"><span>Satış tutarı (komisyon düşülmüş)</span><span class="num">${tl(x.sale)}</span></div>
      <div class="tx-k"><span>Alış maliyeti (alış günü kuruyla)</span><span class="num">${tl(x.cost)}</span></div>
      <div class="tx-k"><span>Endekslenmiş maliyet${x.nIdx?"":" (artış %10'un altında, endekslenmedi)"}${x.prov?" · son yayımlanan endeksle":""}</span><span class="num">${tl(x.idx)}</span></div>
      ${x.parts.length>1||x.parts.some(pt=>pt.k)?`<div class="tx-p">${x.parts.map(pt=>`${fmtDate(pt.date)} alımından ${fmtN(pt.q,4)} adet · maliyet ${tl(pt.cost)} · Yİ-ÜFE ${fmtPct(((pt.k||1)-1)*100)}${pt.k>=1.1?" ✓":""}`).join("<br>")}</div>`:""}
      ${x.unmatched?`<div class="tx-p neg-t">Satılan adet kayıtlı alımlardan fazla; eksik alımları ekleyin.</div>`:""}
    </div>`).join("")}</div>`:`<div class="sub">${Y} yılında yabancı para cinsinden satış yok.</div>`}
  </section>
  <section class="card"><h2 style="margin-bottom:8px">Temettüler</h2>
  ${D_.length?`<div class="tx-tbl">${D_.map(x=>`<div class="tx-r"><div class="tx-h"><b>${esc(x.h.symbol||x.h.name)}</b><span class="sub">${fmtDate(x.date)} · brüt ${fmtN(x.gross,2)} ${esc(x.h.cur)} · stopaj ${fmtN(x.tax,2)} · kur ${fmtN(x.fx,4)}</span><b class="num">${tl(x.tl)}</b></div></div>`).join("")}
    <div class="tx-k tot"><span>Toplam brüt temettü</span><span class="num">${tl(sum(D_,"tl"))}</span></div><div class="tx-k"><span>Yurt dışında kesilen vergi</span><span class="num">${tl(sum(D_,"taxTL"))}</span></div></div>`:`<div class="sub">${Y} yılında temettü kaydı yok. Temettüleri varlığın ayrıntısındaki "Temettü ekle" ile girebilirsiniz.</div>`}
  </section>
  <div class="note">Nasıl hesaplandı: satışlar en eski alımdan düşülür (ilk giren ilk çıkar). Alış maliyeti alış günü kuruyla, satış tutarı satış günü kuruyla TL'ye çevrilir. Alış ayından önceki ay ile satış ayından önceki ay arasındaki Yİ-ÜFE artışı %10'u bulursa maliyet endekslenir. Kurlar Avrupa Merkez Bankası referans kurudur; beyanda TCMB döviz alış kuru kullanıldığı için küçük farklar olabilir. İstisna tutarları, zarar mahsubu ve beyan sınırı her yıl değişir; beyannameden önce mali müşavirinize kontrol ettirin.</div>`;
}
function rRapor(){
  const mode=view.rpMode==="ay"||view.rpMode==="vergi"?view.rpMode:"yil",today=todayISO();
  const Y=view.rpYear||+today.slice(0,4);view.rpYear=Y;
  const ym=view.rpMonth||today.slice(0,7);view.rpMonth=ym;
  const tile=(l,v,cls,sub)=>`<div><span class="label">${l}</span><b class="num ${cls||""}">${v}</b>${sub?`<small>${sub}</small>`:""}</div>`;
  const rateTxt=r=>r==null?"—":"%"+fmtN(r,1);
  const head=(title,prev,next)=>`<div class="rp-top noprint"><button class="btn sm" data-tab="akis">${ic(I.left,14)}Gelir-Gider</button><div class="seg" role="group" aria-label="Rapor türü">${[["yil","Yıllık"],["ay","Aylık"],["vergi","Vergi"]].map(([k,l])=>`<button data-act="rpmode" data-k="${k}" aria-pressed="${mode===k}">${l}</button>`).join("")}</div><button class="btn sm primary" data-act="print">Yazdır / PDF</button></div>
    <div class="sec"><div class="month-sw"><button class="icon-btn noprint" data-act="rpnav" data-d="-1" aria-label="${prev}">${I.left}</button><b>${title}</b><button class="icon-btn noprint" data-act="rpnav" data-d="1" aria-label="${next}">${I.right}</button></div><span class="sub printonly">Emanet · ${fmtDate(today)} tarihinde oluşturuldu</span></div>`;
  if(mode==="vergi")return head(Y+" vergi raporu","Önceki yıl","Sonraki yıl")+taxReport(Y);
  if(mode==="ay"){
    const a=monthAgg(ym),[y,mo]=ym.split("-").map(Number),pm=prevMonth(ym+"-15"),b=monthAgg(pm);
    const chg=(x,y0)=>y0?` · geçen aya göre ${fmtPct((x-y0)/y0*100)}`:"";
    const big=monthTx(ym).filter(t=>t.type==="out").sort((p,q)=>toBase(q.amount,q.cur)-toBase(p.amount,p.cur)).slice(0,5);
    const bud=state.budgets||{};
    return head(MONTHS[mo-1]+" "+y,"Önceki ay","Sonraki ay")+`
    <section class="card"><div class="tiles rp-tiles">${tile("Gelir",fmt(a.i,null,{dec:0}),"pos-t",b.i?"geçen ay "+fmt(b.i,null,{dec:0}):"")}${tile("Gider",fmt(a.o,null,{dec:0}),"neg-t",b.o?"geçen ay "+fmt(b.o,null,{dec:0}):"")}${tile("Kalan",fmt(a.net,null,{dec:0}),a.net>=0?"":"neg-t",b.i||b.o?"geçen ay "+fmt(b.net,null,{dec:0}):"")}${tile("Birikim oranı",rateTxt(a.rate),"",b.rate!=null?"geçen ay "+rateTxt(b.rate):"")}${a.s||saveTarget(a)?tile("Tasarrufa ayrılan",fmt(a.s,null,{dec:0}),"",saveTarget(a)?"hedef "+fmt(saveTarget(a),null,{dec:0})+" · %"+fmtN(a.s/saveTarget(a)*100,0):(b.s?"geçen ay "+fmt(b.s,null,{dec:0}):"")):""}</div></section>
    <section class="card"><h2 style="margin-bottom:10px">Harcama kategorileri</h2>${catBars(a.co,a.o,"--accent",(c,v)=>(+bud[c]>0?` · bütçe ${fmt(+bud[c],null,{dec:0})}${v>+bud[c]?" (aşıldı)":""}`:"")+(b.co[c]?` · geçen ay ${fmt(b.co[c],null,{dec:0})}`:""))}</section>
    <section class="card side"><h2 style="margin-bottom:10px">Gelir kaynakları</h2>${catBars(a.ci,a.i,"--pos")}</section>
    <section class="card side"><h2 style="margin-bottom:6px">En büyük 5 harcama</h2>${big.length?`<div class="list">${big.map(t=>li({mark:mkIcon(catIcon(t.cat),catColor(t.cat)),title:esc(t.cat),sub:[fmtDate(t.date),esc(t.note||"")].filter(Boolean).join(" · "),amount:fmt(t.amount,t.cur)})).join("")}</div>`:`<div class="sub">Bu ay gider yok.</div>`}</section>`;
  }
  const months=Array.from({length:12},(_,i)=>monthAgg(Y+"-"+String(i+1).padStart(2,"0"))),act=months.filter(m=>m.i||m.o);
  const I_=months.reduce((a,m)=>a+m.i,0),O_=months.reduce((a,m)=>a+m.o,0),S_=months.reduce((a,m)=>a+m.s,0),co={},ci={};
  months.forEach(m=>{Object.entries(m.co).forEach(([c,v])=>co[c]=(co[c]||0)+v);Object.entries(m.ci).forEach(([c,v])=>ci[c]=(ci[c]||0)+v)});
  const nA=act.length||1,mx=Math.max(1,...months.map(m=>Math.max(m.i,m.o)));
  const best=act.slice().sort((a,b)=>b.net-a.net)[0],worst=act.slice().sort((a,b)=>b.o-a.o)[0];
  // yatırım özeti: yıl içindeki kayıtlardan
  const mp=mainPf(),ids=mp?[mp.id]:[],from=Y+"-01-01",to=Y+"-12-31";
  const hr=histRows(ids,"all").filter(r=>r.d>=from&&r.d<=to),bc=hr.length>=2?benchCalc(ids,{from,to}):null;
  const zk=state.zakatPaid.filter(z=>(z.date||"").slice(0,4)===String(Y)).reduce((a,z)=>a+toBase(z.amount,z.cur||"TRY"),0);
  return head(Y+" yılı","Önceki yıl","Sonraki yıl")+`
  <section class="card"><div class="tiles rp-tiles">${tile("Toplam gelir",fmt(I_,null,{dec:0}),"pos-t","aylık ortalama "+fmt(I_/nA,null,{dec:0}))}${tile("Toplam gider",fmt(O_,null,{dec:0}),"neg-t","aylık ortalama "+fmt(O_/nA,null,{dec:0}))}${tile("Birikim",fmt(I_-O_,null,{dec:0}),I_-O_>=0?"":"neg-t",act.length+" ay kayıt var")}${tile("Birikim oranı",rateTxt(I_?(I_-O_)/I_*100:null),"","gelirin kalan kısmı")}${S_?tile("Tasarrufa ayrılan",fmt(S_,null,{dec:0}),"","gelire oranı "+rateTxt(I_?S_/I_*100:null)+" · aylık ortalama "+fmt(S_/nA,null,{dec:0})):""}</div>
    ${best&&act.length>1?`<p class="bn-v" style="margin-bottom:0">En çok birikim <b>${MONTHS[+best.ym.slice(5)-1]}</b> ayında (${fmt(best.net,null,{dec:0})}); en çok harcama <b>${MONTHS[+worst.ym.slice(5)-1]}</b> ayında (${fmt(worst.o,null,{dec:0})}).</p>`:""}</section>
  <section class="card"><h2 style="margin-bottom:10px">Ay ay</h2>
    <div class="rp-tbl" role="table"><div class="rp-r rp-h" role="row"><span>Ay</span><span>Gelir</span><span>Gider</span><span>Kalan</span><span>Oran</span></div>
    ${months.map((m,i)=>!(m.i||m.o)?"":`<div class="rp-r" role="row"><span><b>${MONTHS[i]}</b><span class="rp-bars" aria-hidden="true"><i style="width:${(m.i/mx*100).toFixed(1)}%;background:var(--pos)"></i><i style="width:${(m.o/mx*100).toFixed(1)}%;background:var(--neg)"></i></span></span><span class="num">${fmt(m.i,null,{dec:0})}</span><span class="num">${fmt(m.o,null,{dec:0})}</span><span class="num ${m.net>=0?"pos-t":"neg-t"}">${fmt(m.net,null,{dec:0})}</span><span class="num">${rateTxt(m.rate)}</span></div>`).join("")||`<div class="sub" style="padding:10px 0">${Y} yılında gelir-gider kaydı yok.</div>`}
    ${act.length?`<div class="rp-r rp-f" role="row"><span><b>Toplam</b></span><span class="num">${fmt(I_,null,{dec:0})}</span><span class="num">${fmt(O_,null,{dec:0})}</span><span class="num ${I_-O_>=0?"pos-t":"neg-t"}">${fmt(I_-O_,null,{dec:0})}</span><span class="num">${rateTxt(I_?(I_-O_)/I_*100:null)}</span></div>`:""}</div></section>
  <section class="card"><h2 style="margin-bottom:10px">En çok harcanan kategoriler</h2>${catBars(co,O_,"--accent",(c,v)=>` · aylık ortalama ${fmt(v/nA,null,{dec:0})}`)}</section>
  <section class="card side"><h2 style="margin-bottom:10px">Gelir kaynakları</h2>${catBars(ci,I_,"--pos")}</section>
  ${mp?`<section class="card side"><h2 style="margin-bottom:10px">Yatırımlar · ${esc(mp.name)}</h2>${hr.length>=2?(()=>{const a=hr[0],z=hr[hr.length-1],pf=bc&&bc.items[0];
    return `<div class="tiles rp-tiles">${tile(fmtDate(a.d)+" değeri",fmt(a.v/rate(S().base),null,{dec:0}))}${tile(fmtDate(z.d)+" değeri",fmt(z.v/rate(S().base),null,{dec:0}))}${tile("Eklenen para (net)",fmt((z.c-a.c)/rate(S().base),null,{dec:0}))}${tile("Getiri",pf?fmtPct(pf.v):"—",pf&&pf.v<0?"neg-t":"pos-t","para girişi hariç")}</div>
      ${bc?`<div class="bn" style="margin-top:4px">${bc.items.slice().sort((x,y)=>y.v-x.v).map(i=>`<div class="bn-row ${i.k==="pf"?"me":""}"><span class="bn-n">${i.n}</span><span class="bn-bar"><i class="${i.v<0?"neg":""}" style="width:${Math.max(2,Math.abs(i.v)/Math.max(...bc.items.map(q=>Math.abs(q.v)),.01)*100).toFixed(1)}%"></i></span><b class="num ${i.v>=0?"pos-t":"neg-t"}">${fmtPct(i.v)}</b></div>`).join("")}</div>`:""}`})()
    :`<div class="sub">${Y} yılı için portföy değeri kaydı yok ya da tek günlük. Kayıtlar, uygulamayı açtığınız günlerde tutulur.</div>`}</section>`:""}
  ${zk?`<section class="card side"><div class="sec"><h2>Ödenen zekât</h2><b class="num">${fmt(zk,null,{dec:0})}</b></div></section>`:""}`;
}

/* Bugün dikkat: yalnızca yapılacak bir şey varken görünür. Sıra: gecikenler, bugünküler, yaklaşanlar. */
function attnItems(){
  const t=todayISO(),m=t.slice(0,7),out=[],dd=d=>daysBetween(t,d);
  const when=n=>n<0?(-n)+" gün gecikti":n===0?"bugün":n===1?"yarın":n+" gün sonra";
  state.recurring.forEach(r=>{if(recPaid(r,m))return;const n=dd(dayIn(m,r.day));if(n>2)return;
    out.push({n,ic:r.type==="in"?I.brief:r.type==="save"?I.target:I.repeat,c:n<0&&r.type!=="in"?"--neg":r.type==="in"?"--pos":r.type==="save"?"--c5":"--accent",t:esc(r.name)+" · "+when(n),s:(r.type==="in"?"Beklenen gelir · ":r.type==="save"?"Düzenli tasarruf · ":"Sabit ödeme · ")+fmt(r.amount,r.cur),act:"goto",id:"akis"})});
  state.cards.forEach(c=>{const b=cardBal(c).bal;if(!(b>0)||!c.dueDay)return;const n=dd(nextDue(c.dueDay));if(n>5)return;
    out.push({n,ic:I.card,c:"--c2",t:esc(c.name)+" son ödeme · "+when(n),s:"Kart borcu · "+fmt(b),act:"goto",id:"akis"})});
  state.debts.forEach(d=>{if(!d.due||!(debtLeft(d)>0))return;const n=dd(d.due);if(n>7)return;
    out.push({n,ic:I.borc,c:n<0?"--neg":"--c2",t:esc(d.name||"")+" · "+when(n),s:(d.dir==="lent"?"Alacağınız · ":"Borcunuz · ")+fmt(debtLeft(d),d.cur),act:"open-debt",id:d.id})});
  const mp=mainPf();
  if(mp){try{const z=zakat(mp.id);if(z.hawl&&z.reached&&z.left>0){const n=dd(z.hawl.next);if(n>=0&&n<=14)out.push({n,ic:I.zekat,c:"--pos",t:"Zekât günü · "+when(n),s:"Hesaplanan · "+fmt(z.left),act:"goto",id:"zekat"})}}catch(e){}}
  const ms=monthSum(m),tg=saveTarget(ms),[y,mo]=m.split("-").map(Number),left=dim(y,mo)-(+t.slice(8));
  if(tg>0&&ms.s<tg&&left<=7)out.push({n:left,ic:I.target,c:"--c5",t:"Tasarruf hedefine "+fmt(tg-ms.s,null,{dec:0})+" kaldı",s:"Ayın bitmesine "+(left===0?"son gün":left+" gün var"),act:"save-add",id:""});
  return out.sort((a,b)=>a.n-b.n);
}
function attnCard(){
  const it=attnItems();if(!it.length)return"";const N=4;
  return `<section class="card attn"><div class="sec" style="margin-bottom:4px"><h2>Bugün dikkat</h2><span class="pill ${it.some(x=>x.n<0)?"neg":"warn"}">${it.length}</span></div>
    <div class="list">${it.slice(0,N).map(x=>li({act:x.act,id:x.id,mark:mkIcon(x.ic,x.c),title:x.t,sub:x.s,trail:`<span class="chev">${ic(I.right,14)}</span>`})).join("")}</div>
    ${it.length>N?`<div class="sub" style="margin-top:6px">ve ${it.length-N} madde daha</div>`:""}</section>`;
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
      return `<g class="fbar" data-fl="${MONTHS[+d.m.slice(5)-1]}: gelir ${fmt(d.i,null,{dec:0})} · gider ${fmt(d.o,null,{dec:0})}"><rect class="hit" x="${(k*gw).toFixed(1)}" y="0" width="${gw.toFixed(1)}" height="${H}" fill="transparent"/><rect x="${(x-bw-1).toFixed(1)}" y="${(H-pb-hi).toFixed(1)}" width="${bw}" height="${Math.max(hi,0).toFixed(1)}" rx="${Math.min(3.5,hi/2).toFixed(1)}" fill="var(--pos)" opacity="${cur?1:.45}"/><rect x="${(x+1).toFixed(1)}" y="${(H-pb-ho).toFixed(1)}" width="${bw}" height="${Math.max(ho,0).toFixed(1)}" rx="${Math.min(3.5,ho/2).toFixed(1)}" fill="var(--neg)" opacity="${cur?.75:.3}"/><text x="${x.toFixed(1)}" y="${H-2}" text-anchor="middle" font-size="9" font-weight="${cur?700:500}" fill="var(${cur?"--fg":"--muted"})">${MONTHS[+d.m.slice(5)-1].slice(0,3)}</text></g>`}).join("");
    return `<div class="flow-box"><svg class="flow-c" viewBox="0 0 ${W} ${H}" role="img" aria-label="Son altı ay gelir ve gider; bu ay vurgulu. Bir aya dokununca tutarlar görünür">${bars}</svg><div class="flow-tip" aria-live="polite"></div></div>`;
  }
  const W=320,H=130,pb=20,bw=9,gw=W/6;
  const bars=data.map((d,k)=>{const x=k*gw+gw/2;const hi=(H-pb-8)*d.i/max,ho=(H-pb-8)*d.o/max;
    return `<g class="fbar" data-fl="${MONTHS[+d.m.slice(5)-1]}: gelir ${fmt(d.i,null,{dec:0})} · gider ${fmt(d.o,null,{dec:0})}"><rect class="hit" x="${k*gw}" y="0" width="${gw}" height="${H}" fill="transparent"/><rect x="${x-bw-1.5}" y="${H-pb-hi}" width="${bw}" height="${Math.max(hi,0)}" rx="${Math.min(4.5,hi/2)}" fill="var(--pos)"/><rect x="${x+1.5}" y="${H-pb-ho}" width="${bw}" height="${Math.max(ho,0)}" rx="${Math.min(4.5,ho/2)}" fill="var(--neg)" opacity=".6"/><text x="${x}" y="${H-5}" text-anchor="middle" font-size="10" fill="var(--muted)">${MONTHS[+d.m.slice(5)-1].slice(0,3)}</text></g>`}).join("");
  return `<div class="chart-wrap flow-box"><svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:520px;display:block" role="img" aria-label="Son altı ay gelir ve gider">${[.33,.66].map(f=>`<line x1="0" x2="${W}" y1="${(8+(H-pb-8)*f).toFixed(1)}" y2="${(8+(H-pb-8)*f).toFixed(1)}" stroke="var(--line)" stroke-dasharray="2 4"/>`).join("")}<line x1="0" x2="${W}" y1="${H-pb}" y2="${H-pb}" stroke="var(--line)"/>${bars}</svg><div class="flow-tip" aria-live="polite"></div></div><div class="sub" style="display:flex;gap:14px"><span><span class="dot" style="display:inline-block;background:var(--pos)"></span> Gelir</span><span><span class="dot" style="display:inline-block;background:var(--neg)"></span> Gider</span></div>`;
}

function donut(parts){
  const total=parts.reduce((s,p)=>s+p.v,0);if(!total)return"";
  const R=56,W=16,C=2*Math.PI*R,gap=parts.length>1?2.2:0;let off=0;
  const segs=parts.map(p=>{const len=p.v/total*C;const vis=Math.max(.8,len-gap);
    const s=`<circle class="dseg" data-dn="${parts.indexOf(p)}" r="${R}" cx="80" cy="80" fill="none" stroke="var(${p.c})" stroke-width="${W}" stroke-dasharray="${vis} ${C-vis}" stroke-dashoffset="${-off-gap/2}" transform="rotate(-90 80 80)"><title>${esc(p.n)} %${fmtN(p.v/total*100,1)}</title></circle>`;off+=len;return s}).join("");
  const tv=S().hide?"••••":fmt(total,null,{dec:0});
  const info=JSON.stringify(parts.map(p=>[p.n,"%"+fmtN(p.v/total*100,1),S().hide?"••••":fmt(p.v,null,{dec:0})]).concat([["Toplam","",tv]])).replace(/'/g,"&#39;");
  return `<div class="donut-row" data-dinfo='${info}'><svg viewBox="0 0 160 160" role="img" aria-label="Varlık dağılımı"><circle r="${R}" cx="80" cy="80" fill="none" stroke="var(--surface-2)" stroke-width="${W}"/>${segs}
    <text x="80" y="74" text-anchor="middle" class="ctr-l">Toplam</text><text x="80" y="94" text-anchor="middle" class="ctr-v" ${tv.length>11?'textLength="100" lengthAdjust="spacingAndGlyphs"':""}>${esc(tv)}</text></svg>
    <div class="legend">${parts.map((p,i)=>`<div class="li" role="button" tabindex="0" data-dn="${i}"><span class="sw2" style="background:var(${p.c})"></span><span class="n">${esc(p.n)}</span><span class="p">%${fmtN(p.v/total*100,1)}</span><span class="a">${fmt(p.v)}</span></div>`).join("")}</div></div>`;
}

function rPortfoy(){
  const ows=owners();if(view.owner!=="all"&&!ows.includes(view.owner))view.owner="all";
  if(view.pf==null)view.pf=(ozPf()||{}).id||"all";
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
    ${cur?`<button class="chip add" data-act="edit-pf" data-id="${cur.id}" aria-label="${esc(cur.name)} portföyünü düzenle">${ic(I.edit,14)} Düzenle</button>`:""}
    <button class="chip add" data-act="new-pf">+ Yeni portföy</button>
  </div>
  <section class="hero net">
    <div class="hero-top"><div style="min-width:0"><span class="label">${cur?esc(cur.name)+(state.portfolios.length>1&&isMainPf(cur)?" · ana portföy":""):(view.owner==="all"?"Tüm portföyler":esc(view.owner)+" · tüm portföyler")}</span></div><div class="hero-acts">${hs.length?curSeg():""}${eyeBtn()}</div></div>
    <div class="bigrow"><div class="big amt" data-cnt="p:${view.pf}" data-v="${v}">${money(v)}</div></div>
    ${plChips(hs,v,c)}
    <div class="subrow">${eqvChips(v)}</div>
  </section>
  ${(()=>{const u=ufeSum(hs);
    const parts=[u.c?`<div class="ufe-line"><div><span class="label">Yİ-ÜFE maliyeti</span><div class="v num">${fmt(u.c)}</div></div><div><span class="label">Reel kâr / zarar</span><div class="v num ${u.pl>=0?"pos-t":"neg-t"}">${fmt(u.pl)} <small>${fmtPct(u.plp)}</small></div></div></div><div class="sub">TL maliyet, alış ayından önceki aydan ${fmtYM(ufeEnd().ym)}'a kadar Yİ-ÜFE artışıyla güncellendi${u.n?`; alış tarihi olmayan ${u.n} varlık hariç`:""}.</div>`:"",
      cashIn?`<div class="sub">${esc(mpv.name)} içinde gelir-gider bakiyesi: <b class="num">${fmt(cb)}</b></div>`:"",
      realized?`<div class="sub">Gerçekleşen kâr/zarar (satışlar, komisyon düşülmüş): <b class="num ${realized>=0?"pos-t":"neg-t"}">${fmt(realized)}</b></div>`:""].filter(Boolean);
    if(!parts.length)return"";
    return `<section class="card pf-extra">${parts.join("")}</section>`})()}
  ${multi?pfListCard(vis,v):""}
  ${multi?vis.map(p=>{const ph=p.holdings.filter(h=>+h.qty>0).map(h=>({...h,_pf:p})).sort((a,b)=>hVal(b)-hVal(a)),pc=p.holdings.filter(h=>!(+h.qty>0)).map(h=>({...h,_pf:p})),pt=pfTotals(p);
    return `<section class="card pf-group"><div class="sec"><button class="btn ghost" data-act="pf" data-id="${p.id}" style="padding:0;color:var(--fg);display:flex;align-items:center;gap:8px;min-width:0"><span class="dot" style="background:var(${p.color||"--c1"})"></span><h2 style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.name)}</h2>${mainPf()===p?`<span class="pill">Ana</span>`:""}</button><div class="end" style="text-align:right"><div class="num">${fmt(pt.v)}</div><span class="pill ${pt.pl>=0?"pos":"neg"}">${fmtPct(pt.plp)}</span></div></div>
      ${ph.length||pc.length?assetTable(ph,pt.v,{group:false,closed:pc}):`<div class="sub" style="padding:8px 0">Bu portföyde varlık yok.</div>`}</section>`}).join("")
  :`<section class="card">
    <div class="sec" style="margin-bottom:6px"><h2>Varlıklar</h2><span class="sub">${AUTO()?"Fiyatlar "+marketWhen()+" (otomatik)":"Dokunarak fiyat güncelleyin"}</span></div>
    ${hs.length||closed.length?assetTable(hs,v,{ctx:"pf",closed})
    :`<div class="empty">${emptyIc(I.portfoy)}<b>${state.portfolios.length?"Bu portföyde varlık yok":"Önce bir portföy oluşturun"}</b>${state.portfolios.length?"Hisse, fon, altın, döviz veya nakit ekleyebilirsiniz.":""}</div><div style="text-align:center">${state.portfolios.length?`<button class="btn primary" data-act="add-h">Varlık ekle</button>`:`<button class="btn primary" data-act="new-pf">Portföy oluştur</button>`}</div>`}
  </section>`}
  ${cur&&hs.length?foldCard("hedef",targetCard(cur,hs),cur.target&&Object.keys(cur.target).length?(x=>`<span class="sub">sapma ${fmtN(x,1)} puan</span>`)(targetPlan(cur,hs,0).rows.reduce((a,r)=>a+Math.abs(r.cp-r.t),0)/2):""):""}
  ${parts.length?foldCard("dagilim",`<section class="card side"><h2 style="margin-bottom:12px">Dağılım</h2>${donut(parts)}</section>`,`<span class="sub">${esc(parts[0].n.replace(/\s*\(.*\)/,""))} %${fmtN(parts[0].v/parts.reduce((a,q)=>a+q.v,0)*100,0)}</span>`):""}
  ${hs.length?histCard((cur?[cur]:vis).map(p=>p.id),"Değer geçmişi").replace(/^(\s*<(?:section|details)\b[^>]*class=")/,"$1side "):""}
  ${hs.length?foldCard("bench",benchCard((cur?[cur]:vis).map(p=>p.id)),(b=>b?`<span class="num ${b.items[0].v>=0?"pos-t":"neg-t"}">${fmtPct(b.items[0].v)}</span>`:"")(benchCalc((cur?[cur]:vis).map(p=>p.id),view.hRange||90))):""}
  ${(()=>{const all=[];hsAll.forEach(h=>{const ph=h._pf.holdings.find(x=>x.id===h.id)||h;(ph.trades||[]).forEach(t=>all.push({h:ph,t,pf:h._pf.id}))});
    if(!all.length)return"";all.sort((a,b)=>(b.t.date||"").localeCompare(a.t.date||""));const N=view.trN||15;
    return foldCard("islemler",`<section class="card"><div class="sec" style="margin-bottom:6px"><h2>İşlemler</h2><span class="sub">${all.length} kayıt</span></div><div class="list">${all.slice(0,N).map(x=>tradeRow(x.h,x.t,true,x.pf)).join("")}</div>${all.length>N?`<div style="text-align:center;margin-top:8px"><button class="btn sm" data-act="more-tr">Daha fazla göster</button></div>`:""}</section>`,`<span class="sub">${all.length} kayıt</span>`)})()}
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
/* Açılır kapanır kart: hazır bir kartın başlığını düğmeye çevirir; kapalıyken yalnızca başlık ve kısa özet görünür.
   Telefonda kapalı, geniş ekranda açık başlar; kullanıcının seçimi bu cihazda saklanır. */
const CHV=`<svg class="chev" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`;
let _fold=null;
const foldMap=()=>{if(!_fold){try{_fold=JSON.parse(localStorage.getItem("emanet-fold")||"{}")||{}}catch(e){_fold={}}}return _fold};
const foldOpen=k=>k in foldMap()?!!foldMap()[k]:wide();
function foldCard(key,html,sum){
  if(!html)return html;
  const m=html.match(/<h2([^>]*)>([\s\S]*?)<\/h2>/),cls=(html.match(/<section class="([^"]*)"/)||[])[1]||"card";if(!m)return html;
  const btn=(open,st)=>`<button class="foldh" data-act="fold" data-k="${key}" aria-expanded="${open}"${st?` style="${st}"`:""}><h2>${m[2]}</h2>${open?"":(sum||"")}${CHV}</button>`;
  if(!foldOpen(key))return `<section class="${cls} fold">${btn(false)}</section>`;
  const just=view.fJust===key;if(just)setTimeout(()=>{view.fJust=null},0);
  return html.replace(/<section class="([^"]*)"/,'<section class="$1 fold open'+(just?" fold-in":"")+'"').replace(m[0],btn(true,"width:auto"+(/margin-bottom/.test(m[1])?";margin-bottom:12px":"")));
}
/* ---------- hedef dağılım ----------
   Portföy başına "tür → yüzde" hedefi. Kart: şimdiki pay, hedef, fark ve dengelemek için alınacak/satılacak tutar.
   "Eklenecek para" girilirse yalnızca alımla dengeleme planı: para, hedefin altında kalan türlere açıkla orantılı dağıtılır. */
function targetPlan(p,hs,add){
  const tg=p.target||{},V=hs.reduce((a,h)=>a+hVal(h),0),T=V+(add||0),by={};hs.forEach(h=>by[h.kind]=(by[h.kind]||0)+hVal(h));
  const kinds=[...new Set([...Object.keys(tg),...Object.keys(by)])];
  const rows=kinds.map(k=>{const cur=by[k]||0,t=+tg[k]||0,want=T*t/100;return{k,cur,cp:V?cur/V*100:0,t,diff:want-cur}}).sort((a,b)=>b.t-a.t||b.cur-a.cur);
  if(add>0){const need=rows.map(r=>Math.max(0,r.diff)),sum=need.reduce((a,x)=>a+x,0);rows.forEach((r,i)=>r.buy=sum>0?add*need[i]/sum:0)}
  return{rows,V};
}
function targetCard(p,hs){
  if(!p||!hs.length)return"";
  const tg=p.target;
  if(!tg||!Object.keys(tg).length)return `<section class="card side"><div class="sec"><h2>Hedef dağılım</h2><button class="btn ghost sm" data-act="target" data-id="${p.id}">${ic(I.plus,14)}Hedef belirle</button></div><div class="sub">Örneğin “altın %50, fon %30, hisse %20” gibi bir hedef koyun; sapmayı ve dengelemek için ne alınması gerektiğini burada görün.</div></section>`;
  const add=parseNum(view.tgAdd||"")||0,{rows,V}=targetPlan(p,hs,add),thr=V*.01,off=rows.reduce((a,r)=>a+Math.abs(r.cp-r.t),0)/2;
  return `<section class="card side"><div class="sec"><h2>Hedef dağılım</h2><button class="btn ghost sm" data-act="target" data-id="${p.id}">Düzenle</button></div>
    <div class="sub" style="margin:-4px 0 10px">${off<2?"Portföy hedefe çok yakın.":"Hedeften toplam sapma: "+fmtN(off,1)+" puan."}</div>
    <div class="tg">${rows.map(r=>`<div class="tg-r"><div class="tg-h"><span class="tg-n"><i class="dot" style="background:var(${KIND_COLOR[r.k]||"--c7"})"></i>${esc((KINDS[r.k]||r.k).replace(/\s*\(.*\)/,""))}</span><span class="num tg-p">%${fmtN(r.cp,0)} <small>→ %${fmtN(r.t,0)}</small></span></div>
      <div class="tg-bar" aria-hidden="true"><i style="width:${Math.min(100,r.cp)}%;background:var(${KIND_COLOR[r.k]||"--c7"})"></i><b style="left:${Math.min(100,r.t)}%"></b></div>
      <div class="tg-a sub">${add>0?(r.buy>=thr/10?`<span class="pos-t">${fmt(r.buy,null,{dec:0})} al</span>`:"almaya gerek yok"):Math.abs(r.diff)<thr?"dengede":r.diff>0?`<span class="pos-t">${S().hide?"••••":fmt(r.diff,null,{dec:0})} al</span> · hedefe ulaşmak için`:`<span class="neg-t">${S().hide?"••••":fmt(-r.diff,null,{dec:0})} sat</span> · ya da diğerlerine ekleyin`}</div></div>`).join("")}</div>
    <label class="field tg-add" style="margin-top:12px"><span class="label">Yalnızca alımla dengele: eklenecek para (${esc(S().base)})</span><input class="inline-in" id="tgAdd" inputmode="decimal" placeholder="Örn. 20.000" value="${esc(view.tgAdd||"")}" autocomplete="off"></label>
    <div class="sub" style="margin-top:6px">${add>0?"Bu tutar, hedefin altında kalan türlere açıkla orantılı dağıtıldı; satış gerekmez.":"Tutar girerseniz satış yapmadan hangi türe ne kadar ekleyeceğiniz hesaplanır."}</div></section>`;
}
function targetSheet(p){
  const hs=p.holdings.filter(h=>+h.qty>0),V=hs.reduce((a,h)=>a+hVal(h),0),by={};hs.forEach(h=>by[h.kind]=(by[h.kind]||0)+hVal(h));
  const tg=p.target||{},kinds=[...new Set([...Object.keys(by),...Object.keys(tg)])].sort((a,b)=>(by[b]||0)-(by[a]||0));
  openSheet(`<h3>Hedef dağılım · ${esc(p.name)}</h3>
    <form class="form" id="tgF" novalidate>
      <div class="tg-in">${kinds.map(k=>`<label class="tg-ir"><span class="tg-n"><i class="dot" style="background:var(${KIND_COLOR[k]||"--c7"})"></i>${esc((KINDS[k]||k).replace(/\s*\(.*\)/,""))}<small>şimdi %${fmtN(V?(by[k]||0)/V*100:0,0)}</small></span><span class="tg-pc"><span>%</span><input class="inline-in" data-k="${k}" inputmode="decimal" value="${tg[k]!=null?String(tg[k]).replace(".",","):""}" placeholder="0" aria-label="${esc(KINDS[k]||k)} hedef yüzdesi"></span></label>`).join("")}</div>
      <div class="tg-sum" id="tgSum"></div>
      <button type="button" class="btn sm" id="tgCopy">Şimdiki dağılımı kopyala</button>
      <div class="err" id="tgErr" role="alert"></div>
      <div class="actions">${p.target?`<button type="button" class="btn danger" id="tgDel">${ic(I.trash,18)}<span>Kaldır</span></button>`:""}<button class="btn primary grow" type="submit">Kaydet</button></div>
    </form>`,sh=>{
    const f=sh.querySelector("#tgF"),ins=[...f.querySelectorAll("input[data-k]")];
    const sum=()=>{const t=ins.reduce((a,i)=>a+(parseNum(i.value)||0),0),el=sh.querySelector("#tgSum");el.textContent="Toplam %"+fmtN(t,1)+(Math.abs(t-100)<.05?" ✓":t<100?" · %"+fmtN(100-t,1)+" eksik":" · %"+fmtN(t-100,1)+" fazla");el.className="tg-sum "+(Math.abs(t-100)<.05?"pos-t":"neg-t");return t};
    f.addEventListener("input",sum);sum();
    sh.querySelector("#tgCopy").onclick=()=>{let acc=0;ins.forEach((i,n)=>{const v=n===ins.length-1?Math.max(0,100-acc):Math.round(V?(by[i.dataset.k]||0)/V*100:0);acc+=v;i.value=String(v)});sum()};
    const del=sh.querySelector("#tgDel");if(del)del.onclick=()=>{if(!del.dataset.c){del.dataset.c="1";del.lastElementChild.textContent="Emin misiniz?";return}delete p.target;closeSheet();commit("Hedef dağılım kaldırıldı")};
    f.onsubmit=e=>{e.preventDefault();const t=sum();if(Math.abs(t-100)>=.05){sh.querySelector("#tgErr").textContent="Yüzdelerin toplamı 100 olmalı.";return}
      const o={};ins.forEach(i=>{const v=parseNum(i.value)||0;if(v>0)o[i.dataset.k]=v});p.target=o;closeSheet();commit("Hedef dağılım kaydedildi")};
  });
}
/* ---------- varlık tablosu ----------
   Kategoriler açılır kapanır; her satırın sağındaki hücre seçili bilgiyi gösterir ve dokununca sıradakine geçer.
   ctx "ozet" ise kategoriler kapalı başlar, "pf" ise açık başlar; kullanıcının açıp kapattıkları bu cihazda saklanır. */
let _kOpen=null;
function kOpenSet(){if(!_kOpen){try{_kOpen=new Set(JSON.parse(localStorage.getItem("emanet-kopen")||"[]"))}catch(e){_kOpen=new Set()}}return _kOpen}
const kIsOpen=(ctx,k)=>ctx==="ozet"?kOpenSet().has(ctx+":"+k):!kOpenSet().has(ctx+":"+k);
function cellData(list,total){
  const usd=plCur()==="USD",ru=rate("USD"),rb=rate(S().base);
  const v=list.reduce((a,h)=>a+hVal(h),0),c=list.reduce((a,h)=>a+hCost(h),0),vU=ru?v*rb/ru:0,cU=list.reduce((a,h)=>a+costIn(h,"USD"),0),d=daySum(list),dv=divOf(list),dvU=ru?dv*rb/ru:0;
  return{usd,cur:usd?"USD":S().base,v:usd?vU:v,share:total?v/total*100:0,tot:usd?{pl:vU-cU+dvU,pct:cU?(vU-cU+dvU)/cU*100:0}:{pl:v-c+dv,pct:c?(v-c+dv)/c*100:0},day:d?(usd?{pl:d.plU,pct:d.pctU}:{pl:d.pl,pct:d.pct}):null};
}
function vcell(x,h,n){
  const m=colMode(),hide=S().hide,pn=v=>fmtN(v,Math.abs(v)<10?4:2).replace(/,?0+$/,z=>z.length>3?",00":z);
  const plc=p=>p?[`<b class="num ${p.pl>=0?"pos-t":"neg-t"}">${hide?"••••":(p.pl>=0?"+":"−")+fmt(Math.abs(p.pl),x.cur,{dec:0})}</b>`,`<small class="num ${p.pl>=0?"pos-t":"neg-t"}">${fmtPct(p.pct)}</small>`]:[`<b class="sub">—</b>`,`<small>yarın</small>`];
  let a,b;
  if(m==="day")[a,b]=plc(x.day);
  else if(m==="total")[a,b]=plc(x.tot);
  else if(m==="qty"&&h){a=`<b class="num">${hide?"••••":fmtN(+h.qty,4)}</b>`;b=`<small class="num">ort. ${hide?"••":fmtN(+h.cost,+h.cost<10?4:2)} ${esc(h.cur)}</small>`}
  else if(m==="qty"){a=`<b class="num">${n} varlık</b>`;b=`<small class="num">%${fmtN(x.share,0)}</small>`}
  else if(m==="price"&&h){const ep=effPrice(h);a=`<b class="num">${fmtN(ep.p,ep.p<10?4:2)} <i>${esc(h.cur)}</i></b>`;b=x.day?`<small class="num ${x.day.pct>=0?"pos-t":"neg-t"}">${dayLabel()==="bugün"?"bugün ":""}${fmtPct(x.day.pct)}</small>`:`<small>${ep.auto?"otomatik":"elle girildi"}</small>`}
  else{a=`<b class="num">${fmt(x.v,x.cur,{dec:0})}</b>`;b=`<small class="num">%${fmtN(x.share,x.share<10?1:0)}</small>`}
  return `<button class="vcell" data-act="colnext" aria-label="${COLS.find(c=>c[0]===m)[1]} gösteriliyor. Sıradaki bilgiye geçmek için dokunun">${a}${b}</button>`;
}
/* Özet için kısa liste: yalnızca kategoriler, değer ve günlük değişim. Ayrıntı Portföy sayfasındadır. */
function kindList(hs,total,pfId){
  const by={};hs.forEach(h=>(by[h.kind]=by[h.kind]||[]).push(h));
  const cats=Object.entries(by).map(([k,list])=>({k,x:cellData(list,total),v:list.reduce((a,h)=>a+hVal(h),0)})).sort((a,b)=>b.v-a.v);
  return `<div class="stack" aria-hidden="true">${cats.map(c=>`<i style="flex:${c.v};background:var(${KIND_COLOR[c.k]||"--c7"})"></i>`).join("")}</div>
  <div class="atbl compact">${cats.map(c=>`<div class="arow cat kl" role="button" tabindex="0" data-act="open-pf" data-id="${pfId}"><span class="an">${kindBadge(c.k)}<span class="kmain"><span class="kt"><span class="t">${esc((KINDS[c.k]||c.k).replace(/\s*\(.*\)/,""))}</span><small class="kshare num">%${fmtN(c.x.share,0)}</small></span><span class="kbar"><i style="width:${Math.max(2,c.x.share).toFixed(1)}%;background:var(${KIND_COLOR[c.k]||"--c7"})"></i></span></span></span><span class="vcell static">${c.x.day?`<small class="num ${c.x.day.pct>=0?"pos-t":"neg-t"}">${fmtPct(c.x.day.pct)}</small>`:""}<b class="num">${fmt(c.x.v,c.x.cur,{dec:0})}</b></span></div>`).join("")}</div>`;
}
function assetTable(hs,total,o){
  o=o||{};const ctx=o.ctx||"pf",m=colMode();
  const hrow=(h,sub)=>`<div class="arow ${sub?"sub":""}" title="${esc(h.name)}" role="button" tabindex="0" data-act="edit-h" data-pf="${h._pf?h._pf.id:o.pf}" data-id="${h.id}"><span class="an"><i class="dot" style="background:var(${KIND_COLOR[h.kind]||"--c7"})"></i><span class="t">${esc(h.name)}${h.symbol&&h.symbol.toUpperCase()!==h.name.toUpperCase()?`<small>${esc(h.symbol)}</small>`:""}</span>${priceFlag(h)}</span>${vcell(cellData([h],total),h)}</div>`;
  const head=`<div class="ahead"><div class="seg colseg" role="group" aria-label="Tabloda gösterilen bilgi">${COLS.map(([k,l])=>`<button data-act="col" data-k="${k}" aria-pressed="${m===k}">${l}</button>`).join("")}</div></div>`;
  const sorted=hs.slice().sort((a,b)=>hVal(b)-hVal(a));
  if(o.group===false)return `<div class="atbl compact">${head}${sorted.map(h=>hrow(h,false)).join("")}${(o.closed||[]).map(closedRow).join("")}</div>`;
  const by={};sorted.forEach(h=>(by[h.kind]=by[h.kind]||[]).push(h));
  const cats=Object.entries(by).map(([k,list])=>({k,list,v:list.reduce((a,h)=>a+hVal(h),0)})).sort((a,b)=>b.v-a.v);
  return `<div class="stack" aria-hidden="true">${cats.map(c=>`<i style="flex:${c.v};background:var(${KIND_COLOR[c.k]||"--c7"})"></i>`).join("")}</div>
  <div class="atbl compact">${head}${cats.map(c=>{const open=kIsOpen(ctx,c.k),x=cellData(c.list,total);
    return `<div class="arow cat" role="button" tabindex="0" data-act="kopen" data-k="${ctx}:${c.k}" aria-expanded="${open}"><span class="an">${kindBadge(c.k)}<span class="t">${esc((KINDS[c.k]||c.k).replace(/\s*\(.*\)/,""))}<small>%${fmtN(x.share,0)} · ${c.list.length} varlık</small></span><span class="chev ${open?"open":""}">${ic(I.right,14)}</span></span>${vcell(x,null,c.list.length)}</div>${open?c.list.map(h=>hrow(h,true).replace('class="arow sub"',view.kJust===ctx+":"+c.k?'class="arow sub enter"':'class="arow sub"')).join(""):""}`}).join("")}${(o.closed||[]).map(closedRow).join("")}</div>`;
}
const closedRow=h=>`<div class="arow closed" role="button" tabindex="0" data-act="edit-h" data-pf="${h._pf.id}" data-id="${h.id}"><span class="an"><i class="dot" style="background:var(--faint)"></i><span class="t">${esc(h.name)}<small>satıldı</small></span></span><span class="vcell static"><b class="num ${(+h.realized||0)>=0?"pos-t":"neg-t"}">${S().hide?"••••":fmt(+h.realized||0,h.cur,{dec:0})}</b><small>gerçekleşen</small></span></div>`;
function pfListCard(vis,total){
  const tots=vis.map(p=>({p,t:pfTotals(p)})).sort((a,b)=>b.t.v-a.t.v);
  return `<section class="card"><div class="sec" style="margin-bottom:6px"><h2>Portföyler</h2><button class="btn ghost sm" data-act="new-pf">${ic(I.plus,14)}Yeni portföy</button></div><div class="list">${tots.map(({p,t})=>{const sh=total?t.v/total*100:0;return `<button class="row" data-act="pf" data-id="${p.id}"><span class="dot" style="background:var(${p.color||"--c1"})"></span><div class="main"><div class="t">${esc(p.name)}${mainPf()===p?` <span class="pill">Ana</span>`:""}</div><div class="s">${owners().length>1?esc(ownerOf(p))+" · ":""}${p.holdings.filter(h=>+h.qty>0).length} varlık · %${fmtN(sh,0)}</div><div class="share"><i style="width:${sh}%;background:var(${p.color||"--c1"})"></i></div></div><div class="end"><div class="num">${fmt(t.v)}</div><span class="pill ${t.pl>=0?"pos":"neg"}">${fmtPct(t.plp)}</span></div></button>`}).join("")}</div></section>`;
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
  const prevCats={};monthTx(prevMonth(m+"-15")).forEach(t=>{if(t.type==="out")prevCats[t.cat]=(prevCats[t.cat]||0)+toBase(t.amount,t.cur)});
  const bud=state.budgets||{};Object.keys(bud).forEach(c=>{if(+bud[c]>0&&!(c in cats))cats[c]=0});
  const catArr=Object.entries(cats).sort((a,b)=>b[1]-a[1]);const cmax=Math.max(1,...catArr.map(([c,v])=>Math.max(v,+bud[c]||0)));
  const budTot=Object.values(bud).reduce((a,v)=>a+(+v||0),0);
  if(view.txType!=="all")list=list.filter(t=>view.txType==="out"?(t.type==="out"||t.type==="card"):t.type===view.txType);
  const groups={};list.forEach(t=>(groups[t.date]=groups[t.date]||[]).push(t));
  const left=ms.i-ms.o-ms.s,savings=ms.i?(left/ms.i*100):0;
  const recs=state.recurring.slice().sort((a,b)=>(+a.day||1)-(+b.day||1));
  const recOut=recs.filter(r=>r.type==="out"),recIn=recs.filter(r=>r.type==="in"),recSave=recs.filter(r=>r.type==="save");
  const recPend=recs.filter(r=>!recPaid(r,m));
  const pendOut=recPend.filter(r=>r.type==="out"||r.type==="save").reduce((a,r)=>a+toBase(r.amount,r.cur),0);
  const curM=m===todayISO().slice(0,7);
  /* Günlük harcama limiti: (gelir − gider − bekleyen sabit ödemeler) ÷ ayın kalan günleri (bugün dahil).
     Bugünkü harcama limite geri eklenir ki limit gün içinde harcadıkça küçülmesin; "bugün kalan" ayrıca gösterilir. */
  const dLeft=curM?dim(y,mo)-(+todayISO().slice(8))+1:0;
  const todayOut=curM?monthTx(m).filter(t=>t.type==="out"&&t.date===todayISO()).reduce((a,t)=>a+toBase(t.amount,t.cur),0):0;
  const spendable=left-pendOut, dayLimit=dLeft?(spendable+todayOut)/dLeft:0, todayLeft=dayLimit-todayOut;
  const dayRow=!curM||!(ms.i>0||ms.o>0)?"":dayLimit>0
    ?`<div class="dayrow"><div><span class="label">Günlük harcama limiti</span><div class="v num">${fmt(dayLimit,null,{dec:0})}</div></div><div class="dr-r"><b class="num ${todayLeft>=0?"pos-t":"neg-t"}">${S().hide?"••••":todayLeft>=0?"bugün "+fmt(todayLeft,null,{dec:0})+" kaldı":"bugün "+fmt(-todayLeft,null,{dec:0})+" aşıldı"}</b><small>${dLeft} gün kaldı · harcanabilir ${fmt(spendable,null,{dec:0})}</small></div>
      <div class="bar" aria-hidden="true"><i style="width:${Math.min(100,dayLimit?todayOut/dayLimit*100:0)}%;background:var(${todayLeft<0?"--neg":todayOut>dayLimit*.8?"--warn":"--pos"})"></i></div></div>`
    :`<div class="dayrow"><div><span class="label">Günlük harcama limiti</span><div class="v num neg-t">${fmt(0)}</div></div><div class="dr-r"><b class="neg-t">Bu ay harcanabilir tutar kalmadı</b><small>${dLeft} gün kaldı · açık ${fmt(-spendable,null,{dec:0})}</small></div></div>`;
  // ay sonu tahmini: şu anki kalan + bekleyen sabit gelir − bekleyen sabit ödeme/tasarruf − (sabit olmayan harcama hızı × kalan gün)
  const dayNo=+todayISO().slice(8),pendIn=recPend.filter(r=>r.type==="in").reduce((a,r)=>a+toBase(r.amount,r.cur),0);
  const varOut=curM?monthTx(m).filter(t=>t.type==="out"&&!t.rid).reduce((a,t)=>a+toBase(t.amount,t.cur),0):0,pace=dayNo?varOut/dayNo:0,endEst=left+pendIn-pendOut-pace*(dim(y,mo)-dayNo);
  const forecast=curM&&dayNo>=3&&(ms.i||ms.o)?`<div class="fc"><span class="label">Bu gidişle ay sonunda</span><b class="num ${endEst>=0?"":"neg-t"}">${fmt(endEst,null,{dec:0})}</b><small>günde ortalama ${fmt(pace,null,{dec:0})} harcama${pendOut?" · bekleyen sabit kalemler "+fmt(pendOut,null,{dec:0}):""}${pendIn?" · beklenen gelir "+fmt(pendIn,null,{dec:0}):""}</small></div>`:"";
  const recRow=r=>{const pd=recPaid(r,m),late=!pd&&curM&&dayIn(m,r.day)<todayISO(),c=r.method&&cardById(r.method);
    return li({act:"rec-edit",id:r.id,mark:mk(String(r.day||1).padStart(2,"0"),r.type==="in"?"--pos":r.type==="save"?"--c5":"--muted"),title:esc(r.name),sub:esc(r.cat)+(c?" · "+esc(c.name):""),amount:fmt(r.amount,r.cur),
      trail:pd?`<span class="pill pos">${r.type==="in"?"Alındı":r.type==="save"?"Ayrıldı":"Ödendi"}</span>`:`<button class="btn sm ${late?"primary":""}" data-act="rec-pay" data-id="${r.id}">${r.type==="in"?"Alındı":r.type==="save"?"Ayır":"Öde"}</button>`})};
  const tgt=saveTarget(ms),st=S().saveTarget,yS=state.tx.filter(t=>t.type==="save"&&(t.date||"").slice(0,4)===String(y)).reduce((a,t)=>a+toBase(t.amount,t.cur),0);
  const saveCard=`<section class="card side"><div class="sec" style="margin-bottom:8px"><h2>Tasarruf</h2><button class="btn ghost sm" data-act="save-target">${tgt?"Hedefi düzenle":"Hedef belirle"}</button></div>
    <div class="dsum" style="margin-bottom:8px"><div><span class="label">${MONTHS[mo-1]} ayında ayrılan</span><div class="dv num">${fmt(ms.s,null,{dec:0})}</div></div>${tgt?`<span class="chg ${ms.s>=tgt?"up":""}"><b class="num">%${fmtN(Math.min(999,ms.s/tgt*100),0)}</b><span>${ms.s>=tgt?"hedef tamam":"hedefin"}</span></span>`:""}</div>
    ${tgt?`<div class="bar" aria-hidden="true"><i style="width:${Math.min(100,ms.s/tgt*100)}%;background:var(${ms.s>=tgt?"--pos":"--c5"})"></i></div>
    <div class="sub" style="margin-top:8px">Aylık hedef ${fmt(tgt,null,{dec:0})}${st.mode==="pct"?` (gelirin %${fmtN(+st.v,1)} kadarı)`:""}${ms.s<tgt?` · kalan ${fmt(tgt-ms.s,null,{dec:0})}`:""}${ms.i?` · gelire oranı %${fmtN(ms.s/ms.i*100,1)}`:""}</div>`
    :`<div class="sub">Her ay ne kadar ayırmak istediğinizi belirleyin; ilerlemeyi burada görün. Ayırdığınız parayı “İşlem ekle” içindeki <b>Tasarruf</b> türüyle kaydedin.</div>`}
    <div class="sub" style="margin-top:6px">${y} yılında toplam <b class="num">${fmt(yS,null,{dec:0})}</b> ayrıldı.</div>
    <div style="margin-top:10px"><button class="btn sm primary" data-act="save-add">${ic(I.plus,14)}Tasarruf ekle</button></div></section>`;
  return `
  <div class="sec"><div class="month-sw"><button class="icon-btn" data-act="month" data-d="-1" aria-label="Önceki ay">${I.left}</button><b>${MONTHS[mo-1]} ${y}</b><button class="icon-btn" data-act="month" data-d="1" aria-label="Sonraki ay">${I.right}</button></div><button class="btn sm" data-act="rapor">${ic(I.trend,16)}Rapor</button></div>
  <section class="hero flat">
    <div class="hero-top"><div><span class="label">Bu ay kalan</span><div class="big ${left>=0?"":"neg-t"}">${money(left)}</div>${ms.i?`<div class="sub">Gelirin %${fmtN(savings,1)} kadarı kaldı${pendOut?` · bekleyen sabit kalemler ${fmt(pendOut)}`:""}</div>`:pendOut?`<div class="sub">Bekleyen sabit ödemeler ${fmt(pendOut)}</div>`:""}</div>${eyeBtn()}</div>
    <div class="trio tint"><div class="t-in"><span class="label">Gelir</span><div class="v pos-t">${fmt(ms.i)}</div></div><div class="t-out"><span class="label">Gider</span><div class="v neg-t">${fmt(ms.o)}</div></div><div class="t-save"><span class="label">Tasarruf</span><div class="v" style="color:var(--c5)">${fmt(ms.s)}</div></div></div>
    ${budTot?`<div class="sub" style="margin-bottom:-6px">Bütçeden kalan <b class="num ${budTot-ms.o<0?"neg-t":""}">${fmt(budTot-ms.o)}</b></div><div class="bar" aria-label="Bütçe kullanımı"><i style="width:${Math.min(100,ms.o/budTot*100)}%;background:var(${ms.o>budTot?"--neg":ms.o>budTot*.9?"--warn":"--accent"})"></i></div>`:""}
    ${dayRow}
    ${forecast}
  </section>
  ${saveCard}
  ${mainPf()?`<section class="card side"><div class="sec"><div style="min-width:0"><h2>Nakit bakiyesi</h2><div class="sub">${cashOn()?`${esc(mainPf().name)} portföyünün zekâtına dahil · özet ve portföyde gösterilmez${S().cashStartDate?" · "+fmtDate(S().cashStartDate)+" tarihinden beri":""}`:"Portföye bağlı değil"}</div></div><div class="end" style="text-align:right"><div class="num" style="font-size:1.15rem;font-weight:600">${cashOn()?`<span class="${cashBal()<0?"neg-t":""}">${fmt(cashBal())}</span>`:"—"}</div><button class="btn ghost sm" data-act="cash-set">Ayarla</button></div></div></section>`:""}
  <section class="card side">
    <div class="sec" style="margin-bottom:6px"><h2>Sabit ödemeler</h2><button class="btn ghost sm" data-act="rec-new">${ic(I.plus,14)}Kalem ekle</button></div>
    ${recs.length?`${recOut.length?`<div class="list">${recOut.map(recRow).join("")}</div>`:""}${recSave.length?`<div class="label" style="margin-top:10px">Düzenli tasarruf</div><div class="list">${recSave.map(recRow).join("")}</div>`:""}${recIn.length?`<div class="label" style="margin-top:10px">Düzenli gelirler</div><div class="list">${recIn.map(recRow).join("")}</div>`:""}`
      :`<div class="empty">${emptyIc(I.repeat)}<b>Sabit kalem yok</b>Kira, fatura, abonelik ve maaş gibi her ay tekrar edenleri ekleyin; her ay tek dokunuşla işaretlersiniz.</div>`}
  </section>
  <section class="card side">
    <div class="sec" style="margin-bottom:6px"><h2>Kredi kartları</h2><button class="btn ghost sm" data-act="card-new">${ic(I.plus,14)}Kart ekle</button></div>
    ${state.cards.length?`<div class="list">${state.cards.map(c=>{const b=cardBal(c),nd=nextDue(c.dueDay),n=daysBetween(todayISO(),nd);
      return li({act:"card-edit",id:c.id,mark:mkIcon(I.card,"--c2"),title:esc(c.name),sub:`Son ödeme ${fmtDate(nd)} · ${n} gün${c.limit?` · limit ${fmt(+c.limit,"TRY",{dec:0})}`:""}`,
        extra:c.limit?`<div class="share"><i style="width:${Math.min(100,b.bal/c.limit*100)}%;background:var(${b.bal>c.limit*.9?"--neg":"--c2"})"></i></div>`:"",amount:fmt(b.bal),cls:b.bal>0?"neg-t":"",
        trail:b.bal>0?`<button class="btn sm ${n<=3?"primary":""}" data-act="card-pay" data-id="${c.id}">Öde</button>`:`<span class="pill pos">Borç yok</span>`})}).join("")}</div>
      <div class="sub" style="margin-top:8px">Kartla yapılan harcamalar gider olarak o aya yazılır; kart ödemesi tekrar gider sayılmaz, yalnızca kart borcunu düşürür.</div>`
      :`<div class="empty">${emptyIc(I.card)}<b>Kart eklenmedi</b>Kart ekleyince harcamaları karta bağlayabilir, taksitleri aylara bölebilir ve kart borcunu izleyebilirsiniz.</div>`}
  </section>
  <section class="card">
    <div class="sec" style="margin-bottom:10px;flex-wrap:wrap"><h2>Kategoriler ve bütçe</h2><span><button class="btn ghost sm" data-act="budget">${budTot?"Bütçeyi düzenle":"Bütçe belirle"}</button></span></div>
    ${catArr.length?`<div style="display:flex;flex-direction:column;gap:12px">${catArr.map(([c,v])=>{const lim=+bud[c]||0;const over=lim&&v>lim,near=lim&&v>lim*.9,pv=prevCats[c]||0,dp=pv?(v-pv)/pv*100:null;
      return `<div class="budrow">${mkIcon(catIcon(c),catColor(c))}<div class="main"><div style="display:flex;justify-content:space-between;gap:8px;font-size:.88rem;margin-bottom:4px"><span>${esc(c)}${dp!=null&&Math.abs(dp)>=1?` <small class="${dp>0?"neg-t":"pos-t"}" title="Geçen ay ${fmt(pv,null,{dec:0})}">${dp>0?"▲":"▼"} %${fmtN(Math.min(999,Math.abs(dp)),0)}</small>`:pv?"":` <small class="sub">yeni</small>`}</span><span class="num ${over?"neg-t":""}">${fmt(v)}${lim?` <span class="sub">/ ${fmt(lim)}</span>`:""}</span></div><div class="bar" style="position:relative"><i style="width:${(lim?Math.min(100,v/lim*100):v/cmax*100)}%;background:var(${over?"--neg":near?"--warn":catColor(c)})"></i></div></div></div>`}).join("")}</div>`
      :`<div class="sub">Bu ay gider yok.</div>`}
    <div class="card-foot"><button class="btn ghost sm" data-act="cats">Kategorileri düzenle${ic(I.right,14)}</button></div>
  </section>
  <section class="card">
    <div class="sec" style="margin-bottom:8px;flex-wrap:wrap"><h2>İşlemler</h2><div class="seg" role="group">${[["all","Tümü"],["in","Gelir"],["out","Gider"],["save","Tasarruf"]].map(([k,l])=>`<button data-act="txtype" data-k="${k}" aria-pressed="${view.txType===k}">${l}</button>`).join("")}</div></div>
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
/* zekât hatırlatması için: ana portföyün bir sonraki zekât günü ve hesaplanan tutar (tutar yalnızca cihazda kalır) */
function zakatNote(){try{const mp=mainPf();if(!mp)return null;const z=zakat(mp.id);if(!z.hawl||!z.hawl.next)return null;return{d:z.hawl.next,left:Math.round(z.left*rate(S().base)),reached:!!z.reached}}catch(e){return null}}
async function notifSnap(){
  if(!notifOnLocal()||!state||!("caches" in window))return;
  try{
    const D=state.day,t=todayISO(),mp=mainPf();
    const ref=D?(D.d===t?D.ref:(D.cur&&Object.keys(D.cur).length?{d:D.d,h:D.cur}:D.ref)):null;
    const per=n=>{try{const b=mp&&benchCalc([mp.id],n);return b&&b.days>=Math.min(n,3)?{from:b.from,pct:+b.items[0].v.toFixed(2)}:null}catch(e){return null}};
    const ma=monthAgg(t.slice(0,7));
    const snap={zk:zakatNote(),alerts:alertsOut(),prefs:notifPrefs(),per:{w:per(7),m:per(31)},mon:{ym:t.slice(0,7),n:MONTHS[+t.slice(5,7)-1],i:Math.round(ma.i*rate(S().base)),o:Math.round(ma.o*rate(S().base))},at:Date.now(),hide:!!S().hide,auto:S().autoPrices!==false,rates:S().rates,urls:marketUrls().map(u=>new URL(u,location.href).href),open:location.href.split("#")[0],
      ref:ref&&ref.h?{d:ref.d,u:Object.fromEntries(Object.entries(ref.h).map(([k,v])=>[k,v.u]))}:null,
      pfs:state.portfolios.map(p=>({n:p.name,main:!!mp&&p.id===mp.id,hs:p.holdings.filter(h=>+h.qty>0).map(h=>{
        const sy=(h.symbol||"").toUpperCase().trim(),gk=h.cur==="TRY"?(h.kind==="altin"?goldKey(h):h.kind==="gumus"?"gumus":null):null;
        return{id:h.id,n:h.name,q:+h.qty,cur:h.cur,last:effPrice(h).p,g:gk||undefined,k:!gk&&sy?[h.kind+":"+sy].concat(h.kind==="abd"?["hisse:"+sy]:[]):undefined,buy:h.buyDate||undefined,cu:costIn(h,"TRY")/+h.qty}})})).filter(p=>p.hs.length)};
    await(await caches.open(NK)).put(notifKey(),new Response(JSON.stringify(snap),{headers:{"content-type":"application/json"}}));
  }catch(e){}
  notifSync();
}
/* cihazın bildirim ayarları (yalnızca bu cihazda): d günlük özet, t saat, we hafta sonu, w haftalık, m aylık, bm büyük hareket eşiği (%) */
const NP="emanet-notif-prefs";
function notifPrefs(){let p={};try{p=JSON.parse(localStorage.getItem(NP)||"{}")||{}}catch(e){}
  return{d:p.d!==false,t:/^\d\d:\d\d$/.test(p.t)?p.t:"18:30",we:!!p.we,w:!!p.w,m:!!p.m,bm:+p.bm>0?+p.bm:0,zk:p.zk!==false}}
function notifPrefSet(k,v){const p=notifPrefs();p[k]=v;try{localStorage.setItem(NP,JSON.stringify(p))}catch(e){}notifSnap();notifSync(true);render()}
/* büyük hareket uyarısı için: ana portföyün hangi fiyata yüzde kaç bağlı olduğu (tutar yok) */
function notifWeights(){
  const mp=mainPf(),w={};if(!mp||!market)return w;
  const hs=mp.holdings.filter(h=>+h.qty>0),V=hs.reduce((a,h)=>a+hVal(h),0);if(!(V>0))return w;
  const add=(k,x)=>{w[k]=+((w[k]||0)+x).toFixed(3)};
  hs.forEach(h=>{const sh=hVal(h)/V,sy=(h.symbol||"").toUpperCase().trim();
    const gk=h.cur==="TRY"?(h.kind==="altin"?goldKey(h):h.kind==="gumus"?"gumus":null):null;
    if(gk&&market.gold&&+market.gold[gk]>0)add("gold:"+gk,sh);
    else if(sy&&market.quotes){const k=[h.kind+":"+sy].concat(h.kind==="abd"?["hisse:"+sy]:[]).find(x=>market.quotes[x]&&+market.quotes[x].p>0);if(k)add("q:"+k,sh)}
    if(h.cur!=="TRY")add("fx:"+h.cur,sh)});
  return w;
}
let nsT=null;
function notifSync(now){
  if(!notifOnLocal()||!cloudOn())return;
  clearTimeout(nsT);nsT=setTimeout(async()=>{try{
    const reg=await swReady(),sub=await reg.pushManager.getSubscription();if(!sub)return;
    const pr=notifPrefs(),row={endpoint:sub.endpoint,user_id:sbUser.id,prefs:{...pr,zd:pr.zk?((zakatNote()||{}).d||undefined):undefined,off:-new Date().getTimezoneOffset(),al:alertsOut().map(a=>({id:a.id,k:a.k,op:a.op,v:a.v}))},weights:pr.bm?notifWeights():{}};
    const sig=JSON.stringify(row);if(sig===localStorage.getItem("emanet-notif-sent"))return;
    const {error}=await sb.from("emanet_push").upsert(row,{onConflict:"endpoint"});
    if(!error)localStorage.setItem("emanet-notif-sent",sig);
    else if(now)toast(/column|prefs|weights|schema cache/i.test(error.message||"")?"Ayar kaydedilemedi: Supabase'de bildirim kurulum SQL'inin yeni hâlini çalıştırmanız gerekiyor.":"Bildirim ayarı kaydedilemedi: "+(error.message||""));
  }catch(e){}},now?300:8000);
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
      const pr=notifPrefs(),row={endpoint:sub.endpoint,user_id:sbUser.id,prefs:{...pr,off:-new Date().getTimezoneOffset()},weights:{}};
      const {error}=await sb.from("emanet_push").upsert(row,{onConflict:"endpoint"});
      if(error)throw new Error(/emanet_push|relation|schema cache|not find|column/i.test(error.message||"")?"Bildirim tablosu kurulmamış ya da eski; Supabase'de kurulum SQL'inin son hâlini bir kez çalıştırmak gerekiyor.":"Cihaz kaydedilemedi: "+(error.message||"bilinmeyen hata"));
      localStorage.setItem(NK,"1");localStorage.removeItem("emanet-notif-sent");await notifSnap();toast("Gün sonu bildirimi bu cihazda açıldı");
    }else{
      if(sub){try{if(sb)await sb.from("emanet_push").delete().eq("endpoint",sub.endpoint)}catch(e){}await sub.unsubscribe()}
      localStorage.removeItem(NK);localStorage.removeItem("emanet-notif-sent");try{await caches.delete(NK)}catch(e){}
      toast("Gün sonu bildirimi bu cihazda kapatıldı");
    }
  }catch(e){toast(e.message||"Bildirim ayarlanamadı")}
  render();
}
async function notifTest(kind){
  try{await notifSnap();const reg=await swReady();if(!reg.active)throw new Error("Uygulama dosyaları henüz hazır değil.");reg.active.postMessage({type:"gun-sonu",test:true,kind:kind||"daily"});toast("Deneme bildirimi gönderildi")}
  catch(e){toast(e.message||"Deneme bildirimi gönderilemedi")}
}
/* Fiyat alarmı: bir fiyat belirlenen sınırın üstüne çıkınca ya da altına inince bildirim. Sınır yeniden aşılınca yeniden haber verir. */
function alertInstruments(){
  const out=[],seen={},add=(k,n,cur,p)=>{if(!seen[k]&&p>0){seen[k]=1;out.push({k,n,cur,p})}};
  if(market){const g=market.gold||{};[["gram","Gram altın"],["ceyrek","Çeyrek altın"],["yarim","Yarım altın"],["tam","Tam altın"],["cumhuriyet","Cumhuriyet altını"],["ata","Ata altın"],["resat","Reşat altın"],["gumus","Gümüş (gram)"]].forEach(([k,n])=>add("gold:"+k,n,"TRY",+g[k]));
    const f=market.fx||{};add("fx:USD","Dolar","TRY",+f.USD);add("fx:EUR","Euro","TRY",+f.EUR);
    state.portfolios.forEach(p=>p.holdings.forEach(h=>{const sy=(h.symbol||"").toUpperCase().trim();if(!sy||!market.quotes)return;const k=[h.kind+":"+sy].concat(h.kind==="abd"?["hisse:"+sy]:[]).find(x=>market.quotes[x]&&+market.quotes[x].p>0);if(k)add("q:"+k,h.name+" ("+sy+")",market.quotes[k].cur||h.cur,+market.quotes[k].p)}))}
  return out;
}
const alertPrice=k=>{if(!market)return 0;const[a,...r]=k.split(":"),x=r.join(":");return a==="gold"?+(market.gold||{})[x]||0:a==="fx"?+(market.fx||{})[x]||0:+((market.quotes||{})[x]||{}).p||0};
const pnum=v=>fmtN(v,v<10?4:2);
function alertSheet(a){
  const ins=alertInstruments();if(a&&!ins.some(i=>i.k===a.k))ins.unshift({k:a.k,n:a.n,cur:a.cur,p:alertPrice(a.k)});
  if(!ins.length){toast("Fiyatlar henüz gelmedi; biraz sonra yeniden deneyin");return}
  formSheet({title:a?"Alarmı düzenle":"Fiyat alarmı ekle",fields:[
    {id:"k",label:"Hangi fiyat",type:"select",value:a?a.k:ins[0].k,options:ins.map(i=>[i.k,i.n])},
    {id:"op",label:"Ne zaman haber verilsin",type:"seg",value:a?a.op:"gte",options:[["gte","Üstüne çıkınca"],["lte","Altına inince"]]},
    {id:"v",label:"Sınır fiyat",type:"number",big:true,value:a?String(a.v).replace(".",","):"",ph:"0"}],
    extra:`<div class="note" id="alHint"></div>`,
    onOpen:(form,sh)=>{const u=()=>{const i=ins.find(x=>x.k===form.elements.k.value),h=sh.querySelector("#alHint");if(i&&h)h.textContent="Şu anki fiyat: "+pnum(i.p)+" "+i.cur+". Fiyatlar 10 dakikada bir denetlenir; bildirim 08:00–23:00 arasında gelir."};form.addEventListener("change",u);u()},
    onSave:v=>{const x=parseNum(v.v),i=ins.find(q=>q.k===v.k);if(!i)return"Bir fiyat seçin.";if(!(x>0))return"Sınır fiyatı girin.";
      if(v.op==="gte"&&i.p>=x)return"Fiyat zaten bu sınırın üstünde ("+pnum(i.p)+"). Daha yüksek bir sınır girin.";
      if(v.op==="lte"&&i.p<=x)return"Fiyat zaten bu sınırın altında ("+pnum(i.p)+"). Daha düşük bir sınır girin.";
      const d={k:i.k,n:i.n,cur:i.cur,op:v.op,v:x,on:true};if(a)Object.assign(a,d);else state.alerts.push({id:uid(),...d});commit(a?"Alarm güncellendi":"Alarm kuruldu");notifSync(true)},
    onDelete:a?()=>{state.alerts=state.alerts.filter(x=>x!==a);commit("Alarm silindi");notifSync(true)}:null});
}
const alertsOut=()=>(state.alerts||[]).filter(a=>a.on!==false).map(a=>({id:a.id,k:a.k,n:a.n,cur:a.cur,op:a.op,v:a.v}));
function alertsCard(on){
  const al=state.alerts||[];
  return `<section class="card"><div class="sec" style="margin-bottom:4px"><h2>Fiyat alarmları</h2><button class="btn ghost sm" data-act="alert-new">${ic(I.plus,14)}Alarm ekle</button></div>
    ${al.length?`<div class="list">${al.map(a=>{const p=alertPrice(a.k);return li({act:"alert-edit",id:a.id,mark:mkIcon(a.op==="gte"?I.trend:I.sell,a.op==="gte"?"--pos":"--neg"),title:esc(a.n),sub:(a.op==="gte"?"Üstüne çıkınca: ":"Altına inince: ")+pnum(a.v)+" "+esc(a.cur)+(p?" · şimdi "+pnum(p):""),trail:`<span class="chev">${ic(I.right,14)}</span>`})}).join("")}</div>`
      :`<div class="sub">Örneğin “gram altın 7.000’in üstüne çıkınca” ya da “bir fon şu fiyatın altına inince” haber verir.</div>`}
    ${al.length&&!on?`<div class="note warn" style="margin-top:8px">Alarmların gelmesi için bu cihazda bildirimleri açın.</div>`:""}</section>`;
}
function notifCard(){
  const on=notifOnLocal();
  const why=!notifSupport()?"Bu tarayıcı bildirimi desteklemiyor. iPhone ve iPad'de önce Safari'de Paylaş → Ana Ekrana Ekle ile uygulamayı kurun, sonra uygulamanın içinden burayı açın."
    :!cloudOn()?"Bildirim için e-posta ile giriş yapmış olmanız gerekir."
    :!CFG.vapidPublicKey?"Bildirim anahtarı tanımlı değil."
    :Notification.permission==="denied"?"Bu site için bildirim izni kapalı. Telefonun ya da tarayıcının ayarlarından Emanet için bildirime izin verin.":"";
  const p=notifPrefs();
  const tg=(k,label,small)=>`<div class="set-row"><div class="lbl"><b>${label}</b>${small?`<small>${small}</small>`:""}</div><label class="toggle"><input type="checkbox" data-np="${k}" ${p[k]?"checked":""}><span></span></label></div>`;
  const times=[];for(let h=7;h<24;h++)for(const m of ["00","30"])times.push(String(h).padStart(2,"0")+":"+m);
  const sel=(k,opts,val)=>`<select class="inline-in" style="width:auto;font-family:var(--f-body);text-align:left" data-np="${k}" aria-label="${k==="t"?"Bildirim saati":"Eşik"}">${opts.map(([v,l])=>`<option value="${v}" ${String(val)===String(v)?"selected":""}>${l}</option>`).join("")}</select>`;
  return `<section class="card"><div class="set-group">
    <div class="set-row"><div class="lbl"><b>Bildirimler</b><small>Bu cihaza bildirim gönderilsin. Aşağıdaki seçenekler her cihazda ayrı tutulur.</small></div><label class="toggle"><input type="checkbox" id="notifTog" ${on?"checked":""} ${why&&!on?"disabled":""}><span></span></label></div>
    ${why?`<div class="note warn">${why}</div>`:""}
  </div></section>
  ${on?`<section class="card"><h2 style="margin-bottom:4px">Özetler</h2><div class="set-group">
    ${tg("d","Gün sonu özeti","Ana portföyün günlük kâr/zararı; diğer portföyler altında")}
    <div class="set-row"><div class="lbl"><b>Saat</b><small>Özetler bu saatte, fiyatlar güncellendikten hemen sonra gelir</small></div>${sel("t",times.map(x=>[x,x]),p.t)}</div>
    ${tg("we","Hafta sonu da gönder","Altın, döviz ve kripto hafta sonu da oynar")}
    ${tg("w","Haftalık özet","Her cuma, haftanın değişimi")}
    ${tg("m","Aylık özet","Ayın son günü: gelir, gider, birikim oranı ve portföyün aylık değişimi")}
  </div></section>
  <section class="card"><h2 style="margin-bottom:4px">Uyarılar</h2><div class="set-group">
    <div class="set-row"><div class="lbl"><b>Büyük hareket uyarısı</b><small>Ana portföy gün içinde bu oranda yükselir ya da düşerse akşamı beklemeden haber verir (günde en çok bir kez, 08:00–23:00 arası)</small></div>${sel("bm",[[0,"Kapalı"],[1,"%1"],[1.5,"%1,5"],[2,"%2"],[3,"%3"],[5,"%5"]],p.bm)}</div>
    ${p.bm?`<div class="note">Bu uyarı için portföyünüzün yalnızca yüzde dağılımı (örneğin “%57 gram altın”) hesabınızda saklanır; tutarlar saklanmaz.</div>`:""}
    ${tg("zk","Zekât hatırlatması","Zekât gününden 7 gün ve 1 gün önce, bir de gününde, özet saatinde haber verir. Sunucuya yalnızca tarih gider, tutar gitmez.")}
  </div></section>
  ${alertsCard(true)}
  <section class="card"><h2 style="margin-bottom:4px">Deneme</h2><div class="set-group">
    <div class="set-row"><div class="lbl"><small>Bildirimin bu cihazda nasıl görüneceğini şimdi gösterir</small></div><div style="display:flex;gap:6px;flex-wrap:wrap">${[["daily","Gün sonu"],["weekly","Haftalık"],["monthly","Aylık"],["big","Büyük hareket"],["alert","Fiyat alarmı"],["zakat","Zekât"]].map(([k,l])=>`<button class="btn sm" data-act="notif-test" data-k="${k}">${l}</button>`).join("")}</div></div>
    <div class="note">Tutarlarınız sunucuya gönderilmez; bildirimin metni bu cihazda hesaplanır. “Tutarları gizle” açıksa yalnızca yüzdeler yazar. Telefon pil tasarrufundaysa bildirim gecikebilir.</div>
  </div></section>`:alertsCard(false)}`;
}

/* ---------- getiri karşılaştırması ----------
   Portföy getirisi "zaman ağırlıklı" hesaplanır: para ekleyip çekmek getiriyi değiştirmez, yalnızca fiyat hareketi ölçülür.
   Günler arası para girişi = maliyet değişimi; satışta elde edilen para maliyet + kâr olduğundan satış kârı ayrıca düşülür.
   Altın ve dolar, her günün kaydındaki gram fiyatı ve kurdan; BIST 100, fiyat görevinin tuttuğu günlük kapanışlardan gelir. */
function histRows(ids,range){
  const by={};
  ids.forEach(id=>histOf(id).forEach(r=>{const o=by[r[0]]=by[r[0]]||{v:0,c:0,usd:r[3],g:r[4]};o.v+=r[1];o.c+=r[2]}));
  let rows=Object.keys(by).sort().map(d=>({d,...by[d]}));
  if(range&&typeof range==="object")rows=rows.filter(r=>r.d>=range.from&&r.d<=range.to);
  else if(range&&range!=="all"){const from=addDays(todayISO(),-range);rows=rows.filter(r=>r.d>=from)}
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
function txRow(t){const card=t.type==="card"?cardById(t.card):null,mc=t.method&&cardById(t.method),inc=t.type==="in",cp=t.type==="card",sv=t.type==="save",g=sv&&t.goal&&(state.goals||[]).find(x=>x.id===t.goal);
  return li({act:"edit-tx",id:t.id,mark:mkIcon(cp?I.card:catIcon(t.cat),cp?"--c2":catColor(t.cat)),title:cp?"Kart ödemesi":esc(t.cat),
    sub:[sv?"Tasarruf"+(g?" · "+esc(g.name):"")+(t.buy?" · portföye alındı":""):"",cp?esc(card?card.name:"kart"):"",mc?esc(mc.name):"",t.inst?"Taksit "+t.inst:"",t.rid?"Sabit":"",esc(t.note||"")].filter(Boolean).join(" · "),
    amount:(inc?"+":cp||sv?"":"−")+fmt(t.amount,t.cur),cls:inc?"pos-t":""})}
function txMatch(){
  const q=trLow((view.txQ||"").trim()),cat=view.txCat||"",ty=view.txType||"all";
  const dq=q.replace(/[.\s₺]/g,"").replace(",","."),isNum=/^\d+(\.\d+)?$/.test(dq);
  const list=(q?state.tx:monthTx(view.month)).filter(t=>{
    if(ty!=="all"&&!(ty==="out"?(t.type==="out"||t.type==="card"):t.type===ty))return false;
    if(cat&&t.cat!==cat)return false;
    if(!q)return true;
    const c=cardById(t.card)||cardById(t.method);
    if(trLow([t.cat,t.note,c&&c.name,fmtDate(t.date),t.type==="card"?"kart ödemesi":t.type==="save"?"tasarruf":""].filter(Boolean).join(" ")).includes(q))return true;
    return isNum&&String(+t.amount).startsWith(String(+dq));
  }).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  return{list,q,active:!!(q||cat)};
}
function txList(){
  const {list,q,active}=txMatch();
  if(!list.length)return `<div class="empty">${emptyIc(active?I.search:I.akis)}<b>${active?"Eşleşen işlem yok":"Bu ay kayıt yok"}</b>${active?"Aramayı ya da kategori seçimini değiştirin.":"Gelir, gider ya da tasarruf ekleyin; fişin fotoğrafından da doldurabilirsiniz."}${active?"":emptyBtn("tx-add","İşlem ekle")}</div>`;
  let i=0,o=0,sv=0;list.forEach(t=>{const v=toBase(t.amount,t.cur);if(t.type==="in")i+=v;else if(t.type==="out")o+=v;else if(t.type==="save")sv+=v});
  const N=200,groups={};list.slice(0,N).forEach(t=>(groups[t.date]=groups[t.date]||[]).push(t));
  return (active?`<div class="tx-sum"><span>${q?"Tüm aylarda ":""}<b>${list.length}</b> işlem</span>${o?`<span>Gider <b class="num">${fmt(o)}</b></span>`:""}${i?`<span>Gelir <b class="num pos-t">${fmt(i)}</b></span>`:""}${sv?`<span>Tasarruf <b class="num">${fmt(sv)}</b></span>`:""}<button class="btn ghost sm" data-act="txclear">Temizle</button></div>`:"")
    +Object.entries(groups).map(([d,ts])=>`<div class="label" style="margin-top:10px">${fmtDate(d)}</div><div class="list">${ts.map(txRow).join("")}</div>`).join("")
    +(list.length>N?`<div class="sub" style="margin-top:8px">İlk ${N} işlem gösteriliyor; aramayı daraltın.</div>`:"");
}
function txFilterBar(){
  const cats=[...new Set([...CATS.out,...CATS.in,...CATS.save,...state.tx.map(t=>t.cat).filter(Boolean)])];
  return `<div class="txf"><label class="search">${ic(I.search,18)}<span class="sr">İşlemlerde ara</span><input id="txQ" type="search" enterkeyhint="search" placeholder="Not, kategori ya da tutar ara" value="${esc(view.txQ||"")}" autocomplete="off"></label>
    <select id="txCat" aria-label="Kategoriye göre süz"><option value="">Tüm kategoriler</option>${cats.map(c=>`<option value="${esc(c)}" ${view.txCat===c?"selected":""}>${esc(c)}</option>`).join("")}</select></div>`;
}
/* grafik etkileşimleri: yeniden çizim olmadan, yalnızca ilgili öğeler güncellenir */
function histScrub(e){
  const w=e.target.closest&&e.target.closest(".hist-wrap");if(!w)return;
  const pts=JSON.parse(w.dataset.pts||"[]");if(!pts.length)return;
  const r=w.getBoundingClientRect(),fx=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));
  let b=pts[0];for(const p of pts)if(Math.abs(p[0]-fx)<Math.abs(b[0]-fx))b=p;
  const c=w.querySelector(".hcur");c.hidden=false;c.style.left=(b[0]*100)+"%";c.querySelector(".hd").style.top=(b[1]*100)+"%";
  const t=c.querySelector(".ht");t.textContent=b[2]+" · "+b[3];t.classList.toggle("left",b[0]>.6);
}
document.addEventListener("pointermove",histScrub);
document.addEventListener("pointerdown",histScrub);
document.addEventListener("pointerout",e=>{const w=e.target.closest&&e.target.closest(".hist-wrap");if(w&&!w.contains(e.relatedTarget)){const c=w.querySelector(".hcur");if(c)c.hidden=true}});
document.addEventListener("click",e=>{const b=e.target.closest("[data-taxrep]");if(!b)return;closeSheet();view.taxPf=b.dataset.taxrep;view.rpMode="vergi";view.rpYear=+todayISO().slice(0,4);view.tab="rapor";render();window.scrollTo(0,0)});
document.addEventListener("click",e=>{
  const dn=e.target.closest&&e.target.closest("[data-dn]");
  if(dn){const row=dn.closest(".donut-row");if(!row)return;const info=JSON.parse(row.dataset.dinfo),i=+dn.dataset.dn,on=row.dataset.sel!==String(i);
    row.dataset.sel=on?String(i):"";row.classList.toggle("sel",on);
    row.querySelectorAll("[data-dn]").forEach(x=>x.classList.toggle("on",on&&x.dataset.dn===String(i)));
    const d=on?info[i]:info[info.length-1],l=row.querySelector(".ctr-l"),v=row.querySelector(".ctr-v");
    l.textContent=on?d[0].replace(/\s*\(.*\)/,"").slice(0,14)+" "+d[1]:"Toplam";v.textContent=d[2];return}
  const fb=e.target.closest&&e.target.closest(".fbar");
  if(fb){const box=fb.closest(".flow-box"),on=!fb.classList.contains("on");box.querySelectorAll(".fbar").forEach(x=>x.classList.toggle("on",on&&x===fb));box.classList.toggle("sel",on);
    const tip=box.querySelector(".flow-tip");if(tip)tip.textContent=on?fb.dataset.fl:"";return}
});
document.addEventListener("change",e=>{if(e.target.id==="tgAdd"){view.tgAdd=e.target.value;render()}});
document.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.id==="tgAdd"){e.preventDefault();view.tgAdd=e.target.value;render()}});
document.addEventListener("input",e=>{if(e.target.id==="txQ"){view.txQ=e.target.value;const l=$("#txList");if(l)l.innerHTML=txList()}});
document.addEventListener("change",e=>{
  if(e.target.id==="txCat"){view.txCat=e.target.value;render()}
  if(e.target.dataset&&e.target.dataset.np){const k=e.target.dataset.np;notifPrefSet(k,e.target.type==="checkbox"?e.target.checked:k==="bm"?+e.target.value:e.target.value)}
  if(e.target.id==="autoDark"){S().theme=e.target.checked?"system":"light";commit()}
  if(e.target.id==="notifTog"){e.target.disabled=true;notifSet(e.target.checked)}
});

function debtRow(d){
  const left=debtLeft(d),tot=+d.amount||0,pct=tot?(tot-left)/tot*100:0,lent=d.dir==="lent";
  let st="";
  if(left<=0)st=`<span class="pill pos">Kapandı</span>`;
  else if(d.due){const n=daysBetween(todayISO(),d.due);st=n<0?`<span class="pill neg">${-n} gün gecikti</span>`:n<=14?`<span class="pill warn">${n} gün kaldı</span>`:`<span class="pill">${fmtDate(d.due)}</span>`}
  const pf=state.portfolios.length>1&&d.pf?(state.portfolios.find(p=>p.id===d.pf)||{}).name:"";
  return li({act:"open-debt",id:d.id,mark:mk(esc((d.person||"?").trim().slice(0,1).toUpperCase()),lent?"--pos":"--neg"),title:esc(d.person),
    sub:(lent?"Alacak":"Borç")+(pf?" · "+esc(pf):"")+" · "+fmt(tot-left,d.cur)+" / "+fmt(tot,d.cur)+" ödendi"+(isG(d.cur)&&left>0&&rate(d.cur)?" · ≈ "+fmt(toBase(left,d.cur),null,{dec:0}):""),
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
  <section class="card">${list.length?`<div class="list">${list.map(debtRow).join("")}</div>`:`<div class="empty">${emptyIc(I.borc)}<b>${view.debtDir==="lent"?"Verdiğiniz bir borç yok":"Aldığınız bir borç yok"}</b>Kişiyi, tutarı ve vadeyi girin; ödemeleri parça parça işleyin.</div>`}</section>`;
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
const TONES=[["gri","Porselen",["#f2f4f9","#ffffff","#e9edf5","#dce2ed"],["#0b1020","#131a2e","#1b2440","#263050"]],["duman","Gri",["#e3e5e9","#f6f7f9","#d8dbe1","#c9ced7"],["#121315","#1b1d20","#25282c","#33373d"]],["mavi","Açık mavi",["#dbe8f8","#f6faff","#c9dcf3","#b6cdea"],["#081326","#0f1d36","#172949","#22365c"]],["adacayi","Açık yeşil",["#dfeee3","#f6fbf7","#cde3d3","#bad5c2"],["#0d1511","#141e19","#1c2922","#29382f"]],["krem","Krem",["#f6f1e8","#fffdf9","#eee6d8","#e2d9c8"],["#15120d","#1e1a14","#28231b","#393226"]],["lavanta","Lavanta",["#eeebf7","#fefdff","#e2ddf1","#d3cce6"],["#100d1c","#181429","#221d38","#30294c"]],["gul","Gül kurusu",["#f7ecee","#fffdfd","#f0dde1","#e5cdd2"],["#190e11","#22151a","#2e1d23","#402a32"]]];
/* tema galerisi: açık temalar bir ton seçer; koyu temalar koyu görünümü sabitler */
/* koyu temalar: [anahtar, ad, önizleme renkleri]. İlk ikisi açık tonların koyu hâlidir; diğerleri yalnızca koyu temada vardır */
const DARKS=[["gri","Gece",["#0b1020","#131a2e","#1b2440","#263050"]],["duman","Kömür",["#121315","#1b1d20","#25282c","#33373d"]],["antrasit","Antrasit",["#1d1f23","#272a2f","#31353b","#3f444c"]],["kursun","Kurşun gri",["#2a2d32","#353940","#40454d","#50565f"]],["sicakgri","Sıcak gri",["#24221f","#2f2c28","#3a3632","#4a4540"]],["lacivert","Gece mavisi",["#151d30","#1e2840","#28344f","#364462"]]];
const DARK_ONLY=["antrasit","kursun","sicakgri","lacivert"];
function rAyarlar(){
  const s=S(), zo=zOwner(), hh=getHawl(zo);
  const seg=(key,opts)=>`<div class="seg" role="group">${opts.map(([v,l])=>`<button data-act="set" data-k="${key}" data-v="${v}" aria-pressed="${s[key]===v}">${l}</button>`).join("")}</div>`;
  const tog=(key,label,small,path)=>{const val=path?s[path][key]:s[key];return `<div class="set-row"><div class="lbl"><b>${label}</b>${small?`<small>${small}</small>`:""}</div><label class="toggle"><input type="checkbox" id="t-${path||"s"}-${key}" data-act="tog" data-k="${key}" ${path?`data-p="${path}"`:""} ${val?"checked":""}><span></span></label></div>`};
  const num=(id,label,val,small)=>`<div class="set-row"><div class="lbl"><b>${label}</b>${small?`<small>${small}</small>`:""}</div><input class="inline-in" id="${id}" inputmode="decimal" data-act="num" data-k="${id}" value="${esc(String(val).replace(".",","))}"></div>`;
  const dark=s.theme==="dark"||(s.theme!=="light"&&window.matchMedia("(prefers-color-scheme:dark)").matches);
  const acc=ACCENTS.some(x=>x[0]===s.accent)?s.accent:"kobalt",tone=TONES.some(x=>x[0]===s.tone)||DARK_ONLY.includes(s.tone)?s.tone:"gri",fixedDark=s.theme==="dark";
  const accHex=(ACCENTS.find(x=>x[0]===acc)||ACCENTS[0]);
  const tile=(k,l,c,th,on)=>`<button class="tone" data-act="theme" data-th="${th}" data-v="${k}" aria-pressed="${on}" aria-label="${l}"><span class="tone-p" style="background:${c[0]};border-color:${c[3]}" aria-hidden="true"><span style="background:${c[1]};border-color:${c[3]}"><i style="background:${accHex[th==="dark"?3:2]}"></i><i style="background:${c[2]}"></i><i style="background:${c[2]}"></i></span></span><span class="tone-n">${on?ic(I.check,14):""}${l}</span></button>`;
  const G={};
  G.gorunum=`<section class="card"><div class="set-group">
    <div class="set-row col"><div class="lbl"><b>Vurgu rengi</b><small>${(ACCENTS.find(x=>x[0]===acc)||ACCENTS[0])[1]}</small></div><div class="swatches">${ACCENTS.map(([k,l,c,d])=>`<button class="sw" data-act="set" data-k="accent" data-v="${k}" aria-pressed="${acc===k}" aria-label="${l}" title="${l}" style="--sw:${dark?d:c};color:${dark?"#0b1020":"#fff"}">${acc===k?ic(I.check,18):""}</button>`).join("")}</div></div>
    <div class="set-row col"><div class="lbl"><b>Tema</b><small>${fixedDark?(DARKS.find(d=>d[0]===tone)||DARKS[0])[1]:(TONES.find(x=>x[0]===tone)||[0,"Gri"])[1]}${s.theme==="system"&&dark?" · şu an koyu hâli":""}</small></div>
      <div class="tones">${TONES.map(([k,l,lt])=>tile(k,l,lt,"light",!fixedDark&&tone===k)).join("")}</div>
      <div class="label" style="margin-top:4px">Koyu temalar</div>
      <div class="tones">${DARKS.map(([k,l,c])=>tile(k,l,c,"dark",fixedDark&&(tone===k||(k==="gri"&&!DARKS.some(d=>d[0]===tone))))).join("")}</div></div>
    <div class="set-row"><div class="lbl"><b>Gece otomatik koyulaş</b><small>Telefon ya da bilgisayar koyu moddayken seçtiğiniz temanın koyu hâli kullanılır</small></div><label class="toggle"><input type="checkbox" id="autoDark" ${s.theme==="system"?"checked":""} ${fixedDark?"disabled":""}><span></span></label></div>
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
    ${tog("autoPrices","Fiyatları otomatik al","Döviz, altın, hisse, fon ve kripto fiyatları yaklaşık 10 dakikada bir kendiliğinden yenilenir")}
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
    ${cloudOn()?`<div class="set-row"><div class="lbl"><b>Otomatik yedek</b><small>Her günün son hâli hesabınızda saklanır (35 gün). Yanlışlıkla silinen bir şeyi buradan geri getirebilirsiniz.</small></div><button class="btn sm" data-act="backups">Yedekleri göster</button></div>`:""}
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
        k==="abd"?"ABD borsasındaki hisseler dolar cinsinden izlenir. Kodu girin (ör. AAPL); fiyat birkaç dakika içinde gelir.":
        k==="hisse"?"Borsa İstanbul hisseleri. Adını veya kodunu yazdıkça öneriler çıkar.":
        k==="fon"?"TEFAS fon kodunu girin (ör. TTE); birim pay fiyatı birkaç dakika içinde gelir. Satışta stopaj kesintisini girebilirsiniz.":
        k==="ppf"?"Para piyasası fonları da TEFAS'tan fiyatlanır. Fon kodunu girin; fiyat birkaç dakika içinde gelir. Satışta stopaj kesintisini girebilirsiniz.":
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
    onSave:v=>{if(v.kind==="hisse"&&/^[A-Za-z0-9]{3}$/.test((v.symbol||"").trim()))v.kind="fon";   // 3 karakterli kod TEFAS fonudur
      const qty=multiT?+h.qty:parseNum(v.qty);if(multiT)v.buyDate=h.buyDate||"";
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
  const dvb=hDiv(h),pl=val-cs+dvb,plp=cs?pl/cs*100:0;
  const rest=`      ${(()=>{const u=ufeInfo(h);if(!u)return ufe&&!h.buyDate?`<div><span>Yİ-ÜFE'ye göre</span><span class="sub" style="font-family:var(--f-body)">alış tarihi gerekli</span></div>`:"";const inc=(u.ratio-1)*100;
        const lotRows=u.lots.map(l=>`<div class="ufe-l"><span>${fmtDate(l.date)} · ${fmtN(l.q,4)} adet<small>TL maliyet ${fmt(toBase(l.cost,"TRY"),null,{dec:0})} · endeks ${fmtPct((l.k-1)*100)}${l.k>=1.1?" · vergide endekslenir":" · %10'un altında, vergide endekslenmez"}${l.fxPending?" · alış günü kuru bekleniyor":""}</small></span><b class="num">${fmt(toBase(l.real,"TRY"),null,{dec:0})}</b></div>`).join("");
        return `<div><span>Yİ-ÜFE ile güncel TL maliyet<br><small class="sub">${u.multi?u.lots.length+" alım ayrı ayrı · ortalama artış ":"endeks artışı "}${fmtPct(inc)} · ${fmtYM(u.to)} endeksine göre</small></span><span>${fmt(u.cost)}</span></div>
        <div><span>Reel kâr/zarar (Yİ-ÜFE)</span><span class="${val>=u.cost?"pos-t":"neg-t"}">${fmt(val-u.cost)} (${fmtPct(u.cost?(val-u.cost)/u.cost*100:0)})</span></div>
        ${Math.abs(u.taxCost-u.cost)>1||u.lots.some(l=>l.k>=1.1)?`<div><span>Vergi için endekslenmiş maliyet<br><small class="sub">yalnızca artışı %10'u bulan alımlar</small></span><span>${fmt(u.taxCost)}</span></div>`:""}
        ${u.multi?`<details class="ufe-d"><summary>Alımlar tek tek</summary>${lotRows}</details>`:""}
        <div class="kv-note">Satışlarda en eski alımdan düşülür (ilk giren ilk çıkar). Endeksleme, alış ayından önceki ayın Yİ-ÜFE'sinden ${fmtYM(u.to)} ayına göre yapılır ve yalnızca artış %10'u bulursa vergide uygulanabilir. Kesin vergi hesabı için mali müşavirinize danışın.</div>${h.cur!=="TRY"?`<div class="kv-note"><button type="button" class="btn sm" data-taxrep="${pf.id}">${ic(I.trend,14)}Yıllık vergi raporunu aç</button></div>`:""}`})()}
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
      ${dvb?`<div class="w2"><span class="label">Alınan temettü / kâr payı · toplam K/Z'ye dahil</span><b class="num pos-t">+${fmt(+h.divs,h.cur)}</b></div>`:""}
    </div>
    ${rest?`<div class="kv">${rest}</div>`:""}
    <div class="sec sh-sec2"><div class="label sh-sec" style="margin:0">İşlem geçmişi</div>${h.kind!=="bes"&&!CASH_KINDS.includes(h.kind)?`<button class="btn ghost sm" id="hDiv">${ic(I.plus,14)}Temettü ekle</button>`:""}</div>
    ${tr.length?`<div class="list">${tr.map(t=>tradeRow(h,t,false,pfId)).join("")}</div><div class="sub" style="margin-top:6px">Düzenlemek veya silmek için bir işleme dokunun.</div>`:`<div class="sub" style="padding:4px 0 8px">Bu varlık için işlem kaydı yok. Yeni alım ve satışlar burada listelenir.</div>`}
    <div class="actions eq"><button class="btn primary" id="hBuy">${ic(I.buy)}Alım ekle</button>${+h.qty>0?`<button class="btn" id="hSell">${ic(I.sell)}Satış yap</button>`:""}<button class="btn" id="hEdit">${ic(I.edit)}Düzenle</button></div>`,sh=>{
      sh.querySelector("#hEdit").onclick=()=>{closeSheet();holdingSheet(pfId,h)};
      sh.querySelector("#hBuy").onclick=()=>{closeSheet();tradeSheet(pfId,h,"buy")};
      const sb=sh.querySelector("#hSell");if(sb)sb.onclick=()=>{closeSheet();tradeSheet(pfId,h,"sell")};
      const db=sh.querySelector("#hDiv");if(db)db.onclick=()=>{closeSheet();divSheet(pfId,h)};
      sh.querySelectorAll('[data-act="edit-tr"]').forEach(b=>b.onclick=()=>{const t=(h.trades||[]).find(x=>x.id===b.dataset.id);if(t){closeSheet();t.type==="div"?divSheet(pfId,h,t):tradeSheet(pfId,h,t.type,t)}});
    });
}
const defTax=h=>{const r=(S().whtRates||{})[h.kind];return r!=null&&r!==""?r:""};
function divSheet(pfId,h,tr){
  const isMain=mainPf()&&mainPf().id===pfId,linked=tr&&tr.txId&&state.tx.find(x=>x.id===tr.txId);
  formSheet({title:(tr?"Temettüyü düzenle":"Temettü / kâr payı ekle")+" · "+esc(h.name),fields:[
    [{id:"amount",label:"Hesaba geçen net tutar ("+h.cur+")",type:"number",big:true,value:tr?tr.amount:"",ph:"0"},{id:"date",label:"Ödeme tarihi",type:"date",value:tr?(tr.date||""):todayISO()}],
    {id:"tax",label:"Kesilen stopaj (isteğe bağlı)",type:"number",value:tr&&tr.tax?tr.tax:"",ph:"0"},
    ...(isMain&&!tr?[{id:"toTx",label:"Gelir-Gider'e de gelir olarak yazılsın mı",type:"seg",value:"no",options:[["no","Hayır"],["yes","Evet"]]}]:[]),
    {id:"note",label:"Not",value:tr?(tr.note||""):"",ph:"İsteğe bağlı"}],
    extra:`<div class="note">Temettü varlığın toplam kâr/zararına eklenir; adedi ve ortalama maliyeti değiştirmez. Para aracı kurumda kalıyorsa Gelir-Gider'e yazmanız gerekmez; bankanıza geçtiyse yazın, böylece nakit bakiyeniz doğru kalır.${linked?" Bu kayıt Gelir-Gider'deki bir gelirle bağlı; tutarı ve tarihi orada da güncellenir.":""}</div>`,
    onSave:v=>{const a=parseNum(v.amount);if(!(a>0))return"Tutar sıfırdan büyük olmalı.";if(!v.date)return"Tarih seçin.";if(v.date>todayISO())return"Tarih ileri olamaz.";
      const tx_=v.tax.trim()?parseNum(v.tax):0;if(isNaN(tx_)||tx_<0)return"Stopajı kontrol edin.";
      ensureTrades(h);let t=tr&&h.trades.find(x=>x.id===tr.id);if(!t){t={id:uid(),type:"div"};h.trades.push(t)}
      if(t.date!==v.date)delete t.fx;
      Object.assign(t,{date:v.date,amount:a,tax:tx_||undefined,note:v.note.trim()||undefined});if(h.cur!=="TRY"&&!t.fx){const f=fxLookup(v.date);if(f)t.fx=f}
      if(!tr&&v.toTx==="yes"){const cat=CATS.in.find(c=>/yatırım|temettü/i.test(c))||CATS.in[0],id=uid();state.tx.push({id,type:"in",amount:a,cur:h.cur,cat,date:v.date,note:h.name+" temettüsü",method:""});t.txId=id}
      if(linked){linked.amount=a;linked.date=v.date}
      rebuild(h);commit(tr?"Temettü güncellendi":"Temettü eklendi · "+fmt(a,h.cur)+(t.txId&&!tr?" · gelire de yazıldı":""))},
    onDelete:tr?()=>{h.trades=h.trades.filter(x=>x.id!==tr.id);if(linked)state.tx=state.tx.filter(x=>x!==linked);rebuild(h);commit("Temettü silindi"+(linked?" · bağlı gelir kaydı da silindi":""))}:null});
}
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
      if(!t.fx){const f=fxLookup(d);if(f)t.fx=f}
      const err=rebuild(h);if(err){Object.keys(h).forEach(k=>delete h[k]);Object.assign(h,JSON.parse(snap));return err}
      commit(tr?"İşlem güncellendi":buy?"Alım eklendi"+(h.fxAt&&h.fxAt.pending?" · alış günü kuru birazdan gelecek":""):(h.qty>0?"Satış kaydedildi":"Pozisyon kapandı")+(+t.tax?" · stopaj "+fmt(t.tax,h.cur):"")+" · net K/Z "+fmt(t.pl||0,h.cur));
    },
    onDelete:tr?()=>{const snap=JSON.stringify(h);h.trades=(h.trades||[]).filter(x=>x.id!==tr.id);
      if(!h.trades.length){state.portfolios.forEach(p=>p.holdings=p.holdings.filter(x=>x!==h));commit("Son işlem silindi, varlık kaldırıldı");return}
      const err=rebuild(h);if(err){Object.keys(h).forEach(k=>delete h[k]);Object.assign(h,JSON.parse(snap));toast(err);return}commit("İşlem silindi")}:null});
}
function tradeRow(h,t,showName,pfId){
  if(t.type==="div")return `<button class="row" type="button" data-act="edit-tr" data-pf="${pfId}" data-h="${h.id}" data-id="${t.id}">${mkIcon(I.coin,"--c5")}<div class="main"><div class="t">${showName?esc(h.name):"Temettü / kâr payı"}</div><div class="s">${showName?"Temettü · ":""}${t.date?fmtDate(t.date):"tarih yok"}${+t.tax?" · stopaj "+(S().hide?"••":fmtN(t.tax,2)):""}${t.txId?" · gelire yazıldı":""}${t.note?" · "+esc(t.note):""}</div></div><div class="end"><div class="num pos-t">+${S().hide?"••••":fmt(+t.amount||0,h.cur)}</div></div></button>`;
  const tot=(+t.qty||0)*(+t.price||0),buy=t.type==="buy";
  return `<button class="row" type="button" data-act="edit-tr" data-pf="${pfId}" data-h="${h.id}" data-id="${t.id}">${mkIcon(buy?I.buy:I.sell,buy?"--pos":"--neg")}<span class="sr">${buy?"Alım":"Satış"}</span><div class="main"><div class="t">${showName?esc(h.name):`<span class="num">${fmtN(t.qty,4)} × ${S().hide?"••":fmtN(t.price,4)} ${esc(h.cur)}</span>`}</div><div class="s">${showName?`<span class="num">${fmtN(t.qty,4)} × ${S().hide?"••":fmtN(t.price,4)}</span> · `:""}${t.date?fmtDate(t.date):"tarih yok"}${+t.fee?" · komisyon "+(S().hide?"••":fmtN(t.fee,2)):""}${buy&&t.fx&&h.cur!=="USD"?" · USD "+fmtN(t.fx.USD,2):""}${buy&&t.fx&&h.cur==="USD"?" · kur "+fmtN(t.fx.USD,2):""}${!buy&&+t.tax?" · stopaj "+(S().hide?"••":fmtN(t.tax,2)):""}${t.legacy?" · açılış kaydı":""}${t.note?" · "+esc(t.note):""}</div></div><div class="end"><div class="num">${buy?"":"+"}${fmt(tot,h.cur)}</div>${!buy&&t.pl!=null?`<span class="pill ${t.pl>=0?"pos":"neg"}">K/Z ${fmt(t.pl,h.cur)}</span>`:""}</div></button>`;
}
/* ---------- fişten okuma ----------
   Fotoğraf cihazdan çıkmaz: yazı, uygulamayla birlikte gelen Tesseract (Apache 2.0) ile telefonda okunur.
   Okuma ilk kullanımda yaklaşık 6 MB dosya indirir. Sonuç doğrudan kaydedilmez; pencereyi doldurur, kullanıcı onaylar. */
/*<fis>*/
function parseReceipt(text,cats){
  const up=x=>x.toLocaleUpperCase("tr");
  const lines=text.split(/\r?\n/).map(l=>l.replace(/\s+/g," ").trim()).filter(Boolean),U=lines.map(up);
  const nums=l=>{const out=[],re=/(\d{1,3}(?:[. ]\d{3})+|\d+)\s?[.,]\s?(\d{2})(?!\d)/g;let m;while((m=re.exec(l)))out.push(parseFloat(m[1].replace(/[. ]/g,"")+"."+m[2]));return out};
  // tutar: önce "TOPLAM / TUTAR / ÖDENECEK" satırı (KDV ve ara toplam hariç), yoksa en büyük tutar
  let amount=null,how="";
  const key=/(GENEL\s*T[O0]PLAM|[ÖO]DENECEK|T[O0]PLAM|T[O0]P\b|TUTAR|TOTAL)/,skip=/(KDV|ARA\s*T[O0]PLAM|T[O0]PKDV|PARA\s*[ÜU]ST[ÜU]|N[AK]K[İI]T|[İI]ND[İI]R[İI]M|PUAN)/;
  const cand=[];U.forEach((l,i)=>{if(key.test(l)&&!skip.test(l)){let n=nums(lines[i]);if(!n.length&&U[i+1]&&!key.test(U[i+1]))n=nums(lines[i+1]);if(n.length)cand.push({v:Math.max(...n),g:/GENEL|[ÖO]DENECEK/.test(l)?2:/T[O0]PLAM/.test(l)?1:0,i})}});
  if(cand.length){cand.sort((a,b)=>b.g-a.g||b.i-a.i);amount=cand[0].v;how="toplam satırı"}
  else{const all=[];U.forEach((l,i)=>{if(!skip.test(l))all.push(...nums(lines[i]))});const ok=all.filter(v=>v>0&&v<1e6);if(ok.length){amount=Math.max(...ok);how="en büyük tutar"}}
  // tarih: gg.aa.yyyy, gg/aa/yyyy, gg-aa-yy
  let date=null;const today=new Date();
  for(const l of lines){const m=l.match(/(?<!\d)(\d{1,2})\s?[./-]\s?(\d{1,2})\s?[./-]\s?(\d{4}|\d{2})(?!\d)/);if(!m)continue;
    let d=+m[1],mo=+m[2],y=+m[3];if(y<100)y+=2000;if(d<1||d>31||mo<1||mo>12||y<2015)continue;
    const dt=new Date(y,mo-1,d);if(dt.getMonth()!==mo-1||dt>new Date(today.getTime()+864e5))continue;
    date=y+"-"+String(mo).padStart(2,"0")+"-"+String(d).padStart(2,"0");break}
  // satıcı: baştaki ilk anlamlı satır
  let shop="";for(const l of lines.slice(0,6)){const letters=(l.match(/[A-Za-zÇĞİÖŞÜçğıöşü]/g)||[]).length;if(letters>=4&&letters>=l.length*.6&&!/(F[İI]Ş|TAR[İI]H|SAAT|VKN|VERG[İI]|TEL|MERS[İI]S|TEŞEKK)/.test(up(l))){shop=l.replace(/[^0-9A-Za-zÇĞİÖŞÜçğıöşü&.\- ]/g,"").trim().slice(0,32);break}}
  // kategori: fişteki anahtar kelimelerden, kullanıcının kendi kategori adlarıyla eşleşen ilki
  const T=U.join(" "),rules=[[/(M[İI]GROS|B[İI]M\b|A101|A-101|ŞOK\b|CARREFOUR|MARKET|GIDA|MANAV|KASAP|FIRIN|EKMEK)/,/market|mutfak|gıda/i],[/(PETROL|OPET|SHELL|\bBP\b|AYGAZ|AKARYAKIT|BENZ[İI]N|MOTOR[İI]N|OTOPARK|HGS|OGS)/,/ulaşım|araç|yakıt/i],[/(ECZANE|HASTANE|KL[İI]N[İI]K|OPT[İI]K|SA[ĞG]LIK)/,/sağlık/i],[/(RESTORAN|RESTAURANT|LOKANTA|CAFE|KAFE|KAHVE|BURGER|P[İI]ZZA|D[ÖO]NER|KEBAP|PASTANE)/,/yemek|eğlence|restoran/i],[/(G[İI]Y[İI]M|TEKST[İI]L|AYAKKABI|LC ?WA[İI]K[İI]K[İI]|DEFACTO|KOTON)/,/giyim/i],[/(KIRTAS[İI]YE|K[İI]TAP|OKUL|KURS)/,/eğitim/i],[/(ELEKTR[İI]K|DO[ĞG]ALGAZ|SU FATURA|TELEKOM|TURKCELL|VODAFONE|[İI]NTERNET)/,/fatura/i],[/(MOB[İI]LYA|YAPI MARKET|KOÇTAŞ|BAUHAUS|[İI]KEA|HIRDAVAT|Z[ÜU]CC[İI]YE)/,/ev|eşya/i]];
  let cat="";for(const[re,cr]of rules){if(re.test(T)){const c=(cats||[]).find(x=>cr.test(x));if(c){cat=c;break}}}
  return{amount,how,date,shop,cat};
}
/*</fis>*/
const loadScript=src=>new Promise((res,rej)=>{const e=document.createElement("script");e.src=src;e.onload=res;e.onerror=()=>rej(new Error("Okuma dosyaları indirilemedi; internet bağlantınızı kontrol edin."));document.head.appendChild(e)});
async function receiptCanvas(file){
  let bmp;try{bmp=await createImageBitmap(file,{imageOrientation:"from-image"})}catch(e){bmp=await createImageBitmap(file)}
  const sc=Math.min(1,2000/Math.max(bmp.width,bmp.height)),c=document.createElement("canvas");c.width=Math.round(bmp.width*sc);c.height=Math.round(bmp.height*sc);
  const x=c.getContext("2d",{willReadFrequently:true});x.drawImage(bmp,0,0,c.width,c.height);
  // gri ton + kontrast: ısıl kâğıttaki soluk yazıyı belirginleştirir
  const im=x.getImageData(0,0,c.width,c.height),d=im.data;let lo=255,hi=0;const g=new Uint8Array(d.length/4);
  for(let i=0,j=0;i<d.length;i+=4,j++){const v=(d[i]*299+d[i+1]*587+d[i+2]*114)/1000|0;g[j]=v;if(v<lo)lo=v;if(v>hi)hi=v}
  const k=255/Math.max(1,hi-lo);for(let i=0,j=0;i<d.length;i+=4,j++){const v=Math.max(0,Math.min(255,(g[j]-lo)*k));d[i]=d[i+1]=d[i+2]=v}
  x.putImageData(im,0,0);return c;
}
async function readReceipt(file,onProg,psm){
  if(!window.Tesseract)await loadScript("js/vendor/tesseract/tesseract.min.js");
  const base=new URL("js/vendor/tesseract/",location.href).href,canvas=await receiptCanvas(file);
  const w=await window.Tesseract.createWorker("tur",1,{workerPath:base+"worker.min.js",corePath:base,langPath:base,gzip:true,logger:m=>{if(onProg&&m.status==="recognizing text")onProg(m.progress)}});
  try{await w.setParameters({tessedit_pageseg_mode:psm||"4",preserve_interword_spaces:"1"});const r=await w.recognize(canvas);return r.data.text||""}finally{w.terminate()}
}
function methodOpts(){return [["cash","Nakit / banka kartı"],...state.cards.map(c=>[c.id,"Kart · "+c.name])]}
/* İşlem eklerken hazır düğmeler: son 120 günde en az iki kez girilen aynı kategori+tutar, sonra en son girilenler */
function quickTx(){
  const from=new Date(Date.now()-120*864e5).toISOString().slice(0,10),by=new Map();
  state.tx.filter(x=>(x.type==="out"||x.type==="in"||x.type==="save")&&x.date>=from&&+x.amount>0&&x.cat).forEach(x=>{
    const k=[x.type,x.cat,+x.amount,x.cur||"TRY"].join("|"),o=by.get(k)||{type:x.type,cat:x.cat,amount:+x.amount,cur:x.cur||"TRY",n:0,last:""};
    o.n++;if((x.date||"")>=o.last){o.last=x.date||"";o.method=x.method||"";o.note=x.note||""}by.set(k,o)});
  const all=[...by.values()],freq=all.filter(o=>o.n>=2).sort((a,b)=>b.n-a.n||b.last.localeCompare(a.last));
  const seen=new Set(freq.map(o=>o.cat+"|"+o.amount)),rec=all.filter(o=>!seen.has(o.cat+"|"+o.amount)).sort((a,b)=>b.last.localeCompare(a.last));
  return freq.concat(rec).slice(0,6);
}
function txSheet(t,preset){
  const type=t?t.type:(preset&&preset.type)||"out";
  const catOpts=ty=>ty==="in"?CATS.in:ty==="save"?CATS.save:CATS.out;
  const hasCards=state.cards.length>0,mg=(state.goals||[]).filter(g=>g.src==="manual");
  formSheet({title:t?"İşlemi düzenle":"İşlem ekle",fields:[
    {id:"type",label:"Tür",type:"seg",value:type,options:hasCards?[["out","Gider"],["in","Gelir"],["save","Tasarruf"],["card","Kart ödemesi"]]:[["out","Gider"],["in","Gelir"],["save","Tasarruf"]]},
    [{id:"amount",label:"Tutar",type:"number",big:true,value:t?t.amount:(preset&&preset.amount)||"",ph:"0"},{id:"cur",label:"Para birimi",type:"select",value:t?t.cur:"TRY",options:CURS}],
    [{id:"cat",label:"Kategori",type:"select",value:t?t.cat:catOpts(type)[0],options:[...new Set([...catOpts(type),...(t&&t.cat?[t.cat]:[])])].map(c=>[c,c]).concat([["__new","Yeni kategori…"]])},{id:"date",label:"Tarih",type:"date",value:t?t.date:todayISO()}],
    {id:"newCat",label:"Yeni kategorinin adı",value:"",ph:"Örn. Evcil hayvan, Spor, Tatil"},
    ...(hasCards?[[{id:"method",label:"Ödeme şekli",type:"select",value:t?(t.method||"cash"):"cash",options:methodOpts()},{id:"inst",label:"Taksit sayısı",type:"select",value:"1",options:[["1","Tek çekim"],...[2,3,4,5,6,9,12].map(n=>[String(n),n+" taksit"])]}],
      {id:"card",label:"Ödenen kart",type:"select",value:t&&t.card||(preset&&preset.card)||state.cards[0].id,options:state.cards.map(c=>[c.id,c.name])}]:[]),
    ...(!t&&mainPf()&&mainPf().holdings.some(h=>h.kind!=="bes")?[{id:"buyH",label:"Bununla ne aldınız?",type:"select",value:"",options:[["","Portföye alım yazma"],...mainPf().holdings.filter(h=>h.kind!=="bes").map(h=>[h.id,h.name]),["new","Yeni bir varlık…"]]},
      [{id:"buyQty",label:"Alınan miktar",type:"number",value:"",ph:"0"},{id:"buyPrice",label:"Alış fiyatı (birim)",type:"number",value:"",ph:"0"}]]:[]),
    ...(mg.length?[{id:"goal",label:"Birikim hedefi",type:"select",value:t&&t.goal||"",options:[["","Hedefe bağlama"],...mg.map(g=>[g.id,g.name])]}]:[]),
    {id:"note",label:"Not",value:t?t.note:"",ph:"İsteğe bağlı"}],
    extra:`<div class="note" id="txHint"></div>`,
    onChange:(form)=>sync(form),
    onOpen:(form,sh)=>{form.addEventListener("input",e=>{if(e.target.name==="buyQty")e.target.dataset.auto="0";else if(e.target.name==="amount"||e.target.name==="buyPrice")sync(form)});
      if(!t){const q=quickTx();if(q.length){
        form.insertAdjacentHTML("afterbegin",`<div class="quick"><span class="label">Sık kullanılanlar</span><div class="quick-row">${q.map((x,i)=>`<button type="button" class="qchip" data-q="${i}" style="--qc:var(${x.type==="in"?"--pos":x.type==="save"?"--c5":catColor(x.cat)})">${ic(catIcon(x.cat),15)}<span>${esc(x.cat)}</span><b class="num">${fmt(x.amount,x.cur,{dec:x.amount%1?2:0,show:true})}</b></button>`).join("")}</div></div>`);
        sh.querySelectorAll("[data-q]").forEach(b=>b.onclick=()=>{const x=q[+b.dataset.q],el=form.elements;
          const seg=form.querySelector('[data-seg=type] [data-v="'+x.type+'"]');if(seg)seg.click();sync(form);
          el.amount.value=String(x.amount).replace(".",",");if(el.cur)el.cur.value=x.cur||"TRY";
          if(el.cat){if(![...el.cat.options].some(o=>o.value===x.cat))el.cat.insertAdjacentHTML("afterbegin",`<option value="${esc(x.cat)}">${esc(x.cat)}</option>`);el.cat.value=x.cat}
          if(el.method&&x.method!=null)el.method.value=x.method||"cash";if(el.note)el.note.value=x.note||"";
          sh.querySelectorAll("[data-q]").forEach(o=>o.setAttribute("aria-pressed",o===b));sync(form);
          const sv=sh.querySelector('.actions button[type=submit],.actions .primary');if(sv)sv.focus({preventScroll:true})})}}
      if(t||!("createImageBitmap" in window)||typeof WebAssembly!=="object")return;
      form.insertAdjacentHTML("afterbegin",`<div class="scan"><button type="button" class="btn sm" id="scanBtn">${ic(I.camera,16)}Fişten doldur</button><input type="file" id="scanFile" accept="image/*" capture="environment" hidden><span class="sub" id="scanMsg" role="status">Fişin fotoğrafını çekin; tutar, tarih ve kategori doldurulur.</span></div>`);
      const btn=sh.querySelector("#scanBtn"),inp=sh.querySelector("#scanFile"),msg=sh.querySelector("#scanMsg");
      btn.onclick=()=>inp.click();
      inp.onchange=async()=>{const f=inp.files&&inp.files[0];inp.value="";if(!f)return;btn.disabled=true;msg.textContent="Okuma hazırlanıyor… (ilk seferde birkaç saniye sürer)";
        try{const text=await readReceipt(f,pr=>{msg.textContent="Fiş okunuyor… %"+Math.round(pr*100)});
          if(!document.body.contains(form))return;
          let r=parseReceipt(text,CATS.out);
          // toplam satırı bulunamadıysa satırları bölmeyen ikinci bir okuma dene
          if(r.how!=="toplam satırı"){try{const r2=parseReceipt(await readReceipt(f,pr=>{msg.textContent="Bir kez daha deneniyor… %"+Math.round(pr*100)},"6"),CATS.out);if(r2.how==="toplam satırı"||(!r.amount&&r2.amount))r={...r2,date:r2.date||r.date,shop:r.shop||r2.shop,cat:r2.cat||r.cat}}catch(e){}}
          if(!document.body.contains(form))return;
          const el=form.elements,got=[];
          form.querySelector('[data-seg=type] [data-v=out]').click();
          if(r.amount){el.amount.value=String(r.amount).replace(".",",");got.push("tutar "+fmt(r.amount,"TRY",{show:true}))}
          if(r.date){el.date.value=r.date;got.push("tarih "+fmtDate(r.date))}
          if(r.cat){sync(form);el.cat.value=r.cat;got.push(r.cat)}
          if(r.shop&&!el.note.value)el.note.value=r.shop;
          sync(form);
          msg.textContent=got.length?"Okundu: "+got.join(" · ")+(r.amount&&r.how!=="toplam satırı"?". Toplam satırı bulunamadı, fişteki en büyük tutar alındı; mutlaka kontrol edin.":". Kontrol edip kaydedin."):"Fişten tutar ya da tarih okunamadı. Daha yakından, düz ve aydınlık bir fotoğrafla yeniden deneyin ya da elle girin.";
        }catch(e){msg.textContent=e&&e.message&&/indirilemedi/.test(e.message)?e.message:"Fiş okunamadı; yeniden deneyin ya da elle girin."}
        btn.disabled=false};
    },
    onSave:v=>{const a=parseNum(v.amount);if(!(a>0))return"Tutar sıfırdan büyük olmalı.";if(!v.date)return"Tarih seçin.";
      if(v.type!=="card"&&v.cat==="__new"){const n=(v.newCat||"").trim().replace(/\s+/g," ");if(!n)return"Yeni kategorinin adını yazın.";if(n.length>40)return"Ad en çok 40 karakter olabilir.";
        const ex=catOpts(v.type).find(c=>trLow(c)===trLow(n));if(ex)v.cat=ex;else{catsMut(v.type,l=>l.concat([n]));v.cat=n}}
      if(v.type==="card"){const d={type:"card",card:v.card,amount:a,cur:v.cur,date:v.date,note:v.note.trim(),cat:"Kart ödemesi"};
        if(t){Object.assign(t,d);delete t.method}else state.tx.push({id:uid(),...d});view.month=v.date.slice(0,7);commit("Kart ödemesi kaydedildi");return}
      const method=v.type==="out"&&v.method&&v.method!=="cash"?v.method:"";
      const n=t?1:Math.max(1,+v.inst||1),goal=v.type==="save"&&v.goal?v.goal:undefined;
      if(v.type==="save"){const d={type:"save",amount:a,cur:v.cur,cat:v.cat,date:v.date,note:v.note.trim(),method:"",goal};
        let bought="";
        if(!t&&v.buyH&&v.buyH!=="new"){const hh=mainPf().holdings.find(h=>h.id===v.buyH);
          if(hh){const q=parseNum(v.buyQty),p=parseNum(v.buyPrice);if(!(q>0))return"Alınan miktarı girin.";if(!(p>0))return"Alış fiyatını girin.";if(v.date>todayISO())return"Alım tarihi ileri olamaz.";
            const snap=JSON.stringify(hh);ensureTrades(hh);const tr={id:uid(),type:"buy",date:v.date,qty:q,price:p,fee:0,note:"Tasarruftan"};const f=fxLookup(v.date);if(f)tr.fx=f;hh.trades.push(tr);
            const err=rebuild(hh);if(err){Object.keys(hh).forEach(k=>delete hh[k]);Object.assign(hh,JSON.parse(snap));return err}
            d.buy={h:hh.id,tr:tr.id};bought=hh.name}}
        if(t){Object.assign(t,d);delete t.card}else state.tx.push({id:uid(),...d,...(preset&&preset.rid?{rid:preset.rid}:{})});view.month=v.date.slice(0,7);
        commit(t?"İşlem güncellendi":bought?"Tasarruf eklendi · "+bought+" alımı portföye yazıldı":"Tasarruf eklendi");
        if(!t&&v.buyH==="new")setTimeout(()=>holdingSheet(mainPf().id),350);return}
      if(t){Object.assign(t,{type:v.type,amount:a,cur:v.cur,cat:v.cat,date:v.date,note:v.note.trim(),method});delete t.card;delete t.goal}
      else if(n>1&&method){const g=uid(),per=Math.round(a/n*100)/100;
        for(let k=0;k<n;k++){const[y,m]=v.date.slice(0,7).split("-").map(Number);const dt=new Date(y,m-1+k,1);const mm=dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0");
          state.tx.push({id:uid(),type:"out",amount:k===n-1?Math.round((a-per*(n-1))*100)/100:per,cur:v.cur,cat:v.cat,date:dayIn(mm,+v.date.slice(8)),note:v.note.trim(),method,inst:(k+1)+"/"+n,grp:g})}}
      else state.tx.push({id:uid(),type:v.type,amount:a,cur:v.cur,cat:v.cat,date:v.date,note:v.note.trim(),method,...(preset&&preset.rid?{rid:preset.rid}:{})});
      view.month=v.date.slice(0,7);commit(t?"İşlem güncellendi":(v.type==="in"?"Gelir eklendi":n>1?n+" taksit aylara bölündü":"Gider eklendi"))},
    onDelete:t?()=>{if(t.grp&&state.tx.filter(x=>x.grp===t.grp).length>1){state.tx=state.tx.filter(x=>x.grp!==t.grp||x.date<t.date);commit("Bu ve sonraki taksitler silindi")}else{state.tx=state.tx.filter(x=>x!==t);commit("İşlem silindi")}}:null});
  function sync(form){
    const ty=form.elements.type.value,el=form.elements;
    const show=(name,on)=>{const f=el[name];if(f){const box=f.closest(".field");box.hidden=!on;const row=box.parentElement;if(row.classList.contains("frow"))row.hidden=[...row.children].every(c=>c.hidden)}};
    const cat=el.cat;if(ty!=="card"&&cat.dataset.ty!==ty){const cur=cat.value;cat.innerHTML=catOpts(ty).map(c=>`<option ${c===cur?"selected":""}>${esc(c)}</option>`).join("")+`<option value="__new">Yeni kategori…</option>`;cat.dataset.ty=ty}
    show("newCat",ty!=="card"&&cat.value==="__new");
    show("cat",ty!=="card");show("goal",ty==="save");show("method",ty==="out");
    if(el.buyH){show("buyH",ty==="save");const bh=el.buyH.value,hh=ty==="save"&&bh&&bh!=="new"?mainPf().holdings.find(h=>h.id===bh):null;show("buyQty",!!hh);show("buyPrice",!!hh);
      if(hh){const num=x=>String(+x.toFixed(x<10?4:2)).replace(".",",");
        if(el.buyPrice.dataset.h!==bh){el.buyPrice.dataset.h=bh;el.buyPrice.value=effPrice(hh).p>0?num(effPrice(hh).p):"";el.buyQty.dataset.auto="1"}
        el.buyPrice.closest(".field").querySelector("label").textContent="Alış fiyatı (birim, "+hh.cur+")";
        if(el.buyQty.dataset.auto!=="0"){const a=parseNum(el.amount.value),p=parseNum(el.buyPrice.value),inCur=a>0&&rate(hh.cur)?toBase(a,el.cur.value)*rate(S().base)/rate(hh.cur):0;el.buyQty.value=p>0&&inCur>0?num(inCur/p):""}}}show("inst",ty==="out"&&el.method&&el.method.value!=="cash"&&!t);show("card",ty==="card");
    const h=document.getElementById("txHint");if(h){h.hidden=!(ty==="card"||ty==="save"||(ty==="out"&&el.method&&el.method.value!=="cash"));h.textContent=ty==="save"&&el.buyH&&el.buyH.value==="new"?"Kaydettikten sonra yeni varlık penceresi açılır; orada ne aldığınızı girersiniz.":ty==="save"&&el.buyH&&el.buyH.value?"Tasarruf kaydıyla birlikte seçtiğiniz varlığa bu tarihle alım da yazılır; ayrıca Portföy’e girmeniz gerekmez. Miktar, tutar ÷ fiyat olarak hesaplanır; isterseniz düzeltin.":ty==="save"?"Tasarruf gider sayılmaz; ayın kalanından ve nakit bakiyesinden düşer, tasarruf hedefinize eklenir. Parayı altın ya da fona çevirdiyseniz ayrıca Portföy’e alım olarak girin.":ty==="card"?"Kart ödemesi gider sayılmaz; kart borcunu düşürür.":"Kartla harcama bu ayın giderine yazılır ve kart borcuna eklenir. Taksitli alım aylara bölünür."}
  }
  setTimeout(()=>{const f=document.getElementById("sf");if(f){f.elements.cat.dataset.ty=type;sync(f)}},0);
}
function saveTargetSheet(){
  const t=S().saveTarget||{mode:"amt",v:""};
  formSheet({title:"Aylık tasarruf hedefi",fields:[
    {id:"mode",label:"Hedef türü",type:"seg",value:t.mode==="pct"?"pct":"amt",options:[["amt","Sabit tutar"],["pct","Gelirin yüzdesi"]]},
    {id:"v",label:"Hedef",type:"number",big:true,value:t.v||"",ph:"0"}],
    extra:`<div class="note" id="stHint"></div>`,
    onOpen:(form,sh)=>{const u=()=>{const h=sh.querySelector("#stHint");if(h)h.textContent=form.elements.mode.value==="pct"?"Örneğin 20 yazarsanız her ay o ayın gelirinin %20’si hedef olur.":"Her ay ayırmak istediğiniz tutar (TL)."};form.addEventListener("click",()=>setTimeout(u,0));u()},
    onSave:v=>{const x=parseNum(v.v);if(!(x>0))return"Sıfırdan büyük bir değer girin.";if(v.mode==="pct"&&x>100)return"Yüzde 100’den büyük olamaz.";S().saveTarget={mode:v.mode,v:x};commit("Tasarruf hedefi kaydedildi")},
    onDelete:S().saveTarget?()=>{delete S().saveTarget;commit("Tasarruf hedefi kaldırıldı")}:null});
}
function recSheet(r){
  formSheet({title:r?"Sabit kalemi düzenle":"Sabit ödeme / gelir ekle",fields:[
    {id:"type",label:"Tür",type:"seg",value:r?r.type:"out",options:[["out","Ödeme"],["in","Gelir"],["save","Tasarruf"]]},
    {id:"name",label:"Adı",value:r?r.name:"",ph:"Örn. Kira, Elektrik, Maaş, Aylık birikim"},
    [{id:"amount",label:"Tutar (yaklaşık)",type:"number",value:r?r.amount:"",ph:"0"},{id:"day",label:"Ayın kaçında",type:"select",value:r?String(r.day):"1",options:Array.from({length:31},(_,i)=>[String(i+1),String(i+1)])}],
    [{id:"cat",label:"Kategori",type:"select",value:r?r.cat:CATS.out[0],options:r&&r.type==="in"?CATS.in:r&&r.type==="save"?CATS.save:CATS.out},{id:"cur",label:"Para birimi",type:"select",value:r?r.cur:"TRY",options:CURS}],
    ...(state.cards.length?[{id:"method",label:"Ödeme şekli",type:"select",value:r?(r.method||"cash"):"cash",options:methodOpts()}]:[])],
    extra:`<div class="note">Her ay listede görünür. "Öde"ye dokununca o ayın tarihiyle işlem olarak eklenir; tutar değiştiyse işlemi açıp düzeltebilirsiniz.</div>`,
    onChange:(form,name)=>{if(name==="type"){const c=form.elements.cat;const ty=form.elements.type.value;c.innerHTML=(ty==="in"?CATS.in:ty==="save"?CATS.save:CATS.out).map(x=>`<option>${esc(x)}</option>`).join("")}},
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
const goalTx=g=>state.tx.filter(t=>t.type==="save"&&t.goal===g.id);
function goalProg(g){
  let cur=0;
  if(g.src==="pf"){const p=state.portfolios.find(x=>x.id===g.pf);cur=p?toUnit(pfTotals(p).v,g.unit):0}
  else if(g.src==="hs"){cur=toUnit(goalHs(g).reduce((a,h)=>a+hVal(h),0),g.unit)}
  else cur=(g.saves||[]).reduce((a,x)=>a+(+x.amount||0),0)+goalTx(g).reduce((a,t)=>a+toUnit(toBase(t.amount,t.cur),g.unit),0);
  const tgt=+g.target||0,left=Math.max(0,tgt-cur),pct=tgt?Math.min(100,cur/tgt*100):0;
  let months=null,monthly=null;
  if(g.due){const t=new Date(todayISO()+"T00:00:00"),d=new Date(g.due+"T00:00:00");months=Math.max(0,(d.getFullYear()-t.getFullYear())*12+d.getMonth()-t.getMonth()+(d.getDate()>=t.getDate()?0:-1));monthly=left>0?left/Math.max(1,months):0}
  return{cur,tgt,left,pct,months,monthly,done:tgt>0&&cur>=tgt};
}
function goalsCard(){
  const gs=state.goals||[];
  return `<section class="card"><div class="sec" style="margin-bottom:${gs.length?8:0}px"><h2>Birikim hedefleri</h2><button class="btn ghost sm" data-act="goal-new">${ic(I.plus,14)}Hedef ekle</button></div>
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
    <div class="label sh-sec">Hareketler</div>${goalTx(g).length?`<div class="list">${goalTx(g).sort((a,b)=>b.date.localeCompare(a.date)).map(t=>`<div class="row"><div class="main"><div class="t num">+${fmtU(toUnit(toBase(t.amount,t.cur),g.unit),g.unit)}</div><div class="s">${fmtDate(t.date)} · Gelir-Gider’deki tasarruf kaydı</div></div></div>`).join("")}</div>`:""}${sv.length||goalTx(g).length?`<div class="list">${sv.map(x=>`<div class="row"><div class="main"><div class="t num ${x.amount<0?"neg-t":""}">${x.amount>0?"+":""}${fmtU(x.amount,g.unit)}</div><div class="s">${fmtDate(x.date)}</div></div><button class="icon-btn sm" data-del-gs="${x.id}" aria-label="Kaydı kaldır">${ic(I.trash,16)}</button></div>`).join("")}</div>`:`<div class="sub" style="padding:8px 0">Henüz kayıt yok.</div>`}`
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
const CAT_T={out:"Gider",in:"Gelir",save:"Tasarruf"};
const catUse=(ty,c)=>state.tx.filter(t=>(ty==="out"?t.type==="out":t.type===ty)&&t.cat===c).length+state.recurring.filter(r=>r.type===ty&&r.cat===c).length;
function catsMut(ty,fn){const st=S();st.cats=st.cats||{};st.cats[ty]=fn(catList(ty).slice())}
function catsSheet(ty){
  ty=CAT_T[ty]?ty:"out";const list=catList(ty);
  openSheet(`<h3>Kategoriler</h3>
    <div class="seg full" role="group" style="margin-bottom:10px">${Object.entries(CAT_T).map(([k,l])=>`<button type="button" data-ct="${k}" aria-pressed="${k===ty}">${l}</button>`).join("")}</div>
    <div class="list">${list.map((c,i)=>`<div class="row catrow">${mkIcon(catIcon(c),catColor(c))}<button type="button" class="main catname" data-ce="${i}"><span class="t">${esc(c)}</span><span class="s">${(n=>n?n+" kayıt":"kayıt yok")(catUse(ty,c))}</span></button>
      <span class="catmv"><button type="button" class="icon-btn sm" data-cu="${i}" ${i===0?"disabled":""} aria-label="${esc(c)}: yukarı taşı">${ic(I.left,14).replace("<svg",'<svg style="transform:rotate(90deg)"')}</button><button type="button" class="icon-btn sm" data-cd="${i}" ${i===list.length-1?"disabled":""} aria-label="${esc(c)}: aşağı taşı">${ic(I.right,14).replace("<svg",'<svg style="transform:rotate(90deg)"')}</button></span></div>`).join("")}</div>
    <div class="sub" style="margin-top:8px">Adını ya da ikonunu değiştirmek, silmek için kategoriye dokunun.</div>
    <div class="actions"><button type="button" class="btn" id="catSort">Kullanıma göre sırala</button><button type="button" class="btn primary grow" id="catAdd">${ic(I.plus,16)}Kategori ekle</button></div>`,sh=>{
    sh.querySelectorAll("[data-ct]").forEach(b=>b.onclick=()=>catsSheet(b.dataset.ct));
    sh.querySelectorAll("[data-ce]").forEach(b=>b.onclick=()=>catEdit(ty,list[+b.dataset.ce]));
    const mv=(i,d)=>{catsMut(ty,l=>{const x=l[i];l[i]=l[i+d];l[i+d]=x;return l});commit();catsSheet(ty)};
    sh.querySelectorAll("[data-cu]").forEach(b=>b.onclick=()=>mv(+b.dataset.cu,-1));
    sh.querySelectorAll("[data-cd]").forEach(b=>b.onclick=()=>mv(+b.dataset.cd,1));
    sh.querySelector("#catAdd").onclick=()=>catEdit(ty,null);
    sh.querySelector("#catSort").onclick=()=>{catsMut(ty,l=>l.map((c,i)=>[c,catUse(ty,c),i]).sort((a,b)=>b[1]-a[1]||a[2]-b[2]).map(x=>x[0]));commit("En çok kullanılanlar üste alındı");catsSheet(ty)};
  });
}
function catEdit(ty,name){
  const list=catList(ty),used=name?catUse(ty,name):0,cur=name&&S().catIcons&&S().catIcons[name]||"";
  const others=list.filter(c=>c!==name);
  formSheet({title:name?"Kategoriyi düzenle":"Yeni "+CAT_T[ty].toLocaleLowerCase("tr")+" kategorisi",fields:[
    {id:"name",label:"Kategori adı",value:name||"",ph:"Örn. Evcil hayvan, Spor, Tatil"},
    ...(name&&used&&others.length?[{id:"move",label:"Silinirse "+used+" kayıt nereye taşınsın",type:"select",value:"",options:[["","Taşıma; kayıtlar bu adla kalsın"],...others.map(c=>[c,c])]}]:[])],
    extra:`<div class="field"><label>İkon</label><div class="icongrid" role="radiogroup" aria-label="İkon">${ICON_CHOICES.map(k=>`<button type="button" role="radio" data-ik="${k}" aria-checked="${k===cur}" aria-label="${k}">${ic(I[k],20)}</button>`).join("")}</div><input type="hidden" name="icon" value="${cur}"></div>`,
    onOpen:(form,sh)=>sh.querySelectorAll("[data-ik]").forEach(b=>b.onclick=()=>{sh.querySelectorAll("[data-ik]").forEach(x=>x.setAttribute("aria-checked",x===b));form.elements.icon.value=b.dataset.ik}),
    onSave:v=>{const n=v.name.trim().replace(/\s+/g," ");if(!n)return"Kategori adı girin.";if(n.length>40)return"Ad en çok 40 karakter olabilir.";
      if(n!==name&&list.some(c=>trLow(c)===trLow(n)))return"Bu adla bir kategori zaten var.";
      const st=S();st.catIcons=st.catIcons||{};
      if(name&&n!==name){catsMut(ty,l=>l.map(c=>c===name?n:c));
        state.tx.forEach(t=>{if((ty==="out"?t.type==="out":t.type===ty)&&t.cat===name)t.cat=n});state.recurring.forEach(r=>{if(r.type===ty&&r.cat===name)r.cat=n});
        if(ty==="out"&&state.budgets&&name in state.budgets){state.budgets[n]=state.budgets[name];delete state.budgets[name]}
        delete st.catIcons[name]}
      else if(!name)catsMut(ty,l=>l.concat([n]));
      if(v.icon)st.catIcons[n]=v.icon;else delete st.catIcons[n];
      commit(name?"Kategori güncellendi":"Kategori eklendi");setTimeout(()=>catsSheet(ty),320)},
    onDelete:name&&list.length>1?()=>{const mvTo=(document.querySelector("#f_move")||{}).value||"";
      if(mvTo){state.tx.forEach(t=>{if((ty==="out"?t.type==="out":t.type===ty)&&t.cat===name)t.cat=mvTo});state.recurring.forEach(r=>{if(r.type===ty&&r.cat===name)r.cat=mvTo});
        if(ty==="out"&&state.budgets&&name in state.budgets){if(!(mvTo in state.budgets))state.budgets[mvTo]=state.budgets[name];delete state.budgets[name]}}
      catsMut(ty,l=>l.filter(c=>c!==name));if(S().catIcons)delete S().catIcons[name];
      commit(mvTo?"Kategori silindi, kayıtlar “"+mvTo+"” kategorisine taşındı":"Kategori listeden kaldırıldı"+(used?"; eski kayıtlar duruyor":""))}:null});
}
/* son üç tam ayın ortalamasına göre bütçe önerisi (yukarı, yuvarlak bir sayıya) */
function budgetSuggest(){
  const out={},t=todayISO();let ym=t.slice(0,7);const ms=[];for(let i=0;i<3;i++){ym=prevMonth(ym+"-15");ms.push(ym)}
  const n=ms.filter(m=>monthTx(m).some(x=>x.type==="out")).length;if(!n)return null;
  ms.forEach(m=>monthTx(m).forEach(x=>{if(x.type==="out")out[x.cat]=(out[x.cat]||0)+toBase(x.amount,x.cur)}));
  const round=v=>{const s=v<1000?50:v<10000?100:500;return Math.ceil(v/s)*s};
  Object.keys(out).forEach(c=>out[c]=round(out[c]/n));return{by:out,n};
}
function budgetSheet(){
  const b=state.budgets||{};
  openSheet(`<h3>Aylık bütçe</h3><form class="form" id="bf" novalidate><div class="sub">Her kategori için aylık üst sınır girin (${esc(S().base)}). Boş bırakılanlar bütçeye dahil edilmez.</div>
    <div><button type="button" class="btn sm" id="bSug">${ic(I.spark,16)}Son 3 ayın ortalamasını öner</button> <span class="sub" id="bSugMsg"></span></div>
    ${CATS.out.map((c,i)=>`<div class="set-row" style="padding:6px 0"><label for="b_${i}" class="lbl">${esc(c)}</label><input class="inline-in" id="b_${i}" data-c="${esc(c)}" inputmode="decimal" placeholder="—" value="${+b[c]>0?String(b[c]).replace(".",","):""}"></div>`).join("")}
    <div class="err" id="bErr"></div><div class="actions"><button class="btn primary grow" type="submit">Kaydet</button></div></form>`,sh=>{
    sh.querySelector("#bSug").onclick=()=>{const g=budgetSuggest(),msg=sh.querySelector("#bSugMsg");if(!g){msg.textContent="Önceki aylarda gider kaydı yok.";return}
      let k=0;sh.querySelectorAll("input[data-c]").forEach(inp=>{const v=g.by[inp.dataset.c];if(v>0){inp.value=String(v);k++}});msg.textContent=k?k+" kategori dolduruldu ("+g.n+" ayın ortalaması). Kaydetmeden önce düzeltebilirsiniz.":"Bu kategorilerde önceki aylarda gider yok."};
    sh.querySelector("#bf").onsubmit=e=>{e.preventDefault();const nb={};for(const inp of sh.querySelectorAll("input[data-c]")){const raw=inp.value.trim();if(!raw)continue;const v=parseNum(raw);if(isNaN(v)||v<0){sh.querySelector("#bErr").textContent=inp.dataset.c+" için geçerli bir tutar girin.";return}if(v>0)nb[inp.dataset.c]=v}
      state.budgets=nb;closeSheet();commit("Bütçe kaydedildi")};
  });
}
function debtSheet(d){
  formSheet({title:d?"Kaydı düzenle":"Borç / alacak ekle",fields:[
    {id:"dir",label:"Yön",type:"seg",value:d?d.dir:view.debtDir,options:[["lent","Borç verdim"],["borrowed","Borç aldım"]]},
    {id:"person",label:"Kişi / kurum",value:d?d.person:"",ph:"Örn. Ahmet, Banka kredisi"},
    ...(state.portfolios.length?[{id:"pf",label:"Hangi portföye ait (zekât hesabı için)",type:"select",value:d?(d.pf||(mainPf()||{}).id):(view.debtPf&&view.debtPf!=="all"?view.debtPf:(mainPf()||{}).id),options:state.portfolios.map(p=>[p.id,pfName(p.id)])}]:[]),
    [{id:"amount",label:"Tutar / miktar",type:"number",value:d?d.amount:"",ph:"0"},{id:"cur",label:"Birim",type:"select",value:d?d.cur:"TRY",options:DEBT_UNITS}],
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
    <div class="dsum"><div><span class="label">${d.dir==="lent"?"Kalan alacak":"Kalan borç"}</span><div class="dv num">${fmt(left,d.cur)}</div>${isG(d.cur)&&rate(d.cur)?`<small class="sub">≈ ${fmt(toBase(left,d.cur),null,{dec:0})} · güncel fiyatla</small>`:""}</div>${left<=0?`<span class="chg up"><b>Kapandı</b></span>`:d.due?(n=>`<span class="chg ${n<0?"down":""}"><b>${n<0?-n+" gün gecikti":n+" gün kaldı"}</b></span>`)(daysBetween(todayISO(),d.due)):""}</div>
    <div class="bar"><i style="width:${+d.amount?Math.min(100,debtPaid(d)/d.amount*100):0}%;background:var(${d.dir==="lent"?"--pos":"--neg"})"></i></div>
    <div class="tiles">
      <div><span class="label">${d.dir==="lent"?"Verdiğim":"Aldığım"} tutar</span><b class="num">${fmt(d.amount,d.cur)}</b></div>
      <div><span class="label">${d.dir==="lent"?"Tahsil edilen":"Ödenen"}</span><b class="num">${fmt(debtPaid(d),d.cur)}</b></div>
      ${d.due?`<div><span class="label">Vade</span><b>${fmtDate(d.due)}</b></div>`:""}
      ${d.note?`<div class="w2"><span class="label">Not</span><b class="txt">${esc(d.note)}</b></div>`:""}
    </div>
    ${left>0?`<form class="form" id="payF" novalidate><div class="label sh-sec">${d.dir==="lent"?"Tahsilat ekle":"Ödeme ekle"}</div><div class="frow"><div class="field"><label for="payA">${isG(d.cur)?"Miktar ("+esc(unitName(d.cur))+")":"Tutar ("+esc(d.cur)+")"}</label><input id="payA" inputmode="decimal" placeholder="${esc(fmtN(left))}"></div><div class="field"><label for="payD">Tarih</label><input id="payD" type="date" value="${todayISO()}"></div></div><div class="err" id="payErr"></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" type="submit">Ekle</button><button class="btn" type="button" id="payAll">Tamamını kapat</button></div></form>`:`<div class="note">Bu kayıt tamamen kapandı.</div>`}
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
      {id:uid(),name:"Katılım hesabı",symbol:"TL",kind:"mevduat",cur:"TRY",qty:85000,cost:1,price:1}]},
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
  if(a==="pf-all"){view.pf="all";view.tab="portfoy";render();window.scrollTo({top:0});return}
  if(a==="open-pf"){setPf(id);view.tab="portfoy";render();window.scrollTo({top:0});return}
  if(a==="ozpf"){setPf(id);render();return}
  if(a==="pf"){if(id==="all")view.pf=id;else setPf(id);render();if(!t.closest(".chips"))window.scrollTo({top:0});return}
  if(a==="add-h")return holdingSheet();
  if(a==="hide"){S().hide=!S().hide;commit();return}
  if(a==="edit-tr"){const p=state.portfolios.find(p=>p.id===t.dataset.pf),h=p&&p.holdings.find(x=>x.id===t.dataset.h),tr=h&&(h.trades||[]).find(x=>x.id===id);if(tr)tr.type==="div"?divSheet(p.id,h,tr):tradeSheet(p.id,h,tr.type,tr);return}
  if(a==="more-tr"){view.trN=(view.trN||15)+30;render();return}
  if(a==="edit-h"){const p=state.portfolios.find(p=>p.id===t.dataset.pf);const hh=p.holdings.find(h=>h.id===id);return hh&&hh.kind==="bes"?besSheet(p.id,hh):holdingDetail(p.id,hh)}
  if(a==="month"){const[y,m]=view.month.split("-").map(Number);const d=new Date(y,m-1+(+t.dataset.d),1);view.month=d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0");render();return}
  if(a==="txtype"){view.txType=t.dataset.k;render();return}
  if(a==="edit-tx")return txSheet(state.tx.find(x=>x.id===id));
  if(a==="rec-new")return recSheet();
  if(a==="tx-add")return txSheet();
  if(a==="rec-edit")return recSheet(state.recurring.find(x=>x.id===id));
  if(a==="rec-pay"){const r=state.recurring.find(x=>x.id===id);if(!r)return;let d=dayIn(view.month,r.day);if(d>todayISO()&&view.month===todayISO().slice(0,7))d=todayISO();
    state.tx.push({id:uid(),type:r.type,amount:r.amount,cur:r.cur,cat:r.cat,date:d,note:r.name,method:r.method||"",rid:r.id});commit(r.name+(r.type==="in"?" alındı":r.type==="save"?" ayrıldı":" ödendi"));return}
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
  if(a==="cats"){catsSheet(view.txType==="in"||view.txType==="save"?view.txType:"out");return}
  if(a==="save-target"){saveTargetSheet();return}
  if(a==="save-add"){txSheet(null,{type:"save"});return}
  if(a==="target"){const p=state.portfolios.find(x=>x.id===id);if(p)targetSheet(p);return}
  if(a==="rapor"){view.rpMonth=view.month;view.rpYear=+view.month.slice(0,4);view.tab="rapor";render();window.scrollTo(0,0);return}
  if(a==="rpmode"){view.rpMode=t.dataset.k;render();return}
  if(a==="taxpf"){view.taxPf=id;render();return}
  if(a==="rpnav"){const d=+t.dataset.d;if(view.rpMode==="ay"){const[y,m]=view.rpMonth.split("-").map(Number),x=new Date(y,m-1+d,1);view.rpMonth=x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")}else view.rpYear+=d;render();return}
  if(a==="print"){window.print();return}
  if(a==="theme"){const st=S();st.tone=t.dataset.v;st.theme=t.dataset.th==="dark"?"dark":(st.theme==="system"?"system":"light");commit();return}
  if(a==="goto"){view.tab=id;render();window.scrollTo(0,0);return}
  if(a==="backups"){backupSheet();return}
  if(a==="alert-new"){alertSheet(null);return}
  if(a==="alert-edit"){const x=state.alerts.find(q=>q.id===id);if(x)alertSheet(x);return}
  if(a==="setg"){view.setG=t.dataset.k;render();return}
  if(a==="txclear"){view.txQ="";view.txCat="";render();return}
  if(a==="notif-test"){notifTest(t.dataset.k);return}
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
  if(a==="plmode"){S().plMode=plMode()==="day"?"total":"day";commit();return}
  if(a==="col"){S().col=t.dataset.k;commit();return}
  if(a==="colnext"){const i=COLS.findIndex(c=>c[0]===colMode());S().col=COLS[(i+1)%COLS.length][0];commit();return}
  if(a==="fold"){const k=t.dataset.k,f=foldMap();f[k]=!foldOpen(k);view.fJust=f[k]?k:null;try{localStorage.setItem("emanet-fold",JSON.stringify(f))}catch(e){}render();return}
  if(a==="kopen"){const k=t.dataset.k,o=kOpenSet();view.kJust=kIsOpen(k.split(":")[0],k.slice(k.indexOf(":")+1))?null:k;o.has(k)?o.delete(k):o.add(k);try{localStorage.setItem("emanet-kopen",JSON.stringify([...o]))}catch(e){}render();return}
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
document.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.matches&&e.target.matches('.row.li[role="button"],.arow[role="button"]')){e.preventDefault();e.target.click()}});
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
      rows.push([t.date||"",t.type==="in"?"Gelir":t.type==="card"?"Kart ödemesi":t.type==="save"?"Tasarruf":"Gider",t.cat||"",n(+t.amount),t.cur||"TRY",c?c.name:(t.type==="out"?"Nakit / banka kartı":""),t.inst||"",t.note||""])});
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
