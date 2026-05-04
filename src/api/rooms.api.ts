import { apiClient, USE_MOCK } from "./client";
import { mockRooms } from "@/data/mock/rooms.mock";
import { mockViolations } from "@/data/mock/violations.mock";
import type { Room, Violation } from "@/types/models";

const delay = <T,>(data: T, ms = 200): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms));

export const roomsApi = {
  /** GET /rooms */
  list: async (): Promise<Room[]> => {
    if (USE_MOCK) return delay(mockRooms);
    const { data } = await apiClient.get<Room[]>("/rooms");
    return data;
  },

  /** GET /rooms/:id */
  get: async (id: number): Promise<Room> => {
    if (USE_MOCK) {
      const r = mockRooms.find((x) => x.id === id);
      if (!r) throw new Error("Room not found");
      return delay(r);
    }
    const { data } = await apiClient.get<Room>(`/rooms/${id}`);
    return data;
  },

  /** GET /rooms/:id/violations — quan hệ 1-nhiều */
  listViolations: async (roomId: number): Promise<Violation[]> => {
    if (USE_MOCK) return delay(mockViolations.filter((v) => v.room_id === roomId));
    const { data } = await apiClient.get<Violation[]>(`/rooms/${roomId}/violations`);
    return data;
  },

  /** POST /rooms */
  create: async (payload: Omit<Room, "id">): Promise<Room> => {
    if (USE_MOCK) {
      const next: Room = { ...payload, id: Math.max(0, ...mockRooms.map((r) => r.id)) + 1 };
      mockRooms.push(next);
      return delay(next);
    }
    const { data } = await apiClient.post<Room>("/rooms", payload);
    return data;
  },

  /** PATCH /rooms/:id */
  update: async (id: number, patch: Partial<Room>): Promise<Room> => {
    if (USE_MOCK) {
      const idx = mockRooms.findIndex((r) => r.id === id);
      if (idx < 0) throw new Error("Room not found");
      mockRooms[idx] = { ...mockRooms[idx], ...patch };
      return delay(mockRooms[idx]);
    }
    const { data } = await apiClient.patch<Room>(`/rooms/${id}`, patch);
    return data;
  },

  /** DELETE /rooms/:id */
  remove: async (id: number): Promise<void> => {
    if (USE_MOCK) {
      const idx = mockRooms.findIndex((r) => r.id === id);
      if (idx >= 0) mockRooms.splice(idx, 1);
      return delay(undefined);
    }
    await apiClient.delete(`/rooms/${id}`);
  },
};
