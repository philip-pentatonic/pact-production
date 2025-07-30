/**
 * CSV Parsing Utilities
 */

// Parse CSV content into array of objects
export function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length === 0) return [];
  
  // Extract headers
  const headers = parseCSVLine(lines[0]);
  
  // Parse data rows
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) continue;
    
    const record = {};
    headers.forEach((header, index) => {
      record[header] = values[index];
    });
    records.push(record);
  }
  
  return records;
}

// Parse single CSV line handling quoted values
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last field
  values.push(current.trim());
  
  return values;
}

// Convert array of objects to CSV string
export function objectsToCSV(objects) {
  if (!objects || objects.length === 0) return '';
  
  // Get headers from first object
  const headers = Object.keys(objects[0]);
  
  // Build CSV lines
  const lines = [headers.map(escapeCSVValue).join(',')];
  
  for (const obj of objects) {
    const values = headers.map(header => {
      const value = obj[header];
      return escapeCSVValue(value);
    });
    lines.push(values.join(','));
  }
  
  return lines.join('\n');
}

// Escape CSV value if needed
function escapeCSVValue(value) {
  if (value === null || value === undefined) return '';
  
  const stringValue = String(value);
  
  // Check if escaping is needed
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    // Escape quotes by doubling them
    const escaped = stringValue.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  
  return stringValue;
}