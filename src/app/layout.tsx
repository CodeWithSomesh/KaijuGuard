import type { Metadata } from 'next';
import '../index.css';

export const metadata: Metadata = {
  title: 'My Google AI Studio App',
  description: 'KaijuGuard Command Center',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
