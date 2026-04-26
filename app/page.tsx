"use client";

import { FormEvent, useState, useEffect, useRef } from "react";

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

const ic = "h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none ring-sky-300 transition focus:ring-2";

// ── RADAR CHART COMPONENT ──────────────────────────────────
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
  const color = isMdr ? "#ef4444" : "#22c55e";
  const bgColor = isMdr ? "#fef2f2" : "#f0fdf4";

  const angleOf = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i: number, radius: number) => ({
    x: cx + radius * Math.cos(angleOf(i)),
    y: cy + radius * Math.sin(angleOf(i)),
  });

  const dataPoints = labels.map((l, i) => {
    const val = (data[l.key as keyof RadarData] / 100) * r;
    return pt(i, val);
  });

  const polyPoints = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox="0 0 320 320" className="w-full max-w-xs mx-auto">
      <rect width="320" height="320" fill={bgColor} rx="16" />
      {[0.25, 0.5, 0.75, 1].map((f) => {
        const pts = Array.from({ length: n }, (_, i) => pt(i, r * f));
        return (
          <polygon key={f}
            points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none" stroke="#cbd5e1" strokeWidth="1" />
        );
      })}
      {Array.from({ length: n }, (_, i) => {
        const p = pt(i, r);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#cbd5e1" strokeWidth="1" />;
      })}
      <polygon points={polyPoints} fill={color} fillOpacity={0.35} stroke={color} strokeWidth={2} />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill={color} />
      ))}
      {labels.map((l, i) => {
        const p = pt(i, r + 22);
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
            fontSize="10" fill="#475569" fontWeight="600">
            {l.label}
          </text>
        );
      })}
      {labels.map((l, i) => {
        const val = data[l.key as keyof RadarData];
        const p = pt(i, (val / 100) * r);
        return (
          <text key={i} x={p.x + 6} y={p.y - 6} fontSize="9" fill={color} fontWeight="700">
            {val}%
          </text>
        );
      })}
    </svg>
  );
}

// ── CO-RESISTANCE NETWORK ──────────────────────────────────
function NetworkGraph({ links }: { links: CoLink[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const W = 480; const H = 340;

  const allNodes = Array.from(new Set(links.flatMap((l) => [l.source, l.target])));
  const nodePositions: Record<string, { x: number; y: number }> = {};
  allNodes.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / allNodes.length - Math.PI / 2;
    nodePositions[n] = {
      x: W / 2 + 130 * Math.cos(angle),
      y: H / 2 + 110 * Math.sin(angle),
    };
  });

  const maxVal = Math.max(...links.map((l) => l.value));

  return (
    <div className="overflow-x-auto">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl bg-slate-950">
        {links.map((l, i) => {
          const s = nodePositions[l.source];
          const t = nodePositions[l.target];
          const opacity = 0.2 + (l.value / maxVal) * 0.8;
          const strokeW = 1 + (l.value / maxVal) * 5;
          return (
            <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y}
              stroke="#38bdf8" strokeWidth={strokeW} strokeOpacity={opacity}>
              <title>{l.source} ↔ {l.target}: {(l.value * 100).toFixed(1)}% co-resistance</title>
            </line>
          );
        })}
        {allNodes.map((n) => {
          const { x, y } = nodePositions[n];
          const degree = links.filter((l) => l.source === n || l.target === n).length;
          const nodeR = 6 + degree * 2;
          return (
            <g key={n}>
              <circle cx={x} cy={y} r={nodeR} fill="#0ea5e9" fillOpacity={0.9}>
                <title>{n}</title>
              </circle>
              <text x={x} y={y - nodeR - 4} textAnchor="middle"
                fontSize="9" fill="#e2e8f0" fontWeight="600">
                {n.length > 12 ? n.slice(0, 10) + "…" : n}
              </text>
            </g>
          );
        })}
        <text x={W / 2} y={H - 8} textAnchor="middle" fontSize="10" fill="#64748b">
          Line thickness = co-resistance strength (hover for details)
        </text>
      </svg>
    </div>
  );
}

