import { apiClient } from "./client";
import type { Camera } from "@/types/models";

/**
 * Cameras API — axios thuần. Camera KHÔNG có trường status; trạng thái nằm trên Room.
 */
export const camerasApi = {
  /**
   * GET /cameras
   * Lấy danh sách camera. BE nên hydrate `room` để FE không phải join thủ công.
   * Response: Camera[]
   */
  list: async (): Promise<Camera[]> => {
    const { data } = await apiClient.get<Camera[]>("/cameras");
    return data;
  },

  /**
   * GET /cameras/:id
   * Response: Camera
   */
  get: async (id: number): Promise<Camera> => {
    const { data } = await apiClient.get<Camera>(`/cameras/${id}`);
    return data;
  },

  /**
   * POST /cameras
   * Tạo camera và gắn vào một phòng (room_id).
   * Body: Omit<Camera, "id" | "room">
   * Response: Camera
   *
   * LƯU Ý nghiệp vụ (FE đảm nhận, BE có thể replicate):
   *   - Khi camera được gắn vào phòng → phòng đó chuyển sang status="live".
   *   - Nếu camera trước đó đã thuộc phòng khác đang "ended" thì FE sẽ
   *     đưa phòng cũ về "upcoming".
   */
  create: async (payload: Omit<Camera, "id" | "room">): Promise<Camera> => {
    const { data } = await apiClient.post<Camera>("/cameras", payload);
    return data;
  },

  /**
   * PATCH /cameras/:id
   * Body: Partial<Omit<Camera, "id" | "room">>
   * Response: Camera
   */
  update: async (id: number, patch: Partial<Omit<Camera, "id" | "room">>): Promise<Camera> => {
    const { data } = await apiClient.patch<Camera>(`/cameras/${id}`, patch);
    return data;
  },

  /**
   * DELETE /cameras/:id
   */
  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/cameras/${id}`);
  },

  /**
   * POST /cameras/:id/video  (multipart/form-data, field "video")
   * Upload file video cho camera; backend trả url đã lưu.
   * Response: { url: string }
   */
  uploadVideo: async (id: number, file: File): Promise<{ url: string }> => {
    const form = new FormData();
    form.append("video", file);
    const { data } = await apiClient.post<{ url: string }>(`/cameras/${id}/video`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};
