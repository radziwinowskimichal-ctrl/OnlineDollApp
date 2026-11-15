import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawTexts: unknown = body?.texts;
    const targetLang: string =
      body?.targetLang === "de" ? "de" : body?.targetLang === "en" ? "en" : "pl";

    if (!Array.isArray(rawTexts) || rawTexts.length === 0) {
      return NextResponse.json({ translations: {} });
    }

    const uniqueTexts = Array.from(
      new Set(
        rawTexts
          .filter((t): t is string => typeof t === "string")
          .map((t) => t.trim())
          .filter((t) => t.length >= 2 && t.length <= 600)
      )
    ).slice(0, 40);

    if (uniqueTexts.length === 0) {
      return NextResponse.json({ translations: {} });
    }

    if (!process.env.GEMINI_API_KEY) {
      const passthrough: Record<string, string> = {};
      uniqueTexts.forEach((t) => {
        passthrough[t] = t;
      });
      return NextResponse.json({ translations: passthrough });
    }

    const langName =
      targetLang === "de"
        ? "German (Deutsch, automotive/trailer workshop terminology)"
        : targetLang === "en"
        ? "English (automotive/trailer workshop terminology)"
        : "Polish (Polski, terminologia warsztatu przyczep i maszyn budowlanych)";

    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: JSON.stringify(uniqueTexts),
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        systemInstruction: `You translate technical trailer, vehicle, and construction machinery workshop descriptions, task instructions, part names, and defect notes into ${langName}. Preserve license plates, order numbers (e.g. WA-2026/041), machine IDs (e.g. #WB-99), torque numbers (Nm), voltages (12V/24V), and proper person names unchanged. If an input string is already written in ${langName}, return it unchanged. Return a JSON array of objects with exact 'source' and 'translated' strings.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              source: { type: Type.STRING },
              translated: { type: Type.STRING },
            },
            required: ["source", "translated"],
          },
        },
      },
    });

    const parsed = JSON.parse((response.text ?? "[]").trim());
    const translations: Record<string, string> = {};
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (item && typeof item.source === "string" && typeof item.translated === "string") {
          translations[item.source] = item.translated;
        }
      }
    }

    return NextResponse.json({ translations });
  } catch (error) {
    console.error("Workshop translation route error:", error);
    return NextResponse.json(
      { error: "Translation request failed", translations: {} },
      { status: 200 }
    );
  }
}
