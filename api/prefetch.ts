import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ObjectId } from "mongodb";
import { getDb } from "./_db.js";

interface ReferenceItem {
  pageNo: string | null;
  url: string;
  f70: string;
  fileName: string;
}

// ── Resolve Grounding_Data>V1 document IDs → ReferenceItems ──────────────────

async function resolveRefs(refIds: string[]): Promise<ReferenceItem[]> {
  if (!refIds.length) return [];

  const collection = (await getDb("Grounding_Data")).collection("V1");
  const objectIds = refIds.map((id) => new ObjectId(id));
  const docs = await collection
    .find({ _id: { $in: objectIds } }, { projection: { _id: 1, data: 1, url: 1, filename: 1, title: 1 } })
    .toArray();

  // Preserve the original ordering of refIds
  const docMap = new Map(docs.map((d) => [d._id.toString(), d]));
  const ordered = objectIds
    .map((id) => docMap.get(id.toString()))
    .filter((d): d is NonNullable<typeof d> => !!d);

  return ordered.map((doc) => {
    const filename = (doc.filename as string) ?? "";
    const parts = filename.split("_");
    const pageNo = parts.length >= 3 ? parts[parts.length - 2] : null;
    const chunkText = ((doc.data as string) ?? "").trim();
    const f70 = chunkText.length > 70 ? chunkText.slice(0, 70) : chunkText;
    return { fileName: (doc.title as string) ?? filename, url: (doc.url as string) ?? "", pageNo, f70 };
  });
}

// ── Usage Logging ─────────────────────────────────────────────────────────────

async function insertUsageRecord(
  user: string,
  question: string,
  answer: string,
  references: ReferenceItem[]
): Promise<string> {
  const collection = (await getDb("Usage_History")).collection("hf_alpha");
  const result = await collection.insertOne({
    unixTimestamp: String(Math.floor(Date.now() / 1000)),
    user,
    question,
    generatedAnswer: answer,
    refs: references,
    source: "prefetch",
  });
  return result.insertedId.toString();
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { question, user_id } = req.body as { question: string; user_id: string };
  if (!question?.trim()) return res.status(400).json({ error: "Question cannot be empty" });

  // Look up the pre-generated answer in V2_Train
  const v2Collection = (await getDb("Question_Set")).collection("V2_Train");
  const doc = await v2Collection.findOne({ question });

  if (!doc?.generatedAnswer) {
    return res.status(404).json({ error: "No pre-generated answer found for this question" });
  }

  const answer = doc.generatedAnswer as string;

  // refs is stored as an object with numeric keys (e.g. {1: "id1", 2: "id2"}) or an array
  const rawRefs = doc.refs as Record<string, string> | string[];
  const refIds: string[] = Array.isArray(rawRefs)
    ? rawRefs
    : Object.values(rawRefs);

  const references = await resolveRefs(refIds);

  const record_id = await insertUsageRecord(user_id, question, answer, references);

  return res.json({ answer, record_id, references });
}
