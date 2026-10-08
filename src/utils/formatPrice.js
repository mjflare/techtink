// Formats prices in Toman with Persian thousands separators and optional currency label

export function toPersianDigits(num) {
  if (num === null || num === undefined) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/[0-9]/g, (w) => persianDigits[+w]);
}

export function formatPrice(price, includeUnit = true) {
  if (price === null || price === undefined || isNaN(price)) {
    return includeUnit ? '۰ تومان' : '۰';
  }
  const rounded = Math.round(Number(price));
  const formattedNumber = rounded.toLocaleString('en-US'); // e.g. 24,500,000
  const persianFormatted = toPersianDigits(formattedNumber);
  return includeUnit ? `${persianFormatted} تومان` : persianFormatted;
}

export function parseToman(str) {
  if (!str) return 0;
  const english = String(str)
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, (d) => '٠١٢٣۴٥۶۷۸۹'.indexOf(d))
    .replace(/[^0-9]/g, '');
  return parseInt(english, 10) || 0;
}
