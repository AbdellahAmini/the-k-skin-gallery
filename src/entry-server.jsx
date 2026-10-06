import React from 'react';
import { PassThrough } from 'node:stream';
import { renderToPipeableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import App from './App.jsx';
import { prefetchRoute } from './lib/route-prefetch.js';

export async function render(url, initialData) {
  await prefetchRoute(url.split('?')[0]);
  return new Promise((resolve, reject) => {
    let html = '';
    const output = new PassThrough();
    output.on('data', (chunk) => { html += chunk; });
    output.on('end', () => resolve(html));
    const stream = renderToPipeableStream(
      <StaticRouter location={url}>
        <App initialData={initialData} />
      </StaticRouter>,
      { onAllReady: () => stream.pipe(output), onShellError: reject, onError: reject },
    );
  });
}
