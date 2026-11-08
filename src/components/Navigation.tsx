import React from 'react';
import { Layers, CheckCircle2, ChevronRight, Activity } from 'lucide-react';

export type ScreenStep = 'upload' | 'dashboard' | 'recommendations';

interface NavigationProps {
  currentStep: ScreenStep;
  onNavigate: (step: ScreenStep) => void;
  hasData: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentStep,
  onNavigate,
  hasData,
}) => {
  const steps: { id: ScreenStep; number: string; title: string }[] = [
    { id: 'upload', number: '1', title: 'Upload Data' },
    { id: 'dashboard', number: '2', title: 'Dashboard Jam Ramai' },
    { id: 'recommendations', number: '3', title: 'Rekomendasi AI' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#071B2B] text-white shadow-md border-b border-[#167D8D]/30 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-4">
          {/* Brand Zone */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-[#167D8D] text-white flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold tracking-tight text-white font-sans">
                  STEPS
                </span>
                <span className="hidden sm:inline-block text-xs font-semibold text-[#B9E4E8] tracking-wide">
                  Sistem Tepat Estimasi & Pemantauan Stok
                </span>
              </div>
              <p className="text-[11px] text-[#B9E4E8]/85 hidden md:block leading-none mt-0.5">
                Langkah Tepat, Stok Lebih Akurat.
              </p>
            </div>
          </div>

          {/* Stepper Navigation */}
          <nav aria-label="Progress" className="flex items-center gap-1 sm:gap-2">
            {steps.map((step, idx) => {
              const isActive = currentStep === step.id;
              const isPast =
                (step.id === 'upload' && currentStep !== 'upload') ||
                (step.id === 'dashboard' && currentStep === 'recommendations');
              const isAccessible = step.id === 'upload' || hasData;

              return (
                <React.Fragment key={step.id}>
                  {idx > 0 && (
                    <ChevronRight className="w-4 h-4 text-[#167D8D] shrink-0" />
                  )}
                  <button
                    type="button"
                    disabled={!isAccessible}
                    onClick={() => isAccessible && onNavigate(step.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-[#167D8D] text-white shadow-xs font-semibold ring-1 ring-[#B9E4E8]/40'
                        : isPast
                        ? 'text-[#B9E4E8] hover:bg-white/10'
                        : isAccessible
                        ? 'text-white/70 hover:text-white hover:bg-white/10'
                        : 'text-white/30 cursor-not-allowed'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                        isActive
                          ? 'bg-[#B9E4E8] text-[#071B2B]'
                          : isPast
                          ? 'bg-[#167D8D] text-white'
                          : 'bg-white/10 text-white/50'
                      }`}
                    >
                      {isPast ? <CheckCircle2 className="w-3.5 h-3.5 text-[#B9E4E8]" /> : step.number}
                    </span>
                    <span className="hidden md:inline">{step.title}</span>
                    <span className="md:hidden">
                      {step.id === 'upload' ? 'Upload' : step.id === 'dashboard' ? 'Dashboard' : 'AI'}
                    </span>
                  </button>
                </React.Fragment>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
