import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  ScaleIcon,
  BeakerIcon,
  CameraIcon,
  UserIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { getApiUrl } from '../../config';

function SessionDetailModal({ sessionId, isOpen, onClose }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchSessionDetail();
    }
  }, [isOpen, sessionId]);

  const fetchSessionDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const tenantCode = localStorage.getItem('activeTenant') || 'pact';
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'X-Tenant-Code': tenantCode
      };
      
      console.log('Fetching session detail:', sessionId, 'with tenant:', tenantCode);
      console.log('Full URL:', getApiUrl(`/admin/warehouse/sessions/${sessionId}`));
      console.log('Headers being sent:', headers);
      
      const response = await fetch(getApiUrl(`/admin/warehouse/sessions/${sessionId}`), {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Session detail response:', data);
        console.log('Session data:', data.session);
        console.log('Store info - number:', data.session?.store_number, 'name:', data.session?.store_name);
        
        // Handle both recycling and trade-in session types
        if (data.session && data.session.type === 'tradein') {
          // For trade-in sessions, map items to materials format for display
          setSession({
            ...data.session,
            materials: data.items?.map(item => ({
              material_type: item.product_name || item.product_type,
              weight: item.actual_value || item.estimated_value,
              weight_unit: 'USD',
              quality_grade: item.warehouse_condition || item.condition,
              contamination_level: item.warehouse_disposition === 'recycle' ? 'high' : 'none',
              notes: item.warehouse_notes || item.condition_notes
            })) || [],
            contaminations: [],
            photos: data.photos || []
          });
        } else {
          // For recycling sessions
          setSession({
            ...data.session,
            materials: data.materials || [],
            contaminations: data.contaminations || [],
            photos: data.photos || []
          });
        }
      } else {
        const errorText = await response.text();
        console.error('Session detail error:', response.status, errorText);
        setError('Failed to load session details');
      }
    } catch (error) {
      console.error('Error fetching session details:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return `px-3 py-1 text-sm font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`;
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      critical: 'text-red-600'
    };
    return colors[severity] || 'text-gray-600';
  };

  const getTotalMaterialWeight = () => {
    if (!session?.materials) return 0;
    return session.materials.reduce((total, material) => total + (material.weight || 0), 0);
  };

  const getProcessingTime = () => {
    if (!session?.started_at) return 'Unknown';
    
    const start = new Date(session.started_at);
    const end = session.completed_at ? new Date(session.completed_at) : new Date();
    const diffMinutes = Math.round((end - start) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} minutes`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours}h ${minutes}m`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Session Details</h2>
            {session && (
              <p className="text-gray-600">
                {session.tracking_number} - {session.started_at ? formatDate(session.started_at) : 'Unknown date'}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {loading && (
            <div className="flex justify-center items-center h-32">
              <div className="text-gray-600">Loading session details...</div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {session && (
            <div className="space-y-6">
              {/* Session Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <UserIcon className="h-6 w-6 text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm text-blue-600">Operator</p>
                      <p className="font-semibold text-blue-900">
                        {session.operator_name || 'Unknown'}
                      </p>
                      {session.employee_id && (
                        <p className="text-xs text-blue-700">ID: {session.employee_id}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <ScaleIcon className="h-6 w-6 text-green-600 mr-2" />
                    <div>
                      <p className="text-sm text-green-600">Total Weight</p>
                      <p className="font-semibold text-green-900">
                        {session.total_weight ? session.total_weight.toFixed(2) : 'N/A'} {session.weight_unit || 'lbs'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CalendarIcon className="h-6 w-6 text-purple-600 mr-2" />
                    <div>
                      <p className="text-sm text-purple-600">Processing Time</p>
                      <p className="font-semibold text-purple-900">{getProcessingTime()}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-6 w-6 text-gray-600 mr-2" />
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <span className={getStatusBadge(session.status || 'completed')}>
                        {(session.status || 'completed').replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Package Origin Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Package Origin</h3>
                {session.store_number || session.member_name || session.pact_full_address ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Member</p>
                      <p className="font-medium text-gray-900">{session.member_name || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Store</p>
                      {session.store_number ? (
                        <>
                          <p className="font-medium text-gray-900">
                            #{session.store_number} - {session.store_name || 'Unknown'}
                          </p>
                          {session.store_address && (
                            <p className="text-sm text-gray-500">
                              {session.store_address}<br />
                              {session.store_city}, {session.store_state} {session.store_zip}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-gray-500">Not specified</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Package origin information not available for this session</p>
                )}
                {session.package_collection_date && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-sm text-gray-600">Collection Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(session.package_collection_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {session.pact_full_address && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <p className="text-sm text-gray-600">Original Address</p>
                    <p className="text-sm text-gray-700">{session.pact_full_address}</p>
                  </div>
                )}
              </div>

              {/* Materials/Items */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <ScaleIcon className="h-5 w-5 mr-2" />
                  {session.type === 'tradein' ? 'Trade-In Items' : 'Material Separations'} ({session.materials?.length || 0})
                </h3>
                
                {session.materials && session.materials.length > 0 ? (
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Material Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            {session.type === 'tradein' ? 'Value' : 'Weight'}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Quality Grade
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Contamination
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {session.materials.map((material, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {material.material_type}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {material.weight_unit === 'USD' ? '$' : ''}{material.weight ? material.weight.toFixed(2) : '0.00'} {material.weight_unit === 'USD' ? '' : material.weight_unit || 'lbs'}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                material.quality_grade === 'A' ? 'bg-green-100 text-green-800' :
                                material.quality_grade === 'B' ? 'bg-blue-100 text-blue-800' :
                                material.quality_grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                Grade {material.quality_grade}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {material.contamination_level || 'None'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {material.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    <div className="bg-gray-50 px-6 py-3 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Total Separated Weight:</span>
                        <span className="text-sm font-bold text-gray-900">
                          {getTotalMaterialWeight().toFixed(2)} {session.weight_unit || 'lbs'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 bg-gray-50 p-4 rounded-lg">No materials recorded</p>
                )}
              </div>

              {/* Contamination Assessments */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BeakerIcon className="h-5 w-5 mr-2" />
                  Contamination Assessments ({session.contaminations?.length || 0})
                  {session.total_contamination_weight > 0 && (
                    <span className="ml-auto text-sm font-normal text-gray-600">
                      Total Weight: {session.total_contamination_weight.toFixed(2)} lbs
                    </span>
                  )}
                </h3>
                
                {session.contaminations && session.contaminations.length > 0 ? (
                  <div className="space-y-3">
                    {session.contaminations.map((contamination, index) => (
                      <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {(contamination.contamination_type || 'Unknown').replace('_', ' ')}
                            </h4>
                            <p className="text-sm text-gray-600">{contamination.description || 'No description'}</p>
                          </div>
                          <div className="flex items-center space-x-3">
                            {contamination.weight && (
                              <span className="text-sm text-gray-600">
                                {contamination.weight.toFixed(2)} lbs
                              </span>
                            )}
                            <span className={`px-3 py-1 rounded text-sm font-semibold ${getSeverityColor(contamination.severity)}`}>
                              {contamination.severity} severity
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-green-700 font-medium">No contamination detected</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Photos */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CameraIcon className="h-5 w-5 mr-2" />
                  Photos ({session.photos?.length || 0})
                </h3>
                
                {session.photos && session.photos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {session.photos.map((photo, index) => (
                      <div
                        key={index}
                        className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                        onClick={() => setSelectedPhoto(photo)}
                      >
                        {photo.file_path ? (
                          // Check if it's actual base64 data or just a filename
                          photo.file_path.startsWith('data:') || photo.file_path.length > 100 ? (
                            <img
                              src={photo.file_path.startsWith('data:') ? photo.file_path : `data:image/jpeg;base64,${photo.file_path}`}
                              alt={`${photo.photo_type || 'Material'} photo ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                const placeholder = e.target.parentElement.querySelector('.photo-placeholder');
                                if (placeholder) placeholder.classList.remove('hidden');
                              }}
                            />
                          ) : (
                            // If it's just a filename, show a placeholder with message
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center p-4">
                              <div className="text-center">
                                <CameraIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-xs text-gray-500">Legacy photo</p>
                                <p className="text-xs text-gray-400">{photo.file_path}</p>
                              </div>
                            </div>
                          )
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <CameraIcon className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                        {photo.file_path && (
                          <div className="photo-placeholder hidden w-full h-full bg-gray-200 flex items-center justify-center absolute inset-0">
                            <CameraIcon className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2">
                          <div className="flex justify-between items-center">
                            <span className="capitalize">{photo.photo_type || 'Material'}</span>
                            <span>{Math.round((photo.file_size || 0) / 1024)} KB</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <CameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No Photos Captured</p>
                        <p className="text-gray-400 text-sm">
                          Photos can be taken during material separation and contamination assessment
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Package Information */}
              {session.packageInfo && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Package Information</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-blue-600">Original Material Type</p>
                        <p className="font-semibold text-blue-900">
                          {session.packageInfo.material_type || 'Unknown'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-blue-600">Shipment Status</p>
                        <p className="font-semibold text-blue-900">
                          {session.packageInfo.shipment_status || 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {session.notes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Notes</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-700">{session.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="max-w-4xl max-h-full p-4">
            {selectedPhoto.file_path && (selectedPhoto.file_path.startsWith('data:') || selectedPhoto.file_path.length > 100) ? (
              <img
                src={selectedPhoto.file_path.startsWith('data:') ? selectedPhoto.file_path : `data:image/jpeg;base64,${selectedPhoto.file_path}`}
                alt="Full size photo"
                className="max-w-full max-h-full object-contain rounded-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                  const placeholder = e.target.parentElement.querySelector('.lightbox-placeholder');
                  if (placeholder) placeholder.classList.remove('hidden');
                }}
              />
            ) : (
              <div className="flex items-center justify-center bg-gray-800 rounded-lg p-16">
                <div className="text-center">
                  <CameraIcon className="h-24 w-24 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">Legacy photo - data not available</p>
                  <p className="text-gray-300 text-sm mt-2">{selectedPhoto.file_path}</p>
                </div>
              </div>
            )}
            <div className="lightbox-placeholder hidden flex items-center justify-center bg-gray-800 rounded-lg p-16">
              <div className="text-center">
                <CameraIcon className="h-24 w-24 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">Photo not available</p>
              </div>
            </div>
            <div className="text-center mt-4">
              <p className="text-white text-sm">
                <span className="capitalize">{selectedPhoto.photo_type || 'Material'}</span> - {selectedPhoto.uploaded_at ? formatDate(selectedPhoto.uploaded_at) : 'Unknown date'}
              </p>
              <p className="text-white text-xs mt-1">
                Size: {Math.round((selectedPhoto.file_size || 0) / 1024)} KB
              </p>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="mt-2 px-4 py-2 bg-white text-gray-800 rounded hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SessionDetailModal; 