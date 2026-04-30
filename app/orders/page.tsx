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
    const categories = ["All", "Stationary", "Grocery", "Veg"];

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

    const exportAsImage = async () => {
        const selectedProductIds = Object.keys(orderMap);
        if (selectedProductIds.length === 0) {
            alert("Please select at least one item to export an order.");
            return;
        }

        const element = document.getElementById("invoice-receipt");
        if (!element) return;

        // Ensure element is visible physically but offscreen
        element.style.position = "fixed";
        element.style.top = "0";
        element.style.left = "0";
        element.style.zIndex = "-100";

        // Crucial: Wait for the browser to repaint and calculate fonts/CSS
        await new Promise((resolve) => setTimeout(resolve, 150));

        // Convert to PNG 
        const dataUrl = await htmlToImage.toPng(element, {
            pixelRatio: 2,
            backgroundColor: "#ffffff",
            cacheBust: true,
        });

        // Safely hide and reset again
        element.style.position = "absolute";
        element.style.top = "-9999px";

        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = `Order_Sheet_${new Date().toISOString().split("T")[0]}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredProducts = products.filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === "All" || p.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const selectedCount = Object.keys(orderMap).length;

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
                        <p className="text-gray-500 mt-2 text-lg">Select items and define quantities to build your order sheet.</p>
                    </div>

                    <button
                        onClick={exportAsImage}
                        className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-lg py-3 px-8 rounded-full transition-colors shadow-md shadow-purple-500/30 flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={selectedCount === 0}
                    >
                        <span className="text-xl">📸</span>
                        Export Image
                    </button>
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
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors ${filterCategory === cat
                                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                                    }`}
                            >
                                {cat === "All" ? "All Categories" : cat}
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
                        <span>Category</span>
                        <span className="text-center">Qty to Order</span>
                    </div>

                    {products.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-gray-400 mb-2 text-5xl">📋</div>
                            <h3 className="text-xl font-semibold text-gray-600">No active stock</h3>
                            <p className="text-gray-400 mt-1">Add items globally in the Inventory tab first.</p>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="text-center py-16">
                            <h3 className="text-xl font-semibold text-gray-600">No products match your filters</h3>
                            <p className="text-gray-400 mt-1">Try clearing your search or changing the category.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {filteredProducts.map((p) => {
                                const isSelected = orderMap[p._id] !== undefined;
                                return (
                                    <div
                                        key={p._id}
                                        onClick={() => handleCheckboxChange(p._id, !isSelected)}
                                        className={`flex items-center gap-3 px-4 py-4 cursor-pointer transition-colors select-none ${isSelected ? "bg-blue-50 border-l-4 border-blue-500" : "hover:bg-gray-50 border-l-4 border-transparent"}`}
                                    >
                                        {/* Checkbox */}
                                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"}`}>
                                            {isSelected && (
                                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>

                                        {/* Name + Category */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-extrabold text-base leading-tight truncate ${isSelected ? "text-blue-900" : "text-gray-900"}`}>{p.name}</p>
                                            <span className="inline-block bg-indigo-50 text-indigo-600 text-[10px] px-2 py-0.5 rounded font-bold tracking-wider uppercase mt-1">
                                                {p.category}
                                            </span>
                                        </div>

                                        {/* Qty Input */}
                                        {isSelected && (
                                            <div className="flex flex-col items-center shrink-0" onClick={(e) => e.stopPropagation()}>
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

            {/* Floating Action Bar summary */}
            {selectedCount > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 px-8 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-50 flex items-center justify-between mx-auto md:w-[600px] md:bottom-6 md:rounded-[2rem] md:border">
                    <p className="font-bold text-lg text-gray-800">
                        <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm mr-3">
                            {selectedCount}
                        </span>
                        Item{selectedCount > 1 ? 's' : ''} Selected
                    </p>
                    <button
                        onClick={exportAsImage}
                        className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white px-6 py-2.5 rounded-full font-bold shadow-md shadow-purple-500/20 transition-colors flex items-center gap-2"
                    >
                        <span>📸</span> Download Image
                    </button>
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
