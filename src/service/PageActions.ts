import { Crawlers } from "ua-parser-js/extensions";
import { PAGE_VIEW, type Browser, type Interaction } from "../type/Interaction.type.js"
import { UAParser } from 'ua-parser-js';

export class PageActions {

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

  public pageView(): PageActions {
    if (!this.collectorUrl) throw new Error(COLLECTOR_MISSING_MESSAGE)
    this.determineBrowser()
    const event = this.createEvent(PAGE_VIEW)
    this.pageViewId = event.id
    this.interactions.push(event)
    
    console.log('registered page view', event)
    console.log('registered page view with browser', this.browser)
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
    
    console.log('register page interaction', event)
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
      console.log('Example id', self.crypto.randomUUID())
      return self.crypto.randomUUID()
    } else {
      console.log('PageActions: Fallback event id')
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
    console.log('Browser initialized with', this.browser)
  }

  private isPageViewRegistered(): boolean {
    return this.interactions.length > 0 && this.interactions[0].type === 'pv'
  }
}
const CONSTRUCTOR_NO_SITEID_MESSAGE = 'PageActions() constructor require non-empty siteId argument. Example: new PageActions("google.com")'
const COLLECTOR_MISSING_MESSAGE = 'Page Actions collector URL not configured. Call .collector(URL) before sending any event'
const INTERACTION_NO_TYPE_MESSAGE = 'PageActions.interaction() require non-empty type argument. Example: interaction("click")'
const NO_PAGEVIEW_MESSAGE = 'PageActions.pageView() should always be called before recording any interaction'
