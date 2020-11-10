---
id: installing-persistence
title: Installing Elsa Persistence Providers
sidebar_label: Persistence
---

By default, only in-memory stores are registered with the DI container. To make sure your workflows are stored in a more permanent fashion, make sure to add one of the **persistence providers**.

## Example using Entity Framework Core
For example, to use the [Entity Framework Core](https://docs.microsoft.com/en-us/ef/core/) persistence provider and Sqlite as the database engine, add the following packages:

```bash
dotnet add package Microsoft.EntityFrameworkCore
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Microsoft.EntityFrameworkCore.Sqlite
dotnet add package Elsa.Persistence.EntityFrameworkCore
```

When installed, update your `Startup` class as follows:

```csharp
public void ConfigureServices(IServiceCollection services)
{
    services
        .AddElsa(elsa => elsa
            .AddEntityFrameworkStores(options => options
                .UseSqlite("Data Source=c:\data\elsa.db;Cache=Shared"));
}
```

This time, your workflow definitions will be persisted even when your application quits.

## Supported Providers

Currently, the following providers are supported:

* Memory
* [Entity Framework Core](https://docs.microsoft.com/en-us/ef/core/)
* [MongoDB](https://www.mongodb.com/)
* [Cosmos DB](https://azure.microsoft.com/en-us/services/cosmos-db/)
* [YesSQL](https://github.com/sebastienros/yessql/blob/dev/README.md)

## Custom Providers

If none of the providers meet your need, you can implement your own. Look at the source code of [one of the existing providers](https://github.com/elsa-workflows/elsa-core/tree/master/src/persistence) for an example.
