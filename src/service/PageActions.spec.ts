import { expect, test, describe } from 'vitest'
import { PageActions } from './PageActions.js';

describe('PageActions service', () => {

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
    test('should throw error when collector not set', () => {
      // given
      const pageActions = new PageActions('site.com')

      // then
      expect(() => pageActions.interaction('click'))
        .toThrow(/Page Actions collector URL not configured/);
    })

    test('should throw error when interaction type missing', () => {
      // given
      const pageActions = new PageActions('site.com').collector(COLLECTOR)

      // then
      // @ts-ignore
      expect(() => pageActions.interaction())
        .toThrow(/PageActions\.interaction\(\) require non-empty type argument/);
    })

    test('should throw error when interaction type empty', () => {
      // given
      const pageActions = new PageActions('site.com').collector(COLLECTOR)

      // then
      expect(() => pageActions.interaction(''))
        .toThrow(/PageActions\.interaction\(\) require non-empty type argument/);
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
})

const COLLECTOR = 'http://localhost/collector'
