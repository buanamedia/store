"use client";

import React, { useEffect, useState } from "react";

interface DashboardStats {
  totalProducts: number;
  totalUsers: number;
  totalOrders: number;
  pendingOrders: number;
  paidOrders: number;
  totalRevenue: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalUsers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    paidOrders: 0,
    totalRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulasi atau fetch data dari /api/admin/stats
    setLoading(false);
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Ringkasan statistik & aktivitas transaksi STORE.</p>
        </div>
      </div>

      {/* Grid Statistik Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase">Total Pendapatan</p>
          <p className="text-xl font-extrabold text-emerald-600 mt-1">
            Rp {stats.totalRevenue.toLocaleString("id-ID")}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase">Total Produk</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalProducts}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase">Total User</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalUsers}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase">Total Order</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalOrders}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase">Order Paid</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.paidOrders}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase">Order Pending</p>
          <p className="text-2xl font-bold text-amber-500 mt-1">{stats.pendingOrders}</p>
        </div>
      </div>

      {/* Tabel Transaksi Terbaru */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-800">Transaksi Terbaru</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50 text-gray-500 uppercase font-semibold border-b">
              <tr>
                <th className="p-3">Order ID</th>
                <th className="p-3">Produk</th>
                <th className="p-3">Nominal</th>
                <th className="p-3">Status</th>
                <th className="p-3">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-6 text-gray-400">
                    Belum ada transaksi masuk.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono font-medium text-gray-900">{order.id}</td>
                    <td className="p-3">{order.productName}</td>
                    <td className="p-3 font-semibold text-gray-800">
                      Rp {Number(order.amount).toLocaleString("id-ID")}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                          order.status === "PAID"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-400">{new Date(order.createdAt).toLocaleString("id-ID")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
