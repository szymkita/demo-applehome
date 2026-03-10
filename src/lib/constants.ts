import { OrderStatus, Priority, RepairType, DeviceCategory } from "@/types";

export const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string; dotColor: string; order: number }
> = {
  oczekuje_na_diagnoze: {
    label: "Oczekuje na diagnozę",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/50",
    dotColor: "bg-blue-500",
    order: 1,
  },
  w_trakcie_diagnozy: {
    label: "W trakcie diagnozy",
    color: "text-indigo-700 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-950/50",
    dotColor: "bg-indigo-500",
    order: 2,
  },
  oczekuje_na_akceptacje: {
    label: "Oczekuje na akceptację",
    color: "text-purple-700 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950/50",
    dotColor: "bg-purple-500",
    order: 3,
  },
  w_trakcie_naprawy: {
    label: "W trakcie naprawy",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/50",
    dotColor: "bg-amber-500",
    order: 4,
  },
  oczekuje_na_czesci: {
    label: "Oczekuje na części",
    color: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/50",
    dotColor: "bg-orange-500",
    order: 5,
  },
  w_trakcie_testow: {
    label: "W trakcie testów",
    color: "text-cyan-700 dark:text-cyan-400",
    bg: "bg-cyan-50 dark:bg-cyan-950/50",
    dotColor: "bg-cyan-500",
    order: 6,
  },
  gotowy_do_odbioru: {
    label: "Gotowy do odbioru",
    color: "text-green-700 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-950/50",
    dotColor: "bg-green-500",
    order: 7,
  },
  odebrany: {
    label: "Odebrany",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-100 dark:bg-slate-800/50",
    dotColor: "bg-slate-400",
    order: 8,
  },
  odkupiony: {
    label: "Odkupiony",
    color: "text-teal-700 dark:text-teal-400",
    bg: "bg-teal-50 dark:bg-teal-950/50",
    dotColor: "bg-teal-500",
    order: 9,
  },
  zutylizowany: {
    label: "Zutylizowany",
    color: "text-stone-600 dark:text-stone-400",
    bg: "bg-stone-100 dark:bg-stone-800/50",
    dotColor: "bg-stone-500",
    order: 10,
  },
  anulowany: {
    label: "Anulowany",
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/50",
    dotColor: "bg-red-500",
    order: 11,
  },
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  express_1h: { label: "Ekspres 1h", color: "text-red-700", bg: "bg-red-50" },
  express_2h: { label: "Ekspres 2h", color: "text-red-600", bg: "bg-red-50" },
  express_3h: { label: "Ekspres 3h", color: "text-orange-700", bg: "bg-orange-50" },
  dzisiaj: { label: "Dzisiaj", color: "text-orange-600", bg: "bg-orange-50" },
  "1_dzien": { label: "1 dzień", color: "text-amber-600", bg: "bg-amber-50" },
  "2_dni": { label: "2 dni", color: "text-yellow-600", bg: "bg-yellow-50" },
  "3_dni": { label: "3 dni", color: "text-blue-600", bg: "bg-blue-50" },
  "7_dni": { label: "7 dni", color: "text-slate-600", bg: "bg-slate-50" },
  standard: { label: "Standard", color: "text-slate-500", bg: "bg-slate-50" },
};

export const REPAIR_TYPES: Record<RepairType, string> = {
  bateria: "Bateria",
  ekran: "Ekran",
  szybka: "Szybka",
  zalanie: "Zalanie",
  elektroniczna: "Elektroniczna",
  regeneracja: "Regeneracja",
  modulowa: "Modułowa",
};

export const LOCATIONS = [
  { id: "loc1", name: "AppleHome Mokotów", address: "ul. Puławska 145, Warszawa", phone: "+48 22 123 45 67", city: "Warszawa", isActive: true },
  { id: "loc2", name: "AppleHome Śródmieście", address: "ul. Marszałkowska 89, Warszawa", phone: "+48 22 234 56 78", city: "Warszawa", isActive: true },
  { id: "loc3", name: "AppleHome Wola", address: "ul. Wolska 64, Warszawa", phone: "+48 22 345 67 89", city: "Warszawa", isActive: true },
];

