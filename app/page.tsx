"use client";

import { FormEvent, useState } from "react";

type RSI = "R" | "S" | "I";
type YesNo = "yes" | "no";
type Gender = "Male" | "Female";

type FormState = {
  ID: string;
  Age: string;
  Gender: Gender;
  Diabetes: YesNo;
  Hypertension: YesNo;
  Hospital_before: YesNo;
  Infection_Freq: string;
  species: string;
  // 15 antibiotics
  AMX_AMP: RSI;
  AMC: RSI;
  CZ: RSI;
  FOX: RSI;
  CTX_CRO: RSI;
  IPM: RSI;
  GEN: RSI;
  AN: RSI;
  Acide_nalidixique: RSI;
  ofx: RSI;
  CIP: RSI;
  C: RSI;
  Co_trimoxazole: RSI;
  Furanes: RSI;
  colistine: RSI;
};

type AntibioticEntry = { antibiotic: string; family: string };

type PredictionResponse = {
  status: string;
  mdr_prediction: {
    is_mdr: boolean;
    label: string;
    probability: string;
    message: string;
  };
  clinical_risk_factors: {
    risks: Record<string, string>;
    summary: string;
  };
  antibiotic_recommendation: {
    recommended: AntibioticEntry[];
    intermediate: AntibioticEntry[];
    avoid: AntibioticEntry[];
    summary: { n_recommended: number; n_intermediate: number; n_avoid: number };
  };
};

const SPECIES_OPTIONS = [
  "Escherichia coli",
  "Klebsiella pneumoniae",
  "Proteus mirabilis",
  "Enterobacteria spp.",
  "Citrobacter spp.",
  "Morganella morganii",
  "Serratia marcescens",
  "Acinetobacter baumannii",
  "Pseudomonas aeruginosa",
  "Other",
];

const ANTIBIOTICS: { key: keyof FormState; label: string }[] = [
  { key: "AMX_AMP",          label: "Amoxicillin/Ampicillin" },
  { key: "AMC",              label: "Amoxicillin-Clavulanate" },
  { key: "CZ",               label: "Cefazolin" },
  { key: "FOX",              label: "Cefoxitin" },
  { key: "CTX_CRO",          label: "Cefotaxime/Ceftriaxone" },
  { key: "IPM",              label: "Imipenem" },
  { key: "GEN",              label: "Gentamicin" },
  { key: "AN",               label: "Amikacin" },
  { key: "Acide_nalidixique",label: "Nalidixic Acid" },
  { key: "ofx",              label: "Ofloxacin" },
  { key: "CIP",              label: "Ciprofloxacin" },
  { key: "C",                label: "Chloramphenicol" },
  { key: "Co_trimoxazole",   label: "Co-trimoxazole" },
  { key: "Furanes",          label: "Nitrofurantoin" },
  { key: "colistine",        label: "Colistin" },
];

const initialFormState: FormState = {
  ID: "", Age: "", Gender: "Male",
  Diabetes: "no", Hypertension: "no", Hospital_before: "no",
  Infection_Freq: "", species: "Escherichia coli",
  AMX_AMP: "S", AMC: "S", CZ: "S", FOX: "S", CTX_CRO: "S",
  IPM: "S", GEN: "S", AN: "S", Acide_nalidixique: "S",
  ofx: "S", CIP: "S", C: "S", Co_trimoxazole: "S",
  Furanes: "S", colistine: "S",
};

const inputClass = "h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none ring-sky-300 transition focus:ring-2";

