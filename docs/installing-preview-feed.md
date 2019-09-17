---
id: installing-preview-feed
title: Installing the MyGet Preview Feed
sidebar_label: Preview Feed 
---

Elsa is currently only available from [MyGet](https://www.myget.org/feed/Packages/elsa). In order to install Elsa packages, add the following package feed to your project:

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