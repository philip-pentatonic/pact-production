/**
 * Formatting utilities for the frontend
 */

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

// Format date
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

// Format date and time
export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

// Format percentage
export function formatPercent(value, decimals = 1) {
  const num = parseFloat(value);
  if (isNaN(num)) return '0%';
  
  return `${num.toFixed(decimals)}%`;
}

// Format currency
export function formatCurrency(amount) {
  const num = parseFloat(amount);
  if (isNaN(num)) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(num);
}

// Get relative time
export function getRelativeTime(dateStr) {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    return 'Just now';
  } catch {
    return '';
  }
}