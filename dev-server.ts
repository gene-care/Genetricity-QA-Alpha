import { config } from "dotenv";
import { resolve } from "path";

// Must run before any api/* imports so process.env is populated
config({ path: resolve(process.cwd(), ".env.local") });

import express from "express";
import type { VercelRequest, VercelResponse } from "@vercel/node";

type Handler = (req: VercelRequest, res: VercelResponse) => unknown;

function adapt(handler: Handler) {
  return (req: express.Request, res: express.Response) =>
    handler(req as unknown as VercelRequest, res as unknown as VercelResponse);
}

// Dynamic imports run after dotenv.config() so env vars are available
const [
  { default: loginHandler },
  { default: questionsHandler },
  { default: chatHandler },
  { default: reviewHandler },
  { default: transcribeHandler },
  { default: prefetchHandler },
] = await Promise.all([
  import("./api/login.js"),
  import("./api/questions.js"),
  import("./api/chat.js"),
  import("./api/review.js"),
  import("./api/transcribe.js"),
  import("./api/prefetch.js"),
]);

const app = express();

// Base64 audio can be up to ~20MB for a 5-min recording
app.use(express.json({ limit: "25mb" }));

app.post("/api/login", adapt(loginHandler));
app.get("/api/questions", adapt(questionsHandler));
app.post("/api/chat", adapt(chatHandler));
app.post("/api/review", adapt(reviewHandler));
app.post("/api/transcribe", adapt(transcribeHandler));
app.post("/api/prefetch", adapt(prefetchHandler));

const PORT = 3001;
app.listen(PORT, () => console.log(`API dev server → http://localhost:${PORT}`));
