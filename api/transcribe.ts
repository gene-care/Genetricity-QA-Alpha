import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getOpenAI } from "./_openai.js";

// Node < 20 doesn't expose File as a global; polyfill it so the OpenAI SDK can upload files
if (!globalThis.File) {
  const { File } = await import("node:buffer");
  (globalThis as unknown as Record<string, unknown>).File = File;
}

const { toFile } = await import("openai");

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { audio, mimeType } = req.body as { audio: string; mimeType: string };
  if (!audio) return res.status(400).json({ error: "No audio provided" });

  const buffer = Buffer.from(audio, "base64");
  const extension = mimeType.includes("mp4") ? "mp4" : "webm";
  const audioFile = await toFile(buffer, `recording.${extension}`, { type: mimeType });

  const transcript = await getOpenAI().audio.transcriptions.create({
    model: "whisper-1",
    file: audioFile,
  });

  return res.json({ text: transcript.text });
}
