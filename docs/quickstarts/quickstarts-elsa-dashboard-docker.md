---
id: quickstarts-elsa-dashboard-docker
title: Elsa Dashboard + Docker 
sidebar_label: Elsa Dashboard + Docker
---

If you have [Docker](http://docker.com/) installed and an [Elsa Server running](quickstarts/quickstarts-aspnetcore-server-api-endpoints) at e.g. `https://localhost:11000`, then running the Elsa Dashboard Docker image is the quickest way to run the dashboard:

```bash
docker run -t -i -e ELSA__SERVER__BASEADDRESS='https://localhost:5001' -e ASPNETCORE_ENVIRONMENT='Development' -p 13000:80 elsaworkflows/elsa-dashboard:latest
```

Notice that you can specify the Elsa Server URL by passing in an environment variable called `Elsa__Server__BaseAddress`.
We also instructed Docker to map container port 80 to port 13000, which means that we can now launch a webbrowser and navigate to:

```
http://localhost:13000/
```

Here's what that looks like:

![Elsa Dashboard + Docker](assets/quickstarts/quickstarts-elsa-dashboard-docker-animation-1.gif)