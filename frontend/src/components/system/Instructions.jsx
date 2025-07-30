import React, { useState } from 'react';
import { 
  InformationCircleIcon, 
  ChevronDownIcon, 
  ChevronRightIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon,
  BookOpenIcon,
  AcademicCapIcon,
  BeakerIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

function Instructions() {
  const [expandedSections, setExpandedSections] = useState({
    materialGrades: true,
    contaminationLevels: true,
    materialTypes: false,
    bestPractices: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const materialGrades = [
    {
      grade: 'A',
      label: 'Excellent',
      color: 'green',
      description: 'Clean, uncontaminated material with minimal processing needed',
      criteria: [
        'No visible contamination',
        'Material is dry and clean',
        'Labels removed or easily removable',
        'No product residue',
        'Single material type'
      ],
      examples: 'Clean PET bottles with caps removed, pristine HDPE containers, clean cardboard'
    },
    {
      grade: 'B',
      label: 'Good',
      color: 'blue',
      description: 'Mostly clean with minor contamination that can be easily removed',
      criteria: [
        'Minor surface contamination (< 10%)',
        'Small amounts of residue',
        'Some labels present but removable',
        'Minimal moisture',
        'Predominantly single material'
      ],
      examples: 'Bottles with minor residue, containers with labels, slightly damp cardboard'
    },
    {
      grade: 'C',
      label: 'Fair',
      color: 'yellow',
      description: 'Moderate contamination requiring significant cleaning',
      criteria: [
        'Moderate contamination (10-30%)',
        'Significant residue present',
        'Multiple labels or adhesives',
        'Some moisture damage',
        'Mixed materials that can be separated'
      ],
      examples: 'Containers with product residue, wet cardboard, items with stubborn labels'
    },
    {
      grade: 'Reject',
      label: 'Poor Quality',
      color: 'red',
      description: 'Heavily contaminated or degraded material unsuitable for recycling',
      criteria: [
        'Heavy contamination (> 30%)',
        'Hazardous materials present',
        'Severe moisture damage or mold',
        'Inseparable mixed materials',
        'Chemical contamination'
      ],
      examples: 'Oil-soaked materials, moldy items, chemically contaminated plastics'
    }
  ];

  const contaminationTypes = [
    {
      type: 'Product Residue',
      icon: '🧴',
      severity: 'Medium',
      impact: 'Affects material quality and processing',
      removalMethod: 'Rinse containers, scrape out residue',
      recyclable: false
    },
    {
      type: 'Beauty Tools',
      icon: '💄',
      severity: 'Low',
      impact: 'Must be separated from packaging',
      removalMethod: 'Remove and separate from containers',
      recyclable: false
    },
    {
      type: 'Electronics',
      icon: '🔌',
      severity: 'High',
      impact: 'Hazardous - requires special handling',
      removalMethod: 'Remove completely, handle as e-waste',
      recyclable: false
    },
    {
      type: 'Food Residue',
      icon: '🍕',
      severity: 'High',
      impact: 'Can contaminate entire batch',
      removalMethod: 'Thorough cleaning required',
      recyclable: false
    },
    {
      type: 'Labels & Adhesives',
      icon: '🏷️',
      severity: 'Low',
      impact: 'Minor - can be processed with material',
      removalMethod: 'Remove if possible, otherwise process with material',
      recyclable: true
    },
    {
      type: 'Paper Inserts',
      icon: '📄',
      severity: 'Low',
      impact: 'Must be separated for proper recycling',
      removalMethod: 'Remove and recycle separately',
      recyclable: true
    }
  ];

  const materialTypes = [
    {
      category: 'Plastics',
      materials: [
        { code: 'PET', name: 'PET', description: 'Clear bottles, containers (Resin #1)' },
        { code: 'HDPE', name: 'HDPE', description: 'Milk jugs, shampoo bottles (Resin #2)' },
        { code: 'PP', name: 'PP', description: 'Yogurt containers, bottle caps (Resin #5)' },
        { code: 'PS_RIGID', name: 'PS - Rigid', description: 'Hard plastic cups, containers (Resin #6)' },
        { code: 'PS_EPS', name: 'PS - EPS/Foam', description: 'Foam cups, packaging peanuts (Resin #6)' }
      ]
    },
    {
      category: 'Paper',
      materials: [
        { code: 'CARDBOARD', name: 'Cardboard', description: 'Corrugated boxes, packaging' },
        { code: 'MIXED_PAPER', name: 'Mixed Paper', description: 'Office paper, magazines, newspapers' }
      ]
    },
    {
      category: 'Metals',
      materials: [
        { code: 'ALUMINUM', name: 'Aluminum', description: 'Beverage cans, foil' },
        { code: 'STEEL', name: 'Steel', description: 'Food cans, aerosol cans' }
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <BookOpenIcon className="h-8 w-8 mr-3 text-blue-600" />
          Warehouse Operations Instructions
        </h2>
        <p className="mt-2 text-gray-600">
          Comprehensive guide for material assessment and quality grading
        </p>
      </div>

      {/* Quick Links */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900">Quick Links</h3>
            <div className="mt-2 space-y-1">
              <a href="/warehouse" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline block hover:text-blue-800">
                → Open Warehouse App
              </a>
              <a href="#material-grades" className="text-blue-700 underline block hover:text-blue-800">
                → Material Grade Reference
              </a>
              <a href="#contamination-guide" className="text-blue-700 underline block hover:text-blue-800">
                → Contamination Assessment Guide
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Material Grades Section */}
      <div className="bg-white rounded-lg shadow mb-6" id="material-grades">
        <div 
          className="p-6 border-b cursor-pointer flex items-center justify-between"
          onClick={() => toggleSection('materialGrades')}
        >
          <h3 className="text-lg font-semibold flex items-center">
            <AcademicCapIcon className="h-6 w-6 mr-2 text-gray-600" />
            Material Quality Grades
          </h3>
          {expandedSections.materialGrades ? 
            <ChevronDownIcon className="h-5 w-5 text-gray-500" /> : 
            <ChevronRightIcon className="h-5 w-5 text-gray-500" />
          }
        </div>
        
        {expandedSections.materialGrades && (
          <div className="p-6">
            <div className="space-y-6">
              {materialGrades.map((grade) => (
                <div key={grade.grade} className={`border-l-4 border-${grade.color}-500 pl-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-semibold">
                      Grade {grade.grade} - {grade.label}
                    </h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium bg-${grade.color}-100 text-${grade.color}-800`}>
                      {grade.grade}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{grade.description}</p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Criteria:</h5>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                        {grade.criteria.map((criterion, idx) => (
                          <li key={idx}>{criterion}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Examples:</h5>
                      <p className="text-sm text-gray-600">{grade.examples}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Contamination Assessment Section */}
      <div className="bg-white rounded-lg shadow mb-6" id="contamination-guide">
        <div 
          className="p-6 border-b cursor-pointer flex items-center justify-between"
          onClick={() => toggleSection('contaminationLevels')}
        >
          <h3 className="text-lg font-semibold flex items-center">
            <ExclamationTriangleIcon className="h-6 w-6 mr-2 text-gray-600" />
            Contamination Assessment Guide
          </h3>
          {expandedSections.contaminationLevels ? 
            <ChevronDownIcon className="h-5 w-5 text-gray-500" /> : 
            <ChevronRightIcon className="h-5 w-5 text-gray-500" />
          }
        </div>
        
        {expandedSections.contaminationLevels && (
          <div className="p-6">
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Contamination Levels</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h5 className="font-medium text-green-900">None (0%)</h5>
                  <p className="text-sm text-green-700 mt-1">No visible contamination, material is clean and ready</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h5 className="font-medium text-yellow-900">Low (&lt; 10%)</h5>
                  <p className="text-sm text-yellow-700 mt-1">Minor surface contamination, easily cleanable</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h5 className="font-medium text-orange-900">Medium (10-30%)</h5>
                  <p className="text-sm text-orange-700 mt-1">Moderate contamination requiring cleaning</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h5 className="font-medium text-red-900">High (&gt; 30%)</h5>
                  <p className="text-sm text-red-700 mt-1">Heavy contamination, may affect recyclability</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Common Contamination Types</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Impact</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Removal Method</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Recyclable</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contaminationTypes.map((contam, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          <span className="mr-2">{contam.icon}</span>
                          {contam.type}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            contam.severity === 'Low' ? 'bg-green-100 text-green-800' :
                            contam.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {contam.severity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{contam.impact}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{contam.removalMethod}</td>
                        <td className="px-4 py-3 text-center">
                          {contam.recyclable ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-red-600">✗</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Material Types Reference */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div 
          className="p-6 border-b cursor-pointer flex items-center justify-between"
          onClick={() => toggleSection('materialTypes')}
        >
          <h3 className="text-lg font-semibold flex items-center">
            <BeakerIcon className="h-6 w-6 mr-2 text-gray-600" />
            Material Types Reference
          </h3>
          {expandedSections.materialTypes ? 
            <ChevronDownIcon className="h-5 w-5 text-gray-500" /> : 
            <ChevronRightIcon className="h-5 w-5 text-gray-500" />
          }
        </div>
        
        {expandedSections.materialTypes && (
          <div className="p-6">
            {materialTypes.map((category) => (
              <div key={category.category} className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">{category.category}</h4>
                <div className="grid md:grid-cols-2 gap-3">
                  {category.materials.map((material) => (
                    <div key={material.code} className="bg-gray-50 p-3 rounded">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium text-gray-900">{material.name}</span>
                          <span className="ml-2 text-xs text-gray-500">({material.code})</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{material.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Best Practices */}
      <div className="bg-white rounded-lg shadow">
        <div 
          className="p-6 border-b cursor-pointer flex items-center justify-between"
          onClick={() => toggleSection('bestPractices')}
        >
          <h3 className="text-lg font-semibold flex items-center">
            <ClipboardDocumentCheckIcon className="h-6 w-6 mr-2 text-gray-600" />
            Best Practices & Tips
          </h3>
          {expandedSections.bestPractices ? 
            <ChevronDownIcon className="h-5 w-5 text-gray-500" /> : 
            <ChevronRightIcon className="h-5 w-5 text-gray-500" />
          }
        </div>
        
        {expandedSections.bestPractices && (
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Material Separation</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Always separate materials by type before grading</li>
                  <li>Remove caps, lids, and pumps from containers</li>
                  <li>Use NIR scanner when material type is unclear</li>
                  <li>Keep different plastic resins separate</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Quality Assessment</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Assess contamination level before assigning grade</li>
                  <li>Check for moisture damage, especially in paper/cardboard</li>
                  <li>Look for chemical stains or hazardous materials</li>
                  <li>When in doubt, downgrade to ensure quality</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Documentation</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li>Take photos of contaminated materials for reference</li>
                  <li>Record item counts for complete packaging units</li>
                  <li>Note any unusual materials in the "Other" category</li>
                  <li>Document safety concerns immediately</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Safety Reminder</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Always wear appropriate PPE when handling materials. Report any hazardous materials 
                      immediately and do not attempt to process them.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Instructions; 