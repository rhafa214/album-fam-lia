import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "50mb" }));

if (process.env.GEMINI_API_KEY) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  app.post("/api/analyze", async (req, res) => {
    try {
      const { images } = req.body; // array of base64 strings or URLs
      if (!images || images.length === 0) {
        return res.status(400).json({ error: "No images provided" });
      }

      // Convert image URLs to base64 parts
      const parts = await Promise.all(
        images.map(async (url: string) => {
          const response = await fetch(url);
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const mimeType = response.headers.get("content-type") || "image/jpeg";
          return {
            inlineData: {
              data: buffer.toString("base64"),
              mimeType,
            },
          };
        })
      );

      const prompt = `You are an AI assistant that categorizes photos into an event album. 
Given these images from a cluster of photos taken around the same time, generate a short, elegant Portuguese title for this event (e.g., "Aniversário de 5 anos", "Natal em Família", "Férias no Rio", "Encontro com Amigos").
Only return the title, nothing else. Focus on the most prominent feature: if it's a beach, "Dia na Praia". If there's a cake, "Aniversário".`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              ...parts
            ],
          },
        ],
        config: {
            temperature: 0.2
        }
      });

      const title = response.text?.trim() || "Evento Especial";
      res.json({ title });
    } catch (error: any) {
      console.error("Gemini analysis error:", error);
      res.status(500).json({ error: error.message });
    }
  });
}

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
