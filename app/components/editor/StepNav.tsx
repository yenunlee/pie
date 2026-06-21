'use client';

import type { StepStatus } from '@/app/components/editor/PipelineStep';

export type StudioStep = 1 | 2 | 3;

const STEP_LABELS: Record<StudioStep, string> = {
  1: 'Import',
  2: 'Edit',
  3: 'Export',
};

interface StepNavProps {
  currentStep: StudioStep;
  viewedStep: StudioStep;
  stepStatus: Record<StudioStep, StepStatus>;
  onStepClick: (step: StudioStep) => void;
}

export default function StepNav({ currentStep, viewedStep, stepStatus, onStepClick }: StepNavProps) {
  const steps: StudioStep[] = [1, 2, 3];

  return (
    <div className="flex items-stretch gap-1 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 p-1.5">
      {steps.map(step => {
        const status = stepStatus[step];
        const isViewed = step === viewedStep;
        const isDone = status === 'done';
        const isReachable = isDone || step <= currentStep;

        return (
          <button
            key={step}
            type="button"
            onClick={() => isReachable && onStepClick(step)}
            disabled={!isReachable}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3.5 py-2.5 text-xs font-medium transition-all ${
              isViewed
                ? 'border border-gray-100 bg-white text-gray-900 shadow-sm'
                : isReachable
                  ? 'text-gray-500 hover:bg-white/60 hover:text-gray-800'
                  : 'cursor-not-allowed text-gray-300'
            }`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                isViewed && !isDone
                  ? 'bg-gray-900 text-white'
                  : isDone
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-gray-200 text-gray-400'
              }`}
            >
              {isDone ? '✓' : step}
            </span>
            <span className="hidden whitespace-nowrap sm:inline">{STEP_LABELS[step]}</span>
          </button>
        );
      })}
    </div>
  );
}
