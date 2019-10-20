---
id: guides-document-approval
title: A Simple Document Approval Workflow 
sidebar_label: Document Approval
---

In this guide, we will do the following:

* Define a **long-running** workflow definition programmatically that executes when an HTTP request comes in at a specified URL. The workflow accepts a POST request with a JSON payload representing a document to be reviewed.
* See the following activities in action: `HttpRequest`, `HttpResponse`, `Fork`, `Join`, `SetVariable`, `Signaled`, `SendEmail` and `IfElse`.  

The purpose of the workflow is to allow authors to submit documents (modeled as JSON objects), and have a reviewer either **approve** or **reject** the document.
Furthermore, if the reviewer takes too long to take action, she is **reminded periodically** to approve or reject the pending document.

The JSON payload we'll be posting to the workflow would look like this:

```json
{
	"Id": "1",
	"Author": {
		"Name": "John",
		"Email": "john@gmail.com"
	},
	"Body": "This is sample document."
}
```  

Keep this structure in mind when looking at activities using JavaScript expressions accessing this model.

Let's get to it!

## Create ASP.NET Core Project

> Elsa is currently still in preview and not yet published to NuGet. Make sure to [add the MyGet feed](./installing-preview-feed.md) first.

Create a new, empty ASP.NET Core project called `Elsa.Guides.ContentApproval.WebApp` and add the following packages:

* Elsa.Core
* Elsa.Activities.Email
* Elsa.Activities.Http
* Elsa.Activities.Timers

## Create Workflow Class

Create the following class:

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
                        x.ValueExpression = new JavaScriptExpression<ExpandoObject>("lastResult().Content");
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
                        x.ValueExpression = new JavaScriptExpression<bool>("false");
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

That's a pretty big listing! Let's go over each activity step-by-step from top to bottom.

### HttpRequestEvent

```csharp
.StartWith<HttpRequestEvent>(
    x =>
    {
        x.Method = HttpMethod.Post.Method;
        x.Path = new Uri("/documents", UriKind.Relative);
        x.ReadContent = true;
    }
)
```

Because of the presence of the `HttpRequestEvent` activity, the workflow will be executed every time a HTTP POST request is received matching the path `/documents`.

