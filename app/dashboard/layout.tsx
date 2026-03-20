import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '대시보드 - ChiChiFolio',
  description: '나의 보유 종목, 평가손익, 수익률, 배당 정보를 한눈에 확인하세요.',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
