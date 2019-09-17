---
id: guides-hello-world
title: Create & run a simple Hello World workflow
sidebar_label: Hello World
---

In this guide, we will implement a very simple Hello World workflow.
In practice, most workflows will be triggered automatically, for example when a timer elapses, a signal is received or an HTTP request comes in,
Under the covers, however, it all comes down to selecting what workflows to start and resume, and then invoking them.

To get a feel for what a workflow is and how to run one, we'll create a simple but complete program that shows the following:

* What packages to use
* What namespaces to import
* What services to register
* What services to use to define a workflow
* What services to use to invoke a workflow

Let's get to it!   

## Create Console Project

Run the following commands to create a new .NET Core Console project and add the necessary packages:

> Elsa is currently still in preview and not yet published to NuGet. Make sure to [add the MyGet feed](./installing-preview-feed.md) first.

```bash
dotnet new console --name Elsa.HelloWorld.ConsoleApp
cd Elsa.HelloWorld.ConsoleApp
dotnet add package Elsa.Core -v 1.0.0.11-beta3
dotnet add package Elsa.Activities.Console -v 1.0.0.11-beta3
```

Next, open `Program.cs` and insert the following code:

```csharp
using System;
using System.Threading.Tasks;
using Elsa.Activities.Console.Activities;
using Elsa.Activities.Console.Extensions;
using Elsa.Expressions;
using Elsa.Extensions;
using Elsa.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Elsa.HelloWorld.ConsoleApp
{
    class Program
    {
        static async Task Main(string[] args)
        {
            // Setup a service collection.
            var services = new ServiceCollection()

                // Add essential workflow services.
                .AddWorkflows()

                // Add Console activities (ReadLine and WriteLine).
                .AddConsoleActivities()

                .BuildServiceProvider();

            // Get a workflow builder.
            var workflowBuilder = services.GetRequiredService<IWorkflowBuilder>();

            // Define a workflow and add a single activity.
            var workflowDefinition = workflowBuilder
                .StartWith<WriteLine>(x => x.TextExpression = new LiteralExpression("Hello world!"))
                .Build();

            // Get a workflow invoker,
            var invoker = services.GetService<IWorkflowInvoker>();

            // Start the workflow.
            await invoker.StartAsync(workflowDefinition);

            // Prevent the console from shutting down until user hits a key.
            System.Console.ReadLine();
        }
    }
}

``` 

## Run

Execute the following command to run the program: 

```bash
dotnet run Elsa.HelloWorld.ConsoleApp.csproj
```

You should see the following output:

```text
Hello world!
```

## Summary

In this guide, we've seen how to create a simple console application and how to implement a workflow using `IWorkflowBuilder`. We then executed that workflow using `IWorkflowInvoker`. 

Easy as that!