# 📸 Question Solver App

> **Built with Next.js, Shadcn UI, and Google Gemini AI**

The **Question Solver App** lets users capture a photo or upload an image, then intelligently detects whether the image contains a **question**, **instruction**, or **task** using the power of **Google Gemini AI**.
Clean UI powered by **Shadcn**, fast API routes with **Next.js**, and multi-modal AI vision processing.

---

## 🚀 Features

- ✅ Capture a photo from your camera or upload an image file.
- ✅ Auto-detect questions in images:

  - Standard questions (`?`, question words).
  - Fill-in-the-blank instructions.
  - Multiple choice exercises.
  - Math problems and tasks.

- ✅ Beautiful, responsive UI using **Shadcn UI** and **Tailwind CSS**.
- ✅ Multimodal AI analysis with **Google Gemini 1.5 Flash Vision API**.
- ✅ JSON-formatted results with confidence scores and explanations.

---

## 🔍 Example Use Case

| Example Image                                                                                                            | AI Output                            |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| **Question:** _"Complete the sentence below with the correct preposition."_ <br> Options: A. for, B. about, C. of, D. on | `isQuestion: true, confidence: 0.95` |
| Simple photo of nature                                                                                                   | `isQuestion: false, confidence: 1.0` |

---

## 🛠️ Tech Stack

| Tech                 | Description                                |
| -------------------- | ------------------------------------------ |
| **Next.js 14**       | App Router, API routes, TypeScript support |
| **Google Gemini AI** | Multi-modal vision + text analysis         |
| **Shadcn UI**        | Beautiful and accessible UI components     |
| **Tailwind CSS**     | Utility-first CSS framework                |
| **Lucide-react**     | Icon library                               |
| **React webcam**     | Webcam library                             |

---

## 🔑 Environment Variables

| Key              | Example Value | Description                       |
| ---------------- | ------------- | --------------------------------- |
| `GEMINI_API_KEY` | `AIza...`     | Your Google Generative AI API key |

---

## 📸 How It Works

1. User clicks "Start Camera" or "Upload Photo".
2. The app captures an image and converts it to **base64**.
3. Sends the image and a detailed analysis prompt to **Gemini 1.5 Flash Vision API**.
4. Parses the JSON response to display:

   - ✅ Whether it’s a question
   - 🔍 Explanation of why
   - 📊 Confidence score
   - 📝 Extracted text from the image

---

## ▶️ Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/abayxxx/question-solver.git
cd question-solver
```

### 2. Install Dependencies

```bash
npm install
```

(or use `yarn` or `npm`)

### 3. Add Environment Variables

Create a `.env.local` file:

```env
GEMINI_API_KEY=your_google_genai_api_key
```

### 4. Run Dev Server

```bash
npm dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## ✨ Screenshots

| Camera Mode                                             | Result View                                                   |
| ------------------------------------------------------- | ------------------------------------------------------------- |
| ![camera](https://fakeimg.pl/300x200/?text=Camera+View) | ![result](https://fakeimg.pl/300x200/?text=Question+Detected) |

---

## 🌟 Future Improvements

- [ ] Add support for multiple languages (English, Spanish, etc.)
- [ ] Export analysis results as PDF
- [ ] Allow multi-image upload
- [ ] Add offline OCR fallback

---

## ❤️ Acknowledgements

- [Google Gemini API](https://ai.google.dev/)
- [Shadcn UI](https://ui.shadcn.com/)
- [Next.js](https://nextjs.org/)
- [Lucide React](https://lucide.dev/)
- [React Webcam](https://www.npmjs.com/package/react-webcam)

---

## 📄 License

MIT © 2025 [abayxxx](https://github.com/abayxxx)

---
