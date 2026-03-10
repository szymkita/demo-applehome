"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@/hooks/use-store";
import { PageHeader } from "@/components/shared/page-header";
import { EMPLOYEES, LOCATIONS } from "@/lib/constants";
import { ChatMessage } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MapPin } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { pl } from "date-fns/locale";

export default function ChatPage() {
  const { items: messages, mounted, add } = useChat();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  if (!mounted) return <div className="animate-pulse space-y-4"><div className="h-8 w-48 bg-muted rounded-lg" /><div className="h-96 bg-muted rounded-2xl" /></div>;

  const sendMessage = () => {
    if (!text.trim()) return;
    const msg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 11),
      userId: "emp1", userName: "Marek Kowalski",
      text: text.trim(), locationId: "loc1", createdAt: new Date().toISOString(),
    };
    add(msg);
    setText("");
  };

  const sorted = [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const formatDate = (d: string) => {
    const date = new Date(d);
    if (isToday(date)) return "Dzisiaj";
    if (isYesterday(date)) return "Wczoraj";
    return format(date, "d MMMM yyyy", { locale: pl });
  };

  let lastDate = "";

  return (
    <div className="page-transition flex flex-col h-[calc(100dvh-4rem)] lg:h-[calc(100dvh-2rem)]">
      <PageHeader title="Czat zespołu" description={`${EMPLOYEES.length} członków · ${LOCATIONS.length} lokalizacji`} />

      <div className="flex-1 glass-card flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {sorted.map((msg) => {
            const isMe = msg.userId === "emp1";
            const emp = EMPLOYEES.find(e => e.id === msg.userId);
            const loc = LOCATIONS.find(l => l.id === msg.locationId);
            const dateStr = formatDate(msg.createdAt);
            const showDate = dateStr !== lastDate;
            lastDate = dateStr;

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex items-center justify-center my-3">
                    <span className="text-[10px] text-muted-foreground bg-secondary px-3 py-1 rounded-full">{dateStr}</span>
                  </div>
                )}
                <div className={`flex gap-2.5 mb-2 ${isMe ? "flex-row-reverse" : ""}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${isMe ? "bg-gradient-to-br from-blue-400 to-blue-600 text-white" : "bg-secondary text-muted-foreground"}`}>
                    {emp?.avatar || "?"}
                  </div>
                  <div className={`max-w-[75%] ${isMe ? "text-right" : ""}`}>
                    <div className={`inline-block px-3.5 py-2 rounded-2xl text-sm ${isMe ? "bg-primary text-primary-foreground rounded-tr-md" : "bg-secondary rounded-tl-md"}`}>
                      {msg.text}
                    </div>
                    <p className={`text-[10px] text-muted-foreground/60 mt-0.5 flex items-center gap-1 ${isMe ? "justify-end" : ""}`}>
                      {!isMe && <span className="font-medium text-muted-foreground">{msg.userName.split(" ")[0]}</span>}
                      {loc && <><MapPin className="w-2.5 h-2.5" />{loc.name.replace("AppleHome ", "")}</>}
                      · {format(new Date(msg.createdAt), "HH:mm")}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="p-3 border-t border-border/50">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Napisz wiadomość..." className="rounded-xl flex-1" />
            <Button type="submit" disabled={!text.trim()} className="rounded-xl px-4">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
