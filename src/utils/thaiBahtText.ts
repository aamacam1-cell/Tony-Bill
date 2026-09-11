/**
 * Convert numeric currency (THB) to Thai words (e.g. 551.00 -> "ห้าร้อยห้าสิบเอ็ดบาทถ้วน")
 * Accurately implements official Royal Institute of Thailand rules.
 */

const THAI_DIGITS = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
const THAI_UNITS = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

function convertUnderMillion(numStr: string): string {
  let result = '';
  const len = numStr.length;

  for (let i = 0; i < len; i++) {
    const digit = parseInt(numStr.charAt(i), 10);
    const pos = len - 1 - i;

    if (digit === 0) continue;

    if (pos === 0) {
      // Ones place
      if (digit === 1 && len > 1) {
        result += 'เอ็ด';
      } else {
        result += THAI_DIGITS[digit];
      }
    } else if (pos === 1) {
      // Tens place
      if (digit === 1) {
        result += 'สิบ';
      } else if (digit === 2) {
        result += 'ยี่สิบ';
      } else {
        result += THAI_DIGITS[digit] + 'สิบ';
      }
    } else {
      result += THAI_DIGITS[digit] + THAI_UNITS[pos];
    }
  }

  return result;
}

function convertInteger(numStr: string): string {
  if (numStr === '0' || numStr === '') return 'ศูนย์';

  let result = '';
  let remaining = numStr;

  const chunks: string[] = [];
  while (remaining.length > 0) {
    const start = Math.max(0, remaining.length - 6);
    chunks.unshift(remaining.substring(start));
    remaining = remaining.substring(0, start);
  }

  for (let i = 0; i < chunks.length; i++) {
    const chunkVal = convertUnderMillion(chunks[i]);
    result += chunkVal;
    if (i < chunks.length - 1 && chunkVal !== '') {
      result += 'ล้าน';
    }
  }

  return result;
}

export function numberToThaiBahtText(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num) || num === 0) {
    return 'ศูนย์บาทถ้วน';
  }

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  // Round to 2 decimal places to handle currency satang
  const fixed = absNum.toFixed(2);
  const [intPart, satangPart] = fixed.split('.');

  const bahtText = convertInteger(intPart);
  let satangText = '';

  const satangVal = parseInt(satangPart, 10);
  if (satangVal === 0) {
    satangText = 'ถ้วน';
  } else {
    satangText = convertUnderMillion(satangPart) + 'สตางค์';
  }

  let fullText = (isNegative ? 'ลบ' : '') + (intPart === '0' ? '' : bahtText + 'บาท') + satangText;
  if (intPart === '0' && satangVal > 0) {
    fullText = (isNegative ? 'ลบ' : '') + satangText;
  }

  return fullText;
}
