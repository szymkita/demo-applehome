import { Order, Customer, InventoryItem, OrderStatus, ChatMessage, Task, DeviceCategory, UsedDevice, Reservation, PartOrder, TestReport } from "@/types";
import { LOCATIONS, EMPLOYEES, APPLE_DEVICES, COMMON_ISSUES, IPHONE_TESTS, MACBOOK_TESTS } from "./constants";

function id(): string {
  return Math.random().toString(36).substring(2, 11);
}

function randomDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
  d.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60));
  return d.toISOString();
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateTestReport(type: "before" | "after", cat: DeviceCategory, techName: string, date: string): TestReport {
  const tests = cat === "MacBook" ? MACBOOK_TESTS : IPHONE_TESTS;
  return {
    type,
    items: tests.map(name => ({
      name,
      result: Math.random() > 0.15 ? "ok" : Math.random() > 0.5 ? "nok" : "nie_dotyczy",
    })),
    performedBy: techName,
    performedAt: date,
  };
}

function pickupCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 7; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const firstNames = [
  "Jan", "Anna", "Piotr", "Katarzyna", "Marek", "Magdalena", "Tomasz", "Joanna",
  "Andrzej", "Agnieszka", "Krzysztof", "Barbara", "Michał", "Ewa", "Paweł",
  "Dorota", "Adam", "Monika", "Łukasz", "Aleksandra", "Robert", "Natalia",
  "Jakub", "Karolina", "Marcin", "Justyna", "Grzegorz", "Marta",
  "Damian", "Izabela", "Kamil", "Weronika", "Sebastian", "Patrycja",
];

const lastNames = [
  "Nowak", "Kowalski", "Wiśniewski", "Wójcik", "Kowalczyk", "Kamiński",
  "Lewandowski", "Zieliński", "Szymański", "Woźniak", "Dąbrowski", "Kozłowski",
  "Jankowski", "Mazur", "Kwiatkowski", "Krawczyk", "Piotrowski", "Grabowski",
  "Pawłowski", "Michalski", "Nowicka", "Adamczyk", "Dudek", "Zając",
  "Olszewski", "Stępień", "Malinowski", "Jaworski",
];

