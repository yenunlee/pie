import { Suspense } from 'react';
import LandingPage from '@/app/components/landing/LandingPage';
import '@/app/styles/a2g-fonts.css';

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="a2g-ui flex min-h-full items-center justify-center bg-[#f7f8fa] text-sm font-medium text-gray-400">
          Loading…
        </div>
      }
    >
      <LandingPage />
    </Suspense>
  );
}
