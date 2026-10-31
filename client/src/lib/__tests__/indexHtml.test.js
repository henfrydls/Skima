import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Every resource the page loads has to come from Skima itself: a stylesheet,
// script or preconnect to another host hands each visitor's IP to that host.
// Links meant to be followed (og:url, og:image) are metadata, not loads.
describe('index.html', () => {
  const html = readFileSync(resolve(__dirname, '../../../index.html'), 'utf8');

  it('loads nothing from another host', () => {
    const loads = [
      ...html.matchAll(/<link\b[^>]*\bhref="(https?:)?\/\/[^"]*"[^>]*>/gi),
      ...html.matchAll(/<script\b[^>]*\bsrc="(https?:)?\/\/[^"]*"[^>]*>/gi),
      ...html.matchAll(/<img\b[^>]*\bsrc="(https?:)?\/\/[^"]*"[^>]*>/gi),
    ].map((m) => m[0]);
    expect(loads).toEqual([]);
  });
});
