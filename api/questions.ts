import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb } from "./_db.js";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const collection = (await getDb("Question_Set")).collection("V2_Train");

  const docs = await collection
    .find({}, { projection: { _id: 0, question: 1, category: 1 } })
    .toArray();

  const questions = docs
    .filter((d) => d.question)
    .map((d) => ({ question: d.question as string, category: (d.category as string) ?? "General" }));

  return res.json(questions);
}
