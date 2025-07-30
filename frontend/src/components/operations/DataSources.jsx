import React, { useState, useEffect } from 'react';

import { getApiUrl } from '../../config';
function DataSources() {
  const [ingestionLogs, setIngestionLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  
  // CSV Upload states
  const [csvFile, setCsvFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // Generate webhook URL based on current host
    const baseUrl = window.location.origin.replace('3001', '57578');
    setWebhookUrl(`${baseUrl}/api/webhook/ingest`);
    
    fetchIngestionLogs();
  }, []);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchIngestionLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/ingestion/logs'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setIngestionLogs(data.logs || []);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching ingestion logs:', err);
      setLoading(false);
    }
  };

  const triggerScheduledImport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/import/scheduled'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        showNotification(`Import completed: ${result.message}`, 'success');
        fetchIngestionLogs(); // Refresh logs
      } else {
        showNotification('Failed to trigger import', 'error');
      }
    } catch (err) {
      console.error('Error triggering import:', err);
      showNotification('Error triggering import', 'error');
    }
  };

  const generateWebhookKey = (memberCode) => {
    return `whk_${memberCode}_${Math.random().toString(36).substring(2, 15)}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showNotification('Copied to clipboard!', 'success');
  };

  const testWebhook = async () => {
    const testData = {
      records: [
        {
          tracking_number: `TEST-${Date.now()}`,
                      material_type: 'PET',
          weight_lbs: 10.5,
          collection_date: new Date().toISOString().split('T')[0],
          program_type: 'Store Drop-off'
        }
      ]
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Key': 'whk_test_key',
          'X-Partner-Id': 'PLATFORM'
        },
        body: JSON.stringify(testData)
      });

      const result = await response.json();
      showNotification(`Test webhook successful: ${result.message || 'OK'}`, 'success');
    } catch (err) {
      showNotification(`Webhook test failed: ${err.message}`, 'error');
    }
  };

  // CSV Upload functions
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      setUploadResult(null);
    } else {
      showNotification('Please select a valid CSV file', 'error');
    }
  };

  // Download CSV template
  const downloadCsvTemplate = () => {
    const headers = [
      'tracking_number',
      'material_type',
      'weight_lbs',
      'collection_date',
      'program_type',
      'store_location',
      'shipment_status',
      'end_of_life_outcome',
      'contamination_rate',
      'processing_facility',
      'notes'
    ];

    const sampleData = [
      [
        'KIEHLS-001-2024',
        'PET',
        '0.15',
        '2024-01-23',
        'Store Drop-off',
        'Kiehl\'s New York (Flagship)',
        'Delivered',
        'recycled',
        '0.05',
        'TerraCycle Facility NYC',
        'Ultra Facial Cream jar - excellent condition'
      ],
      [
        'KIEHLS-002-2024',
        'GLASS',
        '0.25',
        '2024-01-23',
        'Store Drop-off',
        'Kiehl\'s Los Angeles',
        'Processing',
        'recycled',
        '0.02',
        'TerraCycle Facility LA',
        'Calendula Toner bottle'
      ],
      [
        'KIEHLS-003-2024',
        'CARDBOARD',
        '0.08',
        '2024-01-23',
        'Mail Back',
        'Kiehl\'s Chicago',
        'In Transit',
        'recycled',
        '0.01',
        'Local Recycling Center',
        'Product shipping box'
      ]
    ];

    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'kiehls_recycling_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      setUploadResult(null);
    } else {
      showNotification('Please select a valid CSV file', 'error');
    }
  };

  const uploadCsvFile = async () => {
    if (!csvFile) {
      showNotification('Please select a CSV file first', 'error');
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', csvFile);

              const response = await fetch(getApiUrl('/upload'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        setUploadResult({
          success: true,
          message: result.message,
          details: result.details
        });
        setCsvFile(null);
        // Refresh ingestion logs to show the new upload
        fetchIngestionLogs();
      } else {
        setUploadResult({
          success: false,
          message: result.message || 'Upload failed',
          details: result.details || null
        });
      }
    } catch (err) {
      setUploadResult({
        success: false,
        message: `Upload error: ${err.message}`,
        details: null
      });
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setCsvFile(null);
    setUploadResult(null);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-600 text-white' :
          notification.type === 'error' ? 'bg-red-600 text-white' :
          'bg-blue-600 text-white'
        }`}>
          <div className="flex items-center">
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-8">Data Sources & Automation</h1>
      
      {/* Automated Import Section */}
      <div className="bg-white border rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Automated Imports</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Scheduled Imports */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-3">Scheduled Imports</h3>
            <p className="text-sm text-gray-600 mb-4">
              Automated imports run daily at 2:00 AM EST
            </p>
            <button
              onClick={triggerScheduledImport}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Trigger Manual Import
            </button>
          </div>
          
          {/* Webhook Configuration */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-3">Webhook Integration</h3>
            <p className="text-sm text-gray-600 mb-4">
              Partners can send real-time data to our webhook endpoint
            </p>
            <button
              onClick={() => setShowWebhookModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              View Webhook Details
            </button>
          </div>
        </div>
      </div>

      {/* CSV Upload Section */}
      <div className="bg-white border rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Manual CSV Upload</h2>
        <p className="text-sm text-gray-600 mb-6">
          Upload recycling data via CSV file. Supported columns: tracking_number (required), material_type, weight_lbs, collection_date, program_type, store_id, etc.
        </p>
        
        {/* File Upload Area */}
        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {csvFile ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-lg font-medium text-gray-900">{csvFile.name}</span>
                <span className="text-sm text-gray-500">({(csvFile.size / 1024).toFixed(1)} KB)</span>
              </div>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={uploadCsvFile}
                  disabled={uploading}
                  className={`px-6 py-2 rounded-md font-medium ${
                    uploading
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {uploading ? (
                    <div className="flex items-center space-x-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Uploading...</span>
                    </div>
                  ) : (
                    'Upload CSV'
                  )}
                </button>
                
                <button
                  onClick={clearFile}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Clear
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Drag and drop your CSV file here
                </p>
                <p className="text-sm text-gray-500 mb-4">or</p>
                <label className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer">
                  Browse Files
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
                       </div>
         )}
      </div>

        {/* Upload Result */}
        {uploadResult && (
          <div className={`mt-6 p-4 rounded-md ${
            uploadResult.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start space-x-3">
              {uploadResult.success ? (
                <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              )}
              <div className="flex-1">
                <p className={`font-medium ${
                  uploadResult.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {uploadResult.message}
                </p>
                
                {uploadResult.details && (
                  <div className="mt-2">
                    <p className={`text-sm ${
                      uploadResult.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      Processed: {uploadResult.details.processed || 0} • 
                      Created: {uploadResult.details.created || 0} • 
                      Updated: {uploadResult.details.updated || 0} • 
                      Errors: {uploadResult.details.errors || 0}
                    </p>
                    
                    {uploadResult.details.errorDetails && uploadResult.details.errorDetails.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-red-700 mb-1">Error details:</p>
                        <ul className="text-xs text-red-600 list-disc list-inside space-y-1">
                          {uploadResult.details.errorDetails.slice(0, 5).map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                          {uploadResult.details.errorDetails.length > 5 && (
                            <li>... and {uploadResult.details.errorDetails.length - 5} more errors</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CSV Template Download */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Need a template?</h4>
              <p className="text-sm text-blue-700">Download a pre-formatted CSV with sample Kiehl's data and correct headers</p>
            </div>
            <button
              onClick={downloadCsvTemplate}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Download Template</span>
            </button>
          </div>
        </div>

        {/* CSV Format Help */}
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-md p-4">
          <h4 className="font-medium text-gray-900 mb-3">Supported CSV Fields</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Required Fields:</h5>
              <ul className="text-gray-600 space-y-1">
                <li>• <code className="bg-gray-200 px-1 rounded">tracking_number</code> - Unique identifier (e.g., KIEHLS-001-2024)</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Optional Fields:</h5>
              <ul className="text-gray-600 space-y-1">
                <li>• <code className="bg-gray-200 px-1 rounded">material_type</code> - PET, HDPE, GLASS, CARDBOARD, SILICONE, etc.</li>
                <li>• <code className="bg-gray-200 px-1 rounded">weight_lbs</code> - Weight in pounds (decimal)</li>
                <li>• <code className="bg-gray-200 px-1 rounded">collection_date</code> - YYYY-MM-DD format</li>
                <li>• <code className="bg-gray-200 px-1 rounded">program_type</code> - Store Drop-off, Mail Back, etc.</li>
                <li>• <code className="bg-gray-200 px-1 rounded">store_location</code> - Store name/location</li>
                <li>• <code className="bg-gray-200 px-1 rounded">shipment_status</code> - Delivered, Processing, etc.</li>
                <li>• <code className="bg-gray-200 px-1 rounded">end_of_life_outcome</code> - recycled, waste_to_energy, etc.</li>
                <li>• <code className="bg-gray-200 px-1 rounded">contamination_rate</code> - 0.00 to 1.00 (decimal)</li>
                <li>• <code className="bg-gray-200 px-1 rounded">processing_facility</code> - Facility name</li>
                <li>• <code className="bg-gray-200 px-1 rounded">notes</code> - Additional information</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Fields will be automatically mapped to the database schema. 
              Unknown fields will be ignored. Download the template above for the exact format.
            </p>
          </div>
        </div>
      </div>

      {/* Data Source Status */}
      <div className="bg-white border rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Data Source Status</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Source
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Last Import
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Records
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td colSpan="5" className="px-4 py-8 text-center">
                  <div className="text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-900 mb-1">No configured data sources</p>
                    <p className="text-sm text-gray-500">Set up API connections, webhooks, or FTP endpoints to see status here</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* G2 CSV Upload History */}
      <div className="bg-white border rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">G2 CSV Upload History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upload Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Records</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Processing Time</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[
                { name: 'kiehls_shipments_2024_07_03.csv', date: '2024-07-03 09:15:22', size: '2.3 MB', records: 4852, status: 'completed', time: '3m 42s' },
                { name: 'pact_returns_weekly_2024_06_30.csv', date: '2024-06-30 14:22:11', size: '1.8 MB', records: 3721, status: 'completed', time: '2m 18s' },
                { name: 'monthly_collection_data_june.csv', date: '2024-06-28 11:45:33', size: '4.1 MB', records: 8934, status: 'completed', time: '7m 15s' },
                { name: 'store_inventory_update_q2.csv', date: '2024-06-25 16:30:45', size: '892 KB', records: 1456, status: 'processing', time: '1m 23s' },
                { name: 'contamination_analysis_june.csv', date: '2024-06-20 08:12:18', size: '650 KB', records: 982, status: 'failed', time: '45s' }
              ].map((upload, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {upload.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {upload.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {upload.size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {upload.records.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      upload.status === 'completed' ? 'bg-green-100 text-green-800' :
                      upload.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {upload.status.charAt(0).toUpperCase() + upload.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {upload.time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">
                      View Log
                    </button>
                    {upload.status === 'completed' && (
                      <button className="text-green-600 hover:text-green-900">
                        Re-process
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">📈 Upload Summary (Last 30 Days)</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <span className="block text-2xl font-bold text-blue-700">47</span>
              <span className="text-blue-600">Total Uploads</span>
            </div>
            <div className="text-center">
              <span className="block text-2xl font-bold text-green-700">42</span>
              <span className="text-green-600">Successful</span>
            </div>
            <div className="text-center">
              <span className="block text-2xl font-bold text-yellow-700">3</span>
              <span className="text-yellow-600">Processing</span>
            </div>
            <div className="text-center">
              <span className="block text-2xl font-bold text-red-700">2</span>
              <span className="text-red-600">Failed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Ingestion Logs */}
      <div className="bg-white border rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Ingestion Activity</h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading ingestion logs...</span>
          </div>
        ) : ingestionLogs.length > 0 ? (
          <div className="space-y-2">
            {ingestionLogs.slice(0, 10).map((log, index) => (
              <div key={index} className="border rounded p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">
                      {log.source_type === 'manual_csv' ? 'Manual CSV Upload' :
                       log.source_type === 'webhook' ? `${log.source_identifier} Webhook` :
                       log.source_type === 'api' ? `${log.source_identifier} API Import` :
                       log.source_type === 'ftp' ? `${log.source_identifier} FTP Import` :
                       `${log.source_type} Import`}
                    </p>
                    <p className="text-sm text-gray-600">
                      {log.file_name && `${log.file_name} • `}
                      {new Date(log.ingested_at).toLocaleString()}
                    </p>
                    {log.error_details && (
                      <p className="text-xs text-red-600 mt-1 truncate">
                        Errors: {log.error_details}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      <span className="text-green-600">✓ {log.records_created || 0} created</span> • 
                      <span className="text-blue-600"> {log.records_updated || 0} updated</span> • 
                      <span className="text-red-600"> {log.errors || 0} errors</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {log.records_processed || 0} total processed
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {ingestionLogs.length > 10 && (
              <div className="text-center pt-4">
                <p className="text-sm text-gray-500">
                  Showing 10 of {ingestionLogs.length} recent ingestion logs
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500">No ingestion logs yet</p>
            <p className="text-sm text-gray-400 mt-1">Upload a CSV file to see activity here</p>
          </div>
        )}
      </div>

      {/* Webhook Modal */}
      {showWebhookModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Webhook Integration Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Webhook URL
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={webhookUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50"
                  />
                  <button
                    onClick={() => copyToClipboard(webhookUrl)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-r-md hover:bg-gray-700"
                  >
                    Copy
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Required Headers
                </label>
                <div className="bg-gray-50 p-3 rounded font-mono text-sm">
                  X-Webhook-Key: whk_YOUR_KEY<br />
                  X-Partner-Id: YOUR_PARTNER_CODE<br />
                  Content-Type: application/json
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Example Payload
                </label>
                <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
{`{
  "records": [
    {
      "tracking_number": "UNIQUE-ID-123",
      "material_type": "PET",
      "weight_lbs": 10.5,
      "collection_date": "2024-01-23",
      "program_type": "Store Drop-off",
      "store_id": 1,
      "shipment_status": "Delivered",
      "end_of_life_outcome": "Recycled"
    }
  ]
}`}
                </pre>
              </div>
              
              <div className="flex justify-between pt-4">
                <button
                  onClick={testWebhook}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Test Webhook
                </button>
                <button
                  onClick={() => setShowWebhookModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataSources; 