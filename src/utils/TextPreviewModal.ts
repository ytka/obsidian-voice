import { App, Modal } from "obsidian";

export class TextPreviewModal extends Modal {
  private text: string;

  constructor(app: App, text: string) {
    super(app);
    this.text = text;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h2", { text: "TTS Text Preview" });

    const info = contentEl.createDiv();
    info.style.marginBottom = "12px";
    info.style.color = "var(--text-muted)";
    info.style.fontSize = "12px";
    info.textContent = `${this.text.length} characters`;

    const textArea = contentEl.createEl("textarea");
    textArea.value = this.text;
    textArea.readOnly = true;
    textArea.style.width = "100%";
    textArea.style.height = "400px";
    textArea.style.fontFamily = "var(--font-monospace)";
    textArea.style.fontSize = "13px";
    textArea.style.padding = "12px";
    textArea.style.border = "1px solid var(--background-modifier-border)";
    textArea.style.borderRadius = "6px";
    textArea.style.backgroundColor = "var(--background-secondary)";
    textArea.style.color = "var(--text-normal)";
    textArea.style.resize = "vertical";
  }

  onClose() {
    this.contentEl.empty();
  }
}
