/**
 * Helper to produce clean, concise, uncluttered hardware specs for catalog cards and preview decks.
 * Eliminates long technical parentheticals, frequency numbers, bus speeds, and wattages on the home page.
 */

export function parseShortCpu(str, brand = '') {
  if (!str) return brand || 'Processor';
  return str.split('(')[0].trim();
}

export function parseShortGpu(str, brand = '') {
  if (!str) return brand || 'Graphics';
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
  if (!str) return '16GB';
  const m = str.match(/(\d+\s*GB)/i);
  return m ? m[1].toUpperCase() : str.split(' ')[0];
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

export function parseShortChassis(str) {
  if (!str) return 'All-Aluminum';
  if (/carbon/i.test(str)) return 'Carbon Fiber';
  if (/magnesium/i.test(str)) return 'Magnesium Alloy';
  if (/polycarbonate/i.test(str)) return 'Polycarbonate';
  if (/aluminum|aluminium/i.test(str)) return 'All-Aluminum';
  return str.split(' ')[0];
}

export function getShortSpecs(product) {
  if (!product) return {};
  const specs = product.specs || {};
  const existingShort = product.shortSpecs || specs.shortSpecs || {};

  return {
    cpu: existingShort.cpu || parseShortCpu(specs.cpu, product.cpuBrand),
    gpu: existingShort.gpu || parseShortGpu(specs.gpu, product.gpuBrand),
    ram: existingShort.ram || parseShortRam(specs.ram),
    storage: existingShort.storage || parseShortStorage(specs.storage),
    display: existingShort.display || parseShortDisplay(specs.display),
    chassis: existingShort.chassis || parseShortChassis(product.chassis || specs.chassis)
  };
}
