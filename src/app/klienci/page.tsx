"use client";

import { useState } from "react";
import { useCustomers, useOrders } from "@/hooks/use-store";
import { PageHeader } from "@/components/shared/page-header";
import { Customer } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Phone, Mail, MapPin, ChevronRight, Trash2, Building2, User } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

export default function CustomersPage() {
  const { items: customers, mounted, add, remove } = useCustomers();
  const { items: orders } = useOrders();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "individual" | "business">("all");
  const [showNew, setShowNew] = useState(false);

  if (!mounted) return <div className="animate-pulse space-y-6"><div className="h-8 w-48 bg-muted rounded-lg" /><div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-muted rounded-xl" />)}</div></div>;

  const filtered = customers
    .filter(c => typeFilter === "all" || c.type === typeFilter)
    .filter(c => {
      if (!search) return true;
      const q = search.toLowerCase();
      return `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q) || (c.companyName || "").toLowerCase().includes(q);
    });

  const getOrderCount = (id: string) => orders.filter(o => o.customerId === id).length;
  const getRevenue = (id: string) => orders.filter(o => o.customerId === id && o.finalCost).reduce((s, o) => s + (o.finalCost || 0), 0);

  const sourceLabels: Record<string, string> = { google: "Google", social_media: "Social Media", polecenie: "Polecenie", b2b: "B2B", przypadkowo: "Przypadkowo" };

  return (
    <div className="page-transition">
      <PageHeader title="Klienci" description={`${customers.length} klientów · ${customers.filter(c => c.isB2B).length} B2B`}
        action={<Button onClick={() => setShowNew(true)} className="rounded-xl gap-2"><Plus className="w-4 h-4" />Dodaj klienta</Button>} />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Szukaj klienta..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-xl" />
        </div>
        <div className="flex gap-1">
          {(["all", "individual", "business"] as const).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${typeFilter === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}>
              {t === "all" ? "Wszyscy" : t === "individual" ? "Indywidualni" : "Firmy"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(customer => {
          const cnt = getOrderCount(customer.id);
          const rev = getRevenue(customer.id);
          return (
            <div key={customer.id} className="glass-card p-5 hover:shadow-md transition-all duration-300 group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold ${customer.isB2B ? "bg-gradient-to-br from-amber-500 to-orange-500" : "bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-300 dark:to-white dark:text-gray-900"}`}>
                    {customer.isB2B ? <Building2 className="w-4 h-4" /> : `${customer.firstName[0]}${customer.lastName[0]}`}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{customer.firstName} {customer.lastName}</p>
                    {customer.companyName && <p className="text-[11px] text-muted-foreground">{customer.companyName}</p>}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{cnt} zleceń</span>
                      {rev > 0 && <span className="text-[10px] font-medium">{rev.toLocaleString("pl-PL")} zł</span>}
                      {customer.isB2B && <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">B2B</span>}
                    </div>
                  </div>
                </div>
                <button onClick={() => remove(customer.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><Phone className="w-3 h-3" />{customer.phone}</div>
                <div className="flex items-center gap-2"><Mail className="w-3 h-3" /><span className="truncate">{customer.email}</span></div>
                <div className="flex items-center gap-2"><MapPin className="w-3 h-3" />{customer.city}</div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/50">
                <span className="text-[10px] text-muted-foreground">Źródło: {sourceLabels[customer.source]} · {format(new Date(customer.createdAt), "d MMM yyyy", { locale: pl })}</span>
                {cnt > 0 && <Link href={`/zlecenia?customer=${customer.id}`} className="text-[10px] text-primary font-medium hover:underline flex items-center gap-0.5">Zlecenia<ChevronRight className="w-2.5 h-2.5" /></Link>}
              </div>
            </div>
          );
        })}
      </div>

      <NewCustomerDialog open={showNew} onClose={() => setShowNew(false)} onAdd={add} />
    </div>
  );
}

function NewCustomerDialog({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (c: Customer) => void }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", companyName: "", nip: "", phone: "", email: "", city: "", street: "", postalCode: "", source: "google" as Customer["source"], isBiz: false });

  const handleSubmit = () => {
    if (!form.firstName || !form.lastName || !form.phone) return;
    onAdd({
      id: Math.random().toString(36).substring(2, 11), type: form.isBiz ? "business" : "individual",
      firstName: form.firstName, lastName: form.lastName, companyName: form.isBiz ? form.companyName : undefined,
      nip: form.isBiz ? form.nip : undefined, street: form.street, postalCode: form.postalCode,
      city: form.city, phone: form.phone, email: form.email, source: form.source, isB2B: form.isBiz, createdAt: new Date().toISOString(),
    });
    onClose();
    setForm({ firstName: "", lastName: "", companyName: "", nip: "", phone: "", email: "", city: "", street: "", postalCode: "", source: "google", isBiz: false });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl">
        <DialogHeader><DialogTitle>Nowy klient</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={form.isBiz} onChange={e => setForm({ ...form, isBiz: e.target.checked })} className="rounded" />
            Klient firmowy (B2B)
          </label>
          {form.isBiz && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs text-muted-foreground">Firma</Label><Input className="rounded-xl mt-1" value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} /></div>
              <div><Label className="text-xs text-muted-foreground">NIP</Label><Input className="rounded-xl mt-1" value={form.nip} onChange={e => setForm({ ...form, nip: e.target.value })} placeholder="Pobierz dane z GUS" /></div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs text-muted-foreground">Imię *</Label><Input className="rounded-xl mt-1" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} /></div>
            <div><Label className="text-xs text-muted-foreground">Nazwisko *</Label><Input className="rounded-xl mt-1" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs text-muted-foreground">Telefon *</Label><Input className="rounded-xl mt-1" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+48 600 600 600" /></div>
            <div><Label className="text-xs text-muted-foreground">Email</Label><Input className="rounded-xl mt-1" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label className="text-xs text-muted-foreground">Ulica</Label><Input className="rounded-xl mt-1" value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} /></div>
            <div><Label className="text-xs text-muted-foreground">Kod pocztowy</Label><Input className="rounded-xl mt-1" value={form.postalCode} onChange={e => setForm({ ...form, postalCode: e.target.value })} /></div>
            <div><Label className="text-xs text-muted-foreground">Miasto</Label><Input className="rounded-xl mt-1" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Skąd o nas wie?</Label>
            <Select value={form.source} onValueChange={v => setForm({ ...form, source: v as Customer["source"] })}>
              <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="google">Google</SelectItem><SelectItem value="social_media">Social Media</SelectItem>
                <SelectItem value="polecenie">Polecenie</SelectItem><SelectItem value="b2b">B2B</SelectItem><SelectItem value="przypadkowo">Przypadkowo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="rounded-xl">Anuluj</Button>
            <Button onClick={handleSubmit} className="rounded-xl" disabled={!form.firstName || !form.lastName || !form.phone}>Dodaj klienta</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
