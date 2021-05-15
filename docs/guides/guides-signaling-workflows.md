---
id: guides-signaling-workflows
title: Signaling Workflows 
sidebar_label: Signaling Workflows
---

Elsa comes with a couple of activities and APIs that allow you to send simple signals from and to workflows as well as from your application code.

Although Elsa makes it easy to write your own set of activities that represent triggers, in many cases a general-purpose signaling API is all you need without having to write redundant code.

In this guide, we will take a look at how signaling works.

We will:

* Setup an ASP.NET Core Elsa Server project and connect to it from an Elsa Dashboard application.
* Send a signal from one workflow that is then handled by another workflow.
* See how correlation works in combination with signaling.
* See how to send a signal manually from application code.

## Create Server Project

Create a new ASP.NET Core project called `ElsaGuides.Signaling` and add the necessary packages:

```bash
dotnet new web -n "ElsaGuides.Signaling"
cd ElsaGuides.Signaling
dotnet add package Elsa --prerelease
dotnet add package Elsa.Activities.Http --prerelease
dotnet add package Elsa.Persistence.EntityFramework.Core --prerelease
dotnet add package Elsa.Persistence.EntityFramework.Sqlite --prerelease
dotnet add package Elsa.Server.Api --prerelease
```

## Startup

Next, open `Startup.cs` and replace its contents with the following:

```csharp
using Elsa.Persistence.EntityFramework.Core.Extensions;
using Elsa.Persistence.EntityFramework.Sqlite;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace ElsaGuides.Signaling
{
    public class Startup
    {
        public Startup(IWebHostEnvironment environment, IConfiguration configuration)
        {
            Environment = environment;
            Configuration = configuration;
        }

        private IWebHostEnvironment Environment { get; }
        private IConfiguration Configuration { get; }

        public void ConfigureServices(IServiceCollection services)
        {
            services
                .AddElsa(elsa => elsa
                    .UseEntityFrameworkPersistence(ef => ef.UseSqlite())
                    .AddConsoleActivities()
                    .AddHttpActivities()
                    .AddJavaScriptActivities()
                    .AddWorkflowsFrom<Startup>()
                );
            
            services.AddElsaApiEndpoints();

            services.AddCors(cors => cors.AddDefaultPolicy(policy => policy
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowAnyOrigin()
                .WithExposedHeaders("Content-Disposition"))
            );
        }

        public void Configure(IApplicationBuilder app)
        {
            if (Environment.IsDevelopment()) 
                app.UseDeveloperExceptionPage();

            app
                .UseCors()
                .UseHttpActivities()
                .UseRouting()
                .UseEndpoints(endpoints => endpoints.MapControllers());
        }
    }
}
```

## Run Server

Run the application. By default, it will listen on URLS `https://localhost:5001` and `http://localhost:5000`. If you use different ports, that is fine too, just make sure to provide the appropriate one in the next step: Run Dashboard

## Run Dashboard

Launch the Elsa Dashboard using the following Docker command:

```bash
docker run -t -i -e Elsa__Server__BaseAddress='https://localhost:5001' -e ASPNETCORE_ENVIRONMENT='Development' -p 13000:80 elsa-workflows/elsa-dashboard:latest
```

This will start the Elsa Dashboard in a container which you can access from a web browser at `http://localhost:13000`.

## Signal Sender Workflow

Navigate to the dashboard at `http://localhost:13000` and create a new workflow definition and name it **Signal Sender**.

In the next steps we will add two activities: an **HTTP Endpoint** so that we can trigger the workflow using the web browser, and a **Send Signal** activity that will send a signal.  

### HTTP Endpoint

Click the **Start** button and look for the **HTTP Endpoint** activity. Configure it as follows:

* Path: `/trigger-signal`
* Methods: `GET`

### Send Signal

Click the `Done` outcome of the previous activity and look for the **Send Signal** activity. Configure it as follows:

* Signal: `order-received`

Publish the workflow.

## Signal Received Workflow

Go back to the **Workflow Definitions** screen and create a new workflow called **Signal Handler** and add the activities as described next.

### Signal Received

Click the **Start** button and add the **Signal Received** activity with the following settings:

* Signal: `order-received`

### HTTP Response

Click the `Done` outcome of the previous activity and add the **HTTP Response** activity with the following settings:

- Content: `Order signal received!`

Publish the workflow.

## Trigger Signal

We now have two workflows at the ready: the **Signal Sender** that will fire a signal, and a **Signal Handler** that will respond to the signal by writing something to the HTTP response.

Let's try it out by opening a web browser and navigating to `https://localhost:5001/trigger-signal`.
The response will be a simple:

```text
Order signal received!
```

## Signal Correlation

Now that we have seen the basics of workflow signaling, let's consider a more complex scenario where we provide a customer ID when triggering the "order-received" signal.
We will correlate the workflow with the customer and create a third workflow that will ship the order for the specified customer ID.

> In real world applications, you will probably correlated the workflow with an actual order ID rather than the customer ID.

**Work In Progress**
