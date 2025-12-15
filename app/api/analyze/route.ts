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
Analyze the following image carefully.

Your tasks are:

1. Determine whether the image contains a question or a task that requires a response.
   Look for:
   - Direct questions (sentences ending with "?").
   - Indirect questions or instructions that ask the reader to respond 
     (e.g., "Fill in the blank", "Choose the correct answer", 
     "Complete the sentence", "Solve this", etc.).
   - Multiple choice questions, fill-in-the-blank exercises, or instructions.
   - Question words such as: what, where, when, why, how, who, which.
   - Mathematical problems or logical tasks requiring a solution.

2. If a question or task **is detected**, analyze its content and **provide the correct and most appropriate answer** based on the information visible in the image.

3. If **no question or task is detected**, do NOT attempt to answer anything.
   In this case, set "answer" to an empty string.

Respond strictly in the following JSON format:

{
  "isQuestion": boolean,
  "confidence": number (from 0 to 1),
  "explanation": string,
  "detectedText": string (optional),
  "answer": string
}

Rules:
- "isQuestion" should be true only if the image clearly asks for a response.
- "answer" must be concise, accurate, and directly address the question.
- If the question is multiple choice, include the selected option and its explanation.
- If the question is mathematical, include the final result (and brief reasoning if needed).
- If no question exists, return:
  "isQuestion": false
  "answer": ""
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
