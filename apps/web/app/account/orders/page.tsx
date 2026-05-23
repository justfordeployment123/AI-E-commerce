"use client";

import { useState, useEffect } from "react";
import { Package, Clock, Truck } from "lucide-react";
import { useAuth } from "../../../context/auth-context";
import { ordersApi, type Order } from "../../../lib/api";
import { statusCfg, fmtDate } from "../_utils";

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    ordersApi.myOrders()
      .then(setOrders)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="flex-1 bg-white rounded-[1.5rem] border border-zinc-100 p-6 sm:p-8 shadow-sm">
      <h2 className="text-2xl font-bold mb-8">Your orders</h2>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 border-4 border-zinc-200 border-t-black rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-zinc-400">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-bold text-base">No orders yet</p>
          <a href="/shop/phones" className="mt-4 inline-flex items-center gap-1.5 text-black font-bold underline underline-offset-4">
            Shop now
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const cfg = statusCfg(order.status);
            const StatusIcon = cfg.icon;
            return (
              <div key={order.id} className="rounded-[1.25rem] border border-zinc-100 p-5 sm:p-6 hover:border-zinc-200 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="font-bold">#{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-zinc-400 font-medium mt-0.5">{fmtDate(order.createdAt)}</p>
                  </div>
                  <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest shrink-0 ${cfg.color}`}>
                    <StatusIcon className="h-3 w-3" />
                    {cfg.label}
                  </span>
                </div>
                <div className="space-y-1 mb-4">
                  {order.items.map(item => (
                    <p key={item.id} className="text-sm font-medium text-zinc-600">
                      {item.product.name} — {item.product.condition} × {item.quantity}
                    </p>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                  <span className="font-bold text-base">£{order.total.toFixed(2)}</span>
                  {order.trackingNumber && (
                    <span className="text-xs text-zinc-500 font-medium flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5" /> {order.trackingNumber}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
