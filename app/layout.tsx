import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Project Chronos - Real-Time Global Telemetry',
  description:
    'A cinematic 3D dashboard for real-time global earthquake monitoring and telemetry visualization.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#030712" />
      </head>
      <body>{children}</body>
    </html>
  );
}
