---
id: installing-elsa-dashboard
title: Installing Elsa Dashboard
sidebar_label: Dashboard
---

The **Elsa.Dashboard** NuGet package provides an ASP.NET Core area implementing a dashboard that allows you to manage workflows.
In this section, we'll see how to install the package into a ASP.NET Core project and register the appropriate services with the DI container.

> Elsa is currently still in preview and not yet published to NuGet. Make sure to [add the MyGet feed](./installing-preview-feed.md) first.

## Add Package

To add the package to your ASP.NET Core project, run the following command: 

```bash
dotnet add package Elsa.Dashboard
```

## Register Services

To add the required services to your application, add the following code to `Startup.cs`:

```csharp
public void ConfigureServices(IServiceCollection services)
{
    services
        .AddMvc()
        .AddElsaDashboard();
}

public void Configure(IApplicationBuilder app, IHostingEnvironment env)
{
    app.UseStaticFiles();
    app.UseMvcWithDefaultRoute();
}
```

## Run

When you run your application, navigating to `/elsa/home` should present you with the following screen:

![](assets/dashboard-sample-1.png)

## Persistence

By default, only in-memory stores are registered with the DI container. To make sure your workflows are stored in a more permanent fashion, make sure to add one of the [persistence providers](./installing-persistence.md).