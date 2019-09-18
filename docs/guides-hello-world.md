---
id: guides-hello-world
title: Create & run a simple Hello World workflow
sidebar_label: Hello World
---

In this guide, we will do the following:

* Create a console application.
* Programmatically define a workflow definition that displays the text "Hello World" to the console.
* Run the workflow.

Let's get to it!   

## Create Console Project

Run the following commands to create a new .NET Core Console project and add the necessary packages:

> Elsa is currently still in preview and not yet published to NuGet. Make sure to [add the MyGet feed](./installing-preview-feed.md) first.

```bash
dotnet new console --name Elsa.HelloWorld.ConsoleApp
cd Elsa.HelloWorld.ConsoleApp
dotnet add package Elsa.Core -v 1.0.0.14-beta3
dotnet add package Elsa.Activities.Console -v 1.0.0.14-beta3
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