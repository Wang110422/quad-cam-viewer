import { apiClient } from "./client";
import type { Supervisor } from "@/types/models";

/**
 * Supervisors API — axios thuần.
 */
export const supervisorsApi = {
  /**
   * GET /supervisors
   * Response: Supervisor[]
   */
  list: async (): Promise<Supervisor[]> => {
    const { data } = await apiClient.get<Supervisor[]>("/supervisors");
    return data;
  },

  /**
   * POST /supervisors
   * Body: Omit<Supervisor, "id">
   * Response: Supervisor
   */
  create: async (payload: Omit<Supervisor, "id">): Promise<Supervisor> => {
    const { data } = await apiClient.post<Supervisor>("/supervisors", payload);
    return data;
  },

  /** PATCH /supervisors/:id */
  update: async (id: number, patch: Partial<Supervisor>): Promise<Supervisor> => {
    const { data } = await apiClient.patch<Supervisor>(`/supervisors/${id}`, patch);
    return data;
  },

  /** DELETE /supervisors/:id */
  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/supervisors/${id}`);
  },
};
