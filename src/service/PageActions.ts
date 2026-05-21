import { PAGE_VIEW, type Interaction, type ViewInteractions } from "../type/Interaction.type.js";
import { debounceTime, Subject } from "rxjs";
import { VISIBLITY_IN, VISIBLITY_OUT, type VisibilityChange } from "../type/visibility.type.js";

/** Object for optional action's options */
export interface ActionOptions {
  /** Terminal action represents the last action on a page and no more actions are recorded */
  terminal?: boolean;
  /** Whether actions should be immediately sent to the collector after registering an action */
  flush?: boolean;
  /** Whether registered action is a conversion action. It represents business goal on a page */
  conversion?: boolean;
  /** If set to true then only first action with given type will be collected. The next actions with this type will be ignored. */
  firstOnly?: boolean;
}

/** Entry point class to report actions to the Page Actions collector */
export class PageActions {
  public interactions: Interaction[] = [];
  public pageViewId: string | undefined = undefined;
  private terminatedRecording: boolean = false;

  private _collectorUrl: string | undefined = undefined;
  private _siteId: string | undefined = undefined;
  private _verbose: boolean = false;
  private _accountId: string | undefined = undefined;
  private _groupName: string = "default";
  private _pageUrl: string | undefined = undefined;
  private _referrer: string | undefined = undefined;
  private _visibilityChanges: VisibilityChange[] = [];
  private _listenerAbort: AbortController | undefined = undefined;

  private _debounceTimeMs = 2000;
  private interactionStream: Subject<Interaction> = new Subject<Interaction>();

  /**
   * Create a PageActions service
   * @param {string} siteId - An identifier for your site configured in Page Actions dashboard
   */
  constructor(siteId: string) {
    if (!siteId) {
      throw new Error(CONSTRUCTOR_NO_SITEID_MESSAGE);
    }
    this._siteId = siteId;
    this.registerInteractionsListener();
    if (this._verbose) console.log("PageActions service created with siteId = " + siteId);
  }

  /**
   * Configure url of a Page Actions collector. You can get this value on the Site Management page in Page Actions
   * @param url
   * @returns
   */
  public collector(url: string): PageActions {
    this._collectorUrl = url;
    return this;
  }

  /**
   * Verbose mode logs extra information which helpful during debugging. It is disabled by default.
   * @param value A boolean flag indicating verbose mode state
   * @returns Current PageActions service for chaining method calls
   */
  public verbose(value: boolean): PageActions {
    this._verbose = value;
    return this;
  }

  /**
   * Configure your account id for reporting actions. Must be configured before reporting page view or any action.
   * @param value An UUID representing your account.
   * @returns Current PageActions service for chaining method calls
   */
  public accountId(value: string): PageActions {
    if (!value) throw new Error(REQUIRE_ACCOUNT_ID_MESSAGE);
    if (this.interactions.length > 0) throw new Error(ACCOUNT_ID_AFTER_PAGEVIEW_MESSAGE);
    this._accountId = value;
    return this;
  }

  /**
   * Configure your group ID for reported actions. Must be configured before reporting page view or any action.
   * It should be used if you want to measure different things or single page or you have same form on different pages. You can filter page views by group ID in the dashboard.
   * @param value A Group ID for reported actions, 'default' if not provided
   * @returns Current PageActions service for chaining method calls
   */
  public group(value: string): PageActions {
    if (!value) throw new Error(REQUIRE_GROUP_MESSAGE);
    if (this.interactions.length > 0) throw new Error(GROUP_AFTER_PAGEVIEW_MESSAGE);
    this._groupName = value;
    return this;
  }

