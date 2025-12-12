import { type NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini model
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Extract base64 string

    const [mimePart, base64Image] = image.split(",");

    if (!base64Image[1]) {
      return NextResponse.json(
        { error: "Invalid image format" },
        { status: 400 }
      );
    }

    const mimeTypeMatch = mimePart.match(/data:(.*?);base64/);
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg"; // Default fallback

    // Create a multi-modal model (vision + text)

    const promptText = `
      Analyze the following image and determine if it contains a question or a task asking for a response. Look for:

- Direct questions (sentences ending with question marks "?").
- Indirect questions or instructions that ask the user to complete something (for example, "Fill in the blank", "Choose the correct answer", "Complete the sentence", "Solve this", etc.).
- Multiple choice questions, fill-in-the-blank exercises, or instructions asking the reader to respond.
- Question words: what, where, when, why, how, who, which, etc.
- Mathematical problems asking for solutions.
- Any context where a response, choice, or action is required from the user.

Even if the sentence is an instruction, if it **asks the reader to provide an answer**, mark it as a question.

Respond in JSON format:
{
  "isQuestion": boolean,
  "confidence": number (from 0 to 1),
  "explanation": string,
  "detectedText": string (optional)
  "answer": string
}
    `;

    // Send the image and prompt
    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { text: promptText },
        { inlineData: { mimeType: mimeType, data: base64Image } },
      ],
    });

    const textResponse = result.text;

    console.log("Raw Gemini response:", textResponse);

    // Try to parse the response as JSON
    if (!textResponse) {
      return NextResponse.json(
        { error: "No response from Gemini" },
        { status: 500 }
      );
    }

    let text = textResponse.trim();

    // Remove ```json or ``` if present
    if (text.startsWith("```")) {
      text = text.replace(/```json|```/, "").trim();
    }

    // Remove trailing ```
    if (text.endsWith("```")) {
      text = text.slice(0, text.lastIndexOf("```")).trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      console.error("Failed to parse cleaned response:", error);
      throw new Error("Invalid JSON format from Gemini");
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Error analyzing image:", error);
    return NextResponse.json(
      { error: "Failed to analyze image" },
      { status: 500 }
    );
  }
}
