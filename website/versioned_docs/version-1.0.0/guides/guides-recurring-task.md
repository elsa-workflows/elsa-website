---
id: version-1.0.0-guides-recurring-task
title: Create & run a recurring workflow
sidebar_label: Recurring Task
original_id: guides-recurring-task
---

In this guide, we will do the following:

* Programmatically define a workflow definition that automatically executes every 5 seconds using the `TimerEvent` activity.

Let's get to it!

## Create Console Project

Create a new .NET Core Console project called `Elsa.Guides.RecurringTask.ConsoleApp` and add the following packages:

* Elsa.Core
* Elsa.Activities.Console
* Elsa.Activities.Timers
* Elsa.Scripting.JavaScript
* Microsoft.Extensions.Hosting* 

## Define Workflow

Create a new class called `RecurringTaskWorkflow` and add the following code:

```csharp
using System;
using Elsa.Activities.Console.Activities;
using Elsa.Activities.Timers.Activities;
using Elsa.Expressions;
using Elsa.Services;
using Elsa.Services.Models;
using NodaTime;

namespace Elsa.Guides.RecurringTask.ConsoleApp
{
    public class RecurringTaskWorkflow : IWorkflow
    {
        public void Build(IWorkflowBuilder builder)
        {
            builder
                .AsSingleton()
                .StartWith<TimerEvent>(x => x.TimeoutExpression = new LiteralExpression<TimeSpan>("00:00:05"))
                .Then<WriteLine>(x => x.TextExpression = new JavaScriptExpression<string>("`It's now ${new Date()}. Let's do this thing!`"));
        }
    }
}
```

> Notice that we're defining this workflow as a **singleton**. Singleton workflows will only ever have a single instance running. 
> This is desirable in this example, because we don't want to spawn a new workflow instance every time the timer background runner ticks.  

## Update Program

Next, open `Program.cs` and insert the following code:

```csharp
using System;
using System.Threading.Tasks;
using Elsa.Activities.Console.Activities;
using Elsa.Activities.Console.Extensions;
using Elsa.Activities.Timers.Extensions;
using Elsa.Expressions;
using Elsa.Extensions;
using Elsa.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using NodaTime;

namespace Elsa.Guides.RecurringTask.ConsoleApp
{
    class Program
    {
        static async Task Main(string[] args)
        {
            var host = new HostBuilder()
                .ConfigureServices(ConfigureServices)
                .ConfigureLogging(logging => logging.AddConsole())
                .UseConsoleLifetime()
                .Build();

            using (host)
            {
                await host.StartAsync();
                await host.WaitForShutdownAsync();
            }
        }

        private static void ConfigureServices(IServiceCollection services)
        {
            services                
                .AddElsaCore()
                .AddJavaScriptExpressionEvaluator()
                .AddConsoleActivities()
                .AddTimerActivities(options => options.Configure(x => x.SweepInterval = Duration.FromSeconds(1)))
                .AddWorkflow<RecurringTaskWorkflow>();
        }
    }
}
```

> Notice that we don't have to invoke the workflow ourselves manually. Instead, this is taken care of by a background task that is executed within the host built with `HostBuilder`. 

## Run

Execute the following command to run the program: 

```bash
dotnet run Elsa.Guides.RecurringTask.ConsoleApp.csproj
```

After 5 seconds, you will start seeing the following output:

```text
It's now Tue Sep 17 2019 16:28:40 GMT+02:00. Let's do this thing!
It's now Tue Sep 17 2019 16:28:46 GMT+02:00. Let's do this thing!
It's now Tue Sep 17 2019 16:28:52 GMT+02:00. Let's do this thing!
```

## Summary

In this guide, we've seen how to setup a workflow that is triggered using a `TimerEvent` activity.

## Source

https://github.com/elsa-workflows/elsa-guides/tree/master/src/Elsa.Guides.RecurringTask.ConsoleApp