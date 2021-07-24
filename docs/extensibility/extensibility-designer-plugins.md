---
id: extensibility-designer-plugins
title: Extending Elsa Studio with Plugins
sidebar_label: Designer Plugins
---

The Elsa Studio application can be extended using Elsa Plugins, which are JavaScript functions implementing a particular signature and are registered with Elsa Studio.

Plugins allow you to extend the studio with features such as:

- Intercept outgoing HTTP requests to add e.g. authorization headers
- Custom activity icons
- Custom activity design-time behavior (e.g. dynamic outcomes as is seen with `Fork` and `Switch`)
- Custom field types
- Respond to certain events
- Not yet implemented: add custom screens and menu items.

Although you can use frameworks such as Angular, React and even Stencil to extend Elsa Studio, you don't have to. Vanilla JS works just as well.

> When you're implementing more advanced features, such as custom field types however, you may want to take advantage of JS frameworks to more easily implement reactive input behavior.

## Custom Plugins

At a bare minimum, implementing a plugin requires nothing more than declaring a function and then registering this function with Elsa Studio.

The following shows a minimal example of a plugin that does nothing more than showing an alert message when the plugin is initialized:

```javascript
function MyPlugin() {
    alert('I am initializing!');
}
```

To register this plugin, you need a reference to the `<elsa-studio-root>` element and add an event handler for its `initializing` event:

```html
<elsa-studio-root server-url="https://localhost:11000" monaco-lib-path="build/assets/js/monaco-editor/min" culture="en-US">
    <elsa-studio-dashboard></elsa-studio-dashboard>
</elsa-studio-root>

<script>
    const elsaStudioRoot = document.querySelector('elsa-studio-root');

    elsaStudioRoot.addEventListener('initializing', e => {
        const elsaStudio = e.detail;
        elsaStudio.pluginManager.registerPlugin(MyPlugin);
    });
</script>
```

Plugins can accept an optional parameter called `elsaStudio`, which provides access to various other services such as `eventBus`, `pluginManager` and more:

```typescript
export interface ElsaStudio {
  serverUrl: string;
  basePath: string;
  pluginManager: PluginManager;
  propertyDisplayManager: PropertyDisplayManager;
  elsaClientFactory: () => ElsaClient;
  httpClientFactory: () => AxiosInstance;
  eventBus: EventBus;
  activityIconProvider: ActivityIconProvider;
  confirmDialogService: ConfirmDialogService;
  toastNotificationService: ToastNotificationService;
  getOrCreateProperty: (activity: ActivityModel, name: string, defaultExpression?: () => string, defaultSyntax?: () => string) => ActivityDefinitionProperty
}
```

## Intercept Outgoing HTTP Requests

A common use case for a plugin is to intercept outgoing HTTP requests made from Elsa Studio to Elsa Server and add authorization headers.
This is necessary when you place Elsa Server behind a proxy server for example that requires authentication, or when you use ASP.NET Core Security Middleware to protect your server.

Since Elsa Studio uses [Axios](https://www.npmjs.com/package/axios), it is possible to install [Axios middleware](https://www.npmjs.com/package/axios-middleware) that adds authorization headers to outgoing HTTP request.
The following code snippet demonstrates a plugin that installs Axios middleware that adds an authorization headers:

```javascript
function AuthorizationMiddlewarePlugin(elsaStudio) {
    const eventBus = elsaStudio.eventBus;

    eventBus.on('http-client-created', e => {
        // Register Axios middleware.
        e.service.register({
            onRequest(request) {
                request.headers = { 'Authorization': 'Bearer 1234'}
                return request;
            }
        });
    });
}
```

> Checkout the [Axios Middleware documentation](https://emileber.github.io/axios-middleware) for [an example of a middleware](https://emileber.github.io/axios-middleware/#/examples/auth-middleware) that automatically retries the request if a 401 response is returned.

> **UNDER CONSTRUCTION**
>
> We're working on it. Check back soon!