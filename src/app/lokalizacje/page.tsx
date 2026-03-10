"use client";

import { useOrders, useInventory } from "@/hooks/use-store";
import { PageHeader } from "@/components/shared/page-header";
import { LOCATIONS, EMPLOYEES } from "@/lib/constants";
import { MapPin, Users, Wrench, Package, TrendingUp, Phone } from "lucide-react";

export default function LocationsPage() {
  const { items: orders, mounted } = useOrders();
  const { items: inventory } = useInventory();

  if (!mounted) return <div className="animate-pulse space-y-4"><div className="h-8 w-48 bg-muted rounded-lg" /><div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-48 bg-muted rounded-2xl" />)}</div></div>;

  return (
    <div className="page-transition">
      <PageHeader title="Lokalizacje" description={`${LOCATIONS.length} oddziałów AppleHome`} />

      <div className="space-y-4">
        {LOCATIONS.map(loc => {
          const locOrders = orders.filter(o => o.locationId === loc.id);
          const active = locOrders.filter(o => !["odebrany", "anulowany", "zutylizowany", "odkupiony"].includes(o.status));
          const completed = locOrders.filter(o => o.completedAt);
          const revenue = locOrders.filter(o => o.finalCost).reduce((s, o) => s + (o.finalCost || 0), 0);
          const profit = revenue - locOrders.filter(o => o.partsCost).reduce((s, o) => s + (o.partsCost || 0), 0);
          const locEmployees = EMPLOYEES.filter(e => e.locationId === loc.id);
          const locParts = inventory.filter(i => i.locationId === loc.id);
          const lowStock = locParts.filter(i => i.quantity <= i.minQuantity);

          return (
            <div key={loc.id} className="glass-card p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-950 dark:from-gray-100 dark:to-white flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white dark:text-gray-900" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{loc.name}</h3>
                    <p className="text-sm text-muted-foreground">{loc.address}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{loc.phone}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div className="p-3 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1"><Wrench className="w-3 h-3" />Zlecenia</div>
                  <p className="text-xl font-bold">{locOrders.length}</p>
                  <p className="text-[10px] text-muted-foreground">{active.length} aktywnych</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1"><TrendingUp className="w-3 h-3" />Przychód</div>
                  <p className="text-xl font-bold">{(revenue / 1000).toFixed(1)}k</p>
                  <p className="text-[10px] text-muted-foreground">Zysk: {(profit / 1000).toFixed(1)}k zł</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1"><Users className="w-3 h-3" />Zespół</div>
                  <p className="text-xl font-bold">{locEmployees.length}</p>
                  <p className="text-[10px] text-muted-foreground">{locEmployees.filter(e => e.role === "serwisant").length} serwisantów</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1"><Package className="w-3 h-3" />Magazyn</div>
                  <p className="text-xl font-bold">{locParts.length}</p>
                  <p className={`text-[10px] ${lowStock.length > 0 ? "text-orange-500 font-medium" : "text-muted-foreground"}`}>{lowStock.length > 0 ? `${lowStock.length} niski stan` : "OK"}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {locEmployees.map(emp => (
                  <span key={emp.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-xs">
                    <span className="w-4 h-4 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 dark:from-gray-300 dark:to-gray-100 flex items-center justify-center text-white dark:text-gray-900 text-[8px] font-bold">{emp.avatar}</span>
                    {emp.name.split(" ")[0]} <span className="text-muted-foreground">· {emp.role === "serwisant" ? "Serwisant" : emp.role === "manager" ? "Manager" : emp.role === "recepcja" ? "Recepcja" : "Admin"}</span>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
