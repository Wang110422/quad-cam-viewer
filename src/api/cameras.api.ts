import { apiClient, USE_MOCK } from "./client";
import { mockCameras } from "@/data/mock/cameras.mock";
import { mockRooms } from "@/data/mock/rooms.mock";
import type { Camera } from "@/types/models";

const delay = <T,>(data: T, ms = 200): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms));

const hydrate = (cam: Camera): Camera => ({
  ...cam,
  room: mockRooms.find((r) => r.id === cam.room_id),
});

export const camerasApi = {
  /** GET /cameras — kèm room (1-1) */
  list: async (): Promise<Camera[]> => {
    if (USE_MOCK) return delay(mockCameras.map(hydrate));
    const { data } = await apiClient.get<Camera[]>("/cameras");
    return data;
  },

  /** GET /cameras/:id */
  get: async (id: number): Promise<Camera> => {
    if (USE_MOCK) {
      const c = mockCameras.find((x) => x.id === id);
      if (!c) throw new Error("Camera not found");
      return delay(hydrate(c));
    }
    const { data } = await apiClient.get<Camera>(`/cameras/${id}`);
    return data;
  },

  /** POST /cameras */
  create: async (payload: Omit<Camera, "id" | "room">): Promise<Camera> => {
    if (USE_MOCK) {
      const next: Camera = { ...payload, id: Math.max(0, ...mockCameras.map((c) => c.id)) + 1 };
      mockCameras.push(next);
      return delay(hydrate(next));
    }
    const { data } = await apiClient.post<Camera>("/cameras", payload);
    return data;
  },

  /** PATCH /cameras/:id */
  update: async (id: number, patch: Partial<Omit<Camera, "id" | "room">>): Promise<Camera> => {
    if (USE_MOCK) {
      const idx = mockCameras.findIndex((c) => c.id === id);
      if (idx < 0) throw new Error("Camera not found");
      mockCameras[idx] = { ...mockCameras[idx], ...patch };
      return delay(hydrate(mockCameras[idx]));
    }
    const { data } = await apiClient.patch<Camera>(`/cameras/${id}`, patch);
    return data;
  },

  /** DELETE /cameras/:id */
  remove: async (id: number): Promise<void> => {
    if (USE_MOCK) {
      const idx = mockCameras.findIndex((c) => c.id === id);
      if (idx >= 0) mockCameras.splice(idx, 1);
      return delay(undefined);
    }
    await apiClient.delete(`/cameras/${id}`);
  },

  /** POST /cameras/:id/video — upload file video */
  uploadVideo: async (id: number, file: File): Promise<{ url: string }> => {
    if (USE_MOCK) return delay({ url: URL.createObjectURL(file) });
    const form = new FormData();
    form.append("video", file);
    const { data } = await apiClient.post<{ url: string }>(`/cameras/${id}/video`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};
