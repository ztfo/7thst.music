// A pattern rides in its share link, after #p=, so nothing is stored anywhere. "z" is
// deflated and base64url'd; "u" is plain UTF-8 base64url, for browsers without
// CompressionStream. Opening a link only loads the code; it never runs by itself.

export const MAX_CODE = 4000;
const MAX_OPEN = 20000;

const toB64u = (bytes) => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64u = (s) => {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
};
const through = async (bytes, stream) => new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());

export async function pack(code) {
  const bytes = new TextEncoder().encode(code);
  if (typeof CompressionStream === 'function') return 'z' + toB64u(await through(bytes, new CompressionStream('deflate-raw')));
  return 'u' + toB64u(bytes);
}

// inflates no further than MAX_OPEN bytes, so a hostile link can't balloon in memory
async function inflate(body) {
  const reader = new Blob([body]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
  const parts = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_OPEN) { reader.cancel(); throw new Error('too long'); }
    parts.push(value);
  }
  const out = new Uint8Array(size);
  let at = 0;
  for (const p of parts) { out.set(p, at); at += p.length; }
  return out;
}

export async function unpack(packed) {
  if (packed.length > MAX_OPEN * 2) throw new Error('too long');
  const kind = packed[0], body = fromB64u(packed.slice(1));
  let bytes;
  if (kind === 'z') bytes = await inflate(body);
  else if (kind === 'u') bytes = body;
  else throw new Error('unknown link');
  if (bytes.length > MAX_OPEN) throw new Error('too long');
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

export const linkFor = async (code) => `${location.origin}${location.pathname}#p=${await pack(code)}`;
export const sharedInHash = () => (location.hash.startsWith('#p=') ? location.hash.slice(3) : null);
