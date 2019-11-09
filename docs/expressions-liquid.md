---
id: expressions-liquid
title: Liquid Expressions
sidebar_label: Liquid
---

The following Liquid expressions are supported:

## HTTP Functions

### signal_url
Generates a fully-qualified absolute signal URL that will trigger the workflow instance from which this function is invoked.

```
{{ 'MySignal' | signal_url }}
```