"use client";

import { useState } from "react";
import { useOrders, useComplaints } from "@/hooks/use-store";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, AlertCircle, RotateCcw, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Complaint } from "@/types";

export default function ComplaintsPage() {
  const { items: orders, mounted } = useOrders();
  const { items: complaints, add: addComplaint, update: updateComplaint } = useComplaints();
  const [showNew, setShowNew] = useState(false);

  if (!mounted) return <div className="animate-pulse space-y-4"><div className="h-8 w-48 bg-muted rounded-lg" /><div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded-xl" />)}</div></div>;

  const statusColors = { otwarta: "text-red-600 bg-red-50", w_trakcie: "text-amber-600 bg-amber-50", zamknieta: "text-green-600 bg-green-50" };
  const statusLabels = { otwarta: "Otwarta", w_trakcie: "W trakcie", zamknieta: "Zamknięta" };

  return (
    <div className="page-transition">
      <PageHeader title="Reklamacje i zwroty" description={`${complaints.length} zgłoszeń`}
        action={<Button onClick={() => setShowNew(true)} className="rounded-xl gap-2"><Plus className="w-4 h-4" />Nowe zgłoszenie</Button>} />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-4 text-center">
          <AlertCircle className="w-5 h-5 text-red-500 mx-auto mb-1" />
          <p className="text-xl font-bold">{complaints.filter(c => c.status === "otwarta").length}</p>
          <p className="text-xs text-muted-foreground">Otwarte</p>
        </div>
        <div className="glass-card p-4 text-center">
          <RotateCcw className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <p className="text-xl font-bold">{complaints.filter(c => c.status === "w_trakcie").length}</p>
          <p className="text-xs text-muted-foreground">W trakcie</p>
        </div>
        <div className="glass-card p-4 text-center">
          <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <p className="text-xl font-bold">{complaints.filter(c => c.status === "zamknieta").length}</p>
          <p className="text-xs text-muted-foreground">Zamknięte</p>
        </div>
      </div>

      <div className="glass-card divide-y divide-border/50">
        {complaints.length === 0 ? (
          <div className="p-12 text-center"><p className="text-muted-foreground">Brak zgłoszeń reklamacyjnych</p></div>
        ) : complaints.map(c => (
          <div key={c.id} className="p-4 first:rounded-t-2xl last:rounded-b-2xl">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{c.type === "reklamacja" ? "Reklamacja" : "Zwrot"} — {c.originalOrderNumber}</p>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColors[c.status]}`}>{statusLabels[c.status]}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
              </div>
              <div className="flex gap-1.5">
                {c.status !== "zamknieta" && (
                  <>
                    {c.status === "otwarta" && <Button variant="outline" size="sm" className="rounded-xl text-xs h-7" onClick={() => updateComplaint(c.id, { status: "w_trakcie" })}>Rozpocznij</Button>}
                    <Button variant="outline" size="sm" className="rounded-xl text-xs h-7" onClick={() => updateComplaint(c.id, { status: "zamknieta", resolvedAt: new Date().toISOString() })}>Zamknij</Button>
                  </>
                )}
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Zgłoszono: {format(new Date(c.createdAt), "d MMM yyyy HH:mm", { locale: pl })}
              {c.resolvedAt && ` · Rozwiązano: ${format(new Date(c.resolvedAt), "d MMM yyyy", { locale: pl })}`}
            </p>
          </div>
        ))}
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl">
          <DialogHeader><DialogTitle>Nowe zgłoszenie</DialogTitle></DialogHeader>
          <NewComplaintForm orders={orders} onAdd={c => { addComplaint(c); setShowNew(false); }} onClose={() => setShowNew(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NewComplaintForm({ orders, onAdd, onClose }: { orders: { id: string; orderNumber: string }[]; onAdd: (c: Complaint) => void; onClose: () => void }) {
  const [form, setForm] = useState({ orderId: "", type: "reklamacja" as "reklamacja" | "zwrot", description: "" });
  const order = orders.find(o => o.id === form.orderId);
  return (
    <div className="space-y-4 mt-2">
      <div>
        <Label className="text-xs text-muted-foreground">Zlecenie</Label>
        <Select value={form.orderId} onValueChange={v => setForm({ ...form, orderId: v })}>
          <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Wybierz zlecenie" /></SelectTrigger>
          <SelectContent>{orders.slice(0, 20).map(o => <SelectItem key={o.id} value={o.id}>{o.orderNumber}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Typ</Label>
        <Select value={form.type} onValueChange={v => setForm({ ...form, type: v as "reklamacja" | "zwrot" })}>
          <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="reklamacja">Reklamacja</SelectItem><SelectItem value="zwrot">Zwrot</SelectItem></SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Opis problemu</Label>
        <Textarea className="rounded-xl mt-1 min-h-[60px]" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} className="rounded-xl">Anuluj</Button>
        <Button onClick={() => onAdd({ id: Math.random().toString(36).substring(2, 11), originalOrderId: form.orderId, originalOrderNumber: order?.orderNumber || "", type: form.type, description: form.description, status: "otwarta", createdAt: new Date().toISOString() })} className="rounded-xl" disabled={!form.orderId || !form.description}>Dodaj</Button>
      </div>
    </div>
  );
}
