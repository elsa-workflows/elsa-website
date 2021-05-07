---
id: version-1.0.0-expressions-liquid
title: Liquid Expressions
sidebar_label: Liquid
original_id: expressions-liquid
---

The following Liquid expressions are supported:

## Variables

To access a workflow variable, use the following syntax:

Variable name: "Foo"

Variable value: "Bar"

Expression: `Hello {{ Variables.Foo }}`

Result: `Hello Bar`

## Input

Similar to accessing workflow variables, workflow input values can be accessed using the following syntax:

`Hello {{ Input.Foo }}`

## Activities

To access a named activity's output, use the following syntax:

`Hello {{ Activities.SomeActivityName.SomeOutputName }}`

## HTTP Functions

### signal_url
Generates a fully-qualified absolute signal URL that will trigger the workflow instance from which this function is invoked.

```
{{ 'MySignal' | signal_url }}
```