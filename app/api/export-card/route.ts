import { NextRequest } from 'next/server';
import React from 'react';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFile } from 'fs/promises';
import path from 'path';
import { CARD_WIDTH, CARD_HEIGHT } from '@/app/lib/constants';
import CoverCard from '@/app/components/cards/CoverCard';
import AbstractCard from '@/app/components/cards/AbstractCard';
import InterviewCard from '@/app/components/cards/InterviewCard';
import type { DesignSettings, GlobalSettings, MessageBlock } from '@/app/lib/types';

export const runtime = 'nodejs';

let fontsCache: Awaited<ReturnType<typeof loadFonts>> | null = null;

async function loadFonts() {
  const fontsDir = path.join(process.cwd(), 'public', 'fonts');
  const [regular, bold, extraBold] = await Promise.all([
    readFile(path.join(fontsDir, 'NotoSansKR-Regular.otf')),
    readFile(path.join(fontsDir, 'NotoSansKR-Bold.otf')),
    readFile(path.join(fontsDir, 'NotoSansKR-Black.otf')),
  ]);
  return [
    { name: 'Noto Sans KR', data: regular.buffer as ArrayBuffer, weight: 400 as const, style: 'normal' as const },
    { name: 'Noto Sans KR', data: bold.buffer as ArrayBuffer, weight: 700 as const, style: 'normal' as const },
    { name: 'Noto Sans KR', data: extraBold.buffer as ArrayBuffer, weight: 800 as const, style: 'normal' as const },
  ];
}

type CardPayload =
  | { type: 'cover'; settings: GlobalSettings; design?: DesignSettings }
  | { type: 'abstract'; settings: GlobalSettings; text: string; design?: DesignSettings }
  | { type: 'interview'; messages: MessageBlock[]; pageIndex: number; totalPages: number; photoUrl: string | null; volume: string; design?: DesignSettings };

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as CardPayload;

    if (!fontsCache) {
      fontsCache = await loadFonts();
    }

    let element: React.ReactElement;

    if (payload.type === 'cover') {
      element = React.createElement(CoverCard, { settings: payload.settings, design: payload.design });
    } else if (payload.type === 'abstract') {
      element = React.createElement(AbstractCard, { settings: payload.settings, text: payload.text, design: payload.design });
    } else if (payload.type === 'interview') {
      element = React.createElement(InterviewCard, {
        messages: payload.messages,
        pageIndex: payload.pageIndex,
        totalPages: payload.totalPages,
        photoUrl: payload.photoUrl,
        volume: payload.volume,
        design: payload.design,
      });
    } else {
      return new Response('Unknown card type', { status: 400 });
    }

    const svg = await satori(element, {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      fonts: fontsCache,
    });

    const resvg = new Resvg(svg, {
      fitTo: { mode: 'width', value: CARD_WIDTH },
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    return new Response(new Uint8Array(pngBuffer), {
      status: 200,
      headers: { 'Content-Type': 'image/png' },
    });
  } catch (err) {
    console.error('[export-card]', err);
    return new Response(String(err), { status: 500 });
  }
}
