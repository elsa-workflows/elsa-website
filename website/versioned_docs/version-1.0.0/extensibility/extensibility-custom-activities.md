---
id: version-1.0.0-extensibility-custom-activities
title: Writing Custom Activities
sidebar_label: Custom Activities
original_id: extensibility-custom-activities
---

One of the most important features of Elsa is its extensibility. Let's have a look at how one can extend the available activities with custom ones.
Follow these steps to create a custom activity:

1. Create a new class that implements `IActivity`. The easiest wayt to do this is by deriving your class from `Activity`.
1. Optionally annotate your class with `ActivityDefinitionAttribute` and its properties (if any) with `ActivityProperty` attributes to control their representation in the workflow designer.
1. Implement/override the `OnExecute/OnExecuteAsync` and if necessary the `OnResume/OnResumeAsync` methods. 
1. Register your activity class with the service container using the `AddActivity<T>` extension method.
1. Advanced: If your activity represents an event, implement code that triggers the workflow for this event.

## Hello World Activity

The following is a simple "Hello World" activity:

```c#
public class SayHelloWorld : Activity
{   
    protected override ActivityExecutionResult OnExecute(WorkflowExecutionContext context)
    {
        Console.WriteLine("Hello World!");

        return Done();
    }
}
```

## Registering Activities

To use an activity, make sure to register it with the service container, like so:

```c#
services.AddActivity<SayHelloWorld>();
```

## Dependency Injection

Since activities are registered with the service container, you can inject services into their constructor.
For example, if you register the following service:

```c#
services.AddSingleton(Console.Out);
```

Then you can use it as follows:

```c#
public class SayHelloWorld : Activity
{   
    private readonly TextWriter _writer;

    public SayHelloWorld(TextWriter writer)
    {
        _writer = writer;
    }

    protected override ActivityExecutionResult OnExecute(WorkflowExecutionContext context)
    {
        _writer.WriteLine("Hello World!");

        return Done();
    }
}
```

## Async Execution

If you need to make asynchronous invocations from your activity, override `OnExecuteAsync` method instead of `OnExecute`:

```c#
public class SayHelloWorld : Activity
{   
    private readonly TextWriter _writer;

    public SayHelloWorld(TextWriter writer)
    {
        _writer = writer;
    }

    protected override async Task<ActivityExecutionResult> OnExecuteAsync(WorkflowExecutionContext context, CancellationToken cancellationToken)
    {
        await _writer.WriteLineAsync("Hello World!");

        return Done();
    }
}
```

## Properties

Activities can have properties. These properties can be made available to visual workflow composers by annotating them with `ActivityPropertyAttribute`.

For example:

```c#
public class WriteLine : Activity
{   
    private readonly TextWriter _writer;

    public WriteLine(TextWriter writer)
    {
        _writer = writer;
    }

    [ActivityProperty(Hint = "The message to write.")]
    public string Message { get; set; }

    protected override async Task<ActivityExecutionResult> OnExecuteAsync(WorkflowExecutionContext context, CancellationToken cancellationToken)
    {
        await _writer.WriteLineAsync(Message);

        return Done();
    }
}
```

`ActivityPropertyAttribute` has more properties you can set:

* **Name**: Controls the technical name of the property. Not commonly used
* **Label**: Controls the display text when rendering this property on a form in the activity editor. 
* **Type**: Controls the data type of this property. If not specified, the type is inferred from the property type. The type is then used as a hint to the activity editor to select the proper field editor.
* **Hint**: Controls the hint text displayed underneath the field editor in the activity editor.

### State

Values stored in activity properties aren't automatically persisted. For example, if a user were to configure an activity property using the activity editor, the value will be lost. To persist activity property values, they will have to be stored in the activity's `State` property. The easiest way to do this is by implementing properties using the `GetState<T>` and `SetState<T>` methods. For example:

```c#
public string Message
{
    get => GetState<string>();
    set => SetState(value);
}
```

Now when the workflow definition containing this activity is serialized, the value specified in the `Message` property will be serialized as well.

## Activity Picker

The Activity Picker used when designing workflows will be configured with all available activities that are registered with the IoC service container. It will use the activity class name as the display name, and a default icon and no description.
In order to provide a custom display name, icon and description, annotate your activity class with `ActivityDefinitionAttribute`. For example:

