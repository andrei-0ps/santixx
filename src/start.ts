import { createMiddleware, createStart } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";

import { securityHeaders } from "@/lib/security/headers";

const securityHeadersMiddleware = createMiddleware().server(async ({ next }) => {
  for (const [name, value] of Object.entries(securityHeaders)) {
    setResponseHeader(name as Parameters<typeof setResponseHeader>[0], value);
  }
  return next();
});

export const startInstance = createStart(() => ({
  requestMiddleware: [securityHeadersMiddleware],
}));
