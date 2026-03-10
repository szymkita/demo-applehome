"use client";

import { useOrders } from "@/hooks/use-store";
import { PageHeader } from "@/components/shared/page-header";
import { STATUS_CONFIG, LOCATIONS, EMPLOYEES, REPAIR_TYPES } from "@/lib/constants";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer,
} from "recharts";
import { format, subMonths, subWeeks, startOfMonth, endOfMonth, startOfDay, endOfDay, isWithinInterval, differenceInHours } from "date-fns";
import { pl } from "date-fns/locale";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, TrendingDown, Banknote, Users, Wrench, Clock, AlertTriangle, CreditCard, Award } from "lucide-react";

const COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#f59e0b", "#f97316", "#22c55e", "#94a3b8", "#ef4444", "#ec4899", "#14b8a6"];
const tooltipStyle = { borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 };

type DateRange = "tydzien" | "miesiac" | "kwartal" | "pol_roku" | "rok" | "custom";
type ReportTab = "finanse" | "prowizje" | "operacyjne" | "lokalizacje";

export default function ReportsPage() {
  const { items: orders, mounted } = useOrders();
  const [locationFilter, setLocationFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange>("pol_roku");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [tab, setTab] = useState<ReportTab>("finanse");

  if (!mounted) return <div className="animate-pulse space-y-6"><div className="h-8 w-48 bg-muted rounded-lg" /><div className="grid grid-cols-2 gap-6">{[1,2,3,4].map(i => <div key={i} className="h-72 bg-muted rounded-2xl" />)}</div></div>;

  // Date range computation
  const now = new Date();
  let rangeStart: Date;
  let rangeEnd: Date = endOfDay(now);
  switch (dateRange) {
    case "tydzien": rangeStart = startOfDay(subWeeks(now, 1)); break;
    case "miesiac": rangeStart = startOfDay(subMonths(now, 1)); break;
    case "kwartal": rangeStart = startOfDay(subMonths(now, 3)); break;
    case "pol_roku": rangeStart = startOfDay(subMonths(now, 6)); break;
    case "rok": rangeStart = startOfDay(subMonths(now, 12)); break;
    case "custom":
      rangeStart = customFrom ? startOfDay(new Date(customFrom)) : startOfDay(subMonths(now, 6));
      rangeEnd = customTo ? endOfDay(new Date(customTo)) : endOfDay(now);
      break;
    default: rangeStart = startOfDay(subMonths(now, 6));
  }

  const dateFiltered = orders.filter(o => {
    const d = new Date(o.createdAt);
    return d >= rangeStart && d <= rangeEnd;
  });
  const filteredOrders = locationFilter === "all" ? dateFiltered : dateFiltered.filter(o => o.locationId === locationFilter);
  const paidOrders = filteredOrders.filter(o => o.isPaid);
  const unpaidWithCost = filteredOrders.filter(o => !o.isPaid && o.finalCost);

  // ═══ FINANCIAL KPIs ═══
  const totalRevenue = paidOrders.reduce((s, o) => s + (o.finalCost || 0), 0);
  const totalPartsCost = paidOrders.reduce((s, o) => s + (o.partsCost || 0), 0);
  const totalCommission = paidOrders.reduce((s, o) => s + (o.commission || 0), 0);
  const grossProfit = totalRevenue - totalPartsCost;
  const netProfit = grossProfit - totalCommission;
  const grossMargin = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0;
  const netMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;
  const avgOrderValue = paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0;
  const unpaidAmount = unpaidWithCost.reduce((s, o) => s + (o.finalCost || 0), 0);
  const commissionRatio = totalRevenue > 0 ? Math.round((totalCommission / totalRevenue) * 100) : 0;
  const partsRatio = totalRevenue > 0 ? Math.round((totalPartsCost / totalRevenue) * 100) : 0;

  // ═══ MONTHLY TREND ═══
  const monthCount = dateRange === "tydzien" ? 1 : dateRange === "miesiac" ? 1 : dateRange === "kwartal" ? 3 : dateRange === "rok" ? 12 : 6;
  const revenueByMonth = Array.from({ length: Math.max(monthCount, 1) }, (_, i) => {
    const month = subMonths(now, Math.max(monthCount, 1) - 1 - i);
    const start = startOfMonth(month); const end = endOfMonth(month);
    const mo = filteredOrders.filter(o => o.isPaid && o.finalCost && isWithinInterval(new Date(o.createdAt), { start, end }));
    const revenue = mo.reduce((s, o) => s + (o.finalCost || 0), 0);
    const parts = mo.reduce((s, o) => s + (o.partsCost || 0), 0);
    const commission = mo.reduce((s, o) => s + (o.commission || 0), 0);
    return {
      month: format(month, "LLL", { locale: pl }),
      przychód: revenue, części: parts, prowizje: commission,
      zysk_brutto: revenue - parts, zysk_netto: revenue - parts - commission,
    };
  });

  // ═══ PAYMENT METHODS ═══
  const paymentMethods: Record<string, { count: number; amount: number }> = {};
  paidOrders.forEach(o => {
    const method = o.paymentMethod || "inne";
    if (!paymentMethods[method]) paymentMethods[method] = { count: 0, amount: 0 };
    paymentMethods[method].count++;
    paymentMethods[method].amount += o.finalCost || 0;
  });
  const methodLabels: Record<string, string> = { karta: "Karta", gotowka: "Gotówka", przelew: "Przelew", link_platnosci: "Online", inne: "Inne" };
  const paymentData = Object.entries(paymentMethods).map(([key, val]) => ({
    name: methodLabels[key] || key, value: val.amount, count: val.count,
  })).sort((a, b) => b.value - a.value);

  // ═══ COMMISSION PER EMPLOYEE ═══
  const commissionByEmployee = EMPLOYEES
    .filter(e => e.role === "serwisant" || e.role === "manager")
    .map(emp => {
      const empPaid = paidOrders.filter(o => o.assignedTo === emp.id);
      const empAll = filteredOrders.filter(o => o.assignedTo === emp.id);
      const completed = empAll.filter(o => ["gotowy_do_odbioru", "odebrany"].includes(o.status));
      const revenue = empPaid.reduce((s, o) => s + (o.finalCost || 0), 0);
      const commission = empPaid.reduce((s, o) => s + (o.commission || 0), 0);
      const avgRepairTime = completed.length > 0
        ? completed.reduce((s, o) => {
            if (!o.completedAt) return s;
            return s + differenceInHours(new Date(o.completedAt), new Date(o.createdAt));
          }, 0) / completed.length
        : 0;
      const loc = LOCATIONS.find(l => l.id === emp.locationId);
      return {
        id: emp.id, name: emp.name, avatar: emp.avatar, rate: emp.commissionRate,
        locationName: loc?.name.replace("AppleHome ", "") || "",
        total: empAll.length, completed: completed.length,
        revenue, commission, avgRepairTime: Math.round(avgRepairTime),
        efficiency: empAll.length > 0 ? Math.round((completed.length / empAll.length) * 100) : 0,
      };
    })
    .filter(e => e.total > 0)
    .sort((a, b) => b.commission - a.commission);

  const commissionChartData = commissionByEmployee.map(e => ({
    name: e.name.split(" ")[0],
    prowizja: e.commission,
    przychód: Math.round(e.revenue / 1000),
    zlecenia: e.completed,
  }));

  // ═══ OPERATIONAL ═══
  const catCounts: Record<string, number> = {};
  filteredOrders.forEach(o => { catCounts[o.deviceCategory] = (catCounts[o.deviceCategory] || 0) + 1; });
  const byCategory = Object.entries(catCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const typeCounts: Record<string, number> = {};
  filteredOrders.forEach(o => { typeCounts[o.repairType] = (typeCounts[o.repairType] || 0) + 1; });
  const byType = Object.entries(typeCounts).map(([key, value]) => ({ name: REPAIR_TYPES[key as keyof typeof REPAIR_TYPES] || key, value })).sort((a, b) => b.value - a.value);

  const completionRate = Math.round((filteredOrders.filter(o => ["gotowy_do_odbioru", "odebrany"].includes(o.status)).length / (filteredOrders.length || 1)) * 100);
  const cancellationRate = Math.round((filteredOrders.filter(o => o.status === "anulowany").length / (filteredOrders.length || 1)) * 100);

  const diagnosisOrders = filteredOrders.filter(o => o.statusHistory.find(h => h.status === "oczekuje_na_akceptacje"));
  const avgDiagnosisHours = diagnosisOrders.length > 0
    ? diagnosisOrders.reduce((sum, o) => {
        const diagEntry = o.statusHistory.find(h => h.status === "oczekuje_na_akceptacje");
        return sum + (diagEntry ? differenceInHours(new Date(diagEntry.timestamp), new Date(o.createdAt)) : 0);
      }, 0) / diagnosisOrders.length : 0;

  const completedOrders = filteredOrders.filter(o => o.completedAt);
  const avgRepairHours = completedOrders.length > 0
    ? completedOrders.reduce((s, o) => s + differenceInHours(new Date(o.completedAt!), new Date(o.createdAt)), 0) / completedOrders.length : 0;

  // ═══ LOCATION ═══
  const locData = LOCATIONS.map(loc => {
    const lo = filteredOrders.filter(o => o.locationId === loc.id);
    const loPaid = lo.filter(o => o.isPaid);
    const revenue = loPaid.reduce((s, o) => s + (o.finalCost || 0), 0);
    const parts = loPaid.reduce((s, o) => s + (o.partsCost || 0), 0);
    const commission = loPaid.reduce((s, o) => s + (o.commission || 0), 0);
    return {
      name: loc.name.replace("AppleHome ", ""),
      zlecenia: lo.length,
      przychod: revenue,
      koszty_czesci: parts,
      prowizje: commission,
      zysk_netto: revenue - parts - commission,
      margin: revenue > 0 ? Math.round(((revenue - parts - commission) / revenue) * 100) : 0,
    };
  });

  return (
    <div className="page-transition">
      <PageHeader title="Raporty i analityka" description="Pełna analiza finansowa i operacyjna serwisu" />

      {/* Date range + location filters */}
      <div className="flex flex-wrap gap-2 mb-3">
        {([
          { value: "tydzien", label: "Tydzień" }, { value: "miesiac", label: "Miesiąc" },
          { value: "kwartal", label: "Kwartał" }, { value: "pol_roku", label: "6 mies." },
          { value: "rok", label: "Rok" }, { value: "custom", label: "Zakres dat" },
        ] as { value: DateRange; label: string }[]).map(r => (
          <button key={r.value} onClick={() => setDateRange(r.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${dateRange === r.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}>
            {r.label}
          </button>
        ))}
      </div>
      {dateRange === "custom" && (
        <div className="flex gap-3 mb-3 items-end">
          <div><Label className="text-xs text-muted-foreground">Od</Label><Input type="date" className="rounded-xl mt-1 w-40" value={customFrom} onChange={e => setCustomFrom(e.target.value)} /></div>
          <div><Label className="text-xs text-muted-foreground">Do</Label><Input type="date" className="rounded-xl mt-1 w-40" value={customTo} onChange={e => setCustomTo(e.target.value)} /></div>
        </div>
      )}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        <button onClick={() => setLocationFilter("all")} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${locationFilter === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}>Wszystkie</button>
        {LOCATIONS.map(l => (
          <button key={l.id} onClick={() => setLocationFilter(l.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${locationFilter === l.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}>
            {l.name.replace("AppleHome ", "")}
          </button>
        ))}
      </div>

      {/* Report tabs */}
      <div className="flex gap-1 mb-6 bg-secondary rounded-xl p-1 w-fit">
        {([
          { value: "finanse" as ReportTab, label: "Finanse", icon: Banknote },
          { value: "prowizje" as ReportTab, label: "Prowizje", icon: Users },
          { value: "operacyjne" as ReportTab, label: "Operacyjne", icon: Wrench },
          { value: "lokalizacje" as ReportTab, label: "Lokalizacje", icon: TrendingUp },
        ]).map(t => (
          <button key={t.value} onClick={() => setTab(t.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === t.value ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <t.icon className="w-3 h-3" />{t.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════
          TAB: FINANSE
         ═══════════════════════════════════════════════ */}
      {tab === "finanse" && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
            <KpiCard label="Przychód" value={`${(totalRevenue / 1000).toFixed(1)}k`} sub="zł" />
            <KpiCard label="Koszty części" value={`${(totalPartsCost / 1000).toFixed(1)}k`} sub={`${partsRatio}% przychodu`} color="text-red-500" />
            <KpiCard label="Zysk brutto" value={`${(grossProfit / 1000).toFixed(1)}k`} sub={`Marża ${grossMargin}%`} color="text-green-600" />
            <KpiCard label="Prowizje" value={`${(totalCommission / 1000).toFixed(1)}k`} sub={`${commissionRatio}% przychodu`} color="text-indigo-600" />
            <KpiCard label="Zysk netto" value={`${(netProfit / 1000).toFixed(1)}k`} sub={`Marża ${netMargin}%`} color={netProfit >= 0 ? "text-green-600" : "text-red-500"} />
            <KpiCard label="Śr. zlecenie" value={`${avgOrderValue}`} sub="zł" />
            <KpiCard label="Opłacone" value={`${paidOrders.length}`} sub={`z ${filteredOrders.filter(o => o.finalCost).length}`} />
            <KpiCard label="Nieopłacone" value={`${(unpaidAmount / 1000).toFixed(1)}k`} sub={`${unpaidWithCost.length} zleceń`} color={unpaidAmount > 0 ? "text-amber-600" : undefined} />
          </div>

          {/* Waterfall: Revenue → Parts → Commission → Net Profit */}
          <div className="glass-card p-6 mb-6">
            <h3 className="font-semibold mb-1">Struktura przychodów</h3>
            <p className="text-xs text-muted-foreground mb-4">Przychód → Koszty → Prowizje → Zysk netto</p>
            <div className="flex items-end gap-1 h-32">
              {[
                { label: "Przychód", value: totalRevenue, color: "bg-blue-500" },
                { label: "Koszty części", value: -totalPartsCost, color: "bg-red-400" },
                { label: "Prowizje", value: -totalCommission, color: "bg-indigo-400" },
                { label: "Zysk netto", value: netProfit, color: netProfit >= 0 ? "bg-green-500" : "bg-red-500" },
              ].map(bar => {
                const maxVal = totalRevenue || 1;
                const height = Math.max(Math.abs(bar.value) / maxVal * 100, 4);
                return (
                  <div key={bar.label} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold">{bar.value >= 0 ? "" : "-"}{(Math.abs(bar.value) / 1000).toFixed(1)}k</span>
                    <div className={`w-full rounded-t-lg ${bar.color} transition-all`} style={{ height: `${height}%` }} />
                    <span className="text-[9px] text-muted-foreground text-center leading-tight">{bar.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly trend */}
            <div className="glass-card p-6">
              <h3 className="font-semibold mb-1">Trend miesięczny</h3>
              <p className="text-xs text-muted-foreground mb-5">Przychód, koszty, prowizje, zysk netto (zł)</p>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="przychód" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} name="Przychód" />
                  <Line type="monotone" dataKey="części" stroke="#ef4444" strokeWidth={1.5} dot={{ r: 2 }} name="Koszty części" />
                  <Line type="monotone" dataKey="prowizje" stroke="#6366f1" strokeWidth={1.5} dot={{ r: 2 }} name="Prowizje" />
                  <Line type="monotone" dataKey="zysk_netto" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Zysk netto" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Payment methods */}
            <div className="glass-card p-6">
              <h3 className="font-semibold mb-1">Metody płatności</h3>
              <p className="text-xs text-muted-foreground mb-5">Podział przychodów wg metody</p>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart><Pie data={paymentData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                  {paymentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie><Tooltip contentStyle={tooltipStyle} formatter={(val) => `${(Number(val) / 1000).toFixed(1)}k zł`} /></PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-3">
                {paymentData.map((m, i) => (
                  <div key={m.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground">{m.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">{m.count} zleceń</span>
                      <span className="font-semibold">{(m.value / 1000).toFixed(1)}k zł</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════
          TAB: PROWIZJE
         ═══════════════════════════════════════════════ */}
      {tab === "prowizje" && (
        <>
          {/* Commission summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <KpiCard label="Suma prowizji" value={`${(totalCommission / 1000).toFixed(1)}k`} sub="zł" color="text-indigo-600" />
            <KpiCard label="% przychodu" value={`${commissionRatio}%`} sub="udział prowizji" />
            <KpiCard label="Śr. prowizja / zlecenie" value={`${paidOrders.length > 0 ? Math.round(totalCommission / paidOrders.length) : 0}`} sub="zł" />
            <KpiCard label="Aktywni serwisanci" value={`${commissionByEmployee.length}`} sub="w okresie" />
          </div>

          {/* Commission chart */}
          <div className="glass-card p-6 mb-6">
            <h3 className="font-semibold mb-1">Prowizje per serwisant</h3>
            <p className="text-xs text-muted-foreground mb-5">Kwoty prowizji i przychody (tys. zł)</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={commissionChartData} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="prowizja" fill="#6366f1" radius={[3, 3, 0, 0]} name="Prowizja (zł)" />
                <Bar dataKey="przychód" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Przychód (k zł)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Commission table */}
          <div className="glass-card divide-y divide-border/50">
            <div className="grid grid-cols-8 gap-2 p-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              <span className="col-span-2">Serwisant</span>
              <span className="text-right">Stawka</span>
              <span className="text-right">Zlecenia</span>
              <span className="text-right">Przychód</span>
              <span className="text-right">Prowizja</span>
              <span className="text-right">Śr. czas</span>
              <span className="text-right">Skuteczność</span>
            </div>
            {commissionByEmployee.map((emp, i) => (
              <div key={emp.id} className="grid grid-cols-8 gap-2 p-3 items-center text-xs">
                <div className="col-span-2 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-300 dark:to-white flex items-center justify-center text-white dark:text-gray-900 text-[10px] font-bold relative">
                    {emp.avatar}
                    {i === 0 && <Award className="w-3 h-3 text-amber-500 absolute -top-0.5 -right-0.5" />}
                  </div>
                  <div>
                    <p className="font-medium">{emp.name}</p>
                    <p className="text-[10px] text-muted-foreground">{emp.locationName}</p>
                  </div>
                </div>
                <p className="text-right font-medium">{(emp.rate * 100)}%</p>
                <p className="text-right">{emp.completed} <span className="text-muted-foreground">/ {emp.total}</span></p>
                <p className="text-right font-medium">{(emp.revenue / 1000).toFixed(1)}k zł</p>
                <p className="text-right font-bold text-indigo-600 dark:text-indigo-400">{emp.commission.toLocaleString("pl-PL")} zł</p>
                <p className="text-right">{emp.avgRepairTime}h</p>
                <div className="text-right">
                  <span className={`font-medium ${emp.efficiency >= 80 ? "text-green-600" : emp.efficiency >= 50 ? "text-amber-600" : "text-red-500"}`}>
                    {emp.efficiency}%
                  </span>
                </div>
              </div>
            ))}
            {commissionByEmployee.length > 0 && (
              <div className="grid grid-cols-8 gap-2 p-3 items-center text-xs font-bold bg-secondary/30">
                <span className="col-span-2">RAZEM</span>
                <span />
                <p className="text-right">{commissionByEmployee.reduce((s, e) => s + e.completed, 0)}</p>
                <p className="text-right">{(commissionByEmployee.reduce((s, e) => s + e.revenue, 0) / 1000).toFixed(1)}k zł</p>
                <p className="text-right text-indigo-600 dark:text-indigo-400">{totalCommission.toLocaleString("pl-PL")} zł</p>
                <span />
                <span />
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════
          TAB: OPERACYJNE
         ═══════════════════════════════════════════════ */}
      {tab === "operacyjne" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
            <KpiCard label="Wszystkie" value={`${filteredOrders.length}`} sub="zleceń" />
            <KpiCard label="Ukończone" value={`${completionRate}%`} sub={`${completedOrders.length} zleceń`} color="text-green-600" />
            <KpiCard label="Anulowane" value={`${cancellationRate}%`} sub={`${filteredOrders.filter(o => o.status === "anulowany").length} zleceń`} color={cancellationRate > 10 ? "text-red-500" : undefined} />
            <KpiCard label="Śr. diagnoza" value={`${Math.round(avgDiagnosisHours)}h`} sub="czas diagnozy" />
            <KpiCard label="Śr. naprawa" value={`${Math.round(avgRepairHours)}h`} sub="do ukończenia" />
            <KpiCard label="Gwarancyjne" value={`${filteredOrders.filter(o => o.isWarranty).length}`} sub={`${Math.round((filteredOrders.filter(o => o.isWarranty).length / (filteredOrders.length || 1)) * 100)}%`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By category */}
            <div className="glass-card p-6">
              <h3 className="font-semibold mb-1">Naprawy wg kategorii</h3>
              <p className="text-xs text-muted-foreground mb-5">Podział urządzeń</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart><Pie data={byCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                  {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie><Tooltip contentStyle={tooltipStyle} /></PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 justify-center">
                {byCategory.map((s, i) => <div key={s.name} className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{s.name} ({s.value})</div>)}
              </div>
            </div>

            {/* By repair type */}
            <div className="glass-card p-6">
              <h3 className="font-semibold mb-1">Typ naprawy</h3>
              <p className="text-xs text-muted-foreground mb-5">Rozkład typów</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={byType} layout="vertical" barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} width={90} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════
          TAB: LOKALIZACJE
         ═══════════════════════════════════════════════ */}
      {tab === "lokalizacje" && (
        <>
          {/* Location chart */}
          <div className="glass-card p-6 mb-6">
            <h3 className="font-semibold mb-1">Porównanie lokalizacji</h3>
            <p className="text-xs text-muted-foreground mb-5">Przychód, koszty, prowizje, zysk netto (tys. zł)</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={locData.map(l => ({
                name: l.name, przychód: Math.round(l.przychod / 1000),
                koszty: Math.round(l.koszty_czesci / 1000), prowizje: Math.round(l.prowizje / 1000),
                zysk: Math.round(l.zysk_netto / 1000),
              }))} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="przychód" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Przychód (k)" />
                <Bar dataKey="koszty" fill="#ef4444" radius={[3, 3, 0, 0]} name="Koszty (k)" />
                <Bar dataKey="prowizje" fill="#6366f1" radius={[3, 3, 0, 0]} name="Prowizje (k)" />
                <Bar dataKey="zysk" fill="#22c55e" radius={[3, 3, 0, 0]} name="Zysk netto (k)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Location table */}
          <div className="glass-card divide-y divide-border/50">
            <div className="grid grid-cols-7 gap-2 p-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              <span>Lokalizacja</span>
              <span className="text-right">Zlecenia</span>
              <span className="text-right">Przychód</span>
              <span className="text-right">Koszty części</span>
              <span className="text-right">Prowizje</span>
              <span className="text-right">Zysk netto</span>
              <span className="text-right">Marża</span>
            </div>
            {locData.map(loc => (
              <div key={loc.name} className="grid grid-cols-7 gap-2 p-3 items-center text-xs">
                <p className="font-medium">{loc.name}</p>
                <p className="text-right">{loc.zlecenia}</p>
                <p className="text-right font-medium">{(loc.przychod / 1000).toFixed(1)}k zł</p>
                <p className="text-right text-red-500">{(loc.koszty_czesci / 1000).toFixed(1)}k zł</p>
                <p className="text-right text-indigo-600 dark:text-indigo-400">{(loc.prowizje / 1000).toFixed(1)}k zł</p>
                <p className={`text-right font-bold ${loc.zysk_netto >= 0 ? "text-green-600" : "text-red-500"}`}>{(loc.zysk_netto / 1000).toFixed(1)}k zł</p>
                <p className={`text-right font-semibold ${loc.margin >= 40 ? "text-green-600" : loc.margin >= 20 ? "text-amber-600" : "text-red-500"}`}>{loc.margin}%</p>
              </div>
            ))}
            <div className="grid grid-cols-7 gap-2 p-3 items-center text-xs font-bold bg-secondary/30">
              <span>RAZEM</span>
              <p className="text-right">{locData.reduce((s, l) => s + l.zlecenia, 0)}</p>
              <p className="text-right">{(locData.reduce((s, l) => s + l.przychod, 0) / 1000).toFixed(1)}k zł</p>
              <p className="text-right text-red-500">{(locData.reduce((s, l) => s + l.koszty_czesci, 0) / 1000).toFixed(1)}k zł</p>
              <p className="text-right text-indigo-600 dark:text-indigo-400">{(locData.reduce((s, l) => s + l.prowizje, 0) / 1000).toFixed(1)}k zł</p>
              <p className="text-right text-green-600">{(locData.reduce((s, l) => s + l.zysk_netto, 0) / 1000).toFixed(1)}k zł</p>
              <p className="text-right">{netMargin}%</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="glass-card p-4 text-center">
      <p className={`text-lg font-bold ${color || ""}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-[9px] text-muted-foreground/60">{sub}</p>}
    </div>
  );
}
