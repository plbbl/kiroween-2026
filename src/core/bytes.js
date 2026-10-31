// Byte helpers. Pure functions, no DOM, no network.
export function concat(...parts) {
    const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let offset = 0;
    for (const p of parts) {
        out.set(p, offset);
        offset += p.length;
    }
    return out;
}
export function equal(a, b) {
    if (a.length !== b.length)
        return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++)
        diff |= a[i] ^ b[i];
    return diff === 0;
}
export function randomBytes(length) {
    return crypto.getRandomValues(new Uint8Array(length));
}
const utf8Encoder = new TextEncoder();
const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
export const utf8 = {
    encode: (s) => utf8Encoder.encode(s),
    decode: (b) => utf8Decoder.decode(b),
};
// base64url without padding, used inside jar files.
export function toBase64Url(bytes) {
    let bin = '';
    for (const b of bytes)
        bin += String.fromCharCode(b);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function fromBase64Url(text) {
    if (!/^[A-Za-z0-9_-]*$/.test(text))
        throw new Error('Invalid base64url text');
    const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++)
        out[i] = bin.charCodeAt(i);
    return out;
}
// RFC 4648 base32 without padding. Uppercase letters and digits fit QR
// alphanumeric mode, which makes the codes on the cards smaller.
const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function toBase32(bytes) {
    let bits = 0;
    let value = 0;
    let out = '';
    for (const b of bytes) {
        value = (value << 8) | b;
        bits += 8;
        while (bits >= 5) {
            out += BASE32[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }
    if (bits > 0)
        out += BASE32[(value << (5 - bits)) & 31];
    return out;
}
export function fromBase32(text) {
    const clean = text.toUpperCase().replace(/=+$/, '');
    let bits = 0;
    let value = 0;
    const out = [];
    for (const ch of clean) {
        const idx = BASE32.indexOf(ch);
        if (idx < 0)
            throw new Error('Invalid base32 text');
        value = (value << 5) | idx;
        bits += 5;
        if (bits >= 8) {
            out.push((value >>> (bits - 8)) & 0xff);
            bits -= 8;
        }
    }
    // Only the canonical encoding is accepted: leftover padding bits must be
    // zero, otherwise two different texts would decode to the same bytes.
    if (bits >= 5 || (value & ((1 << bits) - 1)) !== 0)
        throw new Error('Invalid base32 text');
    return new Uint8Array(out);
}
// Read and write individual bits, most significant first.
export function readBits(bytes, start, count) {
    let v = 0;
    for (let i = 0; i < count; i++) {
        const bit = start + i;
        const byte = bytes[bit >> 3] ?? 0;
        v = (v << 1) | ((byte >> (7 - (bit & 7))) & 1);
    }
    return v;
}
