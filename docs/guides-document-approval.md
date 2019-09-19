---
id: guides-document-approval
title: A Simple Document Approval Workflow 
sidebar_label: Document Approval
---

> **Under construction**
> 
>This guide is currently under construction. Check back soon!  

In this guide, we will do the following:

* Define a workflow definition programmatically that executes when an HTTP request comes in at a specified URL. The workflow accepts a POST request with a JSON payload representing a document to be reviewed.
* See the following activities in action: `HttpRequest`, `HttpResponse`, `Fork`, `Join`, `SetVariable`, `Signaled`, `SendEmail` and `IfElse`.  

The purpose of the workflow is to allow authors to submit documents (modeled as JSON objects), and have a reviewer either **approve** or **reject** the document.
Furthermore, if the reviewer takes too long to take action, she is **reminded periodically** to approve or reject the pending document.  

Let's get to it!

## Create ASP.NET Core Project

> Elsa is currently still in preview and not yet published to NuGet. Make sure to [add the MyGet feed](./installing-preview-feed.md) first.

Create a new, empty ASP.NET Core project called `Elsa.Guides.ContentApproval.WebApp` and add the following packages:

* Elsa.Core
* Elsa.Activities.Email
* Elsa.Activities.Http
* Elsa.Activities.Timers

## Create Workflow Class

Create the following class. It's a pretty big listing, but don't worry, we'll go over each interesting aspect.