  /**
   * Reports page view event. Must be called only once before any page action is reported.
   * @returns Current PageActions service for chaining method calls
   */
  public pageView(): PageActions {
    if (!this._collectorUrl) throw new Error(COLLECTOR_MISSING_MESSAGE);
    if (!this._accountId) throw new Error(ACCOUNT_ID_MISSING_MESSAGE);
    if (this.interactions.length > 0) throw new Error(PAGEVIEW_REPEATED_MESSAGE);
    this._pageUrl = document.location.href;
    this._referrer = document.referrer;
    this._visibilityChanges = [];
    if (document.visibilityState === "visible") this.pageVisible();
    const interaction = this.createInteraction(PAGE_VIEW, {});
    this.pageViewId = interaction.id;
    this.appendInteraction(interaction);
    if (this._verbose) console.log("Registered page view", interaction);
    return this;
  }

  /**
   * Signals that page view ended. Stops page view duration timer and flushes all interactions to the collector.
   * @returns Current PageActions service for chaining method calls
   */
  public endPageView(): PageActions {
    if (!this.pageViewId) throw new Error(PAGEVIEW_NOT_ACTIVE);
    this.pageHidden();
    this.flush();
    this.pageViewId = undefined;
    this.interactions = [];
    return this;
  }

  /**
   * Reports an action with given type
   * @param type An identifier for the action
   * @param options Optional object with action's options
   * @returns Current PageActions service
   */
  public action(type: string, options: ActionOptions = {}): PageActions {
    if (this.terminatedRecording) return this;
    if (!this._collectorUrl) throw new Error(COLLECTOR_MISSING_MESSAGE);
    if (!this.isPageViewRegistered()) throw new Error(NO_PAGEVIEW_MESSAGE);
    if (!type) throw new Error("PageActions.action() " + REQUIRE_TYPE_MESSAGE);

    if (options?.terminal) this.terminatedRecording = true;
    if (options.firstOnly && this.containsInteraction(type)) {
      if (this._verbose) console.log(`Action of type ${type} already registered`);
    } else {
      const interaction = this.createInteraction(type, options);
      this.appendInteraction(interaction);
      if (this._verbose) console.log("Registered interaction", interaction);
      if (options?.flush) this.flush();
    }
    return this;
  }

  /**
   * Reports the first occurence of an action with given type
   * @param type An identifier for the action
   * @param options Optional object with action's options
   * @returns Current PageActions service
   */
  public firstAction(type: string, options: ActionOptions = {}): PageActions {
    if (this.terminatedRecording) return this;
    if (!this._collectorUrl) throw new Error(COLLECTOR_MISSING_MESSAGE);
    if (!this.isPageViewRegistered()) throw new Error(NO_PAGEVIEW_MESSAGE);
    if (!type) throw new Error("PageActions.firstAction() " + REQUIRE_TYPE_MESSAGE);
    if (options?.terminal) this.terminatedRecording = true;
    if (!this.containsInteraction(type)) {
      const interaction = this.createInteraction(type, options);
      this.appendInteraction(interaction);
      if (this._verbose) console.log("Registered first action", interaction);
    } else {
      if (this._verbose) console.log(`Action of type ${type} already registered`);
    }
    if (options?.flush) this.flush();
    return this;
  }

  /**
   * Bypass delay and immediately sends all collected actions to the collector
   * @returns Current PageActions service
   */
  public flush(): PageActions {
    this.publishInteractions();
    return this;
  }

  /**
   * Register a listener that handles page visibility changes. It is used to calculate page visit duration and
   * to automatically flush page actions when page is closed.
   * @returns Current PageActions service
   */
  public registerVisibilityListener(): PageActions {
    const abortController = new AbortController();
    this._listenerAbort = abortController;
    addEventListener(
      "visibilitychange",
      () => {
        if (document.visibilityState === "visible") {
          console.log("page is visible");
          this.pageVisible();
        }
        if (document.visibilityState === "hidden") {
          console.log("page is hidden");
          this.pageHidden();
          this.flush();
        }
      },
      {
        signal: abortController.signal,
      },
    );
    return this;
  }