// ── SIMILAR PATIENTS ───────────────────────────────────────
function SimilarPatients({ patients }: { patients: SimilarPatient[] }) {
  return (
    <div className="space-y-3">
      {patients.map((p, i) => (
        <div key={i} className={`rounded-xl border p-4 ${p.mdr
          ? "border-rose-200 bg-rose-50"
          : "border-emerald-200 bg-emerald-50"}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-800">Patient #{p.id}</span>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${p.mdr
              ? "bg-rose-200 text-rose-800"
              : "bg-emerald-200 text-emerald-800"}`}>
              {p.mdr ? "⚠️ MDR" : "✅ Non-MDR"}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-slate-600">
            <span>🧬 {p.species}</span>
            <span>🎂 Age: {p.age}</span>
            <span>💉 Diabetes: {p.diabetes ? "Yes" : "No"}</span>
            <span>🏥 Hospitalized: {p.hospital_before ? "Yes" : "No"}</span>
            <span>💊 Infections: {p.infection_freq}</span>
            <span>❤️ Hypertension: {p.hypertension ? "Yes" : "No"}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── MAIN PAGE ──────────────────────────────────────────────
export default function Home() {
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"results" | "radar" | "network" | "similar">("results");

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null); setResult(null); setIsSubmitting(true);
    try {
      const payload = { ...formData, Age: Number(formData.Age), Infection_Freq: Number(formData.Infection_Freq) };
      const res = await fetch("/api/predict", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to fetch prediction.");
      setResult(await res.json());
      setActiveTab("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { key: "results",  label: "🧪 Prediction" },
    { key: "radar",    label: "🎯 Risk Radar" },
    { key: "network",  label: "🕸️ AB Network" },
    { key: "similar",  label: "🧫 Similar Cases" },
  ] as const;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-sky-50">
      <main className="w-full max-w-3xl rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_20px_65px_-25px_rgba(15,23,42,0.45)] backdrop-blur md:p-8">

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Patient Intake</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Antibiotic Recommendation Tool
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Enter patient details and antibiotic test results to get MDR prediction and recommendations.
          </p>
        </div>

        <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
          {/* Patient Info */}
          <div>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Patient Information</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <label className="flex flex-col gap-2 sm:col-span-2">
                <span className="text-sm font-medium text-slate-700">Patient ID</span>
                <input type="text" value={formData.ID} onChange={(e) => updateField("ID", e.target.value)}
                  required className={ic} placeholder="Patient identifier" />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Age</span>
                <input type="number" min={0} value={formData.Age}
                  onChange={(e) => updateField("Age", e.target.value)} required className={ic} placeholder="e.g. 45" />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Gender</span>
                <select value={formData.Gender} onChange={(e) => updateField("Gender", e.target.value as Gender)} className={ic}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Diabetes</span>
                <select value={formData.Diabetes} onChange={(e) => updateField("Diabetes", e.target.value as YesNo)} className={ic}>
                  <option value="yes">Yes</option><option value="no">No</option>
                </select>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Hypertension</span>
                <select value={formData.Hypertension} onChange={(e) => updateField("Hypertension", e.target.value as YesNo)} className={ic}>
                  <option value="yes">Yes</option><option value="no">No</option>
                </select>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Previously Hospitalized</span>
                <select value={formData.Hospital_before} onChange={(e) => updateField("Hospital_before", e.target.value as YesNo)} className={ic}>
                  <option value="yes">Yes</option><option value="no">No</option>
                </select>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Infection Frequency</span>
                <input type="number" min={0} value={formData.Infection_Freq}
                  onChange={(e) => updateField("Infection_Freq", e.target.value)} required className={ic} placeholder="e.g. 2" />
              </label>
              <label className="flex flex-col gap-2 sm:col-span-2">
                <span className="text-sm font-medium text-slate-700">Bacterial Species</span>
                <select value={formData.species} onChange={(e) => updateField("species", e.target.value)} className={ic}>
                  {SPECIES_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            </div>
          </div>

          {/* Antibiotic Results */}
          <div>
            <h2 className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-400">Antibiotic Test Results</h2>
            <p className="mb-4 text-xs text-slate-400">R = Resistant &nbsp;|&nbsp; S = Susceptible &nbsp;|&nbsp; I = Intermediate</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {ANTIBIOTICS.map(({ key, label }) => (
                <label key={key} className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                  <select value={formData[key] as RSI} onChange={(e) => updateField(key, e.target.value as RSI)} className={ic}>
                    <option value="S">S — Susceptible</option>
                    <option value="R">R — Resistant</option>
                    <option value="I">I — Intermediate</option>
                  </select>
                </label>
              ))}
            </div>
          </div>

          <button type="submit" disabled={isSubmitting}
            className="w-full inline-flex h-12 items-center justify-center rounded-xl bg-sky-700 px-4 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:bg-slate-400">
            {isSubmitting ? "Analyzing..." : "Get MDR Prediction & Recommendations"}
          </button>
        </form>

        {error && (
          <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        )}

        {result && (
          <div className="mt-8">
            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {tabs.map((t) => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    activeTab === t.key
                      ? "bg-sky-700 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mt-5">
              {/* TAB 1: Prediction Results */}
              {activeTab === "results" && (
                <div className="space-y-4">
                  <section className={`rounded-2xl border p-5 ${result.mdr_prediction.is_mdr
                    ? "border-rose-200 bg-rose-50/70" : "border-emerald-200 bg-emerald-50/70"}`}>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {result.mdr_prediction.is_mdr ? "⚠️ MDR Detected" : "✅ No MDR Detected"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-700">{result.mdr_prediction.message}</p>
                    <p className="mt-1 text-sm text-slate-700">
                      <span className="font-medium">Probability:</span> {result.mdr_prediction.probability}
                    </p>
                  </section>

                  <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
                    <h2 className="text-lg font-semibold text-slate-900">🩺 Clinical Risk Factors</h2>
                    <p className="mt-1 text-xs text-slate-500">{result.clinical_risk_factors.summary}</p>
                    <ul className="mt-3 space-y-2">
                      {Object.values(result.clinical_risk_factors.risks).map((risk, i) => (
                        <li key={i} className="flex gap-2 text-sm text-slate-700"><span>•</span><span>{risk}</span></li>
                      ))}
                    </ul>
                  </section>

                  <section className="rounded-2xl border border-sky-200 bg-sky-50/70 p-5">
                    <h2 className="text-lg font-semibold text-slate-900">💊 Antibiotic Recommendations</h2>
                    {result.antibiotic_recommendation.recommended.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-semibold text-emerald-700">
                          ✅ Recommended ({result.antibiotic_recommendation.summary.n_recommended})
                        </p>
                        <ul className="mt-2 space-y-1">
                          {result.antibiotic_recommendation.recommended.map((ab, i) => (
                            <li key={i} className="text-sm text-slate-700">
                              • <span className="font-medium">{ab.antibiotic}</span>
                              <span className="ml-2 text-xs text-slate-400">({ab.family})</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.antibiotic_recommendation.intermediate.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-semibold text-amber-600">
                          ⚠️ Intermediate ({result.antibiotic_recommendation.summary.n_intermediate})
                        </p>
                        <ul className="mt-2 space-y-1">
                          {result.antibiotic_recommendation.intermediate.map((ab, i) => (
                            <li key={i} className="text-sm text-slate-700">
                              • <span className="font-medium">{ab.antibiotic}</span>
                              <span className="ml-2 text-xs text-slate-400">({ab.family})</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {result.antibiotic_recommendation.avoid.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-semibold text-rose-600">
                          ❌ Avoid ({result.antibiotic_recommendation.summary.n_avoid})
                        </p>
                        <ul className="mt-2 space-y-1">
                          {result.antibiotic_recommendation.avoid.map((ab, i) => (
                            <li key={i} className="text-sm text-slate-700">
                              • <span className="font-medium">{ab.antibiotic}</span>
                              <span className="ml-2 text-xs text-slate-400">({ab.family})</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </section>
                </div>
              )}

              {/* TAB 2: Radar Chart */}
              {activeTab === "radar" && (
                <div className="rounded-2xl border border-slate-200 p-5">
                  <h2 className="text-lg font-semibold text-slate-900 mb-1">🎯 MDR Risk Radar</h2>
                  <p className="text-xs text-slate-500 mb-4">
                    Patient risk profile across 6 clinical dimensions (0–100%)
                  </p>
                  <RadarChart data={result.radar_data} isMdr={result.mdr_prediction.is_mdr} />
                </div>
              )}

              {/* TAB 3: Co-resistance Network */}
              {activeTab === "network" && (
                <div className="rounded-2xl border border-slate-200 p-5">
                  <h2 className="text-lg font-semibold text-slate-900 mb-1">🕸️ Antibiotic Co-Resistance Network</h2>
                  <p className="text-xs text-slate-500 mb-4">
                    Computed from 9,714 real bacterial isolates. Thicker lines = stronger co-resistance.
                  </p>
                  <NetworkGraph links={result.coresistance_links} />
                </div>
              )}

              {/* TAB 4: Similar Patients */}
              {activeTab === "similar" && (
                <div className="rounded-2xl border border-slate-200 p-5">
                  <h2 className="text-lg font-semibold text-slate-900 mb-1">🧫 Similar Patient Cases</h2>
                  <p className="text-xs text-slate-500 mb-4">
                    3 most similar patients from the dataset (k-NN matching on all features)
                  </p>
                  <SimilarPatients patients={result.similar_patients} />
                </div>
              )}
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-slate-600">
          This tool does not provide medical advice. Consult a doctor.
        </p>
      </main>
    </div>
  );
}
