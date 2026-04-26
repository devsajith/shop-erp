import clientPromise from "@/lib/db";

// GET → fetch logs for a specific customer from Day 1 of the current month
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");

  if (!customerId) {
    return Response.json({ error: "Missing customerId" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db("shoperp");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const logs = await db.collection("credit_logs").find({
    customerId: customerId,
    createdAt: { $gte: startOfMonth }
  }).sort({ createdAt: -1 }).toArray();

  return Response.json(logs);
}
