import { PAGE_VIEW, type Browser, type Interaction } from "../type/Interaction.type.js"

export class PageActions {

  private collectorUrl: string | undefined = undefined

  public interactions: Interaction[] = []
  public pageViewId: string | undefined = undefined
  private terminatedRecording: boolean = false
  private siteId: string
  private groupName: string = 'default'
  private browser?: Browser

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

  public pageView() {
    if (!this.collectorUrl) throw new Error(COLLECTOR_MISSING_MESSAGE)
    const event = this.createEvent(PAGE_VIEW)
    this.pageViewId = event.id
    this.interactions.push(event)
    
    console.log('registered page view', event)
    
  }

  public interaction(type: string, terminal: boolean = false) {
    // if (!this.collectorUrl) {
    //   console.error(COLLECTOR_MISSING_MESSAGE)
    //   return
    // }
    console.log('register page interaction', type)
  }

  // private

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
}
const CONSTRUCTOR_NO_SITEID_MESSAGE = 'PageActions() constructor require non-empty siteId argument. Example: new PageActions("google.com")'
const COLLECTOR_MISSING_MESSAGE = 'Page Actions collector URL not configured. Call .collector(URL) before sending any event'
