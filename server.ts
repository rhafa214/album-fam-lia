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

// Drive API proxy for public folders
app.get("/api/drive/files", async (req, res) => {
  try {
    const { folderId, pageToken } = req.query;
    const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GOOGLE_DRIVE_API_KEY is not configured on the server." });
    }

    let q = "(mimeType = 'image/jpeg' or mimeType = 'image/png' or mimeType = 'image/gif' or mimeType = 'image/heic' or mimeType = 'image/webp')";
    if (folderId) {
      q += ` and '${folderId}' in parents`;
    }

    let url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&key=${apiKey}&fields=nextPageToken,files(id,name,thumbnailLink,webContentLink,createdTime)&orderBy=createdTime desc&pageSize=100`;
    if (pageToken) {
      url += `&pageToken=${pageToken}`;
    }

    const driveRes = await fetch(url);
    if (!driveRes.ok) {
      const errorText = await driveRes.text();
      return res.status(driveRes.status).json({ error: errorText });
    }

    const data = await driveRes.json();
    res.json(data);
  } catch (err: any) {
    console.error("Drive API error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/drive/metadata", async (req, res) => {
  try {
    const { folderId } = req.query;
    const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GOOGLE_DRIVE_API_KEY is not configured on the server." });
    }

    const url = `https://www.googleapis.com/drive/v3/files/${folderId}?key=${apiKey}&fields=id,name`;
    const driveRes = await fetch(url);
    
    if (!driveRes.ok) {
      const errorText = await driveRes.text();
      return res.status(driveRes.status).json({ error: errorText });
    }
    
    const data = await driveRes.json();
    res.json(data);
  } catch (err: any) {
    console.error("Drive API metadata error:", err);
    res.status(500).json({ error: err.message });
  }
});


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
