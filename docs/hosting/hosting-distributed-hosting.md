---
id: hosting-distributed-hosting
title: Hosting Elsa on Multiple Nodes
sidebar_label: Distributed Hosting
---

Hosting Elsa in a multi-node environment is 100% supported and can significantly increase throughput and of course offers redundancy in case once node goes down. 

## Distributed Setup

To make sure Elsa operates well in such an environment, there are three aspects to configure:

1. Service Bus Broker
2. Distributed Lock Provider
3. Distributed Cache Signal Provider

### Service Bus Broker

Elsa uses [Rebus](https://github.com/rebus-org/Rebus) for sending messages via service bus brokers.
Out of the box, it uses a memory provider.

The memory provider is suitable for a single-node setup, but when hosting in a cluster we need to configure an actual message broker such as [RabbitMQ](https://github.com/rebus-org/Rebus.RabbitMq) or [Azure Service Bus](https://github.com/rebus-org/Rebus.AzureServiceBus).

One of the most important reasons of running multiple Elsa nodes besides redundancy is to increase throughput. The more nodes you have, the quicker workflow instruction messages (which are posted to a queue) are processed.

The following code snippet demonstrates configuring Elsa to use RabbitMQ as the broker for Rebus:

```c#
services.AddElsa(elsa => elsa.UseRabbitMq("amqp://localhost:5672");
```

> Make sure to add the `Elsa.Rebus.RabbitMq` package and import the `Elsa.Rebus.RabbitMq` namespace.

Elsa currently ships with support for RabbitMq and Azure Service Bus packages for Rebus, but any provider supported by Rebus is also supported by Elsa. The packages mentioned here are there for convenience, but if you wanted to use Rebus' [Rebus.GoogleCloudPubSub](https://github.com/rebus-org/Rebus.GoogleCloudPubSub) for example, you can add that package directly and configure it as follows:

```c#
services.AddElsa(elsa => elsa.UseServiceBus(context => context.Configurer.Transport(t => t.UsePubSub(context.QueueName)));
```

### Distributed Lock Provider

Elsa uses [DistributedLock](https://github.com/madelson/DistributedLock) to ensure thant only one thread can work on a workflow instance. By default, the [FileSystem](https://github.com/madelson/DistributedLock/blob/master/docs/DistributedLock.FileSystem.md) lock is used, which ensures that no matter how many threads try to load a workflow instance from the store, only one of them will be able to do so at a time until the lock is released.
When multiple threads try to acquire a lock on a given workflow instance, only the first one will succeed. Subsequent threads will simply wait until the lock is released.

When you run multiple Elsa nodes, it is important to configure a distributed lock provider that can access a shared resource.

If you are using SQL Server to store Elsa workflows, you might consider using the [SqlServer](https://github.com/madelson/DistributedLock/blob/master/docs/DistributedLock.SqlServer.md) provider.
And if you are already using [Redis](https://github.com/madelson/DistributedLock/blob/master/docs/DistributedLock.Redis.md) or [Azure](https://github.com/madelson/DistributedLock/blob/master/docs/DistributedLock.Azure.md), you can use any of those providers as well.

The following snippet shows how to configure Elsa with the SqlServer distributed lock provider:

```c#
services.AddElsa(elsa => elsa.ConfigureDistributedLockProvider(options => options.UseSqlServerLockProvider("Server=localhost;Database=Elsa;Integrated Security=True;")));
```

> Make sure to add the the `Elsa.DistributedLocking.SqlServer` package.

Elsa currently ships with support for SqlServer and Azure Blob Storage, but any provider supported by DistributedLock can be used. To use the [Redis](https://github.com/madelson/DistributedLock/blob/master/docs/DistributedLock.Redis.md) provider for example, you can configure Elsa to use it as follows:

```c#
services.AddRedis("localhost:6379,abortConnect=false"); // Provided by the Elsa.Providers.Redis package. This is optional; you are free to construct your own connection multiplexer from the following factory code.

services.AddElsa(elsa => elsa.ConfigureDistributedLockProvider(options => options.UseProviderFactory(sp => name =>
{
    var connection = sp.GetRequiredService<IConnectionMultiplexer>(); // `services.AddRedis` registers an `IConnectionMultiplexer` as a singleton. 
    return new RedisDistributedLock(name, connection.GetDatabase());
})));
```

### Distributed Cache Signal Provider

Elsa uses a local memory cache to store things like [Workflow Blueprints](#). However, when using a local memory cache in a multi-node environment, the caches need to be synchronized to avoid caches from becoming stale.

When one is dealing with just one node, invalidating local cache entries is easy, because we can listen for domain events to know when it is time to evict a cache entry.

For example, whenever you make changes to a workflow definition, Elsa publishes a domain event called `WorkflowDefinitionSaved`, which is handled by the `CachingWorkflowRegistry` decorator type and clears the cache using a service called `ICacheSignal`.

#### ICacheSignal

`ICacheSignal` is a relatively simple service that produces [IChangeToken](https://docs.microsoft.com/en-us/dotnet/api/microsoft.extensions.primitives.ichangetoken) objects that are used by [IMemoryCache](https://docs.microsoft.com/en-us/aspnet/core/performance/caching/memory).
Other parts of Elsa can then **trigger** a signal that is being observed by the cache in order to invalidate that cache entry.

The default implementation of `ICacheSignal` then triggers these tokens when you call `TriggerToken`.

Elsa provides two additional implementations of `ICacheSignal`, which are:

* RebusCacheSignal
* RedisCacheSignal

#### RebusCacheSignal

This implementation uses Elsa's Rebus configuration to **publish a message to all nodes in the cluster**.
Each node receiving this message will then trigger the appropriate change token.

For this to work, you need to configure Rebus with a message broker other than the default memory provider as described in the [Service Bus Broker](#service-bus-broker) section.

The following snippet demonstrates enabling the Rebus provider:

```c#
services.AddElsa(elsa => elsa.UseRebusCacheSignal());
```

No further configuration is necessary since you will already have configured Rebus itself. 

#### RedisCacheSignal

This implementation uses Redis' pub/sub mechanism to publish and subscribe to messages and can be enabled as follows:

```c#
services.AddElsa(elsa => elsa.UseRedisCacheSignal());
```

Similar to setting up Redis as the [Distributed Lock Provider](#distributed-lock-provider), you need to register a Redis Connection Multiplexer as a singleton, which can be done with this call:

```c#
services.AddRedis("localhost:6379,abortConnect=false"); // Provided by the Elsa.Providers.Redis package.
```

## Background Information

What follows is some more background information about why we need the additional configuration described previously.

To support a multi-node setup, there are a few key aspects to accomodate for, which are:

* Background timer events (`Timer`, `Cron`, `StartAt`)
* Workflow concurrency
* Local memory cache (`WorkflowRegistry`)

### Background Timer Events

Background timer events are basically background jobs executed by services such as Quartz.NET and Hangfire.
These background jobs execute in the background whenever it is time to start or resume a workflow.

The key thing to understand here is that these background jobs execute **on each node in the cluster**.
By default (i.e. without configuring Elsa for a multi-node hosting environment), this will mean that if you for example have a workflow with a **Timer** activity, this workflow will execute on each node. Depending on your workflow specifics, this may or may not be problematic.

### Workflow Concurrency

However, in order to avoid concurrency issues with workflow execution, it is crucial that only one node operates on a specific workflow instance at a time.

> To avoid any confusion, it is perfectly fine and even desirable that a given node operates on many workflow instances simultaneously.
> But the opposite is true for the other way around: it is bad for many nodes to operate on the same workflow at the same time.

Elsa ensures the execution of only one workflow on one node at a given time by employing a technique called [Distributed Locking](https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html).

By default, Elsa uses a file-based primitive to acquire a distributed lock. Although this works fine when hosting multiple application instances on the same machine, it will not work when hosting Elsa in multiple Docker containers for instance.

For that, we need access to a shared resource such as a database, Redis server or a blob in the cloud.

### Local Memory Cache

To optimize performance, Elsa employs caching of certain objects such as [Workflow Blueprints]().
However, imagine you have 3 instances of Elsa Server running behind some load balancer and a separate Elsa Dashboard application that communicates with the cluster through the load balancer.

When you make a change to a workflow definition, this change will be posted to Elsa Server. This HTTP request may end up being handled by any of the 3 nodes in the cluster, and only that node will now have an updated cache.
The two other nodes will now have an outdated cache.

In order to mitigate this issue, we can do one of two things:

1. Implement a distributed cache (using e.g. Redis), or:
2. Implement distributed cache signaling.

Elsa employs the second technique: distributed cache signaling. The advantage of that is performance. Updates made to workflow definitions occur far less often than reading workflow blueprints from the workflow registry, so it makes sense to optimize for that scenario.

Local caches perform much better than distributed caches, because objects are stored in-memory, while distributed caches such as Redis are stored out of process, possibly on a different server which requires network roundtrips.

> An advantage of a distributed cache such as Redis however is that one might store much more information compared to a Docker container for example.
> Elsa does not support storing workflow blueprints in a distributed cache such as Redis because workflow blueprints aren't serializable.

