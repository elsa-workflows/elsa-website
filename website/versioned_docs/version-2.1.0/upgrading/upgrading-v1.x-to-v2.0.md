---
id: version-2.1.0-upgrading-v1.x-to-v2.0
title: Upgrading 1.x to 2.0
sidebar_label: 1.x to 2.0
original_id: upgrading-v1.x-to-v2.0
---

Elsa 2 contains many breaking changes compared with Elsa 1.
This document tries to capture the most important changes. If you encounter anything that is missing here, please [submit an issue](https://github.com/elsa-workflows/elsa-website/issues/new) or [submit a PR](https://github.com/elsa-workflows/elsa-core/pulls). Thanks!

> For an overview of what's new in Elsa 2, checkout this [blog post](https://sipkeschoorstra.medium.com/whats-new-in-elsa-2-0-ea7410b65eea).

## Upgrading

When upgrading from v1 to v2, it is recommended to create a new project instead of updating the packages.
Workflows and its related models in v2 are vastly different and are not compatible with what you may have in your v1 database.

By setting up a new project, you will be able to manually recreate the workflows.

## API Changes

As you recreate your workflows, you will need to copy your custom activities into the new project. When you do, you will have to update each activity's code so that it compiles again.
Here are the most important changes when writing activities in v2.

### Activity

In v1, you decorate activity classes with `ActivityDefinition`.
This has changed in v2 to `ActivityAttribute` or one of its derivatives such as `ActionAttribute`, `TriggerAttribute` and `JobAttribute`.

For activities that perform an action, use the `ActionAtribute` or `ActivityAttribute` and setting its `Traits` property to `ActivityTraits.Action`.

For blocking activities that represent a trigger, use the `TriggerAtribute` or `ActivityAttribute` and setting its `Traits` property to `ActivityTraits.Trigger`.

For activities that represent a job that perform an action and then awaits the result (causing the workflow to get suspended), use the `JobAtribute` or `ActivityAttribute` and setting its `Traits` property to `ActivityTraits.Job`.

#### Activity Icon

In Elsa 2, you no longer specify an icon anymore. This should now be done in the client app by implementing a [designer plugin](#todo) (not yet documented).

#### Activity Runtime Description

As is the case with the icon property, the `RuntimeDescription` property is gone as well and should instead be controlled from the client app by implementing a [designer plugin](#todo) (not yet documented). 

### Activity Properties

In v1, you decorate activity properties with the `ActivityPropertyAttribute`.
In v2, this has changed to `ActivityInputAttribute` and has a different set of properties to control various aspects when displayed in the Activity Editor UI.

In v1, you use the `Type` property to control what input UI would be displayed.
In v2, use the `UIHint` property and any value provided in the `ActivityInputUIHints` static class.

In v1, you had to use `GetState` and `SetState` calls when implementing property setters and getters.
In v2, you no longer need to do this (except when implementing [Composite Activities](guides/guides-composite-activities)).

For example, the following is a valid activity property:

```csharp
[ActivityInput(Hint = "The text to write.", UIHint = ActivityInputUIHints.SignleLine)]
public string? Text { get; set; }
```

### Activity Output

In v1, an activity provides output using the `Output` object.

In v2, an activity provides output by exposing a public property that is marked with the `ActivityOutput` attribute.

Furthermore, if that property is named `Output`, it is automatically sent as **input** into the next activity to execute. 

#### LastResult

In V2, `context.CurrentScope.LastResult` and the `lastResult()` JS function have been removed.
Instead, you now use the `input` JS variable to access the output of the last executed activity.

### Workflow Execution

In v1, the service to execute a workflow is `IWorkflowInvoker`.

In v2, the service to execute workflow is `IWorkflowRunner` and works similarly.

However, `IWorkflowRunner` does not have any **trigger** methods. These have been moved into a newer, high-level service called the `IWorkflowLaunchpad`.

The workflow launchpad service takes care of selecting the right workflows to execute. It allows you to collect workflows to execute as well as to execute them directly.
Besides executing workflows directly, they can als be dispatched using `IWorkflowDispatcher`.

When you dispatch a workflow for execution, it gets executed asynchronously in the background. The default implementation sends a message to a queue, which gets processed in the background using [Rebus](https://github.com/rebus-org/Rebus).

### Expressions

In v1, you would type your activity properties as e.g. `IWorkflowExpression<string>` in order to allow the user to provide an expression that, when evaluated at runtime, would return the actual value to use.

This has changed in v2, where you directly specify the final type of the property (e.g. `string`) and no longer evaluate this yourself. This is now a concern of the workflow engine itself. This means that when your activity executes, any expression associated with your activity property will already have been evaluated.

You can control what expressions are supported using `ActivityInputAttribute` by specifying the `DefaultSyntax` and `SupportedSyntaxes` properties.

For example:

```csharp
[ActivityInput(Hint = "The text to write.", DefaultSyntax = SyntaxNames.Literal, SupportedSyntaxes = new[]{ SyntaxNames.JavaScript, SyntaxNames.Liquid })]
public string? Text { get; set; }
```

With that in place, the user will be able to enter a literal string value in some text field, or switch to code and start typing JavaScript or Liquid expressions.


> **MISSING ANYTHING?**
>
> Please [let us know](https://github.com/elsa-workflows/elsa-website/issues/new)!