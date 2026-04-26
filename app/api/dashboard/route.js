import clientPromise from "@/lib/db";

export async function GET() {
  const client = await clientPromise;
  const db = client.db("shoperp");

  // Total products
  const totalProducts = await db.collection("products").countDocuments();

  // Total credit amount
  const creditData = await db.collection("credit").find().toArray();
  const totalCredit = creditData.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  // Total expenses
  const expensesData = await db.collection("expenses").find().toArray();
  const totalExpenses = expensesData.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  // Latest closing
  const latestClosing = await db
    .collection("closing")
    .find()
    .sort({ createdAt: -1 })
    .limit(1)
    .toArray();

  // Pending Reminders (Sorted by closest target Date)
  const pendingReminders = await db
    .collection("reminders")
    .find({ status: "Pending" })
    .sort({ targetDate: 1 })
    .toArray();

  return Response.json({
    totalProducts,
    totalCredit,
    totalExpenses,
    latestClosing: latestClosing[0] || null,
    pendingReminders,
  });
}