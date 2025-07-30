import React, { useState, useRef } from 'react';
import { getApiUrl } from '../../config';

function DataUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '', details: [] });
  const fileInputRef = useRef(null); // To reset the file input

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setFeedback({ type: '', message: '', details: [] }); // Clear previous feedback
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setFeedback({ type: 'error', message: 'Please select a CSV file to upload.', details: [] });
      return;
    }

    setUploading(true);
    setFeedback({ type: 'info', message: 'Uploading, please wait...', details: [] });

    const formData = new FormData();
    formData.append('csvFile', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/upload'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const result = await response.json(); // Always try to parse JSON

      if (response.ok) {
        let successMessage = `Upload successful! ${result.message || ''}`;
        if (result.ingested !== undefined && result.failed !== undefined) {
            successMessage += ` Records ingested: ${result.ingested}, Records failed: ${result.failed}.`;
        }
        setFeedback({ 
            type: 'success', 
            message: successMessage,
            details: result.errors || [] // Assuming backend might send an 'errors' array for failed rows
        });
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Reset file input
        }
      } else {
        setFeedback({ 
            type: 'error', 
            message: `Upload failed: ${result.message || result.error || 'Server error'}`,
            details: result.errors || []
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setFeedback({ type: 'error', message: `Upload failed: An unexpected error occurred. ${error.message}`, details: [] });
    }
    setUploading(false);
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg space-y-6">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">Upload Recycling Data</h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="csvFile" className="block text-sm font-medium text-gray-600 mb-1">
            Select CSV File
          </label>
          <input
            type="file"
            id="csvFile"
            name="csvFile"
            accept=".csv, text/csv"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="block w-full text-sm text-gray-700 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {file && <p className="text-xs text-gray-500 mt-2">Selected file: {file.name}</p>}
        </div>
        <button
          type="submit"
          disabled={uploading || !file}
          className="w-full px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-150 ease-in-out flex items-center justify-center"
        >
          {uploading ? (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          )}
          {uploading ? 'Uploading...' : 'Upload CSV'}
        </button>
      </form>

      {feedback.message && (
        <div className={`p-4 rounded-md mt-6 text-sm ${feedback.type === 'success' ? 'bg-green-50 text-green-700' : feedback.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
          <p className="font-semibold">{feedback.message}</p>
          {feedback.details && feedback.details.length > 0 && (
            <ul className="list-disc list-inside mt-2 space-y-1">
              {feedback.details.map((detail, index) => (
                <li key={index} className="text-xs">{typeof detail === 'string' ? detail : JSON.stringify(detail)}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default DataUpload; 