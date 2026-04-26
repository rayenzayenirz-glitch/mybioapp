"use client";

import { FormEvent, useState } from "react";

type RSI = "R" | "S" | "I";
type YesNo = "yes" | "no";
type Gender = "Male" | "Female";

type FormState = {
  ID: string; Age: string; Gender: Gender;
  Diabetes: YesNo; Hypertension: YesNo; Hospital_before: YesNo;
  Infection_Freq: string; species: string;
  AMX_AMP: RSI; AMC: RSI; CZ: RSI; FOX: RSI; CTX_CRO: RSI;
  IPM: RSI; GEN: RSI; AN: RSI; Acide_nalidixique: RSI;
  ofx: RSI; CIP: RSI; C: RSI; Co_trimoxazole: RSI;
  Furanes: RSI; colistine: RSI;
};

type AntibioticEntry = { antibiotic: string; family: string };
type CoLink = { source: string; target: string; value: number };
type RadarData = {
  antibiotic_resistance: number; age_risk: number; hospitalization: number;
  comorbidity: number; multi_family_spread: number; infection_recurrence: number;
};
type SimilarPatient = {
  id: string; age: number; species: string; mdr: boolean;
  diabetes: boolean; hypertension: boolean; hospital_before: boolean; infection_freq: number;
};
type PredictionResponse = {
  status: string;
  mdr_prediction: { is_mdr: boolean; label: string; probability: string; message: string };
  clinical_risk_factors: { risks: Record<string, string>; summary: string };
  antibiotic_recommendation: {
    recommended: AntibioticEntry[]; intermediate: AntibioticEntry[]; avoid: AntibioticEntry[];
    summary: { n_recommended: number; n_intermediate: number; n_avoid: number };
  };
  similar_patients: SimilarPatient[];
  radar_data: RadarData;
  coresistance_links: CoLink[];
};

const SPECIES_OPTIONS = [
  "Escherichia coli","Klebsiella pneumoniae","Proteus mirabilis",
  "Enterobacteria spp.","Citrobacter spp.","Morganella morganii",
  "Serratia marcescens","Acinetobacter baumannii","Pseudomonas aeruginosa","Other",
];

const ANTIBIOTICS: { key: keyof FormState; label: string }[] = [
  { key: "AMX_AMP", label: "Amoxicillin/Ampicillin" },
  { key: "AMC", label: "Amoxicillin-Clavulanate" },
  { key: "CZ", label: "Cefazolin" },
  { key: "FOX", label: "Cefoxitin" },
  { key: "CTX_CRO", label: "Cefotaxime/Ceftriaxone" },
  { key: "IPM", label: "Imipenem" },
  { key: "GEN", label: "Gentamicin" },
  { key: "AN", label: "Amikacin" },
  { key: "Acide_nalidixique", label: "Nalidixic Acid" },
  { key: "ofx", label: "Ofloxacin" },
  { key: "CIP", label: "Ciprofloxacin" },
  { key: "C", label: "Chloramphenicol" },
  { key: "Co_trimoxazole", label: "Co-trimoxazole" },
  { key: "Furanes", label: "Nitrofurantoin" },
  { key: "colistine", label: "Colistin" },
];

const initialFormState: FormState = {
  ID: "", Age: "", Gender: "Male", Diabetes: "no", Hypertension: "no",
  Hospital_before: "no", Infection_Freq: "", species: "Escherichia coli",
  AMX_AMP: "S", AMC: "S", CZ: "S", FOX: "S", CTX_CRO: "S", IPM: "S",
  GEN: "S", AN: "S", Acide_nalidixique: "S", ofx: "S", CIP: "S", C: "S",
  Co_trimoxazole: "S", Furanes: "S", colistine: "S",
};

const ic = "h-11 w-full rounded-xl border border-purple-200/60 bg-white/80 px-4 text-sm text-slate-800 outline-none ring-purple-400 transition focus:ring-2 focus:border-purple-400 backdrop-blur";

