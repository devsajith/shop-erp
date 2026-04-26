"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";

interface Product {
  _id: string;
  name: string;
  wholesaleRate: string | number;
  retailRate: string | number;
  category: string;
  unit: string;
}

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // New States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  const [form, setForm] = useState({
    name: "",
    wholesaleRate: "",
    retailRate: "",
    category: "Bakery",
    unit: "KG",
  });

  const fetchProducts = async () => {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm({ name: "", wholesaleRate: "", retailRate: "", category: "Bakery", unit: "KG" });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (editingId) {
      await fetch(`/api/products/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }

    closeModal();
    fetchProducts();
  };

  const handleEdit = (product: Product) => {
    setEditingId(product._id);
    setForm({
      name: product.name,
      wholesaleRate: String(product.wholesaleRate || ""),
      retailRate: String(product.retailRate || ""),
      category: product.category,
      unit: product.unit || "KG",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    fetchProducts();
  };

  // Filter dynamic logic
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "All" || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20 relative">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        
        {/* Header & Main Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pt-20 md:pt-10">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900">
              Inventory Data
            </h1>
            <p className="text-gray-500 mt-2 text-lg">Manage your entire stock efficiently</p>
          </div>
          
          <button 
            onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-lg py-3 px-8 rounded-full transition-colors shadow-md shadow-blue-500/30 shrink-0"
          >
            + Add New Item
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input 
              type="text"
              placeholder="Search products by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 p-3 pl-10 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none w-full"
            />
          </div>

          <div className="w-full md:w-64 shrink-0">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer appearance-none"
            >
              <option value="All">All Categories</option>
              <option value="Bakery">Bakery</option>
              <option value="Grocery">Grocery</option>
              <option value="Vegetable">Vegetable</option>
            </select>
          </div>
        </div>

        {/* Product Table Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {products.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-2 text-5xl">📦</div>
              <h3 className="text-xl font-semibold text-gray-600">No products found</h3>
              <p className="text-gray-400 mt-1">Add your first product above to get started.</p>
            </div>
          ) : filteredProducts.length === 0 ? (
             <div className="text-center py-16">
              <h3 className="text-xl font-semibold text-gray-600">No products match your filters</h3>
              <p className="text-gray-400 mt-1">Try clearing your search or changing the category.</p>
            </div>
          ) : (
            <div className="overflow-x-hidden md:overflow-x-auto">
              <table className="w-full text-left border-collapse block md:table pb-4 md:pb-0">
                <thead className="hidden md:table-header-group">
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                    <th className="p-5 font-bold">Product Name</th>
                    <th className="p-5 font-bold">Category</th>
                    <th className="p-5 font-bold">Wholesale Rate</th>
                    <th className="p-5 font-bold">Retail Rate</th>
                    <th className="p-5 font-bold">Unit Metric</th>
                    <th className="p-5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="block md:table-row-group divide-y-0 md:divide-y divide-gray-50 flex-col px-4 md:px-0 pt-4 md:pt-0 gap-4 flex md:block">
                  {filteredProducts.map((p) => (
                    <tr key={p._id} className="block md:table-row hover:bg-blue-50/30 transition-colors group bg-white border border-gray-100 md:border-transparent rounded-2xl md:rounded-none p-5 md:p-0 shadow-sm md:shadow-none">
                      <td className="flex md:table-cell justify-between items-center md:p-5 border-b border-gray-50 md:border-none pb-4 md:pb-0 mb-4 md:mb-0">
                        <span className="md:hidden text-xs font-bold text-gray-400 uppercase tracking-wider">Name</span>
                        <p className="font-extrabold text-gray-900 text-lg md:text-base">{p.name}</p>
                      </td>
                      <td className="flex md:table-cell justify-between items-center md:p-5 mb-3 md:mb-0">
                        <span className="md:hidden text-xs font-bold text-gray-400 uppercase tracking-wider">Category</span>
                        <span className="inline-block bg-indigo-50 text-indigo-700 text-[10px] md:text-xs px-2.5 py-1 rounded-md font-bold tracking-wide uppercase">
                          {p.category}
                        </span>
                      </td>
                      <td className="flex md:table-cell justify-between items-center md:p-5 font-bold text-blue-700 mb-3 md:mb-0">
                        <span className="md:hidden text-xs font-bold text-gray-400 uppercase tracking-wider">Wholesale</span>
                        <span>₹{p.wholesaleRate || "0"}</span>
                      </td>
                      <td className="flex md:table-cell justify-between items-center md:p-5 font-extrabold text-green-700 mb-3 md:mb-0">
                        <span className="md:hidden text-xs font-bold text-gray-400 uppercase tracking-wider">Retail</span>
                        <span>₹{p.retailRate || "0"}</span>
                      </td>
                      <td className="flex md:table-cell justify-between items-center md:p-5 border-b border-gray-50 md:border-none pb-5 md:pb-0 mb-4 md:mb-0">
                        <span className="md:hidden text-xs font-bold text-gray-400 uppercase tracking-wider">Unit Setup</span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-[10px] md:text-xs font-bold tracking-wider uppercase border border-gray-200 shadow-sm">
                           {p.unit || "Per Unit"}
                        </span>
                      </td>
                      <td className="flex md:table-cell justify-around md:justify-end gap-2 md:p-5 pt-2 md:pt-0">
                        <button 
                          onClick={() => handleEdit(p)} 
                          className="flex-1 md:flex-none text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 md:border-transparent md:bg-transparent px-3 py-2.5 md:py-1.5 rounded-xl md:rounded-lg transition-colors text-sm font-bold inline-flex justify-center items-center"
                        >
                          Edit Item
                        </button>
                        <button 
                          onClick={() => handleDelete(p._id)} 
                          className="flex-1 md:flex-none text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 md:border-transparent md:bg-transparent px-3 py-2.5 md:py-1.5 rounded-xl md:rounded-lg transition-colors text-sm font-bold inline-flex justify-center items-center"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 w-full max-w-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-6 md:p-8 overflow-y-auto w-full">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-extrabold text-gray-800">
                  {editingId ? "Edit Product Data" : "Define New Product"}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-red-500 text-3xl leading-none font-bold transition-colors">
                  &times;
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
                
                {/* Input: Name */}
                <div className="flex flex-col gap-2 mt-auto">
                  <label htmlFor="name" className="text-sm font-semibold text-gray-700 ml-1">Product Name</label>
                  <input
                    id="name" name="name"
                    placeholder="e.g., Artisan Bread"
                    value={form.name} onChange={handleChange}
                    className="p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all w-full"
                    required
                  />
                </div>

                {/* Input: Category Dropdown */}
                <div className="flex flex-col gap-2 mt-auto w-full">
                  <label htmlFor="category" className="text-sm font-semibold text-gray-700 ml-1">Category</label>
                  <select
                    id="category" name="category"
                    value={form.category} onChange={handleChange}
                    className="p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer appearance-none w-full"
                    required
                  >
                    <option value="Bakery">Bakery</option>
                    <option value="Grocery">Grocery</option>
                    <option value="Vegetable">Vegetable</option>
                  </select>
                </div>

                {/* Input: Wholesale Rate */}
                <div className="flex flex-col gap-2 mt-auto w-full">
                  <label htmlFor="wholesaleRate" className="text-sm font-semibold text-gray-700 ml-1">Wholesale Rate (₹)</label>
                  <input
                    id="wholesaleRate" name="wholesaleRate" type="number"
                    placeholder="0.00"
                    value={form.wholesaleRate} onChange={handleChange}
                    className="p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium w-full"
                    required
                  />
                </div>

                {/* Input: Retail Rate */}
                <div className="flex flex-col gap-2 mt-auto w-full">
                  <label htmlFor="retailRate" className="text-sm font-semibold text-gray-700 ml-1">Retail Rate (₹)</label>
                  <input
                    id="retailRate" name="retailRate" type="number"
                    placeholder="0.00"
                    value={form.retailRate} onChange={handleChange}
                    className="p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium w-full"
                    required
                  />
                </div>

                {/* Input: Unit Measurement */}
                <div className="flex flex-col gap-2 md:col-span-2 mt-auto w-full">
                  <label htmlFor="unit" className="text-sm font-semibold text-gray-700 ml-1">Selling Unit Metric</label>
                  <select
                    id="unit" name="unit"
                    value={form.unit} onChange={handleChange}
                    className="p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer appearance-none w-full font-bold text-gray-700"
                    required
                  >
                    <option value="KG">KG (Kilograms)</option>
                    <option value="Gram">Grams</option>
                    <option value="Liter">Liters</option>
                    <option value="Packet">Packet</option>
                    <option value="Piece">Piece</option>
                    <option value="Carton">Carton / Box</option>
                  </select>
                </div>

                {/* Submit Button */}
                <div className="md:col-span-2 mt-4 w-full">
                  <button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-lg py-4 rounded-full transition-colors shadow-md shadow-blue-500/30"
                  >
                    {editingId ? "Save Changes" : "Save New Product"}
                  </button>
                </div>
              </form>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}