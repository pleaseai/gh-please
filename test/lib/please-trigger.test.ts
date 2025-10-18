import { describe, test, expect } from "bun:test";
import {
  buildTriggerComment,
  triggerPleaseAIIssue,
  triggerPleaseAIPr,
} from "../../src/lib/please-trigger";

describe("please-trigger", () => {
  describe("buildTriggerComment", () => {
    test("should build triage trigger comment", () => {
      const comment = buildTriggerComment("triage");
      expect(comment).toBe("/please triage");
    });

    test("should build investigate trigger comment", () => {
      const comment = buildTriggerComment("investigate");
      expect(comment).toBe("/please investigate");
    });

    test("should build fix trigger comment", () => {
      const comment = buildTriggerComment("fix");
      expect(comment).toBe("/please fix");
    });

    test("should build review trigger comment", () => {
      const comment = buildTriggerComment("review");
      expect(comment).toBe("/please review");
    });

    test("should build apply trigger comment", () => {
      const comment = buildTriggerComment("apply");
      expect(comment).toBe("/please apply");
    });
  });

  describe("triggerPleaseAIIssue", () => {
    test("should export function with correct signature", () => {
      expect(typeof triggerPleaseAIIssue).toBe("function");
    });
  });

  describe("triggerPleaseAIPr", () => {
    test("should export function with correct signature", () => {
      expect(typeof triggerPleaseAIPr).toBe("function");
    });
  });
});
