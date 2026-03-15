import { MarkdownHelper } from "../src/utils/MarkdownHelper";
import { TFile } from "obsidian";

function createMockApp(overrides: {
  activeView?: { editor: { getValue: jest.Mock } } | null;
  activeFile?: object | null;
  cachedRead?: jest.Mock;
}) {
  return {
    workspace: {
      getActiveViewOfType: jest.fn(() => overrides.activeView ?? null),
      getActiveFile: jest.fn(() => overrides.activeFile ?? null),
    },
    vault: {
      cachedRead: overrides.cachedRead ?? jest.fn(),
    },
  } as any;
}

describe("MarkdownHelper", () => {
  describe("getMarkdownView", () => {
    it("should return full document content from active editor", async () => {
      const fullText = "# Title\n\nParagraph one.\n\nParagraph two.";
      const app = createMockApp({
        activeView: {
          editor: {
            getValue: jest.fn(() => fullText),
          },
        },
      });

      const helper = new MarkdownHelper(app);
      const result = await helper.getMarkdownView();

      expect(result).toBe(fullText);
    });

    it("should always return full document, never selection", async () => {
      const fullText = "Line 1\nLine 2\nLine 3";
      const getValueMock = jest.fn(() => fullText);
      const app = createMockApp({
        activeView: {
          editor: {
            getValue: getValueMock,
          },
        },
      });

      const helper = new MarkdownHelper(app);
      const result = await helper.getMarkdownView();

      expect(result).toBe(fullText);
      expect(getValueMock).toHaveBeenCalled();
    });

    it("should fall back to cachedRead when no active MarkdownView", async () => {
      const fileContent = "# File content from vault";
      const cachedRead = jest.fn(() => Promise.resolve(fileContent));

      const activeFile = Object.create(TFile.prototype);
      activeFile.path = "test.md";

      const app = createMockApp({
        activeView: null,
        activeFile,
        cachedRead,
      });

      const helper = new MarkdownHelper(app);
      const result = await helper.getMarkdownView();

      expect(result).toBe(fileContent);
      expect(cachedRead).toHaveBeenCalledWith(activeFile);
    });

    it("should return error message when cachedRead fails", async () => {
      const cachedRead = jest.fn(() => Promise.reject(new Error("read error")));

      const activeFile = Object.create(TFile.prototype);
      activeFile.path = "broken.md";

      const app = createMockApp({
        activeView: null,
        activeFile,
        cachedRead,
      });

      const helper = new MarkdownHelper(app);
      const result = await helper.getMarkdownView();

      expect(result).toBe("Error reading the active file.");
    });

    it("should return 'No active file found.' when nothing is open", async () => {
      const app = createMockApp({
        activeView: null,
        activeFile: null,
      });

      const helper = new MarkdownHelper(app);
      const result = await helper.getMarkdownView();

      expect(result).toBe("No active file found.");
    });

    it("should handle empty document", async () => {
      const app = createMockApp({
        activeView: {
          editor: {
            getValue: jest.fn(() => ""),
          },
        },
      });

      const helper = new MarkdownHelper(app);
      const result = await helper.getMarkdownView();

      expect(result).toBe("");
    });
  });

  describe("getActiveFilePath", () => {
    it("should return file path when active file exists", () => {
      const app = createMockApp({
        activeFile: { path: "folder/note.md" },
      });

      const helper = new MarkdownHelper(app);
      expect(helper.getActiveFilePath()).toBe("folder/note.md");
    });

    it("should return null when no active file", () => {
      const app = createMockApp({
        activeFile: null,
      });

      const helper = new MarkdownHelper(app);
      expect(helper.getActiveFilePath()).toBeNull();
    });
  });
});
