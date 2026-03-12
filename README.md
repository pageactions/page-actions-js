# page-actions-js

This is a [Node.js](https://nodejs.org/en) library that allows publishing events to PageActions analytics dashboard. It's intended for any JS browser application regardless of used framework.

## Instalation

To start with this library just install it as a project dependency.

```bash
npm install @pageactions/page-actions-js
```

## How to use

Basiclly by creating `PageActions` object and later calling methods when events occur. First interaction should always be a page view represented by `pageView()` method. You should create only one instance of `PageActions` for a given page/view. If you want to send events from different components, then the same `PageActions` object should be used by these components.

### Create PageActions

```ts
const pageActions = new PageActions('your-site-id.com').collector('https://eanlr.net/collector')
```

The only parameter of constructor is a **siteId**. This is later used in Page Actions Dashboard to distinguish events from different sites.

After creating new object it's mandatory to set a **collector URL** where all events will be sent. You can see your collector URL when you add new site in Page Actions Dashboard.

::: warning
You can't report any interactions when collector URL is not configured
:::

### Send page view

This event should be sent every time page is viewed before any user interactions.

```ts
pageActions.pageView()
```
