// Centralized formatting utilities for consistent display across the application

/**
 * Format number with commas for thousands separator
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} Formatted number with commas
 */
export const formatNumberWithCommas = (num, decimals = 0) => {
  if (num == null || num === undefined || isNaN(num)) return '0';
  const value = parseFloat(num);
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * Format weight with proper decimal places and unit
 * @param {number} weight - Weight value
 * @param {string} unit - Unit (lbs, kg, etc.)
 * @param {number} decimals - Number of decimal places (default: 2)
 * @param {boolean} useCommas - Whether to use comma separators (default: true)
 * @returns {string} Formatted weight with unit
 */
export const formatWeight = (weight, unit = 'lbs', decimals = 2, useCommas = true) => {
  if (weight == null || weight === undefined || isNaN(weight)) return `0.00 ${unit}`;
  const value = parseFloat(weight);
  const formatted = useCommas 
    ? value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : value.toFixed(decimals);
  return `${formatted} ${unit}`;
};

/**
 * Format large numbers with K/M suffixes
 * @param {number} num - Number to format
 * @param {number} decimals - Decimal places (default: 1)
 * @returns {string} Formatted number
 */
export const formatLargeNumber = (num, decimals = 1) => {
  if (num == null || num === undefined || isNaN(num)) return '0';
  const value = parseFloat(num);
  if (value >= 1000000) return `${(value / 1000000).toFixed(decimals)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(decimals)}K`;
  return value.toFixed(0);
};

/**
 * Format percentage with consistent decimal places
 * @param {number} value - Percentage value (0-1 or 0-100)
 * @param {boolean} isDecimal - True if value is 0-1, false if 0-100
 * @param {number} decimals - Decimal places (default: 1)
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, isDecimal = true, decimals = 1) => {
  if (value == null || value === undefined || isNaN(value)) return '0.0%';
  const percentage = isDecimal ? value * 100 : value;
  return `${percentage.toFixed(decimals)}%`;
};

/**
 * Format contamination rate with appropriate color coding class
 * @param {number} rate - Contamination rate (0-1)
 * @returns {object} {text: string, className: string}
 */
export const formatContaminationRate = (rate) => {
  if (rate == null || rate === undefined || isNaN(rate)) {
    return { text: '0.0%', className: 'text-green-600' };
  }
  
  const percentage = rate * 100;
  const text = `${percentage.toFixed(1)}%`;
  
  let className;
  if (percentage < 3) className = 'text-green-600';
  else if (percentage < 5) className = 'text-yellow-600';
  else className = 'text-red-600';
  
  return { text, className };
};

/**
 * Format duration in minutes to human readable format
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration
 */
export const formatDuration = (minutes) => {
  if (!minutes || isNaN(minutes)) return 'N/A';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

/**
 * Format file size in bytes to human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes || isNaN(bytes)) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

/**
 * Format chart tooltip values consistently
 * @param {number} value - Value to format
 * @param {string} unit - Unit to append
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted value for tooltip
 */
export const formatChartValue = (value, unit = '', decimals = 1) => {
  if (value == null || value === undefined || isNaN(value)) return `0${unit ? ' ' + unit : ''}`;
  return `${parseFloat(value).toFixed(decimals)}${unit ? ' ' + unit : ''}`;
};

/**
 * Standard tooltip style for charts
 */
export const standardTooltipStyle = {
  backgroundColor: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '6px',
  fontSize: '12px',
  padding: '8px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
}; 