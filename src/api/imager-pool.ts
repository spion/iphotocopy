import * as wp from 'workerpool'
import * as stream from 'stream'

async function createThumbnail(filePath: string, width: number, height: number) {
  let fs = await import('fs/promises');
  let imgr = await import('@hfour/imager-wasm');
  let fileBytes = await fs.readFile(filePath);
  let thumb = imgr.thumbnail(fileBytes, width, height);
  return thumb;
}

export function createResizePool() {
  let pool = wp.pool()
  return async (filePath: string, width: number, height: number) => {
    let result = await pool.exec(createThumbnail, [filePath, width, height]);
    let passthroughStream = new stream.PassThrough()
    passthroughStream.end(result);
    return passthroughStream;
  }
}
