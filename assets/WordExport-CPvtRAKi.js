import{b as F,f as u,d as f}from"./index-CvXJKwii.js";const G={healthCare:"#1CABE2",productivity:"#FFC20E",mortality:"#E2231A",nutrition:"#84BD00",accessTime:"#00833D",carbon:"#475569",choleraAndFunerals:"#80276C",tourism:"#004C97"},O={AF:"AFG",AO:"AGO",BD:"BGD",BJ:"BEN",BF:"BFA",BI:"BDI",KH:"KHM",CF:"CAF",TD:"TCD",CD:"COD",DJ:"DJI",ER:"ERI",ET:"ETH",GM:"GMB",GN:"GIN",GW:"GNB",HT:"HTI",LA:"LAO",LS:"LSO",LR:"LBR",MG:"MDG",MW:"MWI",ML:"MLI",MR:"MRT",MZ:"MOZ",MM:"MMR",NP:"NPL",NE:"NER",RW:"RWA",SN:"SEN",SL:"SLE",SO:"SOM",SS:"SSD",SD:"SDN",TZ:"TZA",TL:"TLS",TG:"TGO",UG:"UGA",YE:"YEM",ZM:"ZMB",ZW:"ZWE"},l=t=>t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"),B=t=>new Promise((o,e)=>{const a=new FileReader;a.onloadend=()=>o(String(a.result)),a.onerror=e,a.readAsDataURL(t)}),D=(t,o,e,a,n,r)=>{t.beginPath(),t.moveTo(o+r,e),t.lineTo(o+a-r,e),t.quadraticCurveTo(o+a,e,o+a,e+r),t.lineTo(o+a,e+n-r),t.quadraticCurveTo(o+a,e+n,o+a-r,e+n),t.lineTo(o+r,e+n),t.quadraticCurveTo(o,e+n,o,e+n-r),t.lineTo(o,e+r),t.quadraticCurveTo(o,e,o+r,e),t.closePath()},N=t=>t.type==="FeatureCollection"?t.features:[t],P=t=>{const o=[];return N(t).forEach(e=>{if(e.geometry){if(e.geometry.type==="Polygon"){o.push(e.geometry.coordinates);return}e.geometry.type==="MultiPolygon"&&o.push(...e.geometry.coordinates)}}),o},z=t=>{if(typeof document>"u")return null;const o=document.createElement("canvas");o.width=480,o.height=172;const e=o.getContext("2d");return e?(D(e,0,0,480,172,20),e.fillStyle="#eef5fb",e.fill(),e.strokeStyle="#d4e1ec",e.lineWidth=1.4,[80,160,240,320,400].forEach(a=>{e.beginPath(),e.moveTo(a,12),e.lineTo(a,160),e.stroke()}),[44,86,128].forEach(a=>{e.beginPath(),e.moveTo(16,a),e.lineTo(464,a),e.stroke()}),e.fillStyle="#0f4c81",e.font="700 24px Helvetica",e.fillText(t,22,34),o.toDataURL("image/png")):null},W=async t=>{const o=O[t];if(!o||typeof document>"u")return null;try{const e=await fetch(`https://cdn.jsdelivr.net/npm/world-countries@5.1.0/data/${o.toLowerCase()}.geo.json`);if(!e.ok)return null;const a=await e.json(),n=P(a),r=n.flatMap(i=>i.flat());if(r.length===0)return null;const c=r.map(([i])=>i),g=r.map(([,i])=>i),b=Math.min(...c),T=Math.max(...c),v=Math.min(...g),L=Math.max(...g),x=Math.max(1e-6,T-b),y=Math.max(1e-6,L-v),d=document.createElement("canvas");d.width=480,d.height=172;const s=d.getContext("2d");if(!s)return null;const w=18,p=Math.min((480-w*2)/x,(172-w*2)/y),E=x*p,M=y*p,$=(480-E)/2,k=(172-M)/2,R=([i,h])=>({x:$+(i-b)*p,y:172-(k+(h-v)*p)});return D(s,0,0,480,172,20),s.fillStyle="#eef5fb",s.fill(),s.fillStyle="#d7e6f1",s.strokeStyle="#0f4c81",s.lineWidth=2.2,s.lineJoin="round",n.forEach(i=>{s.beginPath(),i.forEach(h=>{h.forEach((U,A)=>{const{x:S,y:C}=R(U);A===0?s.moveTo(S,C):s.lineTo(S,C)}),s.closePath()}),s.fill("evenodd"),s.stroke()}),d.toDataURL("image/png")}catch{return null}},I=async t=>{try{const o=await fetch(`https://flagcdn.com/w160/${t.toLowerCase()}.png`);return o.ok?B(await o.blob()):null}catch{return null}},H=async t=>{const[o,e]=await Promise.all([I(t),W(t)]);return{flagSrc:o,mapSrc:e||z(t)}},m=(t,o="USD")=>{try{return new Intl.NumberFormat("en-US",{style:"currency",currency:o,notation:"compact",maximumFractionDigits:1}).format(t)}catch{return f(t,o)}},j=t=>t.replace(/([A-Z])/g," $1").trim().replace("Nutrition","Stunting").replace("Cholera And Funerals","Cholera and funerals").replace("Carbon","Carbon (GHG)"),Z=t=>{const o=Object.entries(t.costsUSD).map(([a,n])=>({key:a,label:j(a),value:n,share:t.totalCostUSD>0?n/t.totalCostUSD*100:0,color:G[a]||"#1CABE2"})).sort((a,n)=>n.value-a.value).slice(0,5),e=Math.max(...o.map(a=>a.value),1);return o.map(a=>`
    <div class="chart-row">
      <div class="chart-head">
        <span>${l(a.label)}</span>
        <span>${l(`${m(a.value)} | ${u(a.share)}%`)}</span>
      </div>
      <div class="track"><div class="fill" style="width:${Math.max(8,a.value/e*100)}%;background:${a.color};"></div></div>
    </div>
  `).join("")},q=(t,o)=>{const e=F(t.outputs),a=e.topDrivers.slice(0,3).map(r=>r.label.toLowerCase()).join(", "),n=t.outputs.costsUSD.healthCare+t.outputs.costsUSD.mortality+t.outputs.costsUSD.choleraAndFunerals;return`<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <title>${l(t.countryName)} Sanitation Brief</title>
  <style>
    @page { size: A4; margin: 14mm; }
    body { font-family: Arial, sans-serif; color: #0f172a; background: #f4f8fb; }
    .shell { background: #ffffff; border: 1px solid #dbe4ee; border-radius: 18px; padding: 18px; }
    .top { width: 100%; border-collapse: separate; border-spacing: 10px 0; margin-bottom: 10px; }
    .hero { width: 68%; background: #0f4c81; color: #ffffff; border-radius: 16px; padding: 16px; vertical-align: top; }
    .hero .eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.85; margin-bottom: 6px; }
    .hero .title { font-size: 28px; font-weight: 700; margin-bottom: 6px; }
    .hero .lead { font-size: 13px; line-height: 1.35; margin-bottom: 12px; }
    .hero .value { font-size: 36px; font-weight: 700; line-height: 1.05; margin-bottom: 6px; }
    .hero .sub { font-size: 11px; line-height: 1.3; }
    .media { width: 32%; background: #f8fbff; border: 1px solid #dbe4ee; border-radius: 16px; padding: 10px; vertical-align: top; }
    .media-table { width: 100%; border-collapse: separate; border-spacing: 8px 0; }
    .map-box { width: 72%; height: 128px; background: #eef5fb; border: 1px solid #dbe4ee; border-radius: 12px; text-align: center; vertical-align: middle; }
    .flag-box { width: 28%; height: 128px; background: #ffffff; border: 1px solid #dbe4ee; border-radius: 12px; text-align: center; vertical-align: middle; }
    .map-box img { max-width: 100%; max-height: 122px; }
    .flag-box img { max-width: 72px; max-height: 52px; }
    .metrics { width: 100%; border-collapse: separate; border-spacing: 10px 0; margin-bottom: 10px; }
    .metric { width: 33.33%; background: #f8fbff; border: 1px solid #dbe4ee; border-radius: 12px; padding: 10px; vertical-align: top; }
    .metric .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 4px; }
    .metric .value { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
    .metric .text { font-size: 11px; color: #475569; line-height: 1.3; }
    .content { width: 100%; border-collapse: separate; border-spacing: 10px 0; margin-bottom: 10px; }
    .panel { background: #ffffff; border: 1px solid #dbe4ee; border-radius: 14px; padding: 12px; vertical-align: top; }
    .panel h3 { margin: 0 0 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #0f4c81; }
    .note { font-size: 11px; color: #64748b; margin-bottom: 8px; }
    .chart-row { margin-bottom: 8px; }
    .chart-head { display: table; width: 100%; font-size: 11px; color: #334155; margin-bottom: 3px; }
    .chart-head span { display: table-cell; }
    .chart-head span:last-child { text-align: right; color: #64748b; }
    .track { width: 100%; height: 8px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
    .fill { height: 8px; border-radius: 999px; }
    .callout { background: #f8fafc; border: 1px solid #dbe4ee; border-radius: 10px; padding: 9px; margin-bottom: 8px; }
    .callout strong { display: block; font-size: 11px; margin-bottom: 4px; }
    .callout p { margin: 0; font-size: 11px; color: #334155; line-height: 1.35; }
    .method-table { width: 100%; border-collapse: separate; border-spacing: 8px 0; }
    .method { width: 33.33%; background: #f8fafc; border: 1px solid #dbe4ee; border-radius: 10px; padding: 9px; vertical-align: top; }
    .method strong { display: block; font-size: 11px; margin-bottom: 4px; }
    .method p { margin: 0; font-size: 10.5px; color: #334155; line-height: 1.35; }
    .footer { width: 100%; border-top: 1px solid #dbe4ee; padding-top: 8px; font-size: 10px; color: #64748b; }
    .footer td { vertical-align: top; }
    .footer strong { color: #0f172a; }
    a { color: #0f4c81; text-decoration: none; }
  </style>
</head>
<body>
  <div class="shell">
    <table class="top" role="presentation">
      <tr>
        <td class="hero">
          <div class="eyebrow">Sanitation Economic Burden Brief</div>
          <div class="title">${l(t.countryName)}</div>
          <div class="lead">Poor sanitation is imposing a recurring economic burden that undermines growth, household welfare, and service delivery.</div>
          <div class="value">${l(m(t.outputs.totalCostUSD))}</div>
          <div class="sub">Estimated annual loss in ${t.inputs.macro.analysisYear}, equal to ${u(t.outputs.percentGDP)}% of GDP.</div>
        </td>
        <td class="media">
          <table class="media-table" role="presentation">
            <tr>
              <td class="map-box">${o.mapSrc?`<img src="${o.mapSrc}" alt="${l(t.countryName)} map" />`:""}</td>
              <td class="flag-box">${o.flagSrc?`<img src="${o.flagSrc}" alt="${l(t.countryName)} flag" />`:""}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table class="metrics" role="presentation">
      <tr>
        <td class="metric">
          <div class="label">Annual Economic Loss</div>
          <div class="value">${l(m(t.outputs.totalCostUSD))}</div>
          <div class="text">Estimated annual burden from poor sanitation.</div>
        </td>
        <td class="metric">
          <div class="label">Health-Linked Losses</div>
          <div class="value">${l(m(n))}</div>
          <div class="text">Treatment costs, mortality losses, and outbreak response combined.</div>
        </td>
        <td class="metric">
          <div class="label">Impact On GDP</div>
          <div class="value">${u(t.outputs.percentGDP)}%</div>
          <div class="text">Share of national economic output absorbed each year.</div>
        </td>
      </tr>
    </table>

    <table class="content" role="presentation">
      <tr>
        <td class="panel" style="width:56%;">
          <h3>Where The Losses Occur</h3>
          <div class="note">Largest annual cost drivers shaping the investment case.</div>
          ${Z(t.outputs)}
        </td>
        <td class="panel" style="width:44%;">
          <h3>Investment Case</h3>
          <div class="callout">
            <strong>Why this matters</strong>
            <p>${l(`${e.headline}, equal to ${e.percentGdp}. This is avoidable loss that weakens households, services, and growth.`)}</p>
          </div>
          <div class="callout">
            <strong>Where action can recover value</strong>
            <p>${l(`The largest losses are concentrated in ${a}. These are the clearest channels for an avoided-cost investment case.`)}</p>
          </div>
          <div class="callout">
            <strong>Why invest now</strong>
            <p>Better sanitation can cut preventable illness, reduce fiscal pressure, and unlock more productive use of time and income.</p>
          </div>
        </td>
      </tr>
    </table>

    <div class="panel">
      <h3>Methodology</h3>
      <table class="method-table" role="presentation">
        <tr>
          <td class="method">
            <strong>Health valuation</strong>
            <p>Captures diarrheal treatment costs, mortality losses, and outbreak and funeral costs linked to poor sanitation.</p>
          </td>
          <td class="method">
            <strong>Economic valuation</strong>
            <p>Values lost productivity, future earnings losses from stunting, time losses, tourism impacts, and climate costs.</p>
          </td>
          <td class="method">
            <strong>Data alignment</strong>
            <p>Uses a common model year with FX aligned to that year where possible. This export uses ${t.inputs.macro.analysisYear} as the calculation year.</p>
          </td>
        </tr>
      </table>
    </div>

    <table class="footer" role="presentation">
      <tr>
        <td style="width:33%;"><strong>Full totals:</strong> ${l(f(t.outputs.totalCostUSD))}</td>
        <td style="width:33%;"><strong>Local currency:</strong> ${l(f(t.outputs.totalCostLocal,t.inputs.macro.currencyCode))}</td>
        <td style="width:34%;"><strong>Model:</strong> <a href="https://washways.org/sanitation-model/">washways.org/sanitation-model</a></td>
      </tr>
    </table>
  </div>
</body>
</html>`},J=async t=>{let o={};try{o=await H(t.countryCode)}catch(c){console.warn("Word assets could not be prepared",c)}const e=q(t,o),a=new Blob(["\uFEFF",e],{type:"application/msword;charset=utf-8"}),n=URL.createObjectURL(a),r=document.createElement("a");r.href=n,r.download=`${t.countryName.toLowerCase().replace(/[^a-z0-9]+/g,"-")}-sanitation-brief.doc`,document.body.appendChild(r),r.click(),r.remove(),URL.revokeObjectURL(n)};export{J as downloadEditableWordDoc};
