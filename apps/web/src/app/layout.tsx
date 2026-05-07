import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LiveTranslate — Echtzeit Sprachübersetzung',
  description: 'Übersetze gesprochene Sprache in Echtzeit. Powered by Deepgram & DeepL.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
