import { useEffect, useState } from "react";
import { rooms as initialRooms, type RoomData, type RoomStatusType } from "@/data/rooms";

let store: RoomData[] = [...initialRooms];
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

export const getRooms = () => store;

export const addRoom = (room: Omit<RoomData, "id"> & { id?: number }) => {
  const id = room.id ?? Math.max(0, ...store.map((r) => r.id)) + 1;
  const next: RoomData = { ...room, id } as RoomData;
  store = [...store, next];
  emit();
  return next;
};

export const updateRoom = (id: number, patch: Partial<RoomData>) => {
  store = store.map((r) => (r.id === id ? { ...r, ...patch } : r));
  emit();
};

export const useRoomsStore = (): RoomData[] => {
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

export type { RoomData, RoomStatusType };
