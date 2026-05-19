import { expect, test, describe, vi, afterEach, beforeEach, it } from "vitest";
import { PageActions } from "./PageActions.js";

describe("PageActions service - visibility", () => {
  const COLLECTOR = "http://localhost/collector";
  const ACCOUNT_ID = "acc123";

  beforeEach(() => {
    vi.useFakeTimers();
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("should send empty visibility changes to the collector after page view", () => {
    // given
    const pageActions = new PageActions("site.com").collector(COLLECTOR).accountId("acc1");

    // when
    pageActions.pageView();
    vi.runAllTimers();

    // then
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(lastFetchRequestUrl()).toBe(COLLECTOR + "/interactions");
    expect(lastFetchRequestBody()).toMatchObject({
      accountId: "acc1",
      site: "site.com",
      interactions: [{ type: "pv" }],
      visibility: [],
    });
  });

  test("should send in visibility change after page view", () => {
    // given
    const pageActions = new PageActions("site.com").collector(COLLECTOR).accountId("acc1");

    // when
    pageActions.pageView();
    pageActions.pageVisible();
    vi.runAllTimers();

    // then
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(lastFetchRequestUrl()).toBe(COLLECTOR + "/interactions");
    expect(lastFetchRequestBody()).toMatchObject({
      accountId: "acc1",
      site: "site.com",
      interactions: [{ type: "pv" }],
      visibility: [
        {
          type: "in",
        },
      ],
    });
  });

  test("should send in visibility change before page view", () => {
    // given
    const pageActions = new PageActions("site.com").collector(COLLECTOR).accountId("acc1");

    // when
    pageActions.pageVisible();
    pageActions.pageView();
    vi.runAllTimers();

    // then
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(lastFetchRequestUrl()).toBe(COLLECTOR + "/interactions");
    expect(lastFetchRequestBody()).toMatchObject({
      accountId: "acc1",
      site: "site.com",
      interactions: [{ type: "pv" }],
      visibility: [
        {
          type: "in",
        },
      ],
    });
  });

  test("should send in and out visibility change before page view", () => {
    // given
    const pageActions = new PageActions("site.com").collector(COLLECTOR).accountId("acc1");

    // when
    pageActions.pageVisible();
    pageActions.pageView();
    pageActions.pageHidden();
    vi.runAllTimers();

    // then
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(lastFetchRequestUrl()).toBe(COLLECTOR + "/interactions");
    expect(lastFetchRequestBody()).toMatchObject({
      accountId: "acc1",
      site: "site.com",
      interactions: [{ type: "pv" }],
      visibility: [
        {
          type: "in",
        },
        {
          type: "out",
        },
      ],
    });
  });

  function lastFetchRequestBody(): any {
    const lastRequest = lastFetchRequestOptions();
    if (!lastRequest?.body) {
      throw new Error("Last fetch call had no body");
    }
    return JSON.parse(lastRequest!.body as string);
  }

  function lastFetchRequestOptions(): RequestInit {
    const fetchCalls = vi.mocked(fetch).mock.calls.length;
    if (fetchCalls > 0) {
      const [, options] = vi.mocked(fetch).mock.calls[fetchCalls - 1];
      return options as RequestInit;
    } else {
      throw new Error("No fetch call performed");
    }
  }

  function lastFetchRequestUrl(): string {
    const fetchCalls = vi.mocked(fetch).mock.calls.length;
    if (fetchCalls > 0) {
      const [url, _] = vi.mocked(fetch).mock.calls[fetchCalls - 1];
      return url as string;
    } else {
      throw new Error("No fetch call performed");
    }
  }
});
