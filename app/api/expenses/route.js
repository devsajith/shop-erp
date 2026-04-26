import clientPromise from "@/lib/db";

// GET → fetch expenses
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  let startOfDay, endOfDay;
  const targetDate = dateParam ? new Date(dateParam) : new Date();

  startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const client = await clientPromise;
  const db = client.db("shoperp");

  // 1. Calculate Daily Total for the specific top widget
  const dailyExpenses = await db.collection("expenses").find({
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  }).toArray();
  const dailyTotal = dailyExpenses.reduce((sum, item) => sum + Number(item.amount), 0);

  // 2. Fetch paginated timeline for infinite scroll table
  const skip = (page - 1) * limit;
  const paginatedExpenses = await db.collection("expenses")
    .find({})
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit + 1) // +1 to check if we have another page
    .toArray();
  
  const hasMore = paginatedExpenses.length > limit;
  if (hasMore) {
    paginatedExpenses.pop();
  }

  // 3. Calculate Global Cumulative Total
  const totalAgg = await db.collection("expenses").aggregate([
    {
      $group: {
        _id: null,
        total: {
          $sum: {
            $convert: { input: "$amount", to: "double", onError: 0, onNull: 0 }
          }
        }
      }
    }
  ]).toArray();
  const globalTotal = totalAgg.length > 0 ? totalAgg[0].total : 0;

  // 4. Calculate Monthly Total (for the selected date's month)
  const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
  const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);

  const monthlyAgg = await db.collection("expenses").aggregate([
    {
      $match: {
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      }
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: {
            $convert: { input: "$amount", to: "double", onError: 0, onNull: 0 }
          }
        }
      }
    }
  ]).toArray();
  const monthlyTotal = monthlyAgg.length > 0 ? monthlyAgg[0].total : 0;

  return Response.json({
    expenses: paginatedExpenses,
    hasMore,
    dailyTotal,
    dailyCount: dailyExpenses.length,
    dailyList: dailyExpenses,
    globalTotal,
    monthlyTotal
  });
}

// POST → add expense
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch (error) {
    return Response.json({ error: "Invalid JSON in request body" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db("shoperp");

  const createdAt = body.date ? new Date(body.date) : new Date();

  await db.collection("expenses").insertOne({
    title: body.title,
    amount: body.amount,
    type: body.type, // cash or digital
    createdAt: createdAt,
  });

  return Response.json({ success: true });
}

// DELETE → remove expense
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

  await db.collection("expenses").deleteOne({
    _id: new (await import("mongodb")).ObjectId(id),
  });

  return Response.json({ success: true });
}