import { MarkdownView, TFile, App } from "obsidian";

export class MarkdownHelper {
  private app: App;

  constructor(app: App) {
    this.app = app;
  }

  async getMarkdownView(): Promise<string> {
    // First, try to get content from the active MarkdownView (current behavior)
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    let content = "";

    if (activeView) {
      const title = this.getActiveFileTitle();
      content = activeView.editor.getValue();
      return title ? `# ${title}\n\n${content}` : content;
    }

    // If no MarkdownView is active, try to get the active file
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile && activeFile instanceof TFile) {
      try {
        const title = activeFile.basename;
        content = await this.app.vault.cachedRead(activeFile);
        return title ? `# ${title}\n\n${content}` : content;
      } catch (error) {
        console.error("Error reading active file:", error);
        return "Error reading the active file.";
      }
    }

    // If no active file is found, return the error message
    return "No active file found.";
  }

  getActiveFilePath(): string | null {
    const activeFile = this.app.workspace.getActiveFile();
    return activeFile?.path || null;
  }

  private getActiveFileTitle(): string | null {
    const activeFile = this.app.workspace.getActiveFile();
    return activeFile?.basename || null;
  }
}
