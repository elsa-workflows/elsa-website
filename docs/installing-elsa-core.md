---
id: installing-elsa-core
title: Installing Elsa Core 
sidebar_label: Core
---

The **Elsa.Core** NuGet package provides APIs to build and execute workflows. In this section, we'll see how to install the package into a .NET project and register the appropriate services with the DI container.

## Add Package

> Elsa is currently still in preview and not yet published to NuGet. Make sure to [add the MyGet feed](./installing-preview-feed.md) first.

```bash
dotnet add package Elsa.Core
```

## Register Services

To add Elsa services to your application, add the following code to `Startup.cs`:

```csharp
public void ConfigureServices(IServiceCollection services)
{
    services.AddWorkflows();
}
```

You can now resolve workflow services to build, load and execute workflows.

## Example

As a quick example, try the following in a new console project:

```csharp
using System;
using System.Threading.Tasks;
using Elsa.Activities.Console.Activities;
using Elsa.Activities.Console.Extensions;
using Elsa.Expressions;
using Elsa.Extensions;
using Elsa.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Example1
{
    /// <summary>
    /// A minimal workflows program defined in code using fluent workflow builder and Console activities.
    /// </summary>
    class Program
    {
        static async Task Main(string[] args)
        {
            // Setup a service collection.
            var services = new ServiceCollection()
                .AddWorkflows()
                .AddConsoleActivities()
                .BuildServiceProvider();

            // Define a workflow.
            var workflowBuilder = services.GetRequiredService<IWorkflowBuilder>();
            var workflowDefinition = workflowBuilder
                .StartWith<WriteLine>(x => x.TextExpression = new LiteralExpression("Hello world!"))
                .Then<WriteLine>(x => x.TextExpression = new LiteralExpression("Goodbye cruel world..."))
                .Build();

            // Start the workflow.
            var invoker = services.GetService<IWorkflowInvoker>();
            await invoker.StartAsync(workflowDefinition);

            Console.ReadLine();
        }
    }
}
```

Output:

```text
Hello world!
Goodbye cruel world...
```
