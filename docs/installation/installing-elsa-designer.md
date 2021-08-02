---
id: installing-elsa-designer
title: Installing Elsa Designer
sidebar_label: Designer
---

The `<elsa-studio-root/>` web component is a higher-order component that consists of smaller components.

Instead of embedding this entire Elsa Dashboard UI web component into your web app, you can opt to embed lower-level individual components instead.
The dashboard component uses routing to individual **page** component, which in turn each embed **screen** components. These screen components are designed for reuse into your own application, if you want to.
One such screen component is the `<elsa-workflow-definition-editor-screen/>` component, which itself wraps the `<elsa-designer-tree/>` component, which is ultimately responsible for rendering the workflow diagram.

The following snippet demonstrates using the `<elsa-workflow-definition-editor-screen/>` component

> This snippet assumes that the component library is provided by the `Elsa.Designer.Bindings.Web` NuGet package as outlined in [Installing Elsa Dashboard](installing-elsa-dashboard.md).
> If you install the NPM package directly, it is up to you to also install the [Monaco Editor](https://www.npmjs.com/package/monaco-editor) package as outlined further down below.

```html
<elsa-workflow-definition-editor-screen server-url="https://your-elsa-server" workflow-definition-id="some-workflow-definition-id" monaco-lib-path="_content/Elsa.Designer.Components.Web/monaco-editor/min"/>
```

# Monaco Editor

Elsa uses the [Monaco Editor](https://www.npmjs.com/package/monaco-editor) package for the expression editors. When using the `Elsa.Designer.Bindings.Web` NuGet package, this library will already be provided as embedded assets that you can include in your HTML document (see [Installing Elsa Dashboard](installing-elsa-dashboard.md)).
But if you installed the [Elsa Workflow Designer](https://www.npmjs.com/package/@elsa-workflows/elsa-workflow-designer) NPM package directly, you need to also install the Monaco Editor NPM package and copy its contents to a location that can be accessed the same way as other assets from your web application.

For example, if you copied the contents of `monaco-editor` folder from `node_modules` to `wwwroot/js/monaco-editor` in some ASP.NET Core application, you need to specify `/js/monaco-editor/min` as the value for the `monaco-lib-path` attribute:

```html
<elsa-workflow-definition-editor-screen server-url="https://your-elsa-server" workflow-definition-id="some-workflow-definition-id" monaco-lib-path="/js/monaco-editor/min"/>
```

> You're not limited to using the Elsa web components in ASP.NET Core applications. It also works with regular HTML pages, ReactJS, Angular, Vue, etc.  