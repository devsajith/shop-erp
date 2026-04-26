import clientPromise from "@/lib/db";

export async function GET() {
  const client = await clientPromise;
  const db = client.db("shoperp");

  const data = await db
    .collection("closing")
    .find()
    .sort({ createdAt: -1 })
    .toArray();
    
  const now = new Date();
  
  // 1. Fetch Today's Closing
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  
  const todayClosingRes = await db.collection("closing")
    .find({ createdAt: { $gte: startOfDay, $lte: endOfDay } })
    .sort({ createdAt: -1 })
    .limit(1)
    .toArray();
  const todayClosing = todayClosingRes.length > 0 ? todayClosingRes[0] : null;

  // 2. Fetch Monthly Aggregates
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  
  const monthlyAgg = await db.collection("closing").aggregate([
    {
      $match: {
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      }
    },
    {
      $group: {
        _id: null,
        totalProfit: { $sum: "$profit" },
        totalCollection: { $sum: "$totalCollection" },
        totalExpenses: { $sum: "$expenses" }
      }
    }
  ]).toArray();
  
  const monthlyData = monthlyAgg.length > 0 ? monthlyAgg[0] : { totalProfit: 0, totalCollection: 0, totalExpenses: 0 };

  return Response.json({
    history: data,
    todayClosing,
    monthlyData
  });
}

// POST → add closing
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch (error) {
    return Response.json({ error: "Invalid JSON in request body" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db("shoperp");

  // Calculate today's expenses
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const expenseAgg = await db.collection("expenses").aggregate([
    {
      $match: {
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      }
    },
    {
      $group: {
        _id: null,
        totalExpenses: {
          $sum: {
            $convert: { input: "$amount", to: "double", onError: 0, onNull: 0 }
          }
        }
      }
    }
  ]).toArray();
  
  const totalExpenses = expenseAgg.length > 0 ? expenseAgg[0].totalExpenses : 0;

  const cash = Number(body.cash || 0);
  const digital = Number(body.digital || 0);
  const profit = cash + digital;
  const totalCollection = cash + digital + totalExpenses;

  const result = await db.collection("closing").insertOne({
    cash,
    digital,
    expenses: totalExpenses,
    profit,
    totalCollection,
    createdAt: new Date(),
  });

  return Response.json({ success: true, insertedId: result.insertedId });
}