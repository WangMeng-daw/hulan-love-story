import type { Metadata } from 'next';
import './desktop-theme.css';
import './desktop-life.css';
import './desktop-family.css';
import './wechat-archive.css';
import './handwritten-letter.css';
import './paper-scans.css';
import './memory-film.css';
export const metadata: Metadata = {
  title: '呼兰爱情故事 · 爷爷的旧电脑',
  description:
    '扮演陆禾，在爷爷的旧电脑里发现东北村屯中一段跨越四十年的爱情与亲情。',
  icons: { icon: '/favicon.svg' },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
