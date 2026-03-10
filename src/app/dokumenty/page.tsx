"use client";

import { useOrders } from "@/hooks/use-store";
import { PageHeader } from "@/components/shared/page-header";
import { LOCATIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { FileText, Download, Printer, Receipt, CreditCard, Truck } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

export default function DocumentsPage() {
  const { items: orders, mounted } = useOrders();

  if (!mounted) return <div className="animate-pulse space-y-4"><div className="h-8 w-48 bg-muted rounded-lg" /><div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl" />)}</div></div>;

  const recentCompleted = orders.filter(o => ["gotowy_do_odbioru", "odebrany"].includes(o.status)).slice(0, 15);

  const docTypes = [
    { icon: FileText, label: "Potwierdzenia przyjęcia", count: orders.length, color: "text-blue-500" },
    { icon: FileText, label: "Potwierdzenia wydania", count: orders.filter(o => o.status === "odebrany").length, color: "text-green-500" },
    { icon: Receipt, label: "Faktury VAT", count: orders.filter(o => o.invoiceRequested && o.isPaid).length, color: "text-purple-500" },
    { icon: Receipt, label: "Paragony", count: orders.filter(o => !o.invoiceRequested && o.isPaid).length, color: "text-indigo-500" },
    { icon: CreditCard, label: "Linki do płatności", count: orders.filter(o => o.paymentMethod === "link_platnosci").length, color: "text-amber-500" },
    { icon: Truck, label: "Listy przewozowe", count: orders.filter(o => o.returnMethod === "door_to_door" || o.returnMethod === "wysylka_wlasna").length, color: "text-teal-500" },
  ];

  return (
    <div className="page-transition">
      <PageHeader title="Dokumenty" description="Generowanie i zarządzanie dokumentami" />

      {/* Document types */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {docTypes.map(dt => (
          <div key={dt.label} className="glass-card p-4 text-center hover:shadow-md transition-all cursor-pointer">
            <dt.icon className={`w-6 h-6 ${dt.color} mx-auto mb-2`} />
            <p className="text-xs font-medium">{dt.label}</p>
            <p className="text-lg font-bold mt-1">{dt.count}</p>
          </div>
        ))}
      </div>

      {/* SMS Templates */}
      <div className="glass-card p-6 mb-6">
        <h3 className="font-semibold mb-4">Szablony SMS / Email</h3>
        <p className="text-sm text-muted-foreground mb-4">Konfiguracja automatycznych powiadomień — integracja z HostedSMS i Gmail.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {["Przyjęcie zlecenia", "Diagnoza zakończona", "Zamówienie części (3/7/14 dni)", "Gotowe do odbioru", "Prośba o kontakt", "Brak kontaktu", "Opinia po naprawie"].map(tpl => (
            <div key={tpl} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
              <span className="text-sm">{tpl}</span>
              <Button variant="ghost" size="sm" className="text-xs h-7">Edytuj</Button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent documents */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4">Ostatnie dokumenty</h3>
        <div className="divide-y divide-border/50">
          {recentCompleted.map(order => {
            const loc = LOCATIONS.find(l => l.id === order.locationId);
            return (
              <div key={order.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{order.orderNumber} — {order.deviceModel}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {order.customerName} · {loc?.name.replace("AppleHome ", "")} · {format(new Date(order.updatedAt), "d MMM yyyy", { locale: pl })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"><Printer className="w-3 h-3" />Drukuj</Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1"><Download className="w-3 h-3" />PDF</Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Integrations info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <div className="glass-card p-5">
          <h4 className="font-semibold text-sm mb-2">wFirma.pl</h4>
          <p className="text-xs text-muted-foreground mb-3">Automatyczne wystawianie faktur i paragonów</p>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500" /><span className="text-xs text-green-600 font-medium">Połączono</span></div>
        </div>
        <div className="glass-card p-5">
          <h4 className="font-semibold text-sm mb-2">HostedSMS</h4>
          <p className="text-xs text-muted-foreground mb-3">Wysyłka powiadomień SMS do klientów</p>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500" /><span className="text-xs text-green-600 font-medium">Aktywne</span></div>
        </div>
        <div className="glass-card p-5">
          <h4 className="font-semibold text-sm mb-2">WooCommerce</h4>
          <p className="text-xs text-muted-foreground mb-3">Synchronizacja zleceń ze stroną WWW</p>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-xs text-amber-600 font-medium">Konfiguracja</span></div>
        </div>
      </div>
    </div>
  );
}
