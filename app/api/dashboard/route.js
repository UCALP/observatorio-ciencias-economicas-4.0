import {NextResponse} from "next/server";
import {admin} from "../../../lib/supabase";
export const dynamic="force-dynamic";

const catalogs={
  IA:["ChatGPT","Microsoft Copilot","Copilot","Gemini","Claude","Perplexity"],
  "Datos / BI":["Power BI","Tableau","Looker","Qlik","Excel","Python","R"],
  ERP:["SAP","Odoo","Tango","Bejerman","Oracle NetSuite","NetSuite","Microsoft Dynamics","Dynamics","TOTVS","Softland","Calipso","Axoft"],
  Automatización:["Power Automate","Zapier","Make","Apps Script","UiPath","Automation Anywhere"],
  CRM:["Salesforce","HubSpot","Zoho"],
  "Contable / fiscal":["Holistor","Onvio","Xubio","Colppy","QuickBooks","ARCA","AFIP"]
};
const norm=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
const pct=(n,t)=>t?Math.round(n*1000/t)/10:0;
const answerText=v=>Array.isArray(v)?v.join(" · "):String(v??"");
const publicQuestion=q=>!/(nombre|apellido|matr[ií]cula|correo|email|tel[eé]fono|dni|domicilio)/i.test(q);

function distribution(rows,matcher,limit=8){
  const counts={}; let respondents=0;
  for(const r of rows){
    const entries=Object.entries(r.payload||{}).filter(([q])=>matcher(norm(q)));
    if(!entries.length) continue;
    respondents++;
    const seen=new Set();
    for(const [,v] of entries){
      const raw=answerText(v);
      raw.split(/[,;\n]| · /).map(x=>x.trim()).filter(Boolean).forEach(x=>seen.add(x));
    }
    seen.forEach(x=>counts[x]=(counts[x]||0)+1);
  }
  return Object.entries(counts).map(([label,count])=>({label,count,pct:pct(count,respondents)}))
    .sort((a,b)=>b.count-a.count).slice(0,limit);
}

export async function GET(){
  const db=admin();
  if(!db)return NextResponse.json({configured:false,total:0});
  const {data,error}=await db.from("responses").select("payload,created_at,form_timestamp").order("created_at",{ascending:true});
  if(error)return NextResponse.json({error:error.message},{status:500});
  const rows=data||[], total=rows.length, techCounts={}, familyCounts={};
  Object.keys(catalogs).forEach(k=>familyCounts[k]=0);

  for(const r of rows){
    const txt=norm(JSON.stringify(r.payload||{}));
    for(const [fam,arr] of Object.entries(catalogs)){
      let hit=false;
      for(const t of arr){
        if(txt.includes(norm(t))){techCounts[t]=(techCounts[t]||0)+1;hit=true;}
      }
      if(hit)familyCounts[fam]++;
    }
  }

  const questions={};
  for(const r of rows) for(const [q,v] of Object.entries(r.payload||{})){
    if(!publicQuestion(q)) continue;
    if(!questions[q]) questions[q]={q,answered:0,values:{}};
    const raw=answerText(v).trim(); if(!raw) continue;
    questions[q].answered++;
    raw.split(/[,;\n]| · /).map(x=>x.trim()).filter(Boolean).forEach(x=>{
      questions[q].values[x]=(questions[q].values[x]||0)+1;
    });
  }
  const questionSummaries=Object.values(questions).map(x=>({
    question:x.q,answered:x.answered,
    items:Object.entries(x.values).map(([label,count])=>({label,count,pct:pct(count,x.answered)})).sort((a,b)=>b.count-a.count).slice(0,8)
  })).filter(x=>x.answered>0 && x.items.length>0);

  const first=rows[0]?.form_timestamp||rows[0]?.created_at||null;
  const last=rows.at(-1)?.form_timestamp||rows.at(-1)?.created_at||null;

  return NextResponse.json({
    configured:true,total,updated:new Date().toISOString(),first,last,
    status:total<10?"Relevamiento en curso":total<30?"Muestra en crecimiento":"Base analítica activa",
    tech:Object.entries(techCounts).map(([label,count])=>({label,count,pct:pct(count,total)})).sort((a,b)=>b.count-a.count),
    families:Object.entries(familyCounts).map(([label,count])=>({label,count,pct:pct(count,total)})).sort((a,b)=>b.count-a.count),
    profile:distribution(rows,q=>q.includes("disciplina")||q.includes("vinculo")||q.includes("vínculo")||q.includes("actividad profesional")||q.includes("modalidad")),
    seniority:distribution(rows,q=>q.includes("antiguedad")||q.includes("antigüedad")||q.includes("experiencia")),
    geography:distribution(rows,q=>q.includes("localidad")||q.includes("provincia")||q.includes("ubicacion")||q.includes("ubicación")),
    questionSummaries
  });
}
