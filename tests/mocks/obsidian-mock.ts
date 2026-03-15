export class MarkdownView {}
export class TFile {}
export class App {}
export class Plugin {}
export class PluginSettingTab {}
export class Setting {}
export class Notice {
  constructor(_message: string, _timeout?: number) {}
  hide() {}
}
export class Menu {
  addItem(_cb: any) { return this; }
  showAtMouseEvent(_event: any) {}
}
export const Platform = { isMobile: false };
export function setIcon(_el: HTMLElement, _icon: string) {}
