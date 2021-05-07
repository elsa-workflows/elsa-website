---
id: extensibility-expression-evaluators
title: Custom Expression Evaluators
sidebar_label: Expression Evaluators
---

Besides **JavaScript** and **Liquid**, you can implement your own workflow expression evaluator.

## IExpressionEvaluator

To implement your own evaluator, simply implement `IExpressionEvaluator`:

```c#
public interface IExpressionEvaluator
{
    string Syntax { get; }
    Task<object> EvaluateAsync(string expression, Type type, WorkflowExecutionContext workflowExecutionContext, CancellationToken cancellationToken);
}
```

The `Syntax` property represents a moniker for the syntax you implement. For example, the `JavaScriptExpressionEvaluator` returns `"JavaScript"`, while `LiquidExpressionEvaluator` returns `"Liquid"`.
When the user configures a workflow expression, they will select one of the available syntaxes.
 
Your evaluator should be able to evaluate the specified expression, and if specified, convert the result to the specified `type`.

This allows you to implement evaluators that can handle anything you like, such as C#, VBScript, Python and Ruby to name just a few.

## Service Registration

To register your custom evaluator, use the `TryAddProvider<T>` extension method:

```c#
services.TryAddProvider<IExpressionEvaluator, MyCustomExpressionEvaluator>(ServiceLifetime.Scoped);
```

`TryAddProvider<T>` is like `TryAddScoped<T>`, except that it does allow multiple `IExpressionEvaluator` registrations as long as the implementation type is different.