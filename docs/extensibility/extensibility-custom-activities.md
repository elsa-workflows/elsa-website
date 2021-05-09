---
id: extensibility-custom-activities
title: Writing Custom Activities
sidebar_label: Custom Activities
---

One of Elsa's many strengths is its extensibility.

We will take a look at how we can extend the available activities with a custom one.

Creating a custom activity typically involves the following steps:

1. Create a new class that implements `IActivity`. The easiest way to do this is by deriving your class from `Activity`.
1. Optionally annotate your class with `ActivityAttribute` or one of its derived versions `ActionAttribute` or `TriggerAttribute`. 
1. Annotate its properties (if any) with `ActivityPropertyAttribute` attributes to influence their representation in the workflow designer.
1. Implement/override the `OnExecute/OnExecuteAsync` method and if necessary the `OnResume/OnResumeAsync` methods in case you are developing a blocking activity. 
1. Register your activity class with the service container using the `AddActivity<T>` or `AddActivitiesFrom<T>` extension methods.
1. Advanced: If your activity represents a trigger, implement auxiliary code that triggers the workflow.

Let's see an example.

## Hello World Activity

The following is a simple activity that write the text `Hello World` to standard out:

```c#
public class SayHelloWorld : Activity
{
    protected override IActivityExecutionResult OnExecute()
    {
        Console.WriteLine("Hello World!");
        
        return Done();
    }
}
```

The activity does two things:

1. Perform some work (writing some text to the console).
1. Return an `IActivityExecutionResult` - an `OutcomeResult` in this example.

## Registering Activities

To make your activity available for use, it needs to be registered with the DI service container:

```c#
services.AddActivity<SayHelloWorld>();
```

Alternatively, you can register all activities from an assembly using the following extension method:

```c#
services.AddActivitiesFrom<TMarkerType>(); // TMarkerType is any type in the assembly from which you want to find and register activities.
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

If you need to make asynchronous invocations from your activity, override the `OnExecuteAsync` method instead of `OnExecute`:

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
* **Category**: Controls in what tab the property is displayed on the designer. If not specified, properties are displayed in the **Properties** tab.
* **DefaultSyntax**: Controls what syntax is used for this property by default. Defaults to `"Literal"`.
* **SupportedSyntaxes**: Controls what syntaxes are available to use when specifying a value for this property through the activity editor.
* **UIHint**: Controls what type of input control to use to present to the user on the activity editor for this property. When unspecified, Elsa tries to select the most appropriate one given the property type.  
* **Options**: Controls options that are specific to the selected `UIHint` property of the attribute.

## Activity Picker

The Activity Picker used when designing workflows will be configured with all available activities that are registered with the DI service container. It will use the activity class name as the display name and no description.
In order to provide a custom display name and description, annotate your activity class with `ActivityAttribute`. For example:

```c#
[Activity(
    Category = "Demo",
    DisplayName = "Write Line",
    Description = "Write text to standard out.",
    Outcomes = new[] { OutcomeNames.Done }
)]
public class WriteLine : Activity
{   
...
}
```

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