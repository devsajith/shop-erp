"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ReminderTask {
  _id: string;
  description: string;
  targetDate: string;
}

interface DashboardData {
  totalProducts: number;
  totalCredit: number;
  totalExpenses: number;
  latestClosing: {
    cash: string | number;
    digital: string | number;
  } | null;
  pendingReminders: ReminderTask[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard");
      const result = await res.json();
      setData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 text-gray-400 font-bold text-2xl">
        Loading ERP Matrix...
      </div>
    );
  }

  return (
    <div className="pb-20">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        
        {/* Header section (Removed) */}
        <div className="pt-12 md:pt-20"></div>

        {/* TWO-COLUMN GRID: Left Main (Launchers) | Right Side (Widget) */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT COLUMN: Deep Routing Matrix */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 h-fit">
            
            {/* Launch Node: Inventory */}
            <Link href="/inventory" className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-lg hover:border-blue-200 group active:scale-[0.98]">
              <div className="flex justify-between items-start mb-6">
                <span className="text-4xl bg-blue-50 p-3 rounded-2xl">📦</span>
                <span className="text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">Open <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Module</p>
                <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Inventory Log</h2>
                <div className="bg-gray-50 rounded-xl p-3 inline-block">
                  <p className="text-2xl font-black text-gray-900 leading-none">
                    {data.totalProducts} <span className="text-xs text-gray-400 ml-0.5">items</span>
                  </p>
                </div>
              </div>
            </Link>

            {/* Launch Node: Orders */}
            <Link href="/orders" className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-lg hover:purple-blue-200 group active:scale-[0.98]">
               <div className="flex justify-between items-start mb-6">
                <span className="text-4xl bg-purple-50 p-3 rounded-2xl">📋</span>
                <span className="text-purple-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">Open <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Module</p>
                <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Order Creator</h2>
                <div className="bg-gray-50 rounded-xl p-3 inline-block">
                  <p className="text-sm font-bold text-gray-500 leading-none">
                    Generate exports
                  </p>
                </div>
              </div>
            </Link>

            {/* Launch Node: Credit Tracker */}
            <Link href="/credit" className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-lg hover:border-red-200 group active:scale-[0.98]">
              <div className="flex justify-between items-start mb-6">
                <span className="text-4xl bg-red-50 p-3 rounded-2xl">⚠️</span>
                <span className="text-red-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">Open <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Module</p>
                <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Credit Log</h2>
                <div className="bg-red-50 rounded-xl p-3 inline-block">
                  <p className="text-2xl font-black text-red-600 leading-none">
                    ₹{data.totalCredit} <span className="text-xs text-red-400 ml-0.5">owed</span>
                  </p>
                </div>
              </div>
            </Link>

            {/* Launch Node: Expenses */}
            <Link href="/expenses" className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-lg hover:border-orange-200 group active:scale-[0.98]">
               <div className="flex justify-between items-start mb-6">
                <span className="text-4xl bg-orange-50 p-3 rounded-2xl">💸</span>
                <span className="text-orange-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">Open <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Module</p>
                <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Expenses</h2>
                <div className="bg-orange-50 rounded-xl p-3 inline-block">
                  <p className="text-2xl font-black text-orange-600 leading-none">
                    ₹{data.totalExpenses}
                  </p>
                </div>
              </div>
            </Link>

            {/* Launch Node: Closing Till */}
            <Link href="/closing" className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-lg hover:border-emerald-200 group active:scale-[0.98]">
               <div className="flex justify-between items-start mb-6">
                <span className="text-4xl bg-emerald-50 p-3 rounded-2xl">🏦</span>
                <span className="text-emerald-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">Open <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Module</p>
                <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Daily Closing</h2>
                <div className="bg-emerald-50 rounded-xl p-3 inline-block">
                   {data.latestClosing ? (
                     <p className="text-md font-black text-emerald-700 leading-none">
                        ₹{data.latestClosing.cash} <span className="text-xs text-emerald-600 font-bold ml-1">CASH</span>
                     </p>
                   ) : (
                     <p className="text-sm font-bold text-gray-500">Till Empty</p>
                   )}
                </div>
              </div>
            </Link>

            {/* Launch Node: Active Reminders */}
            <Link href="/reminders" className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-lg hover:border-indigo-200 group active:scale-[0.98]">
               <div className="flex justify-between items-start mb-6">
                <span className="text-4xl bg-indigo-50 p-3 rounded-2xl">⚡</span>
                <span className="text-indigo-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">Open <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Module</p>
                <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Reminders</h2>
                <div className="bg-indigo-50 rounded-xl p-3 inline-block">
                  <p className="text-sm font-bold text-indigo-600 leading-none">
                    Track requests
                  </p>
                </div>
              </div>
            </Link>

          </div>

          {/* RIGHT COLUMN: Reminders Inbox Widget */}
          <div className="w-full lg:w-[400px] flex flex-col h-full mt-6 lg:mt-0">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col h-full min-h-[500px]">
              
              {/* Widget Header */}
              <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                    <span>⏱</span> Pending Orders
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5 font-semibold">Priority Deadlines</p>
                </div>
                <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-black text-sm">
                  {data.pendingReminders?.length || 0}
                </div>
              </div>

              {/* Widget Body (Scrollable List) */}
              <div className="p-6 flex-1 overflow-y-auto bg-white max-h-[600px] min-h-[300px]">
                {(!data.pendingReminders || data.pendingReminders.length === 0) ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-60">
                    <span className="text-5xl mb-4">✨</span>
                    <h3 className="text-lg font-bold text-gray-700">Inbox Zero</h3>
                    <p className="text-sm text-gray-500 mt-1">You have no pending order schedules!</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {data.pendingReminders.map((task) => (
                      <div key={task._id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 hover:border-gray-200 transition-colors group cursor-default">
                        <div className="flex justify-between items-start mb-2">
                          <span className="inline-block bg-orange-100 text-orange-700 text-[10px] px-2 py-1 rounded-md font-black tracking-wide uppercase">
                            Pending
                          </span>
                          <span className="text-xs font-bold text-gray-500 bg-white px-2 py-1 rounded-md shadow-sm border border-gray-100">
                             {new Date(task.targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                          </span>
                        </div>
                        <p className="font-bold text-gray-900 border-l-2 border-orange-400 pl-2 text-md mt-3 leading-snug">
                          {task.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Widget Footer */}
              <div className="p-4 border-t border-gray-100 bg-gray-50/50 text-center">
                 <Link href="/reminders" className="text-blue-600 font-bold text-sm hover:text-blue-800 transition-colors w-full inline-block py-2">
                   Manage all tasks →
                 </Link>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}