import { useEffect, useState } from "react";
import { supervisorsApi } from "@/api";
import type { Supervisor } from "@/types/models";

let store: Supervisor[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** BACKEND CALL: GET /supervisors */
const refresh = async () => {
  try {
    store = await supervisorsApi.list();
    emit();
  } catch (err) {
    console.error("Failed to load supervisors", err);
  }
};
refresh();

export const getSupervisors = () => store;

/** BACKEND CALL: POST /supervisors */
export const addSupervisor = async (payload: Omit<Supervisor, "id">) => {
  const created = await supervisorsApi.create(payload);
  store = [...store, created];
  emit();
  return created;
};

/** BACKEND CALL: DELETE /supervisors/:id */
export const removeSupervisor = async (id: number) => {
  store = store.filter((s) => s.id !== id);
  emit();
  try {
    await supervisorsApi.remove(id);
  } catch (err) {
    console.error("removeSupervisor failed", err);
  }
};

export const useSupervisorsStore = (): Supervisor[] => {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return store;
};
