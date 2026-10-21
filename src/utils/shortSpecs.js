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

  // Smart CPU detection for PC/Windows laptops (Intel, AMD, Snapdragon)
  const cpuText = `${product.cpuBrand || ''} ${product.cpu_brand || ''} ${product.specs?.cpu || ''}`.toLowerCase();
  let cpuBadge = 'Intel';
  if (cpuText.includes('amd') || cpuText.includes('ryzen')) {
    cpuBadge = 'AMD';
  } else if (cpuText.includes('snapdragon') || cpuText.includes('qualcomm')) {
    cpuBadge = 'Snapdragon';
  } else if (cpuText.includes('intel') || cpuText.includes('core')) {
    cpuBadge = 'Intel';
  } else if (product.cpuBrand || product.cpu_brand) {
    cpuBadge = product.cpuBrand || product.cpu_brand;
  }

  // Smart GPU detection for PC/Windows laptops (NVIDIA, Intel, AMD Radeon)
  const gpuText = `${product.gpuBrand || ''} ${product.gpu_brand || ''} ${product.specs?.gpu || ''}`.toLowerCase();
  let gpuBadge = 'NVIDIA';
  if (gpuText.includes('amd') || gpuText.includes('radeon')) {
    gpuBadge = 'AMD Radeon';
  } else if (gpuText.includes('intel') || gpuText.includes('iris') || gpuText.includes('uhd') || gpuText.includes('arc')) {
    gpuBadge = 'Intel';
  } else if (gpuText.includes('nvidia') || gpuText.includes('rtx') || gpuText.includes('gtx') || gpuText.includes('geforce')) {
    gpuBadge = 'NVIDIA';
  } else if (product.gpuBrand || product.gpu_brand) {
    gpuBadge = product.gpuBrand || product.gpu_brand;
  }

  return { cpuBadge, gpuBadge };
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

  // Remove Persian prefixes like "پردازنده:"
  let s = str.replace(/پردازنده\s*:?\s*/gi, '').trim();

  // Remove technical bracket clutter
  s = s.split('(')[0].trim();

  return s || brand || 'Processor';
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

  // 1. Convert Persian numerals to English digits first
  const normalized = str.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));

  // 2. Apple Unified Memory support
  if (/unified/i.test(normalized)) {
    const num = normalized.match(/(\d+)\s*(?:GB|گیگابایت|گیگ)?/i);
    return num ? `${num[1]}GB Unified Memory` : 'Unified Memory';
  }
  
  // 3. Match GB / گیگابایت / گیگ
  const m = normalized.match(/(\d+)\s*(?:GB|گیگابایت|گیگ)/i);
  const gb = m ? m[1] : (normalized.match(/(\d+)/)?.[1] || '16');

  // 4. Check DDR type if present (DDR4, DDR5, LPDDR5, LPDDR4X)
  const ddrMatch = normalized.match(/\b(LPDDR\d[a-z]?|DDR\d)\b/i);
  const ddr = ddrMatch ? ddrMatch[1].toUpperCase() : null;

  return ddr ? `${gb}GB ${ddr}` : `${gb}GB RAM`;
}

export function parseShortStorage(str) {
  if (!str) return '1TB SSD';
  const normalized = str.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
  const m = normalized.match(/(\d+)\s*(?:TB|GB|ترابایت|گیگابایت)/i);
  if (m) {
    const isTb = /tb|ترابایت/i.test(m[0]);
    return `${m[1]}${isTb ? 'TB' : 'GB'} SSD`;
  }
  return '1TB SSD';
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
  if (/titanium|تیتانیوم/i.test(str)) return 'آلیاژ تیتانیوم';
  if (/polycarbonate|پلی‌کربنات/i.test(str)) return 'پلی‌کربنات مقاوم';
  if (/unibody/i.test(str)) return 'آلومینیوم Unibody';
  if (/aluminum|aluminium|آلومینیوم/i.test(str)) return 'تمام آلومینیوم';
  const clean = str.split('(')[0].replace(/برس‌خورده|صنعتی|استاندارد.*$/gi, '').trim();
  return clean || 'تمام آلومینیوم';
}

export function getShortSpecs(product) {
  if (!product) return {};
  const specs = product.specs || {};
  const existingShort = product.shortSpecs || specs.shortSpecs || {};

  let ramValue = existingShort.ram || parseShortRam(specs.ram);
  if (ramValue && !/unified/i.test(ramValue)) {
    const cleanNum = ramValue.replace(/\bRAM\b/gi, '').trim();
    ramValue = cleanNum ? (cleanNum.includes('DDR') ? cleanNum : `${cleanNum} RAM`) : '16GB RAM';
  }

  return {
    cpu: existingShort.cpu || parseShortCpu(specs.cpu, product.cpuBrand || product.cpu_brand),
    gpu: existingShort.gpu || parseShortGpu(specs.gpu, product.gpuBrand || product.gpu_brand),
    ram: ramValue,
    storage: existingShort.storage || parseShortStorage(specs.storage),
    display: existingShort.display || parseShortDisplay(specs.display),
    battery: existingShort.battery || parseShortBattery(specs.battery),
    chassis: existingShort.chassis || parseShortChassis(product.chassis || specs.chassis)
  };
}
