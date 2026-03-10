"use client";

import { useOrders } from "@/hooks/use-store";
import { PageHeader } from "@/components/shared/page-header";
import { EMPLOYEES, LOCATIONS, REPAIR_TYPES } from "@/lib/constants";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Wrench, TrendingUp, Clock, Star, MapPin, Award } from "lucide-react";

export default function EmployeesPage() {
  const { items: orders, mounted } = useOrders();

  if (!mounted) return <div className="animate-pulse space-y-4"><div className="h-8 w-48 bg-muted rounded-lg" /><div className="grid grid-cols-2 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-48 bg-muted rounded-2xl" />)}</div></div>;

  const techData = EMPLOYEES.filter(e => e.role === "serwisant").map(emp => {
    const empOrders = orders.filter(o => o.assignedTo === emp.id);
    const completed = empOrders.filter(o => ["gotowy_do_odbioru", "odebrany"].includes(o.status));
    const revenue = completed.reduce((s, o) => s + (o.finalCost || 0), 0);
    const commission = completed.reduce((s, o) => s + (o.commission || 0), 0);
    const avgTime = completed.length > 0
      ? completed.reduce((s, o) => s + (o.completedAt ? (new Date(o.completedAt).getTime() - new Date(o.createdAt).getTime()) / 3600000 : 0), 0) / completed.length
      : 0;
    const loc = LOCATIONS.find(l => l.id === emp.locationId);

    const repairTypes: Record<string, number> = {};
    empOrders.forEach(o => { repairTypes[o.repairType] = (repairTypes[o.repairType] || 0) + 1; });
    const topRepair = Object.entries(repairTypes).sort((a, b) => b[1] - a[1])[0];

    return {
      ...emp, loc, total: empOrders.length, completed: completed.length,
      active: empOrders.filter(o => !["odebrany", "anulowany"].includes(o.status)).length,
      revenue, commission, avgTime: Math.round(avgTime),
      topRepair: topRepair ? REPAIR_TYPES[topRepair[0] as keyof typeof REPAIR_TYPES] : "—",
      efficiency: empOrders.length > 0 ? Math.round((completed.length / empOrders.length) * 100) : 0,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const chartData = techData.map(t => ({
    name: t.name.split(" ")[0],
    zlecenia: t.total,
    ukonczone: t.completed,
    przychod: Math.round(t.revenue / 1000),
  }));

  return (
    <div className="page-transition">
      <PageHeader title="Pracownicy" description={`${EMPLOYEES.length} pracowników · ${EMPLOYEES.filter(e => e.role === "serwisant").length} serwisantów`} />

      {/* Chart */}
      <div className="glass-card p-6 mb-6">
        <h3 className="font-semibold mb-1">Porównanie serwisantów</h3>
        <p className="text-xs text-muted-foreground mb-4">Zlecenia i przychód (tys. zł)</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barSize={14}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} />
            <Bar dataKey="zlecenia" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Zlecenia" />
            <Bar dataKey="ukonczone" fill="#22c55e" radius={[3, 3, 0, 0]} name="Ukończone" />
            <Bar dataKey="przychod" fill="#8b5cf6" radius={[3, 3, 0, 0]} name="Przychód (k)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {techData.map((emp, i) => (
          <div key={emp.id} className="glass-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-300 dark:to-white flex items-center justify-center text-white dark:text-gray-900 text-xs font-bold relative">
                {emp.avatar}
                {i === 0 && <Award className="w-3.5 h-3.5 text-amber-500 absolute -top-1 -right-1" />}
              </div>
              <div>
                <p className="font-semibold text-sm">{emp.name}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <MapPin className="w-2.5 h-2.5" />{emp.loc?.name.replace("AppleHome ", "")}
                  <span className="mx-0.5">·</span>
                  <span>Prowizja {(emp.commissionRate * 100)}%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-0.5"><Wrench className="w-3 h-3" />Zlecenia</div>
                <p className="text-lg font-bold">{emp.total}</p>
                <p className="text-[10px] text-muted-foreground">{emp.active} aktywnych · {emp.completed} ukończonych</p>
              </div>
              <div className="p-2.5 rounded-xl bg-secondary/50">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-0.5"><TrendingUp className="w-3 h-3" />Przychód</div>
                <p className="text-lg font-bold">{(emp.revenue / 1000).toFixed(1)}k</p>
                <p className="text-[10px] text-muted-foreground">Prowizja: {emp.commission.toLocaleString("pl-PL")} zł</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Śr. czas: {emp.avgTime}h</span>
              <span className="flex items-center gap-1"><Star className="w-3 h-3" />Skuteczność: {emp.efficiency}%</span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">
              Najczęstszy typ: <span className="font-medium text-foreground">{emp.topRepair}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
