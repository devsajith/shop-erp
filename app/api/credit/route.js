import clientPromise from "@/lib/db";
import { ObjectId } from "mongodb";

// GET → get all credit customers
export async function GET() {
  const client = await clientPromise;
  const db = client.db("shoperp");

  const data = await db.collection("credit").find().sort({ updatedAt: -1, createdAt: -1 }).toArray();

  return Response.json(data);
}

// POST → add new credit customer
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch (error) {
    return Response.json({ error: "Invalid JSON in request body" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db("shoperp");

  const oldBalance = Number(body.oldBalance) || 0;
  const newCredit = Number(body.newCredit) || 0;
  const balance = oldBalance + newCredit;

  const result = await db.collection("credit").insertOne({
    customerName: body.customerName,
    phoneNumber: body.phoneNumber || "",
    balance: balance,
    lastNote: body.note || "",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Automatically log the initial grant if there is any balance
  if (balance > 0) {
    await db.collection("credit_logs").insertOne({
      customerId: result.insertedId.toString(),
      action: "add",
      amount: balance,
      note: body.note || "Initial credit account setup",
      createdAt: new Date()
    });
  }

  return Response.json({ success: true });
}

// PUT → modify credit customer balance (add, partial, settle)
export async function PUT(req) {
  let body;
  try {
    body = await req.json();
  } catch (error) {
    return Response.json({ error: "Invalid JSON in request body" }, { status: 400 });
  }

  const { id, action, amount, note } = body;

  if (!id || !action) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db("shoperp");
  
  const parsedAmount = Number(amount) || 0;
  let updateOperation = {};

  if (action === "add") {
    updateOperation = { $inc: { balance: parsedAmount }, $set: { updatedAt: new Date(), lastNote: note || "" } };
  } else if (action === "partial") {
    updateOperation = { $inc: { balance: -parsedAmount }, $set: { updatedAt: new Date(), lastNote: note || "" } };
  } else if (action === "settle") {
    updateOperation = { $set: { balance: 0, updatedAt: new Date(), lastNote: note || "Fully settled account." } };
  } else {
    return Response.json({ error: "Invalid action" }, { status: 400 });
  }

  await db.collection("credit").updateOne(
    { _id: new ObjectId(id) },
    updateOperation
  );

  // Secretly drop a receipt down into credit_logs
  await db.collection("credit_logs").insertOne({
    customerId: id.toString(),
    action: action,
    amount: parsedAmount, // Will be 0 for 'settle' unless specified
    note: note || "",
    createdAt: new Date()
  });

  return Response.json({ success: true });
}

// DELETE → remove customer entry entirely
export async function DELETE(req) {
  let body;
  try {
    body = await req.json();
  } catch (error) {
    return Response.json({ error: "Invalid JSON in request body" }, { status: 400 });
  }

  const { id } = body;

  if (!id) {
    return Response.json({ error: "Missing id in request body" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db("shoperp");

  await db.collection("credit").deleteOne({
    _id: new ObjectId(id),
  });

  return Response.json({ success: true });
}