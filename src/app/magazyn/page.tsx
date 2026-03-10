"use client";

import { useState } from "react";
import { useInventory, useUsedDevices } from "@/hooks/use-store";
import { PageHeader } from "@/components/shared/page-header";
import { InventoryItem, UsedDevice } from "@/types";
import { PART_CATEGORIES, LOCATIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, AlertTriangle, Package, Minus, MapPin, ArrowLeftRight, Apple, Smartphone, Tag } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

type TabType = "czesci" | "sprzety" | "akcesoria";

export default function InventoryPage() {
  const { items: inventory, mounted, add, update } = useInventory();
  const { items: usedDevices, add: addUsedDevice } = useUsedDevices();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [showNew, setShowNew] = useState(false);
  const [tab, setTab] = useState<TabType>("czesci");
  const [usedDeviceFilter, setUsedDeviceFilter] = useState<"all" | "do_sprzedania" | "na_czesci">("all");

  if (!mounted) return <div className="animate-pulse space-y-6"><div className="h-8 w-48 bg-muted rounded-lg" /><div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-muted rounded-xl" />)}</div></div>;

  const lowStockCount = inventory.filter(i => i.quantity <= i.minQuantity).length;
  const totalValue = inventory.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const accessories = inventory.filter(i => i.category === "Akcesoria");
  const parts = inventory.filter(i => i.category !== "Akcesoria");

  const filtered = (tab === "akcesoria" ? accessories : parts)
    .filter(i => category === "all" || i.category === category)
    .filter(i => locationFilter === "all" || i.locationId === locationFilter)
    .filter(i => { if (!search) return true; const q = search.toLowerCase(); return i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q); })
    .sort((a, b) => (a.quantity <= a.minQuantity ? 0 : 1) - (b.quantity <= b.minQuantity ? 0 : 1));

  const filteredUsedDevices = usedDevices
    .filter(d => usedDeviceFilter === "all" || d.type === usedDeviceFilter)
    .filter(d => locationFilter === "all" || d.locationId === locationFilter)
    .filter(d => { if (!search) return true; const q = search.toLowerCase(); return d.model.toLowerCase().includes(q) || d.serialNumber.toLowerCase().includes(q); });

  const adjustQuantity = (id: string, delta: number) => {
    const item = inventory.find(i => i.id === id);
    if (!item) return;
    update(id, { quantity: Math.max(0, item.quantity + delta), updatedAt: new Date().toISOString() });
  };

  return (
    <div className="page-transition">
      <PageHeader title="Magazyn" description={`${inventory.length} pozycji · ${usedDevices.length} sprzętów · Wartość: ${(totalValue / 1000).toFixed(1)}k zł`}
        action={<Button onClick={() => setShowNew(true)} className="rounded-xl gap-2"><Plus className="w-4 h-4" />Dodaj</Button>} />

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-secondary rounded-xl p-1 w-fit">
        {([
          { value: "czesci" as TabType, label: "Części zamienne", icon: Package },
          { value: "sprzety" as TabType, label: "Sprzęty używane", icon: Smartphone },
          { value: "akcesoria" as TabType, label: "Akcesoria", icon: Tag },
        ]).map(t => (
          <button key={t.value} onClick={() => { setTab(t.value); setCategory("all"); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === t.value ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <t.icon className="w-3 h-3" />{t.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="glass-card p-4 text-center">
          <p className="text-xl font-bold">{parts.length}</p>
          <p className="text-[10px] text-muted-foreground">Części zamiennych</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xl font-bold text-orange-600">{lowStockCount}</p>
          <p className="text-[10px] text-muted-foreground">Niski stan</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xl font-bold">{usedDevices.length}</p>
          <p className="text-[10px] text-muted-foreground">Sprzętów używanych</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-xl font-bold">{(inventory.reduce((s, i) => s + i.quantity * i.costPrice, 0) / 1000).toFixed(1)}k</p>
          <p className="text-[10px] text-muted-foreground">Wartość (zakup)</p>
        </div>
      </div>

      {lowStockCount > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/30 mb-5">
          <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
          <p className="text-xs"><span className="font-medium text-orange-700 dark:text-orange-400">{lowStockCount} pozycji</span> <span className="text-orange-600/70 dark:text-orange-400/70">wymaga uzupełnienia zapasów</span></p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Szukaj: nazwa, SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-xl" />
        </div>
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-44 rounded-xl"><MapPin className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie lokalizacje</SelectItem>
            {LOCATIONS.map(l => <SelectItem key={l.id} value={l.id}>{l.name.replace("AppleHome ", "")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {tab === "sprzety" ? (
        /* ── Used Devices ── */
        <>
          <div className="flex gap-1 mb-5">
            {(["all", "do_sprzedania", "na_czesci"] as const).map(f => (
              <button key={f} onClick={() => setUsedDeviceFilter(f)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${usedDeviceFilter === f ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent"}`}>
                {f === "all" ? "Wszystkie" : f === "do_sprzedania" ? "Do sprzedania" : "Na części"}
                <span className="text-[9px] opacity-70 ml-1">
                  {f === "all" ? usedDevices.length : usedDevices.filter(d => d.type === f).length}
                </span>
              </button>
            ))}
          </div>

          <div className="glass-card divide-y divide-border/50">
            {filteredUsedDevices.length === 0 ? (
              <div className="p-12 text-center"><Smartphone className="w-8 h-8 text-muted-foreground mx-auto mb-2" /><p className="text-muted-foreground">Brak sprzętów</p></div>
            ) : filteredUsedDevices.map(device => {
              const loc = LOCATIONS.find(l => l.id === device.locationId);
              return (
                <div key={device.id} className="flex items-center justify-between p-3.5 first:rounded-t-2xl last:rounded-b-2xl">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${device.type === "do_sprzedania" ? "bg-green-100 dark:bg-green-900/30 text-green-600" : "bg-orange-100 dark:bg-orange-900/30 text-orange-600"}`}>
                      <Apple className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{device.model}</p>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${device.type === "do_sprzedania" ? "bg-green-100 dark:bg-green-900/30 text-green-700" : "bg-orange-100 dark:bg-orange-900/30 text-orange-700"}`}>
                          {device.type === "do_sprzedania" ? "DO SPRZEDANIA" : "NA CZĘŚCI"}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        SN: {device.serialNumber} · {loc?.name.replace("AppleHome ", "")}
                        {device.batteryCondition && ` · Bateria: ${device.batteryCondition}`}
                        {device.isWorking !== undefined && ` · ${device.isWorking ? "Sprawny" : "Niesprawny"}`}
                        {device.hasICloud && " · iCloud!"}
                      </p>
                      {device.issue && <p className="text-[10px] text-red-500">{device.issue}</p>}
                      {device.originOrderNumber && <p className="text-[9px] text-muted-foreground/60">Z naprawy: {device.originOrderNumber}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {device.price && <p className="text-sm font-semibold">{device.price} zł</p>}
                    <p className="text-[10px] text-muted-foreground">{format(new Date(device.createdAt), "d MMM", { locale: pl })}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* ── Parts / Accessories ── */
        <>
          <div className="flex gap-1 mb-5 overflow-x-auto pb-2 -mx-1 px-1">
            {["all", ...(tab === "akcesoria" ? ["Akcesoria"] : PART_CATEGORIES.filter(c => c !== "Akcesoria"))].map(cat => {
              const items = tab === "akcesoria" ? accessories : parts;
              const count = cat === "all" ? items.length : items.filter(i => i.category === cat).length;
              return (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${category === cat ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent"}`}>
                  {cat === "all" ? "Wszystkie" : cat} <span className="text-[9px] opacity-70">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="glass-card divide-y divide-border/50">
            {filtered.length === 0 ? (
              <div className="p-12 text-center"><Package className="w-8 h-8 text-muted-foreground mx-auto mb-2" /><p className="text-muted-foreground">Brak części</p></div>
            ) : filtered.map(item => {
              const isLow = item.quantity <= item.minQuantity;
              const loc = LOCATIONS.find(l => l.id === item.locationId);
              const margin = Math.round(((item.unitPrice - item.costPrice) / item.unitPrice) * 100);
              return (
                <div key={item.id} className={`flex items-center justify-between p-3.5 first:rounded-t-2xl last:rounded-b-2xl ${isLow ? "bg-orange-50/50 dark:bg-orange-950/10" : ""}`}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isLow ? "bg-orange-100 dark:bg-orange-900/30 text-orange-600" : "bg-secondary text-muted-foreground"}`}>
                      <Apple className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        {isLow && <AlertTriangle className="w-3 h-3 text-orange-500 flex-shrink-0" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {item.sku} · {item.category} · {loc?.name.replace("AppleHome ", "")} · {item.supplier}
                        <span className="ml-1 text-muted-foreground/60">Marża: {margin}%</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-medium">{item.unitPrice} zł</p>
                      <p className="text-[10px] text-muted-foreground">Koszt: {item.costPrice} zł</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => adjustQuantity(item.id, -1)} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-accent transition-colors"><Minus className="w-3 h-3" /></button>
                      <span className={`w-8 text-center text-sm font-semibold ${isLow ? "text-orange-600" : ""}`}>{item.quantity}</span>
                      <button onClick={() => adjustQuantity(item.id, 1)} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center hover:bg-accent transition-colors"><Plus className="w-3 h-3" /></button>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 hidden sm:flex" title="Przesuń do innej lokalizacji">
                      <ArrowLeftRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <NewPartDialog open={showNew} onClose={() => setShowNew(false)} onAdd={add} />
    </div>
  );
}

function NewPartDialog({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (item: InventoryItem) => void }) {
  const [form, setForm] = useState({ name: "", sku: "", category: PART_CATEGORIES[0], quantity: "", minQuantity: "2", unitPrice: "", costPrice: "", supplier: "", locationId: LOCATIONS[0].id });
  const handleSubmit = () => {
    if (!form.name || !form.sku || !form.unitPrice) return;
    onAdd({
      id: Math.random().toString(36).substring(2, 11), name: form.name, sku: form.sku, category: form.category,
      deviceCategory: "iPhone", compatibleModels: [], quantity: Number(form.quantity) || 0, minQuantity: Number(form.minQuantity) || 2,
      unitPrice: Number(form.unitPrice), costPrice: Number(form.costPrice) || 0, supplier: form.supplier,
      locationId: form.locationId, history: [], updatedAt: new Date().toISOString(),
    });
    onClose();
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl">
        <DialogHeader><DialogTitle>Nowa część</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div><Label className="text-xs text-muted-foreground">Nazwa</Label><Input className="rounded-xl mt-1" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="np. Wyświetlacz iPhone 15 Pro" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs text-muted-foreground">SKU</Label><Input className="rounded-xl mt-1" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} /></div>
            <div><Label className="text-xs text-muted-foreground">Kategoria</Label>
              <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}><SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{PART_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div><Label className="text-xs text-muted-foreground">Ilość</Label><Input className="rounded-xl mt-1" type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} /></div>
            <div><Label className="text-xs text-muted-foreground">Min.</Label><Input className="rounded-xl mt-1" type="number" value={form.minQuantity} onChange={e => setForm({ ...form, minQuantity: e.target.value })} /></div>
            <div><Label className="text-xs text-muted-foreground">Cena (zł)</Label><Input className="rounded-xl mt-1" type="number" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })} /></div>
            <div><Label className="text-xs text-muted-foreground">Koszt (zł)</Label><Input className="rounded-xl mt-1" type="number" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs text-muted-foreground">Dostawca</Label><Input className="rounded-xl mt-1" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} /></div>
            <div><Label className="text-xs text-muted-foreground">Lokalizacja</Label>
              <Select value={form.locationId} onValueChange={v => setForm({ ...form, locationId: v })}><SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{LOCATIONS.map(l => <SelectItem key={l.id} value={l.id}>{l.name.replace("AppleHome ", "")}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={onClose} className="rounded-xl">Anuluj</Button><Button onClick={handleSubmit} className="rounded-xl" disabled={!form.name || !form.sku || !form.unitPrice}>Dodaj</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
