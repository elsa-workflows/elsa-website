---
id: installation
title: Installation
sidebar_label: Installation
---

This section explains how to add workflow functionality to your .NET project, how to install the dashboard and how to install the re-hostable workflow designer.  

## Installing the .NET Standard Libraries

The core library provides APIs to build and execute workflows. In this section, we'll see how to install the package into a .NET project and register the appropriate services with the DI container.

### Adding the Preview Feed
Elsa is currently only available from [MyGet](https://www.myget.org/feed/Packages/elsa), which means you need to add the following package feed source to your project:

`https://www.myget.org/F/elsa/api/v3/index.json`

The easiest way to do that is by adding a `NuGet.config` file to the root of your project/solution folder:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
    <packageSources>
        <add key="Elsa Preview Feed" value="https://www.myget.org/F/elsa/api/v3/index.json" />
    </packageSources>
</configuration>
```

### Adding the Elsa.Core Package

With the preview feed in place, run the following command.

```bash
dotnet add package Elsa.Core
```

### Adding Elsa Services

To add Elsa services to your application, add the following code to `Startup.cs`:

```csharp
public void ConfigureServices(IServiceCollection services)
{
    services.AddWorkflows();
}
```

## Installing the ASP.NET Core Dashboard Middleware.