import { apiClient } from "./client";
import type { FrameLog, VideoLog, Violation } from "@/types/models";

/**
 * Violations API — axios thuần. Quan hệ N-1 với Room qua room_id.
 */
export const violationsApi = {
  /**
   * GET /violations?room_id=...
   * Lọc theo phòng nếu có; không truyền thì lấy toàn bộ.
   * Response: Violation[]
   */
  list: async (params?: { room_id?: number }): Promise<Violation[]> => {
    const { data } = await apiClient.get<Violation[]>("/violations", { params });
    return data;
  },

  /**
   * GET /violations/:id
   * Response: Violation (kèm frameLogs & videoLogs)
   */
  get: async (id: number): Promise<Violation> => {
    const { data } = await apiClient.get<Violation>(`/violations/${id}`);
    return data;
  },

  /**
   * GET /violations/:id/frames
   * Response: FrameLog[]   ({ frameId, behavior, confidence })
   */
  listFrames: async (violationId: number): Promise<FrameLog[]> => {
    const { data } = await apiClient.get<FrameLog[]>(`/violations/${violationId}/frames`);
    return data;
  },

  /**
   * GET /violations/:id/videos
   * Response: VideoLog[]   ({ videoId, behavior, startTime, endTime })
   */
  listVideos: async (violationId: number): Promise<VideoLog[]> => {
    const { data } = await apiClient.get<VideoLog[]>(`/violations/${violationId}/videos`);
    return data;
  },

  /**
   * POST /violations
   * Body: Omit<Violation, "id" | "room">
   * Response: Violation
   */
  create: async (payload: Omit<Violation, "id" | "room">): Promise<Violation> => {
    const { data } = await apiClient.post<Violation>("/violations", payload);
    return data;
  },

  /** DELETE /violations/:id */
  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/violations/${id}`);
  },
};
