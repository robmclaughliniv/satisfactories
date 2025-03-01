import { GET, POST, PUT, DELETE } from "./route";
import { NextResponse } from "next/server";
import db from "../../../services/db";

// Mock the db module and its query function
jest.mock("../../../services/db", () => ({
  query: jest.fn(),
}));

describe("Worlds API", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET", () => {
    it("should return list of worlds on success", async () => {
      (db.query as jest.Mock).mockResolvedValue({ rows: [{ id: 1, name: "Test World" }] });
      const response = await GET();
      const data = await response.json();
      expect(data.worlds).toBeDefined();
      expect(data.worlds[0]).toHaveProperty("id", 1);
    });

    it("should handle errors", async () => {
      (db.query as jest.Mock).mockRejectedValue(new Error("DB Error"));
      const response = await GET();
      const data = await response.json();
      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch worlds.");
    });
  });

  describe("POST", () => {
    const validInput = {
      name: "New World",
      biome: "Forest",
      gameVersion: "1.0",
      difficulty: "Easy",
      coordinates: [0, 0],
      tags: ["tag1"],
      powerStats: { hp: 100 },
      startDate: "2025-02-16",
    };

    it("should create a new world and return it", async () => {
      const fakeWorld = { id: 1, name: "New World" };
      (db.query as jest.Mock).mockResolvedValue({ rows: [fakeWorld] });
      const fakeRequest = {
        json: async () => validInput,
      } as Request;

      const response = await POST(fakeRequest);
      const data = await response.json();
      expect(data.world).toEqual(fakeWorld);
    });

    it("should handle errors during creation", async () => {
      (db.query as jest.Mock).mockRejectedValue(new Error("DB Error"));
      const fakeRequest = {
        json: async () => validInput,
      } as Request;

      const response = await POST(fakeRequest);
      const data = await response.json();
      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to create world.");
    });
  });

  describe("PUT", () => {
    const validUpdateInput = {
      id: 1,
      updateData: {
        name: "Updated World",
      },
    };

    it("should update an existing world", async () => {
      const updatedWorld = { id: 1, name: "Updated World" };
      (db.query as jest.Mock).mockResolvedValue({ rows: [updatedWorld] });
      const fakeRequest = {
        json: async () => validUpdateInput,
      } as Request;

      const response = await PUT(fakeRequest);
      const data = await response.json();
      expect(data.world).toEqual(updatedWorld);
    });

    it("should return 400 if id is missing", async () => {
      const invalidInput = { updateData: { name: "No ID" } };
      const fakeRequest = {
        json: async () => invalidInput,
      } as Request;

      const response = await PUT(fakeRequest);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe("World id is required for update.");
    });

    it("should return 404 if world not found", async () => {
      (db.query as jest.Mock).mockResolvedValue({ rows: [] });
      const fakeRequest = {
        json: async () => validUpdateInput,
      } as Request;

      const response = await PUT(fakeRequest);
      const data = await response.json();
      expect(response.status).toBe(404);
      expect(data.error).toBe("World not found.");
    });
  });

  describe("DELETE", () => {
    it("should delete an existing world", async () => {
      const fakeWorld = { id: 1, name: "To be deleted" };
      (db.query as jest.Mock).mockResolvedValue({ rows: [fakeWorld] });
      const fakeRequest = {
        json: async () => ({ id: 1 }),
      } as Request;

      const response = await DELETE(fakeRequest);
      const data = await response.json();
      expect(data.message).toBe("World deleted successfully.");
    });

    it("should return 400 if id is missing", async () => {
      const fakeRequest = {
        json: async () => ({}),
      } as Request;

      const response = await DELETE(fakeRequest);
      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe("World id is required for deletion.");
    });

    it("should return 404 if world not found", async () => {
      (db.query as jest.Mock).mockResolvedValue({ rows: [] });
      const fakeRequest = {
        json: async () => ({ id: 999 }),
      } as Request;

      const response = await DELETE(fakeRequest);
      const data = await response.json();
      expect(response.status).toBe(404);
      expect(data.error).toBe("World not found.");
    });
  });
});
