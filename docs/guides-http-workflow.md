---
id: guides-http-workflow
title: Create & run a workflow triggered with HTTP
sidebar_label: HTTP Workflow
---

In this guide, we will do the following:

* Create an ASP.NET Core application.
* Programmatically define a workflow definition that executes when an HTTP request comes in at a specified URL.

Let's get to it!   

## Create ASP.NET Core Project

Run the following commands to create a new ASP.NET Core API project and add the necessary packages:

> Elsa is currently still in preview and not yet published to NuGet. Make sure to [add the MyGet feed](./installing-preview-feed.md) first.

```bash
dotnet new web --name Elsa.Guides.HttpWorkflow.Web
cd Elsa.Guides.HttpWorkflow.Web
dotnet add package Elsa.Core -v 1.0.0.14-beta3
dotnet add package Elsa.Activities.Http -v 1.0.0.14-beta3
```

## Create Workflow Class

Create and add a new file to the project called `HttpWorkflow.cs` and add the following code:

```csharp
using System;
using System.Net;
using System.Net.Http;
using Elsa.Activities.Http.Activities;
using Elsa.Expressions;
using Elsa.Services;
using Elsa.Services.Models;

namespace Elsa.Guides.HttpWorkflow.Web
{
    public class HttpWorkflow : IWorkflow
    {
        public void Build(IWorkflowBuilder builder)
        {
            builder
                .StartWith<HttpRequestEvent>(
                    x =>
                    {
                        x.Method = HttpMethod.Get.Method;
                        x.Path = new Uri("/hello-world", UriKind.Relative);
                    }
                )
                .Then<HttpResponseAction>(
                    x =>
                    {
                        x.Content = new LiteralExpression("<h1>Hello World!</h1>");
                        x.ContentType = "text/html";
                        x.StatusCode = HttpStatusCode.OK;
                        x.ResponseHeaders = new LiteralExpression("X-Powered-By=Elsa Workflows");
                    }
                );
        }
    }
}
```

Next, open `Startup.cs` and insert the following code:

```csharp
using Elsa.Activities.Http.Extensions;
using Elsa.Extensions;
using Elsa.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

namespace Elsa.Guides.HttpWorkflow.Web
{
    public class Startup
    {
        public void ConfigureServices(IServiceCollection services)
        {
            services
                .AddWorkflows()
                .AddHttpActivities();
        }

        public void Configure(IApplicationBuilder app, IWorkflowRegistry workflowRegistry)
        {
            app.UseHttpActivities();
            workflowRegistry.RegisterWorkflow<HttpWorkflow>();
        }
    }
}
``` 

## Run

Execute the following command to run the program: 

```bash
dotnet run Elsa.Guides.HttpWorkflow.Web.csproj
```

The output should read: 

```text
Now listening on: http://localhost:5000
Now listening on: https://localhost:5001
Application started. Press Ctrl+C to shut down.
```

Open a browser window or a tool like [Postman](https://www.getpostman.com/) and navigate to `https://localhost:5001/hello-world`.

The result should look like this:

![](./assets/guides-http-workflow-figure-1.png)

## Summary

In this guide, we've seen how to setup a workflow that is triggered when an HTTP request comes in.
Implementing HTTP workflows is a great way to easily implement logic in response to HTTP requests quickly. 
