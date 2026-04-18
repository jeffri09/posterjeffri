import fetch, { FormData, Blob } from 'node-fetch';

async function test() {
  const token = 'HF_TOKEN_REMOVED';

  // 1x1 solid white pixel
  const base64str = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";
  const buffer = Buffer.from(base64str, 'base64');
  
  // NOTE: node-fetch v2 doesn't have native FormData/Blob that accepts buffer easily,
  // but let's try assuming Blob works or just use buffer with filename in form-data package.
  // Actually, I'll use standard node `fs` since this is just a quick API format check.
}
test();
