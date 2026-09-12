"use client";

import { useEffect, useState } from "react";
import * as htmlToImage from "html-to-image";

interface Product {
    _id: string;
    name: string;
    wholesaleRate: string | number;
    retailRate: string | number;
    category: string;
    unit: string;
}

export default function OrdersPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState("All");
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // State for editing product details (Name, Category, Unit)
    const [editingProductId, setEditingProductId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({
        name: "",
        category: "Stationary",
        unit: "unit",
    });

    const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
    const [newProductForm, setNewProductForm] = useState({
        name: "",
        category: "Stationary",
        unit: "KG",
        retailRate: "",
        wholesaleRate: "",
        orderQuantity: 1,
    });

    // State to hold quantities: Record<productId, quantity>
    const [orderMap, setOrderMap] = useState<Record<string, number | "">>({});

    const fetchProducts = async () => {
        const res = await fetch("/api/products");
        const data = await res.json();
        setProducts(data);
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleCheckboxChange = (productId: string, isChecked: boolean) => {
        setOrderMap((prev) => {
            const newMap = { ...prev };
            if (isChecked) {
                newMap[productId] = 1; // Default to 1 when checked
            } else {
                delete newMap[productId];
            }
            return newMap;
        });
    };

    const handleQuantityChange = (productId: string, value: string) => {
        if (value === "") {
            setOrderMap((prev) => ({ ...prev, [productId]: "" }));
            return;
        }
        const quantity = parseInt(value, 10);
        if (!isNaN(quantity) && quantity >= 1) {
            setOrderMap((prev) => ({
                ...prev,
                [productId]: quantity,
            }));
        }
    };

    const handleIncrement = (productId: string) => {
        setOrderMap((prev) => {
            const current = prev[productId];
            const val = typeof current === "number" ? current : 0;
            return { ...prev, [productId]: val + 1 };
        });
    };

    const handleDecrement = (productId: string) => {
        setOrderMap((prev) => {
            const current = prev[productId];
            const val = typeof current === "number" ? current : 1;
            if (val > 1) {
                return { ...prev, [productId]: val - 1 };
            }
            return prev;
        });
    };

    const handleRemoveItem = (productId: string) => {
        setOrderMap((prev) => {
            const newMap = { ...prev };
            delete newMap[productId];
            return newMap;
        });
    };

    const handleClearAll = () => {
        if (confirm("Are you sure you want to clear all selected items?")) {
            setOrderMap({});
            setIsEditModalOpen(false);
            if (filterCategory === "Selected") {
                setFilterCategory("All");
            }
        }
    };

    // Product info editing actions
    const handleStartEditProduct = (p: Product) => {
        setEditingProductId(p._id);
        setEditForm({
            name: p.name,
            category: p.category || "Stationary",
            unit: p.unit || "unit",
        });
    };

    const handleSaveProductInfo = async (productId: string) => {
        if (!editForm.name.trim()) {
            alert("Product name cannot be empty.");
            return;
        }
        const product = products.find((p) => p._id === productId);
        if (!product) return;

        const updated = {
            ...product,
            name: editForm.name.trim(),
            category: editForm.category.trim(),
            unit: editForm.unit.trim(),
        };

        try {
            const res = await fetch(`/api/products/${productId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updated),
            });

            if (res.ok) {
                setProducts((prev) =>
                    prev.map((p) => (p._id === productId ? updated : p))
                );
                setEditingProductId(null);
            } else {
                alert("Failed to update product details.");
            }
        } catch (error) {
            console.error("Error updating product:", error);
            alert("Error updating product details.");
        }
    };

    // Create new product in inventory & select for active order
    const handleCreateAndSelectProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProductForm.name.trim()) {
            alert("Product name is required.");
            return;
        }

        try {
            const res = await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newProductForm.name.trim(),
                    category: newProductForm.category.trim(),
                    unit: newProductForm.unit.trim() || "unit",
                    retailRate: newProductForm.retailRate,
                    wholesaleRate: newProductForm.wholesaleRate,
                }),
            });

            const data = await res.json();
            if (res.ok && data.insertedId) {
                // Refetch products list to include new item
                const fetchRes = await fetch("/api/products");
                const updatedProducts = await fetchRes.json();
                setProducts(updatedProducts);

                // Auto select newly created product
                const newId = String(data.insertedId);
                const initialQty = Math.max(1, Number(newProductForm.orderQuantity) || 1);
                setOrderMap((prev) => ({
                    ...prev,
                    [newId]: initialQty,
                }));

                // Reset & close modal
                setNewProductForm({
                    name: "",
                    category: "Stationary",
                    unit: "KG",
                    retailRate: "",
                    wholesaleRate: "",
                    orderQuantity: 1,
                });
                setIsAddProductModalOpen(false);
            } else {
                alert("Failed to save product to inventory.");
            }
        } catch (error) {
            console.error("Error creating product:", error);
            alert("An error occurred while saving product.");
        }
    };

    const exportAsImage = async () => {
        const selectedProductIds = Object.keys(orderMap);
        if (selectedProductIds.length === 0) {
            alert("Please select at least one item to export an order.");
            return;
        }

        const element = document.getElementById("invoice-receipt");
        if (!element) return;

        element.style.position = "fixed";
        element.style.top = "0";
        element.style.left = "0";
        element.style.zIndex = "-100";

        await new Promise((resolve) => setTimeout(resolve, 150));

        const dataUrl = await htmlToImage.toPng(element, {
            pixelRatio: 2,
            backgroundColor: "#ffffff",
            cacheBust: true,
        });

        element.style.position = "absolute";
        element.style.top = "-9999px";

        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `Order_Sheet_${new Date().toISOString().split("T")[0]}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const selectedCount = Object.keys(orderMap).length;

    const filteredProducts = products.filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        if (filterCategory === "Selected") {
            return matchesSearch && orderMap[p._id] !== undefined;
        }
        const matchesCategory = filterCategory === "All" || p.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const uniqueCategories = Array.from(new Set(products.map((p) => p.category || "Stationary")));
    const baseCategories = Array.from(new Set(["Stationary", "Grocery", "Veg", ...uniqueCategories]));

    const categoryList = [
        "All",
        ...(selectedCount > 0 ? ["Selected"] : []),
        ...baseCategories
    ];

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-32 relative">
            <style dangerouslySetInnerHTML={{__html: `
                input[type=number]::-webkit-inner-spin-button, 
                input[type=number]::-webkit-outer-spin-button { 
                    -webkit-appearance: none; 
                    margin: 0; 
                }
            `}} />
            <div className="max-w-7xl mx-auto p-4 md:p-8">

                {/* Header & Main Controls */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pt-20 md:pt-10">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900">
                            Order Creator
                        </h1>
                        <p className="text-gray-500 mt-2 text-lg">Select items, edit details, or add new items to build your order sheet.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <button
                            onClick={() => setIsAddProductModalOpen(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-lg py-3 px-6 rounded-full transition-colors shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 shrink-0"
                        >
                            <span>➕</span>
                            Add New Item
                        </button>
                        {selectedCount > 0 && (
                            <button
                                onClick={() => setIsEditModalOpen(true)}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-lg py-3 px-6 rounded-full transition-colors flex items-center justify-center gap-2 shadow-sm"
                            >
                                <span>✏️</span>
                                Edit Selected ({selectedCount})
                            </button>
                        )}
                        <button
                            onClick={exportAsImage}
                            className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-lg py-3 px-8 rounded-full transition-colors shadow-md shadow-purple-500/30 flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={selectedCount === 0}
                        >
                            <span className="text-xl">📸</span>
                            Export Image
                        </button>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col gap-3">
                    <div className="relative w-full">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                        <input
                            type="text"
                            placeholder="Search products by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 p-3 pl-10 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex flex-wrap gap-2">
                        {categoryList.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors ${filterCategory === cat
                                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                                    }`}
                            >
                                {cat === "All"
                                    ? "All Categories"
                                    : cat === "Selected"
                                    ? `Selected (${selectedCount})`
                                    : cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product List */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Column Headers */}
                    <div className="hidden md:grid grid-cols-[auto_1fr_auto_180px] gap-4 items-center px-5 py-3 bg-gray-50 border-b border-gray-100 text-gray-400 text-xs font-bold uppercase tracking-widest">
                        <span className="w-6"></span>
                        <span>Product</span>
                        <span>Category & Actions</span>
                        <span className="text-center">Qty to Order</span>
                    </div>

                    {products.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-gray-400 mb-2 text-5xl">📋</div>
                            <h3 className="text-xl font-semibold text-gray-600">No active stock</h3>
                            <p className="text-gray-400 mt-1">Add items globally in the Inventory tab or click Add New Item above.</p>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="text-center py-16">
                            <h3 className="text-xl font-semibold text-gray-600">No products match your filters</h3>
                            <p className="text-gray-400 mt-1">Try clearing your search or changing the category filter.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {filteredProducts.map((p) => {
                                const isSelected = orderMap[p._id] !== undefined;
                                const isEditingThis = editingProductId === p._id;

                                return (
                                    <div
                                        key={p._id}
                                        onClick={() => !isEditingThis && handleCheckboxChange(p._id, !isSelected)}
                                        className={`flex flex-col md:flex-row md:items-center gap-3 px-4 py-4 cursor-pointer transition-colors select-none ${isSelected ? "bg-blue-50/70 border-l-4 border-blue-500" : "hover:bg-gray-50 border-l-4 border-transparent"}`}
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            {/* Checkbox */}
                                            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"}`}>
                                                {isSelected && (
                                                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>

                                            {/* Product Info / Edit Mode */}
                                            {isEditingThis ? (
                                                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 flex-1 w-full" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="text"
                                                        value={editForm.name}
                                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                        placeholder="Product Name"
                                                        className="bg-white border border-gray-300 p-2 rounded-xl text-base font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none flex-1"
                                                    />
                                                    <select
                                                        value={editForm.category}
                                                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                                        className="bg-white border border-gray-300 p-2 rounded-xl text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                                    >
                                                        {baseCategories.map((c) => (
                                                            <option key={c} value={c}>{c}</option>
                                                        ))}
                                                    </select>
                                                    <input
                                                        type="text"
                                                        value={editForm.unit}
                                                        onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                                                        placeholder="Unit (e.g. KG, PCS)"
                                                        className="bg-white border border-gray-300 p-2 rounded-xl text-sm font-semibold text-gray-700 w-28 focus:ring-2 focus:ring-blue-500 outline-none"
                                                    />
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <button
                                                            onClick={() => handleSaveProductInfo(p._id)}
                                                            className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1.5 rounded-xl text-sm transition-colors shadow-sm"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingProductId(null)}
                                                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-3 py-1.5 rounded-xl text-sm transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                                                    <div>
                                                        <p className={`font-extrabold text-base leading-tight truncate ${isSelected ? "text-blue-900" : "text-gray-900"}`}>{p.name}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="inline-block bg-indigo-50 text-indigo-600 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider uppercase">
                                                                {p.category}
                                                            </span>
                                                            <span className="text-xs text-gray-400 font-medium">({p.unit || "unit"})</span>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStartEditProduct(p);
                                                        }}
                                                        title="Edit Product Info (Name, Category, Unit)"
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                                                    >
                                                        <span>✏️</span>
                                                        <span className="hidden sm:inline">Edit Info</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Qty Input */}
                                        {isSelected && !isEditingThis && (
                                            <div className="flex flex-col items-center shrink-0 self-end md:self-center" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center w-36 shadow-sm rounded-xl">
                                                    <button 
                                                        onClick={() => handleDecrement(p._id)} 
                                                        className="w-11 h-12 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-l-xl text-gray-600 font-bold text-2xl flex items-center justify-center border-y-2 border-l-2 border-blue-400 transition-colors"
                                                    >
                                                        −
                                                    </button>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={orderMap[p._id] === "" ? "" : orderMap[p._id]}
                                                        onChange={(e) => handleQuantityChange(p._id, e.target.value)}
                                                        className="w-full h-12 text-center border-y-2 border-x-0 border-blue-400 outline-none font-black text-blue-700 bg-white focus:bg-blue-50 text-xl m-0 p-0"
                                                        style={{ MozAppearance: 'textfield' }}
                                                    />
                                                    <button 
                                                        onClick={() => handleIncrement(p._id)} 
                                                        className="w-11 h-12 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 rounded-r-xl text-blue-700 font-bold text-2xl flex items-center justify-center border-y-2 border-r-2 border-blue-400 transition-colors"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                                <span className="text-[11px] font-black text-blue-500 uppercase tracking-widest leading-none mt-2">
                                                    {p.unit || "unit"}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal for Adding New Product */}
            {isAddProductModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
                        {/* Header */}
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
                            <div>
                                <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                                    <span>➕</span> Add New Product
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">Saves item to Inventory and adds it to your active order</p>
                            </div>
                            <button
                                onClick={() => setIsAddProductModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 font-bold transition-colors text-sm"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleCreateAndSelectProduct} className="p-5 flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Product Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Organic Honey / Notebook"
                                    value={newProductForm.name}
                                    onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-base font-semibold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Category</label>
                                    <select
                                        value={newProductForm.category}
                                        onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-gray-700"
                                    >
                                        {baseCategories.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Unit</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. KG, PCS, Box"
                                        value={newProductForm.unit}
                                        onChange={(e) => setNewProductForm({ ...newProductForm, unit: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Retail Rate (₹)</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={newProductForm.retailRate}
                                        onChange={(e) => setNewProductForm({ ...newProductForm, retailRate: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Wholesale Rate</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={newProductForm.wholesaleRate}
                                        onChange={(e) => setNewProductForm({ ...newProductForm, wholesaleRate: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-blue-600 uppercase mb-1">Order Qty</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={newProductForm.orderQuantity}
                                        onChange={(e) => setNewProductForm({ ...newProductForm, orderQuantity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                                        className="w-full bg-blue-50 border border-blue-300 p-3 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-blue-700"
                                    />
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAddProductModalOpen(false)}
                                    className="px-5 py-2.5 rounded-full border border-gray-300 font-bold text-gray-700 hover:bg-gray-100 transition-colors text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-full transition-colors shadow-md text-sm flex items-center gap-2"
                                >
                                    <span>💾</span> Save & Add to Order
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Floating Action Bar summary */}
            {selectedCount > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 px-6 md:px-8 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-40 flex items-center justify-between mx-auto md:w-[650px] md:bottom-6 md:rounded-[2rem] md:border">
                    <p className="font-bold text-lg text-gray-800 flex items-center">
                        <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm mr-3">
                            {selectedCount}
                        </span>
                        Item{selectedCount > 1 ? 's' : ''} Selected
                    </p>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-700 border border-blue-200 px-4 py-2.5 rounded-full font-bold transition-colors flex items-center gap-1.5 text-sm md:text-base"
                        >
                            <span>✏️</span> Edit Selected Items
                        </button>
                        <button
                            onClick={exportAsImage}
                            className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white px-5 md:px-6 py-2.5 rounded-full font-bold shadow-md shadow-purple-500/20 transition-colors flex items-center gap-2 text-sm md:text-base"
                        >
                            <span>📸</span> Download Image
                        </button>
                    </div>
                </div>
            )}

            {/* Modal for Editing Selected Items */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                        {/* Modal Header */}
                        <div className="p-5 md:p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
                            <div>
                                <h2 className="text-xl md:text-2xl font-extrabold text-gray-900">Selected Items ({selectedCount})</h2>
                                <p className="text-xs md:text-sm text-gray-500 mt-0.5">Edit product details (Name, Category, Unit) or adjust quantities</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {selectedCount > 0 && (
                                    <button
                                        onClick={handleClearAll}
                                        className="text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-red-200"
                                    >
                                        Clear All
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        setIsEditModalOpen(false);
                                        setEditingProductId(null);
                                    }}
                                    className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 font-bold transition-colors text-sm"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Modal Body / Items List */}
                        <div className="p-4 md:p-6 overflow-y-auto flex-1 divide-y divide-gray-100">
                            {selectedCount === 0 ? (
                                <div className="text-center py-12">
                                    <div className="text-4xl mb-3">🛒</div>
                                    <p className="text-gray-500 font-medium">No items selected yet.</p>
                                    <p className="text-xs text-gray-400 mt-1">Select items from the catalog to add them to your order.</p>
                                </div>
                            ) : (
                                Object.keys(orderMap).map((productId) => {
                                    const product = products.find((p) => p._id === productId);
                                    if (!product) return null;
                                    const qty = orderMap[productId];
                                    const isEditingThis = editingProductId === productId;

                                    return (
                                        <div key={productId} className="py-3.5 first:pt-0 last:pb-0 flex flex-col gap-3">
                                            {isEditingThis ? (
                                                <div className="bg-blue-50/60 p-3 rounded-2xl border border-blue-200 flex flex-col gap-2">
                                                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Edit Product Details</p>
                                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={editForm.name}
                                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                            placeholder="Product Name"
                                                            className="bg-white border border-gray-300 p-2 rounded-xl text-base font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none flex-1"
                                                        />
                                                        <select
                                                            value={editForm.category}
                                                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                                            className="bg-white border border-gray-300 p-2 rounded-xl text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                                        >
                                                            {baseCategories.map((c) => (
                                                                <option key={c} value={c}>{c}</option>
                                                            ))}
                                                        </select>
                                                        <input
                                                            type="text"
                                                            value={editForm.unit}
                                                            onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                                                            placeholder="Unit (e.g. KG, PCS)"
                                                            className="bg-white border border-gray-300 p-2 rounded-xl text-sm font-semibold text-gray-700 w-28 focus:ring-2 focus:ring-blue-500 outline-none"
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-end gap-2 mt-1">
                                                        <button
                                                            onClick={() => handleSaveProductInfo(productId)}
                                                            className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-1.5 rounded-xl text-sm transition-colors shadow-sm"
                                                        >
                                                            Save Details
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingProductId(null)}
                                                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-3 py-1.5 rounded-xl text-sm transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-extrabold text-gray-900 text-base leading-tight truncate">{product.name}</h4>
                                                            <button
                                                                onClick={() => handleStartEditProduct(product)}
                                                                title="Edit Product Details (Name, Category, Unit)"
                                                                className="text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline flex items-center gap-0.5 shrink-0"
                                                            >
                                                                <span>✏️</span> Edit
                                                            </button>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="inline-block bg-indigo-50 text-indigo-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                                                                {product.category}
                                                            </span>
                                                            <span className="text-xs font-medium text-gray-400">({product.unit || "unit"})</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 md:gap-3 shrink-0">
                                                        <div className="flex items-center w-32 shadow-sm rounded-xl">
                                                            <button
                                                                onClick={() => handleDecrement(productId)}
                                                                className="w-9 h-10 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-l-xl text-gray-700 font-bold text-xl flex items-center justify-center border-y border-l border-gray-300 transition-colors"
                                                            >
                                                                −
                                                            </button>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={qty === "" ? "" : qty}
                                                                onChange={(e) => handleQuantityChange(productId, e.target.value)}
                                                                className="w-full h-10 text-center border-y border-x-0 border-gray-300 outline-none font-black text-blue-700 bg-white focus:bg-blue-50 text-lg m-0 p-0"
                                                                style={{ MozAppearance: 'textfield' }}
                                                            />
                                                            <button
                                                                onClick={() => handleIncrement(productId)}
                                                                className="w-9 h-10 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 rounded-r-xl text-blue-700 font-bold text-xl flex items-center justify-center border-y border-r border-blue-300 transition-colors"
                                                            >
                                                                +
                                                            </button>
                                                        </div>

                                                        <button
                                                            onClick={() => handleRemoveItem(productId)}
                                                            title="Remove item from order"
                                                            className="w-9 h-10 flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 px-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-4">
                            <button
                                onClick={() => {
                                    setIsEditModalOpen(false);
                                    setEditingProductId(null);
                                }}
                                className="px-5 py-2 rounded-full border border-gray-300 font-bold text-gray-700 hover:bg-gray-100 transition-colors text-sm md:text-base"
                            >
                                Done Editing
                            </button>
                            <button
                                onClick={() => {
                                    setIsEditModalOpen(false);
                                    setEditingProductId(null);
                                    exportAsImage();
                                }}
                                disabled={selectedCount === 0}
                                className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold px-5 py-2 rounded-full transition-colors shadow-md flex items-center gap-2 disabled:opacity-50 text-sm md:text-base"
                            >
                                <span>📸</span> Export Image
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden Invoice Receipt for html-to-image generation */}
            <div id="invoice-receipt-wrapper" style={{ position: "absolute", top: "-9999px", left: "-9999px" }}>
                <div id="invoice-receipt" className="w-[800px] bg-white p-10 font-sans text-black shadow-none border-none outline-none">
                    <div className="flex justify-between items-center border-b-2 border-gray-200 pb-6 mb-8">
                        <div>
                            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Order Request</h1>
                            <p className="text-gray-500 mt-1 font-medium">Generated by <span className="font-black text-purple-700 tracking-tight">MY SHOP</span></p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-gray-800">Date: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>
                            <p className="text-sm text-gray-500 mt-1">Total Items: {selectedCount}</p>
                        </div>
                    </div>

                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 text-gray-700 uppercase text-xs font-bold tracking-wider">
                                <th className="py-4 px-6 rounded-tl-xl">Product Name</th>
                                <th className="py-4 px-6 text-center rounded-tr-xl">Quantity Ordered</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {Object.keys(orderMap).map((id) => {
                                const product = products.find((p) => p._id === id);
                                if (!product) return null;

                                return (
                                    <tr key={id} className="border-b border-gray-50">
                                        <td className="py-5 px-6">
                                            <p className="font-bold text-gray-900 text-xl">{product.name}</p>
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="bg-purple-50 text-purple-800 text-2xl font-black py-2.5 px-4 rounded-xl text-center w-full max-w-[180px] mx-auto border border-purple-200 shadow-sm whitespace-nowrap flex items-center justify-center gap-2">
                                                <span>{orderMap[id] === "" ? 1 : orderMap[id]}</span>
                                                <span className="text-sm font-bold text-purple-600/80 uppercase">{product.unit || "Units"}</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm font-semibold text-gray-400">
                        * This document represents an active order request. Prices are subject to confirmation.
                    </div>
                </div>
            </div>

        </div>
    );
}


