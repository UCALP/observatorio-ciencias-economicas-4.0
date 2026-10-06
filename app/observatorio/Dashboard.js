"use client";
import {useEffect,useMemo,useState} from "react";

function Bars({items=[],minN=1,total=0}){
  if(total<minN)return <div className="empty">Se habilitará cuando la muestra alcance el umbral mínimo.</div>;
  if(!items.length)return <div className="empty">Todavía no hay respuestas para esta dimensión.</div>;
  return <div className="bars">{items.map(x=><div className="barItem" key={x.label}>
    <div className="row"><b>{x.label}</b><span>{x.count} · {x.pct}%</span></div>
    <div className="bar"><div className="fill" style={{width:`${Math.min(100,x.pct)}%`}}/></div>
  </div>)}</div>
}
function Kpi({value,label,sub}){return <div className="card kpiCard"><div className="kpi">{value}</div><div className="kpiLabel">{label}</div>{sub&&<div className="muted">{sub}</div>}</div>}
const fmt=d=>d?new Intl.DateTimeFormat("es-AR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}).format(new Date(d)):"—";

export default function Dashboard(){
 const[d,setD]=useState(null),[tab,setTab]=useState("tecnologia");
 useEffect(()=>{let live=true;const load=()=>fetch("/api/dashboard",{cache:"no-store"}).then(r=>r.json()).then(x=>live&&setD(x));load();const id=setInterval(load,60000);return()=>{live=false;clearInterval(id)}},[]);
 const sections=useMemo(()=>d?.questionSummaries||[],[d]);
 if(!d)return <div className="card loading">Conectando con la base real…</div>;
 if(!d.configured)return <div className="card"><h2>Observatorio listo para conectar</h2><p>Falta completar la conexión con Supabase.</p></div>;
 const enough=d.total>=10, benchmark=d.total>=30;
 return <div className="dashboardV2">
   <div className="pulse">
     <div><span className="liveDot"/> DATOS REALES · actualización automática cada 60 s</div>
     <div>Última actualización: {fmt(d.updated)}</div>
   </div>
   <div className="grid">
     <Kpi value={d.total} label="respuestas reales" sub={d.status}/>
     <Kpi value={d.tech?.length||0} label="tecnologías mencionadas" sub="herramientas declaradas"/>
     <Kpi value={`${d.families?.find(x=>x.label==="IA")?.pct||0}%`} label="menciones de IA" sub="sobre respuestas acumuladas"/>
     <Kpi value={benchmark?"ACTIVO":"EN CURSO"} label="nivel analítico" sub={benchmark?"cruces habilitables":"sin sobrerrepresentar muestras pequeñas"}/>
   </div>

   {!enough&&<div className="sampleNotice"><b>Relevamiento en curso.</b> Ya mostramos conteos descriptivos. Los cruces y comparaciones se habilitan al crecer la muestra para evitar conclusiones prematuras.</div>}

   <div className="tabs">
     {["tecnologia","perfil","encuesta","oportunidades"].map(t=><button key={t} onClick={()=>setTab(t)} className={tab===t?"active":""}>{({tecnologia:"Tecnología",perfil:"Perfil",encuesta:"Encuesta",oportunidades:"Radar institucional"})[t]}</button>)}
   </div>

   {tab==="tecnologia"&&<div className="grid">
     <div className="card s8"><div className="sectionTag">ECOSISTEMA TECNOLÓGICO</div><h2>Radar de herramientas</h2><p className="muted">Menciones detectadas en las respuestas reales. No implica certificación de uso intensivo.</p><Bars items={d.tech} total={d.total}/></div>
     <div className="card s4"><div className="sectionTag">FAMILIAS</div><h2>Huella digital</h2><div className="familyGrid">{d.families?.map(x=><div className="family" key={x.label}><span>{x.label}</span><strong>{x.pct}%</strong><small>{x.count} respuestas</small></div>)}</div></div>
   </div>}

   {tab==="perfil"&&<div className="grid">
     <div className="card s6"><div className="sectionTag">CARACTERIZACIÓN</div><h2>Perfil profesional</h2><Bars items={d.profile} total={d.total}/></div>
     <div className="card s6"><div className="sectionTag">TRAYECTORIA</div><h2>Antigüedad / experiencia</h2><Bars items={d.seniority} total={d.total}/></div>
     <div className="card s12"><div className="sectionTag">TERRITORIO</div><h2>Distribución geográfica</h2>{d.geography?.length?<Bars items={d.geography} total={d.total}/>:<div className="empty">La dimensión territorial aparecerá automáticamente cuando el formulario incorpore localidad/provincia.</div>}</div>
   </div>}

   {tab==="encuesta"&&<div className="questionGrid">{sections.slice(0,18).map((q,i)=><div className="card questionCard" key={q.question}><div className="qNum">{String(i+1).padStart(2,"0")}</div><h3>{q.question}</h3><div className="muted">{q.answered} respuestas</div><Bars items={q.items} total={d.total}/></div>)}</div>}

   {tab==="oportunidades"&&<div className="grid">
     <div className="card s12 opportunityHero"><div><div className="sectionTag">UCALP × CPCE LA PLATA</div><h2>Radar de oportunidades institucionales</h2><p>Convierte evidencia del relevamiento en una agenda potencial de formación, certificaciones, investigación aplicada y alianzas tecnológicas.</p></div><div className="radarBadge">{benchmark?"EVIDENCIA ACTIVA":"EN CONSTRUCCIÓN"}</div></div>
     {["IA aplicada a Ciencias Económicas","Datos, BI y analítica profesional","ERP y gestión digital","Automatización de procesos"].map((x,i)=><div className="card s3 opp" key={x}><span>0{i+1}</span><h3>{x}</h3><p className="muted">{benchmark?"Prioridad a calcular con la base real.":"Se priorizará cuando la muestra alcance volumen suficiente."}</p></div>)}
     <div className="card s12"><div className="callout"><b>IMD-PCE · Índice de Madurez Digital.</b> Se incorporará como índice exploratorio cuando exista base suficiente para calcularlo sin presentar una falsa precisión estadística.</div></div>
   </div>}

   <div className="methodNote">Resultados descriptivos agregados. Los datos identificatorios —si se incorporan al relevamiento— no se exponen públicamente. Los textos abiertos no se publican de forma individual.</div>
 </div>
}
