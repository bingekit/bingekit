import React from 'react';
import { AppProvider } from './context/AppContext';
import './lib/bridge';

import Prism from 'prismjs';
if (typeof window !== 'undefined') {
  (window as any).Prism = Prism;
}
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';

import { MainLayout } from './components/layout/MainLayout';

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
