import clientPromise from "@/lib/db";

// GET → fetch products
export async function GET() {
  const client = await clientPromise;
  const db = client.db("shoperp");

  const products = await db.collection("products").find().toArray();

  return Response.json(products);
}

// POST → add product
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch (error) {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db("shoperp");

  const result = await db.collection("products").insertOne({
    name: body.name,
    wholesaleRate: body.wholesaleRate || "",
    retailRate: body.retailRate || "",
    category: body.category || "Stationary",
    unit: body.unit || "unit",
  });

  return Response.json({ success: true, insertedId: result.insertedId });
}