```csharp
using System;
using System.Dynamic;
using System.Net;
using System.Net.Http;
using Elsa.Activities.ControlFlow;
using Elsa.Activities.Email.Activities;
using Elsa.Activities.Http.Activities;
using Elsa.Activities.Primitives;
using Elsa.Activities.Timers.Activities;
using Elsa.Activities.Workflows;
using Elsa.Expressions;
using Elsa.Services;
using Elsa.Services.Models;

namespace Elsa.Guides.DocumentApproval.WebApp
{
    public class DocumentApprovalWorkflow : IWorkflow
    {
        public void Build(IWorkflowBuilder builder)
        {
            builder
                .StartWith<HttpRequestEvent>(
                    x =>
                    {
                        x.Method = HttpMethod.Post.Method;
                        x.Path = new Uri("/documents", UriKind.Relative);
                        x.ReadContent = true;
                    }
                )
                .Then<SetVariable>(
                    x =>
                    {
                        x.VariableName = "Document";
                        x.ValueExpression = new JavaScriptExpression<ExpandoObject>("lastResult().ParsedContent");
                    }
                )
                .Then<SendEmail>(
                    x =>
                    {
                        x.From = new LiteralExpression("approval@acme.com");
                        x.To = new JavaScriptExpression<string>("Document.Author.Email");
                        x.Subject =
                            new JavaScriptExpression<string>("`Document received from ${Document.Author.Name}`");
                        x.Body = new JavaScriptExpression<string>(
                            "`Document from ${Document.Author.Name} received for review. " +
                            "<a href=\"${signalUrl('Approve')}\">Approve</a> or <a href=\"${signalUrl('Reject')}\">Reject</a>`"
                        );
                    }
                )
                .Then<HttpResponseAction>(
                    x =>
                    {
                        x.Content = new LiteralExpression(
                            "<h1>Request for Approval Sent</h1><p>Your document has been received and will be reviewed shortly.</p>"
                        );
                        x.ContentType = "text/html";
                        x.StatusCode = HttpStatusCode.OK;
                        x.ResponseHeaders = new LiteralExpression("X-Powered-By=Elsa Workflows");
                    }
                )
                .Then<SetVariable>(
                    x =>
                    {
                        x.VariableName = "Approved";
                        x.ValueExpression = new LiteralExpression<bool>("false");
                    }
                )
                .Then<Fork>(
                    x => { x.Branches = new[] { "Approve", "Reject", "Remind" }; },
                    fork =>
                    {
                        fork
                            .When("Approve")
                            .Then<Signaled>(x => x.Signal = new LiteralExpression("Approve"))
                            .Then("Join");

                        fork
                            .When("Reject")
                            .Then<Signaled>(x => x.Signal = new LiteralExpression("Reject"))
                            .Then("Join");

                        fork
                            .When("Remind")
                            .Then<TimerEvent>(
                                x => x.TimeoutExpression = new LiteralExpression<TimeSpan>("00:00:10"),
                                id: "RemindTimer"
                            )
                            .Then<IfElse>(
                                x => x.ConditionExpression = new JavaScriptExpression<bool>("!!Approved"),
                                ifElse =>
                                {
                                    ifElse
                                        .When(OutcomeNames.False)
                                        .Then<SendEmail>(
                                            x =>
                                            {
                                                x.From = new LiteralExpression("reminder@acme.com");
                                                x.To = new LiteralExpression("approval@acme.com");
                                                x.Subject =
                                                    new JavaScriptExpression<string>(
                                                        "`${Document.Author.Name} is awaiting for your review!`"
                                                    );
                                                x.Body = new JavaScriptExpression<string>(
                                                    "`Don't forget to review document ${Document.Id}.<br/>" +
                                                    "<a href=\"${signalUrl('Approve')}\">Approve</a> or <a href=\"${signalUrl('Reject')}\">Reject</a>`"
                                                );
                                            }
                                        )
                                        .Then("RemindTimer");
                                }
                            );
                    }
                )
                .Then<Join>(x => x.Mode = Join.JoinMode.WaitAny, id: "Join")
                .Then<SetVariable>(
                    x =>
                    {
                        x.VariableName = "Approved";
                        x.ValueExpression = new JavaScriptExpression<object>("input('Signal') === 'Approve'");
                    }
                )
                .Then<IfElse>(
                    x => x.ConditionExpression = new JavaScriptExpression<bool>("!!Approved"),
                    ifElse =>
                    {
                        ifElse
                            .When(OutcomeNames.True)
                            .Then<SendEmail>(
                                x =>
                                {
                                    x.From = new LiteralExpression("approval@acme.com");
                                    x.To = new JavaScriptExpression<string>("Document.Author.Email");
                                    x.Subject =
                                        new JavaScriptExpression<string>("`Document ${Document.Id} approved!`");
                                    x.Body = new JavaScriptExpression<string>(
                                        "`Great job ${Document.Author.Name}, that document is perfect! Keep it up.`"
                                    );
                                }
                            );

                        ifElse
                            .When(OutcomeNames.False)
                            .Then<SendEmail>(
                                x =>
                                {
                                    x.From = new LiteralExpression("approval@acme.com");
                                    x.To = new JavaScriptExpression<string>("Document.Author.Email");
                                    x.Subject =
                                        new JavaScriptExpression<string>("`Document ${Document.Id} rejected`");
                                    x.Body = new JavaScriptExpression<string>(
                                        "`Sorry ${Document.Author.Name}, that document isn't good enough. Please try again.`"
                                    );
                                }
                            );
                    }
                );
        }
    }
}
```

## Update Startup

Update the `Startup` class as follows:

```csharp
using Elsa.Activities.Email.Extensions;
using Elsa.Activities.Http.Extensions;
using Elsa.Activities.Timers.Extensions;
using Elsa.Extensions;
using Elsa.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Elsa.Guides.DocumentApproval.WebApp
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        public void ConfigureServices(IServiceCollection services)
        {
            services
                .AddWorkflows()
                .AddHttpActivities(options => options.Bind(Configuration.GetSection("Http")))
                .AddEmailActivities(options => options.Bind(Configuration.GetSection("Smtp")))
                .AddTimerActivities(options => options.Bind(Configuration.GetSection("BackgroundRunner")));
        }

        public void Configure(IApplicationBuilder app, IHostingEnvironment env, IWorkflowRegistry workflowRegistry)
        {
            app.UseHttpActivities();
            workflowRegistry.RegisterWorkflow<DocumentApprovalWorkflow>();
        }
    }
}
```

## Update Appsettings.json

As you might have notices, we are configuring the HTTP, Email and Timer activities by binding their options with `Configuration`. Although you could certainly do the configuration manually, let's update `appsettings.json` as follows:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Warning"
    }
  },
  "AllowedHosts": "*",
  "Http": {
    "BaseUrl": "http://localhost:5000"
  },
  "Smtp": {
    "Host": "localhost",
    "Port": "2525"
  },
  "BackgroundRunner": {
    "SweepInterval": "PT01S"
  }
}

```

## Summary
 


## Source

https://github.com/elsa-workflows/elsa-guides/tree/master/src/Elsa.Guides.DocumentApproval.WebApp