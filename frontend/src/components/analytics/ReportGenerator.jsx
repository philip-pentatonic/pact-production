import React, { useState, useEffect } from 'react';
import { ArrowDownTrayIcon, DocumentTextIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getApiUrl } from '../../config';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function ReportGenerator() {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: '2025-03-01',
    endDate: '2025-04-30'
  });
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState('');

  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B'];

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

      console.log('Fetching report with params:', {
        member_id: selectedMember === 'all' ? '' : selectedMember,
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
        url: getApiUrl(`/analytics/report?${params}`)
      });

      const response = await fetch(getApiUrl(`/analytics/report?${params}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Report data received:', data);
        setReportData(data);
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
    pdf.text('PACT Sustainability Report', 20, 20);
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
      const fileName = `PACT_Report_${selectedMember === 'all' ? 'All_Members' : members.find(m => m.id == selectedMember)?.code}_${dateRange.startDate}_${dateRange.endDate}.pdf`;
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
      // Create a delay to prevent overwhelming the browser
      const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
      
      for (const member of members) {
        // Fetch data for this member
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
          setReportData(memberData); // Update the display
          
          // Wait for React to re-render
          await delay(500);
          
          // Generate PDF for this member
          const pdf = await generatePDF(memberData, member.name);
          const fileName = `PACT_Report_${member.code}_${dateRange.startDate}_${dateRange.endDate}.pdf`;
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
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Report Generator</h1>
        <p className="text-gray-600">Generate sustainability reports for PACT members</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Member</label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchReportData}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
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
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
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
        <div className="bg-blue-50 border border-blue-200 text-blue-600 px-4 py-3 rounded-md mb-4">
          Generating PDFs... This may take a few moments.
        </div>
      )}

      {/* Report Content */}
      <div id="report-content" className="space-y-6">
        {reportData && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600">Total Weight Collected</div>
                <div className="text-2xl font-bold">{formatNumber(reportData.totalWeight || 0)} lbs</div>
                <div className="text-xs text-green-600">+{reportData.weightGrowth || 0}% vs prev period</div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600">Total Packages</div>
                <div className="text-2xl font-bold">{formatNumber(reportData.totalPackages || 0)}</div>
                <div className="text-xs text-green-600">+{reportData.packageGrowth || 0}% vs prev period</div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600">Avg Contamination Rate</div>
                <div className="text-2xl font-bold">{(parseFloat(reportData.avgContamination) || 0).toFixed(1)}%</div>
                <div className="text-xs text-red-600">
                  {reportData.contaminationTrend > 0 ? '+' : ''}{parseFloat(reportData.contaminationTrend) || 0}% vs target
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-sm text-gray-600">Active Stores</div>
                <div className="text-2xl font-bold">{reportData.activeStores || 0}</div>
                <div className="text-xs text-blue-600">{reportData.storeGrowth || 0} new this period</div>
              </div>
            </div>

            {/* Material Breakdown Chart */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Material Type Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData.materialBreakdown || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
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

            {/* Collection Trends */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Collection Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.monthlyTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="weight" stroke="#8884d8" name="Weight (lbs)" />
                  <Line type="monotone" dataKey="packages" stroke="#82ca9d" name="Packages" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Store Performance */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Top Performing Stores</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.topStores || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="weight" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Program Type Distribution */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Collection by Program Type</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.programTypes || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="program" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ReportGenerator;