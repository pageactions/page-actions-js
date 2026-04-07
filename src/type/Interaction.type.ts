export const PAGE_VIEW = "pv";

export interface Interaction {
  id: string;
  type: string;
  time: Date;
  terminal?: boolean;
}

export interface ViewInteractions {
  accountId?: string;
  siteId?: string;
  group: string;
  pageViewId: string;
  viewStartedAt: Date;
  interactions: Interaction[];
  browser?: Browser;
  referrer?: string;
  pageUrl?: string;
  userAgent?: string;
}

export interface Browser {
  type?: string;
  bot: boolean;
}
