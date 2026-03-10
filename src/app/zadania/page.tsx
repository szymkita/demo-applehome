"use client";

import { useState } from "react";
import { useTasks } from "@/hooks/use-store";
import { PageHeader } from "@/components/shared/page-header";
import { EMPLOYEES } from "@/lib/constants";
import { Task } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Check, Circle, Calendar, User } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { pl } from "date-fns/locale";

export default function TasksPage() {
  const { items: tasks, mounted, add, update } = useTasks();
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");

  if (!mounted) return <div className="animate-pulse space-y-4"><div className="h-8 w-48 bg-muted rounded-lg" /><div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-xl" />)}</div></div>;

  const filtered = tasks.filter(t => filter === "all" || (filter === "active" ? !t.completed : t.completed))
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

  const toggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) update(id, { completed: !task.completed });
  };

  return (
    <div className="page-transition">
      <PageHeader title="Zadania" description={`${tasks.filter(t => !t.completed).length} aktywnych · ${tasks.filter(t => t.completed).length} ukończonych`}
        action={<Button onClick={() => setShowNew(true)} className="rounded-xl gap-2"><Plus className="w-4 h-4" />Nowe zadanie</Button>} />

      <div className="flex gap-1 mb-6">
        {(["all", "active", "done"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}>
            {f === "all" ? "Wszystkie" : f === "active" ? "Aktywne" : "Ukończone"}
          </button>
        ))}
      </div>

      <div className="glass-card divide-y divide-border/50">
        {filtered.length === 0 ? (
          <div className="p-12 text-center"><p className="text-muted-foreground">Brak zadań</p></div>
        ) : filtered.map(task => {
          const emp = EMPLOYEES.find(e => e.id === task.assignedTo);
          const overdue = !task.completed && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
          return (
            <div key={task.id} className={`flex items-center gap-3 p-4 first:rounded-t-2xl last:rounded-b-2xl ${overdue ? "bg-red-50/50 dark:bg-red-950/10" : ""}`}>
              <button onClick={() => toggleTask(task.id)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${task.completed ? "bg-green-500 border-green-500 text-white" : "border-muted-foreground/30 hover:border-primary"}`}>
                {task.completed && <Check className="w-3 h-3" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}>{task.title}</p>
                <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1"><User className="w-3 h-3" />{emp?.name || "—"}</span>
                  <span className={`flex items-center gap-1 ${overdue ? "text-red-500 font-medium" : ""}`}>
                    <Calendar className="w-3 h-3" />{format(new Date(task.dueDate), "d MMM", { locale: pl })}
                    {overdue && " (po terminie)"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <NewTaskDialog open={showNew} onClose={() => setShowNew(false)} onAdd={add} />
    </div>
  );
}

function NewTaskDialog({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (t: Task) => void }) {
  const [form, setForm] = useState({ title: "", assignedTo: EMPLOYEES[0].id, dueDate: format(new Date(), "yyyy-MM-dd") });
  const handleSubmit = () => {
    if (!form.title) return;
    onAdd({ id: Math.random().toString(36).substring(2, 11), title: form.title, assignedTo: form.assignedTo, dueDate: new Date(form.dueDate).toISOString(), completed: false, createdAt: new Date().toISOString() });
    onClose();
    setForm({ title: "", assignedTo: EMPLOYEES[0].id, dueDate: format(new Date(), "yyyy-MM-dd") });
  };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] rounded-2xl">
        <DialogHeader><DialogTitle>Nowe zadanie</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div><Label className="text-xs text-muted-foreground">Tytuł</Label><Input className="rounded-xl mt-1" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label className="text-xs text-muted-foreground">Przypisz do</Label>
            <Select value={form.assignedTo} onValueChange={v => setForm({ ...form, assignedTo: v })}>
              <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{EMPLOYEES.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs text-muted-foreground">Termin</Label><Input className="rounded-xl mt-1" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={onClose} className="rounded-xl">Anuluj</Button><Button onClick={handleSubmit} className="rounded-xl" disabled={!form.title}>Dodaj</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
