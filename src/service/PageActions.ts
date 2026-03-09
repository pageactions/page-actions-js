import { Crawlers } from "ua-parser-js/extensions";
import { PAGE_VIEW, type Browser, type Interaction, type ViewInteractions } from "../type/Interaction.type.js"
import { UAParser } from 'ua-parser-js';

export class PageActions {

  private _verbose: boolean = false
  private collectorUrl: string | undefined = undefined

  public interactions: Interaction[] = []
  public pageViewId: string | undefined = undefined
  private terminatedRecording: boolean = false
  private siteId: string
  private groupName: string = 'default'
  
  public browser?: Browser

  constructor(siteId: string) {
    if (!siteId) {
      throw new Error(CONSTRUCTOR_NO_SITEID_MESSAGE)
    }
    this.siteId = siteId
    console.log('New instance of PageActions created')
  }

  public collector(url: string): PageActions {
    this.collectorUrl = url
    return this
  }
  
  public verbose(value: boolean): PageActions {
    this._verbose = value
    return this
  }

  public pageView(): PageActions {
    if (!this.collectorUrl) throw new Error(COLLECTOR_MISSING_MESSAGE)
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
    if (!type) throw new Error(INTERACTION_NO_TYPE_MESSAGE)
    if (!this.isPageViewRegistered()) throw new Error(NO_PAGEVIEW_MESSAGE)

    if (terminal) this.terminatedRecording = true
    const event = this.createEvent(type, terminal)
    this.interactions.push(event)
    
    if (this._verbose) console.log('Page interaction', event)
    this.publishInteractions()
    return this
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
      site: this.siteId,
      group: this.groupName,
      pageViewId: this.pageViewId,
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
const INTERACTION_NO_TYPE_MESSAGE = 'PageActions.interaction() require non-empty type argument. Example: interaction("click")'
const NO_PAGEVIEW_MESSAGE = 'PageActions.pageView() should always be called before recording any interaction'