function RadarChart({ data, isMdr }: { data: RadarData; isMdr: boolean }) {
  const labels = [
    { key: "antibiotic_resistance", label: "AB Resistance" },
    { key: "age_risk", label: "Age Risk" },
    { key: "hospitalization", label: "Hospitalization" },
    { key: "comorbidity", label: "Comorbidity" },
    { key: "multi_family_spread", label: "Multi-Family" },
    { key: "infection_recurrence", label: "Recurrence" },
  ];
  const n = labels.length;
  const cx = 160; const cy = 160; const r = 110;
  const color = isMdr ? "#ef4444" : "#7c3aed";
  const angleOf = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i: number, radius: number) => ({ x: cx + radius * Math.cos(angleOf(i)), y: cy + radius * Math.sin(angleOf(i)) });
  const dataPoints = labels.map((l, i) => pt(i, (data[l.key as keyof RadarData] / 100) * r));
  return (
    <svg viewBox="0 0 320 320" className="w-full max-w-xs mx-auto">
      <rect width="320" height="320" fill="white" rx="16" opacity="0.5"/>
      {[0.25,0.5,0.75,1].map((f) => <polygon key={f} points={Array.from({length:n},(_,i)=>pt(i,r*f)).map(p=>`${p.x},${p.y}`).join(" ")} fill="none" stroke="#e2d9f3" strokeWidth="1"/>)}
      {Array.from({length:n},(_,i)=>{ const p=pt(i,r); return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#e2d9f3" strokeWidth="1"/>})}
      <polygon points={dataPoints.map(p=>`${p.x},${p.y}`).join(" ")} fill={color} fillOpacity={0.25} stroke={color} strokeWidth={2}/>
      {dataPoints.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={4} fill={color}/>)}
      {labels.map((l,i)=>{ const p=pt(i,r+22); return <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="#6b21a8" fontWeight="600">{l.label}</text>})}
    </svg>
  );
}

function NetworkGraph({ links }: { links: CoLink[] }) {
  const W = 480; const H = 320;
  const allNodes = Array.from(new Set(links.flatMap((l) => [l.source, l.target])));
  const nodePos: Record<string, {x:number;y:number}> = {};
  allNodes.forEach((n,i) => { const a=(2*Math.PI*i)/allNodes.length-Math.PI/2; nodePos[n]={x:W/2+130*Math.cos(a),y:H/2+100*Math.sin(a)}; });
  const maxVal = Math.max(...links.map(l=>l.value));
  return (
    <div className="overflow-x-auto rounded-xl">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl" style={{background:"linear-gradient(135deg,#1e1b4b,#312e81)"}}>
        {links.map((l,i)=>{ const s=nodePos[l.source]; const t=nodePos[l.target]; return <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="#a78bfa" strokeWidth={1+(l.value/maxVal)*5} strokeOpacity={0.2+(l.value/maxVal)*0.8}><title>{l.source} ↔ {l.target}: {(l.value*100).toFixed(1)}%</title></line>})}
        {allNodes.map(n=>{ const {x,y}=nodePos[n]; const deg=links.filter(l=>l.source===n||l.target===n).length; return <g key={n}><circle cx={x} cy={y} r={6+deg*2} fill="url(#ng)" fillOpacity={0.9}><title>{n}</title></circle><text x={x} y={y-10} textAnchor="middle" fontSize="9" fill="#e9d5ff" fontWeight="600">{n.length>10?n.slice(0,9)+"…":n}</text></g>})}
        <defs><radialGradient id="ng"><stop offset="0%" stopColor="#c084fc"/><stop offset="100%" stopColor="#7c3aed"/></radialGradient></defs>
        <text x={W/2} y={H-8} textAnchor="middle" fontSize="10" fill="#a78bfa">Hover for co-resistance strength</text>
      </svg>
    </div>
  );
}

function SimilarPatients({ patients }: { patients: SimilarPatient[] }) {
  return (
    <div className="space-y-3">
      {patients.map((p,i)=>(
        <div key={i} className={`rounded-xl border p-4 ${p.mdr ? "border-red-200 bg-red-50/80" : "border-purple-200 bg-purple-50/80"}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate-800">Patient #{p.id}</span>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${p.mdr ? "bg-red-100 text-red-700" : "bg-purple-100 text-purple-700"}`}>{p.mdr ? "⚠️ MDR" : "✅ Non-MDR"}</span>
          </div>
          <div className="grid grid-cols-2 gap-1 text-xs text-slate-600">
            <span>🧬 {p.species}</span><span>🎂 Age: {p.age}</span>
            <span>💉 Diabetes: {p.diabetes?"Yes":"No"}</span><span>🏥 Hospitalized: {p.hospital_before?"Yes":"No"}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"results"|"radar"|"network"|"similar">("results");

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(null); setResult(null); setIsSubmitting(true);
    try {
      const payload = { ...formData, Age: Number(formData.Age), Infection_Freq: Number(formData.Infection_Freq) };
      const res = await fetch("/api/predict", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error("Failed to fetch prediction.");
      setResult(await res.json()); setActiveTab("results");
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setIsSubmitting(false); }
  };

  const tabs = [
    { key: "results", label: "🧪 Prediction" },
    { key: "radar",   label: "🎯 Risk Radar" },
    { key: "network", label: "🕸️ AB Network" },
    { key: "similar", label: "🧫 Similar Cases" },
  ] as const;

  return (
    <div className="min-h-screen" style={{background:"linear-gradient(135deg,#faf5ff 0%,#ede9fe 30%,#dbeafe 70%,#f0f9ff 100%)"}}>
      {/* HEADER */}
      <header style={{background:"linear-gradient(90deg,#4c1d95,#5b21b6,#1d4ed8)"}} className="shadow-lg">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="MedyxAI" className="h-14 w-14 object-contain" onError={(e)=>{(e.target as HTMLImageElement).style.display='none'}}/>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">MedyxAI</h1>
            <p className="text-purple-200 text-xs">Where Data Meets Cure — Shaping the Future of Personalized Medicine</p>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5">
            <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"/>
            <span className="text-white text-xs font-medium">AMR Prediction Engine</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
        {/* HERO */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 rounded-full px-4 py-1.5 text-xs font-semibold mb-3">
            🦠 Multi-Drug Resistance Prediction System
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Antibiotic Resistance Analysis</h2>
          <p className="mt-2 text-slate-500 text-sm max-w-xl mx-auto">Enter patient clinical data and antibiotic susceptibility test results to receive AI-powered MDR prediction and treatment recommendations.</p>
        </div>

        {/* FORM CARD */}
        <div className="rounded-3xl border border-purple-100 bg-white/70 backdrop-blur-sm shadow-xl shadow-purple-100/50 p-6 md:p-8">
          <form className="space-y-8" onSubmit={handleSubmit}>

            {/* Patient Info */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{background:"linear-gradient(135deg,#7c3aed,#2563eb)"}}>1</div>
                <h3 className="text-base font-bold text-slate-700 uppercase tracking-widest text-xs">Patient Information</h3>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 sm:col-span-2">
                  <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Patient ID</span>
                  <input type="text" value={formData.ID} onChange={e=>updateField("ID",e.target.value)} required className={ic} placeholder="e.g. PT-001"/>
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Age</span>
                  <input type="number" min={0} value={formData.Age} onChange={e=>updateField("Age",e.target.value)} required className={ic} placeholder="e.g. 45"/>
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Gender</span>
                  <select value={formData.Gender} onChange={e=>updateField("Gender",e.target.value as Gender)} className={ic}>
                    <option value="Male">Male</option><option value="Female">Female</option>
                  </select>
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Diabetes</span>
                  <select value={formData.Diabetes} onChange={e=>updateField("Diabetes",e.target.value as YesNo)} className={ic}>
                    <option value="yes">Yes</option><option value="no">No</option>
                  </select>
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Hypertension</span>
                  <select value={formData.Hypertension} onChange={e=>updateField("Hypertension",e.target.value as YesNo)} className={ic}>
                    <option value="yes">Yes</option><option value="no">No</option>
                  </select>
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Previously Hospitalized</span>
                  <select value={formData.Hospital_before} onChange={e=>updateField("Hospital_before",e.target.value as YesNo)} className={ic}>
                    <option value="yes">Yes</option><option value="no">No</option>
                  </select>
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Infection Frequency</span>
                  <input type="number" min={0} value={formData.Infection_Freq} onChange={e=>updateField("Infection_Freq",e.target.value)} required className={ic} placeholder="e.g. 2"/>
                </label>
                <label className="flex flex-col gap-2 sm:col-span-2">
                  <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">Bacterial Species</span>
                  <select value={formData.species} onChange={e=>updateField("species",e.target.value)} className={ic}>
                    {SPECIES_OPTIONS.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              </div>
            </div>

            {/* Antibiotic Results */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{background:"linear-gradient(135deg,#7c3aed,#2563eb)"}}>2</div>
                <h3 className="text-base font-bold text-slate-700 uppercase tracking-widest text-xs">Antibiotic Susceptibility Results</h3>
              </div>
              <div className="flex gap-4 mb-4 text-xs">
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-red-400 inline-block"/><strong>R</strong> Resistant</span>
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-green-400 inline-block"/><strong>S</strong> Susceptible</span>
                <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-amber-400 inline-block"/><strong>I</strong> Intermediate</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {ANTIBIOTICS.map(({key,label})=>(
                  <label key={key} className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-slate-600">{label}</span>
                    <select value={formData[key] as RSI} onChange={e=>updateField(key,e.target.value as RSI)}
                      className={`${ic} ${formData[key]==="R"?"border-red-300 bg-red-50/80":formData[key]==="I"?"border-amber-300 bg-amber-50/80":"border-green-300 bg-green-50/80"}`}>
                      <option value="S">S — Susceptible</option>
                      <option value="R">R — Resistant</option>
                      <option value="I">I — Intermediate</option>
                    </select>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" disabled={isSubmitting}
              className="w-full h-14 rounded-2xl text-white font-bold text-base tracking-wide transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{background:"linear-gradient(90deg,#7c3aed,#2563eb)"}}>
              {isSubmitting ? "🔬 Analyzing..." : "🧬 Run MDR Analysis"}
            </button>
          </form>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
              ⚠️ {error}
            </div>
          )}

          {result && (
            <div className="mt-8">
              <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
                {tabs.map(t=>(
                  <button key={t.key} onClick={()=>setActiveTab(t.key)}
                    className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition ${activeTab===t.key ? "text-white shadow-md" : "bg-purple-50 text-purple-700 hover:bg-purple-100"}`}
                    style={activeTab===t.key?{background:"linear-gradient(90deg,#7c3aed,#2563eb)"}:{}}>
                    {t.label}
                  </button>
                ))}
              </div>

              {activeTab==="results" && (
                <div className="space-y-4">
                  <div className={`rounded-2xl border-2 p-5 ${result.mdr_prediction.is_mdr?"border-red-200 bg-gradient-to-r from-red-50 to-rose-50":"border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50"}`}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h2 className="text-xl font-bold text-slate-800">{result.mdr_prediction.is_mdr?"⚠️ MDR Detected":"✅ No MDR Detected"}</h2>
                      <span className={`text-2xl font-black ${result.mdr_prediction.is_mdr?"text-red-600":"text-purple-600"}`}>{result.mdr_prediction.probability}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{result.mdr_prediction.message}</p>
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5">
                    <h2 className="font-bold text-slate-800 mb-3">🩺 Clinical Risk Factors</h2>
                    <ul className="space-y-2">
                      {Object.values(result.clinical_risk_factors.risks).map((risk,i)=>(
                        <li key={i} className="flex gap-2 text-sm text-slate-700 bg-white/60 rounded-lg px-3 py-2"><span>•</span><span>{risk}</span></li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5">
                    <h2 className="font-bold text-slate-800 mb-4">💊 Antibiotic Recommendations</h2>
                    {result.antibiotic_recommendation.recommended.length>0&&(
                      <div className="mb-4">
                        <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2">✅ Recommended ({result.antibiotic_recommendation.summary.n_recommended})</p>
                        <div className="flex flex-wrap gap-2">{result.antibiotic_recommendation.recommended.map((ab,i)=><span key={i} className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1.5 rounded-full border border-green-200">{ab.antibiotic}</span>)}</div>
                      </div>
                    )}
                    {result.antibiotic_recommendation.intermediate.length>0&&(
                      <div className="mb-4">
                        <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">⚠️ Intermediate ({result.antibiotic_recommendation.summary.n_intermediate})</p>
                        <div className="flex flex-wrap gap-2">{result.antibiotic_recommendation.intermediate.map((ab,i)=><span key={i} className="bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-200">{ab.antibiotic}</span>)}</div>
                      </div>
                    )}
                    {result.antibiotic_recommendation.avoid.length>0&&(
                      <div>
                        <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-2">❌ Avoid ({result.antibiotic_recommendation.summary.n_avoid})</p>
                        <div className="flex flex-wrap gap-2">{result.antibiotic_recommendation.avoid.map((ab,i)=><span key={i} className="bg-red-100 text-red-800 text-xs font-semibold px-3 py-1.5 rounded-full border border-red-200">{ab.antibiotic}</span>)}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab==="radar"&&(
                <div className="rounded-2xl border border-purple-200 bg-white/70 p-5">
                  <h2 className="font-bold text-slate-800 mb-1">🎯 MDR Risk Radar</h2>
                  <p className="text-xs text-slate-400 mb-4">Patient risk profile across 6 clinical dimensions</p>
                  <RadarChart data={result.radar_data} isMdr={result.mdr_prediction.is_mdr}/>
                </div>
              )}

              {activeTab==="network"&&(
                <div className="rounded-2xl border border-purple-200 bg-white/70 p-5">
                  <h2 className="font-bold text-slate-800 mb-1">🕸️ Antibiotic Co-Resistance Network</h2>
                  <p className="text-xs text-slate-400 mb-4">Computed from 9,714 real bacterial isolates — thicker lines = stronger co-resistance</p>
                  <NetworkGraph links={result.coresistance_links}/>
                </div>
              )}

              {activeTab==="similar"&&(
                <div className="rounded-2xl border border-purple-200 bg-white/70 p-5">
                  <h2 className="font-bold text-slate-800 mb-1">🧫 Similar Patient Cases</h2>
                  <p className="text-xs text-slate-400 mb-4">3 most similar patients from dataset (k-NN matching)</p>
                  <SimilarPatients patients={result.similar_patients}/>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          MedyxAI — This tool does not provide medical advice. Always consult a qualified physician.
        </p>
      </main>
    </div>
  );
}
