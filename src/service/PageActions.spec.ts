import { expect, test, describe, vi, afterEach, beforeEach, it } from "vitest";
import { PageActions } from "./PageActions.js";

describe("PageActions service", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("should throw error when constructor called without argument", () => {
    // @ts-ignore
    expect(() => new PageActions()).toThrow(
      /PageActions\(\) constructor require non-empty siteId argument/,
    );
  });

  test("should throw error when constructor called with null", () => {
    // @ts-ignore
    expect(() => new PageActions(null)).toThrow(
      /PageActions\(\) constructor require non-empty siteId argument/,
    );
  });

  test("should throw error when constructor called with empty siteId", () => {
    expect(() => new PageActions("")).toThrow(
      /PageActions\(\) constructor require non-empty siteId argument/,
    );
  });

  test("should create class when siteId is provided", () => {
    // when
    const pageActions = new PageActions("site.com");

    // then
    expect(pageActions).toBeDefined();
  });

  describe("pageView()", () => {
    test("should throw error when collector not set", () => {
      // given
      const pageActions = new PageActions("site.com");

      // then
      expect(() => pageActions.pageView()).toThrow(/Page Actions collector URL not configured/);
    });

    test("should throw error when collector is empty", () => {
      // given
      const pageActions = new PageActions("site.com").collector("");

      // then
      expect(() => pageActions.pageView()).toThrow(/Page Actions collector URL not configured/);
    });

    test("should throw error when account id is not set", () => {
      // given
      const pageActions = new PageActions("site.com").collector(COLLECTOR);

      // then
      expect(() => pageActions.pageView()).toThrow(/Page Actions account id not configured/);
    });

    test("should append a pv event to interactions", () => {
      // given
      const pageActions = new PageActions("site.com").collector(COLLECTOR).accountId(ACCOUNT_ID);

      // when
      pageActions.pageView();

      // then
      expect(pageActions.interactions).toBeDefined();
      expect(pageActions.interactions.length).toBe(1);
      expect(pageActions.interactions[0].type).toBe("pv");
    });

    test("should send interations to collector after page view", () => {
      // given
      const pageActions = new PageActions("site.com").collector(COLLECTOR).accountId("acc1");

      // when
      pageActions.pageView();
      vi.runAllTimers();

      // then
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(lastFetchRequestBody()).toMatchObject({
        accountId: "acc1",
        site: "site.com",
        group: "default",
        interactions: [{ type: "pv" }],
      });
    });

    test("should generate random uuid as id for event and set it as pageViewId", () => {
      // given
      const pageActions = new PageActions("site.com").collector(COLLECTOR).accountId(ACCOUNT_ID);

      // when
      pageActions.pageView();

      // then
      expect(pageActions.interactions).toBeDefined();
      expect(pageActions.interactions.length).toBe(1);
      expect(pageActions.interactions[0].id).toBeDefined();
      expect(pageActions.interactions[0].id.length).toBe(36);
      expect(pageActions.interactions[0].id).toMatch(
        /^[a-f0-9]{8}\-[a-f0-9]{4}\-[a-f0-9]{4}\-[a-f0-9]{4}\-[a-f0-9]{12}$/,
      );

      // and
      expect(pageActions.pageViewId).toBe(pageActions.interactions[0].id);
    });

    test("should init browser object based on user agent", () => {
      // given
      const pageActions = new PageActions("site.com").collector(COLLECTOR).accountId(ACCOUNT_ID);

      // when
      pageActions.pageView();

      // then
      expect(pageActions.browser).toBeDefined();
      expect(pageActions.browser?.type).toBeUndefined();
      expect(pageActions.browser?.bot).toBeFalsy();
    });
  });

  describe("groupName()", () => {
    test("should send event with different group name", () => {
      // given
      const pageActions = new PageActions("site.com")
        .collector(COLLECTOR)
        .accountId(ACCOUNT_ID)
        .group("other-group");

      // when
      pageActions.pageView();
      vi.runAllTimers();

      // then
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(lastFetchRequestBody()).toMatchObject({
        group: "other-group",
        interactions: [{ type: "pv" }],
      });
    });

    test("should throw error when trying to change group after page view", () => {
      // given
      const pageActions = new PageActions("site.com")
        .collector(COLLECTOR)
        .accountId(ACCOUNT_ID)
        .pageView();

      // then
      expect(() => pageActions.group("ev")).toThrow(
        /Group name cannot be changed after page view action/,
      );
    });

    test("should throw error when group name is empty", () => {
      // given
      const pageActions = new PageActions("site.com").collector(COLLECTOR).accountId(ACCOUNT_ID);

      // then
      expect(() => pageActions.group("")).toThrow(/Group name cannot be empty/);
    });
  });

  describe("accountId()", () => {
    test("should throw error when account id is empty", () => {
      // given
      const pageActions = new PageActions("site.com").collector(COLLECTOR);

      // then
      expect(() => pageActions.accountId("")).toThrow(/Account id cannot be empty/);
    });

    test("should throw error when trying to change account id after page view", () => {
      // given
      const pageActions = new PageActions("site.com")
        .collector(COLLECTOR)
        .accountId("acc1")
        .pageView();

      // then
      expect(() => pageActions.accountId("acc2")).toThrow(
        /Account id cannot be changed after page view action/,
      );
    });
  });

  describe("action()", () => {
    test("should throw error when action type missing", () => {
      // given
      const pageActions = new PageActions("site.com")
        .collector(COLLECTOR)
        .accountId(ACCOUNT_ID)
        .pageView();

      // then
      // @ts-ignore
      expect(() => pageActions.action()).toThrow(
        /PageActions\.action\(\) requires non-empty type argument/,
      );
    });

    test("should throw error when action type empty", () => {
      // given
      const pageActions = new PageActions("site.com")
        .collector(COLLECTOR)
        .accountId(ACCOUNT_ID)
        .pageView();

      // then
      expect(() => pageActions.action("")).toThrow(
        /PageActions\.action\(\) requires non-empty type argument/,
      );
    });

    test("should throw error when action() called before pageview()", () => {
      // given
      const pageActions = new PageActions("site.com").collector(COLLECTOR).accountId(ACCOUNT_ID);

      // then
      expect(() => pageActions.action("submit")).toThrow(
        /PageActions\.pageView\(\) should always be called before recording any action/,
      );
    });

    test("should append an event to interactions", () => {
      // given
      const pageActions = new PageActions("site.com")
        .collector(COLLECTOR)
        .accountId(ACCOUNT_ID)
        .pageView();

      // when
      pageActions.action("submit");

      // then
      expect(pageActions.interactions).toBeDefined();
      expect(pageActions.interactions.length).toBe(2);
      expect(pageActions.interactions[0].type).toBe("pv");
      expect(pageActions.interactions[1].type).toBe("submit");
    });

    test("should send action to the collector", () => {
      // given
      const pageActions = new PageActions("site.com")
        .collector(COLLECTOR)
        .accountId(ACCOUNT_ID)
        .pageView();
      vi.runAllTimers();

      // when
      pageActions.action("submit");
      vi.runAllTimers();

      // then
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(lastFetchRequestBody()).toMatchObject({
        site: "site.com",
        interactions: [{ type: "pv" }, { type: "submit" }],
      });
    });

    test("should not append any events after terminal event registered", () => {
      // given
      const pageActions = new PageActions("site.com")
        .collector(COLLECTOR)
        .accountId(ACCOUNT_ID)
        .pageView();

      // when
      pageActions.action("submit", { terminal: true });
      pageActions.action("submit");

      // then
      expect(pageActions.interactions).toBeDefined();
      expect(pageActions.interactions.length).toBe(2);
      expect(pageActions.interactions[0].type).toBe("pv");
      expect(pageActions.interactions[1].type).toBe("submit");
    });

    test("should debounce publishing events when next action added below 2000 ms delay", () => {
      // given
      const pageActions = new PageActions("site.com")
        .collector(COLLECTOR)
        .accountId(ACCOUNT_ID)
        .pageView();
      vi.runAllTimers();

      // when
      pageActions.action("focus");
      vi.advanceTimersByTime(1999);
      pageActions.action("click");
      vi.advanceTimersByTime(2001);

      // then
      expect(pageActions.interactions.length).toBe(3);

      // and
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(lastFetchRequestBody()).toMatchObject({
        site: "site.com",
        interactions: [{ type: "pv" }, { type: "focus" }, { type: "click" }],
      });
    });

    test("should not debounce publishing events when next action added after 2000 ms delay", () => {
      // given
      const pageActions = new PageActions("site.com")
        .collector(COLLECTOR)
        .accountId(ACCOUNT_ID)
        .pageView();
      vi.runAllTimers();

      // when
      pageActions.action("focus");
      vi.advanceTimersByTime(2001);
      pageActions.action("click");
      vi.advanceTimersByTime(2001);

      // then
      expect(pageActions.interactions.length).toBe(3);

      // and
      expect(fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe("firstAction()", () => {
    test("should throw error when action type missing", () => {
      // given
      const pageActions = new PageActions("site.com")
        .collector(COLLECTOR)
        .accountId(ACCOUNT_ID)
        .pageView();

      // then
      // @ts-ignore
      expect(() => pageActions.firstAction()).toThrow(
        /PageActions\.firstAction\(\) requires non-empty type argument/,
      );
    });

    test("should throw error when action type empty", () => {
      // given
      const pageActions = new PageActions("site.com")
        .collector(COLLECTOR)
        .accountId(ACCOUNT_ID)
        .pageView();

      // then
      expect(() => pageActions.firstAction("")).toThrow(
        /PageActions\.firstAction\(\) requires non-empty type argument/,
      );
    });

    test("should throw error when action() called before pageview()", () => {
      // given
      const pageActions = new PageActions("site.com").collector(COLLECTOR).accountId(ACCOUNT_ID);

      // then
      expect(() => pageActions.firstAction("submit")).toThrow(
        /PageActions\.pageView\(\) should always be called before recording any action/,
      );
    });

    test("should append an event to interactions", () => {
      // given
      const pageActions = new PageActions("site.com")
        .collector(COLLECTOR)
        .accountId(ACCOUNT_ID)
        .pageView();

      // when
      pageActions.firstAction("input_enter");

      // then
      expect(pageActions.interactions).toBeDefined();
      expect(pageActions.interactions.length).toBe(2);
      expect(pageActions.interactions[0].type).toBe("pv");
      expect(pageActions.interactions[1].type).toBe("input_enter");
    });

    test("should not append and event with same type twice", () => {
      // given
      const pageActions = new PageActions("site.com")
        .collector(COLLECTOR)
        .accountId(ACCOUNT_ID)
        .pageView();

      // when
      pageActions.firstAction("input_enter");
      pageActions.firstAction("input_enter");

      // then
      expect(pageActions.interactions.length).toBe(2);
      expect(pageActions.interactions[0].type).toBe("pv");
      expect(pageActions.interactions[1].type).toBe("input_enter");
    });

    test("should append an event of different type", () => {
      // given
      const pageActions = new PageActions("site.com")
        .collector(COLLECTOR)
        .accountId(ACCOUNT_ID)
        .pageView();

      // when
      pageActions.firstAction("input_enter");
      pageActions.firstAction("input_leave");

      // then
      expect(pageActions.interactions.length).toBe(3);
      expect(pageActions.interactions[0].type).toBe("pv");
      expect(pageActions.interactions[1].type).toBe("input_enter");
      expect(pageActions.interactions[2].type).toBe("input_leave");
    });

    test("should not append any event after terminal event", () => {
      // given
      const pageActions = new PageActions("site.com")
        .collector(COLLECTOR)
        .accountId(ACCOUNT_ID)
        .pageView();

      // when
      pageActions.firstAction("input_enter", { terminal: true });
      pageActions.firstAction("input_leave");

      // then
      expect(pageActions.interactions.length).toBe(2);
      expect(pageActions.interactions[0].type).toBe("pv");
      expect(pageActions.interactions[1].type).toBe("input_enter");
    });

    test("should send actions to the collector", () => {
      // given
      const pageActions = new PageActions("site.com")
        .collector(COLLECTOR)
        .accountId(ACCOUNT_ID)
        .pageView();
      vi.runAllTimers();

      // when
      pageActions.firstAction("input_enter");
      vi.runAllTimers();

      // then
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(lastFetchRequestBody()).toMatchObject({
        site: "site.com",
        interactions: [{ type: "pv" }, { type: "input_enter" }],
      });
    });

    test("should send conversion action to the collector", () => {
      // given
      const pageActions = new PageActions("site.com")
        .collector(COLLECTOR)
        .accountId(ACCOUNT_ID)
        .pageView();
      vi.runAllTimers();

      // when
      pageActions.firstAction("submit_form", { conversion: true});
      vi.runAllTimers();

      // then
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(lastFetchRequestBody()).toMatchObject({
        site: "site.com",
        interactions: [{ type: "pv" }, { type: "submit_form", conversion: true }],
      });
    });
  });

  describe("flushing", () => {
    test("should send actions to the collector before debounce timeout when flush() called", () => {
      // given
      const pageActions = new PageActions("site.com")
        .collector(COLLECTOR)
        .accountId(ACCOUNT_ID)
        .pageView();
      vi.runAllTimers();

      // when
      pageActions.action("focus");
      vi.advanceTimersByTime(100);
      pageActions.flush();

      // then
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(lastFetchRequestBody()).toMatchObject({
        site: "site.com",
        interactions: [{ type: "pv" }, { type: "focus" }],
      });
    });

    test("should send actions to the collector before debounce timeout when flush flag set", () => {
      // given
      const pageActions = new PageActions("site.com")
        .collector(COLLECTOR)
        .accountId(ACCOUNT_ID)
        .pageView();
      vi.runAllTimers();

      // when
      pageActions.action("focus", { flush: true });
      vi.advanceTimersByTime(100);

      // then
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(lastFetchRequestBody()).toMatchObject({
        site: "site.com",
        interactions: [{ type: "pv" }, { type: "focus" }],
      });
    });
  });

  function lastFetchRequestBody() {
    const fetchCalls = vi.mocked(fetch).mock.calls.length;
    if (fetchCalls > 0) {
      const [, options] = vi.mocked(fetch).mock.calls[fetchCalls - 1];
      if (!options?.body) throw new Error("Last fetch call had no body");
      return JSON.parse(options!.body as string);
    } else {
      throw new Error("No fetch call performed");
    }
  }
});

const COLLECTOR = "http://localhost/collector";
const ACCOUNT_ID = "acc123";
