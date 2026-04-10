import { MongoClient } from "mongodb";
import { MONGODB_URI } from "./_config.js";

let client: MongoClient | null = null;

export async function getDb(dbName: string) {
  if (!client) {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
  }
  return client.db(dbName);
}
