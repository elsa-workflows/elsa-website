---
id: installing-host
title: Using Elsa as a Workflow Host
sidebar_label: Host
---

In order to automatically execute workflows, you will need to start various background services and install various middleware.

For example, in order to trigger the `TimerEvent` activity, the `TimersHostedService` needs to be registered with your [.NET Core host](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/host/generic-host).

In order to trigger the `HttpRequestEvent` activity, the `RequestHandlerMiddleware<TriggerRequestHandler>` middleware needs to be added to the ASP.NET Core middleware pipeline. 
 
And should you be using [MassTransit](https://masstransit-project.com/), you will want to register some more hosted services that will listen for incoming messages.
 
Now that you understand some of the use cases for a .NET Core host, let's see how to setup some common services.

## Startup

The following `Startup` shows the minimum set of calls to make in order to register the most common services required when using **HTTP** and **Timer** activities:

```csharp
public void ConfigureServices(IServiceCollection services)
{
    services
        // Required services for Elsa to work. Registers things like `IWorkflowInvoker`.
        .AddElsa()

        // Registers necessary service to handle HTTP requests.
        .AddHttpActivities()

        // Registers a hosted service that periodically invokes workflows containing time-based activities. 
        .AddTimerActivities();
}
```

Additionally, the following call is required to register the necessary middleware when using with **HTTP** activities:

```csharp
public void Configure(IApplicationBuilder app)
{
    // Register necessary ASP.NET Core middleware that triggers workflows containing HTTP activities. 
    app.UseHttpActivities();
}
```