```c#
[ActivityDefinition(
    Category = "Console",
    DisplayName = "Write Line",
    Description = "Write text to standard out.",
    Icon = "fas fa-terminal",
    Outcomes = new[] { OutcomeNames.Done }
)]
public class WriteLine : Activity
{   
...
}
```

> The Icon value will be rendered as a CSS class on the activity icon's HTML element.

## Outcomes

When an activity executes, it must return an **activity execution result**. One such result is the `OutcomeResult`, which instructs the workflow runner which outcome(s) to process by scheduling any and all connected activities to those outcomes.
To return an `OutcomeResult`, use the `Outcome` method like so:

```c#
public class WriteLine : Activity
{ 
    protected override async Task<ActivityExecutionResult> OnExecuteAsync(WorkflowExecutionContext context, CancellationToken cancellationToken)
    {
        // Do something useful.
        
        // Return an outcome.
        return Outcome("Done");
    }
}
```

> Outcomes are simple string values. Elsa provides a static class called `OutcomeNames` exposing a number of outcome names that are used by other activities, such as `Done`, `True` and `False`. 

Since many activities only need to return a single outcome indicating that they're done, oftentimes a simple `"Done"` outcome is returned. For that reason, the `Activity` base class provides a `Done` method that can be used as follows:

```c#
public class WriteLine : Activity
{ 
    protected override async Task<ActivityExecutionResult> OnExecuteAsync(WorkflowExecutionContext context, CancellationToken cancellationToken)
    {
        // Do something useful.
        
        // Return the "Done" outcome.
        return Done();
    }
}
```

### Designer Support
The workflow designer has no way of knowing what possible outcomes an activity yields, so it will need a little help. By default, the designer assumes an activity yields a single outcome called `"Done"`.
If your activity however has additional or different possible outcomes (like `True` and `False` in the case of the `IfElse` activity), you must specify these outcomes using `ActivityDefinitionAttribute`.
These outcomes are used by the workflow designer to render the possible outcomes as activity node endpoints from which you can drag connections to other activities on the workflow.

For example:

```c#
// To display possible outcomes in workflow designer: 
[ActivityDefinition(Outcomes = new[] { "Success", "Failed" })]
public class WriteLine : Activity
{ 
    protected override ActivityExecutionResult OnExecute(WorkflowExecutionContext context)
    {
        var success = DoSomething();
        var outcomeName = success ? "Success" : "Failed";
        
        return Outcome(outcomeName);
    }
}
```

## Suspend & Resume

Some activities represent workflow triggers, and require a certain event to be triggered before they return an outcome for the workflow runner to continue.
The `TimerEvent` activity is one such example. When it executes, instead of returning an `OutcomeResult`, it will return a `HaltResult` which instructs the workflow runner to suspend & persist the workflow.

The workflow is now said to be *halted*. The `TimerEvent` activity is said to be *blocking*. 

When a timer event is eventually triggered, the workflow will be *resumed*. When a workflow resumes, it will invoke the blocking activity's `ResumeAsync` method.
This method then performs any work that needs to be done, and depending on the activity's functionality, returns an appropriate activity execution result.

For example, imagine we have a `ReadLine` activity that will block until a line is read from the console and fed into the halted workflow: 

```c#
public class ReadLine : Activity
{
    protected override ActivityExecutionResult OnExecute(WorkflowExecutionContext context)
    {
        // Instruct the workflow runner to suspend the workflow.
        return Halt();
    }
    
    protected override ActivityExecutionResult OnResume(WorkflowExecutionContext context)
    {
        // Read received input.
        var receivedInput = (string) context.Workflow.Input["ReadLineInput"];
        
        // Store received input into activity output.
        Output.SetVariable("Input", receivedInput);

        // Instruct workflow runner that we're done.
        return Done();
    }
}
```

A workflow containing this activity would halt when it is executed. It's then up to your application to provide input to the workflow, typically by triggering an event. For example:

```c#
var line = Console.ReadLine();
var input = new Variables { ["ReadLineInput"] = line  };

// Trigger the ReadLine event activity.
_workflowInvoker.TriggerAsync(nameof(ReadLine), input);
```

The `TriggerAsync` method will start any workflows that have `ReadLine` as a starting activity, an will resume any workflows that are blocked by `ReadLine`.