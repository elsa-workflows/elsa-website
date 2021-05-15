---
id: installing-persistence
title: Elsa Persistence Providers
sidebar_label: Persistence
---

By default, in-memory stores are registered with the DI service container.
But, to make sure your workflows are stored in a more permanent fashion, you will want to add one of the available **persistence providers**.

## Persistence Providers

Elsa has abstracted away its data access logic, enabling the persistence layer to be pluggable.
Out of the box, Elsa currently ships with the following providers:

* [Entity Framework Core](https://docs.microsoft.com/en-us/ef/core/)
* [MongoDB](https://www.mongodb.com/)
* [YesSQL](https://github.com/sebastienros/yessql/blob/dev/README.md)

## Example using Entity Framework Core
For example, to use the [Entity Framework Core](https://docs.microsoft.com/en-us/ef/core/) persistence provider and Sqlite as the database engine, add the following packages:

```bash
dotnet add package Elsa
dotnet add package Elsa.Persistence.EntityFramework
dotnet add package Elsa.Persistence.EntityFramework.Sqlite
```

When installed, update your `Startup` class as follows to configure Elsa to use the EF Core provider with SQLite:

```csharp
public void ConfigureServices(IServiceCollection services)
{
    services.AddElsa(options => options.UseEntityFrameworkPersistence(ef => ef.UseSqlite()));
}
```

By default, Elsa will use the following connection string when using SQLite: `"Data Source=elsa.sqlite.db;Cache=Shared;"`.
You can override this by importing the `Microsoft.EntityFrameworkCore` namespace to make available the default `UseSqlite()` extension method that accepts a connection string. Example:

```csharp
...
using Microsoft.EntityFrameworkCore;

public void ConfigureServices(IServiceCollection services)
{
    services.AddElsa(options => options.UseEntityFrameworkPersistence(ef => ef.UseSqlite("Data Source=my-db-name.db;Cache=Shared;")));
}
```

> You can find an [example using Entity Framework Core](https://github.com/elsa-workflows/elsa-core/blob/master/src/samples/persistence/Elsa.Samples.Persistence.EntityFramework/Program.cs#L21) and [YesSQL](https://github.com/elsa-workflows/elsa-core/blob/master/src/samples/persistence/Elsa.Samples.Persistence.YesSql/Program.cs) in the samples folder on GitHub as well.

### EF Core Migrations

The EF Core provider for Elsa ships with migrations that you can run either manually or automatically (the default for pooled db contexts).

> Auto-running migrations is convenient to get up and running quickly, but in real world production apps, it is recommend that you maintain your own migrations instead so that you are in control over what happens to the DB schemas.

You can control whether or not to execute migrations automatically using a second parameter on `UseEntityFrameworkPersistence` called `autoRunMigrations`. For example:

```c#
// Run migrations automatically:
services.AddElsa(options => options.UseEntityFrameworkPersistence(ef => ef.UseSqlite(), true));

// Disable auto-migrations:
services.AddElsa(options => options.UseEntityFrameworkPersistence(ef => ef.UseSqlite(), false));
```

Elsa ships with migrations for:

* MySql
* PostgreSql
* Sqlite
* SqlServer

Each set of migrations are stored in a separate package. For example, the migrations for PostgreSql are stored in the `Elsa.Persistence.EntityFramework.PostgreSql` package.

### Running Migrations Manually

To run the existing migrations provided by Elsa manually, you will need to create a class that implements `IDesignTimeDbContextFactory<ElsaContext>` in your startup project or another executable project (e.g. a console application) in order to be able to use the `dotnet ef database update` command. 

Follow these steps to apply the migrations on a new *Sqlite* database for example:

1. Add the `Microsoft.EntityFrameworkCore.Design` package to your startup project.
2. Add `Elsa.Persistence.EntityFramework.Core`
3. Create a class called e.g. `SqliteElsaContextFactory` (implementation below).
4. Run the following command: `dotnet ef database update -- ConnectionStrings:Elsa="Data Source=elsa.sqlite.db;Cache=Shared;"`

The `SqliteElsaContextFactory` class looks like this:

```c#
using System.IO;
using Elsa.Persistence.EntityFramework.Core;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace WebApplication1.Data
{
    public class SqliteElsaContextFactory : IDesignTimeDbContextFactory<ElsaContext>
    {
        public ElsaContext CreateDbContext(string[] args)
        {
            var configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddCommandLine(args)
                .Build();

            var dbContextBuilder = new DbContextOptionsBuilder();
            var connectionString = configuration.GetConnectionString("Elsa");

            dbContextBuilder.UseSqlite(connectionString, sqlite => sqlite.MigrationsAssembly(typeof(Elsa.Persistence.EntityFramework.Sqlite.SqliteElsaContextFactory).Assembly.FullName));

            return new ElsaContext(dbContextBuilder.Options);
        }
    }
}
```

Notice that the factory accepts command-line arguments, which conveniently allows us to invoke the `dotnet ef database update` command by passing in arguments that get parsed into a `Configuration` object, making it convenient from the factory class to access the specified connection string.

## Custom Providers

If none of the providers meet your need, you can always implement your own. Look at the source code of [one of the existing providers](https://github.com/elsa-workflows/elsa-core/tree/master/src/persistence) for an existing example.
