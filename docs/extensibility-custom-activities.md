---
id: extensibility-custom-activities
title: Writing Custom Activities
sidebar_label: Custom Activities
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
Notice that you also use `ActivityDefinitionAttribute` to control what outcomes are available on the activity. If not specified, Elsa will assume a default outcome of `Done`.

If your activity however has additional or different possible outcomes (like `True` and `False` in the case of the `IfElse` activity), you must specify these outcomes using `ActivityDefinitionAttribute`.

These outcomes are used by the workflow designer to render the possible outcomes as activity node endpoints from which you can drag connections to other activities on the workflow. 