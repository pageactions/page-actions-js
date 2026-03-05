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
    
  })
})

const COLLECTOR = 'http://localhost/collector'
