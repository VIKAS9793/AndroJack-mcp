import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;

function fail(message) {
  console.error(`VSIX validation failed: ${message}`);
  process.exit(1);
}

function findEndOfCentralDirectory(buffer) {
  const minimumRecordLength = 22;
  const maxCommentLength = 0xffff;
  const start = Math.max(0, buffer.length - minimumRecordLength - maxCommentLength);

  for (let offset = buffer.length - minimumRecordLength; offset >= start; offset -= 1) {
    if (buffer.readUInt32LE(offset) === END_OF_CENTRAL_DIRECTORY_SIGNATURE) {
      return offset;
    }
  }

  fail("could not locate the ZIP end-of-central-directory record");
}

function parseEntries(buffer) {
  const eocdOffset = findEndOfCentralDirectory(buffer);
  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);

  const entries = new Map();
  let offset = centralDirectoryOffset;

  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(offset) !== CENTRAL_DIRECTORY_SIGNATURE) {
      fail(`unexpected central directory signature at offset ${offset}`);
    }

    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraFieldLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const fileName = buffer.toString("utf8", offset + 46, offset + 46 + fileNameLength);

    entries.set(fileName, {
      compressionMethod,
      compressedSize,
      localHeaderOffset,
    });

    offset += 46 + fileNameLength + extraFieldLength + commentLength;
  }

  return entries;
}

function readEntryText(buffer, entryName, entry) {
  if (buffer.readUInt32LE(entry.localHeaderOffset) !== LOCAL_FILE_HEADER_SIGNATURE) {
    fail(`unexpected local header signature for ${entryName}`);
  }

  const fileNameLength = buffer.readUInt16LE(entry.localHeaderOffset + 26);
  const extraFieldLength = buffer.readUInt16LE(entry.localHeaderOffset + 28);
  const dataOffset = entry.localHeaderOffset + 30 + fileNameLength + extraFieldLength;
  const compressed = buffer.subarray(dataOffset, dataOffset + entry.compressedSize);

  if (entry.compressionMethod === 0) {
    return compressed.toString("utf8");
  }

  if (entry.compressionMethod === 8) {
    return zlib.inflateRawSync(compressed).toString("utf8");
  }

  fail(`unsupported compression method ${entry.compressionMethod} for ${entryName}`);
}

function resolveVsixPath() {
  if (process.argv[2]) {
    return path.resolve(process.cwd(), process.argv[2]);
  }

  const packageJsonPath = path.resolve(process.cwd(), "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    fail("package.json is required when no VSIX path argument is provided");
  }

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  return path.resolve(process.cwd(), `${pkg.name}-${pkg.version}.vsix`);
}

const vsixPath = resolveVsixPath();
if (!fs.existsSync(vsixPath)) {
  fail(`package not found at ${vsixPath}`);
}

const archive = fs.readFileSync(vsixPath);
const entries = parseEntries(archive);

const manifestEntryName = "extension.vsixmanifest";
const readmeEntryName = [...entries.keys()].find((entryName) =>
  /^extension\/readme\.md$/i.test(entryName)
);

if (!readmeEntryName) {
  fail("missing packaged README asset under extension/readme.md");
}

if (!entries.has(manifestEntryName)) {
  fail(`missing ${manifestEntryName}`);
}

const manifestText = readEntryText(archive, manifestEntryName, entries.get(manifestEntryName));
const detailsAssetPattern =
  /<Asset\s+Type="Microsoft\.VisualStudio\.Services\.Content\.Details"\s+Path="extension\/readme\.md"/i;

if (!detailsAssetPattern.test(manifestText)) {
  fail("extension.vsixmanifest is missing the README Details asset");
}

console.log(`Validated VSIX: ${vsixPath}`);
console.log(`Found README asset: ${readmeEntryName}`);
console.log("Found manifest Details asset: Microsoft.VisualStudio.Services.Content.Details");
