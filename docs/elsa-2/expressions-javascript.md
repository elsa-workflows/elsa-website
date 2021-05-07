---
id: expressions-javascript
title: JavaScript Expressions
sidebar_label: JavaScript
---

The following JavaScript expressions are supported:

## Variables
Any workflow variable can be accessed directly as if they were a global variable.

For example, if the `SetVariable` activity sets a variable called `Foo` to `'Bar'`, it can be accessed as follows:

Expression: `"Hello " + Foo`

Result: `"Hello Bar"`

## Common Functions

### currentCulture
Returns the current culture.

```
currentCulture(): CultureInfo
```

## Workflow Functions

### input
Returns the value of the specified workflow input variable.

```
input(name: string): JToken
```

### variable
Returns the value of the specified workflow variable.
 
```
variable(name: string): JToken
```

> Instead of using `variable()`, you can access workflow variables directly.

### correlationId()
Returns the correlation ID of the workflow instance.

```
correlationId(): string 
````

## HTTP Functions

### queryString
Returns the value of the specified query string parameter.

```
queryString(name: string): string
``` 

### absoluteUrl
Converts the specified relative path into a fully-qualified absolute URL.

```
absoluteUrl(path: string): string
``` 

### signalUrl
Generates a fully-qualified absolute signal URL that will trigger the workflow instance from which this function is invoked.

```
signalUrl(signal: string): string
``` 

## Date/Time Functions

### currentInstant
Returns the current date/time value in the form of a NodaTime's `Instant` object.

```
currentInstant(): Instant
```

### currentYear
Returns the current year.

```
currentYear(): number
```

### startOfMonth
Returns the start of the month of the specified `instant`.
If no `instant` is specified, the current instant is used.

```
startOfMonth(instant: Instant?): LocalDate;
```

### endOfMonth(instant: Instant?)
Returns the end of the month of the specified `instant`.
If no `instant` is specified, the current instant is used.

```
endOfMonth(instant: Instant?): LocalDate;
```

### startOfPreviousMonth
Returns the start of the previous month of the specified `instant`.
If no `instant` is specified, the current instant is used.

```
startOfPreviousMonth(instant: Instant?): LocalDate;
```

### plus
Adds the specified `Duration` to the specified `Instant` and returns the result.

```
plus(instant: Instant, duration: Duration): Instant
```

### minus
Subtracts the specified `Duration` from the specified `Instant` and returns the result.

```
minus(instant: Instant, duration: Duration): Instant
```

### durationFromDays
Returns a duration constructed from the specified number of days.

```
durationFromDays(days: number): Duration
```

### formatInstant
Formats the specified `Instant` using the specified format `string` and `CultureInfo`.
If no culture info is provided, `CultureInfo.InvariantCulture` is used.

```
formatInstant(instant: Instant, format: string, cultureInfo: CultureInfo?): string
```

### localDateFromInstant
Returns the `LocalDate` portion of the specified `Instant`.

```
localDateFromInstant(instant: Instant): LocalDate
```

### instantFromLocalDate
Creates an `Instant` from the specified `LocalDate` value (start of date).

```
instantFromLocalDate(localDate: LocalDate): Instant
```

To extend this list, see [Extending JavaScript](./extensibility-javascript.md)