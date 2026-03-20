import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppProvider } from '@/components/AppContext';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const SITE_URL = 'https://chichifolio.co.kr';

export const metadata: Metadata = {
  title: 'ChiChiFolio - 자산관리',
  description: '미국·한국 주식, 실시간 환율, 배당금 분석까지. 나의 투자 포트폴리오를 한눈에 관리하세요.',
  keywords: ['포트폴리오', '자산관리', '주식', '배당', '미국주식', '한국주식', '투자', 'ChiChiFolio', '총자산', '수익률'],
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: SITE_URL },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: SITE_URL,
    siteName: 'ChiChiFolio',
    title: 'ChiChiFolio - 자산관리',
    description: '미국·한국 주식, 실시간 환율, 배당금 분석까지. 나의 투자 포트폴리오를 한눈에 관리하세요.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ChiChiFolio - 나의 투자 포트폴리오를 한눈에 관리하세요',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ChiChiFolio - 자산관리',
    description: '미국·한국 주식, 실시간 환율, 배당금 분석까지. 나의 투자 포트폴리오를 한눈에 관리하세요.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'ChiChiFolio',
              description: '미국·한국 주식, 실시간 환율, 배당금 분석. 나의 투자 포트폴리오를 한눈에 관리하세요.',
              url: SITE_URL,
              applicationCategory: 'FinanceApplication',
              operatingSystem: 'Any',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
            }),
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
