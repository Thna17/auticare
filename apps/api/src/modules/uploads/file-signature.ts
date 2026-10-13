/**
 * File signature (magic bytes) validation.
 *
 * Inspects raw buffer data to ensure files match legitimate formats and
 * rejects executable binaries, scripts, or spoofed MIME types.
 */

export interface DetectedFileType {
  mime: string;
  ext: string;
}

/**
 * Checks whether buffer starts with expected bytes.
 */
function matches(buffer: Buffer, bytes: number[], offset = 0): boolean {
  if (buffer.length < offset + bytes.length) return false;
  for (let i = 0; i < bytes.length; i++) {
    if (buffer[offset + i] !== bytes[i]) return false;
  }
  return true;
}

/**
 * Determine if buffer is valid UTF-8 / ASCII text and does not contain null bytes
 * or typical binary executable signatures.
 */
function isPlainTextOrCsv(buffer: Buffer): boolean {
  // Empty buffer can be text
  if (buffer.length === 0) return true;
  // Check for binary null byte \0 which indicates binary
  const sample = buffer.subarray(0, Math.min(buffer.length, 4096));
  for (let i = 0; i < sample.length; i++) {
    const byte = sample[i];
    // Check for null byte or control characters other than \t, \n, \r
    if (byte === 0 || (byte! < 32 && byte !== 9 && byte !== 10 && byte !== 13)) {
      return false;
    }
  }
  return true;
}

/**
 * Detect actual file type by checking magic bytes.
 */
export function detectFileSignature(buffer: Buffer): DetectedFileType | null {
  // JPEG: FF D8 FF
  if (matches(buffer, [0xff, 0xd8, 0xff])) {
    return { mime: 'image/jpeg', ext: '.jpg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (matches(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { mime: 'image/png', ext: '.png' };
  }

  // GIF: 47 49 46 38 37 61 ('GIF87a') or 47 49 46 38 39 61 ('GIF89a')
  if (
    matches(buffer, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) ||
    matches(buffer, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
  ) {
    return { mime: 'image/gif', ext: '.gif' };
  }

  // WEBP: RIFF .... WEBP
  // 'RIFF' at 0, 'WEBP' at 8
  if (matches(buffer, [0x52, 0x49, 0x46, 0x46]) && matches(buffer, [0x57, 0x45, 0x42, 0x50], 8)) {
    return { mime: 'image/webp', ext: '.webp' };
  }

  // PDF: %PDF (25 50 44 46)
  if (matches(buffer, [0x25, 0x50, 0x44, 0x46])) {
    return { mime: 'application/pdf', ext: '.pdf' };
  }

  // Word (legacy DOC / Compound File Binary): D0 CF 11 E0 A1 B1 1A E1
  if (matches(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
    return { mime: 'application/msword', ext: '.doc' };
  }

  // Word (DOCX): PK\x03\x04 (ZIP archive signature: 50 4B 03 04)
  if (matches(buffer, [0x50, 0x4b, 0x03, 0x04])) {
    return {
      mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ext: '.docx',
    };
  }

  // Text or CSV
  if (isPlainTextOrCsv(buffer)) {
    return { mime: 'text/plain', ext: '.txt' };
  }

  return null;
}

/**
 * Validates that the buffer's true signature matches the claimed MIME type.
 * Also returns the canonical extension for the detected type.
 */
export function validateFileSignature(
  buffer: Buffer,
  declaredMime: string,
  allowedMimes: string[],
): DetectedFileType {
  // Reject obvious dangerous executables immediately even if claimed otherwise
  // Windows PE: 'MZ' (4D 5A)
  if (matches(buffer, [0x4d, 0x5a])) {
    throw new Error('Executable files are strictly forbidden.');
  }
  // Linux ELF: 7F 45 4C 46
  if (matches(buffer, [0x7f, 0x45, 0x4c, 0x46])) {
    throw new Error('Executable files are strictly forbidden.');
  }
  // Shell scripts starting with #!
  if (matches(buffer, [0x23, 0x21])) {
    throw new Error('Scripts are strictly forbidden.');
  }

  const detected = detectFileSignature(buffer);
  if (!detected) {
    throw new Error('Unrecognized or corrupted file format.');
  }

  // Check if detected mime is in allowed list
  // Normalize JPEG variants
  const isJpeg = (m: string) => m === 'image/jpeg' || m === 'image/jpg';
  const isText = (m: string) => m === 'text/plain' || m === 'text/csv';

  const matchesMime =
    detected.mime === declaredMime ||
    (isJpeg(detected.mime) && isJpeg(declaredMime)) ||
    (isText(detected.mime) && isText(declaredMime));

  if (!matchesMime) {
    throw new Error(
      `File signature mismatch: claimed ${declaredMime} but content is ${detected.mime}.`,
    );
  }

  if (!allowedMimes.includes(declaredMime) && !allowedMimes.includes(detected.mime)) {
    throw new Error('Unsupported file type.');
  }

  return detected;
}
