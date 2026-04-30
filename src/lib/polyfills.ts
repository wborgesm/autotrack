import { TextEncoder, TextDecoder } from 'util';

// Polyfill global para face-api.js
globalThis.TextEncoder = TextEncoder as any;
globalThis.TextDecoder = TextDecoder as any;
