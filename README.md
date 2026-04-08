# page-actions-js

This is a [Node.js](https://nodejs.org/en) library that allows publishing events to Page Actions analytics dashboard. It's intended for any JS browser application regardless of used framework.

## Installation

To start with this library just install it as a project dependency.

```bash
npm install @pageactions/page-actions-js
```

## How to use

Basically by creating `PageActions` service and later calling functions when events occur. First action should always be a page view represented by a `pageView()` function. You should create only one instance of `PageActions` for a given page/view. If you want to send events from different components, then the same `PageActions` object should be used by these components.

### Create PageActions service

```ts
const pageActions = new PageActions("your-site-id.com")
  .collector("https://page-actions.com/collector")
  .accountId("your-account-id");
```

The only parameter of constructor is a **siteId**. This is later used in Page Actions Dashboard to distinguish events from different sites.

After creating new object it's mandatory to set a **collector URL** and **account ID**.

Collector URL is a place where all your actions are sent. You can see your collector URL when you add new site in Page Actions Dashboard.

Account ID is your unique UUID identifier that you can get from your Account settings or get during new site onboarding.

You can't report any actions when collector URL or account ID is not configured!

### Send page view

This event should be sent every time page is rendered before any user action. It starts a new history of consecutive actions.

This function must be called exactly once and should be the first action on a page. After a navigation to a different page or a view a new instance of `PageActions` should be created to represent a new page view.

It has no parameters and triggers sending an event to the collector service.

```ts
pageActions.pageView();
```

### Report action every time

The most basic way of reporting an action is by calling action() function with action type name.

```ts
pageActions.action("button_click");
```

#### Terminal action

You can pass a second argument to the function with action's options. The `terminal` option marks an action as the last important action on current page. After such action no further events are recorded and sent to the collector. For example, it is useful to stop recording when form was submitted.

```ts
pageActions.action("form_submit", { terminal: true });
```

### Report action only for the first time

Sometimes we only want to know that user started interacting with a form and don't want to now how many times such action occurred. In that situation a firstAction() function is used.

```ts
pageActions.firstAction("firstname_changed");
```

This action will be reported at most one time. Every further call with the same action type will be ignored during page visit (same PageActions instance).

### Flushing actions

By default, sending actions to the collector is delayed so analytics doesn't impact page performance. Sometimes you may need to send events immediately. For example, when clicking on the button performs navigation to a different page. In such situations a `flush()` method can be used to publish events before current page is closed.

Example:

```ts
pageActions.flush();
```

Another way to do this is by using a `flush` option when reporting an action.

```ts
pageActions.action("focus", { flush: true });
```
