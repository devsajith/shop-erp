"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";

interface ReminderTask {
    _id: string;
    description: string;
    targetDate: string;
    status: "Pending" | "Completed" | "Cancelled";
    createdAt: string;
}

export default function RemindersPage() {
    const [reminders, setReminders] = useState<ReminderTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [form, setForm] = useState({
        description: "",
        targetDate: "",
    });

    const fetchReminders = async () => {
        setIsLoading(true);
        const res = await fetch("/api/reminders");
        const data = await res.json();
        setReminders(data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchReminders();
    }, []);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        await fetch("/api/reminders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        setForm({ description: "", targetDate: "" });
        fetchReminders();
    };

    const updateStatus = async (id: string, newStatus: "Completed" | "Cancelled") => {
        const isConfirm = window.confirm(`Are you sure you want to mark this task as ${newStatus}?`);
        if (!isConfirm) return;

        await fetch("/api/reminders", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, status: newStatus }),
        });
        fetchReminders();
    };

    // Helper sorting to put pending at top
    const sortedReminders = [...reminders].sort((a, b) => {
        if (a.status === "Pending" && b.status !== "Pending") return -1;
        if (a.status !== "Pending" && b.status === "Pending") return 1;
        return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
    });

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-32">
            <div className="max-w-7xl mx-auto p-4 md:p-8">

                {/* Header Section */}
                <div className="mb-8 pt-20 md:pt-10">
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900">
                        Order Deadlines
                    </h1>
                    <p className="text-gray-500 mt-2 text-lg">Track future commitments so you never miss an order request.</p>
                </div>

                {/* Input Form Module (Always visible, clean, no modals required) */}
                <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <span>📝</span> Rapid Entry Task Log
                    </h2>
                    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">

                        <div className="w-full md:w-[60%]">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 mb-2 block">Reminder Note / Details</label>
                            <input
                                name="description"
                                placeholder="e.g., 5 Custom birthday cakes"
                                value={form.description}
                                onChange={handleChange}
                                className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold"
                                required
                            />
                        </div>

                        <div className="w-full md:w-72">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 mb-2 block">Target Date</label>
                            <input
                                name="targetDate"
                                type="date"
                                value={form.targetDate}
                                onChange={handleChange}
                                style={{ colorScheme: "light" }}
                                className="w-full bg-blue-50 border-2 border-blue-200 p-4 md:p-5 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500 outline-none transition-all font-black text-blue-900 text-lg md:text-xl shadow-sm block cursor-pointer"
                                required
                            />
                        </div>

                        <button type="submit" className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-lg py-4 px-10 rounded-xl transition-colors shadow-md shadow-blue-500/20 shrink-0 h-[58px]">
                            + Track Task
                        </button>
                    </form>
                </div>

                {/* Dynamic Display Table */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    {isLoading ? (
                        <div className="text-center py-16 text-gray-300 font-bold">Loading schedule...</div>
                    ) : sortedReminders.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="text-gray-300 mb-2 text-6xl">📥</div>
                            <h3 className="text-2xl font-semibold text-gray-600">No scheduled tasks</h3>
                            <p className="text-gray-400 mt-2 text-lg">Use the rapid entry form above to track incoming future orders.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-hidden md:overflow-x-auto">
                            <table className="w-full text-left border-collapse block md:table pb-4 md:pb-0">
                                <thead className="hidden md:table-header-group">
                                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                                        <th className="p-5 font-bold w-40">Status Badge</th>
                                        <th className="p-5 font-bold">Reminder Details</th>
                                        <th className="p-5 font-bold text-center w-40">Due Date</th>
                                        <th className="p-5 font-bold text-right w-64">Action Resolution</th>
                                    </tr>
                                </thead>
                                <tbody className="block md:table-row-group divide-y-0 md:divide-y divide-gray-50 flex-col px-4 md:px-0 pt-4 md:pt-0 gap-4 flex md:block">
                                    {sortedReminders.map((task) => (
                                        <tr
                                            key={task._id}
                                            className={`block md:table-row transition-colors group border border-gray-100 md:border-transparent rounded-2xl md:rounded-none p-5 md:p-0 shadow-sm md:shadow-none mb-4 md:mb-0 ${task.status === "Pending" ? "bg-white hover:bg-orange-50/20" : "bg-gray-50/50 opacity-75"}`}
                                        >
                                            <td className="flex md:table-cell justify-between items-center md:p-5 border-b border-gray-50 md:border-none pb-4 md:pb-0 mb-4 md:mb-0">
                                                <span className="md:hidden text-xs font-bold text-gray-400 uppercase tracking-wider">Status Badge</span>
                                                {task.status === "Pending" && (
                                                    <span className="inline-block bg-orange-100 text-orange-700 text-xs px-3 py-1.5 rounded-full font-black tracking-wide uppercase shadow-sm">
                                                        ⏱ Pending
                                                    </span>
                                                )}
                                                {task.status === "Completed" && (
                                                    <span className="inline-block bg-emerald-100 text-emerald-800 text-xs px-3 py-1.5 rounded-full font-black tracking-wide uppercase shadow-sm">
                                                        ✓ Completed
                                                    </span>
                                                )}
                                                {task.status === "Cancelled" && (
                                                    <span className="inline-block bg-gray-200 text-gray-600 text-xs px-3 py-1.5 rounded-full font-black tracking-wide uppercase shadow-sm line-through">
                                                        X Cancelled
                                                    </span>
                                                )}
                                            </td>

                                            <td className="flex md:table-cell flex-col md:flex-row justify-between items-start md:items-center md:p-5 mb-4 md:mb-0 gap-2 md:gap-0">
                                                <span className="md:hidden text-xs font-bold text-gray-400 uppercase tracking-wider">Details</span>
                                                <p className={`font-bold text-gray-900 border-l-4 pl-3 ${task.status === "Pending" ? "border-orange-400 text-xl" : "border-gray-200 line-through text-gray-400"}`}>
                                                    {task.description}
                                                </p>
                                            </td>

                                            <td className="flex md:table-cell justify-between items-center md:p-5 text-right md:text-center border-b border-gray-50 md:border-none pb-4 md:pb-0 mb-4 md:mb-0">
                                                <span className="md:hidden text-xs font-bold text-gray-400 uppercase tracking-wider">Due Date</span>
                                                <div className={`inline-block py-2 px-4 rounded-xl border text-left md:text-center ${task.status === "Pending" ? "bg-white border-gray-200 shadow-sm" : "bg-gray-100 border-transparent text-gray-400"}`}>
                                                    <p className={`font-bold text-sm ${task.status === "Pending" ? "text-indigo-700" : "text-gray-400"}`}>
                                                        {new Date(task.targetDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </p>
                                                    <p className="text-xs font-semibold text-gray-400 mt-0.5">
                                                        {new Date(task.targetDate).getFullYear()}
                                                    </p>
                                                </div>
                                            </td>

                                            <td className="block md:table-cell p-0 md:p-5 text-right">
                                                {task.status === "Pending" ? (
                                                    <div className="flex flex-col md:flex-row justify-end gap-3 md:gap-2">
                                                        <button
                                                            onClick={() => updateStatus(task._id, "Completed")}
                                                            className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold px-4 py-3 md:py-2 rounded-xl md:rounded-lg transition-colors shadow-sm text-sm"
                                                        >
                                                            ✓ Complete
                                                        </button>
                                                        <button
                                                            onClick={() => updateStatus(task._id, "Cancelled")}
                                                            className="w-full md:w-auto bg-gray-50 md:bg-white hover:bg-gray-100 text-red-500 border border-gray-200 font-bold px-3 py-3 md:py-2 rounded-xl md:rounded-lg transition-colors text-sm"
                                                        >
                                                            X Cancel Task
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm font-bold text-gray-400 italic">Resolved</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
