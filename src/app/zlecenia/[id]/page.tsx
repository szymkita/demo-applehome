"use client";

import { useOrders, useUsedDevices, usePartOrders } from "@/hooks/use-store";
import { StatusBadge } from "@/components/shared/status-badge";
import { STATUS_CONFIG, PRIORITY_CONFIG, LOCATIONS, EMPLOYEES, REPAIR_TYPES, IPHONE_TESTS, MACBOOK_TESTS, SMS_TEMPLATES, CASH_REGISTERS, EXTERNAL_LINKS } from "@/lib/constants";
import { Order, OrderStatus, TestReport, TestItem, UsedDevice, PartOrder } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft, User, Smartphone, FileText, Clock, Hash, Wrench,
  AlertCircle, MapPin, Shield, Package, Camera, MessageSquare,
  Send, Printer, CreditCard, Phone, CheckCircle2,
  ExternalLink, ShoppingCart, Banknote, TestTube,
  ChevronDown, ChevronRight, Play, Eye, Zap, Truck,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format, differenceInHours } from "date-fns";
import { pl } from "date-fns/locale";
import { useState } from "react";

const STATUS_FLOW: OrderStatus[] = [
  "oczekuje_na_diagnoze", "w_trakcie_diagnozy", "oczekuje_na_akceptacje",
  "w_trakcie_naprawy", "oczekuje_na_czesci", "w_trakcie_testow", "gotowy_do_odbioru", "odebrany",
];

// Phase helpers
type Phase = "przyjecie" | "diagnoza" | "naprawa" | "kontrola" | "wydanie" | "zamkniete";
function getPhase(status: OrderStatus): Phase {
  if (["oczekuje_na_diagnoze"].includes(status)) return "przyjecie";
  if (["w_trakcie_diagnozy", "oczekuje_na_akceptacje"].includes(status)) return "diagnoza";
  if (["w_trakcie_naprawy", "oczekuje_na_czesci"].includes(status)) return "naprawa";
  if (["w_trakcie_testow"].includes(status)) return "kontrola";
  if (["gotowy_do_odbioru"].includes(status)) return "wydanie";
  return "zamkniete";
}

const PHASE_CONFIG: Record<Phase, { label: string; color: string; bg: string }> = {
  przyjecie: { label: "Przyjęcie", color: "text-blue-700", bg: "bg-blue-50 dark:bg-blue-950/40" },
  diagnoza: { label: "Diagnoza", color: "text-indigo-700", bg: "bg-indigo-50 dark:bg-indigo-950/40" },
  naprawa: { label: "Naprawa", color: "text-amber-700", bg: "bg-amber-50 dark:bg-amber-950/40" },
  kontrola: { label: "Kontrola jakości", color: "text-cyan-700", bg: "bg-cyan-50 dark:bg-cyan-950/40" },
  wydanie: { label: "Wydanie", color: "text-green-700", bg: "bg-green-50 dark:bg-green-950/40" },
  zamkniete: { label: "Zakończone", color: "text-slate-600", bg: "bg-slate-100 dark:bg-slate-800/40" },
};

// What's the next recommended action for each status?
function getNextStepInfo(order: Order): { title: string; description: string; action?: string; variant?: "default" | "primary" } | null {
  switch (order.status) {
    case "oczekuje_na_diagnoze":
      return {
        title: !order.testBefore ? "Wykonaj test wejściowy" : "Rozpocznij diagnozę",
        description: !order.testBefore ? "Przetestuj urządzenie przed rozpoczęciem pracy" : "Urządzenie przetestowane — możesz rozpocząć diagnostykę",
        action: !order.testBefore ? "test_before" : "w_trakcie_diagnozy",
      };
    case "w_trakcie_diagnozy":
      return {
        title: "Zakończ diagnostykę",
        description: "Uzupełnij diagnozę i wycenę, następnie wyślij do akceptacji klienta",
        action: "oczekuje_na_akceptacje",
      };
    case "oczekuje_na_akceptacje":
      return {
        title: "Skontaktuj się z klientem",
        description: "Klient musi zaakceptować koszt naprawy. Wyślij SMS z wyceną lub zadzwoń.",
        action: "sms_wycena",
      };
    case "w_trakcie_naprawy":
      return {
        title: "Dokończ naprawę",
        description: "Po zakończeniu naprawy przejdź do testów kontrolnych",
        action: "w_trakcie_testow",
      };
    case "oczekuje_na_czesci":
      return {
        title: "Oczekiwanie na części",
        description: "Gdy części dotrą, wróć do naprawy",
        action: "w_trakcie_naprawy",
      };
    case "w_trakcie_testow":
      return {
        title: !order.testAfter ? "Wykonaj test końcowy" : "Oznacz jako gotowe",
        description: !order.testAfter ? "Przetestuj urządzenie po naprawie" : "Testy zakończone — urządzenie gotowe do odbioru",
        action: !order.testAfter ? "test_after" : "gotowy_do_odbioru",
      };
    case "gotowy_do_odbioru":
      return {
        title: order.isPaid ? "Wydaj urządzenie" : "Przyjmij płatność",
        description: order.isPaid ? `Kod odbioru: ${order.pickupCode}` : "Przyjmij płatność i wydaj urządzenie klientowi",
        action: order.isPaid ? "odebrany" : "payment",
      };
    default:
      return null;
  }
}

