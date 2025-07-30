import React, { useState, useEffect } from 'react';
import { ArrowDownTrayIcon, DocumentTextIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { getApiUrl } from '../../config';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function ReportGeneratorV2() {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: '2025-01-01',
    endDate: '2025-04-30'
  });
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState('');

  // Chart colors matching PACT brand
  const COLORS = ['#2C5530', '#4A7C59', '#8EBF9F', '#C5E1A5', '#E8F5E9', '#FFB74D', '#FF8A65', '#A1887F'];

  useEffect(() => {
    fetchMembers();
    fetchReportData();
  }, []);

  useEffect(() => {
    if (selectedMember !== 'all') {
      fetchReportData();
    }
  }, [selectedMember]);

  const fetchMembers = async () => {
    try {
      const response = await fetch(getApiUrl('/members'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Members API response:', data);
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
      const params = new URLSearchParams({
        member_id: selectedMember === 'all' ? '' : selectedMember,
        start_date: dateRange.startDate,
        end_date: dateRange.endDate
      });

      const response = await fetch(getApiUrl(`/analytics/report?${params}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Report data received:', data);
        
        // Process data for better visualization
        const processedData = processReportData(data);
        setReportData(processedData);
      } else {
        const errorData = await response.text();
        console.error('Report API error:', response.status, errorData);
        setError('Failed to fetch report data');
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      setError('Error loading report data');
    } finally {
      setLoading(false);
    }
  };

  const processReportData = (data) => {
    // Process monthly trends to show cumulative weight
    let cumulativeWeight = 0;
    const processedTrends = (data.monthlyTrends || []).map(item => {
      cumulativeWeight += item.weight;
      return {
        ...item,
        cumulativeWeight: cumulativeWeight
      };
    });

    // Calculate diversion rate
    const diversionRate = data.totalWeight > 0 ? ((data.totalWeight / 2000) * 0.85).toFixed(1) : 0; // Assuming 85% diversion rate

    return {
      ...data,
      monthlyTrends: processedTrends,
      diversionRate,
      co2Saved: (data.totalWeight * 2.5).toFixed(0), // Rough estimate: 2.5 kg CO2 per kg of material
      waterSaved: (data.totalWeight * 50).toFixed(0), // Rough estimate: 50 gallons per pound
      energySaved: (data.totalWeight * 10).toFixed(0) // Rough estimate: 10 kWh per pound
    };
  };

  const generatePDF = async (memberData = null, memberName = 'All Members') => {
    const element = document.getElementById('report-content');
    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add header
    pdf.setFontSize(20);
    pdf.text('PACT Collective Impact Report', 20, 20);
    pdf.setFontSize(12);
    pdf.text(`Member: ${memberName}`, 20, 30);
    pdf.text(`Period: ${dateRange.startDate} to ${dateRange.endDate}`, 20, 37);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 44);

    position = 55;

    // Add the content
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    return pdf;
  };

  const handleGenerateSinglePDF = async () => {
    setGenerating(true);
    try {
      const pdf = await generatePDF(reportData, selectedMember === 'all' ? 'All Members' : members.find(m => m.id == selectedMember)?.name);
      const fileName = `PACT_Impact_Report_${selectedMember === 'all' ? 'All_Members' : members.find(m => m.id == selectedMember)?.code}_${dateRange.startDate}_${dateRange.endDate}.pdf`;
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
      
      for (const member of members) {
        const params = new URLSearchParams({
          member_id: member.id,
          start_date: dateRange.startDate,
          end_date: dateRange.endDate
        });

        const response = await fetch(getApiUrl(`/analytics/report?${params}`), {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const memberData = await response.json();
          const processedData = processReportData(memberData);
          setReportData(processedData);
          
          await delay(500);
          
          const pdf = await generatePDF(processedData, member.name);
          const fileName = `PACT_Impact_Report_${member.code}_${dateRange.startDate}_${dateRange.endDate}.pdf`;
          pdf.save(fileName);
          
          await delay(1000);
        }
      }
      
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
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatWeight = (weight) => {
    if (weight >= 1000) {
      return `${(weight / 1000).toFixed(1)}K`;
    }
    return weight.toFixed(0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Impact Report Generator</h1>
        <p className="text-gray-600">Generate comprehensive impact reports for PACT members</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Member</label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
            >
              <option value="all">All Members</option>
              <optgroup label="Members with Package Data">
                <option value="10">Brand-Supported Mail-Back</option>
                <option value="17">ILIA Beauty</option>
                <option value="18">Consumer-Supported Mail-Back</option>
                <option value="11">Hudsons Bay Company Canada</option>
                <option value="14">Credo Beauty</option>
                <option value="12">Nordstrom Retail</option>
                <option value="13">Ulta</option>
              </optgroup>
              <optgroup label="All Members">
                {members.map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchReportData}
              disabled={loading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Update Report
            </button>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={handleGenerateSinglePDF}
            disabled={generating || !reportData}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Export Current View to PDF
          </button>
          
          <button
            onClick={handleGenerateAllPDFs}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <DocumentTextIcon className="h-5 w-5" />
            Generate PDFs for All Members
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {generating && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md mb-4">
          Generating PDFs... This may take a few moments.
        </div>
      )}

      {/* Report Content */}
      <div id="report-content" className="space-y-6">
        {reportData && (
          <>
            {/* Environmental Impact Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600 font-medium">Total Material Diverted</div>
                  <div className="text-green-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatNumber(reportData.totalWeight)} lbs</div>
                <div className="text-xs text-green-600 mt-1">
                  {reportData.diversionRate} tons from landfill
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600 font-medium">CO₂ Emissions Saved</div>
                  <div className="text-blue-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatNumber(reportData.co2Saved)} kg</div>
                <div className="text-xs text-blue-600 mt-1">
                  Equivalent to {(reportData.co2Saved / 400).toFixed(0)} trees planted
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600 font-medium">Water Conserved</div>
                  <div className="text-cyan-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatNumber(reportData.waterSaved)} gal</div>
                <div className="text-xs text-cyan-600 mt-1">
                  {(reportData.waterSaved / 15000).toFixed(0)} swimming pools
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-600 font-medium">Energy Saved</div>
                  <div className="text-yellow-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatNumber(reportData.energySaved)} kWh</div>
                <div className="text-xs text-yellow-600 mt-1">
                  Powers {(reportData.energySaved / 900).toFixed(0)} homes/month
                </div>
              </div>
            </div>

            {/* Monthly Collection Trend */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Monthly Collection & Cumulative Impact</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={reportData.monthlyTrends || []}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2C5530" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#2C5530" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" label={{ value: 'Monthly Weight (lbs)', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Cumulative Weight (lbs)', angle: 90, position: 'insideRight' }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="weight" fill="#4A7C59" name="Monthly Collection" />
                  <Line yAxisId="right" type="monotone" dataKey="cumulativeWeight" stroke="#2C5530" strokeWidth={3} name="Cumulative Total" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Material Composition */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Material Composition</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.materialBreakdown || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="weight"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {(reportData.materialBreakdown || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Store Performance Rankings */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Top Contributing Locations</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={(reportData.topStores || []).slice(0, 10)} 
                    layout="horizontal"
                    margin={{ left: 100 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={90} />
                    <Tooltip formatter={(value) => `${formatWeight(value)} lbs`} />
                    <Bar dataKey="weight" fill="#4A7C59">
                      {(reportData.topStores || []).slice(0, 10).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index < 3 ? '#2C5530' : '#4A7C59'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Collection Method Distribution */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Collection Method Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={reportData.programTypes || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="program" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8EBF9F" name="Package Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Summary Statistics */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Performance Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{formatNumber(reportData.totalPackages)}</div>
                  <div className="text-sm text-gray-600">Total Packages</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{reportData.activeStores}</div>
                  <div className="text-sm text-gray-600">Active Locations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{(reportData.avgContamination || 0).toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Contamination Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">+{reportData.weightGrowth || 0}%</div>
                  <div className="text-sm text-gray-600">Growth vs Prior Period</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ReportGeneratorV2;