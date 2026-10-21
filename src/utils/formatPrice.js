// Formats prices in "میلیون تومان" with Persian digits and clean decimals

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
  const unit = 'میلیون تومان';

  if (num < 1000) {
    // Value is already in millions (e.g. 74.5 or 38)
    formattedVal = num % 1 === 0 ? num.toFixed(0) : num.toFixed(1).replace(/\.0$/, '');
  } else {
    // Value in full Toman (e.g. 74,500,000 -> 74.5)
    const millions = num / 1000000;
    if (millions >= 1) {
      formattedVal = millions % 1 === 0 
        ? millions.toFixed(0) 
        : (millions % 0.1 === 0 ? millions.toFixed(1) : millions.toFixed(2)).replace(/\.00$/, '').replace(/\.0$/, '');
    } else {
      // Less than 1 million (e.g. 500,000 -> 0.5)
      formattedVal = millions.toFixed(2).replace(/0$/, '').replace(/\.0$/, '');
    }
  }

  const persian = toPersianDigits(formattedVal);
  return includeUnit ? `${persian} ${unit}` : persian;
}

// Convert full Toman price to Millions string for inputs (e.g. 74500000 -> "74.5")
export function toMillionsToman(price) {
  if (price === null || price === undefined || price === '' || isNaN(price)) return '';
  const num = Number(price);
  if (num === 0) return '0';
  if (num < 1000) return num.toString(); // already in millions
  const m = num / 1000000;
  return m % 1 === 0 ? m.toFixed(0) : m.toFixed(2).replace(/\.?0+$/, '');
}

// Parse user entered amount (handles Persian/English numbers, decimals and millions)
export function parseToman(str) {
  if (!str && str !== 0) return 0;
  const english = String(str)
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, (d) => '٠١٢٣۴٥۶۷۸۹'.indexOf(d))
    .replace(/,/g, '')
    .trim();
  const num = parseFloat(english);
  if (isNaN(num)) return 0;
  // If user entered e.g. 74.5 (in millions), convert to full Toman
  if (num < 1000) return Math.round(num * 1000000);
  return Math.round(num);
}

// Standard Grade Normalizer: strictly returns 'A+', 'A', or 'B+' with zero clarifications
export function cleanGrade(raw) {
  if (!raw) return 'A+';
  const str = String(raw).toUpperCase().trim();
  if (str.includes('B+') || str.includes('+B')) return 'B+';
  if (str.includes('A+') || str.includes('++A') || str.includes('A++') || str.includes('+A')) return 'A+';
  if (str.includes('A')) return 'A';
  return 'A+';
}