export const EMPLOYEES = [
  { id: "emp1", name: "Marek Kowalski", role: "admin" as const, locationId: "loc1", avatar: "MK", commissionRate: 0.15, isActive: true },
  { id: "emp2", name: "Anna Wiśniewska", role: "serwisant" as const, locationId: "loc1", avatar: "AW", commissionRate: 0.12, isActive: true },
  { id: "emp3", name: "Tomasz Zieliński", role: "serwisant" as const, locationId: "loc2", avatar: "TZ", commissionRate: 0.12, isActive: true },
  { id: "emp4", name: "Karolina Nowak", role: "serwisant" as const, locationId: "loc2", avatar: "KN", commissionRate: 0.10, isActive: true },
  { id: "emp5", name: "Piotr Lewandowski", role: "serwisant" as const, locationId: "loc3", avatar: "PL", commissionRate: 0.12, isActive: true },
  { id: "emp6", name: "Joanna Kamińska", role: "manager" as const, locationId: "loc3", avatar: "JK", commissionRate: 0.15, isActive: true },
  { id: "emp7", name: "Adam Szymański", role: "serwisant" as const, locationId: "loc1", avatar: "AS", commissionRate: 0.12, isActive: true },
  { id: "emp8", name: "Magdalena Dąbrowska", role: "manager" as const, locationId: "loc2", avatar: "MD", commissionRate: 0.15, isActive: true },
  { id: "emp9", name: "Krzysztof Wójcik", role: "serwisant" as const, locationId: "loc3", avatar: "KW", commissionRate: 0.12, isActive: true },
  { id: "emp10", name: "Natalia Kozłowska", role: "serwisant" as const, locationId: "loc2", avatar: "NK", commissionRate: 0.10, isActive: true },
  { id: "emp11", name: "Robert Jankowski", role: "serwisant" as const, locationId: "loc1", avatar: "RJ", commissionRate: 0.12, isActive: true },
  { id: "emp12", name: "Marta Mazur", role: "recepcja" as const, locationId: "loc1", avatar: "MM", commissionRate: 0.05, isActive: true },
  { id: "emp13", name: "Łukasz Grabowski", role: "serwisant" as const, locationId: "loc2", avatar: "ŁG", commissionRate: 0.10, isActive: true },
  { id: "emp14", name: "Dorota Pawłowska", role: "manager" as const, locationId: "loc3", avatar: "DP", commissionRate: 0.15, isActive: true },
  { id: "emp15", name: "Jakub Michalski", role: "serwisant" as const, locationId: "loc3", avatar: "JM", commissionRate: 0.12, isActive: true },
];

export const APPLE_DEVICES: Record<DeviceCategory, string[]> = {
  iPhone: [
    "iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 16", "iPhone 16 Plus",
    "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15", "iPhone 15 Plus",
    "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14", "iPhone 14 Plus",
    "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13", "iPhone 13 Mini",
    "iPhone 12 Pro Max", "iPhone 12 Pro", "iPhone 12", "iPhone 12 Mini",
    "iPhone 11 Pro Max", "iPhone 11 Pro", "iPhone 11",
    "iPhone XS Max", "iPhone XS", "iPhone X",
    "iPhone SE 2022", "iPhone SE 2020",
  ],
  MacBook: [
    "MacBook Pro 16 M4 Pro", "MacBook Pro 16 M3 Pro", "MacBook Pro 16 M2 Pro", "MacBook Pro 16 M1 Pro",
    "MacBook Pro 14 M4 Pro", "MacBook Pro 14 M3 Pro", "MacBook Pro 14 M2 Pro", "MacBook Pro 14 M1 Pro",
    "MacBook Pro 13 M2", "MacBook Pro 13 M1",
    "MacBook Air 15 M3", "MacBook Air 15 M2",
    "MacBook Air 13 M3", "MacBook Air 13 M2", "MacBook Air 13 M1",
  ],
  iPad: [
    "iPad Pro 13 M4", "iPad Pro 11 M4",
    "iPad Pro 12.9 M2", "iPad Pro 11 M2",
    "iPad Air 13 M2", "iPad Air 11 M2",
    "iPad Air 5", "iPad Air 4",
    "iPad 10", "iPad 9",
    "iPad Mini 7", "iPad Mini 6",
  ],
  "Apple Watch": [
    "Apple Watch Ultra 2", "Apple Watch Ultra 1",
    "Apple Watch 10", "Apple Watch 9", "Apple Watch 8",
    "Apple Watch SE 2", "Apple Watch SE 1",
    "Apple Watch 7", "Apple Watch 6",
  ],
  iMac: ["iMac 24 M3", "iMac 24 M1", "iMac 27 2020", "iMac 21.5 2019"],
  Inne: ["AirPods Pro 2", "AirPods Pro 1", "AirPods 3", "AirPods Max", "HomePod Mini", "Apple TV 4K"],
};