  /**
   * Unregister an existing visibility listener.
   * @returns Current PageActions service
   */
  public unregisterVisibilityListener(): PageActions {
    if (this._listenerAbort) {
      this._listenerAbort.abort();
    }
    return this;
  }

  /**
   * Report page enters visible state
   * @returns Current PageActions service
   */
  public pageVisible(): PageActions {
    this._visibilityChanges.push({
      type: VISIBLITY_IN,
      at: new Date().toISOString(),
    });
    return this;
  }

  /**
   * Report page enters hidden state
   * @returns Current PageActions service
   */
  public pageHidden(): PageActions {
    this._visibilityChanges.push({
      type: VISIBLITY_OUT,
      at: new Date().toISOString(),
    });
    return this;
  }

  // Private

  private containsInteraction(interactionType: string): boolean {
    return this.interactions.findIndex((it) => it.type === interactionType) >= 0;
  }

  private createInteraction(type: string, options: ActionOptions): Interaction {
    return {
      id: this.generateId(),
      type,
      time: new Date(),
      conversion: options.conversion,
    } as Interaction;
  }

  private appendInteraction(interaction: Interaction): void {
    this.interactions.push(interaction);
    this.interactionStream.next(interaction);
  }

  private generateId(): string {
    if (self.crypto) {
      return self.crypto.randomUUID();
    } else {
      return "ev" + Math.random().toString();
    }
  }

  private isPageViewRegistered(): boolean {
    return this.interactions.length > 0 && this.interactions[0].type === "pv";
  }

  private registerInteractionsListener(): void {
    this.interactionStream.pipe(debounceTime(this._debounceTimeMs)).subscribe(() => {
      this.publishInteractions();
    });
  }

  private publishInteractions(): void {
    this.sendInteraction(this.createViewInteractions());
  }

  private createViewInteractions(): ViewInteractions {
    return {
      accountId: this._accountId,
      site: this._siteId,
      group: this._groupName,
      pageViewId: this.pageViewId as string,
      interactions: this.interactions,
      viewStartedAt: new Date(),
      referrer: this._referrer,
      pageUrl: this._pageUrl,
      visibility: this._visibilityChanges,
    } as ViewInteractions;
  }

  // extract networking to separate file
  private async sendInteraction(request: ViewInteractions): Promise<void> {
    if (this._verbose) console.log("Sending actions to Page Actions", request);
    await this.sendInteractionRequest(request);
  }

  private async sendInteractionRequest(request: ViewInteractions): Promise<Response> {
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    const options = {
      method: "POST",
      headers,
      body: JSON.stringify(request),
      priority: "low",
      keepalive: true,
    } as RequestInit;
    return fetch(`${this._collectorUrl}/interactions`, options);
  }
}
const CONSTRUCTOR_NO_SITEID_MESSAGE = "PageActions() constructor require non-empty siteId argument";
const COLLECTOR_MISSING_MESSAGE =
  "Page Actions collector URL not configured. Call .collector(URL) before sending any event";
const ACCOUNT_ID_MISSING_MESSAGE =
  "Page Actions account id not configured. Call .accountId(value) before sending any event";
const REQUIRE_TYPE_MESSAGE = "requires non-empty type argument";
const NO_PAGEVIEW_MESSAGE =
  "PageActions.pageView() should always be called before recording any action";
const GROUP_AFTER_PAGEVIEW_MESSAGE = "Group name cannot be changed after page view action";
const ACCOUNT_ID_AFTER_PAGEVIEW_MESSAGE = "Account id cannot be changed after page view action";
const REQUIRE_GROUP_MESSAGE = "Group name cannot be empty";
const REQUIRE_ACCOUNT_ID_MESSAGE = "Account id cannot be empty";
const PAGEVIEW_REPEATED_MESSAGE =
  "Function pageView() can be called at most once with given PageActions object";
const PAGEVIEW_NOT_ACTIVE = "There is no active PageView";
