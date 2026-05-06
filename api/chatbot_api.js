import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

// Helper: sleep for ms milliseconds
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper: call Gemini with automatic retry on 429 rate-limit errors
async function generateWithRetry(model, contents, systemInstruction, maxRetries = 3) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await model.generateContent({ contents, systemInstruction });
      return result.response.text();
    } catch (err) {
      lastError = err;
      const status = err?.status || err?.httpStatus || (err?.message?.includes("429") ? 429 : null);
      if (status === 429) {
        // Exponential backoff: 2s, 4s, 8s
        const waitMs = Math.pow(2, attempt + 1) * 1000;
        console.warn(`Rate limited (429). Retrying in ${waitMs / 1000}s... (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(waitMs);
      } else {
        // Non-retryable error — break immediately
        break;
      }
    }
  }
  throw lastError;
}

router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key is not configured on the server." });
    }

    // gemini-flash-latest: free tier
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const contents = [
      {
        role: "user",
        parts: [{ text: message }],
      },
    ];

    const systemInstruction = {
      role: "system",
      parts: [
        {
          text: "You are a helpful assistant for a social media app. Answer clearly and briefly.",
        },
      ],
    };

    const reply = await generateWithRetry(model, contents, systemInstruction);

    res.json({ reply });

  } catch (error) {
    console.error("Chatbot error:", error?.message || error);
    
    const status = error?.status || error?.httpStatus;

    if (status === 429 || error?.message?.includes("429")) {
      return res.status(429).json({
        error: "The AI service is temporarily busy. Please wait a moment and try again.",
      });
    }

    if (status === 400 || error?.message?.includes("API_KEY_INVALID")) {
      return res.status(500).json({ error: "Invalid Gemini API key. Please check server configuration." });
    }

    res.status(500).json({ error: "Something went wrong with the chatbot. Please try again." });
  }
});

export default router;