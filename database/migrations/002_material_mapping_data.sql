-- Material Mapping Data Migration
-- Populates the material categorization mapping table

-- Clear existing mappings
DELETE FROM pact_material_mapping;

-- Insert material mappings from PACT categorization spreadsheet
-- Plastic materials
INSERT INTO pact_material_mapping (current_category, new_category, dashboard_label, is_recyclable, is_contamination, contamination_type) VALUES
('PET', 'PET', 'Plastic', 1, 0, NULL),
('HDPE', 'HDPE', 'Plastic', 1, 0, NULL),
('PP', 'PP', 'Plastic', 1, 0, NULL),
('LDPE', 'LDPE', 'Plastic', 1, 0, NULL),
('PS', 'PS', 'Plastic', 1, 0, NULL),
('Other Plastics', 'Other Plastics', 'Plastic', 1, 0, NULL),
('PETG', 'PETG', 'Plastic', 1, 0, NULL),
('Acrylic', 'Acrylic', 'Plastic', 1, 0, NULL),
('ABS', 'ABS', 'Plastic', 1, 0, NULL),
('PC (Polycarbonate)', 'PC', 'Plastic', 1, 0, NULL),
('Tritan', 'Tritan', 'Plastic', 1, 0, NULL),
('Silicone', 'Silicone', 'Specialty Materials', 1, 0, NULL),

-- Paper materials (consolidated per Ali's guidance)
('Corrugated Cardboard', 'Paper/Cardboard', 'Paper', 1, 0, NULL),
('Mixed Paper', 'Paper/Cardboard', 'Paper', 1, 0, NULL),
('Molded Paper Pulp', 'Paper/Cardboard', 'Paper', 1, 0, NULL),
('Paperboard', 'Paper/Cardboard', 'Paper', 1, 0, NULL),

-- Metal materials
('Aluminum', 'Aluminum', 'Metal', 1, 0, NULL),
('Steel', 'Steel', 'Metal', 1, 0, NULL),
('Tin', 'Tin', 'Metal', 1, 0, NULL),

-- Glass materials
('Glass', 'Glass', 'Glass', 1, 0, NULL),

-- Specialty materials
('Rubber', 'Rubber', 'Specialty Materials', 1, 0, NULL),
('Cork', 'Cork', 'Specialty Materials', 1, 0, NULL),
('Wood', 'Wood', 'Specialty Materials', 1, 0, NULL),
('Natural Sponge', 'Natural Sponge', 'Specialty Materials', 1, 0, NULL),
('Fibers/Fabrics/Textiles', 'Fibers/Fabrics/Textiles', 'Specialty Materials', 1, 0, NULL),

-- Other materials
('Other', 'Other', 'Other', 1, 0, NULL),
('Unknown', 'Unknown', 'Other', 1, 0, NULL),
('Multi-material', 'Multi-material', 'Other', 1, 0, NULL),
('Mirrors (glass)', 'Mirrors', 'Other', 1, 0, NULL),

-- Contamination - Non-Beauty Items
('Candy', 'Non-Beauty Contamination', 'Contamination', 0, 1, 'Non-Beauty Items'),
('Clothing', 'Non-Beauty Contamination', 'Contamination', 0, 1, 'Non-Beauty Items'),
('Electronics', 'Non-Beauty Contamination', 'Contamination', 0, 1, 'Non-Beauty Items'),
('Food', 'Non-Beauty Contamination', 'Contamination', 0, 1, 'Non-Beauty Items'),
('Personal Items', 'Non-Beauty Contamination', 'Contamination', 0, 1, 'Non-Beauty Items'),
('Jewelry', 'Non-Beauty Contamination', 'Contamination', 0, 1, 'Non-Beauty Items'),
('Medicine/Pharmaceutical', 'Non-Beauty Contamination', 'Contamination', 0, 1, 'Non-Beauty Items'),
('Toys', 'Non-Beauty Contamination', 'Contamination', 0, 1, 'Non-Beauty Items'),
('Other Non-Beauty', 'Non-Beauty Contamination', 'Contamination', 0, 1, 'Non-Beauty Items'),
('Unknown Non-Beauty', 'Non-Beauty Contamination', 'Contamination', 0, 1, 'Non-Beauty Items'),

-- Contamination - Contaminated Beauty Items  
('Contaminated Beauty Items', 'Beauty Contamination', 'Contamination', 0, 1, 'Contaminated Beauty Items'),
('Aerosols', 'Beauty Contamination', 'Contamination', 0, 1, 'Contaminated Beauty Items'),
('Nail Polish', 'Beauty Contamination', 'Contamination', 0, 1, 'Contaminated Beauty Items'),
('Perfume', 'Beauty Contamination', 'Contamination', 0, 1, 'Contaminated Beauty Items');