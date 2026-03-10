"use client";

import { useOrders, useCustomers, useInventory, useTasks } from "@/hooks/use-store";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { STATUS_CONFIG, LOCATIONS, EMPLOYEES, PRIORITY_CONFIG } from "@/lib/constants";
import {
  ClipboardList, Wrench, CheckCircle2, Banknote, ArrowUpRight,
  TrendingUp, AlertTriangle, MapPin, Clock, Apple, User, Eye, ListChecks,
} from "lucide-react";
import Link from "next/link";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { format, subDays, differenceInHours } from "date-fns";
import { pl } from "date-fns/locale";
import { useState } from "react";

const PIE_COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#f59e0b", "#f97316", "#22c55e", "#94a3b8", "#ef4444", "#14b8a6", "#78716c", "#ec4899"];

// Simulate logged-in technician
const CURRENT_USER = EMPLOYEES[1]; // Anna Wiśniewska - serwisant, loc1

export default function DashboardPage() {
  const { items: orders, mounted } = useOrders();
  const { items: customers } = useCustomers();
  const { items: inventory } = useInventory();
  const { items: tasks } = useTasks();
  const [view, setView] = useState<"manager" | "serwisant">("manager");

  if (!mounted) return <DashboardSkeleton />;

  const activeOrders = orders.filter((o) => !["odebrany", "anulowany", "zutylizowany", "odkupiony"].includes(o.status));
  const completedThisMonth = orders.filter((o) => {
    if (!o.completedAt) return false;
    const d = new Date(o.completedAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const revenue = orders.filter((o) => o.finalCost && o.isPaid).reduce((sum, o) => sum + (o.finalCost || 0), 0);
  const totalCommissions = orders.filter((o) => o.commission && o.isPaid).reduce((sum, o) => sum + (o.commission || 0), 0);
  const lowStock = inventory.filter((i) => i.quantity <= i.minQuantity);
  const urgentOrders = activeOrders.filter(o => o.priority === "express_1h" || o.priority === "express_2h" || o.priority === "dzisiaj");
  const overdueOrders = activeOrders.filter(o => differenceInHours(new Date(), new Date(o.createdAt)) > 168);
  const awaitingPickup = orders.filter(o => o.status === "gotowy_do_odbioru");

  // Serwisant view data
  const myOrders = orders.filter(o => o.assignedTo === CURRENT_USER.id && !["odebrany", "anulowany", "zutylizowany", "odkupiony"].includes(o.status));
  const myTasks = tasks.filter(t => t.assignedTo === CURRENT_USER.id && !t.completed);
  const pendingInBranch = activeOrders.filter(o => o.locationId === CURRENT_USER.locationId && o.status === "oczekuje_na_diagnoze");
  const needsAction = activeOrders.filter(o => {
    if (o.status === "gotowy_do_odbioru") return false;
    const lastChange = o.statusHistory[o.statusHistory.length - 1];
    const hoursSinceChange = lastChange ? differenceInHours(new Date(), new Date(lastChange.timestamp)) : 999;
    return o.locationId === CURRENT_USER.locationId && hoursSinceChange > 168;
  });
  const needsContact = activeOrders.filter(o => {
    const lastChange = o.statusHistory[o.statusHistory.length - 1];
    const hoursSinceChange = lastChange ? differenceInHours(new Date(), new Date(lastChange.timestamp)) : 0;
    return o.locationId === CURRENT_USER.locationId && hoursSinceChange > 168 && !["oczekuje_na_diagnoze"].includes(o.status);
  });

  // Stats per location
  const locationStats = LOCATIONS.map(loc => ({
    name: loc.name.replace("AppleHome ", ""),
    aktywne: activeOrders.filter(o => o.locationId === loc.id).length,
    ukonczone: orders.filter(o => o.locationId === loc.id && o.completedAt).length,
    przychod: orders.filter(o => o.locationId === loc.id && o.finalCost).reduce((s, o) => s + (o.finalCost || 0), 0),
  }));

  // Status distribution
  const statusCounts = Object.entries(STATUS_CONFIG)
    .map(([key, config]) => ({ name: config.label, value: orders.filter((o) => o.status === key).length }))
    .filter(d => d.value > 0);

  // Last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(new Date(), 6 - i);
    const dayStr = format(day, "yyyy-MM-dd");
    const count = orders.filter((o) => format(new Date(o.createdAt), "yyyy-MM-dd") === dayStr).length;
    return { day: format(day, "EEE", { locale: pl }), zlecenia: count };
  });

  // Device category distribution
  const deviceStats: Record<string, number> = {};
  orders.forEach(o => { deviceStats[o.deviceCategory] = (deviceStats[o.deviceCategory] || 0) + 1; });
  const deviceData = Object.entries(deviceStats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const stats = [
    { label: "Wszystkie zlecenia", value: orders.length, icon: ClipboardList, color: "from-gray-800 to-gray-900 dark:from-gray-100 dark:to-white", shadow: "shadow-gray-500/20", sub: `${activeOrders.length} aktywnych` },
    { label: "Aktywne naprawy", value: activeOrders.length, icon: Wrench, color: "from-amber-500 to-orange-500", shadow: "shadow-amber-500/20", sub: `${urgentOrders.length} pilnych` },
    { label: "Ukończone (miesiąc)", value: completedThisMonth.length, icon: CheckCircle2, color: "from-green-500 to-emerald-600", shadow: "shadow-green-500/20", sub: `${awaitingPickup.length} czeka na odbiór` },
    { label: "Przychód", value: `${(revenue / 1000).toFixed(1)}k zł`, icon: Banknote, color: "from-blue-500 to-indigo-600", shadow: "shadow-blue-500/20", sub: `${(totalCommissions / 1000).toFixed(1)}k prowizji` },
  ];

  return (
    <div className="page-transition">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pulpit</h1>
          <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, d MMMM yyyy", { locale: pl })}</p>
        </div>
        <div className="flex gap-1 bg-secondary rounded-xl p-1">
          <button onClick={() => setView("manager")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === "manager" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <Eye className="w-3 h-3 inline mr-1" />Manager
          </button>
          <button onClick={() => setView("serwisant")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === "serwisant" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <Wrench className="w-3 h-3 inline mr-1" />Serwisant
          </button>
        </div>
      </div>

      {/* Alerts banner */}
      {(overdueOrders.length > 0 || urgentOrders.length > 0 || needsContact.length > 0) && (
        <div className="flex gap-3 mb-6 flex-wrap">
          {overdueOrders.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/30 text-sm">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="font-medium text-red-700 dark:text-red-400">{overdueOrders.length} napraw po terminie</span>
            </div>
          )}
          {urgentOrders.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/30 text-sm">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="font-medium text-orange-700 dark:text-orange-400">{urgentOrders.length} pilnych zleceń</span>
            </div>
          )}
          {needsContact.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/30 text-sm">
              <User className="w-4 h-4 text-purple-500" />
              <span className="font-medium text-purple-700 dark:text-purple-400">{needsContact.length} wymaga kontaktu</span>
            </div>
          )}
        </div>
      )}

      {view === "serwisant" ? (
        /* ── SERWISANT VIEW ── */
        <div className="space-y-6">
          {/* Serwisant info */}
          <div className="glass-card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-300 dark:to-white flex items-center justify-center text-white dark:text-gray-900 font-bold">
              {CURRENT_USER.avatar}
            </div>
            <div>
              <p className="font-bold">{CURRENT_USER.name}</p>
              <p className="text-xs text-muted-foreground">{LOCATIONS.find(l => l.id === CURRENT_USER.locationId)?.name} · Serwisant · Prowizja {CURRENT_USER.commissionRate * 100}%</p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold">{myOrders.length}</p>
              <p className="text-[10px] text-muted-foreground">Moje naprawy</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{pendingInBranch.length}</p>
              <p className="text-[10px] text-muted-foreground">Oczekujące (oddział)</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-red-600">{needsAction.length}</p>
              <p className="text-[10px] text-muted-foreground">Po terminie (7 dni)</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{myTasks.length}</p>
              <p className="text-[10px] text-muted-foreground">Moje zadania</p>
            </div>
          </div>

          {/* My repairs */}
          <div className="glass-card p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Wrench className="w-4 h-4 text-muted-foreground" />Moje naprawy ({myOrders.length})</h3>
            <div className="divide-y divide-border/50">
              {myOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Brak przypisanych napraw</p>
              ) : myOrders.map(order => (
                <Link key={order.id} href={`/zlecenia/${order.id}`}
                  className="flex items-center justify-between py-2.5 hover:bg-accent/30 transition-colors px-1 rounded-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                      <Apple className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{order.deviceModel}</p>
                      <p className="text-[10px] text-muted-foreground">{order.orderNumber} · {order.customerName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {order.priority !== "standard" && (
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${PRIORITY_CONFIG[order.priority].bg} ${PRIORITY_CONFIG[order.priority].color}`}>
                        {PRIORITY_CONFIG[order.priority].label}
                      </span>
                    )}
                    <StatusBadge status={order.status} size="xs" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Pending in branch */}
          <div className="glass-card p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><ListChecks className="w-4 h-4 text-muted-foreground" />Naprawy oczekujące w oddziale ({pendingInBranch.length})</h3>
            <div className="divide-y divide-border/50">
              {pendingInBranch.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Brak oczekujących napraw</p>
              ) : pendingInBranch.map(order => (
                <Link key={order.id} href={`/zlecenia/${order.id}`}
                  className="flex items-center justify-between py-2.5 hover:bg-accent/30 transition-colors px-1 rounded-lg">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{order.deviceModel} — {order.orderNumber}</p>
                    <p className="text-[10px] text-muted-foreground">{order.issueDescription.slice(0, 50)}...</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{format(new Date(order.createdAt), "d MMM", { locale: pl })}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Needs action */}
          {needsAction.length > 0 && (
            <div className="glass-card p-5 border-l-4 border-l-red-500">
              <h3 className="font-semibold mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" />Wymagające akcji</h3>
              <div className="divide-y divide-border/50">
                {needsAction.map(order => {
                  const hoursOverdue = differenceInHours(new Date(), new Date(order.createdAt));
                  return (
                    <Link key={order.id} href={`/zlecenia/${order.id}`}
                      className="flex items-center justify-between py-2.5 hover:bg-accent/30 transition-colors px-1 rounded-lg">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{order.deviceModel} — {order.orderNumber}</p>
                        <p className="text-[10px] text-muted-foreground">{order.customerName}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <StatusBadge status={order.status} size="xs" />
                        <p className="text-[9px] text-red-500 font-medium mt-0.5">{Math.floor(hoursOverdue / 24)} dni</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* My tasks */}
          {myTasks.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="font-semibold mb-3">Moje zadania</h3>
              <div className="space-y-2">
                {myTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-2 rounded-xl bg-secondary/50 text-sm">
                    <div className="w-5 h-5 rounded border-2 border-border flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium">{task.title}</p>
                      <p className="text-[10px] text-muted-foreground">Termin: {format(new Date(task.dueDate), "d MMM", { locale: pl })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── MANAGER VIEW ── */
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
              <div key={stat.label} className="stat-card">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} ${stat.shadow} shadow-lg flex items-center justify-center`}>
                    <stat.icon className="w-5 h-5 text-white dark:text-gray-900" />
                  </div>
                </div>
                <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold">Nowe zlecenia</h3>
                  <p className="text-xs text-muted-foreground">Ostatnie 7 dni</p>
                </div>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={last7Days} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} />
                  <Bar dataKey="zlecenia" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="glass-card p-6">
              <h3 className="font-semibold mb-1">Urządzenia</h3>
              <p className="text-xs text-muted-foreground mb-4">Podział zleceń</p>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={deviceData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {deviceData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                {deviceData.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {s.name} ({s.value})
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Locations + Recent orders */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold">Lokalizacje</h3>
              </div>
              <div className="space-y-3">
                {locationStats.map((loc) => (
                  <div key={loc.name} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{loc.name}</p>
                      <p className="text-[11px] text-muted-foreground">{loc.aktywne} aktywnych · {loc.ukonczone} ukończonych</p>
                    </div>
                    <span className="text-xs font-semibold">{(loc.przychod / 1000).toFixed(1)}k zł</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Ostatnie zlecenia</h3>
                <Link href="/zlecenia" className="text-xs text-primary font-medium hover:underline">
                  Zobacz wszystkie
                </Link>
              </div>
              <div className="space-y-1">
                {orders.slice(0, 7).map((order) => (
                  <Link key={order.id} href={`/zlecenia/${order.id}`}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                        <Apple className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{order.deviceModel}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {order.orderNumber} · {order.customerName} · {LOCATIONS.find(l => l.id === order.locationId)?.name.replace("AppleHome ", "")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {order.priority !== "standard" && (
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${PRIORITY_CONFIG[order.priority].bg} ${PRIORITY_CONFIG[order.priority].color}`}>
                          {PRIORITY_CONFIG[order.priority].label}
                        </span>
                      )}
                      <StatusBadge status={order.status} size="xs" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-4">
              <p className="text-xs text-muted-foreground mb-1">Niski stan magazynowy</p>
              <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{lowStock.length}</p>
              <p className="text-[11px] text-muted-foreground">części do uzupełnienia</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-xs text-muted-foreground mb-1">Gotowe do odbioru</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{awaitingPickup.length}</p>
              <p className="text-[11px] text-muted-foreground">urządzeń czeka</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-xs text-muted-foreground mb-1">Oczekuje na części</p>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{orders.filter(o => o.status === "oczekuje_na_czesci").length}</p>
              <p className="text-[11px] text-muted-foreground">zleceń wstrzymanych</p>
            </div>
            <div className="glass-card p-4">
              <p className="text-xs text-muted-foreground mb-1">Klienci w bazie</p>
              <p className="text-xl font-bold">{customers.length}</p>
              <p className="text-[11px] text-muted-foreground">{customers.filter(c => c.isB2B).length} B2B</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="h-8 w-48 bg-muted rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 bg-muted rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-72 bg-muted rounded-2xl" />
        <div className="h-72 bg-muted rounded-2xl" />
      </div>
    </div>
  );
}
