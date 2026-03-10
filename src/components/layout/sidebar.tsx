"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import Image from "next/image";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Package,
  BarChart3,
  Sun,
  Moon,
  Menu,
  X,
  MessageCircle,
  FileText,
  UserCog,
  MapPin,
  CheckSquare,
  AlertCircle,
  CalendarDays,
} from "lucide-react";

const navSections = [
  {
    label: "Menu",
    items: [
      { href: "/", label: "Pulpit", icon: LayoutDashboard },
      { href: "/zlecenia", label: "Zlecenia", icon: ClipboardList },
      { href: "/klienci", label: "Klienci", icon: Users },
    ],
  },
  {
    label: "Serwis",
    items: [
      { href: "/magazyn", label: "Magazyn", icon: Package },
      { href: "/rezerwacje", label: "Rezerwacje", icon: CalendarDays },
      { href: "/czat", label: "Czat zespołu", icon: MessageCircle },
      { href: "/zadania", label: "Zadania", icon: CheckSquare },
    ],
  },
  {
    label: "Analiza",
    items: [
      { href: "/raporty", label: "Raporty", icon: BarChart3 },
      { href: "/pracownicy", label: "Pracownicy", icon: UserCog },
      { href: "/lokalizacje", label: "Lokalizacje", icon: MapPin },
    ],
  },
  {
    label: "Dokumenty",
    items: [
      { href: "/dokumenty", label: "Dokumenty", icon: FileText },
      { href: "/reklamacje", label: "Reklamacje", icon: AlertCircle },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const nav = (
    <>
      <div className="px-5 py-5">
        <Image src="/applehome.svg" alt="AppleHome" width={160} height={24} className="dark:invert" priority />
        <p className="text-[10px] text-muted-foreground font-medium tracking-wide uppercase mt-1.5">System serwisowy</p>
      </div>

      <nav className="flex-1 px-3 space-y-5 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-1.5 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`sidebar-link ${isActive(item.href) ? "active" : ""}`}
                >
                  <item.icon className="w-[17px] h-[17px]" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-4 pb-4 space-y-2 border-t border-border/50 pt-3">
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-200"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{theme === "dark" ? "Jasny motyw" : "Ciemny motyw"}</span>
          </button>
        )}
        <div className="flex items-center gap-3 px-3">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
            MK
          </div>
          <div>
            <p className="text-xs font-medium leading-tight">Marek Kowalski</p>
            <p className="text-[10px] text-muted-foreground">Admin · Mokotów</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 rounded-xl bg-card/80 backdrop-blur-xl border border-border/50 shadow-sm flex items-center justify-center"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-dvh w-[250px] bg-sidebar border-r border-sidebar-border flex flex-col z-40 transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {nav}
      </aside>
    </>
  );
}
