import { apiClient, USE_MOCK } from "./client";
import { mockViolations } from "@/data/mock/violations.mock";
import { mockRooms } from "@/data/mock/rooms.mock";
import type { FrameLog, VideoLog, Violation } from "@/types/models";

const delay = <T,>(data: T, ms = 200): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms));

const hydrate = (v: Violation): Violation => ({
  ...v,
  room: mockRooms.find((r) => r.id === v.room_id),
});

export const violationsApi = {
  /** GET /violations?room_id= */
  list: async (params?: { room_id?: number }): Promise<Violation[]> => {
    if (USE_MOCK) {
      const list = params?.room_id
        ? mockViolations.filter((v) => v.room_id === params.room_id)
        : mockViolations;
      return delay(list.map(hydrate));
    }
    const { data } = await apiClient.get<Violation[]>("/violations", { params });
    return data;
  },

  /** GET /violations/:id */
  get: async (id: number): Promise<Violation> => {
    if (USE_MOCK) {
      const v = mockViolations.find((x) => x.id === id);
      if (!v) throw new Error("Violation not found");
      return delay(hydrate(v));
    }
    const { data } = await apiClient.get<Violation>(`/violations/${id}`);
    return data;
  },

  /** GET /violations/:id/frames */
  listFrames: async (violationId: number): Promise<FrameLog[]> => {
    if (USE_MOCK) {
      const v = mockViolations.find((x) => x.id === violationId);
      return delay(v?.frameLogs ?? []);
    }
    const { data } = await apiClient.get<FrameLog[]>(`/violations/${violationId}/frames`);
    return data;
  },

  /** GET /violations/:id/videos */
  listVideos: async (violationId: number): Promise<VideoLog[]> => {
    if (USE_MOCK) {
      const v = mockViolations.find((x) => x.id === violationId);
      return delay(v?.videoLogs ?? []);
    }
    const { data } = await apiClient.get<VideoLog[]>(`/violations/${violationId}/videos`);
    return data;
  },

  /** POST /violations */
  create: async (payload: Omit<Violation, "id" | "room">): Promise<Violation> => {
    if (USE_MOCK) {
      const next: Violation = { ...payload, id: Math.max(0, ...mockViolations.map((v) => v.id)) + 1 };
      mockViolations.push(next);
      return delay(hydrate(next));
    }
    const { data } = await apiClient.post<Violation>("/violations", payload);
    return data;
  },

  /** DELETE /violations/:id */
  remove: async (id: number): Promise<void> => {
    if (USE_MOCK) {
      const idx = mockViolations.findIndex((v) => v.id === id);
      if (idx >= 0) mockViolations.splice(idx, 1);
      return delay(undefined);
    }
    await apiClient.delete(`/violations/${id}`);
  },
};
