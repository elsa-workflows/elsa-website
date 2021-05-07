---
id: installing-feeds
title: Installing Packages from NuGet and MyGet
sidebar_label: Package Feeds 
---

## NuGet
Elsa (pre)releases on the `master` branch are deployed to [NuGet](https://www.nuget.org/packages/elsa/).


## MyGet
Any commits on the `develop` branch are deployed to [MyGet](https://www.myget.org/feed/packages/elsa).  
In order to install Elsa packages from MyGet, add the following package feed to your project:

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