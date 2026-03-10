"use client";

import { useState } from "react";
import { useReservations, useCustomers } from "@/hooks/use-store";
import { PageHeader } from "@/components/shared/page-header";
import { Reservation, DeviceCategory } from "@/types";
import { LOCATIONS, APPLE_DEVICES, RESERVATION_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, Clock, CheckCircle2, XCircle, Package } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

export default function ReservationsPage() {
  const { items: reservations, mounted, add, update } = useReservations();
  const { items: customers } = useCustomers();
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState<"all" | "aktywna" | "zrealizowana" | "anulowana">("all");

  if (!mounted) return <div className="animate-pulse space-y-4"><div className="h-8 w-48 bg-muted rounded-lg" /><div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl" />)}</div></div>;

  const filtered = filter === "all" ? reservations : reservations.filter(r => r.status === filter);

  const statusColors = { aktywna: "text-blue-600 bg-blue-50", zrealizowana: "text-green-600 bg-green-50", anulowana: "text-red-600 bg-red-50" };
  const statusLabels = { aktywna: "Aktywna", zrealizowana: "Zrealizowana", anulowana: "Anulowana" };

  return (
    <div className="page-transition">
      <PageHeader title="Rezerwacje terminów" description={`${reservations.length} rezerwacji`}
        action={<Button onClick={() => setShowNew(true)} className="rounded-xl gap-2"><Plus className="w-4 h-4" />Nowa rezerwacja</Button>} />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-4 text-center">
          <Calendar className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <p className="text-xl font-bold">{reservations.filter(r => r.status === "aktywna").length}</p>
          <p className="text-xs text-muted-foreground">Aktywne</p>
        </div>
        <div className="glass-card p-4 text-center">
          <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <p className="text-xl font-bold">{reservations.filter(r => r.status === "zrealizowana").length}</p>
          <p className="text-xs text-muted-foreground">Zrealizowane</p>
        </div>
        <div className="glass-card p-4 text-center">
          <Package className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-xl font-bold">{reservations.filter(r => r.reservationType === "czesc_zarezerwowana").length}</p>
          <p className="text-xs text-muted-foreground">Części zarezerwowane</p>
        </div>
      </div>

      <div className="flex gap-1 mb-5">
        {(["all", "aktywna", "zrealizowana", "anulowana"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}>
            {f === "all" ? "Wszystkie" : statusLabels[f]}
          </button>
        ))}
      </div>

      <div className="glass-card divide-y divide-border/50">
        {filtered.length === 0 ? (
          <div className="p-12 text-center"><p className="text-muted-foreground">Brak rezerwacji</p></div>
        ) : filtered.map(res => {
          const loc = LOCATIONS.find(l => l.id === res.locationId);
          return (
            <div key={res.id} className="p-4 first:rounded-t-2xl last:rounded-b-2xl">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold">{res.deviceModel}</p>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColors[res.status]}`}>{statusLabels[res.status]}</span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600">
                      {RESERVATION_TYPES[res.reservationType]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{res.customerName} · {res.customerPhone}</p>
                  <p className="text-xs text-muted-foreground">{res.issueDescription}</p>
                </div>
                <div className="flex gap-1.5">
                  {res.status === "aktywna" && (
                    <>
                      <Button variant="outline" size="sm" className="rounded-xl text-xs h-7" onClick={() => update(res.id, { status: "zrealizowana" })}>Zrealizuj</Button>
                      <Button variant="outline" size="sm" className="rounded-xl text-xs h-7" onClick={() => update(res.id, { status: "anulowana" })}>Anuluj</Button>
                    </>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Termin: <strong>{format(new Date(res.reservedDate), "d MMM yyyy", { locale: pl })}</strong>
                · {loc?.name.replace("AppleHome ", "")}
                · Utworzono: {format(new Date(res.createdAt), "d MMM yyyy HH:mm", { locale: pl })}
              </p>
            </div>
          );
        })}
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="sm:max-w-[480px] rounded-2xl">
          <DialogHeader><DialogTitle>Nowa rezerwacja terminu</DialogTitle></DialogHeader>
          <NewReservationForm customers={customers} onAdd={r => { add(r); setShowNew(false); }} onClose={() => setShowNew(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NewReservationForm({ customers, onAdd, onClose }: {
  customers: { id: string; firstName: string; lastName: string; phone: string }[];
  onAdd: (r: Reservation) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    customerId: "",
    deviceCategory: "iPhone" as DeviceCategory,
    deviceModel: "",
    issueDescription: "",
    reservationType: "oczekuje_na_dostarczenie" as Reservation["reservationType"],
    locationId: LOCATIONS[0].id,
    reservedDate: "",
    notes: "",
  });

  const models = APPLE_DEVICES[form.deviceCategory] || [];
  const customer = customers.find(c => c.id === form.customerId);

  return (
    <div className="space-y-4 mt-2">
      <div>
        <Label className="text-xs text-muted-foreground">Klient</Label>
        <Select value={form.customerId} onValueChange={v => setForm({ ...form, customerId: v })}>
          <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Wybierz klienta" /></SelectTrigger>
          <SelectContent>{customers.slice(0, 20).map(c => <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName} · {c.phone}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Kategoria</Label>
          <Select value={form.deviceCategory} onValueChange={v => setForm({ ...form, deviceCategory: v as DeviceCategory, deviceModel: "" })}>
            <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{(Object.keys(APPLE_DEVICES) as DeviceCategory[]).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Model</Label>
          <Select value={form.deviceModel} onValueChange={v => setForm({ ...form, deviceModel: v })}>
            <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Wybierz" /></SelectTrigger>
            <SelectContent>{models.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Opis usterki / usługi</Label>
        <Input className="rounded-xl mt-1" value={form.issueDescription} onChange={e => setForm({ ...form, issueDescription: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Typ rezerwacji</Label>
          <Select value={form.reservationType} onValueChange={v => setForm({ ...form, reservationType: v as Reservation["reservationType"] })}>
            <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(RESERVATION_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Planowana data</Label>
          <Input className="rounded-xl mt-1" type="date" value={form.reservedDate} onChange={e => setForm({ ...form, reservedDate: e.target.value })} />
        </div>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Lokalizacja</Label>
        <Select value={form.locationId} onValueChange={v => setForm({ ...form, locationId: v })}>
          <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{LOCATIONS.map(l => <SelectItem key={l.id} value={l.id}>{l.name.replace("AppleHome ", "")}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Uwagi</Label>
        <Textarea className="rounded-xl mt-1 min-h-[50px]" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose} className="rounded-xl">Anuluj</Button>
        <Button className="rounded-xl" disabled={!form.customerId || !form.deviceModel || !form.reservedDate}
          onClick={() => onAdd({
            id: Math.random().toString(36).substring(2, 11),
            customerId: form.customerId,
            customerName: customer ? `${customer.firstName} ${customer.lastName}` : "",
            customerPhone: customer?.phone || "",
            deviceCategory: form.deviceCategory,
            deviceModel: form.deviceModel,
            issueDescription: form.issueDescription,
            reservationType: form.reservationType,
            locationId: form.locationId,
            reservedDate: new Date(form.reservedDate).toISOString(),
            notes: form.notes,
            status: "aktywna",
            createdAt: new Date().toISOString(),
          })}>
          Utwórz rezerwację
        </Button>
      </div>
    </div>
  );
}
