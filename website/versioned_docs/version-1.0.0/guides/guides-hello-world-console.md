---
id: version-1.0.0-guides-hello-world-console
title: Create & run a simple Hello World workflow
sidebar_label: Hello World Console
original_id: guides-hello-world-console
---

In this guide, we will do the following:

* Programmatically define a workflow definition that displays the text "Hello World" to the console.
* Run the workflow.     

Let's get to it!

## Create Console Project

Create a new .NET Core Console project called `Elsa.Guides.HelloWorld.ConsoleApp` and add the following packages:

* Elsa.Core
* Elsa.Activities.Console

## Define Workflow

Open `Program.cs` and insert the following code:

```csharp
using System;
using System.Threading.Tasks;
using Elsa.Activities.Console.Activities;
using Elsa.Activities.Console.Extensions;
using Elsa.Expressions;
using Elsa.Extensions;
using Elsa.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Elsa.Guides.HelloWorld.ConsoleApp
{
    class Program
    {
        static async Task Main(string[] args)
        {
            // Setup a service collection.
            var services = new ServiceCollection()

                // Add essential workflow services.
                .AddElsaCore()

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
            Console.ReadLine();
        }
    }
}

``` 

## Run

When you run the program, you should see the following output:

```text
Hello world!
```

## Summary

In this guide, we've seen how to create a simple console application and how to implement a workflow using `IWorkflowBuilder`. We then executed that workflow using `IWorkflowInvoker`.

## Source

https://github.com/elsa-workflows/elsa-guides/tree/master/src/Elsa.Guides.HelloWorld.ConsoleApp