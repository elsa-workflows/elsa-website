---
id: concepts-workflows
title: Workflow Concepts
sidebar_label: Workflows
---

In order to work effectively with Elsa, it's important to understand its terminology.
Below is a list of words that represent important concepts used in Elsa.

## Workflow
A workflow consists of a series of steps called **activities** that are connected to one another.
A workflow maintains all sorts of information, such as the following:

- Which activity is currently executing.
- What variables are set.
- What activities are blocking further execution.

Once an activity is done executing, the workflow checks its outcome and if there's another activity connected to it.
If so, that activity is scheduled for execution.

This goes on until there are either no more activities to execute, or an activity is encountered that instructs the workflow runner to **suspend** the workflow. 

## Activity

An activity is an atomic building block that represents a single executable step on the workflow.
At a bare minimum, an activity implements the `OnExecute` method, which contains the code to execute.

## Starting Activity

An activity which is the starting point of the workflow and does not have any inbound connections. They are the entry points to the workflow. 

## Blocking Activity

When an activity executes, it returns an **activity execution result**, which is somewhat analogous to an MVC/API ActionResult.
There are various possible results that can be returned, but the most commonly used ones are `Done`, `Outcomes` and `Suspend`.

When `Suspend` is returned (as is typically the case with blocking activities), the workflow will enter the **Suspended** state and the activity will be registered as a **blocking activity**.

## Suspended Workflow

Suspended workflows are blocked by one or more blocking activities.
The only way to **resume** such a workflow is to **trigger** it with the name of one of the blocking activities.  

## Connection

A **connection** represents a connection between two activities. This is how the **workflow runner** knows what activities to execute next.
A connection between two activities holds 3 pieces of information:

* The **source** activity ID.
* The **source outcome** name (e.g. `Done`).
* The **target** activity ID.

For each possible outcome of a given activity, a connection can be established from that outcome to another activity.

For example, let's say we have a workflow with three activities called `Activity A`, `Activity B` and `Activity C`.
`Activity A` has 2 outcomes called `Done` and `Failed`, and we wish to connect the `Done` outcome to `Activity B` and `Failed` to `Activity C`.

This means we need the following two connections:

**Connection 1**
- Source: `Activity A`
- Outcome: `Done`
- Destination: `Activity B`

**Connection 2**
- Source: `Activity A`
- Outcome: `Failed`
- Destination: `Activity C`

Visually, this would look like this:

![](assets/concepts/concepts-workflows-figure-1.png)