export default function Home() {
  const [formData, setFormData]     = useState<FormState>(initialFormState);
  const [result, setResult]         = useState<PredictionResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResult(null);
    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        Age: Number(formData.Age),
        Infection_Freq: Number(formData.Infection_Freq),
      };

      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to fetch prediction.");
      const json = (await response.json()) as PredictionResponse;
      setResult(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <main className="w-full max-w-3xl rounded-3xl border border-slate-200/70 bg-white/85 p-6 shadow-[0_20px_65px_-25px_rgba(15,23,42,0.45)] backdrop-blur md:p-8">

        {/* Header */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Patient Intake</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Antibiotic Recommendation Tool
          </h1>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Enter patient details and antibiotic test results to get MDR prediction and recommendations.
          </p>
        </div>

        <form className="mt-8 space-y-8" onSubmit={handleSubmit}>

          {/* ── SECTION 1: Patient Info ── */}
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-500">
              Patient Information
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

              <label className="flex flex-col gap-2 sm:col-span-2">
                <span className="text-sm font-medium text-slate-700">Patient ID</span>
                <input type="text" value={formData.ID}
                  onChange={(e) => updateField("ID", e.target.value)}
                  required className={inputClass} placeholder="Patient identifier" />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Age</span>
                <input type="number" min={0} value={formData.Age}
                  onChange={(e) => updateField("Age", e.target.value)}
                  required className={inputClass} placeholder="e.g. 45" />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Gender</span>
                <select value={formData.Gender}
                  onChange={(e) => updateField("Gender", e.target.value as Gender)}
                  className={inputClass}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Diabetes</span>
                <select value={formData.Diabetes}
                  onChange={(e) => updateField("Diabetes", e.target.value as YesNo)}
                  className={inputClass}>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Hypertension</span>
                <select value={formData.Hypertension}
                  onChange={(e) => updateField("Hypertension", e.target.value as YesNo)}
                  className={inputClass}>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Previously Hospitalized</span>
                <select value={formData.Hospital_before}
                  onChange={(e) => updateField("Hospital_before", e.target.value as YesNo)}
                  className={inputClass}>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Infection Frequency</span>
                <input type="number" min={0} value={formData.Infection_Freq}
                  onChange={(e) => updateField("Infection_Freq", e.target.value)}
                  required className={inputClass} placeholder="e.g. 2" />
              </label>

              <label className="flex flex-col gap-2 sm:col-span-2">
                <span className="text-sm font-medium text-slate-700">Bacterial Species</span>
                <select value={formData.species}
                  onChange={(e) => updateField("species", e.target.value)}
                  className={inputClass}>
                  {SPECIES_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>

            </div>
          </div>

          {/* ── SECTION 2: Antibiotic Test Results ── */}
          <div>
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-widest text-slate-500">
              Antibiotic Test Results
            </h2>
            <p className="mb-4 text-xs text-slate-400">
              R = Resistant &nbsp;|&nbsp; S = Susceptible &nbsp;|&nbsp; I = Intermediate
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {ANTIBIOTICS.map(({ key, label }) => (
                <label key={key} className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                  <select
                    value={formData[key] as RSI}
                    onChange={(e) => updateField(key, e.target.value as RSI)}
                    className={inputClass}>
                    <option value="S">S — Susceptible</option>
                    <option value="R">R — Resistant</option>
                    <option value="I">I — Intermediate</option>
                  </select>
                </label>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={isSubmitting}
            className="w-full inline-flex h-12 items-center justify-center rounded-xl bg-sky-700 px-4 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-400">
            {isSubmitting ? "Analyzing..." : "Get MDR Prediction & Recommendations"}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* ── RESULTS ── */}
        {result && (
          <div className="mt-8 space-y-5">

            {/* OUTPUT 1: MDR Flag */}
            <section className={`rounded-2xl border p-5 ${result.mdr_prediction.is_mdr
              ? "border-rose-200 bg-rose-50/70"
              : "border-emerald-200 bg-emerald-50/70"}`}>
              <h2 className="text-lg font-semibold text-slate-900">
                {result.mdr_prediction.is_mdr ? "⚠️ MDR Detected" : "✅ No MDR Detected"}
              </h2>
              <p className="mt-1 text-sm text-slate-700">{result.mdr_prediction.message}</p>
              <p className="mt-1 text-sm text-slate-700">
                <span className="font-medium">Probability:</span> {result.mdr_prediction.probability}
              </p>
            </section>

            {/* OUTPUT 2: Clinical Risk Factors */}
            <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
              <h2 className="text-lg font-semibold text-slate-900">🩺 Clinical Risk Factors</h2>
              <p className="mt-1 text-xs text-slate-500">{result.clinical_risk_factors.summary}</p>
              <ul className="mt-3 space-y-2">
                {Object.values(result.clinical_risk_factors.risks).map((risk, i) => (
                  <li key={i} className="text-sm text-slate-700 flex gap-2">
                    <span>•</span><span>{risk}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* OUTPUT 3: Antibiotic Recommendations */}
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
                    ⚠️ Intermediate — Use with caution ({result.antibiotic_recommendation.summary.n_intermediate})
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
                    ❌ Avoid — Resistant ({result.antibiotic_recommendation.summary.n_avoid})
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

        <p className="mt-6 text-center text-sm text-slate-600">
          This tool does not provide medical advice. Consult a doctor.
        </p>
      </main>
    </div>
  );
}