export function generateCustomers(): Customer[] {
  const customers: Customer[] = [];
  const usedCombos = new Set<string>();

  for (let i = 0; i < 35; i++) {
    let fn: string, ln: string;
    do {
      fn = pick(firstNames);
      ln = pick(lastNames);
    } while (usedCombos.has(fn + ln));
    usedCombos.add(fn + ln);

    const isBiz = Math.random() > 0.85;
    customers.push({
      id: id(),
      type: isBiz ? "business" : "individual",
      firstName: fn,
      lastName: ln,
      companyName: isBiz ? pick(["TechCorp Sp. z o.o.", "Digital Solutions S.A.", "StartUp Lab", "MediaHouse Sp. z o.o.", "CreativeStudio"]) : undefined,
      nip: isBiz ? `${Math.floor(1000000000 + Math.random() * 9000000000)}` : undefined,
      street: pick(["ul. Marszałkowska", "ul. Puławska", "ul. Mokotowska", "ul. Nowy Świat", "ul. Żelazna", "ul. Lwowska", "ul. Królewska"]) + ` ${Math.floor(1 + Math.random() * 150)}`,
      postalCode: `0${Math.floor(1 + Math.random() * 9)}-${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
      city: pick(["Warszawa", "Kraków", "Wrocław", "Warszawa", "Warszawa"]),
      phone: `+48 ${5 + Math.floor(Math.random() * 5)}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)} ${String(Math.floor(Math.random() * 1000)).padStart(3, "0")} ${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`,
      email: `${fn.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace("ł", "l").toLowerCase()}.${ln.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace("ł", "l").toLowerCase()}@${pick(["gmail.com", "icloud.com", "wp.pl", "onet.pl", "outlook.com"])}`,
      source: pick(["google", "social_media", "polecenie", "polecenie", "google", "b2b", "przypadkowo"]) as Customer["source"],
      isB2B: isBiz,
      createdAt: randomDate(365),
    });
  }
  return customers;
}

export function generateOrders(customers: Customer[]): Order[] {
  const orders: Order[] = [];
  const statuses: OrderStatus[] = [
    "oczekuje_na_diagnoze", "w_trakcie_diagnozy", "oczekuje_na_akceptacje",
    "w_trakcie_naprawy", "oczekuje_na_czesci", "w_trakcie_testow",
    "gotowy_do_odbioru", "odebrany", "odebrany", "odebrany", "anulowany",
  ];

  const categories: DeviceCategory[] = ["iPhone", "iPhone", "iPhone", "MacBook", "MacBook", "iPad", "Apple Watch", "iMac"];

  for (let i = 0; i < 55; i++) {
    const customer = pick(customers);
    const cat = pick(categories);
    const model = pick(APPLE_DEVICES[cat]);
    const issue = pick(COMMON_ISSUES[cat]);
    const createdAt = randomDate(90);
    const status = pick(statuses);
    const loc = pick(LOCATIONS);
    const emp = EMPLOYEES.filter(e => e.locationId === loc.id && e.role === "serwisant");
    const tech = emp.length > 0 ? pick(emp) : pick(EMPLOYEES.filter(e => e.role === "serwisant"));
    const receiver = EMPLOYEES.find(e => e.locationId === loc.id) || EMPLOYEES[0];

    const statusHistory: Order["statusHistory"] = [
      { status: "oczekuje_na_diagnoze", timestamp: createdAt, note: "Urządzenie przyjęte do serwisu", userName: receiver.name, locationId: loc.id },
    ];

    const statusFlow: OrderStatus[] = [
      "oczekuje_na_diagnoze", "w_trakcie_diagnozy", "oczekuje_na_akceptacje",
      "w_trakcie_naprawy", "w_trakcie_testow", "gotowy_do_odbioru", "odebrany",
    ];
    const targetIdx = status === "anulowany" ? 1 :
                      status === "oczekuje_na_czesci" ? 3 :
                      statusFlow.indexOf(status);

    let ts = new Date(createdAt);
    const notes: string[] = [
      "Rozpoczęto diagnostykę",
      `Wycena: koszt naprawy ustalony`,
      "Klient zaakceptował koszty naprawy",
      "Rozpoczęto naprawę",
      "Testy po naprawie",
      "Naprawa zakończona, urządzenie gotowe do odbioru",
      "Urządzenie wydane klientowi",
    ];

    for (let j = 1; j <= Math.max(0, targetIdx); j++) {
      ts = new Date(ts.getTime() + (2 + Math.random() * 36) * 3600000);
      statusHistory.push({
        status: statusFlow[j],
        timestamp: ts.toISOString(),
        note: notes[j - 1] || `Status zmieniony`,
        userName: tech.name,
        locationId: loc.id,
      });
    }

    if (status === "oczekuje_na_czesci") {
      ts = new Date(ts.getTime() + 8 * 3600000);
      statusHistory.push({
        status: "oczekuje_na_czesci",
        timestamp: ts.toISOString(),
        note: "Zamówiono część, oczekiwanie na dostawę",
        userName: tech.name,
        locationId: loc.id,
      });
    }

    if (status === "anulowany") {
      ts = new Date(ts.getTime() + 24 * 3600000);
      statusHistory.push({
        status: "anulowany",
        timestamp: ts.toISOString(),
        note: "Klient zrezygnował z naprawy",
        userName: receiver.name,
        locationId: loc.id,
      });
    }

    const estimatedCost = cat === "MacBook" ? 400 + Math.floor(Math.random() * 2000) :
                          cat === "iPhone" ? 150 + Math.floor(Math.random() * 1200) :
                          100 + Math.floor(Math.random() * 800);
    const isFinished = ["gotowy_do_odbioru", "odebrany"].includes(status);
    const finalCost = isFinished ? estimatedCost + Math.floor(Math.random() * 200) - 100 : undefined;
    const partsCost = finalCost ? Math.floor(finalCost * (0.3 + Math.random() * 0.3)) : undefined;

    const plannedDate = new Date(createdAt);
    const daysToAdd = cat === "iPhone" ? 1 : cat === "MacBook" ? 2 : cat === "iPad" ? 3 : 4;
    plannedDate.setDate(plannedDate.getDate() + daysToAdd);

    orders.push({
      id: id(),
      orderNumber: `RMA/${35000 + i}/${new Date(createdAt).getFullYear()}`,
      customerId: customer.id,
      customerName: `${customer.firstName} ${customer.lastName}`,
      customerPhone: customer.phone,
      deviceCategory: cat,
      deviceModel: model,
      serialNumber: `${pick(["C", "D", "F", "G", "H"])}${String(Math.floor(Math.random() * 10000000000)).padStart(10, "0")}`,
      lockCode: Math.random() > 0.3 ? `${Math.floor(1000 + Math.random() * 9000)}` : undefined,
      hasBox: Math.random() > 0.7,
      resetConsent: Math.random() > 0.5,
      condition: "Naturalne ślady użytkowania",
      issueDescription: issue,
      diagnosis: targetIdx >= 2 ? `Potwierdzono: ${issue.toLowerCase()}. Wymagana wymiana komponentu.` : undefined,
      repairDescription: isFinished ? `Wykonano: ${issue.toLowerCase()}. Urządzenie przetestowane.` : undefined,
      repairType: pick(["bateria", "ekran", "ekran", "szybka", "zalanie", "elektroniczna", "regeneracja", "modulowa"]) as Order["repairType"],
      isWarranty: Math.random() > 0.85,
      status,
      priority: pick(["standard", "standard", "standard", "1_dzien", "2_dni", "3_dni", "dzisiaj", "express_1h"]) as Order["priority"],
      statusHistory,
      assignedTo: tech.id,
      receivedBy: receiver.id,
      releasedBy: status === "odebrany" ? receiver.id : undefined,
      locationId: loc.id,
      estimatedCost,
      finalCost,
      partsCost,
      commission: finalCost ? Math.floor(finalCost * tech.commissionRate) : undefined,
      receiveMethod: pick(["osobiscie", "osobiscie", "osobiscie", "door_to_door", "wysylka_wlasna"]) as Order["receiveMethod"],
      returnMethod: pick(["osobiscie", "osobiscie", "osobiscie", "door_to_door", "wysylka_wlasna"]) as Order["returnMethod"],
      pickupCode: pickupCode(),
      smsEnabled: Math.random() > 0.2,
      emailEnabled: Math.random() > 0.5,
      isPaid: status === "odebrany",
      paymentMethod: status === "odebrany" ? pick(["karta", "gotowka", "przelew"]) as Order["paymentMethod"] : undefined,
      cashRegister: status === "odebrany" ? pick(["kasa_karta", "kasa_gotowka", "kasa_przelew", "kasa_inne"]) as Order["cashRegister"] : undefined,
      invoiceRequested: Math.random() > 0.6,
      paczkomatCode: pick(["osobiscie", "door_to_door", "wysylka_wlasna"]) === "door_to_door" ? `WAW${Math.floor(10 + Math.random() * 90)}M` : undefined,
      testBefore: targetIdx >= 1 ? generateTestReport("before", cat, tech.name, new Date(new Date(createdAt).getTime() + 3600000).toISOString()) : undefined,
      testAfter: isFinished ? generateTestReport("after", cat, tech.name, ts.toISOString()) : undefined,
      partsUsed: isFinished ? [{ partId: id(), partName: `Część do ${model}`, quantity: 1, price: partsCost || 100 }] : [],
      photosCount: Math.floor(Math.random() * 5) + 1,
      notes: Math.random() > 0.5 ? [{
        id: id(),
        text: pick([
          "Klient prosi o kontakt telefoniczny po zakończeniu naprawy.",
          "Klient informuje o wcześniejszej naprawie w innym serwisie.",
          "Ustalono z klientem cenę telefonicznie.",
          "Klient prosi o zachowanie oryginalnej baterii.",
          "Sprzęt naprawiany wcześniej w AppleHome - sprawdzić historię.",
        ]),
        author: tech.name,
        createdAt,
      }] : [],
      plannedPickupDate: plannedDate.toISOString(),
      createdAt,
      updatedAt: ts.toISOString(),
      completedAt: isFinished ? ts.toISOString() : undefined,
    });
  }

  return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function generateInventory(): InventoryItem[] {
  const items: { name: string; category: string; deviceCategory: DeviceCategory; models: string[]; price: number; cost: number; sku: string }[] = [
    { name: "Wyświetlacz iPhone 16 Pro Max (OLED)", category: "Wyświetlacze", deviceCategory: "iPhone", models: ["iPhone 16 Pro Max"], price: 1400, cost: 850, sku: "WS-IP16PM" },
    { name: "Wyświetlacz iPhone 15 Pro Max (OLED)", category: "Wyświetlacze", deviceCategory: "iPhone", models: ["iPhone 15 Pro Max"], price: 1200, cost: 720, sku: "WS-IP15PM" },
    { name: "Wyświetlacz iPhone 15 Pro (OLED)", category: "Wyświetlacze", deviceCategory: "iPhone", models: ["iPhone 15 Pro"], price: 980, cost: 590, sku: "WS-IP15P" },
    { name: "Wyświetlacz iPhone 14 Pro (OLED)", category: "Wyświetlacze", deviceCategory: "iPhone", models: ["iPhone 14 Pro"], price: 850, cost: 510, sku: "WS-IP14P" },
    { name: "Wyświetlacz iPhone 13 (OLED)", category: "Wyświetlacze", deviceCategory: "iPhone", models: ["iPhone 13", "iPhone 13 Mini"], price: 520, cost: 310, sku: "WS-IP13" },
    { name: "Matryca MacBook Pro 16 M3/M4", category: "Wyświetlacze", deviceCategory: "MacBook", models: ["MacBook Pro 16 M4 Pro", "MacBook Pro 16 M3 Pro"], price: 3200, cost: 1900, sku: "WS-MBP16" },
    { name: "Matryca MacBook Air 13 M2/M3", category: "Wyświetlacze", deviceCategory: "MacBook", models: ["MacBook Air 13 M3", "MacBook Air 13 M2"], price: 1800, cost: 1080, sku: "WS-MBA13" },
    { name: "Wyświetlacz iPad Pro 11 M4", category: "Wyświetlacze", deviceCategory: "iPad", models: ["iPad Pro 11 M4"], price: 1600, cost: 960, sku: "WS-IPD11" },
    { name: "Bateria iPhone 16 Pro Max", category: "Baterie", deviceCategory: "iPhone", models: ["iPhone 16 Pro Max"], price: 220, cost: 85, sku: "BT-IP16PM" },
    { name: "Bateria iPhone 15 Pro", category: "Baterie", deviceCategory: "iPhone", models: ["iPhone 15 Pro", "iPhone 15 Pro Max"], price: 190, cost: 75, sku: "BT-IP15P" },
    { name: "Bateria iPhone 14 Pro", category: "Baterie", deviceCategory: "iPhone", models: ["iPhone 14 Pro"], price: 170, cost: 65, sku: "BT-IP14P" },
    { name: "Bateria iPhone 13", category: "Baterie", deviceCategory: "iPhone", models: ["iPhone 13"], price: 140, cost: 55, sku: "BT-IP13" },
    { name: "Bateria MacBook Pro 16 A2141", category: "Baterie", deviceCategory: "MacBook", models: ["MacBook Pro 16 M1 Pro"], price: 650, cost: 350, sku: "BT-MBP16" },
    { name: "Bateria MacBook Air 13 M1/M2", category: "Baterie", deviceCategory: "MacBook", models: ["MacBook Air 13 M1", "MacBook Air 13 M2"], price: 450, cost: 240, sku: "BT-MBA13" },
    { name: "Złącze USB-C iPhone 15/16", category: "Złącza ładowania", deviceCategory: "iPhone", models: ["iPhone 15", "iPhone 15 Pro", "iPhone 16", "iPhone 16 Pro"], price: 120, cost: 45, sku: "ZL-USBC" },
    { name: "Złącze Lightning iPhone 14", category: "Złącza ładowania", deviceCategory: "iPhone", models: ["iPhone 14", "iPhone 14 Pro"], price: 95, cost: 35, sku: "ZL-LGHT" },
    { name: "Tylny panel iPhone 15 Pro", category: "Obudowy / Tylne panele", deviceCategory: "iPhone", models: ["iPhone 15 Pro"], price: 380, cost: 190, sku: "OB-IP15P" },
    { name: "Tylny panel iPhone 14 Pro Max", category: "Obudowy / Tylne panele", deviceCategory: "iPhone", models: ["iPhone 14 Pro Max"], price: 350, cost: 175, sku: "OB-IP14PM" },
    { name: "Aparat główny iPhone 15 Pro", category: "Aparaty", deviceCategory: "iPhone", models: ["iPhone 15 Pro"], price: 520, cost: 280, sku: "AP-IP15P" },
    { name: "Klawiatura MacBook Pro 14 M3", category: "Klawiatury", deviceCategory: "MacBook", models: ["MacBook Pro 14 M3 Pro"], price: 850, cost: 450, sku: "KL-MBP14" },
    { name: "Touchpad MacBook Air 13", category: "Touchpady", deviceCategory: "MacBook", models: ["MacBook Air 13 M1", "MacBook Air 13 M2", "MacBook Air 13 M3"], price: 380, cost: 190, sku: "TP-MBA13" },
    { name: "SSD 512GB NVMe MacBook", category: "Dyski SSD", deviceCategory: "MacBook", models: [], price: 450, cost: 250, sku: "SSD-512" },
    { name: "SSD 1TB NVMe MacBook", category: "Dyski SSD", deviceCategory: "MacBook", models: [], price: 750, cost: 420, sku: "SSD-1TB" },
    { name: "Wyświetlacz Apple Watch 9", category: "Wyświetlacze", deviceCategory: "Apple Watch", models: ["Apple Watch 9"], price: 450, cost: 230, sku: "WS-AW9" },
    { name: "Etui silikonowe iPhone 15/16", category: "Akcesoria", deviceCategory: "iPhone", models: [], price: 49, cost: 15, sku: "AK-ETUI" },
    { name: "Szkło hartowane iPhone 15/16", category: "Akcesoria", deviceCategory: "iPhone", models: [], price: 39, cost: 8, sku: "AK-SZKLO" },
    { name: "Ładowarka MagSafe", category: "Akcesoria", deviceCategory: "iPhone", models: [], price: 149, cost: 65, sku: "AK-MAGSF" },
    { name: "Kabel USB-C 2m", category: "Akcesoria", deviceCategory: "Inne", models: [], price: 49, cost: 12, sku: "AK-USBC2" },
  ];

  return items.map((item, idx) => ({
    id: id(),
    name: item.name,
    sku: item.sku,
    category: item.category,
    deviceCategory: item.deviceCategory,
    compatibleModels: item.models,
    quantity: [3, 5, 2, 8, 0, 4, 7, 1, 6, 3, 9, 4, 2, 5, 10, 1, 8, 3, 7, 12, 6, 0, 4, 2, 15, 20, 18, 10][idx] ?? 5,
    minQuantity: item.category === "Akcesoria" ? 5 : 2,
    unitPrice: item.price,
    costPrice: item.cost,
    supplier: pick(["iPartsBuy", "MobileParts.pl", "GSM-Parts", "AppleParts.eu", "TechSupply"]),
    locationId: pick(LOCATIONS).id,
    history: [],
    updatedAt: randomDate(30),
  }));
}

export function generateChat(): ChatMessage[] {
  const messages: ChatMessage[] = [];
  const texts = [
    "Kto ma dziś wolne miejsce na ekspres? Mam iPhone 16 Pro Max z rozbitym ekranem.",
    "Części do MacBooka z RMA/35012 doszły, mogę zacząć naprawę.",
    "Klient z RMA/35008 pytał o status — powiedzcie że jutro gotowe.",
    "Uwaga: dostaliśmy nową dostawę wyświetlaczy iPhone 15 Pro. 5 sztuk na Mokotowie.",
    "Kto jutro otwiera punkt na Woli? Ja nie mogę.",
    "Reklamacja na naprawę z zeszłego tygodnia — iPhone 14 Pro, ekran znów ma problem.",
    "Pamiętajcie o szkoleniu w piątek o 10:00, wszyscy serwisanci.",
    "Czy ktoś ma na stanie baterię do MacBook Air M2? Potrzebuję na Kraków.",
    "Klient B2B z TechCorp chce 10% rabatu na serię 5 napraw. Akceptujemy?",
    "Świetna robota Tomek — 8 napraw dzisiaj! 💪",
    "Zamówiłem kuriera na jutro rano na Śródmieście, 3 paczki do wysyłki.",
    "Mamy problem z drukarką fiskalną na Woli. Ktoś wie co robić?",
  ];

  for (let i = 0; i < texts.length; i++) {
    const emp = pick(EMPLOYEES);
    const msgDate = new Date();
    msgDate.setHours(msgDate.getHours() - (texts.length - i) * 2 - Math.floor(Math.random() * 3));
    messages.push({
      id: id(),
      userId: emp.id,
      userName: emp.name,
      text: texts[i],
      locationId: emp.locationId,
      createdAt: msgDate.toISOString(),
    });
  }

  return messages;
}

export function generateTasks(): Task[] {
  const tasks: Task[] = [];
  const titles = [
    "Skontaktować się z klientem ws. akceptacji kosztów",
    "Zamówić baterię do iPhone 15 Pro",
    "Przygotować sprzęt do wysyłki kurierem",
    "Sprawdzić stan magazynowy wyświetlaczy",
    "Szkolenie z naprawy MacBook M4",
    "Zaktualizować cennik na stronie WWW",
    "Przygotować raport tygodniowy",
    "Przesunąć części na Kraków",
  ];

  titles.forEach((title, i) => {
    const emp = pick(EMPLOYEES.filter(e => e.role === "serwisant" || e.role === "manager"));
    const due = new Date();
    due.setDate(due.getDate() + Math.floor(Math.random() * 7) - 2);
    tasks.push({
      id: id(),
      title,
      assignedTo: emp.id,
      dueDate: due.toISOString(),
      completed: Math.random() > 0.6,
      createdAt: randomDate(14),
    });
  });

  return tasks;
}

export function generateUsedDevices(): UsedDevice[] {
  const devices: UsedDevice[] = [];
  const models = ["iPhone 13", "iPhone 12 Pro", "iPhone 14", "MacBook Air 13 M1", "iPad Air 4", "iPhone 11"];
  models.forEach((model, i) => {
    const isSale = i < 4;
    const cat: DeviceCategory = model.startsWith("MacBook") ? "MacBook" : model.startsWith("iPad") ? "iPad" : "iPhone";
    devices.push({
      id: id(),
      type: isSale ? "do_sprzedania" : "na_czesci",
      model,
      serialNumber: `${pick(["C", "D", "F"])}${String(Math.floor(Math.random() * 10000000000)).padStart(10, "0")}`,
      deviceCategory: cat,
      batteryCondition: isSale ? `${70 + Math.floor(Math.random() * 25)}%` : undefined,
      isWorking: isSale ? Math.random() > 0.2 : false,
      hasICloud: isSale ? Math.random() > 0.8 : undefined,
      issue: !isSale ? pick(["Uszkodzona płyta główna", "Pęknięty ekran + obudowa", "Nie włącza się"]) : undefined,
      notes: isSale ? "Stan dobry, naturalne ślady użytkowania" : "Do rozbiórki na części",
      locationId: pick(LOCATIONS).id,
      price: isSale ? 800 + Math.floor(Math.random() * 3000) : undefined,
      createdAt: randomDate(60),
    });
  });
  return devices;
}

export function generateReservations(customers: Customer[]): Reservation[] {
  const reservations: Reservation[] = [];
  const items = [
    { issue: "Wymiana baterii iPhone 15 Pro", model: "iPhone 15 Pro", type: "czesc_zarezerwowana" as const },
    { issue: "Wymiana matrycy MacBook Pro 14", model: "MacBook Pro 14 M3 Pro", type: "oczekuje_na_dostarczenie" as const },
    { issue: "Wymiana wyświetlacza iPhone 14 Pro Max", model: "iPhone 14 Pro Max", type: "czesc_zarezerwowana" as const },
  ];
  items.forEach((item, idx) => {
    const c = pick(customers);
    const cat: DeviceCategory = item.model.startsWith("MacBook") ? "MacBook" : "iPhone";
    const reservedDate = new Date();
    reservedDate.setDate(reservedDate.getDate() + (idx === 0 ? -3 : 1 + Math.floor(Math.random() * 5)));
    reservations.push({
      id: id(),
      customerId: c.id,
      customerName: `${c.firstName} ${c.lastName}`,
      customerPhone: c.phone,
      deviceCategory: cat,
      deviceModel: item.model,
      issueDescription: item.issue,
      reservationType: item.type,
      locationId: pick(LOCATIONS).id,
      reservedDate: reservedDate.toISOString(),
      notes: "",
      status: idx === 0 ? "zrealizowana" : "aktywna",
      createdAt: randomDate(7),
    });
  });
  return reservations;
}

export function generatePartOrders(): PartOrder[] {
  return [
    { id: id(), orderId: "seed_order_12", orderNumber: "RMA/35012/2026", partName: "Wyświetlacz iPhone 15 Pro Max (OLED)", estimatedCost: 1200, status: "zamowione", requestedBy: "emp2", createdAt: randomDate(5) },
    { id: id(), orderId: "seed_order_25", orderNumber: "RMA/35025/2026", partName: "Bateria MacBook Pro 16", estimatedCost: 650, status: "dostarczone", requestedBy: "emp5", createdAt: randomDate(10) },
    { id: id(), orderId: "seed_order_41", orderNumber: "RMA/35041/2026", partName: "Klawiatura MacBook Air 13 M2", estimatedCost: 450, status: "zamowione", requestedBy: "emp7", createdAt: randomDate(3) },
  ];
}
