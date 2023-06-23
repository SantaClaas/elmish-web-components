// Source https://gist.github.com/georgexchelebiev/c7f1197509513147a1bc89a56db788ae

// A note on endianess: Based on my limited research almost all processors use little-endian and big endian seems to be excotic
// PNG uses big endian so we convert that in code
// CRC START ----------
const crcTable = new Array<number>(255);

// Make crc table
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

function updateCrc(currentCrc: number, data: Uint8Array): number {
  let c = currentCrc;
  for (let n = 0; n < data.length; n++) {
    c = crcTable[(c ^ data[n]) & 0xff] ^ (c >>> 8);
  }
  return c;
}

const initialCrc = 0xffffffff;
function createCrc(buffer: Uint8Array) {
  return updateCrc(initialCrc, buffer) ^ initialCrc;
}

// CRC END ----------

function inflateStore(data: Uint8Array) {
  const MAX_STORE_LENGTH = 65535;
  const storeCount = Math.ceil(data.length / MAX_STORE_LENGTH);
  const length = storeCount * 5 + data.length;
  const storeBuffer = new Uint8Array(length);
  let remaining;
  let blockType;
  let index = 0;
  // This code is confusing from the original source and I converted it once
  for (let i = 0; i < data.length; i += MAX_STORE_LENGTH) {
    remaining = data.length - i;
    blockType = 0;

    if (remaining <= MAX_STORE_LENGTH) {
      blockType = 0x01;
    } else {
      remaining = MAX_STORE_LENGTH;
      blockType = 0x00;
    }

    storeBuffer[index] = blockType;
    // Converting little endian to big endian, see notes above
    storeBuffer[index + 1] = remaining & 0xff;
    storeBuffer[index + 2] = (remaining & 0xff00) >>> 8;
    storeBuffer[index + 3] = ~remaining & 0xff;
    storeBuffer[index + 4] = (~remaining & 0xff00) >>> 8;

    const toAdd = data.subarray(i, i + remaining);

    storeBuffer.set(toAdd, index + 5);
    index += 5 + toAdd.length;
  }

  return storeBuffer;
}
function adler32(data: Uint8Array) {
  const MOD_ADLER = 65521;
  let a = 1;
  let b = 0;

  for (let index = 0; index < data.length; index++) {
    a = (a + data[index]) % MOD_ADLER;
    b = (b + a) % MOD_ADLER;
  }

  return (b << 16) | a;
}

function setUint32(target: Uint8Array, value: number, offset: number) {
  // Converting little endian to big endian, see notes above
  target[offset] = (value & 0xff000000) >>> 24;
  target[offset + 1] = (value & 0x00ff0000) >>> 16;
  target[offset + 2] = (value & 0x0000ff00) >>> 8;
  target[offset + 3] = value & 0x000000ff;
}

function combine(array1: Uint8Array, array2: Uint8Array) {
  const result = new Uint8Array(array1.length + array2.length);
  result.set(array1);
  result.set(array2, array1.length);
  return result;
}

function createChunk(length: number, type: Uint8Array, data: Uint8Array) {
  //TODO find a way to not create so many different arrays
  const crc = createCrc(combine(type, data));

  const result = new Uint8Array(8 + data.length + 4);

  // Length 4 bytes
  setUint32(result, length, 0);
  // Chunk type 4 bytes
  result.set(type, 4);
  // Chunk Data
  result.set(data, 8);
  setUint32(result, crc, 8 + data.length);
  return result;
}

function createIHDR(width: number, height: number) {
  // https://www.w3.org/TR/2003/REC-PNG-20031110/#11IHDR
  // 13 Bytes length = 4 + 4 + 1 + 1 + 1 + 1 + 1
  const length = 13;
  const ihrData = new Uint8Array(length);

  setUint32(ihrData, width, 0);
  setUint32(ihrData, height, 4);
  // Set bit depth of 8
  ihrData[8] = 8;
  // Set color type to 6 which is truecolor with alpha (RGBA)
  ihrData[9] = 6;
  // Commented out lines below because they don't change anything
  // Set compression method to 0=deflate, the only allowed value
  // ihrData[10] = 0;
  // Set filtering to 0=adaptive, the only allowed value
  // ihrData[11] = 0;
  // Set interlacing to 0=none
  // ihrData[12] = 0;

  // Binary of "IHDR"
  const ihdrTag = new Uint8Array([0x49, 0x48, 0x44, 0x52]);
  return createChunk(length, ihdrTag, ihrData);
}
/**
 * Generates a PNG blob from the rgbaPixels array (4 bytes --> 1 Pixel RGBA)
 */
export function generatePng(
  width: number,
  height: number,
  rgbaPixels: Uint8ClampedArray
): Uint8Array {
  const DEFLATE_METHOD = [0x78, 0x01];
  const SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const NO_FILTER = 0;

  // PNG creations

  // ASCII == UTF-8
  const IHDR = createIHDR(width, height);

  // How many bytes are one pixel (RGBA)
  const pixelBytesLength = 4;
  // Every row is one byte longer so we add +1 for every row which is height * 1 or just height
  const scanlinesLength = width * height * pixelBytesLength + height;
  //TODO this should be the same as the source array or not?
  let scanlines = new Uint8Array(scanlinesLength);

  for (
    let pixelIndex = 0, scanlineIndex = 0;
    pixelIndex < height * width * pixelBytesLength;

  ) {
    const isPixelRowStart = pixelIndex % (width * pixelBytesLength) === 0;
    const isScanlineRowStart =
      scanlineIndex % (width * pixelBytesLength + 1) === 0;

    // If we completed a pixel row and a scanline row set the first index in the new scanline row to no filter
    if (isPixelRowStart && isScanlineRowStart) {
      //TODO simplify this because we don't need to set the first index to its default state if it is already in it
      scanlines[scanlineIndex] = NO_FILTER;
      // Advance the scanline index so we can set it from the pixels
      scanlineIndex++;
      continue;
    }

    scanlines[scanlineIndex] = rgbaPixels[pixelIndex] & 0xff;
    scanlineIndex++;
    pixelIndex++;
  }

  // Deflate method 2 bytes
  const deflateMethodBytesLength = 2;
  const inflatedStore = inflateStore(scanlines);
  const dword = adler32(scanlines);
  const compressedScanlines = new Uint8Array(
    deflateMethodBytesLength + inflatedStore.length + 4
  );
  // Set deflate method

  compressedScanlines.set(DEFLATE_METHOD);

  // Set inflated store
  compressedScanlines.set(inflatedStore, deflateMethodBytesLength);

  setUint32(
    compressedScanlines,
    dword,
    deflateMethodBytesLength + inflatedStore.length
  );

  // Binary of "IDAT"
  const idatType = new Uint8Array([0x49, 0x44, 0x41, 0x54]);
  const IDAT = createChunk(
    compressedScanlines.length,
    // Should be 73 68 65 84 in decimal
    idatType,
    compressedScanlines
  );

  // Binary of "IEND"
  const iendType = new Uint8Array([0x49, 0x45, 0x4e, 0x44]);
  const IEND = createChunk(0, iendType, new Uint8Array());
  // Combine to png binary
  const pngBytes = new Uint8Array(
    SIGNATURE.length + IHDR.length + IDAT.length + IEND.length
  );

  pngBytes.set(SIGNATURE, 0);
  pngBytes.set(IHDR, SIGNATURE.length);
  pngBytes.set(IDAT, SIGNATURE.length + IHDR.length);
  pngBytes.set(IEND, SIGNATURE.length + IHDR.length + IDAT.length);
  return pngBytes;
}
