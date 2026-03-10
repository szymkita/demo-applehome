export type OrderStatus =
  | "oczekuje_na_diagnoze"
  | "w_trakcie_diagnozy"
  | "oczekuje_na_akceptacje"
  | "w_trakcie_naprawy"
  | "oczekuje_na_czesci"
  | "w_trakcie_testow"
  | "gotowy_do_odbioru"
  | "odebrany"
  | "odkupiony"
  | "zutylizowany"
  | "anulowany";

export type RepairType =
  | "bateria"
  | "ekran"
  | "szybka"
  | "zalanie"
  | "elektroniczna"
  | "regeneracja"
  | "modulowa";

export type Priority =
  | "express_1h"
  | "express_2h"
  | "express_3h"
  | "dzisiaj"
  | "1_dzien"
  | "2_dni"
  | "3_dni"
  | "7_dni"
  | "standard";

export type ReceiveMethod = "osobiscie" | "door_to_door" | "wysylka_wlasna";
export type PaymentMethod = "karta" | "gotowka" | "przelew" | "link_platnosci" | "inne";
export type CashRegister = "kasa_karta" | "kasa_gotowka" | "kasa_inne" | "kasa_przelew";
export type CustomerSource = "google" | "social_media" | "polecenie" | "b2b" | "przypadkowo";
export type DeviceCategory = "iPhone" | "MacBook" | "iPad" | "Apple Watch" | "iMac" | "Inne";

export interface StatusChange {
  status: OrderStatus;
  timestamp: string;
  note?: string;
  userId?: string;
  userName?: string;
  locationId?: string;
}

export interface TestItem {
  name: string;
  result: "ok" | "nok" | "nie_dotyczy" | null;
  note?: string;
}

export interface TestReport {
  type: "before" | "after";
  items: TestItem[];
  performedBy: string;
  performedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string; // RMA/50001/2026
  customerId: string;
  customerName: string;
  customerPhone: string;
  // Device
  deviceCategory: DeviceCategory;
  deviceModel: string;
  serialNumber: string;
  lockCode?: string;
  hasBox: boolean;
  resetConsent: boolean;
  condition: string; // "naturalne ślady użytkowania"
  // Service
  issueDescription: string;
  diagnosis?: string;
  repairDescription?: string;
  repairType: RepairType;
  isWarranty: boolean;
  // Status & flow
  status: OrderStatus;
  priority: Priority;
  statusHistory: StatusChange[];
  // People
  assignedTo?: string;
  receivedBy: string;
  releasedBy?: string;
  // Location
  locationId: string;
  // Costs
  estimatedCost?: number;
  finalCost?: number;
  partsCost?: number;
  commission?: number;
  // Logistics
  receiveMethod: ReceiveMethod;
  returnMethod: ReceiveMethod;
  pickupCode?: string; // e.g. "DIE293W"
  // Notifications
  smsEnabled: boolean;
  emailEnabled: boolean;
  // Payment
  isPaid: boolean;
  paymentMethod?: PaymentMethod;
  cashRegister?: CashRegister;
  invoiceRequested: boolean;
  // Paczkomat
  paczkomatCode?: string;
  // Tests
  testBefore?: TestReport;
  testAfter?: TestReport;
  // Parts used
  partsUsed: { partId: string; partName: string; quantity: number; price: number }[];
  // Photos (simulated as count)
  photosCount: number;
  // Notes
  notes: OrderNote[];
  // Dates
  plannedPickupDate: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface OrderNote {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  type: "individual" | "business";
  firstName: string;
  lastName: string;
  companyName?: string;
  nip?: string;
  street?: string;
  postalCode?: string;
  city: string;
  phone: string;
  email: string;
  source: CustomerSource;
  isB2B: boolean;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string; // "Wyświetlacze", "Baterie", etc.
  deviceCategory: DeviceCategory;
  compatibleModels: string[];
  quantity: number;
  minQuantity: number;
  unitPrice: number;
  costPrice: number;
  supplier: string;
  locationId: string;
  // Tracking
  assignedTo?: string; // serwisant who took it
  history: { action: string; userId: string; date: string; quantity: number }[];
  updatedAt: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  phone: string;
  city: string;
  isActive: boolean;
}

export interface Employee {
  id: string;
  name: string;
  role: "admin" | "serwisant" | "manager" | "recepcja";
  locationId: string;
  avatar: string; // initials
  commissionRate: number; // e.g. 0.15 = 15%
  isActive: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  locationId?: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  originalOrderId: string;
  originalOrderNumber: string;
  type: "reklamacja" | "zwrot";
  description: string;
  status: "otwarta" | "w_trakcie" | "zamknieta";
  createdAt: string;
  resolvedAt?: string;
}

export interface SmsTemplate {
  id: string;
  name: string;
  content: string;
  trigger?: string;
}

export interface Task {
  id: string;
  title: string;
  assignedTo: string;
  dueDate: string;
  completed: boolean;
  orderId?: string;
  createdAt: string;
}

export interface UsedDevice {
  id: string;
  type: "do_sprzedania" | "na_czesci";
  model: string;
  serialNumber: string;
  deviceCategory: DeviceCategory;
  batteryCondition?: string;
  isWorking?: boolean;
  hasICloud?: boolean;
  issue?: string;
  notes: string;
  originOrderId?: string;
  originOrderNumber?: string;
  locationId: string;
  price?: number;
  createdAt: string;
}

export interface Reservation {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  deviceCategory: DeviceCategory;
  deviceModel: string;
  issueDescription: string;
  reservationType: "oczekuje_na_dostarczenie" | "czesc_zarezerwowana";
  locationId: string;
  reservedDate: string;
  notes: string;
  status: "aktywna" | "zrealizowana" | "anulowana";
  createdAt: string;
}

export interface PartOrder {
  id: string;
  orderId: string;
  orderNumber: string;
  partName: string;
  estimatedCost: number;
  status: "zamowione" | "dostarczone" | "anulowane";
  requestedBy: string;
  createdAt: string;
}
