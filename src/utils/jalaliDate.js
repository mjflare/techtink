// Jalali (Persian Solar Hijri) Calendar Utilities for TechTink
// Lightweight, mathematical conversion without heavy external dependencies.

export const JALALI_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند'
];

export const PERSIAN_WEEKDAYS = [
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنج‌شنبه',
  'جمعه',
  'شنبه'
];

export function isJalaliLeapYear(jy) {
  const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  let bl = breaks.length;
  let jp = breaks[0];
  let jm;
  let jump;
  let n;
  let i;

  if (jy < jp || jy >= breaks[bl - 1]) return false;

  for (i = 1; i < bl; i += 1) {
    jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    jp = jm;
  }
  n = jy - jp;
  if (jump - n < 6) n = n - jump + ((jump + 4) % 33) * 33;
  let leap = (((n + 1) % 33) - 1) % 4;
  if (leap === -1) leap = 4;
  return leap === 0;
}

export function getDaysInJalaliMonth(jy, jm) {
  const m = Number(jm);
  if (m <= 6) return 31;
  if (m <= 11) return 30;
  return isJalaliLeapYear(jy) ? 30 : 29;
}

export function jalaliToGregorian(jy, jm, jd) {
  jy = Number(jy);
  jm = Number(jm);
  jd = Number(jd);
  let gy = (jy <= 979) ? 621 : 1600;
  jy -= (jy <= 979) ? 0 : 979;
  let days = (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + 78 + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  gy += Math.floor((days - 1) / 365);
  if (days > 365) days = (days - 1) % 365;
  let gd = days + 1;
  const sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm;
  for (gm = 0; gm < 13; gm++) {
    const v = sal_a[gm];
    if (gd <= v) break;
    gd -= v;
  }
  return { gy, gm, gd };
}

export function gregorianToJalali(gy, gm, gd) {
  gy = Number(gy);
  gm = Number(gm);
  gd = Number(gd);
  const g_d_m = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 31, 30, 31];
  let jy = (gy <= 1600) ? 0 : 979;
  gy -= (gy <= 1600) ? 621 : 1600;
  let gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) - 80 + gd;
  for (let i = 0; i < gm; ++i) days += g_d_m[i];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  let jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
  return { jy, jm, jd };
}

/**
 * Converts ISO date string to Jalali details.
 */
export function isoToJalali(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return null;

  const gy = d.getFullYear();
  const gm = d.getMonth() + 1;
  const gd = d.getDate();
  const hour = d.getHours();
  const minute = d.getMinutes();

  const { jy, jm, jd } = gregorianToJalali(gy, gm, gd);
  const monthName = JALALI_MONTH_NAMES[jm - 1] || '';
  const weekdayName = PERSIAN_WEEKDAYS[d.getDay()] || '';

  const pad = (n) => String(n).padStart(2, '0');
  const toPersianNum = (n) => String(n).replace(/[0-9]/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[digit]);

  const formattedJalali = `${jy}/${pad(jm)}/${pad(jd)}`;
  const formattedTime = `${pad(hour)}:${pad(minute)}`;
  const fullText = `${weekdayName} ${jd} ${monthName} ${jy}، ساعت ${formattedTime}`;

  return {
    jy,
    jm,
    jd,
    hour,
    minute,
    monthName,
    weekdayName,
    formattedJalali,
    formattedTime,
    fullText,
    dateObj: d
  };
}

/**
 * Converts Jalali year, month, day, hour, minute to JavaScript Date and ISO string.
 */
export function jalaliToIso(jy, jm, jd, hour = 23, minute = 59) {
  const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
  const d = new Date(gy, gm - 1, gd, Number(hour), Number(minute), 0, 0);
  return d.toISOString();
}

/**
 * Format full Persian date string from ISO date.
 */
export function formatPersianDateTime(isoString) {
  const info = isoToJalali(isoString);
  return info ? info.fullText : '';
}

/**
 * Generates quick campaign end presets in Persian.
 */
export function getPersianDatePresets() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');

  // Preset 1: End of tonight (23:59)
  const tonight = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  // Preset 2: 3 days from now at 23:59
  const in3Days = new Date(now.getTime() + 3 * 86400000);
  in3Days.setHours(23, 59, 59, 0);

  // Preset 3: 7 days from now (1 week)
  const in7Days = new Date(now.getTime() + 7 * 86400000);
  in7Days.setHours(23, 59, 59, 0);

  // Preset 4: 14 days from now (2 weeks)
  const in14Days = new Date(now.getTime() + 14 * 86400000);
  in14Days.setHours(23, 59, 59, 0);

  // Preset 5: End of current Persian month
  const currentJalali = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const maxDaysInCurrentMonth = getDaysInJalaliMonth(currentJalali.jy, currentJalali.jm);
  const endOfMonthIso = jalaliToIso(currentJalali.jy, currentJalali.jm, maxDaysInCurrentMonth, 23, 59);

  // Preset 6: 1 month from now
  const in30Days = new Date(now.getTime() + 30 * 86400000);
  in30Days.setHours(23, 59, 59, 0);

  return [
    { label: 'تا پایان امشب (۲۳:۵۹)', iso: tonight.toISOString() },
    { label: '۳ روز دیگر', iso: in3Days.toISOString() },
    { label: '۱ هفته دیگر (۷ روز)', iso: in7Days.toISOString() },
    { label: '۲ هفته دیگر (۱۴ روز)', iso: in14Days.toISOString() },
    { label: `تا پایان ${JALALI_MONTH_NAMES[currentJalali.jm - 1]} (${maxDaysInCurrentMonth}ام)`, iso: endOfMonthIso },
    { label: '۱ ماه دیگر (۳۰ روز)', iso: in30Days.toISOString() }
  ];
}
