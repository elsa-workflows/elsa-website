---
id: elsa-1-installing-elsa-core
title: Installing Elsa Core 
sidebar_label: Core
---

The **Elsa.Core** NuGet package provides APIs to build and execute workflows. In this section, we'll see how to install the package into a .NET project and register the appropriate services with the DI container.

## Add Package

```bash
dotnet add package Elsa
```

## Register Services

To add Elsa services to your application, add the following code to `Startup.cs`:

```csharp
public void ConfigureServices(IServiceCollection services)
{
    services.AddElsa();
}
```

You can now resolve workflow services to build, load and execute workflows.

See the [Guides](./guides-hello-world-console.md) section for various examples.