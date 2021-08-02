---
id: version-1.0.0-extensibility-persistence
title: Custom Persistence Providers
sidebar_label: Persistence
original_id: extensibility-persistence
---

Elsa comes with a number of persistence providers, such as MongoDB, EntityFramework and CosmosDB. But if none of these meet your need, you can implement one yourself.

## Workflow Definition and Workflow Instance Stores

When implementing a custom persistence provider, you can choose to implement a custom provider for **workflow definitions**, **workflow instances**, or both.
This allows applications to retrieve workflow definitions from file storage for example, while persisting workflow instances to a database.

## Workflow Definition Store

To implement a custom workflow definition persistence provider, implement `IWorkflowDefinitionStore`:

```c#
public interface IWorkflowDefinitionStore
{
    Task<WorkflowDefinitionVersion> SaveAsync(WorkflowDefinitionVersion definition, CancellationToken cancellationToken = default);
    Task AddAsync(WorkflowDefinitionVersion definition, CancellationToken cancellationToken = default);
    Task<WorkflowDefinitionVersion> GetByIdAsync(string id, VersionOptions version, CancellationToken cancellationToken = default);
    Task<IEnumerable<WorkflowDefinitionVersion>> ListAsync(VersionOptions version, CancellationToken cancellationToken = default);
    Task<WorkflowDefinitionVersion> UpdateAsync(WorkflowDefinitionVersion definition, CancellationToken cancellationToken = default);
    Task<int> DeleteAsync(string id, CancellationToken cancellationToken = default);
}
```

### Version Options

Workflow definitions are versioned, and `IWorkflowDefinitionStore` allows consumers to specify what version of a workflow definition should be loaded.
To help implement this filter, the `Elsa.Core` package comes with an extension method on `IQueryable<WorkflowDefinitionVersion>` called `WithVersion`. The `WithVersion` method looks like this:

```c#
public static IQueryable<WorkflowDefinitionVersion> WithVersion(
    this IQueryable<WorkflowDefinitionVersion> query,
    VersionOptions version)
{

    if (version.IsDraft)
        query = query.Where(x => !x.IsPublished);
    else if (version.IsLatest)
        query = query.Where(x => x.IsLatest);
    else if (version.IsPublished)
        query = query.Where(x => x.IsPublished);
    else if (version.IsLatestOrPublished)
        query = query.Where(x => x.IsPublished || x.IsLatest);
    else if (version.AllVersions)
    {
        // Nothing to filter.
    }
    else if (version.Version > 0)
        query = query.Where(x => x.Version == version.Version);

    return query.OrderByDescending(x => x.Version);
}
```

If your persistence provider does not expose an `IQueryable<WorkflowDefinition>` interface for you to build your query, then use the `WithVersion` method as a reference implementation.
For example, the CosmosDB provider implementation uses an intermediary model to represent workflow definition documents, so that provider has is own `WithVersion<WorkflowDefinitionDocument>` extension method.

## Workflow Instance Store

To implement a custom workflow instance persistence provider, implement `IWorkflowInstanceStore`:

```c#
public interface IWorkflowInstanceStore
{   
    Task SaveAsync(WorkflowInstance instance, CancellationToken cancellationToken = default);
    Task<WorkflowInstance> GetByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<WorkflowInstance> GetByCorrelationIdAsync(string correlationId, CancellationToken cancellationToken = default);
    Task<IEnumerable<WorkflowInstance>> ListByDefinitionAsync(string definitionId, CancellationToken cancellationToken = default);
    Task<IEnumerable<WorkflowInstance>> ListAllAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<(WorkflowInstance, ActivityInstance)>> ListByBlockingActivityAsync(string activityType, string correlationId = default, CancellationToken cancellationToken = default);
    Task<IEnumerable<WorkflowInstance>> ListByStatusAsync(string definitionId, WorkflowStatus status, CancellationToken cancellationToken = default);
    Task<IEnumerable<WorkflowInstance>> ListByStatusAsync(WorkflowStatus status, CancellationToken cancellationToken = default);
    Task DeleteAsync(string id, CancellationToken cancellationToken = default);
}
```

## Service Registration

In order to use the custom persistence providers, they need to be registered with the IoC service container. The recommended way to do this is by implementing an extension method on `ElsaBuilder`. Doing so ensures that Elsa has a chance to register any missing services after inspecting the `ElsaBuilder`.
For example, if Elsa services are registered without specifying any persistence providers, it will register the memory persistence providers.

The following is a simplified version of the MongoDB persistence provider extension method implementation:

```c#
public static class ServiceCollectionExtensions
{
    public static MongoElsaBuilder AddMongoDbProvider(
        this ElsaBuilder elsaBuilder,
        IConfiguration configuration,
        string databaseName,
        string connectionStringName
    )
    {
        elsaBuilder.Services
            .AddSingleton(sp => CreateDbClient(configuration, connectionStringName))
            .AddSingleton(sp => CreateDatabase(sp, databaseName));
    
        return new MongoElsaBuilder(elsaBuilder.Services);
    }
    
    public static MongoElsaBuilder AddMongoDbStores(
        this ElsaBuilder elsaBuilder,
        IConfiguration configuration,
        string databaseName,
        string connectionStringName)
    {
        return elsaBuilder
            .AddMongoDbProvider(configuration, databaseName, connectionStringName)
            .AddMongoDbWorkflowDefinitionStore()
            .AddMongoDbWorkflowInstanceStore();
    }
    
    public static MongoElsaBuilder AddMongoDbWorkflowInstanceStore(
        this MongoElsaBuilder configuration)
    {
        configuration.Services
            .AddMongoDbCollection<WorkflowInstance>("WorkflowInstances")
            .AddScoped<IWorkflowInstanceStore, MongoWorkflowInstanceStore>();
    
        return configuration;
    }
    
    public static MongoElsaBuilder AddMongoDbWorkflowDefinitionStore(
        this MongoElsaBuilder configuration)
    {
        configuration.Services
            .AddMongoDbCollection<WorkflowDefinitionVersion>("WorkflowDefinitions")
            .AddScoped<IWorkflowDefinitionStore, MongoWorkflowDefinitionStore>();
    
        return configuration;
    }
}
```

The class comes with 4 extensions:

1. AddMongoDbProvider
2. AddMongoDbStores
3. AddMongoDbWorkflowInstanceStore
4. AddMongoDbWorkflowDefinitionStore

The `AddMongoDbWorkflowInstanceStore` and `AddMongoDbWorkflowDefinitionStore` allow you to register just a workflow definition store or a workflow instance store individually.

However, they both require a MongoDB Client and Database service to be registered. To enforce this, these two extensions are not defined on `ElsaBuilder`, but rather on the a custom `MongoElsaBuilder` class.
This conveniently requires you to first call `AddMongoDbProvider` taking in MongoDB-specific connection parameters. It returns a `MongoElsaBuilder` instance, which then allows you to either register the workflow definition store, workflow instance store, or both.

The `AddMongoDbStores` extension is a convenience function that wraps `AddMongoDbProvider`, `AddMongoDbWorkflowInstanceStore` and `AddMongoDbWorkflowDefinitionStore`.

This pattern isn't mandatory, but recommended to provide a consistent persistence provider service registration story.  