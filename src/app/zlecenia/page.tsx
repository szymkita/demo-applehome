"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useOrders, useCustomers } from "@/hooks/use-store";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { STATUS_CONFIG, PRIORITY_CONFIG, LOCATIONS, EMPLOYEES, APPLE_DEVICES, COMMON_ISSUES, REPAIR_TYPES } from "@/lib/constants";
import { Order, OrderStatus, DeviceCategory } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, ChevronRight, MapPin, Apple, LayoutList, Columns3 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

const statusFilters: (OrderStatus | "all" | "aktywne")[] = [
  "all", "aktywne", "oczekuje_na_diagnoze", "w_trakcie_diagnozy", "oczekuje_na_akceptacje",
  "w_trakcie_naprawy", "oczekuje_na_czesci", "w_trakcie_testow",
  "gotowy_do_odbioru", "odebrany", "anulowany",
];

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="animate-pulse space-y-6"><div className="h-8 w-48 bg-muted rounded-lg" /><div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-muted rounded-xl" />)}</div></div>}>
      <OrdersPageInner />
    </Suspense>
  );
}

function OrdersPageInner() {
  const { items: orders, mounted, add } = useOrders();
  const { items: customers } = useCustomers();
  const searchParams = useSearchParams();
  const customerFilter = searchParams.get("customer");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all" | "aktywne">("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [showNew, setShowNew] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

  if (!mounted) {
    return <div className="animate-pulse space-y-6"><div className="h-8 w-48 bg-muted rounded-lg" /><div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-muted rounded-xl" />)}</div></div>;
  }

  const activeStatuses: OrderStatus[] = ["oczekuje_na_diagnoze", "w_trakcie_diagnozy", "oczekuje_na_akceptacje", "w_trakcie_naprawy", "oczekuje_na_czesci", "w_trakcie_testow", "gotowy_do_odbioru"];

  const filtered = orders
    .filter((o) => !customerFilter || o.customerId === customerFilter)
    .filter((o) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "aktywne") return activeStatuses.includes(o.status);
      return o.status === statusFilter;
    })
    .filter((o) => locationFilter === "all" || o.locationId === locationFilter)
    .filter((o) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.deviceModel.toLowerCase().includes(q) || o.serialNumber.toLowerCase().includes(q);
    });

  return (
    <div className="page-transition">
      <PageHeader
        title="Zlecenia"
        description={`${orders.length} zleceń w systemie`}
        action={<Button onClick={() => setShowNew(true)} className="rounded-xl gap-2"><Plus className="w-4 h-4" />Nowe zlecenie</Button>}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Szukaj: RMA, klient, model, SN..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-xl" />
        </div>
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-48 rounded-xl"><MapPin className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie lokalizacje</SelectItem>
            {LOCATIONS.map(l => <SelectItem key={l.id} value={l.id}>{l.name.replace("AppleHome ", "")}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex rounded-xl border border-border overflow-hidden">
          <button onClick={() => setViewMode("list")} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}>
            <LayoutList className="w-3.5 h-3.5" />Lista
          </button>
          <button onClick={() => setViewMode("kanban")} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-l border-border ${viewMode === "kanban" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}>
            <Columns3 className="w-3.5 h-3.5" />Kanban
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-6 overflow-x-auto pb-2 -mx-1 px-1">
        {statusFilters.map((s) => {
          const count = s === "all" ? orders.length : s === "aktywne" ? orders.filter(o => activeStatuses.includes(o.status)).length : orders.filter((o) => o.status === s).length;
          const active = statusFilter === s;
          return (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
              {s === "all" ? "Wszystkie" : s === "aktywne" ? "Aktywne" : STATUS_CONFIG[s].label}
              <span className={`text-[10px] ${active ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {viewMode === "list" ? (
        <div className="glass-card divide-y divide-border/50">
          {filtered.length === 0 ? (
            <div className="p-12 text-center"><p className="text-muted-foreground">Brak zleceń</p></div>
          ) : (
            filtered.map((order) => {
              const loc = LOCATIONS.find(l => l.id === order.locationId);
              return (
                <Link key={order.id} href={`/zlecenia/${order.id}`}
                  className="flex items-center justify-between p-3.5 hover:bg-accent/30 transition-colors first:rounded-t-2xl last:rounded-b-2xl group">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                      <Apple className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{order.deviceModel}</p>
                        {order.isWarranty && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">GW</span>}
                        {order.priority !== "standard" && <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${PRIORITY_CONFIG[order.priority].bg} ${PRIORITY_CONFIG[order.priority].color}`}>{PRIORITY_CONFIG[order.priority].label}</span>}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {order.orderNumber} · {order.customerName} · {loc?.name.replace("AppleHome ", "")} · {format(new Date(order.createdAt), "d MMM", { locale: pl })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusBadge status={order.status} size="xs" />
                    {order.estimatedCost && <span className="text-xs font-medium hidden sm:block">{order.finalCost || order.estimatedCost} zł</span>}
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              );
            })
          )}
        </div>
      ) : (
        <KanbanBoard orders={filtered} />
      )}

      <NewOrderDialog open={showNew} onClose={() => setShowNew(false)} customers={customers} onAdd={add} orderCount={orders.length} />
    </div>
  );
}

