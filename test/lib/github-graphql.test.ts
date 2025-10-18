import { describe, test, expect } from "bun:test";
import {
  executeGraphQL,
  getIssueNodeId,
  getPrNodeId,
  addSubIssue,
  removeSubIssue,
  listSubIssues,
  addBlockedBy,
  removeBlockedBy,
  listBlockedBy,
  resolveReviewThread,
  listReviewThreads,
} from "../../src/lib/github-graphql";

describe("github-graphql", () => {
  describe("executeGraphQL", () => {
    test("should export function", () => {
      expect(typeof executeGraphQL).toBe("function");
    });
  });

  describe("getIssueNodeId", () => {
    test("should export function with correct signature", () => {
      expect(typeof getIssueNodeId).toBe("function");
    });
  });

  describe("getPrNodeId", () => {
    test("should export function with correct signature", () => {
      expect(typeof getPrNodeId).toBe("function");
    });
  });

  describe("addSubIssue", () => {
    test("should export function with correct signature", () => {
      expect(typeof addSubIssue).toBe("function");
    });
  });

  describe("removeSubIssue", () => {
    test("should export function with correct signature", () => {
      expect(typeof removeSubIssue).toBe("function");
    });
  });

  describe("listSubIssues", () => {
    test("should export function with correct signature", () => {
      expect(typeof listSubIssues).toBe("function");
    });
  });

  describe("addBlockedBy", () => {
    test("should export function with correct signature", () => {
      expect(typeof addBlockedBy).toBe("function");
    });
  });

  describe("removeBlockedBy", () => {
    test("should export function with correct signature", () => {
      expect(typeof removeBlockedBy).toBe("function");
    });
  });

  describe("listBlockedBy", () => {
    test("should export function with correct signature", () => {
      expect(typeof listBlockedBy).toBe("function");
    });
  });

  describe("resolveReviewThread", () => {
    test("should export function with correct signature", () => {
      expect(typeof resolveReviewThread).toBe("function");
    });
  });

  describe("listReviewThreads", () => {
    test("should export function with correct signature", () => {
      expect(typeof listReviewThreads).toBe("function");
    });
  });
});
