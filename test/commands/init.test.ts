import { describe, test, expect, beforeEach, afterEach, spyOn } from "bun:test";
import { existsSync, mkdirSync, rmSync, readFileSync } from "fs";
import { join } from "path";
import { createInitCommand } from "../../src/commands/init";

describe("init command", () => {
  const testDir = join(__dirname, "..", "fixtures", "init-test");
  const configDir = join(testDir, ".please");
  const configPath = join(configDir, "config.yml");

  let consoleLogSpy: ReturnType<typeof spyOn>;
  let consoleErrorSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    // Suppress console output during tests
    consoleLogSpy = spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});

    // Clean up test directory before each test
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    mkdirSync(testDir, { recursive: true });

    // Change to test directory
    process.chdir(testDir);
  });

  afterEach(() => {
    // Restore console
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();

    // Clean up after tests
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe("createInitCommand", () => {
    test("should create command with correct name and description", () => {
      const command = createInitCommand();

      expect(command.name()).toBe("init");
      expect(command.description()).toBe("Initialize .please/config.yml with interactive configuration");
    });

    test("should have force and yes options", () => {
      const command = createInitCommand();
      const options = command.options;

      const forceOption = options.find(opt => opt.long === "--force");
      expect(forceOption).toBeDefined();
      expect(forceOption?.short).toBe("-f");

      const yesOption = options.find(opt => opt.long === "--yes");
      expect(yesOption).toBeDefined();
      expect(yesOption?.short).toBe("-y");
    });
  });

  describe("init execution with --yes flag", () => {
    test("should create .please directory if it does not exist", async () => {
      const command = createInitCommand();

      expect(existsSync(configDir)).toBe(false);

      await command.parseAsync(["node", "test", "init", "--yes"], { from: "user" });

      expect(existsSync(configDir)).toBe(true);
    });

    test("should create config.yml file with correct content", async () => {
      const command = createInitCommand();

      await command.parseAsync(["node", "test", "init", "--yes"], { from: "user" });

      expect(existsSync(configPath)).toBe(true);

      const content = readFileSync(configPath, "utf-8");

      // Check for key sections
      expect(content).toContain("# GitHub Please Configuration");
      expect(content).toContain("code_review:");
      expect(content).toContain("issue_workflow:");
      expect(content).toContain("code_workspace:");
      expect(content).toContain("language:");
    });

    test("should create config with default values", async () => {
      const command = createInitCommand();

      await command.parseAsync(["node", "test", "init", "--yes"], { from: "user" });

      const content = readFileSync(configPath, "utf-8");

      // Verify default values
      expect(content).toContain("disable: false");
      expect(content).toContain("comment_severity_threshold: MEDIUM");
      expect(content).toContain("max_review_comments: -1");
      // Language will be auto-detected (ko or en)
      expect(content).toMatch(/language: (ko|en)/);
    });

    test("should include all pull_request_opened configuration", async () => {
      const command = createInitCommand();

      await command.parseAsync(["node", "test", "init", "--yes"], { from: "user" });

      const content = readFileSync(configPath, "utf-8");

      expect(content).toContain("pull_request_opened:");
      expect(content).toContain("help: false");
      expect(content).toContain("summary: true");
      expect(content).toContain("code_review: true");
      expect(content).toContain("include_drafts: true");
    });

    test("should include all issue_workflow configuration", async () => {
      const command = createInitCommand();

      await command.parseAsync(["node", "test", "init", "--yes"], { from: "user" });

      const content = readFileSync(configPath, "utf-8");

      // Triage config
      expect(content).toContain("triage:");
      expect(content).toContain("auto: true");
      expect(content).toContain("manual: true");
      expect(content).toContain("update_issue_type: true");

      // Investigate config
      expect(content).toContain("investigate:");
      expect(content).toContain("enabled: true");
      expect(content).toContain("org_members_only: true");
      expect(content).toContain("auto_on_bug_label: false");

      // Fix config
      expect(content).toContain("fix:");
      expect(content).toContain("require_investigation: false");
      expect(content).toContain("auto_create_pr: true");
      expect(content).toContain("auto_run_tests: true");
    });

    test("should include helpful comments", async () => {
      const command = createInitCommand();

      await command.parseAsync(["node", "test", "init", "--yes"], { from: "user" });

      const content = readFileSync(configPath, "utf-8");

      // Check for helpful comments
      expect(content).toContain("# Set to true to disable");
      expect(content).toContain("# Minimum severity level");
      expect(content).toContain("# Maximum number of review comments");
      expect(content).toContain("# Language for bot responses");
    });

    test("should fail if config file already exists", async () => {
      const command = createInitCommand();

      // Mock process.exit to prevent test from exiting
      const exitSpy = spyOn(process, "exit").mockImplementation(() => {
        throw new Error("process.exit called");
      });

      try {
        // Create config first time
        await command.parseAsync(["node", "test", "init", "--yes"], { from: "user" });

        // Try to create again without --force
        const secondCommand = createInitCommand();

        await expect(
          secondCommand.parseAsync(["node", "test", "init", "--yes"], { from: "user" })
        ).rejects.toThrow("process.exit called");

        // Verify exit was called with code 1
        expect(exitSpy).toHaveBeenCalledWith(1);
      } finally {
        exitSpy.mockRestore();
      }
    });

    test("should overwrite config file with --force flag", async () => {
      const command = createInitCommand();

      // Create config first time
      await command.parseAsync(["node", "test", "init", "--yes"], { from: "user" });

      // Modify the file
      const originalContent = readFileSync(configPath, "utf-8");
      const modifiedContent = originalContent + "\n# Modified content";
      require("fs").writeFileSync(configPath, modifiedContent);

      // Create again with --force and --yes
      const secondCommand = createInitCommand();
      await secondCommand.parseAsync(["node", "test", "init", "--force", "--yes"], { from: "user" });

      // Verify file was overwritten (doesn't contain modification)
      const newContent = readFileSync(configPath, "utf-8");
      expect(newContent).not.toContain("# Modified content");
      expect(newContent).toContain("# GitHub Please Configuration");
    });

    test("should work when .please directory already exists", async () => {
      // Create .please directory first
      mkdirSync(configDir, { recursive: true });

      const command = createInitCommand();
      await command.parseAsync(["node", "test", "init", "--yes"], { from: "user" });

      expect(existsSync(configPath)).toBe(true);
    });

    test("should create valid YAML structure", async () => {
      const command = createInitCommand();

      await command.parseAsync(["node", "test", "init", "--yes"], { from: "user" });

      const content = readFileSync(configPath, "utf-8");

      // Basic YAML validation - check indentation and structure
      const lines = content.split("\n");

      // Find code_review section
      const codeReviewLine = lines.findIndex(line => line.trim() === "code_review:");
      expect(codeReviewLine).toBeGreaterThan(-1);

      // Check that nested properties are indented
      const nextLine = lines[codeReviewLine + 2]; // Skip comment
      expect(nextLine).toMatch(/^\s{2}/); // Should be indented with 2 spaces
    });
  });
});
