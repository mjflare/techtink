// Formats prices in "میلیون تومان" with Persian digits and concise decimals (no clutter of zeros)

export function toPersianDigits(num) {
  if (num === null || num === undefined) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/[0-9]/g, (w) => persianDigits[+w]);
}

export function formatPrice(price, includeUnit = true) {
  if (price === null || price === undefined || isNaN(price)) {
    return includeUnit ? '۰ میلیون تومان' : '۰';
  }
  const num = Number(price);
  if (num === 0) {
    return includeUnit ? '۰ میلیون تومان' : '۰';
  }

  let formattedVal = '';
  let unit = 'میلیون تومان';

  if (num < 1000) {
    // Already in millions (e.g. 21.8 or 35)
    formattedVal = num % 1 === 0 ? num.toFixed(0) : num.toFixed(1).replace(/\.0$/, '');
  } else if (num >= 1000000) {
    // Full Toman amount (e.g. 21,800,000 or 35,000,000)
    const millions = num / 1000000;
    formattedVal = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1).replace(/\.0$/, '');
  } else {
    // Under 1 million (e.g. 500,000)
    const thousands = num / 1000;
    formattedVal = thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1).replace(/\.0$/, '');
    unit = 'هزار تومان';
  }

  const persian = toPersianDigits(formattedVal);
  return includeUnit ? `${persian} ${unit}` : persian;
}

export function parseToman(str) {
  if (!str) return 0;
  const english = String(str)
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, (d) => '٠١٢٣۴٥۶۷۸۹'.indexOf(d))
    .replace(/[^0-9.]/g, '');
  const num = parseFloat(english);
  if (isNaN(num)) return 0;
  // If user entered e.g. 21.5 (millions), convert to full Toman
  if (num < 1000) return Math.round(num * 1000000);
  return Math.round(num);
}
