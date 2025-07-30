/**
 * G2 Data Processor Service
 * Processes PACT shipment data from G2 uploads
 */

import { generateUniqueId } from '../utils/helpers.js';

// Process PACT data from G2 upload
export async function processPactData(db, uploadId, records) {
  const stats = {
    total: records.length,
    processed: 0,
    successful: 0,
    failed: 0,
    zeroWeightSkipped: 0,
    errors: []
  };

  try {
    // Get material mapping
    const mappingStmt = db.prepare(`
      SELECT * FROM pact_material_mapping
    `);
    const mappingResults = await mappingStmt.all();
    const materialMap = new Map(
      mappingResults.results.map(m => [
        m.current_category.toLowerCase(),
        m
      ])
    );

    // Process records in batches
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      for (const record of batch) {
        try {
          await processRecord(db, uploadId, record, materialMap);
          stats.successful++;
        } catch (error) {
          stats.failed++;
          stats.errors.push({
            record_id: record.Barcode || record.unique_id,
            error: error.message
          });
        }
        stats.processed++;
      }

      // Update progress
      await db.prepare(`
        UPDATE g2_uploads 
        SET records_processed = ?,
            errors_count = ?
        WHERE id = ?
      `).bind(stats.processed, stats.failed, uploadId).run();
    }

    // Mark upload as completed
    await db.prepare(`
      UPDATE g2_uploads 
      SET status = 'completed',
          completed_at = datetime('now'),
          error_details = ?
      WHERE id = ?
    `).bind(
      stats.errors.length > 0 ? JSON.stringify(stats.errors) : null,
      uploadId
    ).run();

  } catch (error) {
    // Mark upload as failed
    await db.prepare(`
      UPDATE g2_uploads 
      SET status = 'failed',
          completed_at = datetime('now'),
          error_details = ?
      WHERE id = ?
    `).bind(
      JSON.stringify({ error: error.message, stats }),
      uploadId
    ).run();
  }

  return stats;
}

// Process individual record
async function processRecord(db, uploadId, record, materialMap) {
  // Skip zero weight records (per business rules)
  const weight = parseFloat(record.weight_lb || record.Weight || 0);
  if (weight === 0) {
    return;
  }

  // Generate unique ID if needed
  const uniqueId = record.unique_id || generateUniqueId(record);
  const year = parseInt(record.Year || new Date().getFullYear());

  // Map material type
  const currentMaterial = (record.CurrentMaterial || record.Material || '').toLowerCase();
  const materialMapping = materialMap.get(currentMaterial) || {
    dashboard_label: 'Other',
    is_contamination: 0,
    contamination_type: null
  };

  // Parse dates
  const shippingDate = parseDate(record.shipping_date || record.ShippingDate);
  const processedDate = parseDate(record.processed_date || record.ProcessedDate);

  // Prepare shipment data
  const shipmentData = {
    unique_id: uniqueId,
    pact_id: record.pact_id || record.PactID,
    tracking_number: record.Inbound || record.TrackingNumber,
    member_id: await getMemberId(db, record),
    store_id: await getStoreId(db, record),
    program_id: await getProgramId(db, record),
    shipping_date: shippingDate,
    processed_date: processedDate,
    inbound_tracking: record.Inbound,
    outbound_tracking: record.Outbound,
    carrier: record.Carrier || 'UPS',
    material_type: record.NewMaterial || currentMaterial,
    material_dashboard_label: materialMapping.dashboard_label,
    weight_lbs: weight,
    recycled_pieces: parseInt(record.RecycledPieces || 0),
    donated_pieces: parseInt(record.DonatedPieces || 0),
    city: record.City,
    state: record.State,
    postal_code: record['Postal Code'] || record.PostalCode,
    full_address: record.FullAddress,
    package_key: generatePackageKey(record),
    is_contamination: materialMapping.is_contamination,
    contamination_type: materialMapping.contamination_type,
    has_missing_shipping_date: !shippingDate,
    needs_unique_id_generation: !record.unique_id && year < 2024,
    year: year,
    box_type: record.BoxType,
    status: 'processed',
    import_batch: uploadId,
    original_data: JSON.stringify(record)
  };

  // Insert shipment record
  const stmt = db.prepare(`
    INSERT INTO pact_shipments (
      unique_id, pact_id, tracking_number, member_id, store_id, program_id,
      shipping_date, processed_date, inbound_tracking, outbound_tracking, carrier,
      material_type, material_dashboard_label, weight_lbs, recycled_pieces, donated_pieces,
      city, state, postal_code, full_address,
      package_key, is_contamination, contamination_type,
      has_missing_shipping_date, needs_unique_id_generation,
      year, box_type, status, import_batch, original_data,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now')
    )
  `);

  await stmt.bind(
    shipmentData.unique_id,
    shipmentData.pact_id,
    shipmentData.tracking_number,
    shipmentData.member_id,
    shipmentData.store_id,
    shipmentData.program_id,
    shipmentData.shipping_date,
    shipmentData.processed_date,
    shipmentData.inbound_tracking,
    shipmentData.outbound_tracking,
    shipmentData.carrier,
    shipmentData.material_type,
    shipmentData.material_dashboard_label,
    shipmentData.weight_lbs,
    shipmentData.recycled_pieces,
    shipmentData.donated_pieces,
    shipmentData.city,
    shipmentData.state,
    shipmentData.postal_code,
    shipmentData.full_address,
    shipmentData.package_key,
    shipmentData.is_contamination,
    shipmentData.contamination_type,
    shipmentData.has_missing_shipping_date ? 1 : 0,
    shipmentData.needs_unique_id_generation ? 1 : 0,
    shipmentData.year,
    shipmentData.box_type,
    shipmentData.status,
    shipmentData.import_batch,
    shipmentData.original_data
  ).run();
}

// Helper functions
function parseDate(dateStr) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toISOString();
  } catch {
    return null;
  }
}

function generatePackageKey(record) {
  const barcode = record.Barcode || '';
  const uniqueId = record.unique_id || generateUniqueId(record);
  return `${barcode}_${uniqueId}`;
}

async function getMemberId(db, record) {
  const memberName = record.Retailer || record.Member || record.RetailerName;
  if (!memberName) return null;

  const result = await db.prepare(`
    SELECT id FROM members WHERE name = ? OR code = ?
  `).bind(memberName, memberName).first();

  return result?.id || null;
}

async function getStoreId(db, record) {
  const storeName = record.Store || record.StoreName || record.StoreLocation;
  const memberId = await getMemberId(db, record);
  
  if (!storeName || !memberId) return null;

  const result = await db.prepare(`
    SELECT id FROM stores 
    WHERE member_id = ? AND (store_name = ? OR store_code = ?)
  `).bind(memberId, storeName, storeName).first();

  return result?.id || null;
}

async function getProgramId(db, record) {
  const programName = record.Program || record.ProgramType || record.ProgramName;
  if (!programName) return null;

  const result = await db.prepare(`
    SELECT id FROM program_types WHERE name = ? OR code = ?
  `).bind(programName, programName).first();

  return result?.id || null;
}