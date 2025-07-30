import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const TenantContext = createContext();

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

export const TenantProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    fetchUserInfo();
    // Only fetch members if there's a token
    const token = localStorage.getItem('token');
    if (token) {
      fetchMembers();
    }
  }, []);

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/auth/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const userData = response.data.user;
        setUser(userData);
        
        // If user is not PACT admin, set their member_id as selected
        if (userData.role !== 'admin' && userData.member_id) {
          setSelectedMemberId(userData.member_id);
        }
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      // If we get a 401, clear the token and reload to force login
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMembers([]);
        return;
      }
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/members`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setMembers(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      // No mock data - just set empty array on error
      setMembers([]);
    }
  };

  // Helper functions
  const isPactAdmin = () => {
    // Super admins (admin@pentatonic.com) or PACT admins should have full access
    return user?.role === 'admin' && (
      user?.is_super_admin || // Super admin flag
      user?.email === 'admin@pentatonic.com' || // Fallback for super admin email
      user?.email === 'admin@pact.com' || // PACT admin email
      !user?.member_id || // System admin (no member restriction)
      user?.member_id === 1 // PACT member ID
    );
  };

  const isBrandMember = () => {
    return user?.role === 'member' && user?.member_id && user?.member_id !== 1;
  };

  const getCurrentMember = () => {
    return members.find(m => m.id === (selectedMemberId || user?.member_id));
  };

  const getApiFilters = () => {
    // If PACT admin with no specific member selected, return no filters (see all data)
    if (isPactAdmin() && !selectedMemberId) {
      return {};
    }
    
    // If PACT admin with member selected, or brand member, filter by member_id
    const memberId = selectedMemberId || user?.member_id;
    return memberId ? { member_id: memberId } : {};
  };

  const value = {
    user,
    loading,
    members,
    selectedMemberId,
    setSelectedMemberId,
    isPactAdmin,
    isBrandMember,
    getCurrentMember,
    getApiFilters,
    refresh: () => {
      fetchUserInfo();
      fetchMembers();
    }
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};