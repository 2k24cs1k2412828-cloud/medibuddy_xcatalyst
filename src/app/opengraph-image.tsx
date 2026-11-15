import { ImageResponse } from 'next/og';

export const alt = 'MediCare Connect - Elderly Healthcare Platform';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #042f2e, #0f766e)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: 60,
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: '#0d9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
            }}
          >
            +
          </div>
          <span style={{ fontSize: 56, fontWeight: 800 }}>MediCare Connect</span>
        </div>
        <p
          style={{
            fontSize: 32,
            fontWeight: 500,
            color: '#ccfbf1',
            textAlign: 'center',
            maxWidth: 900,
            lineHeight: 1.4,
          }}
        >
          Putting Elderly Individuals at the Centre of Healthcare Decisions
        </p>
        <div
          style={{
            display: 'flex',
            gap: 20,
            marginTop: 36,
            fontSize: 20,
            color: '#99f6e4',
          }}
        >
          <span>WCAG AAA Accessible</span>
          <span>&bull;</span>
          <span>Smart Dosing</span>
          <span>&bull;</span>
          <span>Proactive Reminders</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