// Relevant SMS templates per status
function getRelevantSms(status: OrderStatus): string[] {
  switch (status) {
    case "oczekuje_na_diagnoze": return ["sms1"];
    case "oczekuje_na_akceptacje": return ["sms2", "sms7"];
    case "oczekuje_na_czesci": return ["sms3", "sms4", "sms5"];
    case "gotowy_do_odbioru": return ["sms6", "sms8"];
    case "odebrany": return ["sms9"];
    default: return ["sms7", "sms8"];
  }
}

export default function OrderDetailPage() {
  const params = useParams();
  const { items: orders, mounted, update } = useOrders();
  const { add: addUsedDevice } = useUsedDevices();
  const { add: addPartOrder } = usePartOrders();
  const [note, setNote] = useState("");
  const [sentSms, setSentSms] = useState<string[]>([]);
  const [showTestDialog, setShowTestDialog] = useState<"before" | "after" | null>(null);
  const [showBuybackDialog, setShowBuybackDialog] = useState(false);
  const [showPartOrderDialog, setShowPartOrderDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showAllSms, setShowAllSms] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  if (!mounted) return <div className="animate-pulse space-y-6"><div className="h-8 w-48 bg-muted rounded-lg" /><div className="h-64 bg-muted rounded-2xl" /></div>;

  const order = orders.find((o) => o.id === params.id);
  if (!order) return (
    <div className="page-transition text-center py-20">
      <p className="text-muted-foreground">Zlecenie nie zostało znalezione</p>
      <Link href="/zlecenia" className="text-primary text-sm mt-2 inline-block hover:underline">Wróć do listy</Link>
    </div>
  );

  const loc = LOCATIONS.find(l => l.id === order.locationId);
  const tech = EMPLOYEES.find(e => e.id === order.assignedTo);
  const receiver = EMPLOYEES.find(e => e.id === order.receivedBy);
  const phase = getPhase(order.status);
  const isTerminal = ["anulowany", "zutylizowany", "odkupiony", "odebrany"].includes(order.status);
  const nextStep = getNextStepInfo(order);

  const changeStatus = (newStatus: OrderStatus) => {
    const now = new Date().toISOString();
    const patch: Partial<Order> = {
      status: newStatus,
      updatedAt: now,
      statusHistory: [...order.statusHistory, {
        status: newStatus, timestamp: now,
        note: note || `Status zmieniony na: ${STATUS_CONFIG[newStatus].label}`,
        userName: "Marek Kowalski", locationId: order.locationId,
      }],
    };
    if (newStatus === "gotowy_do_odbioru" && !order.completedAt) {
      patch.completedAt = now;
      patch.finalCost = order.estimatedCost || 0;
      if (tech) patch.commission = Math.floor((order.estimatedCost || 0) * tech.commissionRate);
    }
    update(order.id, patch);
    setNote("");
    if (newStatus === "odkupiony") setShowBuybackDialog(true);
  };

  const addNote = () => {
    if (!note.trim()) return;
    const now = new Date().toISOString();
    update(order.id, {
      updatedAt: now,
      notes: [...order.notes, { id: Math.random().toString(36).substring(2), text: note, author: "Marek Kowalski", createdAt: now }],
    });
    setNote("");
  };

  const simulateSms = (templateId: string) => {
    setSentSms(prev => [...prev, templateId]);
    setTimeout(() => setSentSms(prev => prev.filter(id => id !== templateId)), 3000);
  };

  const saveTestReport = (report: TestReport) => {
    const key = report.type === "before" ? "testBefore" : "testAfter";
    update(order.id, {
      [key]: report,
      updatedAt: new Date().toISOString(),
      statusHistory: [...order.statusHistory, {
        status: order.status, timestamp: new Date().toISOString(),
        note: `Wykonano test ${report.type === "before" ? "przed" : "po"} naprawą`,
        userName: "Marek Kowalski", locationId: order.locationId,
      }],
    });
    setShowTestDialog(null);
  };

  const handlePayment = (method: string, register: string) => {
    update(order.id, {
      isPaid: true,
      paymentMethod: method as Order["paymentMethod"],
      cashRegister: register as Order["cashRegister"],
      updatedAt: new Date().toISOString(),
      statusHistory: [...order.statusHistory, {
        status: order.status, timestamp: new Date().toISOString(),
        note: `Przyjęto płatność: ${CASH_REGISTERS[register as keyof typeof CASH_REGISTERS] || register}`,
        userName: "Marek Kowalski", locationId: order.locationId,
      }],
    });
    setShowPaymentDialog(false);
  };

  const currentIdx = STATUS_FLOW.indexOf(order.status);
  const nextStatuses: OrderStatus[] = isTerminal ? [] : (() => {
    const available: OrderStatus[] = [];
    if (currentIdx >= 0) {
      // Only suggest the NEXT logical status as primary, rest are secondary
      const nextIdx = currentIdx + 1;
      if (nextIdx < STATUS_FLOW.length) available.push(STATUS_FLOW[nextIdx]);
    }
    if (order.status === "oczekuje_na_czesci" && !available.includes("w_trakcie_naprawy")) {
      available.unshift("w_trakcie_naprawy");
    }
    if (order.status === "gotowy_do_odbioru") {
      available.push("odkupiony", "zutylizowany");
    }
    if (order.status !== "odebrany") {
      available.push("anulowany");
    }
    return available;
  })();

  // Merge notes and statusHistory into one unified timeline
  const timeline = [
    ...order.statusHistory.map(h => ({
      type: "status" as const,
      timestamp: h.timestamp,
      status: h.status,
      note: h.note,
      userName: h.userName,
    })),
    ...order.notes.map(n => ({
      type: "note" as const,
      timestamp: n.createdAt,
      note: n.text,
      userName: n.author,
      status: null,
    })),
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const receiveLabels: Record<string, string> = { osobiscie: "Osobiście", door_to_door: "Door to door", wysylka_wlasna: "Wysyłka własna" };

  // Time in current status
  const lastStatusChange = order.statusHistory[order.statusHistory.length - 1];
  const hoursInStatus = lastStatusChange ? differenceInHours(new Date(), new Date(lastStatusChange.timestamp)) : 0;

  // Relevant SMS for current status
  const relevantSmsIds = getRelevantSms(order.status);
  const relevantSms = SMS_TEMPLATES.filter(t => relevantSmsIds.includes(t.id));
  const otherSms = SMS_TEMPLATES.filter(t => !relevantSmsIds.includes(t.id));

  return (
    <div className="page-transition">
      <Link href="/zlecenia" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
        <ArrowLeft className="w-4 h-4" /> Zlecenia
      </Link>

      {/* ═══ HEADER ═══ */}
      <div className="glass-card p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight">{order.deviceModel}</h1>
              <StatusBadge status={order.status} />
              {order.isWarranty && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">GWARANCJA</span>}
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PRIORITY_CONFIG[order.priority].bg} ${PRIORITY_CONFIG[order.priority].color}`}>{PRIORITY_CONFIG[order.priority].label}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span className="font-mono font-medium text-foreground">{order.orderNumber}</span>
              <span>{order.customerName}</span>
              <span>{order.customerPhone}</span>
              <span>{loc?.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            {order.pickupCode && (
              <div className="text-center">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Kod odbioru</p>
                <p className="font-mono font-bold text-lg bg-secondary px-3 py-1 rounded-lg">{order.pickupCode}</p>
              </div>
            )}
            <div className="text-right">
              <p className="text-2xl font-bold">{order.finalCost || order.estimatedCost || "—"} <span className="text-sm font-normal text-muted-foreground">zł</span></p>
              <p className={`text-[10px] font-medium ${order.isPaid ? "text-green-600" : "text-red-500"}`}>{order.isPaid ? "Opłacone" : "Nieopłacone"}</p>
            </div>
          </div>
        </div>

        {/* Progress stepper */}
        <div className="flex items-center gap-0.5 mt-4 pt-4 border-t border-border/50 overflow-x-auto pb-1">
          {STATUS_FLOW.filter(s => s !== "oczekuje_na_czesci").map((s, i, arr) => {
            const effectiveIdx = currentIdx >= 0 ? currentIdx : (() => {
              const lastFlowEntry = [...order.statusHistory].reverse().find(h => STATUS_FLOW.includes(h.status));
              return lastFlowEntry ? STATUS_FLOW.indexOf(lastFlowEntry.status) : -1;
            })();
            const sIdx = STATUS_FLOW.indexOf(s);
            const isCompleted = effectiveIdx > sIdx;
            const isCurrent = order.status === s;
            return (
              <div key={s} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center flex-1 min-w-0">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${
                    isCurrent ? `${STATUS_CONFIG[s].dotColor} text-white ring-2 ring-offset-2 ring-offset-card ${STATUS_CONFIG[s].dotColor.replace("bg-", "ring-")}` :
                    isCompleted ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    {isCompleted ? "✓" : i + 1}
                  </div>
                  <span className={`text-[7px] mt-1 text-center leading-tight truncate w-full px-0.5 ${isCurrent ? "font-bold text-foreground" : "text-muted-foreground"}`}>
                    {STATUS_CONFIG[s].label.replace("Oczekuje na ", "").replace("W trakcie ", "").replace("Gotowy do ", "")}
                  </span>
                </div>
                {i < arr.length - 1 && <div className={`w-full h-[2px] min-w-[8px] flex-shrink mt-[-10px] ${isCompleted ? "bg-green-500" : "bg-muted"}`} />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ═══ LEFT COLUMN ═══ */}
        <div className="lg:col-span-2 space-y-4">

          {/* ─── NEXT STEP BANNER ─── */}
          {nextStep && !isTerminal && (
            <div className={`rounded-2xl p-5 border-2 ${
              phase === "przyjecie" ? "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20" :
              phase === "diagnoza" ? "border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20" :
              phase === "naprawa" ? "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20" :
              phase === "kontrola" ? "border-cyan-200 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-950/20" :
              "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20"
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${PHASE_CONFIG[phase].color}`}>
                  {PHASE_CONFIG[phase].label}
                </span>
                {hoursInStatus > 0 && (
                  <span className="text-[10px] text-muted-foreground">· {hoursInStatus < 24 ? `${hoursInStatus}h` : `${Math.floor(hoursInStatus / 24)}d`} w tym statusie</span>
                )}
              </div>
              <h2 className="text-base font-bold mb-1">{nextStep.title}</h2>
              <p className="text-sm text-muted-foreground mb-3">{nextStep.description}</p>
              <div className="flex flex-wrap gap-2">
                {nextStep.action === "test_before" && (
                  <Button className="rounded-xl gap-2" onClick={() => setShowTestDialog("before")}>
                    <TestTube className="w-4 h-4" />Wykonaj test wejściowy
                  </Button>
                )}
                {nextStep.action === "test_after" && (
                  <Button className="rounded-xl gap-2" onClick={() => setShowTestDialog("after")}>
                    <TestTube className="w-4 h-4" />Wykonaj test końcowy
                  </Button>
                )}
                {nextStep.action === "payment" && (
                  <Button className="rounded-xl gap-2" onClick={() => setShowPaymentDialog(true)}>
                    <Banknote className="w-4 h-4" />Przyjmij płatność
                  </Button>
                )}
                {nextStep.action === "sms_wycena" && (
                  <>
                    <Button className="rounded-xl gap-2" onClick={() => simulateSms("sms2")}>
                      <Send className="w-4 h-4" />Wyślij SMS z wyceną
                    </Button>
                    <Button variant="outline" className="rounded-xl gap-2" onClick={() => changeStatus("w_trakcie_naprawy")}>
                      <Play className="w-4 h-4" />Klient zaakceptował
                    </Button>
                  </>
                )}
                {STATUS_FLOW.includes(nextStep.action as OrderStatus) && nextStep.action !== "sms_wycena" && (
                  <Button className="rounded-xl gap-2" onClick={() => changeStatus(nextStep.action as OrderStatus)}>
                    <Play className="w-4 h-4" />{STATUS_CONFIG[nextStep.action as OrderStatus].label}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* ─── FAZA: PRZYJĘCIE — usterka + dane urządzenia ─── */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-muted-foreground" />Usterka i diagnoza
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Zgłoszony problem</p>
                <p className="text-sm font-medium">{order.issueDescription}</p>
              </div>
              {order.diagnosis && (
                <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30">
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1 font-semibold">Diagnoza</p>
                  <p className="text-sm">{order.diagnosis}</p>
                </div>
              )}
              {order.repairDescription && (
                <div className="p-3 rounded-xl bg-green-50/50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/30">
                  <p className="text-[10px] text-green-600 dark:text-green-400 uppercase tracking-wider mb-1 font-semibold">Wykonana naprawa</p>
                  <p className="text-sm">{order.repairDescription}</p>
                </div>
              )}
            </div>
          </div>

          {/* ─── TESTY — show only when relevant or when data exists ─── */}
          {(phase === "przyjecie" || phase === "kontrola" || order.testBefore || order.testAfter) && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <TestTube className="w-4 h-4 text-muted-foreground" />Testy urządzenia
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TestCard label="PRZED naprawą" report={order.testBefore} onRun={() => setShowTestDialog("before")} highlight={phase === "przyjecie" && !order.testBefore} />
                <TestCard label="PO naprawie" report={order.testAfter} onRun={() => setShowTestDialog("after")} highlight={phase === "kontrola" && !order.testAfter} />
              </div>
            </div>
          )}

          {/* ─── FAZA: NAPRAWA — parts, part ordering ─── */}
          {(phase === "naprawa" || order.partsUsed.length > 0) && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground" />Części i naprawy
              </h3>
              {order.partsUsed.length > 0 && (
                <div className="space-y-1.5 mb-3">
                  {order.partsUsed.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-secondary/50">
                      <span>{p.partName} <span className="text-muted-foreground">x{p.quantity}</span></span>
                      <span className="font-medium">{p.price} zł</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5" onClick={() => setShowPartOrderDialog(true)}>
                  <ShoppingCart className="w-3 h-3" />Zamów część
                </Button>
                {order.status === "w_trakcie_naprawy" && (
                  <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5" onClick={() => changeStatus("oczekuje_na_czesci")}>
                    <Clock className="w-3 h-3" />Oczekuj na części
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* ─── FAZA: WYDANIE — payment + documents ─── */}
          {(phase === "wydanie" || order.status === "odebrany") && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4 text-muted-foreground" />Wydanie i płatność
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="p-3 rounded-xl bg-secondary/50 text-center">
                  <p className="text-[10px] text-muted-foreground">Status płatności</p>
                  <p className={`text-sm font-bold ${order.isPaid ? "text-green-600" : "text-red-500"}`}>
                    {order.isPaid ? "Opłacone" : "Nieopłacone"}
                  </p>
                  {order.isPaid && order.cashRegister && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{CASH_REGISTERS[order.cashRegister]}</p>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 text-center">
                  <p className="text-[10px] text-muted-foreground">Metoda odbioru</p>
                  <p className="text-sm font-bold">{receiveLabels[order.returnMethod]}</p>
                  {order.paczkomatCode && <p className="text-[10px] text-muted-foreground mt-0.5">{order.paczkomatCode}</p>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {!order.isPaid && (
                  <Button className="rounded-xl gap-1.5" onClick={() => setShowPaymentDialog(true)}>
                    <Banknote className="w-3.5 h-3.5" />Przyjmij płatność
                  </Button>
                )}
                {["Potwierdzenie wydania", "Faktura VAT", "Paragon"].map(doc => (
                  <Button key={doc} variant="outline" size="sm" className="rounded-xl text-xs gap-1.5">
                    <FileText className="w-3 h-3" />{doc}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* ─── SMS / KOMUNIKACJA — contextual ─── */}
          {!isTerminal && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Send className="w-4 h-4 text-muted-foreground" />Komunikacja z klientem
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {relevantSms.map(tpl => (
                  <SmsButton key={tpl.id} tpl={tpl} sent={sentSms.includes(tpl.id)} onSend={() => simulateSms(tpl.id)} highlight />
                ))}
              </div>
              {otherSms.length > 0 && (
                <>
                  <button onClick={() => setShowAllSms(!showAllSms)} className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1 hover:text-foreground transition-colors">
                    {showAllSms ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    {showAllSms ? "Ukryj" : "Pokaż"} wszystkie szablony SMS ({otherSms.length})
                  </button>
                  {showAllSms && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                      {otherSms.map(tpl => (
                        <SmsButton key={tpl.id} tpl={tpl} sent={sentSms.includes(tpl.id)} onSend={() => simulateSms(tpl.id)} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ─── NARZĘDZIA — external links, docs (collapsible) ─── */}
          <CollapsibleSection
            title="Narzędzia i dokumenty"
            icon={<Wrench className="w-4 h-4 text-muted-foreground" />}
            isOpen={expandedSections["tools"] ?? false}
            onToggle={() => toggleSection("tools")}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {EXTERNAL_LINKS.map(link => (
                <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-border hover:bg-accent transition-colors text-xs">
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="truncate">{link.label}</span>
                </a>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5"><FileText className="w-3 h-3" />Potwierdzenie przyjęcia</Button>
              <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5"><Package className="w-3 h-3" />Zamów kuriera</Button>
              <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5"><CreditCard className="w-3 h-3" />Link do płatności</Button>
            </div>
          </CollapsibleSection>

          {/* ─── ZMIANA STATUSU — always at the bottom ─── */}
          {nextStatuses.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold mb-3">Zmień status</h3>
              <Textarea placeholder="Dodaj notatkę do zmiany statusu (opcjonalne)..." className="rounded-xl min-h-[50px] mb-3" value={note} onChange={(e) => setNote(e.target.value)} />
              <div className="flex flex-wrap gap-2">
                {nextStatuses.map((s) => (
                  <Button key={s}
                    variant={s === "anulowany" || s === "zutylizowany" ? "destructive" : s === "odkupiony" ? "secondary" : "outline"}
                    size="sm" className="rounded-xl text-xs"
                    onClick={() => changeStatus(s)}>
                    {STATUS_CONFIG[s].label}
                  </Button>
                ))}
                <Button variant="secondary" size="sm" className="rounded-xl text-xs" onClick={addNote} disabled={!note.trim()}>
                  Tylko notatka
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ═══ RIGHT COLUMN ═══ */}
        <div className="space-y-4">

          {/* ─── DANE URZĄDZENIA ─── */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Smartphone className="w-4 h-4 text-muted-foreground" />Urządzenie</h3>
            <div className="space-y-2.5 text-xs">
              {[
                { label: "Model", value: order.deviceModel },
                { label: "Numer seryjny", value: order.serialNumber },
                { label: "Kod blokady", value: order.lockCode || "—" },
                { label: "Typ naprawy", value: REPAIR_TYPES[order.repairType] },
              ].map(item => (
                <div key={item.label} className="flex justify-between">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-right">{item.value}</span>
                </div>
              ))}
              <div className="flex gap-3 pt-2 border-t border-border/50 text-[10px] text-muted-foreground flex-wrap">
                <span>Pudełko: <strong>{order.hasBox ? "TAK" : "NIE"}</strong></span>
                <span>Reset: <strong>{order.resetConsent ? "TAK" : "NIE"}</strong></span>
              </div>
            </div>
          </div>

          {/* ─── KLIENT I LOGISTYKA ─── */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" />Klient</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Imię i nazwisko</span><span className="font-medium">{order.customerName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Telefon</span><span className="font-medium">{order.customerPhone}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Przyjęcie</span><span className="font-medium">{receiveLabels[order.receiveMethod]}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Odbiór</span><span className="font-medium">{receiveLabels[order.returnMethod]}</span></div>
              {order.paczkomatCode && <div className="flex justify-between"><span className="text-muted-foreground">Paczkomat</span><span className="font-medium">{order.paczkomatCode}</span></div>}
              <div className="flex gap-3 pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
                <span>SMS: <strong>{order.smsEnabled ? "✓" : "✗"}</strong></span>
                <span>Email: <strong>{order.emailEnabled ? "✓" : "✗"}</strong></span>
                {order.invoiceRequested && <span className="font-semibold text-amber-600">FV wymagana</span>}
              </div>
            </div>
          </div>

          {/* ─── FINANSE ─── */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-muted-foreground" />Finanse</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Szacunkowy koszt</span><span className="font-medium">{order.estimatedCost || "—"} zł</span></div>
              {order.partsCost && <div className="flex justify-between"><span className="text-muted-foreground">Koszt części</span><span className="font-medium">{order.partsCost} zł</span></div>}
              {order.finalCost && <div className="flex justify-between border-t border-border/50 pt-2"><span className="text-muted-foreground font-semibold">Koszt końcowy</span><span className="font-bold text-sm">{order.finalCost} zł</span></div>}
              {order.commission && <div className="flex justify-between"><span className="text-muted-foreground">Prowizja ({tech?.name?.split(" ")[0]})</span><span className="font-medium">{order.commission} zł</span></div>}
              <div className="flex justify-between pt-1">
                <span className="text-muted-foreground">Status</span>
                <span className={`font-bold ${order.isPaid ? "text-green-600" : "text-red-500"}`}>{order.isPaid ? "Opłacone" : "Nieopłacone"}</span>
              </div>
              {order.isPaid && order.cashRegister && (
                <div className="flex justify-between"><span className="text-muted-foreground">Kasa</span><span className="font-medium">{CASH_REGISTERS[order.cashRegister]}</span></div>
              )}
            </div>
          </div>

          {/* ─── ZDJĘCIA ─── */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Camera className="w-4 h-4 text-muted-foreground" />Zdjęcia ({order.photosCount})</h3>
            <div className="grid grid-cols-3 gap-1.5">
              {Array.from({ length: Math.min(order.photosCount, 6) }, (_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-secondary flex items-center justify-center">
                  <Camera className="w-4 h-4 text-muted-foreground/40" />
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="rounded-xl text-xs mt-2.5 w-full gap-1.5">
              <Camera className="w-3 h-3" />Dodaj zdjęcie
            </Button>
          </div>

          {/* ─── SERWIS ─── */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" />Serwis</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Oddział</span><span className="font-medium">{loc?.name.replace("AppleHome ", "")}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Serwisant</span><span className="font-medium">{tech?.name || "Nieprzypisany"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Przyjmujący</span><span className="font-medium">{receiver?.name || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Data przyjęcia</span><span className="font-medium">{format(new Date(order.createdAt), "d.MM.yyyy HH:mm")}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Plan. odbiór</span><span className="font-medium">{format(new Date(order.plannedPickupDate), "d.MM.yyyy")}</span></div>
            </div>
          </div>

          {/* ─── HISTORIA (unified timeline) ─── */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />Historia ({timeline.length})
            </h3>
            <div className="relative">
              <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-border" />
              <div className="space-y-4">
                {[...timeline].reverse().map((entry, i) => {
                  const cfg = entry.status ? STATUS_CONFIG[entry.status as OrderStatus] : null;
                  const isNote = entry.type === "note";
                  return (
                    <div key={i} className="relative flex gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 border-card flex-shrink-0 z-10 mt-0.5 ${
                        isNote ? "bg-blue-400" : cfg?.dotColor || "bg-muted"
                      }`} />
                      <div className="pb-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isNote ? (
                            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">Notatka</span>
                          ) : cfg && (
                            <span className={`text-[10px] font-semibold ${cfg.color}`}>{cfg.label}</span>
                          )}
                          <span className="text-[9px] text-muted-foreground/60">
                            {format(new Date(entry.timestamp), "d MMM HH:mm", { locale: pl })}
                          </span>
                        </div>
                        {entry.note && <p className="text-[11px] text-muted-foreground mt-0.5 break-words">{entry.note}</p>}
                        {entry.userName && <p className="text-[9px] text-muted-foreground/50 mt-0.5">{entry.userName}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ DIALOGS ═══ */}
      {showTestDialog && <TestDialog type={showTestDialog} deviceCategory={order.deviceCategory} onSave={saveTestReport} onClose={() => setShowTestDialog(null)} />}
      {showBuybackDialog && <BuybackDialog order={order} onSave={(device) => { addUsedDevice(device); setShowBuybackDialog(false); }} onClose={() => setShowBuybackDialog(false)} />}
      {showPartOrderDialog && <PartOrderDialog order={order} onSave={(po) => { addPartOrder(po); setShowPartOrderDialog(false); }} onClose={() => setShowPartOrderDialog(false)} />}
      {showPaymentDialog && <PaymentDialog onSave={handlePayment} onClose={() => setShowPaymentDialog(false)} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════ */

function TestCard({ label, report, onRun, highlight }: { label: string; report?: TestReport; onRun: () => void; highlight?: boolean }) {
  const okCount = report?.items.filter(t => t.result === "ok").length || 0;
  const nokCount = report?.items.filter(t => t.result === "nok").length || 0;
  const total = report?.items.length || 0;

  return (
    <div className={`p-3 rounded-xl ${highlight ? "bg-amber-50/50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-800 border-dashed" : "bg-secondary/50"}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold">Test {label}</p>
        {report ? (
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-medium text-green-600">{okCount} OK</span>
            {nokCount > 0 && <span className="text-[9px] font-medium text-red-500">{nokCount} NOK</span>}
            <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600">Wykonany</span>
          </div>
        ) : (
          <Button variant={highlight ? "default" : "outline"} size="sm" className="h-6 text-[10px] rounded-lg gap-1" onClick={onRun}>
            <TestTube className="w-3 h-3" />Wykonaj
          </Button>
        )}
      </div>
      {report && (
        <div className="space-y-0.5">
          {report.items.filter(t => t.result === "nok").map((t, i) => (
            <div key={i} className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground truncate mr-2">{t.name}</span>
              <span className="font-medium text-red-500 flex-shrink-0">NOK</span>
            </div>
          ))}
          {nokCount === 0 && <p className="text-[10px] text-green-600 font-medium">Wszystkie testy OK</p>}
          <p className="text-[9px] text-muted-foreground mt-1.5 pt-1 border-t border-border/30">
            {report.performedBy} · {format(new Date(report.performedAt), "d.MM.yyyy HH:mm")}
          </p>
        </div>
      )}
      {!report && !highlight && <p className="text-[10px] text-muted-foreground">Nie wykonano</p>}
      {highlight && !report && <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Wymagany przed rozpoczęciem pracy</p>}
    </div>
  );
}

function SmsButton({ tpl, sent, onSend, highlight }: { tpl: { id: string; name: string }; sent: boolean; onSend: () => void; highlight?: boolean }) {
  return (
    <button onClick={onSend}
      className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
        sent ? "bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-700" :
        highlight ? "border-primary/30 bg-primary/5 hover:bg-primary/10" :
        "border-border hover:bg-accent"
      }`}>
      <p className="font-medium">{tpl.name}</p>
      {sent && <p className="text-green-600 dark:text-green-400 mt-0.5 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Wysłano</p>}
    </button>
  );
}

function CollapsibleSection({ title, icon, isOpen, onToggle, children }: {
  title: string; icon: React.ReactNode; isOpen: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="glass-card">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-5 text-left">
        <h3 className="text-sm font-semibold flex items-center gap-2">{icon}{title}</h3>
        {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      {isOpen && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

/* ── Test Dialog ── */
function TestDialog({ type, deviceCategory, onSave, onClose }: {
  type: "before" | "after"; deviceCategory: string;
  onSave: (report: TestReport) => void; onClose: () => void;
}) {
  const tests = deviceCategory === "MacBook" ? MACBOOK_TESTS : IPHONE_TESTS;
  const [items, setItems] = useState<TestItem[]>(tests.map(name => ({ name, result: null })));
  const setResult = (idx: number, result: TestItem["result"]) => setItems(prev => prev.map((item, i) => i === idx ? { ...item, result } : item));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px] max-h-[80vh] overflow-y-auto rounded-2xl">
        <DialogHeader><DialogTitle>Test {type === "before" ? "PRZED" : "PO"} naprawą</DialogTitle></DialogHeader>
        <div className="space-y-2 mt-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-accent/50">
              <span className="text-xs flex-1">{item.name}</span>
              <div className="flex gap-1">
                {(["ok", "nok", "nie_dotyczy"] as const).map(r => (
                  <button key={r} onClick={() => setResult(i, r)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                      item.result === r
                        ? r === "ok" ? "bg-green-500 text-white" : r === "nok" ? "bg-red-500 text-white" : "bg-gray-400 text-white"
                        : "bg-secondary text-muted-foreground hover:bg-accent"
                    }`}>
                    {r === "ok" ? "OK" : r === "nok" ? "NOK" : "N/D"}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="flex justify-between items-center pt-3 border-t">
            <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => setItems(prev => prev.map(i => ({ ...i, result: "ok" })))}>Wszystko OK</Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="rounded-xl">Anuluj</Button>
              <Button className="rounded-xl" disabled={items.every(i => i.result === null)}
                onClick={() => onSave({ type, items, performedBy: "Marek Kowalski", performedAt: new Date().toISOString() })}>
                Zapisz test
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Buyback Dialog ── */
function BuybackDialog({ order, onSave, onClose }: {
  order: { id: string; orderNumber: string; deviceModel: string; deviceCategory: string; serialNumber: string; locationId: string };
  onSave: (device: UsedDevice) => void; onClose: () => void;
}) {
  const [form, setForm] = useState({ type: "do_sprzedania" as "do_sprzedania" | "na_czesci", batteryCondition: "", isWorking: true, hasICloud: false, issue: "", notes: "", price: "" });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl">
        <DialogHeader><DialogTitle>Odkupienie — {order.deviceModel}</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-xs text-muted-foreground">Przeznaczenie</Label>
            <div className="flex gap-2 mt-1">
              {(["do_sprzedania", "na_czesci"] as const).map(t => (
                <button key={t} onClick={() => setForm({ ...form, type: t })}
                  className={`flex-1 p-3 rounded-xl border text-sm font-medium transition-all ${form.type === t ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}>
                  {t === "do_sprzedania" ? "Do sprzedania" : "Na części"}
                </button>
              ))}
            </div>
          </div>
          {form.type === "do_sprzedania" ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs text-muted-foreground">Kondycja baterii</Label><Input className="rounded-xl mt-1" value={form.batteryCondition} onChange={e => setForm({ ...form, batteryCondition: e.target.value })} placeholder="np. 87%" /></div>
                <div><Label className="text-xs text-muted-foreground">Cena sprzedaży (zł)</Label><Input className="rounded-xl mt-1" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={form.isWorking} onChange={e => setForm({ ...form, isWorking: e.target.checked })} className="rounded" />Sprawny</label>
                <label className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={form.hasICloud} onChange={e => setForm({ ...form, hasICloud: e.target.checked })} className="rounded" />iCloud aktywny</label>
              </div>
            </>
          ) : (
            <div><Label className="text-xs text-muted-foreground">Opis usterki</Label><Input className="rounded-xl mt-1" value={form.issue} onChange={e => setForm({ ...form, issue: e.target.value })} placeholder="np. Uszkodzona płyta główna" /></div>
          )}
          <div><Label className="text-xs text-muted-foreground">Uwagi</Label><Textarea className="rounded-xl mt-1 min-h-[50px]" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="rounded-xl">Anuluj</Button>
            <Button className="rounded-xl" onClick={() => onSave({
              id: Math.random().toString(36).substring(2, 11), type: form.type, model: order.deviceModel,
              serialNumber: order.serialNumber, deviceCategory: order.deviceCategory as UsedDevice["deviceCategory"],
              batteryCondition: form.batteryCondition || undefined, isWorking: form.isWorking, hasICloud: form.hasICloud,
              issue: form.issue || undefined, notes: form.notes, originOrderId: order.id, originOrderNumber: order.orderNumber,
              locationId: order.locationId, price: form.price ? Number(form.price) : undefined, createdAt: new Date().toISOString(),
            })}>Dodaj do magazynu</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Part Order Dialog ── */
function PartOrderDialog({ order, onSave, onClose }: {
  order: { id: string; orderNumber: string }; onSave: (po: PartOrder) => void; onClose: () => void;
}) {
  const [form, setForm] = useState({ partName: "", estimatedCost: "" });
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] rounded-2xl">
        <DialogHeader><DialogTitle>Zamów część — {order.orderNumber}</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div><Label className="text-xs text-muted-foreground">Nazwa części</Label><Input className="rounded-xl mt-1" value={form.partName} onChange={e => setForm({ ...form, partName: e.target.value })} placeholder="np. Wyświetlacz iPhone 15 Pro" /></div>
          <div><Label className="text-xs text-muted-foreground">Szacunkowy koszt (zł)</Label><Input className="rounded-xl mt-1" type="number" value={form.estimatedCost} onChange={e => setForm({ ...form, estimatedCost: e.target.value })} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="rounded-xl">Anuluj</Button>
            <Button className="rounded-xl" disabled={!form.partName} onClick={() => onSave({
              id: Math.random().toString(36).substring(2, 11), orderId: order.id, orderNumber: order.orderNumber,
              partName: form.partName, estimatedCost: Number(form.estimatedCost) || 0,
              status: "zamowione", requestedBy: "emp1", createdAt: new Date().toISOString(),
            })}>Zamów część</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Payment Dialog ── */
function PaymentDialog({ onSave, onClose }: { onSave: (method: string, register: string) => void; onClose: () => void }) {
  const [method, setMethod] = useState("karta");
  const [register, setRegister] = useState("kasa_karta");
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] rounded-2xl">
        <DialogHeader><DialogTitle>Przyjmij płatność</DialogTitle></DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-xs text-muted-foreground">Metoda płatności</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {[{ value: "karta", label: "Karta" }, { value: "gotowka", label: "Gotówka" }, { value: "przelew", label: "Przelew" }, { value: "link_platnosci", label: "Link online" }].map(m => (
                <button key={m.value} onClick={() => setMethod(m.value)}
                  className={`p-2.5 rounded-xl border text-xs font-medium transition-all ${method === m.value ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Kasa</Label>
            <Select value={register} onValueChange={setRegister}>
              <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(CASH_REGISTERS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" defaultChecked className="rounded" />Paragon</label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="rounded" />Faktura VAT</label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="rounded-xl">Anuluj</Button>
            <Button className="rounded-xl" onClick={() => onSave(method, register)}>Potwierdź płatność</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
