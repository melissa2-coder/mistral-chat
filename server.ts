import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { Mistral } from "@mistralai/mistralai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiKey = process.env.MISTRAL_API_KEY;
const model = "mistral-small-latest";

if (!apiKey) {
  console.error("MISTRAL_API_KEY manquante. Créez un fichier .env avec MISTRAL_API_KEY=...");
  process.exit(1);
}

const client = new Mistral({ apiKey });
const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/chat", async (req, res) => {
  const messages = req.body?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "Corps attendu : { messages: [{ role, content }] }" });
    return;
  }

  const sanitized = messages
    .filter((m) => (m?.role === "user" || m?.role === "assistant") && typeof m?.content === "string")
    .map((m) => ({ role: m.role, content: m.content }))
    .slice(-20);

  if (sanitized.length === 0) {
    res.status(400).json({ error: "Aucun message valide fourni." });
    return;
  }

  try {
    const result = await client.chat.complete({
      model,
      messages: sanitized,
    });
    const reply = result.choices?.[0]?.message?.content;
    const content = typeof reply === "string" ? reply : "";
    if (!content) {
      res.status(502).json({ error: "Réponse vide du modèle." });
      return;
    }
    res.json({ content });
  } catch (err) {
    console.error("Erreur Mistral:", err);
    res.status(502).json({ error: "Échec de l'appel à l'API Mistral." });
  }
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`);
});
