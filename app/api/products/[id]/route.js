import clientPromise from "@/lib/db";
import { ObjectId } from "mongodb";

export async function PUT(req, { params }) {
  const { id } = await params;
  let body;
  try {
    body = await req.json();
  } catch (error) {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db("shoperp");

  await db.collection("products").updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        name: body.name,
        wholesaleRate: body.wholesaleRate,
        retailRate: body.retailRate,
        category: body.category,
        unit: body.unit,
      },
    }
  );

  return Response.json({ success: true });
}

export async function DELETE(req, { params }) {
  const { id } = await params;

  const client = await clientPromise;
  const db = client.db("shoperp");

  await db.collection("products").deleteOne({ _id: new ObjectId(id) });

  return Response.json({ success: true });
}
