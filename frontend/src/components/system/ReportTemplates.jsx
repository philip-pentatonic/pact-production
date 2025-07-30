import React, { useState, useEffect } from 'react';
import { 
  DocumentChartBarIcon,
  PlusIcon,
  PlayIcon,
  TrashIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  CalendarIcon,
  ChartBarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  BeakerIcon,
  CheckIcon,
  XMarkIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { getApiUrl } from '../../config';

// Mock templates for demonstration
const defaultTemplates = [
  {
    id: 'monthly-summary',
    name: 'Monthly Summary Report',
    description: 'Comprehensive monthly recycling metrics across all programs',
    category: 'Standard',
    metrics: ['total_weight', 'total_items', 'contamination_rate', 'program_distribution'],
    filters: { timeRange: 'last_month', groupBy: 'program_type' },
    schedule: 'monthly',
    lastRun: new Date('2024-01-01'),
    createdBy: 'System',
    isDefault: true
  },
  {
    id: 'member-performance',
    name: 'Member Performance Report',
    description: 'Detailed performance metrics for each member brand',
    category: 'Performance',
    metrics: ['weight_by_member', 'items_by_member', 'stores_active', 'cost_per_member'],
    filters: { timeRange: 'last_quarter', groupBy: 'member' },
    schedule: 'quarterly',
    lastRun: new Date('2023-12-15'),
    createdBy: 'System',
    isDefault: true
  },
  {
    id: 'cost-analysis',
    name: 'Cost Analysis Report',
    description: 'Detailed cost breakdown and efficiency metrics',
    category: 'Financial',
    metrics: ['total_cost', 'cost_per_lb', 'cost_by_category', 'revenue_offset'],
    filters: { timeRange: 'custom', includeProjections: true },
    schedule: 'weekly',
    lastRun: new Date('2024-01-14'),
    createdBy: 'Finance Team',
    isDefault: false
  }
];

const availableMetrics = [
  { id: 'total_weight', name: 'Total Weight', category: 'Basic', unit: 'lbs' },
  { id: 'total_items', name: 'Total Items', category: 'Basic', unit: 'count' },
  { id: 'unique_locations', name: 'Active Locations', category: 'Basic', unit: 'count' },
  { id: 'contamination_rate', name: 'Contamination Rate', category: 'Quality', unit: '%' },
  { id: 'material_breakdown', name: 'Material Type Distribution', category: 'Material', unit: 'chart' },
  { id: 'program_distribution', name: 'Program Type Distribution', category: 'Program', unit: 'chart' },
  { id: 'weight_by_member', name: 'Weight by Member', category: 'Member', unit: 'lbs' },
  { id: 'items_by_member', name: 'Items by Member', category: 'Member', unit: 'count' },
  { id: 'stores_active', name: 'Active Stores', category: 'Member', unit: 'count' },
  { id: 'total_cost', name: 'Total Program Cost', category: 'Financial', unit: '$' },
  { id: 'cost_per_lb', name: 'Cost per Pound', category: 'Financial', unit: '$/lb' },
  { id: 'cost_by_category', name: 'Cost by Category', category: 'Financial', unit: 'chart' },
  { id: 'revenue_offset', name: 'Material Revenue Offset', category: 'Financial', unit: '$' },
  { id: 'warehouse_efficiency', name: 'Warehouse Processing Time', category: 'Operations', unit: 'hours' },
  { id: 'kiosk_usage', name: 'Kiosk Transaction Volume', category: 'Consumer', unit: 'count' },
  { id: 'consumer_engagement', name: 'Consumer Participation Rate', category: 'Consumer', unit: '%' }
];

function ReportTemplates() {
  const [templates, setTemplates] = useState(defaultTemplates);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [runningReport, setRunningReport] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [filter, setFilter] = useState('all');

  // New template form state
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: 'Custom',
    metrics: [],
    filters: {
      timeRange: 'last_month',
      groupBy: 'none',
      members: [],
      programs: []
    },
    schedule: 'manual',
    format: 'pdf'
  });

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Standard': return <ChartBarIcon className="h-5 w-5" />;
      case 'Performance': return <UserGroupIcon className="h-5 w-5" />;
      case 'Financial': return <CurrencyDollarIcon className="h-5 w-5" />;
      case 'Operations': return <BeakerIcon className="h-5 w-5" />;
      default: return <DocumentChartBarIcon className="h-5 w-5" />;
    }
  };

  const handleCreateTemplate = () => {
    const template = {
      ...newTemplate,
      id: `custom-${Date.now()}`,
      createdBy: 'Current User',
      lastRun: null,
      isDefault: false
    };
    
    setTemplates([...templates, template]);
    setShowCreateModal(false);
    resetNewTemplate();
  };

  const resetNewTemplate = () => {
    setNewTemplate({
      name: '',
      description: '',
      category: 'Custom',
      metrics: [],
      filters: {
        timeRange: 'last_month',
        groupBy: 'none',
        members: [],
        programs: []
      },
      schedule: 'manual',
      format: 'pdf'
    });
  };

  const handleRunReport = async (template) => {
    setRunningReport(true);
    
    // Simulate report generation
    setTimeout(() => {
      setRunningReport(false);
      alert(`Report "${template.name}" has been generated and is ready for download.`);
      
      // Update last run time
      setTemplates(templates.map(t => 
        t.id === template.id ? { ...t, lastRun: new Date() } : t
      ));
      
      setShowRunModal(false);
    }, 2000);
  };

  const handleDeleteTemplate = (templateId) => {
    if (confirm('Are you sure you want to delete this template?')) {
      setTemplates(templates.filter(t => t.id !== templateId));
    }
  };

  const handleDuplicateTemplate = (template) => {
    const duplicate = {
      ...template,
      id: `${template.id}-copy-${Date.now()}`,
      name: `${template.name} (Copy)`,
      isDefault: false,
      createdBy: 'Current User',
      lastRun: null
    };
    setTemplates([...templates, duplicate]);
  };

  const filteredTemplates = templates.filter(template => {
    if (filter === 'all') return true;
    if (filter === 'default') return template.isDefault;
    if (filter === 'custom') return !template.isDefault;
    return template.category === filter;
  });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <DocumentChartBarIcon className="h-8 w-8 mr-3 text-blue-600" />
            Report Templates
          </h2>
          <p className="mt-2 text-gray-600">
            Create and manage custom report templates for automated reporting
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Template
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200 px-6">
          <nav className="-mb-px flex space-x-8">
            {['all', 'default', 'custom', 'Standard', 'Performance', 'Financial'].map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  filter === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'all' ? 'All Templates' : tab === 'default' ? 'System Templates' : tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <div key={template.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  {getCategoryIcon(template.category)}
                  <span className="ml-2 text-sm font-medium text-gray-500">{template.category}</span>
                </div>
                {template.isDefault && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    System
                  </span>
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{template.description}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-500">
                  <ChartBarIcon className="h-4 w-4 mr-2" />
                  {template.metrics.length} metrics
                </div>
                <div className="flex items-center text-gray-500">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {template.schedule === 'manual' ? 'Manual' : `Run ${template.schedule}`}
                </div>
                {template.lastRun && (
                  <div className="flex items-center text-gray-500">
                    <PlayIcon className="h-4 w-4 mr-2" />
                    Last run: {new Date(template.lastRun).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setSelectedTemplate(template);
                    setShowRunModal(true);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Run Report"
                >
                  <PlayIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDuplicateTemplate(template)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Duplicate Template"
                >
                  <DocumentDuplicateIcon className="h-5 w-5" />
                </button>
                {!template.isDefault && (
                  <>
                    <button
                      onClick={() => setEditingTemplate(template)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit Template"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Template"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
              
              <span className="text-xs text-gray-500">
                by {template.createdBy}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Template Modal */}
      {(showCreateModal || editingTemplate) && (
        <CreateTemplateModal
          template={editingTemplate || newTemplate}
          onSave={editingTemplate ? (updated) => {
            setTemplates(templates.map(t => t.id === updated.id ? updated : t));
            setEditingTemplate(null);
          } : handleCreateTemplate}
          onCancel={() => {
            setShowCreateModal(false);
            setEditingTemplate(null);
            resetNewTemplate();
          }}
          onChange={editingTemplate ? setEditingTemplate : setNewTemplate}
          availableMetrics={availableMetrics}
        />
      )}

      {/* Run Report Modal */}
      {showRunModal && selectedTemplate && (
        <RunReportModal
          template={selectedTemplate}
          onRun={() => handleRunReport(selectedTemplate)}
          onCancel={() => setShowRunModal(false)}
          isRunning={runningReport}
        />
      )}
    </div>
  );
}

// Modal Components
function CreateTemplateModal({ template, onSave, onCancel, onChange, availableMetrics }) {
  const metricsByCategory = availableMetrics.reduce((acc, metric) => {
    if (!acc[metric.category]) acc[metric.category] = [];
    acc[metric.category].push(metric);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {template.id ? 'Edit Report Template' : 'Create New Report Template'}
          </h3>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Name
              </label>
              <input
                type="text"
                value={template.name}
                onChange={(e) => onChange({ ...template, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Monthly Performance Report"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={template.description}
                onChange={(e) => onChange({ ...template, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows="2"
                placeholder="Brief description of what this report includes..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={template.category}
                  onChange={(e) => onChange({ ...template, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Custom">Custom</option>
                  <option value="Standard">Standard</option>
                  <option value="Performance">Performance</option>
                  <option value="Financial">Financial</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Schedule
                </label>
                <select
                  value={template.schedule}
                  onChange={(e) => onChange({ ...template, schedule: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="manual">Manual (On-demand)</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>
            </div>

            {/* Metrics Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Metrics
              </label>
              <div className="border border-gray-300 rounded-md max-h-64 overflow-y-auto">
                {Object.entries(metricsByCategory).map(([category, metrics]) => (
                  <div key={category} className="border-b last:border-b-0">
                    <div className="bg-gray-50 px-4 py-2 font-medium text-sm text-gray-700">
                      {category}
                    </div>
                    <div className="p-2">
                      {metrics.map(metric => (
                        <label key={metric.id} className="flex items-center p-2 hover:bg-gray-50 rounded">
                          <input
                            type="checkbox"
                            checked={template.metrics.includes(metric.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                onChange({ ...template, metrics: [...template.metrics, metric.id] });
                              } else {
                                onChange({ ...template, metrics: template.metrics.filter(m => m !== metric.id) });
                              }
                            }}
                            className="mr-3 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="flex-1 text-sm">{metric.name}</span>
                          <span className="text-xs text-gray-500">{metric.unit}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Report Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Time Range
              </label>
              <select
                value={template.filters.timeRange}
                onChange={(e) => onChange({ 
                  ...template, 
                  filters: { ...template.filters, timeRange: e.target.value } 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="last_week">Last Week</option>
                <option value="last_month">Last Month</option>
                <option value="last_quarter">Last Quarter</option>
                <option value="last_year">Last Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group Results By
              </label>
              <select
                value={template.filters.groupBy}
                onChange={(e) => onChange({ 
                  ...template, 
                  filters: { ...template.filters, groupBy: e.target.value } 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="none">No Grouping</option>
                <option value="member">Member Brand</option>
                <option value="program_type">Program Type</option>
                <option value="material_type">Material Type</option>
                <option value="location">Location</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(template)}
            disabled={!template.name || template.metrics.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {template.id ? 'Update Template' : 'Create Template'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RunReportModal({ template, onRun, onCancel, isRunning }) {
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [selectedFormat, setSelectedFormat] = useState('pdf');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Run Report: {template.name}</h3>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">{template.description}</p>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Report Configuration</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Metrics:</span>
                    <span className="font-medium">{template.metrics.length} selected</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time Range:</span>
                    <span className="font-medium capitalize">{template.filters.timeRange.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Grouping:</span>
                    <span className="font-medium capitalize">{template.filters.groupBy.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            </div>

            {template.filters.timeRange === 'custom' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={customDateRange.startDate}
                    onChange={(e) => setCustomDateRange({ ...customDateRange, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={customDateRange.endDate}
                    onChange={(e) => setCustomDateRange({ ...customDateRange, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
              <div className="grid grid-cols-3 gap-3">
                {['pdf', 'excel', 'csv'].map(format => (
                  <label key={format} className="relative">
                    <input
                      type="radio"
                      value={format}
                      checked={selectedFormat === format}
                      onChange={(e) => setSelectedFormat(e.target.value)}
                      className="sr-only"
                    />
                    <div className={`p-3 border rounded-lg cursor-pointer text-center transition-all ${
                      selectedFormat === format 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      <span className="text-sm font-medium uppercase">{format}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            disabled={isRunning}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onRun}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {isRunning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Generate Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReportTemplates; 