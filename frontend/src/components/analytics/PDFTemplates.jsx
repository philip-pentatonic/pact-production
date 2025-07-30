import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import pactLogo from '../../assets/images/PactpoweredbyPentatonicmono_white.png';

// PDF Page dimensions (A4 Landscape in pixels at 96 DPI)
export const PDF_WIDTH = 1123; // 297mm
export const PDF_HEIGHT = 794;  // 210mm

// Brand Colors
export const COLORS = {
  primary: '#1C1C1C',      // Black
  secondary: '#2E888D',    // Primary Teal
  accent: '#51ADA5',       // Secondary Teal
  gray: '#C1C1C1',         // Gray
  lightGray: '#DCE4E2',    // Light Gray
  white: '#FFFFFF'         // White
};

// Material Colors - matching designer's exact colors
export const MATERIAL_COLORS = [
  '#73B5B2',   // Light Teal (36% - PET)
  '#9AC5C4',   // Lighter Teal (39% - HDPE)
  '#C4DAD9',   // Very Light Teal (27% - PP)
  '#E4EDEC',   // Almost White (22% - LDPE)
  '#F5D95A',   // Yellow (1% - PVC)
  '#2E888D',   // Primary Teal (3% - PS)
  '#51ADA5',   // Secondary Teal
  '#5730DD',   // Purple (Other Plastic)
  '#C1C1C1',   // Gray (Other)
  '#DCE4E2',   // Light Gray
  '#7EBFA4',   // Green
  '#1C1C1C',   // Black
  '#E8E8E8',   // Light Gray variant
  '#6BB6A8',   // Green variant
  '#8AC0C3'    // Teal variant
];

// Program Colors
export const PROGRAM_COLORS = {
  'In-Store/In-Office': '#2E888D',    // Primary Teal
  'Mail-Back': '#51ADA5',             // Secondary Teal
  'Obsolete': '#C1C1C1'               // Gray
};

