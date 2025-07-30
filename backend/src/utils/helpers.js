/**
 * Helper Utilities
 */

// Generate unique ID for PACT records
export function generateUniqueId(record) {
  // For pre-2024 data without unique IDs
  const retailer = record.Retailer || record.Member || 'UNKNOWN';
  const store = record.Store || record.StoreName || 'UNKNOWN';
  const date = record.shipping_date || record.processed_date || new Date().toISOString();
  const material = record.Material || record.CurrentMaterial || 'UNKNOWN';
  const weight = record.weight_lb || record.Weight || '0';
  
  // Create a deterministic ID based on available fields
  const components = [
    retailer,
    store,
    date.substring(0, 10), // Just date part
    material,
    weight
  ].map(s => String(s).replace(/[^a-zA-Z0-9]/g, ''));
  
  return `PACT_${components.join('_')}_${Date.now()}`;
}

// Validate weight limits based on program type
export function validateWeight(weight, programType) {
  const weightLbs = parseFloat(weight);
  
  if (isNaN(weightLbs) || weightLbs <= 0) {
    return { valid: false, reason: 'Invalid weight value' };
  }
  
  // Different limits for different program types
  const limits = {
    retail: 40,
    bulk: 50000,
    inventory: 50000,
    default: 40
  };
  
  const programLower = (programType || '').toLowerCase();
  let limit = limits.default;
  
  if (programLower.includes('bulk') || programLower.includes('inventory')) {
    limit = limits.bulk;
  } else if (programLower.includes('retail')) {
    limit = limits.retail;
  }
  
  if (weightLbs > limit) {
    return { 
      valid: false, 
      reason: `Weight ${weightLbs} lbs exceeds ${programType} limit of ${limit} lbs` 
    };
  }
  
  return { valid: true };
}

// Calculate contamination rate for a package
export function calculateContaminationRate(records) {
  if (!records || records.length === 0) return 0;
  
  const totalWeight = records.reduce((sum, r) => sum + parseFloat(r.weight_lbs || 0), 0);
  const contaminationWeight = records
    .filter(r => r.is_contamination)
    .reduce((sum, r) => sum + parseFloat(r.weight_lbs || 0), 0);
  
  if (totalWeight === 0) return 0;
  
  return (contaminationWeight / totalWeight) * 100;
}

// Format date for display
export function formatDate(dateStr) {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

// Format number with commas
export function formatNumber(num) {
  return Number(num).toLocaleString('en-US');
}

// Format weight with unit
export function formatWeight(weight) {
  const lbs = parseFloat(weight);
  if (isNaN(lbs)) return '0 lbs';
  
  return `${formatNumber(lbs.toFixed(2))} lbs`;
}

// Calculate days between dates
export function daysBetween(date1, date2) {
  if (!date1 || !date2) return null;
  
  try {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch {
    return null;
  }
}