We set its `ReadContent` to `true` so that the request body will be read & parsed. Parsing the content body is done with an appropriate **IContentFormatter** that is selected based on the request body's *content type*.
Currently, only the `application/json` and `text/json` content types are supported, but support for `application/x-www-form-urlencoded` and `multipart/form-data` will be added as well. It will parse the JSON content into an [ExpandoObject](https://docs.microsoft.com/en-us/dotnet/api/system.dynamic.expandoobject?view=netcore-2.2). 

With `ReadContent` set to true, we will be able to access the parsed JSON from other activities in the workflow.
The activity will store this value in its output dictionary with a key of `"Content"` as well as the workflow execution context's `LastResult` property.

### SetVariable

```csharp
.Then<SetVariable>(
    x =>
    {
        x.VariableName = "Document";
        x.ValueExpression = new JavaScriptExpression<ExpandoObject>("lastResult().ParsedContent");
    }
)
```

We then connect to the `SetVariable` activity that sets a custom variable on the workflow that we call `Document`. We use a **JavaScript expression** to assign the object we received as part of the HTTP request.

The expression works like this:

- First, we invoke a function called `lastResult`. This function returns the workflow execution context's `LastResult` value. Because this was set by the `HttpRequestEvent`, it will contain an object that consists of two properties: `Content` and `ParsedContent`.
- `ParsedContent` holds the expando object mentioned earlier, while `Content` holds the raw HTTP request content body.

 We are using the `SetVariable` activity to simplify accessing it from other activities later on, as we'll see in the next activity.
 
 ### SendEmail
 
 ```csharp
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
 ```

The second thing we want to do is to notify the reviewer that a new document was submitted. We do this by sending an email using the `SendEmail` activity. We configure this activity using a mix of `LiteralExpression` and `JavaScriptExpression` objects.
A `LiteralExpression` returns the literal string value passed into its constructor, and optionally converts it to a given type if you use the generic type overload. In this case, we just need to specify a literal email address: `"approval@acme.com`.

The expression for the `To`, `Subject` and `Body` are more interesting. The all demonstrate how to use JavaScript expressions to access the `Document` variable we defined earlier on the workflow. 

The `Body` property expression uses a JavaScript function called `signalUrl` taking a single argument representing the name of the signal. What this does is generate an absolute URL including a security token that carries the following information:

* Workflow Instance ID
* Name of the signal

When a HTTP request is made to the generated URL (e.g. by clicking on it when the email is received), Elsa will recognize this URL and **trigger** the workflow instance matching the workflow instance ID carried by the security token.
Specifically, the workflow will be triggered with the `Signaled` event, which causes the workflow to resume if it is **blocked** on an activity of that type.
We will get to the `Signaled` shortly.

First, we want to send an HTTP response to the client and say that the document was successfully received.

### HttpResponseAction

```csharp
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
```

The `HttpResponseAction` simply writes a response back to the client. The activity allows us to configure the **status code**, **content type**, **content body** and **response headers** to send back.
 
### SetVariable
 
```csharp
.Then<SetVariable>(
 x =>
 {
     x.VariableName = "Approved";
     x.ValueExpression = new LiteralExpression<bool>("false");
 }
) 
```

We encounter the `SetVariable` activity again. This time to initialize another variable we call `Approved`. This variable is used later on to check whether the reviewer clicked the `Approve` or `Reject` link (triggering the appropriate signal).
We need to initialize this variable beforehand because in the next activity, we will **fork** execution into 3 branches, one of which initiates a **timer** that periodically checks this variable. 
If the variable were undefined, the workflow would **fault**.

### Fork, IfElse

```csharp
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
                ...
            );
    }
)
```

The `Fork` activity allows us to split workflow execution into multiple branches. In this case, we are branching off into the following branches:

* Approve
* Reject
* Remind

For both the **Approve** and **Reject** branches, we connect to a `Signaled` activity which was mentioned earlier. Because we forked execution, the workflow will become blocked on both these two activities.
When the reviewer clicks either link from the email, one of these activities will be triggered and resume workflow execution.
When this happens, workflow execution continues on to the `Join` activity, which we'll cover shortly.

> #### Connecting Activities
>
> Notice that we can connect to activities other than whatever is specified as a generic type parameter. Instead of specifying what activity will be executed next using the type argument, we can specify the **ID** of an activity instead.
> In reality, the `Next<T>` method simply defines an activity and then automatically creates a connection between the current one and the one being defined. The `Next` method taking no type arguments, and only a single `id: string` argument, simply creates a connection between the current activity and the one specified by the ID.   

Not only will the workflow be blocked on the two Signaled activities, it will also block on the `TimerEvent` activity.
This activity is configured to trigger every 10 seconds. Every 10 seconds, this branch of the workflow will continue to the `IfElse` activity.
Notice that we specified an ID value for the `TimerEvent` activity: `"RemindTimer""`. Specifying an explicit ID allows us to reference activities from other parts of the workflows, as we'll see in a few seconds.

### IfElse

```csharp
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
```
The `IfElse` activity splits execution into 2 branches. Depending on the `Boolean` value to which its `ConditionExpression` evaluates, execution will either continue on the `True` branch or the `False` branch.
In our case, the condition checks whether the value of the `Approved` workflow variable equals to `true`.

If `false`, an email is sent using the `SendEmail` activity, which we've seen before, and **loop back** to the `TimerEvent` using `Then("Reminder")`. Now you see why we provided an ID value for the `TimerEvent`.

### Join

```csharp
.Then<Join>(x => x.Mode = Join.JoinMode.WaitAny, id: "Join")
.Then<SetVariable>(
    x =>
    {
        x.VariableName = "Approved";
        x.ValueExpression = new JavaScriptExpression<object>("input('Signal') === 'Approve'");
    }
)
```

The `Join` variable merges workflow execution back into a single branch. Specifying a `JoinMode` of `WaitAny` will cause this activity to continue the workflow as soon as any of the incoming activities have executed.
In other words, the workflow will resume as soon as either the `Approve` or `Reject` signal is triggered.
When it does, we set the `Approved` workflow variable to either `true` or `false`, respectively.   

### IfElse

```csharp
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
```

Finally, we simply check the value of `Approved`, and send the appropriate email to the author of the document, concluding the workflow.

## Update Startup

Now that the workflow has been defined, we should update the `Startup` class as follows:

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

As you can see, we are configuring the **HTTP**, **Email** and **Timer** activities by binding their options with `Configuration`. Although you could certainly do the configuration manually, let's update `appsettings.json` as follows:

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

## Run

In order to try out the workflow, I will be using the following two tools:

* [Postman](https://www.getpostman.com/)
* [Smtp4Dev](https://github.com/rnwood/smtp4dev)

Postman enables us to easily post JSON content to our workflow.
Smtp4Dev enables us to launch an SMTP service locally and intercept all outgoing email messages, without actually sending them to the recipients.
I configured mine to listen on port `2525`.

First, launch the application. IF all went well, the web host will be ready for incoming HTTP requests at http://localhost:5000:

```text
Hosting environment: Production
Content root path: C:\Projects\Elsa\elsa-guides\src\Elsa.Guides.DocumentApproval.WebApp
Now listening on: http://localhost:5000
Now listening on: https://localhost:5001
Application started. Press Ctrl+C to shut down.
```

Next, send the following HTTP request:

```http request
POST /documents HTTP/1.1
Host: localhost:5000
Content-Type: application/json

{
	"Id": "3",
	"Author": {
		"Name": "John",
		"Email": "john@gmail.com"
	},
	"Body": "This is sample document."
}
```

Or in cUrl format:

```bash
curl --location --request POST "http://localhost:5000/documents" \
--header "Content-Type: application/json" \
--data "{
	\"Id\": \"3\",
	\"Author\": {
		\"Name\": \"John\",
		\"Email\": \"john@gmail.com\"
	},
	\"Body\": \"This is sample document.\"
}"
```

The response should look like this:

```html
<h1>Request for Approval Sent</h1>
<p>Your document has been received and will be reviewed shortly.</p>
```

When you launch the Smtp4Dev Web UI, you should be seeing this:

![](./assets/guides-content-approval-figure-1.png)

And after around every 10 seconds, reminding email messages should come in:

![](./assets/guides-content-approval-figure-2.png)

This will continue until you either click the `Approve` or `Reject` link.

## Summary

In this walkthrough, we've seen how to implement long-running workflows with the help of `HttpRequestEvent`, `Signaled` and the `signalUrl` JavaScript function,
We've also seen how to use various other activities to implement a reminding loop. 

## Source

https://github.com/elsa-workflows/elsa-guides/tree/master/src/Elsa.Guides.DocumentApproval.WebApp