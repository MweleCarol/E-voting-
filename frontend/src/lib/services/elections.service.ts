import { mockElections } from "@/lib/data/elections.data";
import type { Election, CreateElectionPayload } from "@/lib/types";

export const electionsService = {
  async getAll(): Promise<Election[]> {
    return mockElections;
  },

  async getById(id: string): Promise<Election | null> {
    return mockElections.find((e) => e.id === id) ?? null;
  },

  async create(payload: CreateElectionPayload): Promise<Election> {
    return {
      ...payload,
      id: crypto.randomUUID(),
      status: "DRAFT",
      createdAt: new Date().toISOString(),
      createdBy: "mock-admin-001",
      positions: [],
    };
  },
};