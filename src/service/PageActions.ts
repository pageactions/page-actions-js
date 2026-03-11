import { Crawlers } from "ua-parser-js/extensions";
import { PAGE_VIEW, type Browser, type Interaction, type ViewInteractions } from "../type/Interaction.type.js"
import { UAParser } from 'ua-parser-js';

/** Entry point class to report interactions to the Page Actions */
export class PageActions {

  private collectorUrl: string | undefined = undefined

  public interactions: Interaction[] = []
  public pageViewId: string | undefined = undefined
  private terminatedRecording: boolean = false
  
  public browser?: Browser

  private _siteId: string | undefined = undefined
  private _verbose: boolean = false
  private _accountId: string | undefined = undefined
  private _groupName: string = 'default'

  /**
   * Create a PageActions object.
   * @param {string} siteId - An identifier for your site configured in Page Actions dashboard
   */
  constructor(siteId: string) {
    if (!siteId) {
      throw new Error(CONSTRUCTOR_NO_SITEID_MESSAGE)
    }
    this._siteId = siteId
    if (this._verbose) console.log('PageActions instance created with siteId = ' + siteId)
  }

  /**
   * Configure url of a Page Actions collector. You can get this value on the Site Management page in Page Actions
   * @param url 
   * @returns 
   */
  public collector(url: string): PageActions {
    this.collectorUrl = url
    return this
  }
  
  /**
   * Verbose mode logs extra information which helpful during debugging. It is disabled by default.
   * @param value A boolean flag indicating verbose mode state
   * @returns Current PageActions object for chaining method calls
   */
  public verbose(value: boolean): PageActions {
    this._verbose = value
    return this
  }

  /**
   * Configure your account id for reporting interactions. Must be configured before reporting page view or any interaction.
   * @param value An UUID representing your account.
   * @returns Current PageActions object for chaining method calls
   */
  public accountId(value: string): PageActions {
    if (!value) throw new Error(REQUIRE_ACCOUNT_ID_MESSAGE)
    if (this.interactions.length > 0) throw new Error(ACCOUNT_ID_AFTER_PAGEVIEW_MESSAGE)
    this._accountId = value
    return this
  }

  public group(value: string): PageActions {
    if (!value) throw new Error(REQUIRE_GROUP_MESSAGE)
    if (this.interactions.length > 0) throw new Error(GROUP_AFTER_PAGEVIEW_MESSAGE)
    this._groupName = value
    return this
  }

  public pageView(): PageActions {
    if (!this.collectorUrl) throw new Error(COLLECTOR_MISSING_MESSAGE)
    if (!this._accountId) throw new Error(ACCOUNT_ID_MISSING_MESSAGE)
    this.determineBrowser()
    const event = this.createEvent(PAGE_VIEW)
    this.pageViewId = event.id
    this.interactions.push(event)
    
    if (this._verbose) console.log('Page view', event)
    this.publishInteractions()
    return this
  }

  public interaction(type: string, terminal: boolean = false): PageActions {
    if (this.terminatedRecording) return this
    if (!this.collectorUrl) throw new Error(COLLECTOR_MISSING_MESSAGE)
    if (!this.isPageViewRegistered()) throw new Error(NO_PAGEVIEW_MESSAGE)
    if (!type) throw new Error('PageActions.interaction() ' + REQUIRE_TYPE_MESSAGE)

    if (terminal) this.terminatedRecording = true
    const event = this.createEvent(type, terminal)
    this.interactions.push(event)
    
    if (this._verbose) console.log('Registered interaction', event)
    this.publishInteractions()
    return this
  }

  public firstInteraction(type: string, terminal: boolean = false): PageActions {
    if (this.terminatedRecording) return this
    if (!this.collectorUrl) throw new Error(COLLECTOR_MISSING_MESSAGE)
    if (!this.isPageViewRegistered()) throw new Error(NO_PAGEVIEW_MESSAGE)
    if (!type) throw new Error('PageActions.firstInteraction() ' + REQUIRE_TYPE_MESSAGE)

    if (terminal) this.terminatedRecording = true
    if (!this.containsInteraction(type)) {
      const event = this.createEvent(type, terminal)
      this.interactions.push(event)
      if (this._verbose) console.log('Registered first interaction', event)
      this.publishInteractions()
    } else {
      if (this._verbose) console.log(`Interaction of type ${type} already registered`)
    }
    return this
  }

  public containsInteraction(interactionType: string): boolean {
    return this.interactions.findIndex((it) => it.type === interactionType) >= 0
  }

  private createEvent(type: string, terminalEvent: boolean = false) {
    return {
      id: this.generateId(),
      type,
      time: new Date(),
      terminal: terminalEvent,
    } as Interaction;
  }

  private generateId(): string {
    if (self.crypto) {
      return self.crypto.randomUUID()
    } else {
      return 'ev' + Math.random().toString()
    }
  }

  private determineBrowser(): void {
    const parser = new UAParser(Crawlers);
    const results = parser.getResult()
    this.browser = {
      type: results.browser.type,
      bot: results.browser.type === 'crawler',
    } as Browser
  }

  private isPageViewRegistered(): boolean {
    return this.interactions.length > 0 && this.interactions[0].type === 'pv'
  }

  public publishInteractions(): void {
    this.sendInteraction(this.createViewInteractions())
  }

  public createViewInteractions(): ViewInteractions {
    return {
      accountId: this._accountId,
      site: this._siteId,
      group: this._groupName,
      pageViewId: this.pageViewId as string,
      interactions: this.interactions,
      viewStartedAt: new Date(),
      browser: this.browser,
      referrer: document.referrer,
      pageUrl: document.location.href,
      userAgent: navigator.userAgent,
    } as ViewInteractions
  }

  // extract networking to separate file
  private async sendInteraction(request: ViewInteractions): Promise<void> {
    if (this._verbose) console.log('Sending interactions to Page Actions', request)
    await this.sendInteractionRequest(request)
  }

  async sendInteractionRequest(
    request: ViewInteractions
  ): Promise<Response> {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    const options = {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    } as RequestInit;
    return fetch(`${this.collectorUrl}/pageview/interactions`, options);
  } 
}
const CONSTRUCTOR_NO_SITEID_MESSAGE = 'PageActions() constructor require non-empty siteId argument. Example: new PageActions("google.com")'
const COLLECTOR_MISSING_MESSAGE = 'Page Actions collector URL not configured. Call .collector(URL) before sending any event'
const ACCOUNT_ID_MISSING_MESSAGE = 'Page Actions account id not configured. Call .accountId(value) before sending any event'
const REQUIRE_TYPE_MESSAGE = 'requires non-empty type argument'
const NO_PAGEVIEW_MESSAGE = 'PageActions.pageView() should always be called before recording any interaction'
const GROUP_AFTER_PAGEVIEW_MESSAGE = 'Group name cannot be changed after page view action'
const ACCOUNT_ID_AFTER_PAGEVIEW_MESSAGE = 'Account id cannot be changed after page view action'
const REQUIRE_GROUP_MESSAGE = 'Group name cannot be empty'
const REQUIRE_ACCOUNT_ID_MESSAGE = 'Account id cannot be empty'
