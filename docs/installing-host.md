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
        .AddWorkflows()

        // Registers an IServer decorator that will automatically invoke startup tasks. This enables async initialization.
        .AddTaskExecutingServer()

        // Registers necessary service to handle HTTP requests.
        .AddHttpActivities()

        // Registers a hosted services that periodically invokes workflows containing time-based activities. 
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

## About the Startup Runner
When the application starts, it will automatically read all of your workflow definitions into the workflow registry. This is handled by a `IStartupTask` called `PopulateRegistryTask`.
Startup tasks are executed by the `IStartupRunner`, which is automatically invoked by `TaskExecutingServer`.

> If you prefer to control when the startup tasks execute, simply remove the call to `AddTaskExecutingServer`. It's now your responsibility to resolve the `IStartupRunner` and invoke its `StartupAsync` method.
>
> The `PopulateRegistryTask` task is responsible for populating the workflow registry with workflow definitions from the underlying workflow definition store.
> Another startup task called `InitializeStoreTask` is shipped with the YesSQL provider, and takes care of creating the necessary database tables.
> You can implement your own `IStartupTask` if you need to run initialization code. A use case might be to automatically run EF migrations.  