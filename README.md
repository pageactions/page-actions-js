# page-actions-js

This is a [Node.js](https://nodejs.org/en) library that allows publishing events to PageActions analytics dashboard. It's intended for any JS browser application regardless of used framework.

## Instalation

To start with this library just install it as a project dependency.

```bash
npm install @pageactions/page-actions-js
```

## How to use

Basiclly by creating `PageActions` object and later calling functions when events occur. First interaction should always be a page view represented by a `pageView()` function. You should create only one instance of `PageActions` for a given page/view. If you want to send events from different components, then the same `PageActions` object should be used by these components.

### Create PageActions

```ts
const pageActions = new PageActions('your-site-id.com')
  .collector('https://page-actions.com/collector')
  .accountId('your-account-id')
```

The only parameter of constructor is a **siteId**. This is later used in Page Actions Dashboard to distinguish events from different sites.

After creating new object it's mandatory to set a **collector URL** and **account ID**.

Collector URL is a place where all your interactions are sent. You can see your collector URL when you add new site in Page Actions Dashboard.

Account ID is your unique UUID identifier that you can get from your Account settings or get during new site onboarding.

You can't report any interaction when collector URL or account ID is not configured!

### Send page view

This event should be sent every time page is rendered before any user interactions. It starts a new history of consecutive actions.

This function must be called exactly once and should be the first interaction. After a navigation to a different page or a view a new instance of PageActions should created to represent a new page view.

It has no parameters and triggers sending an event to the collector service.

```ts
pageActions.pageView()
```

### Report action every time

The most basic way of reporting an action is by calling interaction() function with action type.

```ts
pageActions.interaction('button_click')
```

There is also a second form of this function with second parameter signaling that this is a terminal action. After such action no further events are recorded and sent to the collector. It's usefull to stop recording events then for example form was submitted.

```ts
pageActions.interaction('form_submit', true)
```

### Report action only for the first time

Sometimes we only want to know that user started interacting with a form and don't want to now how many times such action occured. In that situation a firstInteraction() function is used.

```ts
pageActions.firstInteraction('firstname_changed')
```

This action will be reported at most one time. Every further call with the same action type will be ignored during page visit (same PageActions instance).
