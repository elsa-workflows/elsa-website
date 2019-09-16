---
id: installing-elsa-core
title: Installing Elsa Core 
sidebar_label: Elsa Core
---

The Elsa Core NuGet package provides APIs to build and execute workflows. In this section, we'll see how to install the package into a .NET project and register the appropriate services with the DI container.

## Add the Preview Feed

Elsa is currently only available from [MyGet](https://www.myget.org/feed/Packages/elsa), which means you need to add the following package feed source to your project:

`https://www.myget.org/F/elsa/api/v3/index.json`

The easiest way to do that is by adding a `NuGet.config` file to the root of your project/solution folder:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
    <packageSources>
        <add key="Elsa Preview Feed" value="https://www.myget.org/F/elsa/api/v3/index.json" />
    </packageSources>
</configuration>
```

## Add the Elsa.Core Package

With the preview feed in place, run the following command.

```bash
dotnet add package Elsa.Core
```

## Add Elsa Services

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
                .StartWith<WriteLine>(x => x.TextExpression = new Literal("Hello world!"))
                .Then<WriteLine>(x => x.TextExpression = new Literal("Goodbye cruel world..."))
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
