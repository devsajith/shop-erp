"use client";

import { useEffect, useState, ChangeEvent, FormEvent, useRef, useCallback } from "react";

interface ExpenseEntry {
  _id: string;
  title: string;
  amount: string | number;
  type: string;
  createdAt?: string;
}

export default function Expenses() {
  const [data, setData] = useState<ExpenseEntry[]>([]);
  const [dailyData, setDailyData] = useState<ExpenseEntry[]>([]);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    type: "cash",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [dailyTotal, setDailyTotal] = useState(0);
  const [globalTotal, setGlobalTotal] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset()
    const localDate = new Date(today.getTime() - (offset*60*1000))
    return localDate.toISOString().split('T')[0]
  });

  const fetchData = async (pageNum = 1) => {
    try {
      if (pageNum === 1) setIsLoadingMore(false);
      else setIsLoadingMore(true);

      const res = await fetch(`/api/expenses?date=${selectedDate}&page=${pageNum}&limit=15`);
      const result = await res.json();
      
      setDailyTotal(result.dailyTotal || 0);
      setDailyData(result.dailyList || []);
      setGlobalTotal(result.globalTotal || 0);
      setMonthlyTotal(result.monthlyTotal || 0);
      setHasMore(result.hasMore);
      
      if (pageNum === 1) {
        setData(result.expenses);
      } else {
        setData(prev => [...prev, ...result.expenses]);
      }
    } catch(e) {
      console.error("Error fetching expenses", e)
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchData(1);
  }, [selectedDate]);

  useEffect(() => {
    if (page > 1) {
      fetchData(page);
    }
  }, [page]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, date: selectedDate }),
      });

      setForm({ title: "", amount: "", type: "cash" });
      setPage(1);
      await fetchData(1);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch("/api/expenses", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setPage(1);
    fetchData(1);
  };

  // Infinite Scroll Intersection Observer target
  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLTableRowElement | null) => {
    if (isLoadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [isLoadingMore, hasMore]);

  return (
    <div className="pb-20 bg-gray-50/30 min-h-screen overflow-x-hidden">
      <div className="max-w-7xl mx-auto p-4 md:p-8 md:pt-12">
        
        {/* Header section */}
        <div className="mb-8 md:mb-10 pt-20 md:pt-10 flex flex-col xl:flex-row xl:items-end justify-between gap-4 md:gap-6">
          <div>
             <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900 flex items-center gap-3 md:gap-4">
                <span className="bg-orange-100 text-orange-600 p-2.5 md:p-4 rounded-2xl shadow-sm text-2xl md:text-3xl">💸</span>
                Expenses
              </h1>
              <input 
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ colorScheme: "light" }}
                className="mt-3 xl:mt-0 bg-orange-50 border-2 border-orange-200 text-orange-900 font-black p-3 md:p-4 rounded-xl shadow-sm focus:bg-white focus:ring-4 focus:ring-orange-500 outline-none w-fit cursor-pointer text-lg md:text-xl transition-colors tracking-wide"
                title="Select a date to view its daily outflow sum, and log new expenses into."
              />
            </div>
            <p className="text-gray-500 mt-2 md:mt-4 md:text-lg font-medium">Tracking and adding records for the selected date.</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between md:justify-start gap-4 md:gap-8 w-full xl:w-auto">
             <div className="flex items-center gap-4">
               <div className="bg-orange-50 p-3 rounded-xl text-orange-600">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
               </div>
               <div>
                 <p className="text-[11px] md:text-sm font-bold text-gray-400 uppercase tracking-widest">Daily Outflow</p>
                 <p className="text-xl md:text-2xl font-black text-gray-900 leading-none mt-1 shadow-sm">₹{dailyTotal.toLocaleString()}</p>
               </div>
             </div>

             <div className="hidden md:block w-px h-10 bg-gray-100"></div>
             <div className="md:hidden w-full h-px bg-gray-100"></div>

             <div className="flex items-center gap-4">
               <div className="bg-purple-50 p-3 rounded-xl text-purple-600">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
               </div>
               <div>
                 <p className="text-[11px] md:text-sm font-bold text-gray-400 uppercase tracking-widest">Monthly Outflow</p>
                 <p className="text-xl md:text-2xl font-black text-purple-900 leading-none mt-1 shadow-sm">₹{monthlyTotal.toLocaleString()}</p>
               </div>
             </div>
          </div>
        </div>

        {/* TOP SECTION: Form & Daily Transactions */}
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8 mb-8 md:mb-12">
          
          {/* LEFT COLUMN: Add Expense Form */}
          <div className="w-full lg:w-[400px] shrink-0">
            <div className="bg-white p-5 md:p-8 rounded-3xl md:rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden h-full">
               <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-orange-500/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
              
              <h2 className="text-xl md:text-2xl font-extrabold text-gray-800 mb-5 md:mb-6 flex items-center gap-2">
                New Record
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 relative">
                <div>
                  <label className="block text-xs md:text-sm font-bold text-gray-600 mb-1.5 md:mb-2">Expense Details</label>
                  <input
                    name="title"
                    placeholder="e.g. Electricity Bill..."
                    value={form.title}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-50 border border-gray-200 p-3 md:p-4 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all font-medium placeholder-gray-400 text-sm md:text-base"
                  />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-bold text-gray-600 mb-1.5 md:mb-2">Amount (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                    <input
                      name="amount"
                      type="number"
                      min="1"
                      placeholder="0.00"
                      value={form.amount}
                      onChange={handleChange}
                      required
                      className="w-full bg-gray-50 border border-gray-200 p-3 md:p-4 pl-9 md:pl-10 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all font-bold text-base md:text-lg"
                    />
                  </div>
                </div>

                <div>
                   <label className="block text-xs md:text-sm font-bold text-gray-600 mb-1.5 md:mb-2">Payment Mode</label>
                   <div className="grid grid-cols-2 gap-2 md:gap-3 relative">
                      <label className={`cursor-pointer flex items-center justify-center p-3 md:p-4 rounded-xl border-2 font-bold transition-all text-sm md:text-base ${form.type === 'cash' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                         <input type="radio" name="type" value="cash" checked={form.type === 'cash'} onChange={handleChange} className="sr-only" />
                         💵 Cash
                      </label>
                      <label className={`cursor-pointer flex items-center justify-center p-3 md:p-4 rounded-xl border-2 font-bold transition-all text-sm md:text-base ${form.type === 'digital' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                         <input type="radio" name="type" value="digital" checked={form.type === 'digital'} onChange={handleChange} className="sr-only" />
                         📱 Digital
                      </label>
                   </div>
                </div>

                <div className="pt-1 md:pt-2">
                  <button 
                    type="submit" 
                    disabled={isSubmitting || !form.title || !form.amount}
                    className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold text-base md:text-lg py-3.5 md:py-4 rounded-xl transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:shadow-none flex justify-center items-center gap-2"
                  >
                    {isSubmitting ? (
                      <span className="animate-pulse">Adding...</span>
                    ) : (
                       <>
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                          Add Expense
                       </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: Daily Transaction List */}
          <div className="flex-1">
             <div className="bg-white rounded-3xl md:rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px] lg:h-[550px]">
               
                <div className="p-5 md:p-8 border-b border-gray-50 bg-white sticky top-0 z-10 flex justify-between items-center">
                  <h2 className="text-xl md:text-2xl font-extrabold text-gray-800">Daily Transactions</h2>
                  <span className="bg-orange-50 text-orange-700 font-bold px-3 py-1 rounded-lg text-xs md:text-sm border border-orange-100">{dailyData.length} entries</span>
                </div>

                <div className="p-3 md:p-6 bg-gray-50/50 flex-1 overflow-y-auto">
                  {dailyData.length === 0 ? (
                    <div className="h-full flex flex-col justify-center items-center text-center py-12 md:py-20 opacity-60">
                       <span className="text-5xl md:text-6xl mb-3 md:mb-4 grayscale opacity-50">🧾</span>
                       <h3 className="text-lg md:text-xl font-bold text-gray-700">No Expenses Yet</h3>
                       <p className="text-sm md:text-base text-gray-500 mt-1 md:mt-2 font-medium">No outflow logged for this day!</p>
                    </div>
                  ) : (
                    <div className="grid gap-2.5 md:gap-3">
                      {dailyData.map((item) => (
                        <div
                          key={item._id}
                          className="group bg-white border border-gray-100 hover:border-orange-200 p-3 md:p-5 rounded-2xl flex justify-between items-center transition-all hover:shadow-sm"
                        >
                          <div className="flex items-center gap-3 md:gap-4">
                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 border ${item.type === 'cash' ? 'bg-orange-50 text-orange-600 border-orange-100/50' : 'bg-blue-50 text-blue-600 border-blue-100/50'}`}>
                               <span className="text-lg md:text-xl">{item.type === 'cash' ? '💵' : '📱'}</span>
                            </div>
                            <div>
                              <p className="font-extrabold text-gray-900 text-base md:text-xl leading-tight">{item.title}</p>
                              <p className={`text-[10px] md:text-[11px] font-bold uppercase tracking-wider mt-0.5 md:mt-1 ${item.type === 'cash' ? 'text-orange-500' : 'text-blue-500'}`}>
                                {item.type} payment
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 md:gap-5">
                            <div className="text-right">
                              <p className="font-black text-lg md:text-2xl text-red-600 tracking-tight">
                                -₹{item.amount}
                              </p>
                            </div>

                            <button
                              onClick={() => handleDelete(item._id)}
                              className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 md:p-2.5 rounded-lg md:rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 opacity-100 md:opacity-20 group-hover:opacity-100"
                              title="Delete entry"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="md:w-5 md:h-5"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

             </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Historical Infinite Scroll Table */}
        <div className="w-full overflow-hidden">
             <div className="bg-white rounded-3xl md:rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[500px] xl:h-[650px]">
               
                <div className="p-5 md:p-6 lg:p-8 border-b border-gray-100 bg-white sticky top-0 z-10 flex justify-between items-center">
                  <h2 className="text-xl md:text-2xl font-extrabold text-gray-800">Historical Log</h2>
                  <div className="text-right bg-red-50 px-4 py-2 rounded-xl border border-red-100">
                    <p className="text-[10px] md:text-xs font-bold text-red-500 uppercase tracking-widest leading-none">Lifetime Spent</p>
                    <p className="text-lg md:text-xl font-black text-red-600 leading-none mt-1.5 shadow-sm">₹{globalTotal.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-gray-50/20">
                  {data.length === 0 ? (
                    <div className="h-full flex flex-col justify-center items-center text-center py-12 md:py-20 opacity-60">
                       <span className="text-5xl md:text-6xl mb-3 md:mb-4 grayscale opacity-50">🧾</span>
                       <h3 className="text-lg md:text-xl font-bold text-gray-700">No Expenses Found</h3>
                    </div>
                  ) : (
                    <div className="w-full">
                      <table className="w-full text-left border-collapse block md:table pb-4 md:pb-0">
                        <thead className="hidden md:table-header-group bg-gray-50/80 sticky top-0 z-10 backdrop-blur-md">
                          <tr className="text-gray-500 text-[10px] md:text-xs uppercase tracking-wider border-b border-gray-100">
                            <th className="p-4 md:p-5 font-bold">Date</th>
                            <th className="p-4 md:p-5 font-bold">Details</th>
                            <th className="p-4 md:p-5 font-bold hidden sm:table-cell">Mode</th>
                            <th className="p-4 md:p-5 font-bold">Amount</th>
                            <th className="p-4 md:p-5 font-bold text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="block md:table-row-group divide-y-0 md:divide-y divide-gray-100 flex-col px-4 md:px-0 pt-4 md:pt-0 gap-4 flex md:block">
                          {data.map((item, index) => {
                            const isLast = index === data.length - 1;
                            const createdDate = item.createdAt ? new Date(item.createdAt) : new Date();

                            // Format like "04 Apr"
                            const day = String(createdDate.getDate()).padStart(2, '0');
                            const month = createdDate.toLocaleString('default', { month: 'short' });
                            const displayDate = `${day} ${month}`;

                            return (
                              <tr 
                                key={item._id} 
                                ref={isLast ? lastElementRef : null}
                                className="block md:table-row group hover:bg-orange-50/20 bg-white md:bg-transparent transition-colors border border-gray-100 md:border-transparent rounded-2xl md:rounded-none p-5 md:p-0 shadow-sm md:shadow-none mb-4 md:mb-0"
                              >
                                <td className="flex md:table-cell justify-between items-center md:p-5 text-gray-500 font-bold text-xs md:text-sm whitespace-nowrap mb-2 md:mb-0 border-b md:border-none border-gray-50 pb-3 md:pb-0">
                                  <span className="md:hidden text-xs font-bold text-gray-400 uppercase tracking-wider">Date Logged</span>
                                  {displayDate}
                                </td>
                                <td className="flex md:table-cell justify-between items-center md:p-5 mb-2 md:mb-0">
                                  <span className="md:hidden text-xs font-bold text-gray-400 uppercase tracking-wider">Details</span>
                                  <div className="text-right md:text-left">
                                    <p className="font-extrabold text-gray-900 text-lg md:text-base">{item.title}</p>
                                    <span className={`sm:hidden mt-0.5 inline-block text-[10px] font-bold uppercase ${item.type === 'cash' ? 'text-orange-500' : 'text-blue-500'}`}>
                                      {item.type}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-4 md:p-5 hidden sm:table-cell">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase ${item.type === 'cash' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                                    {item.type === 'cash' ? '💵' : '📱'} {item.type}
                                  </span>
                                </td>
                                <td className="flex md:table-cell justify-between items-center md:p-5 mb-3 md:mb-0">
                                  <span className="md:hidden text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</span>
                                  <p className="font-black text-2xl md:text-lg text-red-600 tracking-tight">
                                    -₹{item.amount}
                                  </p>
                                </td>
                                <td className="block md:table-cell p-0 md:p-5 text-right md:text-center mt-3 md:mt-0 pt-3 md:pt-0 border-t md:border-none border-gray-50">
                                   <button
                                    onClick={() => handleDelete(item._id)}
                                    className="text-gray-400 hover:text-white bg-gray-50 hover:bg-red-500 p-3 md:p-2 rounded-xl transition-colors focus:outline-none opacity-100 md:opacity-0 group-hover:opacity-100 inline-block border border-gray-200 md:border-none"
                                    title="Delete entry"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="md:w-5 md:h-5"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      
                      {isLoadingMore && (
                        <div className="py-8 flex justify-center">
                          <span className="text-gray-400 font-bold animate-pulse">Loading previous records...</span>
                        </div>
                      )}
                      {!hasMore && data.length > 0 && (
                        <div className="py-6 flex justify-center text-gray-300 text-sm font-semibold tracking-wider">
                          END OF LOG
                        </div>
                      )}
                    </div>
                  )}
                </div>

             </div>
          </div>

      </div>
    </div>
  );
}