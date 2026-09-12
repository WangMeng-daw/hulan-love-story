import { createRoot } from 'react-dom/client';
import Desktop from '../app/desktop';
import '../app/desktop-theme.css';
import '../app/desktop-life.css';
import '../app/desktop-family.css';
import '../app/wechat-archive.css';
import '../app/handwritten-letter.css';
import '../app/paper-scans.css';
import '../app/memory-film.css';

declare const __HULAN_PUBLIC_BASE__: string;
(window as Window & { __HULAN_PUBLIC_BASE__?: string }).__HULAN_PUBLIC_BASE__ =
  __HULAN_PUBLIC_BASE__;
createRoot(document.getElementById('root')!).render(<Desktop />);
