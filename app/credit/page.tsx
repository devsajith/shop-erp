"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";

interface CreditCustomer {
  _id: string;
  customerName: string;
  phoneNumber: string;
  balance: number;
  lastNote?: string;
  updatedAt: string;
}

export default function Credit() {
  const [data, setData] = useState<CreditCustomer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Add Customer Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    customerName: "",
    phoneNumber: "",
    oldBalance: "",
    newCredit: "",
    note: "",
  });

  // Action Modal State (for adding credit, paying partial)
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    customerId: "",
    customerName: "",
    actionType: "add" as "add" | "partial" | "settle",
    amount: "",
    note: "",
  });

  // History Log Modal State
  const [logModal, setLogModal] = useState({
    isOpen: false,
    customerName: "",
    logs: [] as any[],
    isLoading: false
  });

  const fetchData = async () => {
    const res = await fetch("/api/credit");
    const result = await res.json();
    setData(result);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setAddForm({ ...addForm, [e.target.name]: e.target.value });
  };

  const handleActionChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setActionModal({ ...actionModal, [e.target.name]: e.target.value });
  };

  const submitAddCustomer = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await fetch("/api/credit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addForm),
    });
    setAddForm({ customerName: "", phoneNumber: "", oldBalance: "", newCredit: "", note: "" });
    setIsAddModalOpen(false);
    fetchData();
  };

  const triggerAction = (customer: CreditCustomer, type: "add" | "partial" | "settle") => {
    if (type === "settle") {
      const confirmSettle = window.confirm(`Are you sure you want to mark ${customer.customerName}'s account as Fully Settled (₹0)?`);
      if (!confirmSettle) return;
      
      // Directly settle without modal
      fetch("/api/credit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: customer._id, action: "settle", amount: 0, note: "Settled flat." }),
      }).then(() => fetchData());
      return;
    }

    // Open Modal for Add/Partial
    setActionModal({
      isOpen: true,
      customerId: customer._id,
      customerName: customer.customerName,
      actionType: type,
      amount: "",
      note: "",
    });
  };

  const submitAction = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const amountNum = Number(actionModal.amount);
    if (isNaN(amountNum) || amountNum <= 0) return alert("Please enter a valid positive amount.");

    await fetch("/api/credit", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: actionModal.customerId,
        action: actionModal.actionType,
        amount: amountNum,
        note: actionModal.note,
      }),
    });

    setActionModal({ ...actionModal, isOpen: false, amount: "", note: "" });
    fetchData();
  };

  const viewHistory = async (customer: CreditCustomer) => {
    setLogModal({ isOpen: true, customerName: customer.customerName, logs: [], isLoading: true });
    try {
      const res = await fetch(`/api/credit/log?customerId=${customer._id}`);
      const data = await res.json();
      setLogModal({ isOpen: true, customerName: customer.customerName, logs: data, isLoading: false });
    } catch (e) {
      console.error(e);
      setLogModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const filteredData = data.filter((item) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      item.customerName.toLowerCase().includes(searchLower) ||
      (item.phoneNumber && item.phoneNumber.includes(searchLower))
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20 relative">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pt-20 md:pt-10">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900">
              Credit Accounts
            </h1>
            <p className="text-gray-500 mt-2 text-lg">Manage debts, track continuous balances, and record notes.</p>
          </div>
          
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-lg py-3 px-8 rounded-full transition-colors shadow-md shadow-blue-500/30 shrink-0"
          >
            + Add New Customer
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 w-full">
          <div className="relative w-full">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input 
              type="text"
              placeholder="Search customers by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 p-4 pl-12 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-lg"
            />
          </div>
        </div>

        {/* Data Table Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {data.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-gray-400 mb-4 text-6xl">📘</div>
              <h3 className="text-2xl font-semibold text-gray-600">No credit accounts found</h3>
              <p className="text-gray-400 mt-2 text-lg">Add your first customer using the button above.</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-20">
              <h3 className="text-xl font-semibold text-gray-600">No customers match your search</h3>
              <p className="text-gray-400 mt-1">Try a different name or phone number.</p>
            </div>
          ) : (
            <div className="overflow-x-hidden md:overflow-x-auto">
              <table className="w-full text-left border-collapse block md:table pb-4 md:pb-0">
                <thead className="hidden md:table-header-group">
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                    <th className="p-5 font-bold">Customer Info</th>
                    <th className="p-5 font-bold">Latest Note</th>
                    <th className="p-5 font-bold">Current Balance</th>
                    <th className="p-5 font-bold">Last Updated</th>
                    <th className="p-5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="block md:table-row-group divide-y-0 md:divide-y divide-gray-50 flex-col px-4 md:px-0 pt-4 md:pt-0 gap-5 flex md:block">
                  {filteredData.map((item) => (
                    <tr key={item._id} className="block md:table-row transition-colors group border border-gray-100 md:border-transparent rounded-3xl md:rounded-none p-6 md:p-0 shadow-sm md:shadow-none mb-4 md:mb-0 bg-white hover:bg-blue-50/20">
                      <td className="flex md:table-cell justify-between items-start md:p-5 border-b border-gray-100 md:border-none pb-5 md:pb-0 mb-5 md:mb-0">
                        <div className="flex items-start gap-4">
                          <button onClick={() => viewHistory(item)} className="bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 w-12 h-12 flex items-center justify-center rounded-2xl transition-colors shadow-sm text-xl shrink-0 mt-0.5" title="View Current Month History">
                            👁
                          </button>
                          <div>
                            <p className="font-extrabold text-gray-900 text-xl md:text-lg">{item.customerName}</p>
                            <p className="text-gray-500 text-sm font-semibold mt-1">{item.phoneNumber || "No phone"}</p>
                            {item.balance === 0 && (
                              <span className="inline-block mt-2 bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-md font-bold tracking-wide uppercase">
                                Fully Settled
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="flex md:table-cell justify-between items-start md:p-5 md:max-w-xs mb-3 md:mb-0">
                        <span className="md:hidden text-xs font-bold text-gray-400 uppercase tracking-wider min-w-[30%]">Latest Note</span>
                        <p className="text-sm text-gray-600 italic truncate text-right md:text-left" title={item.lastNote || "No notes logged."}>
                          {item.lastNote || "-"}
                        </p>
                      </td>
                      <td className="flex md:table-cell justify-between items-center md:p-5 mb-3 md:mb-0">
                        <span className="md:hidden text-xs font-bold text-gray-400 uppercase tracking-wider min-w-[30%]">Balance</span>
                        <p className={`font-black text-3xl md:text-2xl ${item.balance > 0 ? "text-red-600" : "text-emerald-500"}`}>
                          ₹{item.balance}
                        </p>
                      </td>
                      <td className="flex md:table-cell justify-between items-center md:p-5 border-b border-gray-100 md:border-none pb-5 md:pb-0 mb-5 md:mb-0">
                        <span className="md:hidden text-xs font-bold text-gray-400 uppercase tracking-wider min-w-[30%]">Last Updated</span>
                        <div className="text-right md:text-left">
                          <p className="text-sm font-bold text-gray-700">
                            {new Date(item.updatedAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(item.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      </td>
                      <td className="block md:table-cell p-0 md:p-5">
                        <div className="flex flex-col md:flex-row flex-wrap justify-end items-stretch md:items-center gap-3 md:gap-2 w-full">
                          {item.balance > 0 ? (
                            <>
                              <button onClick={() => triggerAction(item, "partial")} className="w-full md:w-auto bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 px-4 py-3 md:py-2 rounded-xl font-bold transition-colors shadow-sm text-sm">
                                Pay Partial
                              </button>
                              <button onClick={() => triggerAction(item, "add")} className="w-full md:w-auto bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 px-4 py-3 md:py-2 rounded-xl font-bold transition-colors shadow-sm text-sm">
                                Add Credit
                              </button>
                              <button onClick={() => triggerAction(item, "settle")} className="w-full md:w-auto bg-green-500 hover:bg-green-600 text-white px-4 py-3 md:py-2 rounded-xl font-bold shadow-md shadow-green-500/20 transition-colors text-sm">
                                Settle Full
                              </button>
                            </>
                          ) : (
                            <button onClick={() => triggerAction(item, "add")} className="w-full bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 px-6 py-3 md:py-2 rounded-xl font-bold transition-colors shadow-sm text-sm md:w-auto">
                              Give New Credit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Add New Customer */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 w-full max-w-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 md:p-8 overflow-y-auto w-full">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-extrabold text-gray-800">Add New Customer</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-red-500 text-3xl leading-none font-bold transition-colors">
                  &times;
                </button>
              </div>
              
              <form onSubmit={submitAddCustomer} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700 ml-1">Customer Name</label>
                  <input name="customerName" placeholder="e.g., John Doe" value={addForm.customerName} onChange={handleAddChange} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none w-full" required />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700 ml-1">Phone Number</label>
                  <input name="phoneNumber" placeholder="e.g., 9876543210" value={addForm.phoneNumber} onChange={handleAddChange} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none w-full" />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700 ml-1">Old Balance (₹)</label>
                  <input name="oldBalance" type="number" placeholder="0" value={addForm.oldBalance} onChange={handleAddChange} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none w-full font-medium" />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700 ml-1">New Credit Amount (₹)</label>
                  <input name="newCredit" type="number" placeholder="0" value={addForm.newCredit} onChange={handleAddChange} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none w-full font-medium" />
                </div>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700 ml-1">Additional Note (Optional)</label>
                  <textarea name="note" rows={2} placeholder="Store context or invoice references here..." value={addForm.note} onChange={handleAddChange} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none w-full resize-none" />
                </div>

                <div className="md:col-span-2 mt-2">
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 rounded-full transition-colors shadow-md">
                    Save Customer Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Action Modal (Add/Partial) */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setActionModal({ ...actionModal, isOpen: false })}></div>
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 w-full max-w-lg z-10 overflow-hidden flex flex-col">
            <div className="p-6 md:p-8 w-full">
              
              <div className="mb-6 border-b pb-4">
                <h2 className="text-2xl font-extrabold text-gray-800">
                  {actionModal.actionType === "add" ? "Grant Credit" : "Process Payment"}
                </h2>
                <p className="text-gray-500 mt-1">for <span className="font-bold text-gray-800 uppercase">{actionModal.customerName}</span></p>
              </div>
              
              <form onSubmit={submitAction} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700 ml-1">
                    {actionModal.actionType === "add" ? "Amount Taken (₹)" : "Amount Paying Back (₹)"}
                  </label>
                  <input 
                    name="amount" 
                    type="number" 
                    placeholder="e.g., 500" 
                    value={actionModal.amount} 
                    onChange={handleActionChange} 
                    className="p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none w-full text-xl font-black text-center" 
                    required 
                    min="1"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-gray-700 ml-1">Transaction Note (Optional)</label>
                  <input 
                    name="note" 
                    type="text" 
                    placeholder="e.g., 'Paid in cash' or 'Bought 10kg sugar'" 
                    value={actionModal.note} 
                    onChange={handleActionChange} 
                    className="p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none w-full" 
                  />
                </div>

                <div className="mt-4 flex gap-3">
                  <button type="button" onClick={() => setActionModal({ ...actionModal, isOpen: false })} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-4 rounded-xl transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className={`flex-[2] text-white font-bold py-4 rounded-xl shadow-md transition-colors ${actionModal.actionType === "add" ? "bg-red-600 hover:bg-red-700" : "bg-emerald-500 hover:bg-emerald-600"}`}>
                    Confirm Transaction
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: History Log View Modal */}
      {logModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setLogModal({ ...logModal, isOpen: false })}></div>
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 w-full max-w-3xl z-10 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 md:p-8 flex flex-col h-full overflow-hidden">
               
              <div className="flex justify-between items-center mb-6 shrink-0 border-b pb-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-800">
                    Monthly Activity
                  </h2>
                  <p className="text-gray-500 mt-1 font-medium">Receipts for <span className="font-bold text-gray-900">{logModal.customerName}</span> (from Day 1)</p>
                </div>
                <button onClick={() => setLogModal({ ...logModal, isOpen: false })} className="text-gray-400 hover:text-red-500 text-3xl leading-none font-bold transition-colors bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center">
                  &times;
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2">
                {logModal.isLoading ? (
                  <div className="py-20 text-center text-gray-400 font-bold animate-pulse">Loading secure logs...</div>
                ) : logModal.logs.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="text-5xl mb-3 grayscale opacity-40">🧾</div>
                    <p className="text-xl font-bold text-gray-700">No History Documented</p>
                    <p className="text-gray-400 mt-1">No receipts recorded for this user this month yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                     {logModal.logs.map((log: any, i: number) => {
                       const isC = log.action === "add";
                       const isP = log.action === "partial";
                       const isS = log.action === "settle";
                       
                       return (
                         <div key={log._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                             <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-white shrink-0 absolute left-0 md:left-1/2 -translate-x-1/2 z-10 shadow-sm">
                               {isC && <div className="w-4 h-4 bg-red-500 rounded-full"></div>}
                               {isP && <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>}
                               {isS && <div className="w-4 h-4 bg-amber-500 rounded-full"></div>}
                             </div>

                             <div className="w-full md:w-[calc(50%-2.5rem)] pl-12 md:pl-0">
                               <div className={`p-4 rounded-2xl border bg-white shadow-sm transition-transform ${isC ? 'border-red-100 hover:border-red-300' : isP ? 'border-emerald-100 hover:border-emerald-300' : 'border-amber-100 hover:border-amber-300'}`}>
                                 <div className="flex justify-between items-start mb-2">
                                     <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${isC ? 'bg-red-50 text-red-700' : isP ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
                                       {isC && "Took Credit"}
                                       {isP && "Paid Partial"}
                                       {isS && "Settled Flat"}
                                     </span>
                                     <div className="text-right">
                                       <p className="text-xs font-bold text-gray-500">{new Date(log.createdAt).toLocaleDateString(undefined, {month: "short", day: "numeric"})}</p>
                                       <p className="text-[10px] font-semibold text-gray-400">{new Date(log.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                     </div>
                                 </div>
                                 
                                 <div className="flex items-end justify-between mt-3">
                                   <p className={`font-black text-2xl ${isC ? "text-red-600" : isP ? "text-emerald-600" : "text-amber-600"}`}>
                                      {isS ? "₹0.00" : `₹${log.amount}`}
                                   </p>
                                   {log.note && (
                                     <p className="text-xs text-gray-500 italic font-medium max-w-[60%] text-right bg-gray-50 p-1.5 rounded-lg border border-gray-100">"{log.note}"</p>
                                   )}
                                 </div>
                               </div>
                             </div>
                         </div>
                       )
                     })}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}