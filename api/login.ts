import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb } from "./_db.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { userid, password } = req.body as { userid: string; password: string };
  if (!userid || !password) return res.status(400).json({ error: "Missing credentials" });

  const collection = (await getDb("User_Credentials")).collection("hf_alpha");
  const user = await collection.findOne({ userid });

  if (!user) return res.json({ success: false, message: "User not found" });
  if (user.password !== password) return res.json({ success: false, message: "Invalid password" });

  return res.json({ success: true, message: "Logged in successfully" });
}
