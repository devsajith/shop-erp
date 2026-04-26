import { NextResponse } from "next/server";
import clientPromise from "@/lib/db";
import { ObjectId } from "mongodb";

// GET => fetch all reminders sorted beautifully
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("shoperp");
    
    // Default fetch logic pulls everything down
    const reminders = await db.collection("reminders").find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json(reminders);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST => insert new tracked schedule
export async function POST(req) {
  try {
    const body = await req.json();
    
    if (!body.description || !body.targetDate) {
      return NextResponse.json({ error: "Missing highly required data constraints." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("shoperp");

    await db.collection("reminders").insertOne({
      description: body.description,
      targetDate: new Date(body.targetDate),
      status: "Pending", // strictly locked on creation
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "JSON mapping failure" }, { status: 500 });
  }
}

// PUT => gracefully resolve state lifecycle (Completed / Cancelled)
export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, status } = body;

    // ensure data integrity
    if (!id || !status || !["Completed", "Cancelled"].includes(status)) {
      return NextResponse.json({ error: "Constraint failure" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("shoperp");

    await db.collection("reminders").updateOne(
      { _id: new ObjectId(String(id)) },
      { $set: { status: status, updatedAt: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "DB Error" }, { status: 500 });
  }
}