export const COMMON_ISSUES: Record<DeviceCategory, string[]> = {
  iPhone: [
    "Wymiana wyświetlacza — pęknięty ekran",
    "Wymiana baterii — szybko się rozładowuje",
    "Naprawa złącza Lightning/USB-C",
    "Naprawa Face ID",
    "Naprawa aparatu głównego/przedniego",
    "Naprawa głośnika/mikrofonu",
    "Naprawa po zalaniu",
    "Wymiana tylnego panelu",
    "Nie włącza się / restartuje się",
    "Wymiana przycisku power/głośności",
  ],
  MacBook: [
    "Wymiana matrycy / wyświetlacza",
    "Wymiana baterii",
    "Naprawa klawiatury",
    "Naprawa touchpada",
    "Naprawa portów USB-C/Thunderbolt",
    "Naprawa po zalaniu",
    "Nie włącza się",
    "Wymiana dysku SSD",
    "Naprawa ładowania",
    "Naprawa głośników",
  ],
  iPad: [
    "Wymiana wyświetlacza / digitizera",
    "Wymiana baterii",
    "Naprawa złącza ładowania",
    "Naprawa przycisku Home/Touch ID",
    "Naprawa aparatu",
    "Nie włącza się",
  ],
  "Apple Watch": [
    "Wymiana wyświetlacza",
    "Wymiana baterii",
    "Naprawa Digital Crown",
    "Naprawa czujnika tętna",
    "Nie włącza się / nie ładuje",
  ],
  iMac: [
    "Wymiana dysku na SSD",
    "Rozbudowa RAM",
    "Wymiana matrycy",
    "Naprawa zasilacza",
    "Czyszczenie / wymiana pasty termoprzewodzącej",
  ],
  Inne: [
    "Naprawa / wymiana baterii",
    "Brak dźwięku",
    "Nie łączy się",
    "Uszkodzenie mechaniczne",
  ],
};

export const DEFAULT_REPAIR_TIMES: Record<DeviceCategory, number> = {
  iPhone: 1,
  MacBook: 2,
  iPad: 3,
  "Apple Watch": 4,
  iMac: 4,
  Inne: 5,
};

export const IPHONE_TESTS = [
  "Uruchamianie się urządzenia",
  "Uruchamianie się systemu",
  "Uszkodzenia mechaniczne",
  "Wizualny komplet części",
  "Działanie portu Lightning / USB-C",
  "Działanie wyświetlacza",
  "Działanie ekranu dotykowego",
  "Działanie czujnika zbliżeniowego",
  "Działanie modułu Face ID / Touch ID",
  "Działanie przycisków bocznych",
  "Działanie mikrofonu dolnego i górnego",
  "Działanie aparatu głównego",
  "Działanie aparatu przedniego",
  "Działanie WiFi i Bluetooth",
  "Działanie sieci LTE",
];

