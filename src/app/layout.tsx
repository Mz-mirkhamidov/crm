import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sellora Plus CRM',
  description: 'Shaxsiy CRM Tizimi',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz" className="dark">
      <body>{children}</body>
    </html>
  );
}
