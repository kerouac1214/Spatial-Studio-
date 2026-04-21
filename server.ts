import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Mock API for Generation
  app.post("/api/generate", async (req, res) => {
    const { prompt, ratio, snapshot, charImages, sceneRef } = req.body;
    
    console.log("-----------------------------------");
    console.log("Generation Request Received:");
    console.log("Prompt:", prompt || "(No Prompt)");
    console.log("Ratio:", ratio);
    console.log("Snapshot size:", snapshot ? `${(snapshot.length / 1024).toFixed(2)} KB` : "None");
    console.log("Character Assets:", Object.keys(charImages || {}).length);
    console.log("Scene Reference:", sceneRef ? "Provided" : "None");
    console.log("-----------------------------------");

    // In a real scenario, we would call an AI API here (e.g., Replicate or OpenAI)
    // For now, we simulate a delay and return a high-quality placeholder that matches the vibe
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 3000));

      // We'll return a collection of placeholder images or a single "final" result
      // Using a descriptive seed based on the prompt for variety
      const seed = Math.floor(Math.random() * 1000000);
      const width = ratio === '16:9' ? 1280 : 720;
      const height = ratio === '16:9' ? 720 : 1280;
      
      const imageUrl = `https://picsum.photos/seed/${seed}/${width}/${height}`;

      res.json({ 
        status: "success", 
        imageUrl: imageUrl,
        message: "AI 图像生成成功 (Nano Banana 2 模拟引擎)"
      });
    } catch (error) {
      res.status(500).json({ status: "error", message: "生成过程出错" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