export const MACBOOK_TESTS = [
  "Uruchamianie się urządzenia",
  "Uruchamianie się systemu",
  "Uszkodzenia mechaniczne",
  "Wizualny komplet części",
  "Działanie klawiatury",
  "Działanie podświetlenia klawiatury",
  "Działanie touchpada",
  "Działanie portów USB",
  "Działanie innych portów",
  "Działanie ładowania",
  "Działanie pracy na baterii",
  "Działanie czujników temperatury",
  "Działanie wentylatorów",
  "Działanie głośników",
  "Działanie mikrofonu",
  "Działanie kamery",
  "Działanie WiFi i Bluetooth",
  "Działanie Touch ID",
];

export const SMS_TEMPLATES = [
  { id: "sms1", name: "Przyjęcie zlecenia", content: "Szanowny Kliencie, zlecenie {orderNumber} zostało przyjęte do serwisu AppleHome. Planowany termin realizacji: {plannedDate}. Kod odbioru: {pickupCode}", trigger: "oczekuje_na_diagnoze" },
  { id: "sms2", name: "Diagnoza zakończona", content: "Twoje zlecenie {orderNumber} zostało zdiagnozowane. Koszt naprawy: {cost} zł. Prosimy o kontakt w celu akceptacji.", trigger: "oczekuje_na_akceptacje" },
  { id: "sms3", name: "Zamówienie części 3 dni", content: "Informujemy, że część zamienna do zlecenia {orderNumber} została zamówiona. Przewidywany czas dostawy: 3 dni robocze.", trigger: "" },
  { id: "sms4", name: "Zamówienie części 7 dni", content: "Informujemy, że część zamienna do zlecenia {orderNumber} została zamówiona. Przewidywany czas dostawy: 7 dni roboczych.", trigger: "" },
  { id: "sms5", name: "Zamówienie części 14 dni", content: "Informujemy, że część zamienna do zlecenia {orderNumber} została zamówiona. Przewidywany czas dostawy: 14 dni roboczych.", trigger: "" },
  { id: "sms6", name: "Gotowe do odbioru", content: "Szanowny Kliencie, zlecenie {orderNumber} jest gotowe do odbioru. Twój kod odbioru: {pickupCode}. Zapraszamy do {locationName}.", trigger: "gotowy_do_odbioru" },
  { id: "sms7", name: "Prośba o kontakt", content: "AppleHome: prosimy o kontakt ws. zlecenia {orderNumber}. Tel: {locationPhone}", trigger: "" },
  { id: "sms8", name: "Brak kontaktu", content: "Ponownie prosimy o kontakt ws. zlecenia {orderNumber}. Brak odpowiedzi może skutkować opóźnieniem realizacji.", trigger: "" },
  { id: "sms9", name: "Opinia po naprawie", content: "Dziękujemy za naprawę w AppleHome! Oceń nas: 5-super, 4-czas, 3-obsługa, 2-inny serwis, 1-niezadowolony", trigger: "" },
];

export const CASH_REGISTERS = {
  kasa_karta: "Kasa 1 — Karta",
  kasa_gotowka: "Kasa 2 — Gotówka",
  kasa_przelew: "Kasa 3 — Przelew",
  kasa_inne: "Kasa 4 — Inne",
};

export const EXTERNAL_LINKS = [
  { id: "fmi_check", label: "Sprawdź FMI", url: "https://ifreeicloud.co.uk/free-check", icon: "shield" },
  { id: "warranty_check", label: "Sprawdź gwarancję Apple", url: "https://checkcoverage.apple.com/?locale=pl_PL", icon: "shield-check" },
  { id: "macbook_params", label: "Parametry MacBook", url: "http://www.powerbookmedic.com/", icon: "laptop" },
  { id: "iphone_params", label: "Parametry iPhone (IMEI)", url: "https://iunlocker.com/check_imei.php", icon: "smartphone" },
];

export const RESERVATION_TYPES = {
  oczekuje_na_dostarczenie: "Oczekuje na dostarczenie części",
  czesc_zarezerwowana: "Część zamienna zarezerwowana",
};

export const PART_CATEGORIES = [
  "Wyświetlacze",
  "Baterie",
  "Złącza ładowania",
  "Obudowy / Tylne panele",
  "Aparaty",
  "Głośniki",
  "Klawiatury",
  "Touchpady",
  "Dyski SSD",
  "Akcesoria",
  "Inne",
];
