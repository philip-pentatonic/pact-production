import React from 'react';
import { TenantProvider } from './contexts/TenantContext';
import ThemeProvider from './components/common/ThemeProvider';
import AppContent from './components/AppContent';

function App() {
  return (
    <TenantProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </TenantProvider>
  );
}

export default App; 