---
id: guides-recurring-task
title: Create & run a recurring workflow
sidebar_label: Recurring Task
---

In this guide, we will do the following:

* Create a console application.
* Programmatically define a workflow definition that automatically executes every 5 seconds using the `TimerEvent` activity.

Let's get to it!   

## Create Console Project

Run the following commands to create a new .NET Core Console project and add the necessary packages:

> Elsa is currently still in preview and not yet published to NuGet. Make sure to [add the MyGet feed](./installing-preview-feed.md) first.

```bash
dotnet new console --name Elsa.Guides.RecurringTask.ConsoleApp
cd Elsa.Guides.RecurringTask.ConsoleApp
dotnet add package Elsa.Core -v 1.0.0.14-beta3
dotnet add package Elsa.Activities.Console -v 1.0.0.14-beta3
dotnet add package Elsa.Activities.Timers -v 1.0.0.14-beta3
dotnet add package Microsoft.Extensions.Hosting
```

## Create Workflow Class

Create and add a new file to the project called `RecurringTaskWorkflow.cs` and add the following code:

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
                var services = host.Services;
                var registry = services.GetService<IWorkflowRegistry>();
                
                registry.RegisterWorkflow<RecurringTaskWorkflow>();
                
                await host.StartAsync();
                await host.WaitForShutdownAsync();
            }
        }

        private static void ConfigureServices(IServiceCollection services)
        {
            services
                .AddWorkflows()
                .AddConsoleActivities()
                .AddTimerActivities(options => options.Configure(x => x.SweepInterval = Period.FromSeconds(1)));
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
