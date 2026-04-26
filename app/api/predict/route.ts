import { NextResponse } from "next/server";
import { knnDataset, coResistanceLinks } from "@/lib/data";

const R_API_URL = "https://assisted-bin-vessels-bosnia.trycloudflare.com";

function findSimilarPatients(input: Record<string, number>, k = 3) {
  const featKeys = [
    "age","gender","Diabetes","Hypertension","Hospital_before","Infection_Freq",
    "AMX_AMP","AMC","CZ","FOX","CTX_CRO","IPM","GEN","AN",
    "Acide_nalidixique","ofx","CIP","C","Co_trimoxazole","Furanes","colistine",
  ];

  const encodeRes = (v: string) =>
    v === "R" || v === "Resistant" ? 2 : v === "I" || v === "Intermediate" ? 1 : 0;

  const inputVec = featKeys.map((k) => {
    const val = input[k];
    if (typeof val === "string") return encodeRes(val);
    return Number(val) || 0;
  });

  const distances = knnDataset.map((row, idx) => {
    const rowVec = featKeys.map((k) => Number(row[k as keyof typeof row]) || 0);
    const dist = Math.sqrt(
      rowVec.reduce((sum, v, i) => sum + Math.pow(v - inputVec[i], 2), 0)
    );
    return { idx, dist };
  });

  distances.sort((a, b) => a.dist - b.dist);
  return distances.slice(0, k).map(({ idx }) => {
    const r = knnDataset[idx];
    return {
      id:              r.ID,
      age:             r.age,
      species:         r.species,
      mdr:             r.MDR === 1 || r.MDR === "1",
      diabetes:        r.Diabetes === 1 || r.Diabetes === "1",
      hypertension:    r.Hypertension === 1 || r.Hypertension === "1",
      hospital_before: r.Hospital_before === 1 || r.Hospital_before === "1",
      infection_freq:  r.Infection_Freq,
    };
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const rPayload = {
      age:               body.Age,
      gender:            body.Gender === "Male" ? "M" : "F",
      diabetes:          body.Diabetes,
      hypertension:      body.Hypertension,
      hospital_before:   body.Hospital_before,
      infection_freq:    body.Infection_Freq,
      species:           body.species || "Escherichia coli",
      AMX_AMP:           body.AMX_AMP || "S",
      AMC:               body.AMC || "S",
      CZ:                body.CZ || "S",
      FOX:               body.FOX || "S",
      CTX_CRO:           body.CTX_CRO || "S",
      IPM:               body.IPM || "S",
      GEN:               body.GEN || "S",
      AN:                body.AN || "S",
      Acide_nalidixique: body.Acide_nalidixique || "S",
      ofx:               body.ofx || "S",
      CIP:               body.CIP || "S",
      C:                 body.C || "S",
      Co_trimoxazole:    body.Co_trimoxazole || "S",
      Furanes:           body.Furanes || "S",
      colistine:         body.colistine || "S",
    };

    const response = await fetch(`${R_API_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rPayload),
    });

    if (!response.ok) throw new Error(`R API error: ${response.status}`);
    const prediction = await response.json();

    const similarPatients = findSimilarPatients({
      age:             Number(body.Age),
      gender:          body.Gender === "Male" ? 1 : 0,
      Diabetes:        body.Diabetes === "yes" ? 1 : 0,
      Hypertension:    body.Hypertension === "yes" ? 1 : 0,
      Hospital_before: body.Hospital_before === "yes" ? 1 : 0,
      Infection_Freq:  Number(body.Infection_Freq),
      AMX_AMP:         body.AMX_AMP,
      AMC:             body.AMC,
      CZ:              body.CZ,
      FOX:             body.FOX,
      CTX_CRO:         body.CTX_CRO,
      IPM:             body.IPM,
      GEN:             body.GEN,
      AN:              body.AN,
      Acide_nalidixique: body.Acide_nalidixique,
      ofx:             body.ofx,
      CIP:             body.CIP,
      C:               body.C,
      Co_trimoxazole:  body.Co_trimoxazole,
      Furanes:         body.Furanes,
      colistine:       body.colistine,
    });

    const abCols = ["AMX_AMP","AMC","CZ","FOX","CTX_CRO","IPM","GEN","AN",
                    "Acide_nalidixique","ofx","CIP","C","Co_trimoxazole","Furanes","colistine"];
    const resistantCount = abCols.filter((c) => body[c] === "R").length;

    const radarData = {
      antibiotic_resistance: Math.round((resistantCount / abCols.length) * 100),
      age_risk:              Math.min(100, Math.round((Number(body.Age) / 90) * 100)),
      hospitalization:       body.Hospital_before === "yes" ? 100 : 0,
      comorbidity:           ((body.Diabetes === "yes" ? 1 : 0) + (body.Hypertension === "yes" ? 1 : 0)) * 50,
      multi_family_spread:   Math.round((resistantCount / 9) * 100),
      infection_recurrence:  Math.min(100, Math.round((Number(body.Infection_Freq) / 5) * 100)),
    };

    return NextResponse.json({
      ...prediction,
      similar_patients:   similarPatients,
      radar_data:         radarData,
      coresistance_links: coResistanceLinks,
    });

  } catch (error) {
    console.error("Prediction error:", error);
    return NextResponse.json(
      { error: "Failed to get prediction from R API" },
      { status: 500 }
    );
  }
}
