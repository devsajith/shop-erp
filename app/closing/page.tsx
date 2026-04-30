"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";

interface ClosingEntry {
  _id: string;
  createdAt: string;
  cash: number;
  digital: number;
  expenses?: number;
  profit?: number;
  totalCollection?: number;
}

export default function Closing() {
  const [data, setData] = useState<ClosingEntry[]>([]);
  const [todayClosing, setTodayClosing] = useState<ClosingEntry | null>(null);
  const [monthlyData, setMonthlyData] = useState<any>({ totalProfit: 0, totalCollection: 0, totalExpenses: 0 });
  const [form, setForm] = useState({
    cash: "",
    digital: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    const res = await fetch("/api/closing");
    const result = await res.json();
    // After our API update, result contains history, todayClosing, monthlyData
    if (result.history) {
      setData(result.history);
      setTodayClosing(result.todayClosing);
      setMonthlyData(result.monthlyData);
    } else {
      // Fallback if cached
      setData(result);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await fetch("/api/closing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      setForm({ cash: "", digital: "" });
      await fetchData();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-20 bg-gray-50/30 min-h-screen">
      <div className="max-w-7xl mx-auto p-4 md:p-8 md:pt-12">
        
        {/* Header section & Monthly Dash */}
        <div className="mb-8 md:mb-10 pt-20 md:pt-10 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900 flex items-center gap-3 md:gap-4">
              <span className="bg-red-100 text-red-600 p-2.5 md:p-4 rounded-2xl shadow-sm text-2xl md:text-3xl">🌙</span>
              Daily Closing
            </h1>
            <p className="text-gray-500 mt-2 md:mt-4 md:text-lg font-medium">Finalize your day by logging currently held balances.</p>
          </div>

          <div className="flex flex-row w-full xl:w-auto gap-3 md:gap-5">
             {/* Monthly Profit Card */}
             <div className="flex-1 md:w-56 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 md:gap-4 relative group hover:border-green-200 transition-all hover:shadow-md cursor-help">
               <div className="bg-green-50 w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center text-green-600 shadow-inner">
                 <span className="text-xl">📈</span>
               </div>
               <div>
                 <p className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Monthly Profit</p>
                 <p className="text-2xl md:text-3xl font-black text-green-600 tracking-tighter">₹{(monthlyData?.totalProfit || 0).toLocaleString()}</p>
               </div>
                {/* Tooltip Explanation */}
                <div className="absolute top-full mt-2 left-0 w-64 bg-gray-900 text-white text-xs p-3 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl">
                  <p className="font-bold border-b border-gray-700 pb-1 mb-1">How is Profit Calculated?</p>
                  <p className="text-gray-300 leading-relaxed">Profit is the direct sum of the Cash & Digital balances you enter here every night. (Net Income held in the till).</p>
                </div>
             </div>

             {/* Monthly Collection Card */}
             <div className="flex-1 md:w-56 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 md:gap-4 relative group hover:border-blue-200 transition-all hover:shadow-md cursor-help">
               <div className="bg-blue-50 w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                 <span className="text-xl">💰</span>
               </div>
               <div>
                 <p className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Monthly Collection</p>
                 <p className="text-2xl md:text-3xl font-black text-blue-600 tracking-tighter">₹{(monthlyData?.totalCollection || 0).toLocaleString()}</p>
               </div>
               {/* Tooltip Explanation */}
                <div className="absolute top-full right-0 md:left-0 md:right-auto mt-2 w-72 bg-gray-900 text-white text-xs p-3 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl">
                  <p className="font-bold border-b border-gray-700 pb-1 mb-1">What is Total Collection?</p>
                  <p className="text-gray-300 leading-relaxed">This is your Gross Intake (sales). It checks your declared Profit and adds back the daytime Expenses automatically: <br/><strong className="text-white mt-1 block">Profit + Expenses = Collection</strong></p>
                </div>
             </div>
          </div>
        </div>

        {/* TOP ROW: Add Closing Form & Today's Summary */}
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8 mb-8 md:mb-12">
          
          {/* LEFT: Till Count Form */}
          <div className="w-full lg:w-1/2">
            <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden h-full">
               <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-red-500/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
              
              <h2 className="text-xl md:text-2xl font-extrabold text-gray-800 mb-5 md:mb-6 flex items-center gap-2">
                1. Count Your Till
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 relative">
                <div>
                  <label className="block text-xs md:text-sm font-bold text-gray-600 mb-1.5 md:mb-2">Physical Cash Balance (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg md:text-xl">💵</span>
                    <input
                      name="cash"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={form.cash}
                      onChange={handleChange}
                      required
                      className="w-full bg-gray-50 border border-gray-200 py-3 md:py-4 pr-3 pl-14 md:pl-16 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all font-extrabold text-gray-900 text-lg md:text-2xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-bold text-gray-600 mb-1.5 md:mb-2">Banking / Digital Balance (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg md:text-xl">📱</span>
                    <input
                      name="digital"
                      type="number"
                      min="0"
                      placeholder="0"
                      value={form.digital}
                      onChange={handleChange}
                      required
                      className="w-full bg-gray-50 border border-gray-200 py-3 md:py-4 pr-3 pl-14 md:pl-16 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-extrabold text-gray-900 text-lg md:text-2xl"
                    />
                  </div>
                </div>

                <div className="pt-2 md:pt-4">
                  <button 
                    type="submit" 
                    disabled={isSubmitting || (!form.cash && !form.digital)}
                    className="w-full bg-gray-900 hover:bg-black active:bg-gray-800 text-white font-black text-base md:text-lg py-4 md:py-5 rounded-xl transition-all shadow-lg shadow-gray-900/20 disabled:opacity-50 flex justify-center items-center gap-2 uppercase tracking-widest"
                  >
                    {isSubmitting ? (
                      <span className="animate-pulse">Locking Register...</span>
                    ) : (
                       <>
                          <span className="text-xl">🔒</span>
                          End For Today
                       </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT: Today's Generated Report */}
          <div className="w-full lg:w-1/2">
             <div className="bg-indigo-900 text-white p-6 md:p-8 rounded-3xl md:rounded-[2rem] shadow-xl relative overflow-hidden h-full flex flex-col justify-center">
                {/* Background flare */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl -ml-10 -mb-10"></div>
                
                <h2 className="text-xl md:text-2xl font-extrabold text-white mb-6 relative z-10 flex items-center justify-between">
                  <span>2. Today's Result</span>
                  <span className="text-xs font-bold bg-indigo-800 px-3 py-1 rounded-full text-indigo-300">
                     {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </h2>

                {!todayClosing ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60 z-10 p-8">
                     <span className="text-5xl mb-4 grayscale opacity-30">🧾</span>
                     <p className="font-bold text-lg text-indigo-200">Waiting for Closing</p>
                     <p className="text-sm mt-1 text-indigo-300/80">Submit your till count on the left to securely calculate and generate today's collections.</p>
                  </div>
                ) : (
                  <div className="z-10 space-y-6">
                     <div className="grid grid-cols-2 gap-4 border-b border-indigo-800/50 pb-6">
                        <div className="bg-indigo-800/40 p-4 rounded-2xl border border-indigo-700/50">
                           <p className="text-[11px] font-bold text-indigo-300 uppercase tracking-widest mb-1">Net Balance (Profit)</p>
                           <p className="text-2xl lg:text-3xl font-black text-green-400">₹{todayClosing.profit?.toLocaleString()}</p>
                        </div>
                        <div className="bg-indigo-800/40 p-4 rounded-2xl border border-indigo-700/50">
                           <p className="text-[11px] font-bold text-indigo-300 uppercase tracking-widest mb-1">Total Collection</p>
                           <p className="text-2xl lg:text-3xl font-black text-blue-300">₹{todayClosing.totalCollection?.toLocaleString()}</p>
                        </div>
                     </div>
                     
                     <div className="pt-2 grid grid-cols-3 gap-2">
                        <div>
                           <p className="text-[10px] text-indigo-300 font-bold uppercase mb-1 border-b border-indigo-800">Cash Checked</p>
                           <p className="font-bold text-white">₹{todayClosing.cash}</p>
                        </div>
                        <div>
                           <p className="text-[10px] text-indigo-300 font-bold uppercase mb-1 border-b border-indigo-800">Digital Checked</p>
                           <p className="font-bold text-white">₹{todayClosing.digital}</p>
                        </div>
                        <div>
                           <p className="text-[10px] text-indigo-300 font-bold uppercase mb-1 border-b border-indigo-800">Day Expenses</p>
                           <p className="font-bold text-red-300">₹{todayClosing.expenses}</p>
                        </div>
                     </div>
                  </div>
                )}
             </div>
          </div>

        </div>

        {/* BOTTOM ROW: History Table */}
        <div className="w-full">
           <div className="bg-white rounded-3xl md:rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
             
              <div className="p-5 md:p-6 lg:p-8 border-b border-gray-100 bg-white sticky top-0 z-10 flex justify-between items-center">
                <h2 className="text-xl md:text-2xl font-extrabold text-gray-800">Closing History</h2>
              </div>

              <div className="flex-1 overflow-y-auto bg-gray-50/20">
                {data.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center py-12 md:py-20 opacity-60">
                     <span className="text-5xl md:text-6xl mb-4 grayscale opacity-50">📉</span>
                     <h3 className="text-lg md:text-xl font-bold text-gray-700">No Past Closings</h3>
                     <p className="text-gray-500 mt-2 font-medium">End your day to log data.</p>
                  </div>
                ) : (
                  <div className="w-full">
                    <table className="w-full text-left border-collapse block md:table pb-4 md:pb-0">
                      <thead className="hidden md:table-header-group bg-gray-50/80 sticky top-0 z-10 backdrop-blur-md">
                        <tr className="text-gray-500 text-[10px] md:text-xs uppercase tracking-wider border-b border-gray-100">
                          <th className="p-4 md:p-5 font-bold">Date & Balances</th>
                          <th className="p-4 md:p-5 font-bold text-right text-gray-400">Paid Expenses</th>
                          <th className="p-4 md:p-5 font-bold text-right text-blue-600">Total Collection</th>
                          <th className="p-4 md:p-5 font-bold text-right text-green-600">Net Profit (Balances)</th>
                        </tr>
                      </thead>
                      <tbody className="block md:table-row-group divide-y-0 md:divide-y divide-gray-100 flex-col px-4 md:px-0 pt-4 md:pt-0 gap-4 flex md:block">
                        {data.map((item) => {
                          const date = new Date(item.createdAt);
                          const day = String(date.getDate()).padStart(2, '0');
                          const month = date.toLocaleString('default', { month: 'short' });
                          const year = date.getFullYear();

                          const expenses = item.expenses || 0;
                          const profit = item.profit || (Number(item.cash) + Number(item.digital));
                          const collection = item.totalCollection || profit + expenses;

                          return (
                            <tr 
                              key={item._id} 
                              className="block md:table-row group hover:bg-blue-50/20 bg-white md:bg-transparent transition-colors border border-gray-100 md:border-transparent rounded-3xl md:rounded-none p-5 md:p-0 shadow-sm md:shadow-none mb-4 md:mb-0"
                            >
                              <td className="flex md:table-cell justify-between items-center md:p-5 border-b border-gray-50 md:border-none pb-4 md:pb-0 mb-4 md:mb-0 whitespace-nowrap">
                                <div>
                                  <span className="md:hidden text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Date Logged</span>
                                  <p className="font-extrabold text-gray-900 text-base">{day} {month} {year}</p>
                                </div>
                                <div className="flex flex-col md:flex-row items-end md:items-center gap-2 md:gap-3 mt-0 md:mt-1.5 text-[10px] md:text-xs font-bold text-gray-500">
                                   <span className="bg-gray-100 px-2.5 py-1 rounded-md" title="Cash">💵 ₹{item.cash}</span>
                                   <span className="bg-gray-100 px-2.5 py-1 rounded-md" title="Digital">📱 ₹{item.digital}</span>
                                </div>
                              </td>
                              <td className="flex md:table-cell justify-between items-center md:p-5 text-right align-middle mb-2 md:mb-0">
                                <span className="md:hidden text-xs font-bold text-gray-400 uppercase tracking-wider">Paid Expenses</span>
                                <p className="font-bold text-sm md:text-base text-gray-500">
                                  ₹{expenses}
                                </p>
                              </td>
                              <td className="flex md:table-cell justify-between items-center md:p-5 text-right align-middle mb-2 md:mb-0">
                                <span className="md:hidden text-xs font-bold text-gray-400 uppercase tracking-wider">Gross Collection</span>
                                <p className="font-black text-base text-blue-600">
                                  ₹{collection}
                                </p>
                              </td>
                              <td className="flex md:table-cell justify-between items-center md:p-5 text-right align-middle border-t border-gray-50 md:border-none mt-2 md:mt-0 pt-4 md:pt-0">
                                <span className="md:hidden text-xs font-bold text-gray-400 uppercase tracking-wider">Net Profit</span>
                                <p className="font-black text-2xl md:text-lg text-green-600">
                                  ₹{profit}
                                </p>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

           </div>
        </div>

      </div>
    </div>
  );
}