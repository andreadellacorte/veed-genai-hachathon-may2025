import dotenv from "dotenv";
dotenv.config();
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { fal } from "@fal-ai/client";

// JSON schema we want Gemini to follow strictly
const MONTAGE_SCHEMA = {
  type: "object",
  properties: {
    montageTitle: {
      type: "string",
      description: "The overall title for the montage sequence.",
    },
    voiceover: {
      type: "string",
      description:
        "The overarching voiceover script for the entire montage. This voiceover usually spans across multiple shots.",
    },
    segments: {
      type: "array",
      description:
        "A list of short visual segments or shots that make up the montage.",
      items: {
        type: "object",
        properties: {
          segmentTitle: {
            type: "string",
            description:
              "An optional title or identifier for this individual segment within the montage.",
          },
          prompt: {
            type: "string",
            description:
              "The creative prompt or description for generating the visual content of this specific segment.",
          },
          durationEstimateSeconds: {
            type: "number",
            description:
              "An estimated duration for this visual segment in seconds, useful for pacing the montage.",
            minimum: 0.1,
          },
          onScreenText: {
            type: "string",
            description:
              "Optional text to appear on screen during this segment (e.g., dates, locations, character names).",
          },
        },
        required: ["prompt"],
      },
      minItems: 2,
    },
  },
  required: ["montageTitle", "segments"],
  description:
    "A model for a montage sequence, composed of multiple short visual segments and an optional overarching voiceover.",
} as const;

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "`text` field is required" },
        { status: 400 }
      );
    }

    const geminiAPIKey = process.env.GOOGLE_API_KEY;

    if (!geminiAPIKey) {
      throw new Error("Missing GOOGLE_API_KEY in environment variables");
    }

    const genAI = new GoogleGenerativeAI(geminiAPIKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-preview-05-20",
    });

    const prompt = `You are a helpful assistant that outputs ONLY valid JSON, following exactly the JSON schema below.\n\nJSON Schema:\n${JSON.stringify(
      MONTAGE_SCHEMA,
      null,
      2
    )}\n\nUsing the following user creative direction, generate a unique montage descriptor that strictly conforms to the schema.\nUser input: "${text}"\n\nRemember: Respond with VALID JSON ONLY. Do not wrap in markdown or add any extra commentary.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonText = response.text().trim();

    let montageData;
    try {
      montageData = JSON.parse(jsonText);
    } catch (e) {
      return NextResponse.json(
        { error: "Gemini returned invalid JSON" },
        { status: 500 }
      );
    }

    // Extract prompts
    const prompts = montageData.segments
      .map((segment: any) => segment.prompt)
      .slice(0, 5);

    const falAPIKey = process.env.FAL_AI_API_KEY;

    if (!falAPIKey) {
      throw new Error("Missing FAL_AI_API_KEY in environment variables");
    }

    const falResponses = await Promise.all(
      prompts.map((prompt: string) =>
        fal.subscribe("fal-ai/flux/dev", {
          input: { prompt },
        })
      )
    );

    return NextResponse.json({
      montage: montageData,
      falOutputs: falResponses.map((res) => res?.output ?? {}),
    });
  } catch (error) {
    console.error("Error generating montage or processing Fal prompts", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
