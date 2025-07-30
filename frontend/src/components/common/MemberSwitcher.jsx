import React, { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useTenant } from '../../contexts/TenantContext';

export default function MemberSwitcher() {
  const { members, selectedMemberId, setSelectedMemberId, isPactAdmin } = useTenant();
  const [isOpen, setIsOpen] = useState(false);

  // Only show for PACT admins when PACT tenant is selected
  const activeTenant = localStorage.getItem('activeTenant') || 'pact';
  if (!isPactAdmin() || activeTenant !== 'pact') {
    return null;
  }

  // Use members from API if available, otherwise use default list
  const pactMembers = members.length > 0 ? [
    { id: null, name: 'All Members', code: 'all' }, // null means no filter
    ...members
  ] : [
    { id: null, name: 'All Members', code: 'all' },
    { id: 2, name: "Kiehl's", code: 'KIEHLS' }
  ];

  const handleMemberChange = (memberId) => {
    setSelectedMemberId(memberId);
    setIsOpen(false);
  };

  const selectedMember = pactMembers.find(m => m.id === selectedMemberId) || pactMembers[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200 transition-colors text-sm"
      >
        <span className="font-medium">{selectedMember.name}</span>
        <ChevronDownIcon className="w-3 h-3 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-50 min-w-[200px] max-h-[400px] overflow-y-auto">
          {pactMembers.map(member => (
            <button
              key={member.code}
              onClick={() => handleMemberChange(member.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-left text-sm ${
                member.id === selectedMemberId ? 'bg-gray-100' : ''
              }`}
            >
              <span className="font-medium">{member.name}</span>
              {member.id === selectedMemberId && (
                <span className="ml-auto text-xs text-gray-500">Active</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}