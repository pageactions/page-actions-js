
export const PAGE_VIEW = "pv"

export interface Interaction {
  id: string;
  type: string;
  time: Date;
  terminal?: boolean;
}

export interface ViewInteractions {
  pageViewId: string;
  viewStartedAt: Date;
  interactions: Interaction[];
  group: string;
  browser?: Browser;
  referrer?: string;
  pageUrl?: string;
  userAgent?: string;
}

export interface Browser {
  type?: string,
  bot: boolean,
}
