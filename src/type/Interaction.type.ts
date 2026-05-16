export const PAGE_VIEW = "pv";

export interface Interaction {
  id: string;
  type: string;
  time: Date;
  conversion?: boolean;
}

export interface ViewInteractions {
  accountId?: string;
  siteId?: string;
  group: string;
  pageViewId: string;
  viewStartedAt: Date;
  interactions: Interaction[];
  referrer?: string;
  pageUrl?: string;
}
