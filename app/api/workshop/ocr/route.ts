import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import fs from "fs/promises";
import path from "path";

const SAMPLE_INSTRUCTIONS_BY_LANG: Record<string, string[]> = {
  pl: [
    "Przygotowanie i przeprowadzenie badania TÜV oraz przeglądu Kundendienst",
    "Kontrola układu hamulcowego, wymiana linek hamulcowych (Bremsseile) i regulacja",
    "Smarowanie części ruchomych (Bewegliche Teile abschmieren) i kontrola ciśnienia",
    "Dokręcenie kół kluczem dynamometrycznym i wpisanie momentu (Nm)",
  ],
  de: [
    "Vorbereitung und Durchführung der TÜV-Hauptuntersuchung sowie Kundendienst",
    "Bremsanlage prüfen, Bremsseile erneuern und einstellen",
    "Bewegliche Teile abschmieren und Luftdruck kontrollieren",
    "Räder mit Drehmomentschlüssel nachziehen und Drehmoment (Nm) eintragen",
  ],
  en: [
    "Prepare and perform TÜV main inspection and Kundendienst service",
    "Inspect braking system, replace brake cables (Bremsseile) and adjust",
    "Lubricate moving parts and check tire pressure",
    "Tighten wheels with torque wrench and record torque (Nm)",
  ],
};

function getSampleDollFallback(lang: string = "pl") {
  const instructions =
    SAMPLE_INSTRUCTIONS_BY_LANG[lang] || SAMPLE_INSTRUCTIONS_BY_LANG.pl;
  return {
    clientName: "Bauunternehmen Schneider GmbH",
    street: "Sigmundstraße 110",
    city: "90431 Nürnberg",
    phone: "+49 911 658910",
    mobile: "+49 172 8841209",
    email: "service@schneider-bau-nbg.de",
    estimatedCostEur: 480,
    assetCategory: "trailer" as const,
    plate: "N-DC 508",
    vehicleType: "Kipper_Trójstronny",
    vehicleSubtype: "Dreiseitenkipper 3500 kg (Doll Fahrzeugbau)",
    equipmentName: "",
    machineNumber: "",
    equipmentDescription: "",
    scopeTypes: ["TUV", "Kundendienst", "brakes", "wheels"],
    taskInstructions: instructions,
    wheelTorqueNm: "110",
    suggestedMechanics: ["Andy", "Michal"],
    initialMaterials: ["Bremsbacken", "Bremsseile", "Keilriemen"],
  };
}

export async function POST(req: NextRequest) {
  let lang = "pl";
  try {
    const contentType = req.headers.get("content-type") || "";
    let base64Data = "";
    let mimeType = "image/jpeg";
    let useSampleDollScan = false;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      lang = String(formData.get("lang") || "pl");
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "Missing file" }, { status: 400 });
      }
      mimeType = file.type || "image/jpeg";
      const arrayBuf = await file.arrayBuffer();
      base64Data = Buffer.from(arrayBuf).toString("base64");
    } else {
      const body = await req.json();
      lang = body?.lang || "pl";
      useSampleDollScan = Boolean(body?.useSampleDollScan);
      if (useSampleDollScan) {
        try {
          const samplePath = path.join(
            process.cwd(),
            "public",
            "assets",
            "aistudio",
            "arbeitsauftrag_aeda6aea.jpg"
          );
          const buf = await fs.readFile(samplePath);
          base64Data = buf.toString("base64");
          mimeType = "image/jpeg";
        } catch {
          return NextResponse.json({
            extracted: getSampleDollFallback(lang),
            source: "doll-template",
          });
        }
      } else if (body?.base64Data) {
        base64Data = body.base64Data;
        mimeType = body.mimeType || "image/jpeg";
      }
    }

    const fallback = getSampleDollFallback(lang);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || !base64Data) {
      return NextResponse.json({
        extracted: fallback,
        source: "fallback-template",
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });

    const targetLangName =
      lang === "de" ? "German (Deutsch)" : lang === "en" ? "English" : "Polish (Polski)";

    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
            {
              text: `Analyze this scanned workshop order form (Arbeitsauftrag / Doll Fahrzeugbau oHG).
Extract separately:
1) Customer personal data (Office only — GDPR): name/company, street, city, phone, mobile (Handy), email, estimated cost (Kosten ca.).
2) Anonymized technical trailer or construction equipment data (strictly NO customer personal data!): assetCategory ('trailer' or 'equipment'), license plate (Kennzeichen), vehicleType, vehicleSubtype, equipmentName and machineNumber (if machinery), scopeTypes from ["TUV", "Nachprufung", "Gasprufung", "Kundendienst", "UVV", "wheels", "electrics", "brakes", "other"], anonymized technical taskInstructions written in ${targetLangName} (without customer names or phone numbers!), wheelTorqueNm, suggestedMechanics (e.g. Andy, Michal), and initialMaterials.`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            clientName: { type: Type.STRING },
            street: { type: Type.STRING },
            city: { type: Type.STRING },
            phone: { type: Type.STRING },
            mobile: { type: Type.STRING },
            email: { type: Type.STRING },
            estimatedCostEur: { type: Type.NUMBER },
            assetCategory: { type: Type.STRING },
            plate: { type: Type.STRING },
            vehicleType: { type: Type.STRING },
            vehicleSubtype: { type: Type.STRING },
            equipmentName: { type: Type.STRING },
            machineNumber: { type: Type.STRING },
            equipmentDescription: { type: Type.STRING },
            scopeTypes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            taskInstructions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            wheelTorqueNm: { type: Type.STRING },
            suggestedMechanics: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            initialMaterials: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["assetCategory", "scopeTypes", "taskInstructions"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return NextResponse.json({
      extracted: {
        ...fallback,
        ...parsed,
        clientName: parsed.clientName || fallback.clientName,
        scopeTypes:
          Array.isArray(parsed.scopeTypes) && parsed.scopeTypes.length > 0
            ? parsed.scopeTypes
            : fallback.scopeTypes,
        taskInstructions:
          Array.isArray(parsed.taskInstructions) && parsed.taskInstructions.length > 0
            ? parsed.taskInstructions
            : fallback.taskInstructions,
      },
      source: "gemini-ocr",
    });
  } catch (err) {
    console.warn("OCR fallback triggered:", err);
    return NextResponse.json({
      extracted: getSampleDollFallback(lang),
      source: "fallback",
    });
  }
}
