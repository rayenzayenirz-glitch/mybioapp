"use client";

import { FormEvent, useState } from "react";

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
  takesAntibiotics: YesNo;
  Antibiotic: string;
};

type PredictionResponse = {
  recommendation: string;
  confidence: number;
};

const antibioticOptions = [
  "AMX/AMP",
  "AMC",
  "CZ",
  "FOX",
  "CTX/CRO",
  "IPM",
  "GEN",
  "AN",
  "Acide nalidixique",
  "ofx",
  "CIP",
  "C",
  "Co-trimoxazole",
  "Furanes",
  "colistine",
];

const initialFormState: FormState = {
  ID: "",
  Age: "",
  Gender: "Male",
  Diabetes: "no",
  Hypertension: "no",
  Hospital_before: "no",
  Infection_Freq: "",
  takesAntibiotics: "no",
  Antibiotic: "",
};

export default function Home() {
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormData((previous) => {
      const next = { ...previous, [field]: value } as FormState;

      if (field === "takesAntibiotics" && value === "no") {
        next.Antibiotic = "";
      }

      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (formData.takesAntibiotics === "yes" && !formData.Antibiotic) {
      setError("Please select an antibiotic.");
      return;
    }

    const payload = {
      ...formData,
      Age: Number(formData.Age),
      Infection_Freq: Number(formData.Infection_Freq),
      Antibiotic: formData.takesAntibiotics === "yes" ? formData.Antibiotic : null,
    };

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch prediction result.");
      }

      const json = (await response.json()) as PredictionResponse;
      setResult(json);
    } catch (submitError) {
      if (submitError instanceof Error) {
        setError(submitError.message);
      } else {
        setError("Something went wrong while submitting the form.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <main className="w-full max-w-3xl rounded-3xl border border-slate-200/70 bg-white/85 p-6 shadow-[0_20px_65px_-25px_rgba(15,23,42,0.45)] backdrop-blur md:p-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Patient Intake</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Antibiotic Recommendation Tool
          </h1>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Enter patient details and submit to receive a prediction from the API route.
          </p>
        </div>

        <form className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">ID</span>
            <input
              type="text"
              value={formData.ID}
              onChange={(event) => updateField("ID", event.target.value)}
              required
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none ring-sky-300 transition focus:ring-2"
              placeholder="Patient identifier"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">Age</span>
            <input
              type="number"
              min={0}
              value={formData.Age}
              onChange={(event) => updateField("Age", event.target.value)}
              required
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none ring-sky-300 transition focus:ring-2"
              placeholder="e.g. 45"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">Gender</span>
            <select
              value={formData.Gender}
              onChange={(event) => updateField("Gender", event.target.value as Gender)}
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none ring-sky-300 transition focus:ring-2"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">Diabetes</span>
            <select
              value={formData.Diabetes}
              onChange={(event) => updateField("Diabetes", event.target.value as YesNo)}
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none ring-sky-300 transition focus:ring-2"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">Hypertension</span>
            <select
              value={formData.Hypertension}
              onChange={(event) => updateField("Hypertension", event.target.value as YesNo)}
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none ring-sky-300 transition focus:ring-2"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">Hospital_before</span>
            <select
              value={formData.Hospital_before}
              onChange={(event) => updateField("Hospital_before", event.target.value as YesNo)}
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none ring-sky-300 transition focus:ring-2"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">Infection_Freq</span>
            <input
              type="number"
              min={0}
              value={formData.Infection_Freq}
              onChange={(event) => updateField("Infection_Freq", event.target.value)}
              required
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none ring-sky-300 transition focus:ring-2"
              placeholder="e.g. 2"
            />
          </label>

          <label className="flex flex-col gap-2 sm:col-span-2">
            <span className="text-sm font-medium text-slate-700">Do you take antibiotics?</span>
            <select
              value={formData.takesAntibiotics}
              onChange={(event) => updateField("takesAntibiotics", event.target.value as YesNo)}
              className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none ring-sky-300 transition focus:ring-2"
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>

          {formData.takesAntibiotics === "yes" && (
            <label className="flex flex-col gap-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">Select antibiotic</span>
              <select
                value={formData.Antibiotic}
                onChange={(event) => updateField("Antibiotic", event.target.value)}
                required
                className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none ring-sky-300 transition focus:ring-2"
              >
                <option value="">Choose one</option>
                {antibioticOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="sm:col-span-2 inline-flex h-12 items-center justify-center rounded-xl bg-sky-700 px-4 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? "Submitting..." : "Submit for Recommendation"}
          </button>
        </form>

        {error && (
          <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {result && (
          <section className="mt-6 rounded-2xl border border-sky-200 bg-sky-50/70 p-5">
            <h2 className="text-lg font-semibold text-slate-900">Result</h2>
            <p className="mt-2 text-sm text-slate-700">
              <span className="font-medium text-slate-900">Recommendation:</span> {result.recommendation}
            </p>
            <p className="mt-1 text-sm text-slate-700">
              <span className="font-medium text-slate-900">Confidence:</span> {result.confidence}
            </p>
          </section>
        )}

        <p className="mt-6 text-center text-sm text-slate-600">
          This tool does not provide medical advice. Consult a doctor.
        </p>
      </main>
    </div>
  );
}
