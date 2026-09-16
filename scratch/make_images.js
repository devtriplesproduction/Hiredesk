const fs = require('fs');
const path = require('path');

// 1x1 pixel PNG buffers in base64:
// Red PNG:
const redPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
// Green PNG:
const greenPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEgwGA/p+l9AAAAABJRU5ErkJggg==";
// Blue PNG:
const bluePngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwGAi5vFvwAAAABJRU5ErkJggg==";
// Purple PNG:
const purplePngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP4z8DwHwAFAAH/qv54mgAAAABJRU5ErkJggg==";

const dir = __dirname;
fs.writeFileSync(path.join(dir, 'global_logo.png'), Buffer.from(greenPngBase64, 'base64'));
fs.writeFileSync(path.join(dir, 'doc_logo.png'), Buffer.from(redPngBase64, 'base64'));
fs.writeFileSync(path.join(dir, 'global_sign.png'), Buffer.from(bluePngBase64, 'base64'));
fs.writeFileSync(path.join(dir, 'doc_sign.png'), Buffer.from(purplePngBase64, 'base64'));
console.log('PNG files created successfully');
