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

  test("should send page visibile state to the collector after page view", () => {
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
      visibility: [
        {
          type: "in",
        },
      ],
    });
  });

  test("should ignore visibility changes before page view", () => {
    // given
    const pageActions = new PageActions("site.com").collector(COLLECTOR).accountId("acc1");

    // when
    pageActions.pageVisible();
    pageActions.pageHidden();
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

  test("should send visibility change reported after page view", () => {
    // given
    const pageActions = new PageActions("site.com").collector(COLLECTOR).accountId("acc1");

    // when
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

  test("should send multiple reported visibility changes after page view", () => {
    // given
    const pageActions = new PageActions("site.com").collector(COLLECTOR).accountId("acc1");

    // when
    pageActions.pageView();
    pageActions.pageHidden();
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
        {
          type: "out",
        },
        {
          type: "in",
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
