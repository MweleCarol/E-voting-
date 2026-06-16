import { mockElections } from "@/lib/data/elections.data";
// import { apiClient } from "@/lib/api/client";  ← uncomment when ready

export const electionsService = {
  async getAll(): Promise<Election[]> {
    // MOCK: return mockElections;
    // REAL: return apiClient.get('/elections');
    return mockElections;
  },

  async getById(id: string): Promise<Election | null> {
    return mockElections.find(e => e.id === id) ?? null;
  },

  async create(payload: CreateElectionPayload): Promise<Election> {
    // Mock: simulate creation
    return { ...payload, id: crypto.randomUUID(), status: "DRAFT", createdAt: new Date().toISOString() };
  }
};