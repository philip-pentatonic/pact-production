import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { ArrowDownTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { getApiUrl } from '../../config';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { 
  CoverPageTemplate, 
  MetricsPageTemplate, 
  MaterialBreakdownTemplate,
  PDF_WIDTH,
  PDF_HEIGHT
} from './PDFTemplates';

function ReportGeneratorV3() {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: '2025-04-01',
    endDate: '2025-06-30'
  });
  const [reportData, setReportData] = useState(null);
  const [showYTD, setShowYTD] = useState(false);
  const [error, setError] = useState('');

  // PACT Brand Colors - Designer's exact colors
  const PACT_COLORS = {
    primary: '#1C1C1C',      // Black
    secondary: '#2E888D',    // Primary Teal
    accent: '#51ADA5',       // Secondary Teal
    gray: '#C1C1C1',         // Gray
    lightGray: '#DCE4E2',    // Light Gray
    white: '#FFFFFF'         // White
  };

  // Chart colors to match PDF
  const PROGRAM_COLORS = {
    'In-Store/In-Office': '#2E888D',    // Primary Teal
    'Mail-Back': '#51ADA5',             // Secondary Teal
    'Obsolete': '#C1C1C1'               // Gray
  };
  
  const MATERIAL_COLORS = [
    '#2E888D',   // Primary Teal
    '#C1C1C1',   // Gray (80% opacity in design)
    '#ABC8C7',   // Light Teal
    '#DCE4E2',   // Light Gray
    '#7EBFA4',   // Green
    '#51ADA5',   // Secondary Teal
    '#EFD046',   // Yellow
    '#5730DD',   // Purple
    '#1C1C1C',   // Black
    '#E8E8E8',   // Light Gray variant
    '#6BB6A8',   // Green variant
    '#8AC0C3',   // Teal variant
    '#F5DC70',   // Light Yellow
    '#7E5FE2',   // Light Purple
    '#484848'    // Dark Gray
  ];

  useEffect(() => {
    fetchMembers();
    fetchReportData();
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [selectedMember, dateRange, showYTD]);

  const fetchMembers = async () => {
    try {
      const response = await fetch(getApiUrl('/members'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMembers(data.data || data.members || []);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    setError('');
    try {
      // Adjust date range for YTD view
      const adjustedDateRange = showYTD ? {
        startDate: '2025-01-01',
        endDate: '2025-12-31'
      } : dateRange;

      const params = new URLSearchParams({
        member_id: selectedMember === 'all' ? '' : selectedMember,
        start_date: adjustedDateRange.startDate,
        end_date: adjustedDateRange.endDate
      });

      const response = await fetch(getApiUrl(`/analytics/member-report?${params}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Report API response:', result);
        console.log('Report data structure:', {
          summary: result.data?.summary,
          programTypes: result.data?.programTypes,
          materialBreakdown: result.data?.materialBreakdown,
          monthlyBreakdown: result.data?.monthlyBreakdown
        });
        const processedData = processReportDataForTrevor(result.data || result);
        console.log('Processed report data:', processedData);
        setReportData(processedData);
      } else {
        setError('Failed to fetch report data');
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      setError('Error loading report data');
    } finally {
      setLoading(false);
    }
  };

  const processReportDataForTrevor = (data) => {
    if (!data) {
      console.error('No data provided to processReportDataForTrevor');
      return null;
    }
    
    // Process program types (map our program_type to Trevor categories)
    const programTypeMapping = {
      'drop-off': 'In-Store/In-Office',
      'mail-back': 'Mail-Back',
      'obsolete': 'Obsolete'
    };

    // Calculate program type totals
    const programTypeTotals = {};
    let programTypeWeight = 0;
    
    (data.programTypes || []).forEach(item => {
      const mappedType = programTypeMapping[item.program] || 'In-Store/In-Office';
      if (!programTypeTotals[mappedType]) {
        programTypeTotals[mappedType] = 0;
      }
      programTypeTotals[mappedType] += item.weight || 0;
      programTypeWeight += item.weight || 0;
    });

    // Ensure all program types are present
    const programTypeData = [
      { name: 'In-Store/In-Office', value: programTypeTotals['In-Store/In-Office'] || 0 },
      { name: 'Mail-Back', value: programTypeTotals['Mail-Back'] || 0 },
      { name: 'Obsolete', value: programTypeTotals['Obsolete'] || 0 }
    ];

    // Process material breakdown - match Trevor categories exactly
    const materialMapping = {
      'PET': 'PET',
      'HDPE': 'HDPE', 
      'PVC': 'PVC',
      'LDPE': 'LDPE',
      'PP': 'PP',
      'PS': 'PS',
      'OTHER_PLASTIC': 'Other',
      'PAPER': 'Paper (mixed paper + cardboard)',
      'GLASS': 'Glass',
      'METAL': 'Metal',
      'SILICONE': 'Silicone',
      'CERAMIC': 'Ceramic',
      'CONTAMINATED': 'Contaminated/mixed material [W2E + W2C]',
      'MISC': 'Mis. Recyclable Material'
    };

    console.log('Raw material breakdown:', data.materialBreakdown);
    const materialData = (data.materialBreakdown || []).map(item => ({
      name: materialMapping[item.material_type] || item.material_type,
      value: item.weight_lbs || 0,
      code: item.material_type
    }));
    console.log('Processed material data:', materialData);

    // Process yearly data
    const yearlyData = [];
    const yearTotals = {};
    
    (data.monthlyBreakdown || []).forEach(item => {
      const year = item.month.substring(0, 4);
      if (!yearTotals[year]) {
        yearTotals[year] = 0;
      }
      yearTotals[year] += item.weight_lbs || 0;
    });

    Object.keys(yearTotals).sort().forEach(year => {
      yearlyData.push({
        year: year,
        weight: yearTotals[year]
      });
    });

    const processedData = {
      ...data,
      totalWeight: data.summary?.total_weight_lbs || 0,
      totalPackages: data.summary?.total_packages || 0,
      activeStores: data.summary?.active_stores || 0,
      programTypeData,
      programTypeTable: programTypeData.map(d => ({
        type: `Total ${d.name} Volume`,
        value: d.value
      })),
      materialData,
      materialTable: materialData.sort((a, b) => b.value - a.value),
      yearlyData,
      quarterlyData: [{
        quarter: 'Q1',
        weight: data.summary?.total_weight_lbs || 0
      }]
    };
    
    console.log('Final processed data:', {
      totalWeight: processedData.totalWeight,
      summary: data.summary,
      materialDataCount: processedData.materialData.length,
      totalMaterialWeight: processedData.materialData.reduce((sum, m) => sum + m.value, 0)
    });
    
    return processedData;
  };

  const getChartCaptureOptions = (element) => ({
    scale: 1.0,
    logging: false,
    useCORS: true,
    allowTaint: false,
    foreignObjectRendering: false,
    windowWidth: 1100,
    width: 1100,
    height: element.scrollHeight + 100,
    scrollX: 0,
    scrollY: 0,
    onclone: (clonedDoc) => {
      const clonedEl = clonedDoc.getElementById('report-content');
      if (clonedEl) {
        clonedEl.style.width = '1100px';
        clonedEl.style.minHeight = (element.scrollHeight + 100) + 'px';
        clonedEl.classList.add('pdf-export');
        
        // Hide footer notes
        const footer = clonedEl.querySelector('.bg-gray-100');
        if (footer) footer.style.display = 'none';
        
        // Force all charts to render with explicit dimensions
        const chartContainers = clonedEl.querySelectorAll('.recharts-responsive-container');
        chartContainers.forEach((container, index) => {
          container.style.position = 'relative';
          container.style.width = '100%';
          container.style.overflow = 'visible';
          container.style.marginBottom = '30px';
          
          // Set explicit heights based on original
          if (container.style.height.includes('420')) {
            container.style.height = '450px';
            container.style.minHeight = '450px';
          } else if (container.style.height.includes('380')) {
            container.style.height = '410px';
            container.style.minHeight = '410px';
          } else if (container.style.height.includes('350')) {
            container.style.height = '380px';
            container.style.minHeight = '380px';
          } else if (container.style.height.includes('280')) {
            container.style.height = '310px';
            container.style.minHeight = '310px';
          } else {
            container.style.height = '350px';
            container.style.minHeight = '350px';
          }
          
          const svg = container.querySelector('svg');
          if (svg) {
            svg.style.overflow = 'visible';
            svg.style.width = '100%';
            svg.style.height = '100%';
          }
        });
      }
    }
  });

  const generatePDF = async (includeYTD = true) => {
    const pdf = new jsPDF('landscape', 'px', [PDF_WIDTH, PDF_HEIGHT]);
    
    // Store original state
    const originalShowYTD = showYTD;
    
    // Create a temporary container for rendering
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    document.body.appendChild(tempContainer);
    
    try {
      const memberName = selectedMember === 'all' ? 'All Programs' : members.find(m => m.id == selectedMember)?.name || 'Program';
      
      // Determine quarter and proper date range for display
      let quarter, displayDateRange;
      
      if (showYTD) {
        quarter = 'YTD';
        displayDateRange = { startDate: '2025-01-01', endDate: '2025-03-31' };
      } else {
        // Calculate quarter from end date
        const endDate = new Date(dateRange.endDate);
        const month = endDate.getMonth();
        const year = endDate.getFullYear();
        const q = Math.floor(month / 3) + 1;
        quarter = `Q${q}`;
        
        // Set proper quarter dates
        const quarterStart = new Date(year, (q - 1) * 3, 1);
        const quarterEnd = new Date(year, q * 3, 0); // Last day of quarter
        
        displayDateRange = {
          startDate: quarterStart.toISOString().split('T')[0],
          endDate: quarterEnd.toISOString().split('T')[0]
        };
      }
      
      // PAGE 1: Cover Page
      const coverPage = document.createElement('div');
      tempContainer.appendChild(coverPage);
      const coverRoot = ReactDOM.createRoot(coverPage);
      coverRoot.render(
        <CoverPageTemplate 
          memberName={memberName}
          dateRange={displayDateRange}
          quarter={quarter}
        />
      );
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const coverCanvas = await html2canvas(coverPage, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      const coverImg = coverCanvas.toDataURL('image/png');
      pdf.addImage(coverImg, 'PNG', 0, 0, PDF_WIDTH, PDF_HEIGHT, '', 'FAST');
      
      // PAGE 2: All Time Metrics
      pdf.addPage();
      tempContainer.innerHTML = '';
      
      const metricsPage = document.createElement('div');
      tempContainer.appendChild(metricsPage);
      const metricsRoot = ReactDOM.createRoot(metricsPage);
      
      const allTimeMetrics = [
        { label: 'TOTAL MATERIAL LBS', value: reportData.totalWeight },
        { label: 'TOTAL BINS RECEIVED', value: reportData.totalPackages || 0 },
        { label: 'ACTIVE STORE LOCATIONS', value: reportData.activeStores || 0 }
      ];
      
      const allTimeStartDate = new Date(dateRange.startDate);
      const allTimeEndDate = new Date(dateRange.endDate);
      const formatDateRange = (start, end) => {
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        return `${months[start.getMonth()]} ${start.getDate().toString().padStart(2, '0')} ${start.getFullYear()} - ${months[end.getMonth()]} ${end.getDate().toString().padStart(2, '0')} ${end.getFullYear()}`;
      };
      
      metricsRoot.render(
        <MetricsPageTemplate 
          title="PACT COLLECTIVE PROGRAM METRICS"
          subtitle={quarter}
          dateRange={formatDateRange(new Date(displayDateRange.startDate), new Date(displayDateRange.endDate))}
          metrics={allTimeMetrics}
          programData={reportData.programTypeData}
          yearlyData={reportData.yearlyData}
          isYTD={false}
        />
      );
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const metricsCanvas = await html2canvas(metricsPage, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      const metricsImg = metricsCanvas.toDataURL('image/png');
      pdf.addImage(metricsImg, 'PNG', 0, 0, PDF_WIDTH, PDF_HEIGHT, '', 'FAST');
      
      // PAGE 3: Material Breakdown
      pdf.addPage();
      tempContainer.innerHTML = '';
      
      const materialPage = document.createElement('div');
      tempContainer.appendChild(materialPage);
      const materialRoot = ReactDOM.createRoot(materialPage);
      
      materialRoot.render(
        <MaterialBreakdownTemplate 
          title="MATERIAL BREAKDOWN BY TYPE"
          subtitle={quarter}
          dateRange={formatDateRange(new Date(displayDateRange.startDate), new Date(displayDateRange.endDate))}
          materialData={reportData.materialData}
          totalWeight={reportData.totalWeight}
          showFooter={false}
          isYTD={false}
        />
      );
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const materialCanvas = await html2canvas(materialPage, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      const materialImg = materialCanvas.toDataURL('image/png');
      pdf.addImage(materialImg, 'PNG', 0, 0, PDF_WIDTH, PDF_HEIGHT, '', 'FAST');
      
      // PAGE 4 & 5: YTD Data (if needed)
      if (includeYTD) {
        // Fetch YTD data
        const ytdParams = new URLSearchParams({
          member_id: selectedMember === 'all' ? '' : selectedMember,
          start_date: '2025-01-01',
          end_date: '2025-12-31'
        });
        
        const ytdResponse = await fetch(getApiUrl(`/analytics/member-report?${ytdParams}`), {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (ytdResponse.ok) {
          const ytdResult = await ytdResponse.json();
          console.log('YTD API response:', ytdResult);
          const processedYTDData = processReportDataForTrevor(ytdResult.data || ytdResult);
          
          if (!processedYTDData) {
            console.error('Failed to process YTD data');
            return;
          }
          
          console.log('Processed YTD data:', {
            totalWeight: processedYTDData.totalWeight,
            totalPackages: processedYTDData.totalPackages,
            materialCount: processedYTDData.materialData?.length,
            programTypes: processedYTDData.programTypeData
          });
          
          // PAGE 4: YTD Metrics
          pdf.addPage();
          tempContainer.innerHTML = '';
          
          const ytdMetricsPage = document.createElement('div');
          tempContainer.appendChild(ytdMetricsPage);
          const ytdMetricsRoot = ReactDOM.createRoot(ytdMetricsPage);
          
          const ytdMetrics = [
            { label: 'YTD MATERIAL LBS', value: processedYTDData.totalWeight },
            { label: 'YTD BINS RECEIVED', value: processedYTDData.totalPackages || 0 },
            { label: 'ACTIVE STORE LOCATIONS', value: processedYTDData.activeStores || 0 }
          ];
          
          ytdMetricsRoot.render(
            <MetricsPageTemplate 
              title="PACT COLLECTIVE PROGRAM METRICS"
              subtitle="YEAR TO DATE (YTD)"
              dateRange="JAN 01 2025 - MAR 31 2025"
              metrics={ytdMetrics}
              programData={processedYTDData.programTypeData}
              yearlyData={processedYTDData.quarterlyData}
              isYTD={true}
            />
          );
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const ytdMetricsCanvas = await html2canvas(ytdMetricsPage, {
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: true
          });
          
          const ytdMetricsImg = ytdMetricsCanvas.toDataURL('image/png');
          pdf.addImage(ytdMetricsImg, 'PNG', 0, 0, PDF_WIDTH, PDF_HEIGHT, '', 'FAST');
          
          // PAGE 5: YTD Material Breakdown
          pdf.addPage();
          tempContainer.innerHTML = '';
          
          const ytdMaterialPage = document.createElement('div');
          tempContainer.appendChild(ytdMaterialPage);
          const ytdMaterialRoot = ReactDOM.createRoot(ytdMaterialPage);
          
          ytdMaterialRoot.render(
            <MaterialBreakdownTemplate 
              title="YTD MATERIAL BREAKDOWN BY TYPE"
              subtitle="YEAR TO DATE (YTD)"
              dateRange="JAN 01 2025 - MAR 31 2025"
              materialData={processedYTDData.materialData}
              totalWeight={processedYTDData.totalWeight}
              showFooter={true}
              isYTD={true}
            />
          );
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const ytdMaterialCanvas = await html2canvas(ytdMaterialPage, {
            scale: 2,
            logging: false,
            useCORS: true,
            allowTaint: true
          });
          
          const ytdMaterialImg = ytdMaterialCanvas.toDataURL('image/png');
          pdf.addImage(ytdMaterialImg, 'PNG', 0, 0, PDF_WIDTH, PDF_HEIGHT, '', 'FAST');
        }
      }
      
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      // Clean up
      document.body.removeChild(tempContainer);
      
      // Restore original state
      if (includeYTD && originalShowYTD !== showYTD) {
        setShowYTD(originalShowYTD);
      }
    }

    return pdf;
  };

  const getQuarterFromDate = (dateStr) => {
    const date = new Date(dateStr);
    const month = date.getMonth();
    const year = date.getFullYear();
    const quarter = Math.floor(month / 3) + 1;
    return `Q${quarter} ${year}`;
  };

  const handleGeneratePDF = async () => {
    setGenerating(true);
    try {
      const pdf = await generatePDF();
      const memberName = selectedMember === 'all' ? 'All Members' : members.find(m => m.id == selectedMember)?.name || 'Member';
      
      // Determine quarter based on date range
      let quarter;
      if (showYTD) {
        quarter = 'YTD 2025';
      } else {
        // Use end date to determine quarter
        quarter = getQuarterFromDate(dateRange.endDate);
      }
      
      // Format: Member Name_Q2 2025 Report
      const fileName = `${memberName}_${quarter} Report.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Failed to generate PDF');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateAllPDFs = async () => {
    setGenerating(true);
    try {
      const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
      
      // Generate PDFs for each member
      for (const member of members) {
        const params = new URLSearchParams({
          member_id: member.id,
          start_date: showYTD ? '2025-01-01' : dateRange.startDate,
          end_date: showYTD ? '2025-03-31' : dateRange.endDate
        });

        const response = await fetch(getApiUrl(`/analytics/member-report?${params}`), {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const memberData = await response.json();
          const processedData = processReportDataForTrevor(memberData);
          setReportData(processedData);
          
          // Wait for React to re-render
          await delay(500);
          
          // Generate PDF for this member using same approach as single PDF
          const pdf = await generatePDF();
          
          // Save with member-specific filename
          // Determine quarter based on date range
          let quarter;
          if (showYTD) {
            quarter = 'YTD 2025';
          } else {
            // Use end date to determine quarter
            quarter = getQuarterFromDate(dateRange.endDate);
          }
          
          // Format: Member Name_Q2 2025 Report
          const fileName = `${member.name}_${quarter} Report.pdf`;
          pdf.save(fileName);
          
          // Wait between PDFs
          await delay(1000);
        }
      }
      
      // Reset to show all members
      setSelectedMember('all');
      fetchReportData();
    } catch (error) {
      console.error('Error generating PDFs:', error);
      setError('Failed to generate all PDFs');
    } finally {
      setGenerating(false);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(Math.round(num));
  };

  const formatPercent = (value, total) => {
    if (!total || total === 0) return '0%';
    return Math.round((value / total) * 100) + '%';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold">Collection Program Metrics - EXTERNAL</h1>
          <div className="text-sm text-gray-600">
            Last refreshed: {new Date().toLocaleString()}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white shadow-sm p-6 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">View</label>
            <select
              value={showYTD ? 'ytd' : 'all'}
              onChange={(e) => setShowYTD(e.target.value === 'ytd')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Programs (2021-2025)</option>
              <option value="ytd">Year to Date (2025)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Member</label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Programs</option>
              {members.map(member => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
          </div>

          {!showYTD && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </>
          )}

          <div className="flex gap-4">
            <button
              onClick={handleGeneratePDF}
              disabled={generating || !reportData}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md bg-primary-hover disabled:bg-gray-400"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Export Full Report to PDF
            </button>
            
            <button
              onClick={handleGenerateAllPDFs}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:bg-gray-100"
            >
              <DocumentTextIcon className="h-5 w-5" />
              Generate PDFs for All Members
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md m-6">
          {error}
        </div>
      )}

      {/* Report Content */}
      <div id="report-content" className="p-6">
        {reportData && (
          <div className="space-y-4 pdf-sections">
            {/* Title Section */}
            <div className="text-center mb-8 pact-header">
              <h2 className="text-3xl font-bold mb-3" style={{ color: PACT_COLORS.primary, letterSpacing: '0.5px' }}>
                PACT COLLECTIVE PROGRAM METRICS
              </h2>
              <h3 className="text-xl mb-3" style={{ color: PACT_COLORS.secondary }}>
                {selectedMember === 'all' ? 'All Programs' : members.find(m => m.id == selectedMember)?.name || 'Program'}
              </h3>
              <p className="text-lg mb-1" style={{ color: PACT_COLORS.gray }}>
                {showYTD ? 'Year to Date (YTD)' : 'All Time'}
              </p>
              <p className="text-base" style={{ color: PACT_COLORS.gray }}>
                {showYTD ? 'January 1, 2025 - March 31, 2025' : `${new Date(dateRange.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} - ${new Date(dateRange.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`}
              </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 rounded-lg" style={{ backgroundColor: PACT_COLORS.lightGray }}>
                <div className="text-3xl font-bold" style={{ color: PACT_COLORS.secondary }}>{formatNumber(reportData.totalWeight)}</div>
                <div className="mt-1 text-sm font-medium" style={{ color: PACT_COLORS.gray }}>
                  {showYTD ? 'YTD' : 'TOTAL'} MATERIAL LBS
                </div>
              </div>
              <div className="text-center p-4 rounded-lg" style={{ backgroundColor: PACT_COLORS.lightGray }}>
                <div className="text-3xl font-bold" style={{ color: PACT_COLORS.secondary }}>{formatNumber(reportData.totalPackages || 0)}</div>
                <div className="mt-1 text-sm font-medium" style={{ color: PACT_COLORS.gray }}>
                  {showYTD ? 'YTD' : 'TOTAL'} BINS RECEIVED
                </div>
              </div>
              <div className="text-center p-4 rounded-lg" style={{ backgroundColor: PACT_COLORS.lightGray }}>
                <div className="text-3xl font-bold" style={{ color: PACT_COLORS.secondary }}>{formatNumber(reportData.activeStores || 0)}</div>
                <div className="mt-1 text-sm font-medium" style={{ color: PACT_COLORS.gray }}>
                  ACTIVE STORE LOCATIONS
                </div>
              </div>
            </div>

            {/* Program Type & Yearly Data - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Program Type Section - Left Half */}
              <div className="rounded-lg border p-6" style={{ borderColor: PACT_COLORS.lightGray }}>
                <h3 className="font-semibold mb-4 text-lg uppercase text-center" style={{ color: PACT_COLORS.primary }}>
                  {showYTD ? 'YTD' : 'Total'} Material lbs by Program
                </h3>
                
                {/* Program Type Chart */}
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <Pie
                      data={reportData.programTypeData.filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={100}
                      dataKey="value"
                      labelLine={false}
                      label={({ value }) => `${formatPercent(value, reportData.totalWeight)}`}
                    >
                      {reportData.programTypeData.filter(d => d.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PROGRAM_COLORS[entry.name]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [formatNumber(value) + ' lbs', 'Weight']} />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Program Legend */}
                <div className="mt-4 space-y-2">
                  {reportData.programTypeData.filter(d => d.value > 0).map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: PROGRAM_COLORS[entry.name] }}></div>
                        <span className="text-sm font-medium">{entry.name}</span>
                      </div>
                      <span className="text-sm font-bold">
                        {formatNumber(entry.value)} lbs ({formatPercent(entry.value, reportData.totalWeight)})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Yearly/Quarterly Chart - Right Half */}
              <div className="rounded-lg border p-6" style={{ borderColor: PACT_COLORS.lightGray }}>
                <h3 className="font-semibold mb-4 text-lg uppercase text-center" style={{ color: PACT_COLORS.primary }}>
                  {showYTD ? 'Material by Quarter' : 'Material lbs by Year'}
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  {showYTD ? (
                    <BarChart data={reportData.quarterlyData} layout="horizontal" margin={{ top: 20, right: 80, bottom: 20, left: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={(value) => formatNumber(value)} />
                      <YAxis dataKey="quarter" type="category" width={60} />
                      <Tooltip formatter={(value) => [formatNumber(value) + ' lbs', 'Weight']} />
                      <Bar dataKey="weight" fill={PACT_COLORS.secondary} radius={[0, 4, 4, 0]}>
                        <LabelList 
                          dataKey="weight" 
                          position="right"
                          formatter={(value) => formatNumber(value)}
                          style={{ fill: PACT_COLORS.primary, fontSize: '12px', fontWeight: 'bold' }}
                        />
                      </Bar>
                    </BarChart>
                  ) : (
                    <BarChart data={reportData.yearlyData} margin={{ top: 40, right: 30, bottom: 40, left: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(value) => formatNumber(value)} />
                      <Tooltip formatter={(value) => [formatNumber(value) + ' lbs', 'Weight']} />
                      <Bar dataKey="weight" fill={PACT_COLORS.secondary} radius={[4, 4, 0, 0]}>
                        <LabelList 
                          dataKey="weight" 
                          position="top"
                          formatter={(value) => formatNumber(value)}
                          style={{ fill: PACT_COLORS.primary, fontSize: '12px', fontWeight: 'bold' }}
                        />
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>


            {/* Material Breakdown - Side by Side Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Material Chart - Left 3/5 */}
              <div className="lg:col-span-3 rounded-lg border p-6" style={{ borderColor: PACT_COLORS.lightGray }}>
                <h3 className="font-semibold mb-4 text-lg uppercase text-center" style={{ color: PACT_COLORS.primary }}>
                  {showYTD ? 'YTD' : ''} Material Breakdown by Type
                </h3>
                <ResponsiveContainer width="100%" height={380}>
                  <PieChart margin={{ top: 30, right: 30, bottom: 30, left: 30 }}>
                    <Pie
                      data={reportData.materialData.filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={140}
                      dataKey="value"
                      labelLine={false}
                      label={({ value }) => {
                        const percent = formatPercent(value, reportData.totalWeight);
                        return parseInt(percent) >= 5 ? percent : ''; // Only show labels for larger slices to avoid clutter
                      }}
                    >
                      {reportData.materialData.filter(d => d.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={MATERIAL_COLORS[index % MATERIAL_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [formatNumber(value) + ' lbs', 'Weight']}
                      labelFormatter={(label) => `Material: ${label}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Material Legend - Right 2/5 - More Space */}
              <div className="lg:col-span-2 rounded-lg border p-4" style={{ borderColor: PACT_COLORS.lightGray }}>
                <h3 className="font-semibold mb-2 text-sm uppercase text-center" style={{ color: PACT_COLORS.primary }}>
                  Legend
                </h3>
                
                {/* Two Column Grid with Proper Vertical Spacing */}
                <div className="material-legend-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', width: '100%'}}>
                  {reportData.materialData.filter(d => d.value > 0).map((entry, idx) => (
                    <div key={idx} className="legend-item" style={{display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 4px', minHeight: '32px'}}>
                      <div 
                        className="w-3 h-3 rounded-sm flex-shrink-0" 
                        style={{ backgroundColor: MATERIAL_COLORS[idx % MATERIAL_COLORS.length] }}
                      ></div>
                      <div className="legend-text" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1, minWidth: 0, gap: '6px'}}>
                        <div className="text-sm font-medium" style={{ color: PACT_COLORS.primary }}>
                          {entry.name}
                        </div>
                        <div className="text-sm font-bold flex-shrink-0" style={{ color: PACT_COLORS.secondary }}>
                          {formatPercent(entry.value, reportData.totalWeight)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Notes */}
            <div className="bg-gray-100 rounded-lg p-3 text-xs text-gray-600 mt-6">
              <p className="mb-1">
                * Contaminated Beauty Items includes packaging with too much leftover goop to be recycled or packaging collected via obsolete inventory with leftover product that can't be reused; this material is sent waste-to-energy or waste-to-concrete.
              </p>
              <p className="mb-1">
                * Reuse/ Product Reclamation includes full and/or regulated product that our collection partner can repurpose for other uses (e.g. cleaning products).
              </p>
              <p>
                * #7 Other includes packaging with fused mixed material, unidentifiable plastic types, and/ or not fitting into one of the first six categories.
              </p>
            </div>

            <div className="text-center text-xs mt-3" style={{ color: PACT_COLORS.gray }}>
              Have questions? Reach out to us at{' '}
              <a href="mailto:hello@pactcollective.org" style={{ color: PACT_COLORS.secondary, textDecoration: 'underline' }}>
                hello@pactcollective.org
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportGeneratorV3;