const kanbanColumns: OrderStatus[] = [
  "oczekuje_na_diagnoze", "w_trakcie_diagnozy", "oczekuje_na_akceptacje",
  "w_trakcie_naprawy", "oczekuje_na_czesci", "w_trakcie_testow", "gotowy_do_odbioru",
];

function KanbanBoard({ orders }: { orders: Order[] }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2 snap-x">
      {kanbanColumns.map((status) => {
        const colOrders = orders.filter((o) => o.status === status);
        const config = STATUS_CONFIG[status];
        return (
          <div key={status} className="flex-shrink-0 w-[280px] snap-start">
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
              <span className="text-xs font-semibold">{config.label}</span>
              <span className="text-[10px] text-muted-foreground ml-auto">{colOrders.length}</span>
            </div>
            <div className="space-y-2 min-h-[200px]">
              {colOrders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/50 p-6 text-center">
                  <p className="text-[11px] text-muted-foreground">Brak zleceń</p>
                </div>
              ) : (
                colOrders.map((order) => (
                  <Link key={order.id} href={`/zlecenia/${order.id}`}
                    className="block glass-card p-3 hover:bg-accent/30 transition-all hover:shadow-md group cursor-pointer">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-semibold truncate">{order.deviceModel}</p>
                          {order.isWarranty && <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">GW</span>}
                          {order.priority !== "standard" && <span className={`text-[8px] font-semibold px-1 py-0.5 rounded ${PRIORITY_CONFIG[order.priority].bg} ${PRIORITY_CONFIG[order.priority].color}`}>{PRIORITY_CONFIG[order.priority].label}</span>}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1 truncate">{order.customerName}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{order.orderNumber}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                      <span className="text-[10px] text-muted-foreground">{format(new Date(order.createdAt), "d MMM", { locale: pl })}</span>
                      {order.estimatedCost && <span className="text-[11px] font-medium">{order.finalCost || order.estimatedCost} zł</span>}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NewOrderDialog({ open, onClose, customers, onAdd, orderCount }: {
  open: boolean; onClose: () => void;
  customers: { id: string; firstName: string; lastName: string; phone: string }[];
  onAdd: (order: Order) => void; orderCount: number;
}) {
  const [form, setForm] = useState({
    customerId: "", deviceCategory: "iPhone" as DeviceCategory, deviceModel: "", serialNumber: "",
    lockCode: "", hasBox: false, resetConsent: false, issueDescription: "",
    repairType: "ekran" as Order["repairType"], priority: "standard" as Order["priority"],
    estimatedCost: "", locationId: LOCATIONS[0].id, assignedTo: "", isWarranty: false,
    receiveMethod: "osobiscie" as Order["receiveMethod"], returnMethod: "osobiscie" as Order["returnMethod"],
    smsEnabled: true, emailEnabled: false, invoiceRequested: false, paczkomatCode: "",
  });

  const models = APPLE_DEVICES[form.deviceCategory] || [];
  const issues = COMMON_ISSUES[form.deviceCategory] || [];
  const locationEmployees = EMPLOYEES.filter(e => e.locationId === form.locationId && e.role === "serwisant");

  const handleSubmit = () => {
    const customer = customers.find(c => c.id === form.customerId);
    if (!customer || !form.deviceModel || !form.issueDescription) return;
    const now = new Date().toISOString();
    const receiver = EMPLOYEES.find(e => e.locationId === form.locationId) || EMPLOYEES[0];
    const plannedDate = new Date();
    const daysMap: Record<string, number> = { iPhone: 1, MacBook: 2, iPad: 3, "Apple Watch": 4, iMac: 4, Inne: 5 };
    plannedDate.setDate(plannedDate.getDate() + (daysMap[form.deviceCategory] || 3));
    const pickupCode = Array.from({ length: 7 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 31)]).join("");

    const order: Order = {
      id: Math.random().toString(36).substring(2, 11),
      orderNumber: `RMA/${35000 + orderCount}/${new Date().getFullYear()}`,
      customerId: form.customerId, customerName: `${customer.firstName} ${customer.lastName}`, customerPhone: customer.phone,
      deviceCategory: form.deviceCategory, deviceModel: form.deviceModel, serialNumber: form.serialNumber || "BRAK ODCZYTU",
      lockCode: form.lockCode || undefined, hasBox: form.hasBox, resetConsent: form.resetConsent,
      condition: "Naturalne ślady użytkowania", issueDescription: form.issueDescription,
      repairType: form.repairType, isWarranty: form.isWarranty,
      status: "oczekuje_na_diagnoze", priority: form.priority,
      statusHistory: [{ status: "oczekuje_na_diagnoze", timestamp: now, note: "Urządzenie przyjęte do serwisu", userName: receiver.name, locationId: form.locationId }],
      assignedTo: form.assignedTo || undefined, receivedBy: receiver.id, locationId: form.locationId,
      estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : undefined,
      receiveMethod: form.receiveMethod, returnMethod: form.returnMethod,
      pickupCode, smsEnabled: form.smsEnabled, emailEnabled: form.emailEnabled,
      paczkomatCode: form.paczkomatCode || undefined,
      isPaid: false, invoiceRequested: form.invoiceRequested,
      partsUsed: [], photosCount: 0, notes: [],
      plannedPickupDate: plannedDate.toISOString(), createdAt: now, updatedAt: now,
    };
    onAdd(order);
    setForm({
      customerId: "", deviceCategory: "iPhone", deviceModel: "", serialNumber: "",
      lockCode: "", hasBox: false, resetConsent: false, issueDescription: "",
      repairType: "ekran", priority: "standard",
      estimatedCost: "", locationId: LOCATIONS[0].id, assignedTo: "", isWarranty: false,
      receiveMethod: "osobiscie", returnMethod: "osobiscie",
      smsEnabled: true, emailEnabled: false, invoiceRequested: false, paczkomatCode: "",
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto rounded-2xl">
        <DialogHeader><DialogTitle>Nowe zlecenie serwisowe</DialogTitle></DialogHeader>
        <div className="space-y-5 mt-2">
          {/* Owner */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Informacje o właścicielu</p>
            <Select value={form.customerId} onValueChange={(v) => setForm({ ...form, customerId: v })}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Wybierz klienta" /></SelectTrigger>
              <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName} · {c.phone}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {/* Device */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Informacje o sprzęcie</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <Label className="text-xs text-muted-foreground">Kategoria</Label>
                <Select value={form.deviceCategory} onValueChange={(v) => setForm({ ...form, deviceCategory: v as DeviceCategory, deviceModel: "" })}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{(Object.keys(APPLE_DEVICES) as DeviceCategory[]).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Model *</Label>
                <Select value={form.deviceModel} onValueChange={(v) => setForm({ ...form, deviceModel: v })}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Wybierz model" /></SelectTrigger>
                  <SelectContent>{models.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <Label className="text-xs text-muted-foreground">Numer seryjny *</Label>
                <Input className="rounded-xl mt-1" placeholder="lub BRAK ODCZYTU" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Kod blokady</Label>
                <Input className="rounded-xl mt-1" placeholder="np. 1234" value={form.lockCode} onChange={(e) => setForm({ ...form, lockCode: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.hasBox} onChange={(e) => setForm({ ...form, hasBox: e.target.checked })} className="rounded" />
                <span className="text-xs">Pudełko</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.resetConsent} onChange={(e) => setForm({ ...form, resetConsent: e.target.checked })} className="rounded" />
                <span className="text-xs">Zgoda na zerowanie</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isWarranty} onChange={(e) => setForm({ ...form, isWarranty: e.target.checked })} className="rounded" />
                <span className="text-xs">Gwarancyjna</span>
              </label>
            </div>
          </div>

          {/* Service */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Informacje serwisowe</p>
            <div className="mb-3">
              <Label className="text-xs text-muted-foreground">Opis usterki *</Label>
              <div className="flex flex-wrap gap-1.5 mt-1 mb-2">
                {issues.slice(0, 5).map(issue => (
                  <button key={issue} type="button" onClick={() => setForm({ ...form, issueDescription: issue })}
                    className={`text-[10px] px-2 py-1 rounded-lg border transition-colors ${form.issueDescription === issue ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}>
                    {issue.length > 35 ? issue.slice(0, 35) + "…" : issue}
                  </button>
                ))}
              </div>
              <Textarea className="rounded-xl min-h-[60px]" value={form.issueDescription} onChange={(e) => setForm({ ...form, issueDescription: e.target.value })} placeholder="Opisz usterkę..." />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Typ naprawy</Label>
                <Select value={form.repairType} onValueChange={(v) => setForm({ ...form, repairType: v as Order["repairType"] })}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(REPAIR_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Priorytet</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Order["priority"] })}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(PRIORITY_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Szacunkowy koszt</Label>
                <Input className="rounded-xl mt-1" type="number" placeholder="zł" value={form.estimatedCost} onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Logistics */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Przyjęcie i odbiór</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Oddział</Label>
                <Select value={form.locationId} onValueChange={(v) => setForm({ ...form, locationId: v, assignedTo: "" })}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{LOCATIONS.map(l => <SelectItem key={l.id} value={l.id}>{l.name.replace("AppleHome ", "")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Przyjęcie</Label>
                <Select value={form.receiveMethod} onValueChange={(v) => setForm({ ...form, receiveMethod: v as Order["receiveMethod"] })}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="osobiscie">Osobiście</SelectItem>
                    <SelectItem value="door_to_door">Door to door</SelectItem>
                    <SelectItem value="wysylka_wlasna">Wysyłka własna</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Odbiór</Label>
                <Select value={form.returnMethod} onValueChange={(v) => setForm({ ...form, returnMethod: v as Order["returnMethod"] })}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="osobiscie">Osobiście</SelectItem>
                    <SelectItem value="door_to_door">Door to door</SelectItem>
                    <SelectItem value="wysylka_wlasna">Wysyłka własna</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {(form.receiveMethod !== "osobiscie" || form.returnMethod !== "osobiscie") && (
              <div className="mt-3">
                <Label className="text-xs text-muted-foreground">Numer paczkomatu / adres wysyłki</Label>
                <Input className="rounded-xl mt-1" value={form.paczkomatCode} onChange={(e) => setForm({ ...form, paczkomatCode: e.target.value })} placeholder="np. WAW45M lub adres" />
              </div>
            )}
            <div className="flex gap-4 mt-3 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.smsEnabled} onChange={(e) => setForm({ ...form, smsEnabled: e.target.checked })} className="rounded" />
                <span className="text-xs">SMS</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.emailEnabled} onChange={(e) => setForm({ ...form, emailEnabled: e.target.checked })} className="rounded" />
                <span className="text-xs">Email</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.invoiceRequested} onChange={(e) => setForm({ ...form, invoiceRequested: e.target.checked })} className="rounded" />
                <span className="text-xs">Faktura VAT</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="rounded-xl">Anuluj</Button>
            <Button onClick={handleSubmit} className="rounded-xl" disabled={!form.customerId || !form.deviceModel || !form.issueDescription}>Utwórz zlecenie</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
