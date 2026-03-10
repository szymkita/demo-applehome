const PREFIX = "serwispro_";

export function getItems<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setItems<T>(key: string, items: T[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFIX + key, JSON.stringify(items));
}

export function getFlag(key: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PREFIX + key) === "true";
}

export function setFlag(key: string, value: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PREFIX + key, String(value));
}
