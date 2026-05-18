import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb } from "./_db.js";

function hasRefs(refs: unknown): boolean {
  if (!refs) return false;
  if (Array.isArray(refs)) return refs.length > 0;
  if (typeof refs === "object") return Object.keys(refs).length > 0;
  return false;
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const collection = (await getDb("Question_Set")).collection("V2_Train");

  const docs = await collection
    .find({}, { projection: { _id: 0, question: 1, topic: 1, syndrome: 1, refs: 1 } })
    .toArray();

  const questions = docs
    .filter((d) => d.question && hasRefs(d.refs))
    .map((d) => ({
      question: d.question as string,
      topic: (d.topic as string | null) ?? null,
      syndrome: (d.syndrome as string | null) ?? null,
    }));

  return res.json(questions);
}
