'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowUpRight, FileUp, Layers, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StudioFooter from '@/app/components/StudioFooter';
import '@/app/styles/a2g-fonts.css';

const FEATURES = [
  {
    icon: FileUp,
    title: '원고 업로드',
    body: 'Word(.docx) 파일을 올리거나 붙여넣으면 Q1/Q2 형식으로 자동 분류합니다.',
  },
  {
    icon: Layers,
    title: '말풍선 편집',
    body: '초록·질문·답변을 카드 미리보기에서 바로 수정하고 스타일을 맞춥니다.',
  },
  {
    icon: Sparkles,
    title: '고해상도 Export',
    body: '표지부터 인터뷰 카드까지 PNG/ZIP으로 한 번에 내보냅니다.',
  },
] as const;

export default function LandingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromStudio = searchParams.get('from') === 'studio';
  const accessRef = useRef<HTMLElement>(null);

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (fromStudio) {
      accessRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [fromStudio]);

  const enterStudio = async () => {
    if (!password.trim()) {
      setError('비밀번호를 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/studio-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? '로그인에 실패했습니다.');
        return;
      }
      router.push('/studio');
      router.refresh();
    } catch {
      setError('서버에 연결하지 못했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="a2g-ui min-h-full bg-[#f7f8fa] text-gray-950">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-[#dceeff]/70 blur-3xl" />
        <div className="absolute -right-24 top-1/3 h-[360px] w-[360px] rounded-full bg-[#e8f4ff]/80 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 pb-16 pt-10 sm:px-10 sm:pb-20 sm:pt-14">
        <header className="flex items-center justify-between">
          <span className="text-sm font-bold tracking-tight text-gray-900">파이 카뉴 공장</span>
          <a
            href="#enter"
            className="rounded-full border border-gray-200/80 bg-white/80 px-4 py-2 text-xs font-medium text-gray-600 backdrop-blur-sm transition-colors hover:border-gray-300 hover:text-gray-900"
          >
            작업실 입장
          </a>
        </header>

        <section className="mt-16 sm:mt-24">
          <h1 className="max-w-3xl text-[2.75rem] font-bold leading-[1.08] tracking-[-0.03em] sm:text-6xl lg:text-7xl">
            홍소팀의
            <br />
            노가다를 줄여줍니다
          </h1>
          <p className="mt-6 max-w-xl text-base font-normal leading-8 text-gray-500 sm:text-lg">
            인터뷰 원고를 카드뉴스 초안으로 바꿔 주는 작업실입니다. 업로드부터 Export까지 한 곳에서
            처리하세요.
          </p>
        </section>

        <section className="mt-20 sm:mt-28">
          <h2 className="text-lg font-medium tracking-tight text-gray-800">어떻게 동작하나요</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="rounded-[1.75rem] border border-white/90 bg-white/75 p-6 shadow-sm shadow-gray-200/40 backdrop-blur-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-900 text-white">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </div>
                <h3 className="mt-5 text-base font-bold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm font-normal leading-7 text-gray-500">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="enter"
          ref={accessRef}
          className="mt-20 scroll-mt-24 sm:mt-28"
        >
          <div className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-lg shadow-gray-200/50">
            <div className="grid lg:grid-cols-[1fr_minmax(0,22rem)]">
              <div className="border-b border-gray-100 px-8 py-10 lg:border-b-0 lg:border-r">
                <h2 className="text-2xl font-extrabold tracking-tight text-gray-950">작업실 입장</h2>
                <p className="mt-3 text-sm font-normal leading-7 text-gray-500">
                  홍소팀 전용 도구입니다. 비밀번호를 입력하면 에디터로 이동합니다.
                </p>
                {fromStudio ? (
                  <p className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                    세션이 만료되었습니다. 다시 로그인해 주세요.
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col justify-center gap-3 px-8 py-10">
                <label className="space-y-2">
                  <span className="text-xs font-medium text-gray-400">비밀번호</span>
                  <input
                    type="password"
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      setError(null);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') void enterStudio();
                    }}
                    placeholder="팀 비밀번호"
                    autoComplete="current-password"
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-medium text-gray-900 outline-none placeholder:font-normal placeholder:text-gray-300 focus:border-gray-400 focus:bg-white"
                  />
                </label>
                {error ? (
                  <p className="text-xs font-medium text-red-600" role="alert">
                    {error}
                  </p>
                ) : null}
                <Button
                  type="button"
                  onClick={() => void enterStudio()}
                  disabled={submitting}
                  className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gray-900 text-sm font-bold text-white hover:bg-gray-800"
                >
                  {submitting ? '확인 중…' : '시작하기'}
                  {!submitting ? <ArrowUpRight className="ml-1.5 h-4 w-4" aria-hidden /> : null}
                </Button>
              </div>
            </div>
          </div>
        </section>

        <StudioFooter />
      </div>
    </div>
  );
}
