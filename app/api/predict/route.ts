import { NextResponse } from "next/server";

const R_API_URL = "https://assisted-bin-vessels-bosnia.trycloudflare.com";

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

    if (!response.ok) {
      throw new Error(`R API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Prediction error:", error);
    return NextResponse.json(
      { error: "Failed to get prediction from R API" },
      { status: 500 }
    );
  }
}
