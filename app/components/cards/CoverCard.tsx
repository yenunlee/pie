import React from 'react';
import { DesignSettings, GlobalSettings } from '@/app/lib/types';
import { COLORS, DEFAULT_DESIGN_SETTINGS } from '@/app/lib/constants';

interface CoverCardProps {
  settings: GlobalSettings;
  design?: DesignSettings;
}

export default function CoverCard({ settings, design = DEFAULT_DESIGN_SETTINGS }: CoverCardProps) {
  const { volume, issueDate, intervieweeName, intervieweeAffiliation, unitLabel, coverPhotoUrl, photoUrl } = settings;
  const coverImage = coverPhotoUrl ?? photoUrl;
  const effectiveDesign = { ...DEFAULT_DESIGN_SETTINGS, ...design };
  const textScale = effectiveDesign.coverTextSize / DEFAULT_DESIGN_SETTINGS.coverTextSize;

  return (
    <div className="card-news-font" style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      {/* Masthead */}
      <div style={{ padding: '78px 96px 0 96px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 40 * textScale, fontWeight: 700, color: '#111111', letterSpacing: '-0.02em', marginBottom: 16 }}>
          {issueDate || '2026년 5월호'}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 54 }}>
          <span style={{ fontSize: 162 * textScale, fontWeight: 900, color: '#000000', lineHeight: 0.85, letterSpacing: '-0.06em' }}>PIE</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span style={{ fontSize: 70 * textScale, fontWeight: 800, color: '#000000', lineHeight: 1, letterSpacing: '-0.04em' }}>vol.</span>
            <span style={{ fontSize: 176 * textScale, fontWeight: 900, color: '#000000', lineHeight: 0.85, letterSpacing: '-0.06em' }}>{volume || '00'}</span>
          </div>
        </div>
      </div>

      {/* Photo block */}
      <div style={{ width: 888, height: 888, position: 'relative', margin: '34px 96px 0 96px', overflow: 'hidden', display: 'flex', backgroundColor: '#D6E8F7' }}>
        {coverImage ? (
          <img
            src={coverImage}
            alt="interviewee"
            loading="eager"
            decoding="sync"
            {...(/^https?:\/\//i.test(coverImage) ? { crossOrigin: 'anonymous' as const } : {})}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #e0eaf4 0%, #c5d8ec 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 30 * textScale, color: '#8ab0cc' }}>사진을 업로드하세요</span>
          </div>
        )}

        {/* Bottom-right text overlay */}
        <div style={{
          position: 'absolute',
          right: 32,
          bottom: 34,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}>
          <div style={{ fontSize: 39 * textScale, fontWeight: 600, color: '#ffffff', lineHeight: 1.2, marginBottom: 4 }}>
            {intervieweeAffiliation || '소속'}
          </div>
          <div style={{ fontSize: 86 * textScale, fontWeight: 900, color: '#ffffff', lineHeight: 1, letterSpacing: '-0.04em' }}>
            {intervieweeName || '이름'}
          </div>
        </div>
      </div>

      {/* Bottom unit label + carousel dots */}
      <div style={{ flex: 1, background: `linear-gradient(to bottom, #ffffff 0%, ${COLORS.coverGradientEnd} 92%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 45 }}>
        <span style={{ fontSize: 50 * textScale, fontWeight: 800, color: '#000000', lineHeight: 1, letterSpacing: '-0.02em' }}>
          {unitLabel || 'Unit:ie'}
        </span>
        {effectiveDesign.showPageIndicators && (
          <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === 0 ? 10 : 7,
                  height: i === 0 ? 10 : 7,
                  borderRadius: 999,
                  backgroundColor: i === 0 ? '#ffffff' : 'rgba(255,255,255,0.65)',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
