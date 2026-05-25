import { Clock, Check, Truck, RefreshCw, Wrench } from "lucide-react";

export const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:      { label: "Pending",      color: "bg-zinc-100 text-zinc-500",       icon: Clock },
  confirmed:    { label: "Confirmed",    color: "bg-blue-100 text-blue-700",        icon: Check },
  processing:   { label: "Processing",   color: "bg-amber-100 text-amber-700",      icon: Clock },
  shipped:      { label: "Shipped",      color: "bg-blue-100 text-blue-700",        icon: Truck },
  delivered:    { label: "Delivered",    color: "bg-emerald-100 text-emerald-700",  icon: Check },
  cancelled:    { label: "Cancelled",    color: "bg-red-100 text-red-700",          icon: Clock },
  refunded:     { label: "Refunded",     color: "bg-zinc-100 text-zinc-500",        icon: RefreshCw },
  submitted:    { label: "Submitted",    color: "bg-zinc-100 text-zinc-500",        icon: Clock },
  under_review: { label: "Under Review", color: "bg-amber-100 text-amber-700",      icon: Clock },
  approved:     { label: "Approved",     color: "bg-emerald-100 text-emerald-700",  icon: Check },
  rejected:     { label: "Rejected",     color: "bg-red-100 text-red-700",          icon: Clock },
  completed:    { label: "Completed",    color: "bg-emerald-100 text-emerald-700",  icon: Check },
  quote_sent:   { label: "Quote Sent",   color: "bg-blue-100 text-blue-700",        icon: Clock },
  in_progress:  { label: "In Progress",  color: "bg-violet-100 text-violet-700",    icon: Wrench },
  cancelled:    { label: "Cancelled",    color: "bg-red-100 text-red-700",           icon: RefreshCw },
};

export function statusCfg(status: string) {
  return STATUS_CONFIG[status.toLowerCase()] ?? { label: status, color: "bg-zinc-100 text-zinc-500", icon: Clock };
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