// Cover Page Template
export const CoverPageTemplate = ({ memberName, dateRange }) => {
  const formatDateShort = (date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate().toString().padStart(2, '0')} ${date.getFullYear()}`;
  };

  const allTimeStartDate = new Date(dateRange.startDate);
  const allTimeEndDate = new Date(dateRange.endDate);

  return (
    <div className="pdf-page cover-page" style={{
      width: `${PDF_WIDTH}px`,
      height: `${PDF_HEIGHT}px`,
      backgroundColor: COLORS.secondary,
      color: COLORS.white,
      position: 'relative',
      fontFamily: 'Inter, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Logo in top right */}
      <div style={{
        position: 'absolute',
        right: '40px',
        top: '30px',
        textAlign: 'right'
      }}>
        {/* High-res logo */}
        <img 
          src={pactLogo}
          alt="pact POWERED BY PENTATONIC"
          style={{
            height: '50px',
            width: 'auto'
          }}
        />
      </div>

      {/* Main content */}
      <div style={{
        position: 'absolute',
        left: '60px',
        top: '50%',
        transform: 'translateY(-50%)',
        maxWidth: '70%'
      }}>
        <h1 style={{
          fontSize: '64px',
          fontWeight: '300',
          margin: '0',
          lineHeight: '1.1',
          letterSpacing: '-1px'
        }}>
          Pact Collective
        </h1>
        <h1 style={{
          fontSize: '64px',
          fontWeight: '300',
          margin: '0',
          lineHeight: '1.1',
          letterSpacing: '-1px',
          marginBottom: '30px'
        }}>
          Program Metrics
        </h1>
        
        <div style={{
          fontSize: '20px',
          fontWeight: '400',
          marginBottom: '20px'
        }}>
          {memberName}
        </div>
        
        <div style={{
          fontSize: '18px',
          fontWeight: '300',
          lineHeight: '1.5'
        }}>
          <div>All Time : {formatDateShort(allTimeStartDate)} - {formatDateShort(allTimeEndDate)}  &</div>
          <div>Year to Date : Jan 01 2025 - March 31 2025</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute',
        bottom: '30px',
        left: '60px',
        right: '60px',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '10px',
        fontWeight: '400',
        letterSpacing: '0.5px',
        textTransform: 'uppercase'
      }}>
        <div>PACT COLLECTIVE PROGRAM METRICS | {memberName.toUpperCase()}</div>
        <div>QUESTIONS? GET IN TOUCH:</div>
        <div>HELLO@PACTCOLLECTIVE.ORG</div>
      </div>
    </div>
  );
};

// Metrics Page Template (Page 2 & 4)
export const MetricsPageTemplate = ({ 
  title, 
  subtitle, 
  dateRange,
  metrics, 
  programData, 
  yearlyData, 
  isYTD = false 
}) => {
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(Math.round(num));
  };

  const formatPercent = (value, total) => {
    if (!total || total === 0) return '0%';
    return Math.round((value / total) * 100) + '%';
  };
  
  // Ensure pie data completes the circle
  const pieData = programData.filter(d => d.value > 0);
  const totalValue = pieData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="pdf-page metrics-page" style={{
      width: `${PDF_WIDTH}px`,
      height: `${PDF_HEIGHT}px`,
      backgroundColor: COLORS.white,
      padding: '40px 60px',
      fontFamily: 'Inter, sans-serif',
      position: 'relative'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '40px'
      }}>
        <div style={{
          fontSize: '12px',
          fontWeight: '400',
          color: COLORS.primary,
          letterSpacing: '0.5px',
          marginBottom: '5px'
        }}>
          PACT COLLECTIVE PROGRAM METRICS
        </div>
        <div style={{
          fontSize: '12px',
          fontWeight: '400',
          color: COLORS.primary,
          letterSpacing: '0.5px',
          marginBottom: '5px'
        }}>
          {subtitle}
        </div>
        {dateRange && (
          <div style={{
            fontSize: '12px',
            fontWeight: '400',
            color: COLORS.primary,
            letterSpacing: '0.5px'
          }}>
            {dateRange}
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {metrics.map((metric, idx) => (
          <div key={idx} style={{
            textAlign: 'center',
            padding: '30px 20px',
            backgroundColor: '#F5F5F5',
            borderRadius: '8px',
            flex: 1
          }}>
            <div style={{
              fontSize: '36px',
              fontWeight: '300',
              fontFamily: 'Poppins, sans-serif',
              color: COLORS.primary,
              marginBottom: '15px',
              lineHeight: '1'
            }}>
              {formatNumber(metric.value)}
            </div>
            <div style={{
              fontSize: '8px',
              color: COLORS.primary,
              fontWeight: '400',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              lineHeight: '1.2'
            }}>
              {metric.label}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{
        display: 'flex',
        gap: '20px',
        height: '400px'
      }}>
        {/* Program Chart */}
        <div style={{ 
          flex: 1,
          border: `1px solid ${COLORS.lightGray}`,
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h3 style={{
            fontSize: '8px',
            fontWeight: '400',
            marginBottom: '20px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: COLORS.primary
          }}>
            {isYTD ? 'YTD' : 'TOTAL'} MATERIAL LBS BY PROGRAM
          </h3>
          <div style={{ height: '200px', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  dataKey="value"
                  labelLine={false}
                  label={false}
                  fill="#8884d8"
                  paddingAngle={0}
                  isAnimationActive={false}
                  startAngle={0}
                  endAngle={360}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PROGRAM_COLORS[entry.name]} stroke="none" strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [formatNumber(value) + ' lbs', 'Weight']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Legend below pie chart */}
          <div style={{ marginTop: '20px' }}>
            {pieData.map((entry, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: PROGRAM_COLORS[entry.name],
                    borderRadius: '50%',
                    flexShrink: 0
                  }} />
                  <span style={{ 
                    fontSize: '8px',
                    textTransform: 'uppercase',
                    color: COLORS.primary,
                    lineHeight: '1',
                    display: 'flex',
                    alignItems: 'center'
                  }}>{entry.name}</span>
                </div>
                <span style={{ 
                  fontSize: '11px',
                  fontWeight: '600',
                  fontFamily: 'Poppins, sans-serif',
                  color: COLORS.primary
                }}>
                  {formatNumber(entry.value)} LBS ({formatPercent(entry.value, metrics[0].value)})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Yearly/Quarterly Chart */}
        <div style={{ 
          flex: 1,
          border: `1px solid ${COLORS.lightGray}`,
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h3 style={{
            fontSize: '8px',
            fontWeight: '400',
            marginBottom: '20px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: COLORS.primary
          }}>
            {isYTD ? 'MATERIAL LBS BY QUARTER' : 'MATERIAL LBS BY YEAR'}
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={yearlyData} margin={{ top: 20, right: 20, bottom: 20, left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.lightGray} />
              <XAxis dataKey={isYTD ? "quarter" : "year"} tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={(value) => formatNumber(value)} tick={{ fontSize: 10 }} />
              <Tooltip formatter={(value) => [formatNumber(value) + ' lbs', 'Weight']} />
              <Bar dataKey="weight" fill={COLORS.secondary} radius={[8, 8, 0, 0]}>
                <LabelList 
                  dataKey="weight" 
                  position="top"
                  formatter={(value) => formatNumber(value)}
                  style={{ fill: COLORS.primary, fontSize: '12px', fontWeight: 'bold' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute',
        bottom: '30px',
        left: '60px',
        right: '60px',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '8px',
        fontWeight: '400',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        color: COLORS.primary
      }}>
        <div>PACT COLLECTIVE PROGRAM METRICS | ALL PROGRAMS</div>
        <div>QUESTIONS? GET IN TOUCH:</div>
        <div>HELLO@PACTCOLLECTIVE.ORG</div>
      </div>
    </div>
  );
};

// Material Breakdown Page Template (Page 3 & 5)
export const MaterialBreakdownTemplate = ({ 
  title, 
  subtitle,
  dateRange,
  materialData, 
  totalWeight,
  showFooter = false,
  isYTD = false 
}) => {
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(Math.round(num));
  };

  const formatPercent = (value, total) => {
    if (!total || total === 0) return '0%';
    return Math.round((value / total) * 100) + '%';
  };

  return (
    <div className="pdf-page material-page" style={{
      width: `${PDF_WIDTH}px`,
      height: `${PDF_HEIGHT}px`,
      backgroundColor: COLORS.white,
      padding: '40px 60px',
      fontFamily: 'Inter, sans-serif',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '40px'
      }}>
        <div style={{
          fontSize: '12px',
          fontWeight: '400',
          color: COLORS.primary,
          letterSpacing: '0.5px',
          marginBottom: '5px'
        }}>
          PACT COLLECTIVE PROGRAM METRICS
        </div>
        <div style={{
          fontSize: '12px',
          fontWeight: '400',
          color: COLORS.primary,
          letterSpacing: '0.5px',
          marginBottom: '5px'
        }}>
          {subtitle}
        </div>
        {dateRange && (
          <div style={{
            fontSize: '12px',
            fontWeight: '400',
            color: COLORS.primary,
            letterSpacing: '0.5px'
          }}>
            {dateRange}
          </div>
        )}
      </div>

      {/* Chart and Legend Container */}
      <div style={{
        display: 'flex',
        gap: '60px',
        flex: 1,
        alignItems: 'center'
      }}>
        {/* Material Chart */}
        <div style={{ flex: '1.5' }}>
          <ResponsiveContainer width="100%" height={450}>
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={materialData.filter(d => d.value > 0)}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={150}
                dataKey="value"
                labelLine={false}
                label={false}
                fill="#8884d8"
                paddingAngle={0}
                isAnimationActive={false}
                startAngle={0}
                endAngle={360}
              >
                {materialData.filter(d => d.value > 0).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={MATERIAL_COLORS[index % MATERIAL_COLORS.length]} stroke="none" strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [formatNumber(value) + ' lbs', 'Weight']}
                labelFormatter={(label) => `Material: ${label}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div style={{ flex: '1' }}>
          <h3 style={{
            fontSize: '10px',
            fontWeight: '400',
            marginBottom: '20px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: COLORS.primary
          }}>
            LEGEND
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px 30px'
          }}>
            {materialData.filter(d => d.value > 0).map((item, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                minWidth: '140px'
              }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  backgroundColor: MATERIAL_COLORS[idx % MATERIAL_COLORS.length],
                  borderRadius: '50%',
                  flexShrink: 0
                }} />
                <span style={{
                  fontSize: '9px',
                  color: COLORS.primary,
                  fontWeight: '400',
                  flex: 1,
                  letterSpacing: '0.2px',
                  textTransform: 'uppercase',
                  lineHeight: '1',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {item.name}
                </span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: '500',
                  color: COLORS.secondary,
                  marginLeft: 'auto',
                  lineHeight: '1',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {formatPercent(item.value, totalWeight)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer notes - only on last page */}
      {showFooter && (
        <>
          <div style={{
            marginTop: '40px',
            paddingTop: '20px'
          }}>
            <p style={{ 
              fontSize: '8px', 
              color: '#333', 
              margin: '0 0 8px 0', 
              lineHeight: '1.4',
              fontWeight: '300'
            }}>
              * Contaminated Beauty Items includes packaging with too much leftover goop to be recycled or packaging collected via obsolete inventory with leftover product that can't be reused; this material is sent waste-to-energy or waste-to-concrete.
            </p>
            <p style={{ 
              fontSize: '8px', 
              color: '#333', 
              margin: '0 0 8px 0', 
              lineHeight: '1.4',
              fontWeight: '300'
            }}>
              * Reuse/ Product Reclamation includes full and/or regulated product that our collection partner can repurpose for other uses (e.g. cleaning products).
            </p>
            <p style={{ 
              fontSize: '8px', 
              color: '#333', 
              margin: '0', 
              lineHeight: '1.4',
              fontWeight: '300'
            }}>
              * #7 Other includes packaging with fused mixed material, unidentifiable plastic types, and/ or not fitting into one of the first six categories.
            </p>
          </div>
        </>
      )}

      {/* Footer - always show */}
      <div style={{
        position: 'absolute',
        bottom: '30px',
        left: '60px',
        right: '60px',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '8px',
        fontWeight: '400',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        color: COLORS.primary
      }}>
        <div>PACT COLLECTIVE PROGRAM METRICS | ALL PROGRAMS</div>
        <div>QUESTIONS? GET IN TOUCH:</div>
        <div>HELLO@PACTCOLLECTIVE.ORG</div>
      </div>
    </div>
  );
};