---
id: expressions-javascript
title: JavaScript Expressions
sidebar_label: JavaScript
---

The following JavaScript expressions are supported:

## Variables

### Workflow Variables

Any [workflow variable](concepts/concepts-workflow-variables.md) can be accessed directly as if they were a global variable.

For example, if the `SetVariable` activity sets a variable called `FirstName` to `'Luke'`, it can be accessed as follows:

```javascript
 `Hello ${FirstName}`
```

Value stored in the variable:

```text
"Hello Luke"
```

This also works when setting variables using the [setVariable](#setvariable) function.
Because ultimately, both the `SetVariable` activity and `setVariable` function use the same API under the cover to set a workflow variable.

### Activity Output (Elsa 2.0)

Any activity might provide some output, which is accessible from any other activity using workflow expressions.
To access an activity's output using a JavaScript expression, you can do so by specifying the **activity name** followed by `.Output`.

For example, if you have an activity named `MyActivity`, you can access its output as follows: `MyActivity.Output`.

If the output is an object, you can access its properties too. For instance, the **HTTP Endpoint** activity returns the HTTP request as its output which is of type [HttpRequestModel](https://github.com/elsa-workflows/elsa-core/blob/master/src/activities/Elsa.Activities.Http/Models/HttpRequestModel.cs).
When you name this activity `"MyHttpEndpoint"`, you can access the HTTP request body like this:

`MyHttpEndpoint.Output.Body`

If you happened to post a JSON document to your HTTP endpoint that looks like this:

```json
{
  "SomeDocument": {
    "Title": "About Elsa Workflows"
  }
}
```

Then you can access the `"Title"` field like this:

`MyHttpEndpoint.Output.Body.SomeDocument.Title`

> If your activity is a direct child of an HTTP Endpoint activity, you can access its output directly via the `input` variable, which will be an instance of `HttpRequestModel`.


### Activity Output (Elsa 2.1)

Any activity might provide some output, which is accessible from any other activity using workflow expressions.
To access an activity's output property called e.g. `Output` using a JavaScript expression, you can do so by specifying `activities`, then the **activity name** followed by `.Output()`.
Notice that you must invoke the property as if it were a method. This is due to the way workflow storage providers work, which are potentially asynchronous in nature (such as Azure Blob Storage).

For example, if you have an activity named `MyActivity`, you can access its output as follows: `activities.MyActivity.Output()`.

If the output is an object, you can access its properties too. For instance, the **HTTP Endpoint** activity returns the HTTP request as its output which is of type [HttpRequestModel](https://github.com/elsa-workflows/elsa-core/blob/master/src/activities/Elsa.Activities.Http/Models/HttpRequestModel.cs).
When you name this activity `"MyHttpEndpoint"`, you can access the HTTP request body like this:

`activities.MyHttpEndpoint.Output().Body`

If you happened to post a JSON document to your HTTP endpoint that looks like this:

```json
{
  "SomeDocument": {
    "Title": "About Elsa Workflows"
  }
}
```

Then you can access the `"Title"` field like this:

`activities.MyHttpEndpoint.Output().Body.SomeDocument.Title`

> If your activity is a direct child of an HTTP Endpoint activity, you can access its output directly via the `input` variable, which will be an instance of `HttpRequestModel`.

#### SendHttpRequest Activity

The output property of the **SendHttpRequest** has two output properties:

```csharp
        [ActivityOutput] public HttpResponseModel? Response { get; set; }
        [ActivityOutput] public object? ResponseContent { get; set; 
```
 
To access an **SendHttpRequest** activity with name `SampleRequest1`'s response content, use `activities.SampleRequest1.ResponseContent()`.

### input

Contains the input value that was received as output from the previously executed activity, if any.

```typescript
input: object?
````

### workflowInstanceId

Contains the workflow instance ID of the currently executing workflow.

```typescript
workflowInstanceId: string
```

### workflowDefinitionId

Contains the workflow definition ID of the currently executing workflow.

```typescript
workflowDefinitionId: string
```

### workflowDefinitionVersion

Contains the workflow definition version of the currently executing workflow.

```typescript
workflowDefinitionVersion: number
```

### correlationId

Contains the correlation ID of the currently executing workflow.

```typescript
correlationId: string?
```

### currentCulture

Contains the current culture.

```typescript
currentCulture: CultureInfo
````

> Currently, this value is always set to `CultureInfo.InvariantCulture`.

### workflowContext

Contains the [workflow context](../concepts/concepts-workflow-context.md) (if any) of the currently executing workflow.

```typescript
workflowContext: object?
````

### currentCulture
Returns the current culture.

```typescript
currentCulture: CultureInfo
```

## Common Functions

### guid

Generates a new GUID value and returns its string representation.

```typescript
guid(): string
```

> This function is a thin wrapper around the following .NET code: `Guid.NewGuid().ToString()`.

### parseGuid

Parses a string into a GUID value.

```typescript
parseGuid(value: string): Guid
```

> This function is a thin wrapper around the following .NET code: `Guid.Parse(value)`.

### setVariable

Sets a workflow variable to the specified value.

```typescript
setVariable(name: string, value: object): void
```

> This function is a thin wrapper around the following .NET code: `activityContext.SetVariable(name, value)`.

### getVariable

Returns a workflow variable with the specified name.

```typescript
getVariable(name: string): object
````

> Instead of using `getVariable(name: string)`, you can access workflow variables directly as described above in the [Workflow Variables](#workflow-variables) section.

> This function is a thin wrapper around the following .NET code: `activityContext.GetVariable(name)`.

### getConfig

Provides access to a .NET configuration value.

```typescript
getConfig(name: string): string
```

As an example, let's say you have the following JSON in `appsettings.json`:

```json
{
  "Elsa": {
    "Smtp": {
      "Host": "localhost",
      "Port": 2525
    }
  }
}
```

You can access the configured `Port` value using the following expression:

```javascript
getConfig("Elsa:Smtp:Port") // returns '2525'
```

> This function is a thin wrapper around the following .NET code: `configuration.GetSection(name).Value` where `configuration` is an instance of `IConfiguration`.

### isNullOrWhiteSpace

Returns `true` if the specified string is null, empty or consists of white space only, `false` otherwise.

```typescript
isNullOrWhiteSpace(value: string): boolean
```

> This function is a thin wrapper around the following .NET code: `string.IsNullOrWhiteSpace(value)`.

### isNullOrEmpty

Returns `true` if the specified string is null or empty, `false` otherwise.

```typescript
isNullOrEmpty(value: string): boolean
```

> This function is a thin wrapper around the following .NET code: `string.IsNullOrEmpty(value)`.

## Workflow Functions

### getWorkflowDefinitionIdByName

Returns the ID of the specified workflow by name. This is useful when for instance you are using the `RunWorkflow` activity, which requires the ID of the workflow definition to run.

```typescript
getWorkflowDefinitionIdByName(name: string): string?
````

### getWorkflowDefinitionIdByTag

Returns the ID of the specified workflow by tag. This is useful when for instance you are using the `RunWorkflow` activity, which requires the ID of the workflow definition to run.

```typescript
getWorkflowDefinitionIdByTag(tag: string): string?
````

## HTTP Functions

### queryString
Returns the value of the specified query string parameter.

```typescript
queryString(name: string): string
``` 

### absoluteUrl
Converts the specified relative path into a fully-qualified absolute URL.

```typescript
absoluteUrl(path: string): string
``` 

### signalUrl
Generates a fully-qualified absolute signal URL that will trigger the workflow instance from which this function is invoked.

```typescript
signalUrl(signal: string): string
``` 

## Date/Time Functions

### instantFromDateTimeUtc

Returns a new `Instant` object from the specified `DateTime` value.

> Make sure that the `DateTime` value's `Kind` property is `DateTimeKind.Utc`.

### currentInstant

Returns the current date/time value in the form of a NodaTime's `Instant` object.

```typescript
currentInstant(): Instant
```

### currentYear
Returns the current year.

```typescript
currentYear(): number
```

### startOfMonth
Returns the start of the month of the specified `instant`.
If no `instant` is specified, the current instant is used.

```typescript
startOfMonth(instant: Instant?): LocalDate;
```

### endOfMonth(instant: Instant?)
Returns the end of the month of the specified `instant`.
If no `instant` is specified, the current instant is used.

```typescript
endOfMonth(instant: Instant?): LocalDate;
```

### startOfPreviousMonth
Returns the start of the previous month of the specified `instant`.
If no `instant` is specified, the current instant is used.

```typescript
startOfPreviousMonth(instant: Instant?): LocalDate;
```

### plus
Adds the specified `Duration` to the specified `Instant` and returns the result.

```typescript
plus(instant: Instant, duration: Duration): Instant
```

### minus
Subtracts the specified `Duration` from the specified `Instant` and returns the result.

```typescript
minus(instant: Instant, duration: Duration): Instant
```

### durationFromDays
Returns a duration constructed from the specified number of days.

```typescript
durationFromDays(days: number): Duration
```

### formatInstant
Formats the specified `Instant` using the specified format `string` and `CultureInfo`.
If no culture info is provided, `CultureInfo.InvariantCulture` is used.

```typescript
formatInstant(instant: Instant, format: string, cultureInfo: CultureInfo?): string
```

### localDateFromInstant
Returns the `LocalDate` portion of the specified `Instant`.

```typescript
localDateFromInstant(instant: Instant): LocalDate
```

### instantFromLocalDate
Creates an `Instant` from the specified `LocalDate` value (start of date).

```typescript
instantFromLocalDate(localDate: LocalDate): Instant
```

## Additional Resources
To extend Elsa with your own functions and variables, see [Extending JavaScript](./extensibility-javascript.md)
