import { renderToReadableStream } from "react-dom/server";
import { ServerRouter, type EntryContext } from "react-router";

/**
 * Build-time only.
 *
 * Habla ships as a static SPA (`ssr: false`), so this never runs in
 * production — React Router calls it once during `pnpm build` to render the
 * `index.html` shell that every route hydrates into. It uses the Web Streams
 * renderer so the build needs no Node-specific server runtime.
 */
export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
) {
  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      signal: request.signal,
      onError(error: unknown) {
        responseStatusCode = 500;
        console.error(error);
      },
    },
  );

  await body.allReady;

  responseHeaders.set("Content-Type", "text/html");
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
