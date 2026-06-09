export type Page = "setup" | "experiment" | "result";

export class Router {
  constructor(private readonly sections: Record<Page, HTMLElement>) {}

  navigate(to: Page): void {
    for (const page of Object.keys(this.sections) as Page[]) {
      this.sections[page].hidden = page !== to;
    }
  }
}
