// Legacy types — UI cũ import { supervisors } từ đây.
// Data thật do backend cung cấp qua src/api/supervisors.api.ts.
import type { Supervisor as ModelSupervisor } from "@/types/models";

export type Supervisor = ModelSupervisor;

export const supervisors: Supervisor[] = [];
