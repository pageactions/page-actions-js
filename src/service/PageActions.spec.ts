import { expect, test, describe, vi, afterEach, beforeEach } from 'vitest'
import { PageActions } from './PageActions.js';

describe('PageActions service', () => {

  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  test('should throw error when constructor called without argument', () => {
    // @ts-ignore
    expect(() => new PageActions())
      .toThrow(/PageActions\(\) constructor require non-empty siteId argument/);
  })

  test('should throw error when constructor called with null', () => {
    // @ts-ignore
    expect(() => new PageActions(null))
      .toThrow(/PageActions\(\) constructor require non-empty siteId argument/);
  })

  test('should throw error when constructor called with empty siteId', () => {
    expect(() => new PageActions(''))
      .toThrow(/PageActions\(\) constructor require non-empty siteId argument/);
  })

  test('should create class when siteId is provided', () => {
    // when
    const pageActions = new PageActions('site.com')

    // then
    expect(pageActions).toBeDefined()
  })

  describe('pageView()', () => {
    test('should throw error when collector not set', () => {
      // given
      const pageActions = new PageActions('site.com')

      // then
      expect(() => pageActions.pageView())
        .toThrow(/Page Actions collector URL not configured/);
    })

    test('should throw error when collector is empty', () => {
      // given
      const pageActions = new PageActions('site.com').collector('')

      // then
      expect(() => pageActions.pageView())
        .toThrow(/Page Actions collector URL not configured/);
    })

    test('should append a pv event to interactions', () => {
      // given
      const pageActions = new PageActions('site.com').collector(COLLECTOR)

      // when
      pageActions.pageView()

      // then
      expect(pageActions.interactions).toBeDefined()
      expect(pageActions.interactions.length).toBe(1)
      expect(pageActions.interactions[0].type).toBe('pv')

      // and
      expect(pageActions.interactions[0].terminal).toBe(false)
    })

    test('should send interations to collector after page view', () => {
      // given
      const pageActions = new PageActions('site.com').collector(COLLECTOR)

      // when
      pageActions.pageView()

      // then
      expect(fetch).toHaveBeenCalledTimes(1)
      expect(lastFetchRequestBody()).toMatchObject({
        site: 'site.com',
        
        interactions: [
          { type: 'pv' }
        ]
      })
    })

    test('should generate random uuid as id for event and set it as pageViewId', () => {
      // given
      const pageActions = new PageActions('site.com').collector(COLLECTOR)

      // when
      pageActions.pageView()

      // then
      expect(pageActions.interactions).toBeDefined()
      expect(pageActions.interactions.length).toBe(1)
      expect(pageActions.interactions[0].id).toBeDefined()
      expect(pageActions.interactions[0].id.length).toBe(36)
      expect(pageActions.interactions[0].id).toMatch(/^[a-f0-9]{8}\-[a-f0-9]{4}\-[a-f0-9]{4}\-[a-f0-9]{4}\-[a-f0-9]{12}$/)

      // and
      expect(pageActions.pageViewId).toBe(pageActions.interactions[0].id)
    })

    test('should init browser object based on user agent', () => {
      // given
      const pageActions = new PageActions('site.com').collector(COLLECTOR)

      // when
      pageActions.pageView()

      // then
      expect(pageActions.browser).toBeDefined()
      expect(pageActions.browser?.type).toBeUndefined()
      expect(pageActions.browser?.bot).toBeFalsy()
    })
  })

  describe('interaction()', () => {

    test('should throw error when interaction type missing', () => {
      // given
      const pageActions = new PageActions('site.com').collector(COLLECTOR).pageView()

      // then
      // @ts-ignore
      expect(() => pageActions.interaction())
        .toThrow(/PageActions\.interaction\(\) requires non-empty type argument/);
    })

    test('should throw error when interaction type empty', () => {
      // given
      const pageActions = new PageActions('site.com').collector(COLLECTOR).pageView()

      // then
      expect(() => pageActions.interaction(''))
        .toThrow(/PageActions\.interaction\(\) requires non-empty type argument/);
    })

    test('should throw error when interaction() called before pageview()', () => {
      // given
      const pageActions = new PageActions('site.com').collector(COLLECTOR)

      // then
      expect(() => pageActions.interaction('submit'))
        .toThrow(/PageActions\.pageView\(\) should always be called before recording any interaction/);
    })

    test('should append an event to interactions', () => {
      // given
      const pageActions = new PageActions('site.com')
        .collector(COLLECTOR)
        .pageView()

      // when
      pageActions.interaction('submit')

      // then
      expect(pageActions.interactions).toBeDefined()
      expect(pageActions.interactions.length).toBe(2)
      expect(pageActions.interactions[0].type).toBe('pv')
      expect(pageActions.interactions[1].type).toBe('submit')
      expect(pageActions.interactions[1].terminal).toBe(false)
    })

    test('should send interaction to the collector', () => {
      // given
      const pageActions = new PageActions('site.com')
        .collector(COLLECTOR)
        .pageView()

      // when
      pageActions.interaction('submit')

      // then
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(lastFetchRequestBody()).toMatchObject({
        site: 'site.com',
        interactions: [
          { type: 'pv' },
          { type: 'submit' }
        ]
      })
    })

    test('should not append any events after terminal event registered', () => {
      // given
      const pageActions = new PageActions('site.com')
        .collector(COLLECTOR)
        .pageView()

      // when
      pageActions.interaction('submit', true)
      pageActions.interaction('submit')

      // then
      expect(pageActions.interactions).toBeDefined()
      expect(pageActions.interactions.length).toBe(2)
      expect(pageActions.interactions[0].type).toBe('pv')
      expect(pageActions.interactions[1].type).toBe('submit')
      expect(pageActions.interactions[1].terminal).toBe(true)
    })
  })

  describe('firstInteraction()', () => {

    test('should throw error when interaction type missing', () => {
      // given
      const pageActions = new PageActions('site.com').collector(COLLECTOR).pageView()

      // then
      // @ts-ignore
      expect(() => pageActions.firstInteraction())
        .toThrow(/PageActions\.firstInteraction\(\) requires non-empty type argument/);
    })

    test('should throw error when interaction type empty', () => {
      // given
      const pageActions = new PageActions('site.com').collector(COLLECTOR).pageView()

      // then
      expect(() => pageActions.firstInteraction(''))
        .toThrow(/PageActions\.firstInteraction\(\) requires non-empty type argument/);
    })

    test('should throw error when interaction() called before pageview()', () => {
      // given
      const pageActions = new PageActions('site.com').collector(COLLECTOR)

      // then
      expect(() => pageActions.firstInteraction('submit'))
        .toThrow(/PageActions\.pageView\(\) should always be called before recording any interaction/);
    })

    test('should append an event to interactions', () => {
      // given
      const pageActions = new PageActions('site.com')
        .collector(COLLECTOR)
        .pageView()

      // when
      pageActions.firstInteraction('input_enter')

      // then
      expect(pageActions.interactions).toBeDefined()
      expect(pageActions.interactions.length).toBe(2)
      expect(pageActions.interactions[0].type).toBe('pv')
      expect(pageActions.interactions[1].type).toBe('input_enter')
      expect(pageActions.interactions[1].terminal).toBe(false)
    })

    test('should not append and event with same type twice', () => {
      // given
      const pageActions = new PageActions('site.com')
        .collector(COLLECTOR)
        .pageView()

      // when
      pageActions.firstInteraction('input_enter')
      pageActions.firstInteraction('input_enter')

      // then
      expect(pageActions.interactions.length).toBe(2)
      expect(pageActions.interactions[0].type).toBe('pv')
      expect(pageActions.interactions[1].type).toBe('input_enter')
      expect(pageActions.interactions[1].terminal).toBe(false)
    })

    test('should append an event of different type', () => {
      // given
      const pageActions = new PageActions('site.com')
        .collector(COLLECTOR)
        .pageView()

      // when
      pageActions.firstInteraction('input_enter')
      pageActions.firstInteraction('input_leave')

      // then
      expect(pageActions.interactions.length).toBe(3)
      expect(pageActions.interactions[0].type).toBe('pv')
      expect(pageActions.interactions[1].type).toBe('input_enter')
      expect(pageActions.interactions[2].type).toBe('input_leave')
    })

    test('should not append any event after terminal event', () => {
      // given
      const pageActions = new PageActions('site.com')
        .collector(COLLECTOR)
        .pageView()

      // when
      pageActions.firstInteraction('input_enter', true)
      pageActions.firstInteraction('input_leave')

      // then
      expect(pageActions.interactions.length).toBe(2)
      expect(pageActions.interactions[0].type).toBe('pv')
      expect(pageActions.interactions[1].type).toBe('input_enter')
    })

    test('should send interaction to the collector', () => {
      // given
      const pageActions = new PageActions('site.com')
        .collector(COLLECTOR)
        .pageView()

      // when
      pageActions.firstInteraction('input_enter')

      // then
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(lastFetchRequestBody()).toMatchObject({
        site: 'site.com',
        interactions: [
          { type: 'pv' },
          { type: 'input_enter' }
        ]
      })
    })
  })

  function lastFetchRequestBody() {
    const fetchCalls = vi.mocked(fetch).mock.calls.length
    if (fetchCalls > 0) {
      const [, options] = vi.mocked(fetch).mock.calls[fetchCalls - 1];
      if (!options?.body) throw new Error('Last fetch call had no body')
      return JSON.parse(options!.body as string);
    } else {
      throw new Error('No fetch call performed')
    }
  }
})

const COLLECTOR = 'http://localhost/collector'
