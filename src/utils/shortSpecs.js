/**
 * Helper to produce clean, concise, uncluttered hardware specs for catalog cards and preview decks.
 * Eliminates long technical parentheticals, frequency numbers, bus speeds, and wattages on the home page.
 */

export function isAppleProduct(product) {
  if (!product) return false;
  const brand = (product.brand || '').toLowerCase();
  const cpuBrand = (product.cpuBrand || '').toLowerCase();
  const gpuBrand = (product.gpuBrand || '').toLowerCase();
  const name = (product.name || '').toLowerCase();
  const model = (product.model || '').toLowerCase();
  const cpuStr = (product.specs?.cpu || '').toLowerCase();
  const gpuStr = (product.specs?.gpu || '').toLowerCase();

  return (
    brand === 'apple' ||
    cpuBrand === 'apple' ||
    gpuBrand === 'apple' ||
    name.includes('apple') ||
    name.includes('macbook') ||
    model.includes('macbook') ||
    cpuStr.includes('apple') ||
    /\b(m1|m2|m3|m4)\b/i.test(cpuStr) ||
    /\b(m1|m2|m3|m4)\b/i.test(gpuStr)
  );
}

/**
 * Derives smart hardware badges for product cards and pages.
 * For Apple products:
 *   - CPU badge displays the chip generation (e.g., M1, M1 Pro, M1 Max, M2, M3 Max)
 *   - GPU badge displays the GPU core count (e.g., 32-Core GPU, 10-Core GPU, 16-Core GPU)
 * For PC / Windows laptops:
 *   - Displays standard manufacturer brands (Intel / AMD / NVIDIA)
 */
export function getHardwareBadges(product) {
  if (!product) {
    return { cpuBadge: 'Intel', gpuBadge: 'NVIDIA' };
  }

  if (isAppleProduct(product)) {
    const fullText = `${product.specs?.cpu || ''} ${product.model || ''} ${product.name || ''} ${product.tagline || ''}`;
    
    // 1. CPU Generation (e.g., M1, M1 Pro, M1 Max, M2, M2 Pro, M3, M4...)
    const mMatch = fullText.match(/\b(M[1-4](?:\s*(?:Pro|Max|Ultra))?)\b/i);
    let cpuBadge = 'M-Series';
    if (mMatch) {
      cpuBadge = mMatch[1]
        .replace(/\bpro\b/i, 'Pro')
        .replace(/\bmax\b/i, 'Max')
        .replace(/\bultra\b/i, 'Ultra');
    }

    // 2. GPU Core Count (e.g., 32-Core GPU, 10-Core GPU, 16-Core GPU...)
    const gpuText = `${product.specs?.gpu || ''} ${product.tagline || ''} ${product.specs?.cpu || ''} ${product.name || ''}`;
    
    const coreMatchEn = gpuText.match(/(\d+)\s*[- ]?[Cc]ores?(?:\s*GPU)?/i);
    const coreMatchFa = gpuText.match(/([0-9۰-۹]+)\s*هسته(?:\s*گرافیکی)?/);

    let gpuBadge = 'Apple GPU';
    if (coreMatchEn) {
      gpuBadge = `${coreMatchEn[1]}-Core GPU`;
    } else if (coreMatchFa) {
      const enNum = coreMatchFa[1].replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
      gpuBadge = `${enNum}-Core GPU`;
    } else if (mMatch) {
      // Smart default Apple GPU core count based on Silicon generation
      const genLower = cpuBadge.toLowerCase();
      if (genLower.includes('ultra')) gpuBadge = '64-Core GPU';
      else if (genLower.includes('max')) gpuBadge = '32-Core GPU';
      else if (genLower.includes('pro')) gpuBadge = '16-Core GPU';
      else gpuBadge = '10-Core GPU';
    }

    return { cpuBadge, gpuBadge };
  }

  return {
    cpuBadge: product.cpuBrand || 'Intel',
    gpuBadge: product.gpuBrand || 'NVIDIA'
  };
}

