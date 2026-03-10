"use client";

import { useState, useEffect, useCallback } from "react";
import { getItems, setItems, getFlag, setFlag } from "@/lib/storage";
import { generateCustomers, generateOrders, generateInventory, generateChat, generateTasks, generateUsedDevices, generateReservations, generatePartOrders } from "@/lib/seed-data";
import { Order, Customer, InventoryItem, ChatMessage, Task, UsedDevice, Reservation, PartOrder, Complaint } from "@/types";

function useCollection<T extends { id: string }>(key: string) {
  const [items, setItemsState] = useState<T[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setItemsState(getItems<T>(key));
    setMounted(true);
  }, [key]);

  const persist = useCallback(
    (next: T[]) => {
      setItemsState(next);
      setItems(key, next);
    },
    [key]
  );

  const add = useCallback(
    (item: T) => {
      const next = [item, ...getItems<T>(key)];
      persist(next);
    },
    [key, persist]
  );

  const update = useCallback(
    (id: string, patch: Partial<T>) => {
      const current = getItems<T>(key);
      const next = current.map((i) => (i.id === id ? { ...i, ...patch } : i));
      persist(next);
    },
    [key, persist]
  );

  const remove = useCallback(
    (id: string) => {
      const next = getItems<T>(key).filter((i) => i.id !== id);
      persist(next);
    },
    [key, persist]
  );

  return { items, mounted, add, update, remove, refresh: () => setItemsState(getItems<T>(key)) };
}

export function useOrders() {
  return useCollection<Order>("orders");
}

export function useCustomers() {
  return useCollection<Customer>("customers");
}

export function useInventory() {
  return useCollection<InventoryItem>("inventory");
}

export function useChat() {
  return useCollection<ChatMessage>("chat");
}

export function useTasks() {
  return useCollection<Task>("tasks");
}

export function useUsedDevices() {
  return useCollection<UsedDevice>("used_devices");
}

export function useReservations() {
  return useCollection<Reservation>("reservations");
}

export function usePartOrders() {
  return useCollection<PartOrder>("part_orders");
}

export function useComplaints() {
  return useCollection<Complaint>("complaints");
}

export function useSeed() {
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (getFlag("seeded_v5")) {
      setSeeded(true);
      return;
    }
    const customers = generateCustomers();
    const orders = generateOrders(customers);
    const inventory = generateInventory();
    const chat = generateChat();
    const tasks = generateTasks();
    const usedDevices = generateUsedDevices();
    const reservations = generateReservations(customers);
    const partOrders = generatePartOrders();

    setItems("customers", customers);
    setItems("orders", orders);
    setItems("inventory", inventory);
    setItems("chat", chat);
    setItems("tasks", tasks);
    setItems("used_devices", usedDevices);
    setItems("reservations", reservations);
    setItems("part_orders", partOrders);
    setFlag("seeded_v5", true);
    setSeeded(true);
    window.location.reload();
  }, []);

  return seeded;
}
