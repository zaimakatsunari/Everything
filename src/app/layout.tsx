import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Everything',
  description: 'Universal project operating system and shared memory layer for AI work.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
