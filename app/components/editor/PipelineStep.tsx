'use client';

import { Button } from '@/components/ui/button';

export type StepStatus = 'idle' | 'loading' | 'done' | 'error';

interface PipelineStepProps {
  stepNumber: number;
  title: string;
  description?: string;
  status: StepStatus;
  error?: string | null;
  canRun: boolean;
  canApprove?: boolean;
  runLabel?: string;
  approveLabel?: string;
  onRun: () => void;
  onApprove?: () => void;
  children?: React.ReactNode;
  warning?: string | null;
}

export default function PipelineStep({
  stepNumber,
  title,
  description,
  status,
  error,
  canRun,
  canApprove,
  runLabel = 'Parse',
  approveLabel = 'Continue',
  onRun,
  onApprove,
  children,
  warning,
}: PipelineStepProps) {
  const isLoading = status === 'loading';
  const isDone = status === 'done';
  const isError = status === 'error';

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
      <div className="border-b border-gray-50 px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-[11px] font-bold text-white">
              {stepNumber}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{title}</p>
              {description && <p className="mt-0.5 text-[11px] text-gray-400">{description}</p>}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5">
            {!isDone && runLabel && (
              <Button
                size="sm"
                onClick={onRun}
                disabled={!canRun || isLoading}
                className="h-8 min-h-8 rounded-lg bg-gray-900 px-4 text-xs text-white hover:bg-gray-800"
              >
                {isLoading ? 'Parsing…' : runLabel}
              </Button>
            )}
            {isDone && onApprove && (
              <Button
                size="sm"
                onClick={onApprove}
                disabled={!canApprove}
                className="h-8 min-h-8 rounded-lg bg-gray-900 px-4 text-xs text-white hover:bg-gray-800"
              >
                {approveLabel}
              </Button>
            )}
          </div>
        </div>
      </div>

      {isError && error && (
        <div className="mx-5 mt-4 rounded-xl border border-red-100 bg-red-50 p-3.5">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {warning && (
        <div className="mx-5 mt-4 rounded-xl border border-amber-100 bg-amber-50 p-3.5">
          <p className="text-xs text-amber-700">{warning}</p>
        </div>
      )}

      {children && <div className="p-5 sm:p-6">{children}</div>}
    </div>
  );
}
