export type ByteCodec = {
  compress: (data: Uint8Array) => Promise<Uint8Array>;
  decompress: (data: Uint8Array) => Promise<Uint8Array>;
};

type BytesReadable = { getReader: () => { read: () => Promise<{ done: boolean; value?: Uint8Array }> } };
type BytesWritable = { getWriter: () => { write: (chunk: Uint8Array) => Promise<void>; close: () => Promise<void> } };

type CompressionCtor = new (format: string) => { readable: BytesReadable; writable: BytesWritable };

async function streamToUint8(readable: BytesReadable): Promise<Uint8Array> {
  const reader = readable.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      total += value.byteLength;
    }
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

async function pipeThrough(input: Uint8Array, format: string, mode: 'compress' | 'decompress'): Promise<Uint8Array> {
  const g = globalThis as { CompressionStream?: CompressionCtor; DecompressionStream?: CompressionCtor };
  const Ctor = mode === 'compress' ? g.CompressionStream : g.DecompressionStream;
  if (!Ctor) throw new Error('CompressionStream/DecompressionStream not available');
  const stream = new Ctor(format);
  const writer = stream.writable.getWriter();
  await writer.write(input);
  await writer.close();
  return streamToUint8(stream.readable);
}

export const webStreamsGzipCodec: ByteCodec = {
  compress: (data) => pipeThrough(data, 'gzip', 'compress'),
  decompress: (data) => pipeThrough(data, 'gzip', 'decompress'),
};