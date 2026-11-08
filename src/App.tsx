import React, { useState } from 'react';
import { Navigation, ScreenStep } from './components/Navigation';
import { UploadScreen } from './components/UploadScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { RecommendationScreen } from './components/RecommendationScreen';
import { AnalyticsResult, MenuItem, TransactionRow } from './types';
import { computeAnalytics } from './utils/analytics';
import { generateKopiSenjaDataset } from './utils/sampleDataGenerator';

export const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<ScreenStep>('upload');
  const [transactions, setTransactions] = useState<TransactionRow[] | null>(null);
  const [menus, setMenus] = useState<MenuItem[] | null>(null);
  const [businessName, setBusinessName] = useState<string>('Kopi Senja');
  const [analytics, setAnalytics] = useState<AnalyticsResult | null>(null);

  const handleDataProcessed = (
    txData: TransactionRow[],
    menuData: MenuItem[],
    name: string
  ) => {
    setTransactions(txData);
    setMenus(menuData);
    setBusinessName(name);

    const calculatedAnalytics = computeAnalytics(txData, menuData, name);
    setAnalytics(calculatedAnalytics);
    setCurrentStep('dashboard');
  };

  const handleUseSampleData = () => {
    const { transactions: sampleTx, menus: sampleMenus } = generateKopiSenjaDataset(20261108);
    const sampleBusinessName = 'Kopi Senja';

    setTransactions(sampleTx);
    setMenus(sampleMenus);
    setBusinessName(sampleBusinessName);

    const calculatedAnalytics = computeAnalytics(sampleTx, sampleMenus, sampleBusinessName);
    setAnalytics(calculatedAnalytics);
    setCurrentStep('dashboard');
  };

  const hasData = analytics !== null && transactions !== null && menus !== null;

  return (
    <div className="min-h-screen bg-[#EEEEEE] text-[#071B2B] flex flex-col font-sans selection:bg-[#B9E4E8] selection:text-[#071B2B]">
      {/* Sticky Navigation */}
      <Navigation
        currentStep={currentStep}
        onNavigate={(step) => setCurrentStep(step)}
        hasData={hasData}
      />

      {/* Main View Port */}
      <main className="flex-1 pb-16">
        {currentStep === 'upload' && (
          <UploadScreen
            onDataProcessed={handleDataProcessed}
            onUseSampleData={handleUseSampleData}
          />
        )}

        {currentStep === 'dashboard' && analytics && (
          <DashboardScreen
            analytics={analytics}
            onNavigateToRecommendations={() => setCurrentStep('recommendations')}
            onBackToUpload={() => setCurrentStep('upload')}
          />
        )}

        {currentStep === 'recommendations' && analytics && (
          <RecommendationScreen
            analytics={analytics}
            onBackToDashboard={() => setCurrentStep('dashboard')}
            onBackToUpload={() => setCurrentStep('upload')}
          />
        )}
      </main>

      {/* Professional Minimalist Footer */}
      <footer className="border-t border-[#167D8D]/20 bg-[#071B2B] py-6 text-xs text-white/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">STEPS</span>
            <span className="text-[#167D8D]">·</span>
            <span className="text-[#B9E4E8]">Sistem Tepat Estimasi & Pemantauan Stok</span>
          </div>
          <div className="text-[11px] text-white/60">
            "Langkah Tepat, Stok Lebih Akurat." — Perhitungan Deterministik + Interpretasi Gemini AI
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
