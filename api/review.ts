import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ObjectId } from "mongodb";
import { getDb } from "./_db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { record_id, rating, comment } = req.body as {
    record_id: string;
    rating: number;
    comment: string;
  };

  if (!record_id) return res.status(400).json({ error: "Missing record_id" });

  const collection = (await getDb("Usage_History")).collection("hf_alpha");
  await collection.updateOne(
    { _id: new ObjectId(record_id) },
    { $set: { userRating: rating, userComment: comment } }
  );

  return res.json({ success: true });
}
