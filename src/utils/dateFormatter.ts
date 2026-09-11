const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

const THAI_SHORT_MONTHS = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
];

/**
 * Formats a Date object or YYYY-MM-DD string into Thai Buddhist Era string:
 * e.g. "2026-09-04" -> "4 กันยายน 2569"
 */
export function formatThaiDate(
  dateInput: string | Date,
  options?: { shortMonth?: boolean; prefixDay?: boolean }
): string {
  if (!dateInput) return '';

  let date: Date;
  if (typeof dateInput === 'string') {
    // Check if it's already a thai formatted string
    if (dateInput.includes('พ.ศ.') || THAI_MONTHS.some(m => dateInput.includes(m))) {
      return dateInput;
    }
    const parts = dateInput.split('-');
    if (parts.length === 3) {
      date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      date = new Date(dateInput);
    }
  } else {
    date = dateInput;
  }

  if (isNaN(date.getTime())) {
    return typeof dateInput === 'string' ? dateInput : '';
  }

  const day = date.getDate();
  const monthIdx = date.getMonth();
  const yearCE = date.getFullYear();
  const yearBE = yearCE + 543;

  const monthName = options?.shortMonth ? THAI_SHORT_MONTHS[monthIdx] : THAI_MONTHS[monthIdx];

  return `${day} ${monthName} ${yearBE}`;
}

/**
 * Returns today's date formatted as YYYY-MM-DD
 */
export function getTodayISODate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns 2-digit Buddhist Era year for invoice numbering:
 * e.g. 2026 -> 2569 -> "69"
 */
export function getBEYear2Digit(): string {
  const yearBE = new Date().getFullYear() + 543;
  return String(yearBE).slice(-2);
}
