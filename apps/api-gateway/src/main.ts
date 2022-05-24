type HTTPMethod =
  | 'ANY'
  | 'DELETE'
  | 'GET'
  | 'HEAD'
  | 'OPTIONS'
  | 'PATCH'
  | 'PUT';

interface Resource {
  path: string;
  method?: Method;
  children?: Resource[];
}

interface Method {
  httpMethod: HTTPMethod;
  endpointURL: string;
  isProxy: boolean;
}

interface Route {
  path: string;
  httpMethod: HTTPMethod;
  endpointURL: string;
  isProxy: boolean;
}

import * as config from './config.json';
import * as express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const resources: Resource[] = config.resources as Resource[];
const allRoutes: Route[] = [];

for (const resource of resources) {
  updateRoutes(resource);
}

function updateRoutes(resource: Resource, lastPath = '/') {
  lastPath += `${resource.path}/`;
  if (
    (!resource.children || resource.children.length === 0) &&
    resource.method
  ) {
    allRoutes.push({
      path: lastPath,
      ...resource.method,
    });
  }

  if (!resource.children) {
    return;
  }

  for (const resourceChild of resource.children) {
    updateRoutes(resourceChild, lastPath);
  }
}

const proxiesRoutes = allRoutes.filter((route) => route.isProxy);

const app = express();

proxiesRoutes.forEach((proxyRoute) => {
  app.use(
    proxyRoute.path,
    createProxyMiddleware({
      target: proxyRoute.endpointURL,
      changeOrigin: true,
    })
  );
});

const port = +(process.env['SERVER_PORT'] || 8080);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