export function parseShortCpu(str, brand = '') {
  if (!str) return brand || 'Processor';
  
  // Clean Apple processor representation
  if (/apple/i.test(brand) || /apple/i.test(str) || /\bM[1-4]\b/i.test(str)) {
    const mMatch = str.match(/\b(M[1-4](?:\s*(?:Pro|Max|Ultra))?)\b/i);
    if (mMatch) {
      const gen = mMatch[1]
        .replace(/\bpro\b/i, 'Pro')
        .replace(/\bmax\b/i, 'Max')
        .replace(/\bultra\b/i, 'Ultra');
      const cores = str.match(/(\d+)\s*[- ]?[Cc]ore/i);
      return cores ? `Apple ${gen} (${cores[1]}-Core)` : `Apple ${gen}`;
    }
  }

  return str.split('(')[0].trim();
}

export function parseShortGpu(str, brand = '') {
  if (!str) return brand || 'Graphics';

  // Clean Apple GPU representation with core count
  if (/apple/i.test(brand) || /apple/i.test(str) || /\bcore\b/i.test(str)) {
    const cores = str.match(/(\d+)\s*[- ]?[Cc]ore/i);
    if (cores) {
      return `Apple ${cores[1]}-Core GPU`;
    }
  }

  // Remove technical clutter like GDDR6, TGP wattage, Xe-Cores details
  let s = str.split('(')[0]
    .replace(/GeForce\s*/i, '')
    .replace(/GDDR\d+/i, '')
    .replace(/ECC/i, '')
    .replace(/Integrated\s*/i, '')
    .trim();
  
  // Make sure VRAM (e.g. 8GB, 16GB) is captured if present in the original string
  const vramMatch = str.match(/(\d+\s*GB)/i);
  if (vramMatch && !s.includes(vramMatch[1])) {
    s += ' ' + vramMatch[1];
  }
  return s.replace(/\s+/g, ' ').trim();
}

export function parseShortRam(str) {
  if (!str) return '16GB RAM';
  const m = str.match(/(\d+\s*GB)/i);
  const val = m ? m[1].toUpperCase().replace(/\s+/g, '') : str.split(' ')[0];
  return `${val} RAM`;
}

export function parseShortStorage(str) {
  if (!str) return '1TB SSD';
  const m = str.match(/(\d+\s*(?:TB|GB))/i);
  return m ? m[1].toUpperCase() + ' SSD' : str.split(' ')[0] + ' SSD';
}

export function parseShortDisplay(str) {
  if (!str) return 'Display';
  const clean = str.split('(')[0]
    .replace(/\b(?:Dual-Mode|Anti-Glare|\d+ms)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  return clean || 'Display';
}

export function parseShortBattery(str) {
  if (!str) return '50Wh Battery';
  const m = str.match(/(\d+\s*Wh)/i);
  return m ? m[1].toUpperCase() + ' Battery' : '50Wh Battery';
}

export function parseShortChassis(str) {
  if (!str) return 'تمام آلومینیوم';
  if (/carbon|کربن/i.test(str)) return 'فیبر کربن';
  if (/magnesium|منیزیم/i.test(str)) return 'آلیاژ منیزیم';
  if (/polycarbonate|پلی‌کربنات/i.test(str)) return 'پلی‌کربنات مقاوم';
  if (/aluminum|aluminium|آلومینیوم/i.test(str)) return 'تمام آلومینیوم';
  return str;
}

export function getShortSpecs(product) {
  if (!product) return {};
  const specs = product.specs || {};
  const existingShort = product.shortSpecs || specs.shortSpecs || {};

  let ramValue = existingShort.ram || parseShortRam(specs.ram);
  if (ramValue) {
    const cleanNum = ramValue.replace(/\bRAM\b/gi, '').trim();
    ramValue = cleanNum ? `${cleanNum} RAM` : '16GB RAM';
  }

  return {
    cpu: existingShort.cpu || parseShortCpu(specs.cpu, product.cpuBrand),
    gpu: existingShort.gpu || parseShortGpu(specs.gpu, product.gpuBrand),
    ram: ramValue,
    storage: existingShort.storage || parseShortStorage(specs.storage),
    display: existingShort.display || parseShortDisplay(specs.display),
    battery: existingShort.battery || parseShortBattery(specs.battery),
    chassis: existingShort.chassis || parseShortChassis(product.chassis || specs.chassis)
  };
}
