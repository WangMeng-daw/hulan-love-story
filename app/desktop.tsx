'use client';
import { proseParagraphClass } from './prose-paragraph';
import { memoryLocks, type MemoryLock } from './memory-story';
import { MemoryFilm } from './memory-film';
import {
  Fragment,
  useEffect,
  useCallback,
  useRef,
  useState,
  type SubmitEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  MessageCircle,
  Mail,
  Globe2,
  FolderOpen,
  Folder,
  FileText,
  Image as ImageIcon,
  Music2,
  Trash2,
  NotebookPen,
  Search,
  Minus,
  Square,
  X,
  ChevronRight,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  MoreHorizontal,
  Smile,
  Paperclip,
  Volume2,
  VolumeX,
  Wifi,
  BatteryFull,
  Grid2X2,
  Settings,
  LockKeyhole,
  ExternalLink,
  Home,
  RefreshCw,
  Headphones,
  Maximize2,
  Monitor,
  Archive,
  Users,
  Star,
  Pin,
  BellOff,
  Clock,
  List,
  LayoutGrid,
  Info,
} from 'lucide-react';
import {
  Avatar,
  GroupAvatar,
  PhotoTile,
  LifeGallery,
  ProfileDialog,
  ContactsView,
  MomentsView,
} from './desktop-social';
import {
  useDesktopExtras,
  emptyExtras,
  people,
  moments,
  canViewMoment,
  type PersonId,
  type Visit,
} from './desktop-life';
import Image from 'next/image';
import DesktopMail from './desktop-mail';
import { PaperScans } from './paper-scans';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import {
  files,
  farewell,
  mails,
  history,
  familyMembers,
  familyGroupName,
  webPages,
  finalLetter,
  type FileItem,
  type AppId,
} from './rural-story';
import {
  WechatFavorites,
  grandfatherThreads,
  isGrandfatherFavorite,
} from './wechat-archive';
import { reviseNpcDialogue } from './dialogue-revisions';
type ContactId = 'aunt' | 'history' | 'mom' | 'zhou' | 'transfer' | 'lu' | 'me';
type ThreadId = ContactId | `lu:${ContactId}`;
type PendingMessage = {
  contact: ThreadId;
  who: PersonId;
  text: string;
  attachment?: string;
  time?: string;
};
type Msg = {
  who: 'aunt' | 'me';
  text: string;
  attachment?: string;
  time?: string;
};
type Save = {
  version: 2;
  wechatAccount: 'me' | 'lu';
  wechatUnlocked: boolean;
  messages: Msg[];
  started: boolean;
  pending: PendingMessage[];
  intro: number;
  topics: string[];
  folderOpen: boolean;
  winterArchiveOpen: boolean;
  memoryFolders: MemoryLock[];
  postalOpen: boolean;
  restored: boolean;
  opened: string[];
  readMails: string[];
  notes: string;
  ending: 'read' | 'quiet' | null;
  endingStep: number;
};
type Win = { id: AppId; min: boolean; max: boolean; x: number; y: number };
const START: Msg[] = [
  { who: 'aunt', text: '阿禾，爷爷那台电脑还能开吗？' },
  {
    who: 'aunt',
    text: '我一会儿到屯子。你先替我整理一下，旧照片和文件别急着删。',
  },
  { who: 'aunt', text: '爷爷走了一周，我一直没敢开这台电脑。你替爸先看看。' },
];
const initial = (): Save => ({
  version: 2,
  wechatAccount: 'me',
  wechatUnlocked: false,
  messages: [],
  started: false,
  pending: [],
  intro: 0,
  topics: [],
  folderOpen: false,
  winterArchiveOpen: false,
  memoryFolders: [],
  postalOpen: false,
  restored: false,
  opened: [],
  readMails: [],
  notes: '',
  ending: null,
  endingStep: 0,
});
const SAVE_KEY = 'hulan-family-v5';
const APPS: { id: AppId; label: string; icon: typeof Mail; color: string }[] = [
  { id: 'chat', label: '微信', icon: MessageCircle, color: 'green' },
  { id: 'mail', label: '邮箱', icon: Mail, color: 'blue' },
  { id: 'browser', label: '浏览器', icon: Globe2, color: 'teal' },
  { id: 'files', label: '此电脑', icon: FolderOpen, color: 'yellow' },
  { id: 'notes', label: '我的笔记', icon: NotebookPen, color: 'cream' },
  { id: 'trash', label: '回收站', icon: Trash2, color: 'silver' },
];
const APP_NAMES: Record<AppId, string> = {
  chat: '微信',
  mail: '邮箱 · 旧邮件备份',
  browser: '拾页浏览器',
  files: '文件资源管理器',
  notes: '我的笔记',
  trash: '回收站',
  reader: '文件预览',
};
const compact = (s: string) =>
  s
    .normalize('NFKC')
    .replace(/[\s“”‘’「」。，!！?？]/g, '')
    .toLowerCase();
const validFile = (id: string) =>
  files.some((f) => f.id === id) || id === 'farewell' || id === 'reply-final';
function restoreSave(raw: unknown): Save {
  const s = raw as Partial<Save>;
  if (!s || s.version !== 2) return initial();
  return {
    ...initial(),
    wechatAccount:
      s.wechatUnlocked === true && s.wechatAccount === 'lu' ? 'lu' : 'me',
    wechatUnlocked: s.wechatUnlocked === true,
    started: s.started ?? true,
    pending: Array.isArray(s.pending)
      ? s.pending
          .filter(
            (m) =>
              m &&
              [
                'aunt',
                'history',
                'mom',
                'zhou',
                'transfer',
                'lu',
                'lu:aunt',
                'lu:mom',
                'lu:zhou',
                'lu:transfer',
              ].includes(m.contact) &&
              ['aunt', 'mom', 'zhou', 'lu', 'me'].includes(m.who) &&
              typeof m.text === 'string',
          )
          .slice(0, 60)
          .map((m) => ({
            ...m,
            text: m.who === 'me' ? m.text : reviseNpcDialogue(m.text),
            ...(m.attachment === 'grandfather-letter' &&
            m.text === '爷爷留给我的信'
              ? { text: '爷爷写给建军的信' }
              : {}),
            ...(m.attachment === 'reply-final'
              ? {
                  who: 'me' as const,
                  time: '18:36',
                  text: '爸，晚饭后我写了几句，也发给你。',
                }
              : {}),
          }))
          .sort(
            (a, b) =>
              Number(a.attachment === 'reply-final') -
              Number(b.attachment === 'reply-final'),
          )
      : [],
    intro: Math.min(2, Math.max(0, Number(s.intro) || 0)),
    folderOpen: !!s.folderOpen,
    winterArchiveOpen: !!s.winterArchiveOpen || !!s.postalOpen,
    memoryFolders: Array.isArray(s.memoryFolders)
      ? s.memoryFolders.filter((v) => Object.hasOwn(memoryLocks, v))
      : s.postalOpen
        ? ['table']
        : [],
    postalOpen: !!s.postalOpen,
    restored: !!s.restored,
    opened: Array.isArray(s.opened)
      ? s.opened.filter((v) => typeof v === 'string' && validFile(v))
      : [],
    readMails: Array.isArray(s.readMails)
      ? s.readMails.filter((v) => mails.some((m) => m.id === v))
      : [],
    notes: typeof s.notes === 'string' ? s.notes.slice(0, 15000) : '',
    topics: Array.isArray(s.topics)
      ? s.topics.filter((v) => ['sea', 'loss', 'voice', 'table'].includes(v))
      : [],
    messages:
      Array.isArray(s.messages) && s.messages.length
        ? s.messages
            .filter(
              (v) =>
                v &&
                ['aunt', 'me'].includes(v.who) &&
                typeof v.text === 'string',
            )
            .slice(0, 120)
            .map((m) => ({
              ...m,
              text: m.who === 'me' ? m.text : reviseNpcDialogue(m.text),
              ...(m.attachment === 'grandfather-letter' &&
              m.text === '爷爷留给我的信'
                ? { text: '爷爷写给建军的信' }
                : {}),
              ...(m.attachment === 'reply-final'
                ? {
                    who: 'me' as const,
                    time: '18:36',
                    text: '爸，晚饭后我写了几句，也发给你。',
                  }
                : {}),
            }))
        : [],
    ending: s.ending === 'read' || s.ending === 'quiet' ? s.ending : null,
    endingStep: Math.min(3, Math.max(0, Number(s.endingStep) || 0)),
  };
}
function AppGlyph({ id, small = false }: { id: AppId; small?: boolean }) {
  const a = APPS.find((a) => a.id === id);
  const I = a?.icon || FileText;
  return (
    <span
      className={
        'app-glyph ' + (a?.color || 'silver') + (small ? ' small' : '')
      }
    >
      <I strokeWidth={1.7} size={small ? 21 : 30} />
    </span>
  );
}
function FileGlyph({ file }: { file: FileItem }) {
  const I =
    file.kind === 'folder'
      ? Folder
      : file.kind === 'photo' || file.kind === 'scan'
        ? ImageIcon
        : file.kind === 'audio'
          ? Music2
          : file.kind === 'link'
            ? Globe2
            : FileText;
  return (
    <I className={'file-glyph ' + file.kind} size={26} strokeWidth={1.5} />
  );
}
export default function Desktop() {
  const { extras, setExtras, error: extrasError } = useDesktopExtras();
  const [chatView, setChatView] = useState<
    'chat' | 'contacts' | 'moments' | 'favorites'
  >('chat');
  const [momentFilter, setMomentFilter] = useState<PersonId | null>(null);
  const [profile, setProfile] = useState<PersonId | null>(null);
  const [gallery, setGallery] = useState<string | null>(null);
  const [chatDetails, setChatDetails] = useState(false);
  const [accountDialog, setAccountDialog] = useState(false);
  const [accountLogin, setAccountLogin] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [entered, setEntered] = useState(false);
  const [browserTrail, setBrowserTrail] = useState<Visit[]>([
    { page: 'start', query: '', title: '新标签页' },
  ]);
  const [browserCursor, setBrowserCursor] = useState(0);
  const [fileSort, setFileSort] = useState<'name' | 'date'>('name');
  const [fileGrid, setFileGrid] = useState(false);
  const [fileInfo, setFileInfo] = useState<FileItem | null>(null);
  const [selectedFileRow, setSelectedFileRow] = useState<string | null>(null);

  const [save, setSave] = useState<Save>(initial);
  const [ready, setReady] = useState(false);
  const [wins, setWins] = useState<Win[]>([
    { id: 'chat', min: false, max: false, x: 0, y: 0 },
  ]);
  const [contact, setContact] = useState<ContactId>('aunt');
  const viewer = save.wechatAccount;
  const threadKey: ThreadId =
    viewer === 'me' || contact === 'history'
      ? contact
      : contact === 'me'
        ? 'lu'
        : `lu:${contact}`;
  const preferenceKey = (id: string) => (viewer === 'lu' ? `lu:${id}` : id);
  const draftKey = preferenceKey(contact);
  const typing = save.pending.some((m) => m.contact === threadKey);
  const fatherTyping = save.pending.some((m) => m.contact === 'aunt');
  const [contactSearch, setContactSearch] = useState('');
  const [historyYear, setHistoryYear] = useState('all');
  const [historySearch, setHistorySearch] = useState('');
  const [folder, setFolder] = useState('root');
  const [fileSearch, setFileSearch] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [lockedFolder, setLockedFolder] = useState<
    'future' | 'winter-archive' | MemoryLock
  >('future');
  const [folderPassword, setFolderPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [mailFolder, setMailFolder] = useState('inbox');
  const [mailId, setMailId] = useState('move-mail');
  const [mailSearch, setMailSearch] = useState('');
  const [browserPage, setBrowserPage] = useState('start');
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState('');
  const [address, setAddress] = useState('about:home');
  const [letterId, setLetterId] = useState('');
  const [letterPassword, setLetterPassword] = useState('');
  const [postalError, setPostalError] = useState('');
  const [help, setHelp] = useState(false);
  const [filmOpen, setFilmOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [muted, setMuted] = useState(true);
  const [full, setFull] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [toast, setToast] = useState<{
    title: string;
    text: string;
    app?: AppId;
  } | null>(null);
  const [startMenu, setStartMenu] = useState(false);
  const [selectedShortcut, setSelectedShortcut] = useState('');
  const chatScroll = useRef<HTMLDivElement | null>(null);
  const browserScroll = useRef<HTMLDivElement | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const musicTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const drag = useRef<{
    id: AppId;
    px: number;
    py: number;
    x: number;
    y: number;
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const state = useRef({
    entered,
    extras,
    chatView,
    momentFilter,
    save,
    wins,
    contact,
    folder,
    browserPage,
    selectedFile,
    mailId,
    mailFolder,
    historyYear,
    historySearch,
    searched,
    passwordOpen,
  });
  useEffect(() => {
    state.current = {
      entered,
      extras,
      chatView,
      momentFilter,
      save,
      wins,
      contact,
      folder,
      browserPage,
      selectedFile,
      mailId,
      mailFolder,
      historyYear,
      historySearch,
      searched,
      passwordOpen,
    };
  });
  const active = wins.filter((w) => !w.min).at(-1)?.id;
  const supperFinished = save.messages.some(
    (m) => m.attachment === 'reply-final',
  );
  const storyTime = supperFinished ? '18:36' : '16:08';
  const parentsArrived = save.endingStep > 0;
  const replyFile: FileItem = {
    id: 'reply-final',
    name: '回家吃饭.txt',
    kind: 'text',
    folder: 'root',
    date: '2025/11/24 18:36',
    size: '1 KB',
    body:
      save.ending === 'quiet'
        ? [
            '爷爷：',
            '我把爸接回家了。',
            '他进门先喊了一声爸，喊完才想起，你不在屋里了。',
            '妈在灶间煮饺子，听见那一声，关小了火，没出来催。',
            '我们把饺子端上桌。爸把那只红花碗擦了又擦，轻轻放在照片前。',
            '妈把另一只碗也摆上了。她说：爸，今天人齐。',
            '爸对着照片说：娘，吃饭了。',
            '窗外下着雪。屋里很暖。',
            '阿禾\n2025 年 11 月 24 日',
          ]
        : [
            '爷爷：',
            '爸说，他一直以为是自己耽误了你成家。',
            '今天他对着那张照片，喊了一声娘。又转过脸，喊了一声爸。',
            '我把信里那句又念给爸听：建军，你来那天，这个家才又有了声音。',
            '爸坐在炕沿上，把脸埋进手里。过了很久，他说：我知道。我就是他的儿子。',
            '妈拿了条热毛巾，坐到爸旁边，什么也没问。',
            '我们给奶奶摆了碗。也给你摆了。妈把筷子一双一双放好，说：爸，今天人齐。',
            '爷爷，奶奶，吃饭了。',
            '阿禾\n2025 年 11 月 24 日',
          ],
  };
  function availableFiles(s: Save, path: string) {
    const list = [...files];
    if (s.restored) list.push(farewell);
    if (s.messages.some((m) => m.attachment === 'reply-final'))
      list.push(replyFile);
    return list.filter(
      (f) =>
        !isGrandfatherFavorite(f) &&
        f.id !== 'river' &&
        f.folder === path &&
        (path !== 'future' || s.folderOpen) &&
        (path !== 'winter-archive' || (s.folderOpen && s.winterArchiveOpen)) &&
        (!Object.hasOwn(memoryLocks, path) ||
          s.memoryFolders.includes(path as MemoryLock)),
    );
  }
  function folderIsLocked(id: string) {
    return (
      (id === 'future' && !save.folderOpen) ||
      (id === 'winter-archive' && !save.winterArchiveOpen) ||
      (Object.hasOwn(memoryLocks, id) &&
        !save.memoryFolders.includes(id as MemoryLock))
    );
  }
  const endingReplies =
    viewer === 'me' && contact === 'aunt' && save.postalOpen
      ? save.endingStep === 0
        ? [
            {
              label: '告诉爸爸，信找到了',
              text: '爸，爷爷写给你的信，我找到了。',
            },
          ]
        : save.endingStep === 1
          ? [
              {
                label: '念给爸爸听',
                text: '爷爷说：建军，你来那天，这个家才又有了声音。',
              },
              {
                label: '把整封信发给爸爸',
                text: '爸，信发给你了。你慢慢看，我就在屋里。',
              },
            ]
          : save.endingStep === 2
            ? [
                { label: '你就是他的儿子', text: '爸，你就是他的儿子。' },
                { label: '我们一块吃饭', text: '爸，进屋吧，我们一块吃饭。' },
              ]
            : []
      : [];
  function gameText() {
    const s = state.current;
    if (!s.entered)
      return {
        screen: 'cover',
        title: '呼兰爱情故事',
        canContinue: s.save.started,
        player: '陆禾',
        setting: '2025 年冬，呼兰柳河屯',
        controls: ['打开旧电脑'],
      };
    const front = s.wins.filter((w) => !w.min).at(-1)?.id;
    let visible: unknown = null;
    if (front === 'chat')
      visible =
        s.contact === 'aunt'
          ? s.save.messages
          : s.contact === 'history'
            ? history.filter(
                (m) =>
                  (s.historyYear === 'all' || m.date === s.historyYear) &&
                  (!s.historySearch || m.text.includes(s.historySearch)),
              )
            : {
                contact: s.contact,
                messages: s.extras.threads[s.contact] || [],
              };
    if (front === 'chat' && s.contact === 'history')
      visible = {
        group: familyGroupName,
        members: familyMembers.map((id) => people[id].name),
        history: visible,
        messages: s.extras.threads.history || [],
      };
    if (front === 'chat' && s.save.wechatAccount === 'lu') {
      const key =
        s.contact === 'history'
          ? 'history'
          : s.contact === 'me'
            ? 'lu'
            : `lu:${s.contact}`;
      visible = {
        account: '老陆',
        contact: s.contact,
        history:
          s.contact === 'history'
            ? history
                .filter(
                  (m) =>
                    (s.historyYear === 'all' || m.date === s.historyYear) &&
                    (!s.historySearch || m.text.includes(s.historySearch)),
                )
                .map((m) => ({
                  ...m,
                  text:
                    m.who === 'system'
                      ? m.text.replace(
                          '“老陆”“陆建军”和你',
                          '你、“陆建军”和“陆禾”',
                        )
                      : m.text,
                }))
            : grandfatherThreads[key] || [],
        messages: s.extras.threads[key] || [],
      };
    }
    if (front === 'chat' && s.save.wechatAccount === 'me' && s.contact === 'lu')
      visible = {
        contact: 'lu',
        history: grandfatherThreads.lu,
        messages: s.extras.threads.lu || [],
      };
    if (front === 'chat' && s.chatView === 'favorites')
      visible = {
        view: '收藏',
        account: s.save.wechatAccount,
        files: Array.from(document.querySelectorAll('.favorite-card')).map(
          (card) => ({
            id: card.getAttribute('data-file-id'),
            name: card.querySelector('strong')?.textContent,
          }),
        ),
      };
    if (front === 'chat' && s.chatView === 'moments')
      visible = {
        view: '朋友圈',
        posts: [...s.extras.posts, ...moments]
          .sort((a, b) => b.date.localeCompare(a.date))
          .filter(
            (p) =>
              canViewMoment(p, s.save.wechatAccount) &&
              (!s.momentFilter || p.person === s.momentFilter) &&
              !!document.querySelector(`[data-post-id="${p.id}"]`),
          )
          .map((p) => ({
            id: p.id,
            author: people[p.person].name,
            text: p.text,
            photos: p.photos,
            visibility: p.visibility || 'friends',
          })),
        likes: s.extras.likes,
        comments: s.extras.comments.filter((c) =>
          [...s.extras.posts, ...moments].some(
            (p) => p.id === c.post && canViewMoment(p, s.save.wechatAccount),
          ),
        ),
      };
    if (front === 'chat' && s.chatView === 'contacts')
      visible = {
        view: '通讯录',
        contacts: Object.values(people).map((p) => p.name),
      };
    if (front === 'reader') visible = s.selectedFile?.body;
    if (front === 'mail')
      visible = [...mails, ...s.extras.localMails].find(
        (m) => m.id === s.mailId,
      );
    if (front === 'files')
      visible = availableFiles(s.save, s.folder).map((f) => ({
        name: f.name,
        id: f.id,
        kind: f.kind,
      }));
    if (front === 'browser')
      visible =
        s.browserPage === 'postoffice'
          ? s.save.postalOpen
            ? finalLetter
            : { service: '乡邮保管箱', form: ['信件编号', '收件口令'] }
          : webPages.find((p) => p.id === s.browserPage) || {
              search: s.searched,
            };
    return {
      screen: 'desktop',
      activeApp: front || null,
      windows: s.wins.map((w) => ({
        app: w.id,
        minimized: w.min,
        maximized: w.max,
      })),
      contact: s.contact,
      wechatAccount: s.save.wechatAccount,
      wechatUnlocked: s.save.wechatUnlocked,
      wechatDialog: document.querySelector('.wechat-account-dialog')
        ? document.querySelector('[aria-label="微信密码"]')
          ? { view: '登录微信', fields: ['微信号', '微信密码'] }
          : { view: '设置' }
        : null,
      typing: s.save.pending
        .filter((m) => m.contact === s.contact && m.who !== 'me')
        .map((m) => people[m.who].name),
      pendingReplies: s.save.pending.length,
      chatView: s.chatView,
      folder: s.folder,
      browserPage: s.browserPage,
      visibleContent: visible,
      unlockedFolder: s.save.folderOpen,
      unlockedWinterArchive: s.save.winterArchiveOpen,
      unlockedMemories: s.save.memoryFolders,
      epilogue: document.querySelector('.memory-film-body')
        ? {
            scene: Number(
              document
                .querySelector('.memory-film-body')
                ?.getAttribute('data-scene'),
            ),
            playing:
              document
                .querySelector('.memory-film-body')
                ?.getAttribute('data-playing') === 'true',
          }
        : null,
      openedLetter: s.save.postalOpen,
      restoredFile: s.save.restored,
      ending: s.save.ending,
      endingStep: s.save.endingStep,
      notes: s.save.notes,
      starredMails: s.extras.stars,
      bookmarks: s.extras.bookmarks,
      passwordDialog: s.passwordOpen,
      coordinateSystem:
        'DOM desktop: origin top-left; x right, y down. Open apps from icons or taskbar. No evidence validation or chapter gates.',
    };
  }
  const openApp = useCallback((id: AppId) => {
    setWins((ws) => {
      const old = ws.find((w) => w.id === id);
      return [
        ...ws.filter((w) => w.id !== id),
        old
          ? { ...old, min: false }
          : {
              id,
              min: false,
              max: false,
              x: (ws.length % 3) * 18,
              y: (ws.length % 3) * 12,
            },
      ];
    });
    setStartMenu(false);
  }, []);
  const browserBridge = useRef({ read: gameText, open: openApp });
  useEffect(() => {
    browserBridge.current = { read: gameText, open: openApp };
  });
  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setToast({
        title: '显示设置',
        text: '当前浏览器不支持全屏，可以放大窗口游玩。',
      });
    }
  }, [setToast]);
  useEffect(() => {
    try {
      const old =
        localStorage.getItem(SAVE_KEY) ||
        localStorage.getItem('hulan-rural-v4');
      // Device-local saves must be restored after hydration, never during SSR.
      // eslint-disable-next-line react/react-compiler
      if (old) setSave(restoreSave(JSON.parse(old)));
    } catch {
      setStorageError(true);
    }
    setReady(true);
    const fs = () => setFull(!!document.fullscreenElement);
    const keydown = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement)?.closest('input,textarea,[contenteditable]')
      )
        return;
      if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        void toggleFullscreen();
      }
    };
    document.addEventListener('fullscreenchange', fs);
    window.addEventListener('keydown', keydown);
    return () => {
      document.removeEventListener('fullscreenchange', fs);
      window.removeEventListener('keydown', keydown);
      if (musicTimer.current) clearInterval(musicTimer.current);
      void audio.current?.close();
    };
  }, [toggleFullscreen]);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(save));
      } catch {
        // Report a browser storage failure without changing the persisted game state.
        // eslint-disable-next-line react/react-compiler
        setStorageError(true);
      }
  }, [save, ready]);
  useEffect(() => {
    if (!ready || !entered || !save.pending.length) return;
    const next = save.pending[0];
    const deliveredTime =
      next.time === '18:36' ||
      save.messages.some((m) => m.attachment === 'reply-final')
        ? '18:36'
        : '16:08';
    // One persisted reply at a time. Cleanup cancels timers on navigation/reload/reset.
    const delay = Math.min(2300, 850 + next.text.length * 28);
    const timer = window.setTimeout(() => {
      if (next.contact !== 'aunt') {
        setExtras((e) => ({
          ...e,
          threads: {
            ...e.threads,
            [next.contact]: [
              ...(e.threads[next.contact] || []),
              {
                who: 'other',
                sender: next.who,
                text: next.text,
                time: deliveredTime,
              },
            ],
          },
        }));
      }
      setSave((current) => ({
        ...current,
        pending: current.pending.slice(1),
        messages:
          next.contact === 'aunt'
            ? [
                ...current.messages,
                {
                  who: next.who === 'me' ? 'me' : 'aunt',
                  text:
                    next.who === 'me'
                      ? next.text
                      : reviseNpcDialogue(next.text),
                  attachment: next.attachment,
                  time: deliveredTime,
                },
              ]
            : current.messages,
      }));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [ready, entered, save.pending, save.messages, setExtras]);
  function enterDesktop() {
    setEntered(true);
    if (!save.started)
      setSave((current) => ({
        ...current,
        started: true,
        pending: START.map((m) => ({ ...m, contact: 'aunt' })),
      }));
  }
  useEffect(() => {
    if (chatScroll.current && (contact !== 'history' || historyYear === '2025'))
      chatScroll.current.scrollTop = chatScroll.current.scrollHeight;
  }, [
    save.messages.length,
    contact,
    save.intro,
    save.endingStep,
    extras.threads,
    typing,
    entered,
    chatView,
    historyYear,
  ]);
  useEffect(() => {
    if (contact !== 'aunt') chatScroll.current?.scrollTo({ top: 0 });
  }, [contact, historyYear, historySearch]);
  useEffect(() => {
    browserScroll.current?.scrollTo({ top: 0 });
  }, [browserPage, save.postalOpen, searched]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4300);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    Object.assign(window, {
      render_game_to_text: () => JSON.stringify(browserBridge.current.read()),
      advanceTime: () => {},
    });
    type Context = {
      registerTool: (
        tool: unknown,
        options: { signal: AbortSignal },
      ) => void | Promise<void>;
    };
    const context = (document as Document & { modelContext?: Context })
      .modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const list = [
      {
        name: 'read_hulan_desktop',
        description:
          'Read currently visible apps and story documents on this fictional desktop. Does not expose passwords or unopened encrypted content.',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true },
        execute: () => browserBridge.current.read(),
      },
      {
        name: 'open_hulan_app',
        description:
          'Open or focus an app on the fictional Hulan desktop. All messages and webpages are part of a local story game; no external communication occurs.',
        inputSchema: {
          type: 'object',
          properties: {
            app: {
              type: 'string',
              enum: ['chat', 'mail', 'browser', 'files', 'notes', 'trash'],
            },
          },
          required: ['app'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false },
        execute: async (input: unknown) => {
          const id = (input as { app?: AppId })?.app;
          if (!APPS.some((a) => a.id === id))
            throw new Error('Unknown desktop application.');
          browserBridge.current.open(id!);
          await new Promise((r) => setTimeout(r, 60));
          return { opened: APP_NAMES[id!] };
        },
      },
    ];
    for (const t of list)
      try {
        void Promise.resolve(
          context.registerTool(t, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {}
    return () => lifecycle.abort();
  }, []);
  function focus(id: AppId) {
    setWins((ws) =>
      ws.at(-1)?.id === id
        ? ws
        : [...ws.filter((w) => w.id !== id), ...ws.filter((w) => w.id === id)],
    );
  }
  function taskClick(id: AppId) {
    if (active === id)
      setWins((ws) => ws.map((w) => (w.id === id ? { ...w, min: true } : w)));
    else openApp(id);
  }
  function closeApp(id: AppId) {
    setWins((ws) => ws.filter((w) => w.id !== id));
  }
  function maximize(id: AppId) {
    setWins((ws) =>
      ws.map((w) => (w.id === id ? { ...w, max: !w.max, x: 0, y: 0 } : w)),
    );
  }
  function pointerDown(e: ReactPointerEvent<HTMLElement>, win: Win) {
    if (
      (e.target as HTMLElement).closest('button') ||
      win.max ||
      window.innerWidth < 760
    )
      return;
    const rect = e.currentTarget.parentElement!.getBoundingClientRect();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      id: win.id,
      px: e.clientX,
      py: e.clientY,
      x: win.x,
      y: win.y,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
    focus(win.id);
  }
  function pointerMove(e: ReactPointerEvent<HTMLElement>) {
    const d = drag.current;
    if (!d) return;
    const dx = Math.max(
      -d.left + 8,
      Math.min(e.clientX - d.px, window.innerWidth - d.left - d.width - 8),
    );
    const dy = Math.max(
      -d.top + 8,
      Math.min(e.clientY - d.py, window.innerHeight - 60 - d.top - d.height),
    );
    setWins((ws) =>
      ws.map((w) => (w.id === d.id ? { ...w, x: d.x + dx, y: d.y + dy } : w)),
    );
  }
  const stopDrag = () => {
    drag.current = null;
  };
  function toggleMusic() {
    try {
      if (!muted) {
        void audio.current?.suspend();
        setMuted(true);
        return;
      }
      if (!audio.current) {
        const ctx = new AudioContext();
        audio.current = ctx;
        let i = 0;
        const notes = [220, 261.63, 329.63, 293.66, 261.63, 196, 220, 164.81];
        const play = () => {
          if (ctx.state !== 'running') return;
          const now = ctx.currentTime;
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.value = notes[i++ % notes.length];
          g.gain.setValueAtTime(0, now);
          g.gain.linearRampToValueAtTime(0.045, now + 0.08);
          g.gain.exponentialRampToValueAtTime(0.001, now + 2.9);
          o.connect(g);
          g.connect(ctx.destination);
          o.start(now);
          o.stop(now + 3);
        };
        play();
        musicTimer.current = setInterval(play, 1500);
      }
      void audio.current.resume();
      setMuted(false);
    } catch {
      setToast({
        title: '声音',
        text: '当前设备暂时不能播放氛围音乐，文字内容不受影响。',
      });
    }
  }
  function addReply(
    text: string,
    replies: string[],
    patch: Partial<Save> = {},
  ) {
    if (fatherTyping) return;
    setSave((current) => ({
      ...current,
      ...patch,
      messages: [...current.messages, { who: 'me', text, time: storyTime }],
      pending: [
        ...current.pending,
        ...replies.map((text) => ({
          contact: 'aunt' as const,
          who: 'aunt' as const,
          text,
          time: storyTime,
        })),
      ],
    }));
  }
  function introReply(typedText?: string) {
    if (save.intro === 0)
      addReply(
        typedText || '爸，合影里那个姑娘是谁？',
        [
          '许知遥。以前在屯子里教书，我小时候喊她许老师。',
          '知道他们原本要成家，可你爷爷很少细说。照片在柜上摆了一辈子。',
          '你妈建的“陆家小院”还在，往上翻翻。你小时候也没少在里头说话。',
        ],
        { intro: 1 },
      );
    else
      addReply(
        typedText || '我先看看。你路上慢点。',
        [
          '好。炕柜第二层的东西，和电脑里的“留着”，都别扔。你慢慢看。',
          '你爷爷走之前，说这些都留给你。',
          '我快到了。',
        ],
        { intro: 2 },
      );
  }
  function talkTopic(topic: string, typedText?: string) {
    if (save.topics.includes(topic)) return;
    if (topic === 'voice')
      addReply(
        typedText || '爸，爷爷说他记不清知遥的声音了。',
        [
          '前几年他问过我，还记不记得许老师怎么喊人。',
          '我说太小了，记不清。他说没事，接着问我晚上吃的啥。',
          '我当时真以为他就是随口一问。',
          '阿禾，那阵子我们给他换了助听器。我一直以为，他只是听不清我们说话。',
        ],
        { topics: [...save.topics, topic] },
      );
    if (topic === 'table')
      addReply(
        typedText || '爸，南窗底下的小桌是给知遥做的。',
        [
          '我小时候就趴在那上头写字。桌角圆圆的，磕上也不疼。',
          '有一年搬东西，我说扔了吧，腿都晃了。他自己找了块木头垫上。',
          '他只跟我说，是给许老师做的。我那时候不懂，东西都这么旧了，为什么还要留。',
          '原来她连一回都没坐过。',
        ],
        { topics: [...save.topics, topic] },
      );
    if (topic === 'sea')
      addReply(
        typedText || '爸，爷爷写了你小时候的事。',
        [
          '我记得，他总怕我饿着。',
          '小时候别人说我不是亲生的。我回家不敢问。',
          '他蹲下来给我系鞋带，说：谁喊我爸，谁就是我儿子。',
        ],
        { topics: [...save.topics, topic] },
      );
    if (topic === 'loss')
      addReply(
        typedText || '我看到了爷爷没写完的那封信。',
        [
          '他一辈子都不爱说这些。',
          '我以前总以为，是因为养我，才耽误了他成家。',
          '我一想起他，就只想起他是我爸。都忘了照片里那会儿，他也才二十六。',
          '也有人给他织围巾，怕他冻着，盼着跟他过日子。',
          '你先别收起来。等我回去，一起看。',
        ],
        { topics: [...save.topics, topic] },
      );
  }
  function beginEnding(typedText?: string) {
    if (fatherTyping) return;
    setToast(null);
    addReply(
      typedText || '爸，爷爷写给你的信，我找到了。',
      [
        '我到院门口了。你妈先去灶间烧水。',
        '写给我的？我在门口坐一会儿。你把信发过来，爸想看看。',
      ],
      { endingStep: 1 },
    );
  }
  function chooseEnding(kind: 'read' | 'quiet', typedText?: string) {
    if (kind === 'read')
      addReply(
        typedText || '爷爷说：建军，你来那天，这个家才又有了声音。',
        [
          '……',
          '我头一回进这个门，还没灶台高。',
          '我以为他是可怜我。原来，他是接我回家。',
          '我在南窗的小桌上写了六年作业。他天天给我擦，冬天把桌子往太阳底下挪。',
          '那地方，本来是留给她坐的。',
          '阿禾，爸知道自己不是亲生的，可总怕他觉得，这个儿子到底隔着一层。',
        ],
        { ending: kind, endingStep: 2 },
      );
    else
      addReply(
        typedText || '爸，信发给你了。你慢慢看，我就在屋里。',
        [
          '好。',
          '看着这封信，我又想起那条围巾。我小时候拿它给自己当过被子。',
          '他也没生气，给我盖了床厚被。第二天醒来，围巾已经叠好，放回柜里了。',
          '我早知道是许老师留下的。今天才明白，他把这么舍不得的东西，也给我盖过。',
          '围巾是她怕他冷，给他织的。后来他又拿来怕我冷。',
        ],
        { ending: kind, endingStep: 2 },
      );
    if (kind === 'quiet' && !fatherTyping)
      setSave((current) => ({
        ...current,
        messages: [
          ...current.messages,
          {
            who: 'me',
            text: '爷爷写给建军的信',
            attachment: 'grandfather-letter',
            time: storyTime,
          },
        ],
      }));
  }
  function finishEnding(typedText?: string) {
    addReply(
      typedText ||
        (save.ending === 'read'
          ? '爸，你就是他的儿子。'
          : '爸，进屋吧，我们一块吃饭。'),
      save.ending === 'read'
        ? [
            '我知道。',
            '四十年前是。现在也是。',
            '阿禾，把那只红花碗拿来。',
            '咱们叫奶奶吃饭。',
          ]
        : [
            '嗯。',
            '一到这个门口，我就想喊他。可喊了，也没人应了。',
            '阿禾，给爷爷也摆上。',
            '他等咱们一辈子了。',
          ],
      { endingStep: 3 },
    );
    if (fatherTyping) return;
    setSave((current) => ({
      ...current,
      pending: [
        ...current.pending,
        {
          contact: 'mom',
          who: 'mom',
          text: '阿禾，水开了。扶你爸进屋吧，饭咱们一块吃。',
        },
        {
          contact: 'aunt',
          who: 'me',
          text: '爸，晚饭后我写了几句，也发给你。',
          attachment: 'reply-final',
          time: '18:36',
        },
      ],
    }));
  }

  function selectFile(f: FileItem) {
    if (isGrandfatherFavorite(f) && !save.wechatUnlocked) return;
    if (f.kind === 'folder') {
      if (folderIsLocked(f.id)) {
        setLockedFolder(f.id as 'future' | 'winter-archive' | MemoryLock);
        setPasswordOpen(true);
        setFolderPassword('');
        setPasswordError('');
        return;
      }
      setFolder(f.destination || 'root');
      setFileSearch('');
      return;
    }
    if (f.kind === 'link') {
      navigate('postoffice');
      setLetterId('HL19811124');
      openApp('browser');
      setSave((s) => ({
        ...s,
        opened: Array.from(new Set([...s.opened, f.id])),
      }));
      return;
    }
    setSelectedFile(f);
    setSave((s) => ({
      ...s,
      opened: Array.from(new Set([...s.opened, f.id])),
    }));
    openApp('reader');
  }
  function unlockFolder(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (
      compact(folderPassword) !==
      (lockedFolder === 'future'
        ? '1124'
        : lockedFolder === 'winter-archive'
          ? '0847'
          : memoryLocks[lockedFolder].password)
    ) {
      setPasswordError('密码不正确。');
      return;
    }
    setSave((s) => ({
      ...s,
      ...(lockedFolder === 'future'
        ? { folderOpen: true }
        : lockedFolder === 'winter-archive'
          ? { winterArchiveOpen: true }
          : {
              memoryFolders: [...new Set([...s.memoryFolders, lockedFolder])],
            }),
    }));
    setPasswordOpen(false);
    setFolder(lockedFolder);
    setFileSearch('');
    openApp('files');
  }
  function restoreFile() {
    setSave((s) => ({ ...s, restored: true }));
    setToast({
      title: '回收站',
      text: '“没写完_给知遥.png”已还原到此电脑。',
      app: 'files',
    });
  }
  function pageAddress(page: string, term = '') {
    return page === 'start'
      ? 'about:home'
      : page === 'postoffice'
        ? 'https://letter.example/receive'
        : page === 'results'
          ? 'https://shiye.example/search?q=' + encodeURIComponent(term)
          : 'https://hulan.example/old-town/' + page;
  }
  function applyVisit(v: Visit) {
    setBrowserPage(v.page);
    setSearched(v.query);
    setQuery(v.query);
    setAddress(pageAddress(v.page, v.query));
    setPostalError('');
  }
  function navigate(page: string, term = searched) {
    const title =
      page === 'start'
        ? '新标签页'
        : page === 'results'
          ? term + ' - 拾页搜索'
          : page === 'postoffice'
            ? '乡邮保管箱'
            : webPages.find((p) => p.id === page)?.title || '网页';
    const v = { page, query: term, title };
    applyVisit(v);
    const last = browserTrail[browserCursor];
    if (last?.page !== page || last.query !== term) {
      const trail = [...browserTrail.slice(0, browserCursor + 1), v];
      setBrowserTrail(trail);
      setBrowserCursor(trail.length - 1);
    }
    if (page !== 'start')
      setExtras((s) => ({
        ...s,
        visits: [
          v,
          ...s.visits.filter((x) => x.page !== page || x.query !== term),
        ].slice(0, 60),
      }));
  }
  function browserStep(delta: number) {
    const index = browserCursor + delta;
    if (index < 0 || index >= browserTrail.length) return;
    setBrowserCursor(index);
    applyVisit(browserTrail[index]);
  }
  function bookmarkPage() {
    const v = browserTrail[browserCursor];
    setExtras((s) => ({
      ...s,
      bookmarks: s.bookmarks.some(
        (x) => x.page === v.page && x.query === v.query,
      )
        ? s.bookmarks.filter((x) => x.page !== v.page || x.query !== v.query)
        : [...s.bookmarks, v],
    }));
  }
  function browserSearch(text: string) {
    const q = text.trim();
    if (!q) {
      navigate('start');
      return;
    }
    setQuery(q);
    setSearched(q);
    if (/乡邮保管箱|letter\.example|给建军|给阿禾|HL19811124/i.test(q)) {
      navigate('postoffice');
      if (q.includes('HL19811124')) setLetterId('HL19811124');
    } else if (/hulan\.example/.test(q)) {
      const target = webPages.find((p) => q.includes('/' + p.id));
      navigate(target?.id || 'bookstore');
    } else navigate('results', q);
  }
  function unlockPost(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!save.postalOpen && !save.memoryFolders.includes('table')) {
      setPostalError('未加载原始回执。请从“南窗底下”中的保管箱链接进入。');
      return;
    }
    if (compact(letterId) !== 'hl19811124') {
      setPostalError('没有找到这个编号的信件，请核对保存的原始编号。');
      return;
    }
    if (
      compact(letterPassword) !== '等春天来' &&
      compact(letterPassword) !== '等春天來'
    ) {
      setPostalError('收件口令不匹配。请使用寄信人设定的四字口令。');
      return;
    }
    if (!save.postalOpen) {
      setSave((s) => ({
        ...s,
        postalOpen: true,
        messages: [
          ...s.messages,
          { who: 'aunt', text: '我到村口了。你那边怎么样？' },
        ],
      }));
      setToast({
        title: '陆建军',
        text: '我到村口了。你那边怎么样？',
        app: 'chat',
      });
    }
  }
  function readMail(id: string) {
    setMailId(id);
    setSave((s) => ({
      ...s,
      readMails: Array.from(new Set([...s.readMails, id])),
    }));
  }
  function resetGame() {
    setFilmOpen(false);
    setExtras(emptyExtras());
    setChatView('chat');
    setMomentFilter(null);
    setProfile(null);
    setGallery(null);
    setChatDetails(false);
    setBrowserTrail([{ page: 'start', query: '', title: '新标签页' }]);
    setBrowserCursor(0);
    setEntered(false);
    setSave(initial());
    setWins([{ id: 'chat', min: false, max: false, x: 0, y: 0 }]);
    setContact('aunt');
    setFolder('root');
    setSelectedFile(null);
    setBrowserPage('start');
    setLetterId('');
    setLetterPassword('');
    setSearched('');
    setQuery('');
    setAddress('about:home');
    setResetOpen(false);
    setPasswordOpen(false);
    setToast(null);
    setHistoryYear('all');
    setHistorySearch('');
    setMailFolder('inbox');
    setMailId('move-mail');
  }
  function shortcut(id: AppId) {
    setSelectedShortcut(id);
    if (window.innerWidth < 760) openApp(id);
  }
  const filteredFiles = availableFiles(save, folder)
    .filter((f) => f.name.includes(fileSearch))
    .sort((a, b) => {
      if (a.kind === 'folder' && b.kind !== 'folder') return -1;
      if (b.kind === 'folder' && a.kind !== 'folder') return 1;
      return fileSort === 'date'
        ? b.date.localeCompare(a.date)
        : a.name.localeCompare(b.name, 'zh-CN');
    });
  const results = webPages.filter(
    (p) =>
      !searched ||
      ['呼兰乡村记', '旧城记'].includes(searched) ||
      p.keywords.some(
        (k) =>
          compact(searched).includes(compact(k)) ||
          compact(k).includes(compact(searched)),
      ),
  );
  const playerContacts = [
    {
      id: 'aunt',
      name: '陆建军',
      preview: save.messages.at(-1)?.text || '电脑开了吗？',
      avatar: '遥',
      color: 'sage',
    },
    {
      id: 'history',
      name: familyGroupName,
      preview: extras.threads.history?.at(-1)?.text || '家庭群 · 4 人',
      avatar: '陆',
      color: 'brown',
    },
    {
      id: 'mom',
      name: '陈淑琴',
      preview:
        extras.threads.mom?.at(-1)?.text ||
        '阿禾，你爸要是难受，你就陪他坐会儿。',
    },
    {
      id: 'zhou',
      name: '桂兰奶奶',
      preview: '那张合影，一直在柜上。',
      avatar: '周',
      color: 'ochre',
    },
    {
      id: 'transfer',
      name: '文件传输助手',
      preview:
        extras.threads[viewer === 'lu' ? 'lu:transfer' : 'transfer']?.at(-1)
          ?.text || '',
      avatar: '文',
      color: 'green',
    },
  ];
  const contacts =
    viewer === 'me'
      ? [
          ...playerContacts.slice(0, 4),
          {
            id: 'lu',
            name: '爷爷',
            preview:
              extras.threads.lu?.at(-1)?.text ||
              grandfatherThreads.lu.at(-1)!.text,
          },
          playerContacts[4],
        ]
      : [
          {
            id: 'history',
            name: familyGroupName,
            preview: extras.threads.history?.at(-1)?.text || '家庭群 · 4 人',
          },
          ...(['aunt', 'mom', 'me', 'zhou'] as PersonId[]).map((id) => {
            const key = id === 'me' ? 'lu' : `lu:${id}`;
            return {
              id,
              name: people[id].name,
              preview:
                extras.threads[key]?.at(-1)?.text ||
                grandfatherThreads[key]?.at(-1)?.text ||
                '',
            };
          }),
          {
            id: 'transfer',
            name: '文件传输助手',
            preview: extras.threads['lu:transfer']?.at(-1)?.text || '',
          },
        ];
  function switchAccount(account: 'me' | 'lu') {
    setSave((s) => ({
      ...s,
      wechatAccount: account,
      wechatUnlocked: s.wechatUnlocked || account === 'lu',
    }));
    setContact(account === 'lu' ? 'history' : 'aunt');
    setChatView('chat');
    setHistoryYear('all');
    setHistorySearch('');
    setContactSearch('');
    setMomentFilter(null);
    setAccountDialog(false);
    setAccountLogin(false);
    setLoginPassword('');
    setLoginError('');
    setProfile(null);
  }
  function openPersonChat(id: PersonId) {
    setChatView('chat');
    setContact(id === viewer ? 'transfer' : id);
    openApp('chat');
  }
  function sendChat(text: string) {
    const value = text.trim();
    if (!value || typing) return;
    setExtras((e) => ({ ...e, drafts: { ...e.drafts, [draftKey]: '' } }));
    if (viewer === 'lu') {
      setExtras((e) => ({
        ...e,
        threads: {
          ...e.threads,
          [threadKey]: [
            ...(e.threads[threadKey] || []),
            { who: 'other', sender: 'lu', text: value, time: storyTime },
          ],
        },
      }));
      if (contact === 'history') {
        setHistoryYear('2025');
        setHistorySearch('');
      }
      const responder = contact === 'history' ? 'mom' : contact;
      if (responder === 'aunt' || responder === 'mom' || responder === 'zhou') {
        const first = !extras.threads[threadKey]?.some(
          (m) => m.sender === 'lu',
        );
        const reply =
          responder === 'zhou'
            ? first
              ? '阿禾，是你在用守义的号吧？你爸跟我说你回去了。'
              : '慢慢看吧。他舍不得删的，都是心里放不下的。'
            : first
              ? '阿禾，是你登了爷爷的号吧？刚看见这个头像亮起来，我还愣了一下。'
              : '看见了。爷爷的东西先留着，你有话用自己的号跟我们说。';
        setSave((s) => ({
          ...s,
          pending: [
            ...s.pending,
            {
              contact: threadKey,
              who: responder,
              text: reply,
              time: storyTime,
            },
          ],
        }));
      }
      return;
    }
    if (contact === 'aunt') {
      if (
        save.endingStep === 0 &&
        !save.topics.includes('voice') &&
        /记不清.*声音|忘.*声音|她的声音|知遥.*声音/.test(value)
      )
        return talkTopic('voice', value);
      if (
        save.endingStep === 0 &&
        !save.topics.includes('table') &&
        /南窗|小桌|桌角/.test(value)
      )
        return talkTopic('table', value);
      if (
        save.endingStep === 0 &&
        save.opened.includes('farewell') &&
        !save.topics.includes('loss') &&
        /没写完|未写完|给知遥/.test(value)
      )
        return talkTopic('loss', value);
      if (
        save.endingStep === 0 &&
        save.opened.includes('sea') &&
        !save.topics.includes('sea') &&
        /小时候|小时的事|系鞋带/.test(value)
      )
        return talkTopic('sea', value);
      if (
        save.postalOpen &&
        save.endingStep === 0 &&
        /信|爷爷说|找到了|看完了|读完了/.test(value)
      )
        return beginEnding(value);
      if (
        save.endingStep === 0 &&
        save.intro === 0 &&
        /合影|姑娘|照片.*(人|谁)/.test(value)
      )
        return introReply(value);
      if (
        save.endingStep === 0 &&
        save.intro === 1 &&
        /先看|慢点|我来|好的/.test(value)
      )
        return introReply(value);
      if (
        save.endingStep === 1 &&
        /慢慢|一起看|坐|信.*(发|看)|发.*信|发给|看看|看吧/.test(value)
      )
        return chooseEnding('quiet', value);
      if (save.endingStep === 1 && /爷爷说|声音|念|读/.test(value))
        return chooseEnding('read', value);
      if (save.endingStep === 2 && /儿子|吃饭|我在|嗯/.test(value))
        return finishEnding(value);
      const reply = /吃饭|买菜|饺子/.test(value)
        ? supperFinished
          ? '嗯，今天这顿饭，爸记住了。剩下的饺子妈收好了。'
          : parentsArrived
            ? '你妈在灶间烧水，等会儿咱们一块煮饺子。'
            : '爷爷包的饺子还在冰柜里。你妈说，等到家一起煮。'
        : /围巾/.test(value)
          ? '那是许老师留下的，爷爷留了几十年。你先把它叠好。'
          : /妈妈|我妈|淑琴/.test(value)
            ? supperFinished
              ? '你妈就在屋里，刚把碗收好。'
              : parentsArrived
                ? '你妈在灶间忙呢，水已经烧上了。'
                : '你妈在车上陪着我。她说到家先把炕烧热。'
            : /屯子|桂兰|学校/.test(value)
              ? '桂兰奶奶一直住在屯子里，很多旧事她都记得。'
              : /亲生|收养|领养|养子/.test(value)
                ? '我知道自己是他领回来的。可他养了我四十年，我一直喊他爸。'
                : /照片|知遥|许老师/.test(value)
                  ? '许老师，我记得。小时候她给我热过饭。爷爷很少细说他们俩的事。'
                  : supperFinished
                    ? '爸在呢。今天不赶着走，咱们再坐一会儿。'
                    : parentsArrived
                      ? '爸在院门口坐着，消息都看着呢。你慢慢说。'
                      : '看到了。我在回屯子的路上，一会儿到家跟你说。';
      addReply(value, [reply]);
      return;
    }
    const id = contact;
    setExtras((e) => ({
      ...e,
      threads: {
        ...e.threads,
        [id]: [
          ...(e.threads[id] || []),
          { who: 'me', sender: 'me', text: value, time: storyTime },
        ],
      },
    }));
    let replies: { who: PersonId; text: string }[] = [];
    if (id === 'mom')
      replies = /吃饭|饺子|饿|到哪|到了|路上/.test(value)
        ? [
            {
              who: 'mom',
              text: supperFinished
                ? '妈在屋里。锅里还留着几个饺子，饿了再给你热。'
                : parentsArrived
                  ? '妈在灶间烧水。你陪着你爸，等会儿咱们一块吃。'
                  : '我和你爸还在路上。冰柜里有爷爷包的饺子，等我们到了煮。',
            },
          ]
        : /南窗|小桌|桌角/.test(value)
          ? [
              {
                who: 'mom',
                text: '那张桌子你爷爷修过好几回。我问要不要换张新的，他说原来量的就是这个尺寸。',
              },
              {
                who: 'mom',
                text: '我后来才知道，尺寸是许老师量的。她想坐在南窗底下补衣裳。',
              },
              {
                who: 'mom',
                text: '去年我擦桌子，他在边上站着，说太阳正好。我就把抹布放下，陪他站了一会儿。',
              },
            ]
          : /照片|奶奶|许老师|爷爷|知遥/.test(value)
            ? [
                {
                  who: 'mom',
                  text: '那张照片，你爷爷擦了一辈子。我刚嫁过来时就在那儿。',
                },
                {
                  who: 'mom',
                  text: '每年我多摆一只碗，他嘴上不说，吃饭前总要把碗挪正。',
                },
                {
                  who: 'mom',
                  text: '阿禾，有些事你爸不好意思问。你陪着他，慢慢看。',
                },
              ]
            : /爸|难受|哭/.test(value)
              ? [
                  {
                    who: 'mom',
                    text: '你爸这两天一闲下来就摸口袋里的钥匙。以前回来，从来用不着他开门。',
                  },
                  {
                    who: 'mom',
                    text: '他不想说就先不问。我陪了他这么些年，知道他心里舍不得。',
                  },
                ]
              : [
                  {
                    who: 'mom',
                    text: supperFinished
                      ? '妈在呢。今天咱们就在老屋住下，外套给你挂门后了。'
                      : parentsArrived
                        ? '妈在灶间，外套给你挂门后了。你先陪着你爸。'
                        : '妈在呢。我和你爸一会儿就到，给你带了件厚外套。',
                  },
                  {
                    who: 'mom',
                    text: supperFinished
                      ? '夜里凉，别在外头站太久。'
                      : '窗户别开太久，老屋凉。饿了先垫一口。',
                  },
                ];
    if (id === 'zhou')
      replies = [
        {
          who: 'zhou',
          text: /收养|领养|建军|我爸|爸爸/.test(value)
            ? '你爸进家那天，是我办的手续。你爷爷说，往后这孩子跟我姓，有自己的家了。'
            : /屯子|合影|照片|爷爷|知遥|许老师|奶奶/.test(value)
              ? '你爷爷和知遥的事，我都记得。乡村记里那篇文章，就是写他们俩的。'
              : '有空带你爸妈来坐坐。屋里炕烧得热。',
        },
      ];
    if (id === 'zhou' && /相爱|谈恋爱|年轻|手套|车铃|怎么认识/.test(value))
      replies = [
        {
          who: 'zhou',
          text: '可别以为他俩只会苦着。知遥在教室里，他路过故意捏两声车铃。她推开窗骂他扰乱课堂，骂完自己笑。',
        },
        {
          who: 'zhou',
          text: '她也疼他。冬天陪他坐修车铺，手里给孩子补袄，眼睛盯着他的手，见他不戴手套就念叨。',
        },
        {
          who: 'zhou',
          text: '那时候我真觉得，往后这两个人的日子，一定能过好。',
        },
      ];
    if (id === 'zhou' && /最后|去世|走的|没等到|红棉袄/.test(value))
      replies = [
        {
          who: 'zhou',
          text: '发病前一天，她还跟我说新屋朝南的窗户亮，要在下面摆张小桌。她想的是开春的日子。',
        },
        {
          who: 'zhou',
          text: '从县里回来，守义先去学校，把她留在窗台上的半块肥皂拿走了。我劝他别拿那个，他说她手套还没洗。',
        },
        { who: 'zhou', text: '后来洗净了，晾干，收起来。那双手套再也没脏过。' },
      ];
    if (id === 'history') {
      setHistoryYear('2025');
      setHistorySearch('');
      replies = [
        {
          who: 'mom',
          text: supperFinished
            ? '看见了，阿禾。妈和你爸都在屋里。'
            : parentsArrived
              ? '看见了，阿禾。妈在灶间，你爸在院门口坐着。'
              : '看见了，阿禾。我和你爸还在路上。',
        },
        {
          who: 'aunt',
          text: supperFinished
            ? '今天这顿饭，爸记住了。以后也常回来。'
            : parentsArrived
              ? '爸到家了。缓一会儿就进屋，咱们一块吃饭。'
              : '群里的老消息先留着，别删。等我回去，咱们一起看。',
        },
      ];
    }
    if (replies.length)
      setSave((current) => ({
        ...current,
        pending: [
          ...current.pending,
          ...replies.map((m) => ({ ...m, contact: id, time: storyTime })),
        ],
      }));
  }
  function renderChat() {
    return (
      <div
        className={
          'wechat-layout ' + (chatView !== 'chat' ? 'social-mode' : '')
        }
      >
        <aside className="wechat-rail">
          <Avatar
            id={viewer}
            className="player-avatar"
            onClick={() => setProfile(viewer)}
          />
          <button
            className={chatView === 'chat' ? 'selected' : ''}
            onClick={() => {
              setChatView('chat');
              setContact('aunt');
            }}
            aria-label="当前聊天"
          >
            <MessageCircle size={24} />
          </button>
          <button
            className={chatView === 'contacts' ? 'selected' : ''}
            onClick={() => setChatView('contacts')}
            aria-label="通讯录"
            title="通讯录"
          >
            <Users size={23} />
          </button>
          <button
            className={chatView === 'moments' ? 'selected' : ''}
            onClick={() => {
              setChatView('moments');
              setMomentFilter(null);
            }}
            aria-label="朋友圈"
            title="朋友圈"
          >
            <span className="moments-symbol" />
          </button>
          <button
            onClick={() => {
              setChatView('chat');
              setContact('history');
            }}
            aria-label="打开旧聊天记录"
            title="聊天记录"
          >
            <Archive size={22} />
          </button>
          <button
            onClick={() => {
              setChatView('chat');
              setContact('transfer');
            }}
            aria-label="文件传输助手"
          >
            <FolderOpen size={23} />
          </button>
          <button
            aria-label="收藏"
            title="收藏"
            className={chatView === 'favorites' ? 'selected' : ''}
            onClick={() => setChatView('favorites')}
          >
            <Star size={23} />
          </button>
          <button
            className="rail-bottom"
            onClick={() => {
              setAccountDialog(true);
              setAccountLogin(false);
            }}
            aria-label="微信设置"
          >
            <Settings size={22} />
          </button>
        </aside>
        {chatView === 'favorites' ? (
          <WechatFavorites key={viewer} owner={viewer} onOpen={selectFile} />
        ) : chatView === 'moments' ? (
          <MomentsView
            key={viewer}
            viewer={viewer}
            storyTime={storyTime}
            extras={extras}
            setExtras={setExtras}
            filter={momentFilter}
            setFilter={setMomentFilter}
            onProfile={setProfile}
            onPhoto={setGallery}
          />
        ) : chatView === 'contacts' ? (
          <ContactsView viewer={viewer} onProfile={setProfile} />
        ) : (
          <>
            <aside className="contact-column">
              <div className="contact-search">
                <Search size={15} />
                <input
                  aria-label="搜索联系人"
                  placeholder="搜索"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                />
              </div>
              <div className="contact-list">
                {[...contacts]
                  .sort(
                    (a, b) =>
                      Number(extras.pinned.includes(preferenceKey(b.id))) -
                      Number(extras.pinned.includes(preferenceKey(a.id))),
                  )
                  .filter(
                    (c) =>
                      c.name.includes(contactSearch) ||
                      c.preview.includes(contactSearch),
                  )
                  .map((c) => (
                    <button
                      key={c.id}
                      className={
                        'contact ' +
                        (contact === c.id ? 'active' : '') +
                        (extras.pinned.includes(preferenceKey(c.id))
                          ? ' pinned-contact'
                          : '')
                      }
                      onClick={() => setContact(c.id as typeof contact)}
                    >
                      {c.id === 'history' ? (
                        <GroupAvatar />
                      ) : (
                        <Avatar id={c.id as PersonId | 'transfer'} />
                      )}
                      <span>
                        <strong>{c.name}</strong>
                        <small>{c.preview}</small>
                        <time className="contact-time">
                          {(() => {
                            const key =
                              viewer === 'me' || c.id === 'history'
                                ? c.id
                                : c.id === 'me'
                                  ? 'lu'
                                  : 'lu:' + c.id;
                            const latest =
                              viewer === 'me' && c.id === 'aunt'
                                ? save.messages.at(-1)
                                : extras.threads[key]?.at(-1);
                            return latest
                              ? latest.time || '16:08'
                              : c.id === 'transfer'
                                ? ''
                                : c.id === 'history' ||
                                    c.id === 'lu' ||
                                    viewer === 'lu'
                                  ? '2025/11/16'
                                  : c.id === 'mom'
                                    ? '星期日'
                                    : '星期六';
                          })()}
                        </time>
                        {extras.muted.includes(preferenceKey(c.id)) && (
                          <BellOff className="contact-muted" size={12} />
                        )}
                      </span>
                      {viewer === 'me' &&
                        c.id === 'aunt' &&
                        save.intro === 0 && <i className="unread-dot" />}
                    </button>
                  ))}
                {!contacts.some(
                  (c) =>
                    c.name.includes(contactSearch) ||
                    c.preview.includes(contactSearch),
                ) && <p className="nothing-small">没有找到联系人</p>}
              </div>
            </aside>
            <section className="conversation">
              <header className="conversation-head">
                <div>
                  <strong>
                    {contacts.find((c) => c.id === contact)?.name}
                    {contact === 'history' ? '（4）' : ''}
                  </strong>
                </div>
                <button
                  aria-label="聊天详情"
                  onClick={() => setChatDetails(true)}
                >
                  <MoreHorizontal size={23} />
                </button>
              </header>
              {contact === 'history' && (
                <div className="history-tools">
                  <Tabs
                    value={historyYear}
                    onValueChange={(v) => setHistoryYear(String(v))}
                  >
                    <TabsList>
                      {['all', '2015', '2019', '2023', '2025'].map((y) => (
                        <TabsTrigger key={y} value={y}>
                          {y === 'all' ? '全部' : y}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                  <label>
                    <Search size={14} />
                    <input
                      aria-label="搜索聊天记录"
                      placeholder="搜索聊天记录"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                    />
                  </label>
                </div>
              )}
              <div className="conversation-scroll" ref={chatScroll}>
                {viewer === 'me' && contact === 'aunt' && (
                  <>
                    <div className="chat-date">2025 年 11 月 24 日 · 16:08</div>
                    {save.messages.map((m, i) => (
                      <Fragment key={i}>
                        {m.time === '18:36' &&
                          save.messages[i - 1]?.time !== '18:36' && (
                            <div className="chat-date">
                              2025 年 11 月 24 日 · 18:36
                            </div>
                          )}
                        <div
                          className={
                            'message ' +
                            (m.who === viewer ? 'sent' : 'received')
                          }
                        >
                          <Avatar
                            id={m.who === 'me' ? 'me' : 'aunt'}
                            onClick={() =>
                              setProfile(m.who === 'me' ? 'me' : 'aunt')
                            }
                          />
                          <div className="bubble">
                            {m.attachment ? (
                              <>
                                <p>{m.text}</p>
                                <button
                                  className="chat-attachment"
                                  onClick={() => {
                                    if (m.attachment === 'grandfather-letter') {
                                      navigate('postoffice');
                                      openApp('browser');
                                    } else selectFile(replyFile);
                                  }}
                                >
                                  <FileText size={30} />
                                  <span>
                                    <strong>
                                      {m.attachment === 'grandfather-letter'
                                        ? '爷爷写给建军的信'
                                        : '回家吃饭.txt'}
                                    </strong>
                                    <small>
                                      {m.attachment === 'grandfather-letter'
                                        ? '转发的信件'
                                        : '文本文档 · 陆禾'}
                                    </small>
                                  </span>
                                </button>
                              </>
                            ) : m.who === 'me' ? (
                              m.text
                            ) : (
                              reviseNpcDialogue(m.text)
                            )}
                          </div>
                        </div>
                      </Fragment>
                    ))}
                  </>
                )}
                {contact === 'history' && (
                  <>
                    {history
                      .filter(
                        (m) =>
                          (historyYear === 'all' || m.date === historyYear) &&
                          (!historySearch || m.text.includes(historySearch)),
                      )
                      .map((m, i) =>
                        m.who === 'system' ? (
                          <div key={i} className="chat-date">
                            {viewer === 'lu'
                              ? m.text.replace(
                                  '“老陆”“陆建军”和你',
                                  '你、“陆建军”和“陆禾”',
                                )
                              : m.text}
                          </div>
                        ) : (
                          <div
                            key={i}
                            className={
                              'message ' +
                              (m.who === viewer ? 'sent' : 'received')
                            }
                          >
                            <Avatar
                              id={m.who}
                              onClick={() => setProfile(m.who as PersonId)}
                            />
                            <div className="group-message-content">
                              <small className="group-sender">
                                {people[m.who].name}
                              </small>
                              <div className="bubble">{m.text}</div>
                            </div>
                          </div>
                        ),
                      )}
                    {!history.some(
                      (m) =>
                        (historyYear === 'all' || m.date === historyYear) &&
                        (!historySearch || m.text.includes(historySearch)),
                    ) &&
                      !(extras.threads.history || []).some(
                        (m) =>
                          (historyYear === 'all' || historyYear === '2025') &&
                          (!historySearch || m.text.includes(historySearch)),
                      ) && (
                        <p className="blank-state">未找到匹配的聊天记录。</p>
                      )}
                    {!!extras.threads.history?.length &&
                      (historyYear === 'all' || historyYear === '2025') &&
                      !historySearch && (
                        <div className="chat-date">
                          2025 年 11 月 24 日 · 16:08
                        </div>
                      )}
                  </>
                )}
                {viewer === 'me' && contact === 'mom' && (
                  <>
                    <div className="chat-date">2025 年 11 月 23 日 · 21:36</div>
                    {[
                      '阿禾，明天回老屋穿厚点。我把外套装好了。',
                      '你爸昨晚拿着钥匙坐了半宿，说要去看看，临出门又坐下了。',
                      '他要是难受，你就陪他坐会儿。妈明天和他一块过去。',
                    ].map((text) => (
                      <div className="message received" key={text}>
                        <Avatar id="mom" onClick={() => setProfile('mom')} />
                        <div className="bubble">{text}</div>
                      </div>
                    ))}
                  </>
                )}
                {viewer === 'me' && contact === 'zhou' && (
                  <>
                    <div className="chat-date">2025 年 11 月 20 日 · 19:08</div>
                    <div className="message received">
                      <Avatar id="zhou" />
                      <div className="bubble">
                        <button
                          className="chat-attachment"
                          onClick={() =>
                            selectFile(files.find((f) => f.id === 'river')!)
                          }
                        >
                          <FileText size={26} />
                          <span>桂兰奶奶的留言.txt</span>
                        </button>
                      </div>
                    </div>
                    <div className="chat-date">2025 年 11 月 22 日</div>
                    <div className="message received">
                      <Avatar id="zhou" onClick={() => setProfile('zhou')} />
                      <div className="bubble">
                        阿禾，你爸说你过两天回屯子收拾老屋。
                      </div>
                    </div>
                    <div className="message received">
                      <Avatar id="zhou" onClick={() => setProfile('zhou')} />
                      <div className="bubble">
                        以前的小学已经不在了。你爷爷和许老师那张合影，是我拍的。村里把旧事整理在“呼兰乡村记”里了。
                      </div>
                    </div>
                    <div className="message received">
                      <Avatar id="zhou" onClick={() => setProfile('zhou')} />
                      <div className="bubble">
                        你爷爷把你爸接回家那天，是我办的手续。他说，家里炕大，多住个孩子也睡得下。
                      </div>
                    </div>
                    <button
                      className="web-share"
                      onClick={() => {
                        browserSearch('柳河屯');
                        openApp('browser');
                      }}
                    >
                      <Globe2 size={28} />
                      <span>
                        呼兰乡村记<small>柳河屯的旧照片与旧人</small>
                      </span>
                      <ExternalLink size={15} />
                    </button>
                  </>
                )}
                {(grandfatherThreads[threadKey] || []).map((m, i, all) => (
                  <Fragment key={'archive-' + i}>
                    {(i === 0 || m.time !== all[i - 1].time) && (
                      <div className="chat-date">{m.time}</div>
                    )}
                    <div
                      className={
                        'message ' + (m.who === viewer ? 'sent' : 'received')
                      }
                    >
                      <Avatar id={m.who} onClick={() => setProfile(m.who)} />
                      <div className="bubble">{m.text}</div>
                    </div>
                  </Fragment>
                ))}
                {(viewer === 'lu' || contact !== 'aunt') &&
                  contact !== 'history' &&
                  !!extras.threads[threadKey]?.length && (
                    <div className="chat-date">2025 年 11 月 24 日 · 16:08</div>
                  )}
                {(viewer === 'lu' || contact !== 'aunt') &&
                  (contact !== 'history' ||
                    historyYear === 'all' ||
                    historyYear === '2025') &&
                  (extras.threads[threadKey] || [])
                    .filter(
                      (m) =>
                        contact !== 'history' ||
                        !historySearch ||
                        m.text.includes(historySearch),
                    )
                    .map((m, i) => {
                      const sender =
                        m.sender ||
                        (m.who === 'me'
                          ? 'me'
                          : m.sender ||
                            (contact === 'mom'
                              ? 'mom'
                              : contact === 'zhou'
                                ? 'zhou'
                                : 'aunt'));
                      return (
                        <Fragment key={i}>
                          {m.time === '18:36' &&
                            (extras.threads[threadKey] || []).filter(
                              (line) =>
                                contact !== 'history' ||
                                !historySearch ||
                                line.text.includes(historySearch),
                            )[i - 1]?.time !== '18:36' && (
                              <div className="chat-date">
                                2025 年 11 月 24 日 · 18:36
                              </div>
                            )}
                          <div
                            className={
                              'message ' +
                              (sender === viewer ? 'sent' : 'received')
                            }
                          >
                            <Avatar
                              id={sender}
                              onClick={() => setProfile(sender)}
                            />
                            <div className="group-message-content">
                              {contact === 'history' && (
                                <small className="group-sender">
                                  {people[sender].name}
                                </small>
                              )}
                              <div className="bubble">
                                {m.who === 'me' || sender === 'lu'
                                  ? m.text
                                  : reviseNpcDialogue(m.text)}
                              </div>
                            </div>
                          </div>
                        </Fragment>
                      );
                    })}
                {save.pending.some(
                  (m) => m.contact === threadKey && m.who !== 'me',
                ) && (
                  <div className="sr-only" aria-live="polite">
                    {contact === 'history'
                      ? people[
                          save.pending.find((m) => m.contact === threadKey)!.who
                        ].name
                      : '对方'}
                    正在输入<span>···</span>
                  </div>
                )}
              </div>
              {
                <div className="chat-compose">
                  <div className="compose-tools">
                    <Popover>
                      <PopoverTrigger
                        aria-label="表情"
                        className="emoji-trigger"
                      >
                        <Smile size={21} />
                      </PopoverTrigger>
                      <PopoverContent className="emoji-picker" side="top">
                        {[
                          '🙂',
                          '😊',
                          '❤️',
                          '🌹',
                          '🍜',
                          '👍',
                          '🥺',
                          '☀️',
                          '🌊',
                          '🎹',
                          '🍵',
                          '🤗',
                        ].map((e) => (
                          <button
                            key={e}
                            aria-label={'插入表情' + e}
                            onClick={() =>
                              setExtras((s) => ({
                                ...s,
                                drafts: {
                                  ...s.drafts,
                                  [draftKey]: (s.drafts[draftKey] || '') + e,
                                },
                              }))
                            }
                          >
                            {e}
                          </button>
                        ))}
                      </PopoverContent>
                    </Popover>
                    <button
                      onClick={() => {
                        setFolder('root');
                        openApp('files');
                      }}
                      aria-label="查看本机文件"
                    >
                      <Paperclip size={20} />
                    </button>
                  </div>
                  {endingReplies.length > 0 && (
                    <div className="ending-replies" aria-label="可选回复">
                      {endingReplies.map((reply) => (
                        <button
                          key={reply.label}
                          title={reply.text}
                          disabled={fatherTyping}
                          onClick={() => {
                            setExtras((s) => ({
                              ...s,
                              drafts: { ...s.drafts, [draftKey]: reply.text },
                            }));
                            document
                              .querySelector<HTMLTextAreaElement>('.chat-input')
                              ?.focus();
                          }}
                        >
                          {reply.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <textarea
                    className="chat-input"
                    aria-label="消息输入框"
                    value={extras.drafts[draftKey] || ''}
                    maxLength={2000}
                    onChange={(e) =>
                      setExtras((s) => ({
                        ...s,
                        drafts: { ...s.drafts, [draftKey]: e.target.value },
                      }))
                    }
                    onKeyDown={(e) => {
                      if (
                        e.key === 'Enter' &&
                        !e.shiftKey &&
                        !e.nativeEvent.isComposing
                      ) {
                        e.preventDefault();
                        sendChat(extras.drafts[draftKey] || '');
                      }
                    }}
                  />
                  <div className="chat-send-row">
                    <button
                      className="wechat-send"
                      disabled={!extras.drafts[draftKey]?.trim() || typing}
                      onClick={() => sendChat(extras.drafts[draftKey] || '')}
                    >
                      发送(S)
                    </button>
                  </div>
                </div>
              }
            </section>
          </>
        )}
      </div>
    );
  }
  function renderMail() {
    return (
      <DesktopMail
        extras={extras}
        setExtras={setExtras}
        folder={mailFolder}
        selected={mailId}
        query={mailSearch}
        read={save.readMails}
        onSelect={readMail}
        onFolder={(f, id) => {
          setMailFolder(f);
          setMailId(id || '');
        }}
        onQuery={setMailSearch}
        notify={(text) => setToast({ title: '邮箱', text })}
      />
    );
  }
  function renderFiles() {
    return (
      <div className="explorer-layout">
        <div className="explorer-toolbar">
          <button
            aria-label="返回此电脑"
            onClick={() => {
              setFolder('root');
              setFileSearch('');
            }}
          >
            <ArrowLeft size={17} />
          </button>
          <button
            aria-label="上一级"
            onClick={() => {
              setFolder(files.find((f) => f.id === folder)?.folder || 'root');
              setFileSearch('');
            }}
            disabled={folder === 'root'}
          >
            <ArrowUp size={17} />
          </button>
          <div className="breadcrumbs">
            <Monitor size={15} />
            <button
              onClick={() => {
                setFolder('root');
                setFileSearch('');
              }}
            >
              此电脑
            </button>
            {folder !== 'root' && (
              <>
                {['winter-archive', 'needle', 'bus', 'table'].includes(
                  folder,
                ) && (
                  <>
                    <ChevronRight size={14} />
                    <button
                      onClick={() => {
                        setFolder('future');
                        setFileSearch('');
                      }}
                    >
                      留着
                    </button>
                  </>
                )}
                {folder === 'table' && (
                  <>
                    <ChevronRight size={14} />
                    <button
                      onClick={() => {
                        setFolder('winter-archive');
                        setFileSearch('');
                      }}
                    >
                      那年冬天
                    </button>
                  </>
                )}
                <ChevronRight size={14} />
                <span>{files.find((f) => f.id === folder)?.name}</span>
              </>
            )}
          </div>
          <label>
            <Search size={15} />
            <input
              aria-label="搜索当前文件夹"
              placeholder="搜索此位置"
              value={fileSearch}
              onChange={(e) => setFileSearch(e.target.value)}
            />
          </label>
        </div>
        <aside className="explorer-side">
          <span>快速访问</span>
          {[
            { id: 'root', name: '此电脑', icon: Monitor },
            { id: 'account', name: '电脑备忘', icon: FileText },
          ].map((f) => (
            <button
              key={f.id}
              className={folder === f.id ? 'active' : ''}
              onClick={() => {
                setFolder(f.id);
                setFileSearch('');
              }}
            >
              <f.icon size={17} />
              {f.name}
            </button>
          ))}
          <div className="drive">
            <span>本地磁盘 (C:)</span>
            <i />
            <small>92.6 GB 可用，共 238 GB</small>
          </div>
        </aside>
        <section className="file-area">
          <div className="file-controls">
            <button
              disabled={!selectedFileRow}
              onClick={() => {
                const f = filteredFiles.find((f) => f.id === selectedFileRow);
                if (f) selectFile(f);
              }}
            >
              <FolderOpen size={15} />
              打开
            </button>
            <button
              disabled={!selectedFileRow}
              onClick={() =>
                setFileInfo(
                  filteredFiles.find((f) => f.id === selectedFileRow) || null,
                )
              }
            >
              <Info size={15} />
              属性
            </button>
            <button
              aria-label={fileGrid ? '切换详细列表' : '切换大图标'}
              onClick={() => setFileGrid((v) => !v)}
            >
              {fileGrid ? <List size={16} /> : <LayoutGrid size={16} />}
            </button>
          </div>
          <div className="file-table-head">
            <button onClick={() => setFileSort('name')}>
              名称 {fileSort === 'name' ? '↑' : ''}
            </button>
            <button onClick={() => setFileSort('date')}>
              修改日期 {fileSort === 'date' ? '↓' : ''}
            </button>
            <span>类型</span>
          </div>
          <div className={fileGrid ? 'file-grid' : 'file-list'}>
            {filteredFiles.map((f) => (
              <button
                key={f.id}
                className={
                  'file-row ' + (selectedFileRow === f.id ? 'selected' : '')
                }
                onClick={() => {
                  setSelectedFileRow(f.id);
                  if (window.matchMedia('(max-width: 760px)').matches)
                    selectFile(f);
                }}
                onDoubleClick={() => selectFile(f)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    selectFile(f);
                  }
                }}
              >
                <span>
                  {fileGrid && f.photo ? (
                    <PhotoTile id={f.photo} />
                  ) : (
                    <FileGlyph file={f} />
                  )}
                  <strong>{f.name}</strong>
                  {folderIsLocked(f.id) && <LockKeyhole size={14} />}
                </span>
                <span>{f.date}</span>
                <span>
                  {f.kind === 'folder'
                    ? '文件夹'
                    : f.kind === 'scan'
                      ? 'PNG 图片'
                      : f.kind === 'photo'
                        ? 'JPG 图片'
                        : f.kind === 'audio'
                          ? 'WAV 音频'
                          : f.kind === 'link'
                            ? '快捷方式'
                            : '文本文档'}
                </span>
              </button>
            ))}
          </div>
          {!filteredFiles.length && (
            <p className="blank-state">此位置没有匹配的文件。</p>
          )}
          <div className="file-status">
            {filteredFiles.length} 个项目{' '}
            <span>双击或 Enter 打开 · 手机上单击</span>
          </div>
        </section>
      </div>
    );
  }
  function renderReader() {
    const f = selectedFile;
    if (!f) return <p className="blank-state">从文件夹中打开一个文件。</p>;
    return (
      <div
        className={
          'reader-content ' + (f.kind === 'photo' ? 'photo-reader' : '')
        }
      >
        <div className="reader-info">
          <FileGlyph file={f} />
          <span>{f.name}</span>
          <small>{f.date}</small>
          <div className="reader-tools">
            <button onClick={() => setFileInfo(f)}>
              <Info size={13} />
              属性
            </button>
          </div>
        </div>
        {f.kind === 'scan' ? (
          <PaperScans key={f.id} id={f.id} />
        ) : f.kind === 'photo' ? (
          <>
            <div className="photo-mat">
              {f.photo ? (
                <PhotoTile id={f.photo} />
              ) : (
                <Image
                  src="/rural-home.png"
                  width={1672}
                  height={941}
                  unoptimized
                  alt="呼兰乡下的老照片"
                />
              )}
            </div>
            <div className="photo-notes">
              {f.body?.map((p, i) => (
                <p key={i} className={proseParagraphClass(p)}>
                  {p}
                </p>
              ))}
            </div>
          </>
        ) : (
          <article
            className={
              'plain-document ' + (f.id === 'reply-final' ? 'final-reply' : '')
            }
          >
            {f.kind === 'audio' && (
              <div className="recording-head">
                <Headphones size={35} />
                <div>
                  <strong>爷爷喊吃饭</strong>
                  <span>录音文字转写 · 00:38</span>
                </div>
                <div className="tape-wave" aria-hidden="true">
                  {Array.from({ length: 24 }, (_, i) => (
                    <i key={i} style={{ height: 10 + ((i * 13) % 28) }} />
                  ))}
                </div>
              </div>
            )}
            {f.body?.map((p, i) => (
              <p key={i} className={proseParagraphClass(p)}>
                {p}
              </p>
            ))}
            {f.id === 'reply-final' && supperFinished && (
              <button className="film-launch" onClick={() => setFilmOpen(true)}>
                播放片尾 · 他们的一生 <ChevronRight size={18} />
              </button>
            )}
          </article>
        )}
      </div>
    );
  }
  function renderTrash() {
    return (
      <div className="trash-content">
        <div className="trash-toolbar">
          <Trash2 size={18} />
          <span>回收站</span>
          <span>原位置：此电脑</span>
        </div>
        {!save.restored ? (
          <>
            <p className="trash-caption">这里的文件尚未永久删除。</p>
            <button className="trash-file" onClick={() => selectFile(farewell)}>
              <ImageIcon size={38} />
              <span>
                <strong>{farewell.name}</strong>
                <small>删除日期：2025/11/15　·　PNG 图片</small>
              </span>
              <ChevronRight size={19} />
            </button>
            <button className="system-button" onClick={restoreFile}>
              <RefreshCw size={15} /> 还原此文件
            </button>
            <p className="trash-note">“有些话删过，又舍不得真的删掉。”</p>
          </>
        ) : (
          <div className="empty-trash">
            <Trash2 size={58} />
            <h3>回收站为空</h3>
            <p>文件已还原到原位置。</p>
            <button
              className="system-button"
              onClick={() => {
                setFolder('root');
                openApp('files');
              }}
            >
              打开文件所在位置
            </button>
          </div>
        )}
      </div>
    );
  }
  function renderBrowser() {
    const page = webPages.find((p) => p.id === browserPage);
    return (
      <div className="browser-layout">
        <div className="browser-tab-strip">
          <span>
            <Globe2 size={13} />
            {browserTrail[browserCursor]?.title.slice(0, 20) || '拾页浏览器'}
            <LockKeyhole size={11} />
          </span>
        </div>
        <div className="browser-chrome">
          <button
            aria-label="后退"
            disabled={browserCursor === 0}
            onClick={() => browserStep(-1)}
          >
            <ArrowLeft size={17} />
          </button>
          <button
            aria-label="前进"
            disabled={browserCursor >= browserTrail.length - 1}
            onClick={() => browserStep(1)}
          >
            <ChevronRight size={18} />
          </button>
          <button
            aria-label="刷新当前页面"
            onClick={() => {
              browserScroll.current?.scrollTo({ top: 0 });
              setPostalError('');
            }}
          >
            <RefreshCw size={15} />
          </button>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              browserSearch(address);
            }}
          >
            <LockKeyhole size={13} />
            <input
              aria-label="地址栏"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onFocus={(e) => e.target.select()}
            />
          </form>
          <button
            className={
              'browser-icon ' +
              (extras.bookmarks.some(
                (v) => v.page === browserPage && v.query === searched,
              )
                ? 'starred'
                : '')
            }
            aria-label="收藏当前网页"
            onClick={bookmarkPage}
          >
            <Star
              size={17}
              fill={
                extras.bookmarks.some(
                  (v) => v.page === browserPage && v.query === searched,
                )
                  ? 'currentColor'
                  : 'none'
              }
            />
          </button>
          <Popover>
            <PopoverTrigger aria-label="浏览历史" className="browser-icon">
              <Clock size={17} />
            </PopoverTrigger>
            <PopoverContent className="browser-menu">
              <h3>历史记录</h3>
              {extras.visits.map((v, i) => (
                <button key={i} onClick={() => navigate(v.page, v.query)}>
                  <Clock size={13} />
                  {v.title}
                </button>
              ))}
              {!extras.visits.length && <p>浏览过的网页会出现在这里。</p>}
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger aria-label="收藏夹" className="browser-icon">
              <MoreHorizontal size={19} />
            </PopoverTrigger>
            <PopoverContent className="browser-menu">
              <h3>收藏夹</h3>
              {extras.bookmarks.map((v, i) => (
                <button key={i} onClick={() => navigate(v.page, v.query)}>
                  <Star size={13} />
                  {v.title}
                </button>
              ))}
              {!extras.bookmarks.length && (
                <p>点地址栏旁的星星，收藏当前网页。</p>
              )}
            </PopoverContent>
          </Popover>
          <button aria-label="浏览器首页" onClick={() => navigate('start', '')}>
            <Home size={16} />
          </button>
        </div>
        <div className="bookmark-bar">
          <button
            onClick={() => {
              browserSearch('呼兰乡村记');
            }}
          >
            <span className="bookmark-dot brown-dot" />
            呼兰乡村记
          </button>
          <button onClick={() => navigate('postoffice')}>
            <span className="bookmark-dot amber-dot" />
            乡邮保管箱
          </button>
        </div>
        <div className="web-viewport" ref={browserScroll}>
          {browserPage === 'start' && (
            <div className="search-home">
              <div className="search-mark">
                <Globe2 size={34} />
                <strong>
                  拾页<span>SHIYE</span>
                </strong>
              </div>
              <p>找回那些，差一点被遗忘的事。</p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  browserSearch(query);
                }}
              >
                <Search size={20} />
                <input
                  aria-label="搜索本机网页"
                  placeholder="搜索"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button type="submit" aria-label="搜索">
                  <ArrowRight size={21} />
                </button>
              </form>
              <div className="browser-links">
                <button
                  onClick={() => {
                    setQuery('呼兰乡村记');
                    browserSearch('呼兰乡村记');
                  }}
                >
                  <span>呼</span>呼兰乡村记
                </button>
                <button onClick={() => navigate('postoffice')}>
                  <Mail size={22} />
                  乡邮保管箱
                </button>
              </div>
            </div>
          )}
          {browserPage === 'results' && (
            <div className="search-results">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  browserSearch(query);
                }}
              >
                <strong>拾页</strong>
                <input
                  aria-label="搜索词"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="输入搜索词"
                />
                <button type="submit" aria-label="重新搜索">
                  <Search size={19} />
                </button>
              </form>
              <div className="result-caption">
                网页 <span>找到 {results.length} 份相关存档</span>
              </div>
              {results.map((p) => (
                <article className="search-result" key={p.id}>
                  <span className="result-domain">
                    <span>呼</span>呼兰乡村记 <small>hulan.example</small>
                  </span>
                  <button onClick={() => navigate(p.id)}>{p.title}</button>
                  <p>{p.summary}</p>
                  <time>{p.date}</time>
                </article>
              ))}
              {!results.length && (
                <div className="no-results">
                  <Search size={38} />
                  <h3>没有找到相关网页</h3>
                  <p>
                    试试更短的人名、地名或店名。这里只保留了这台电脑的网页存档。
                  </p>
                </div>
              )}
            </div>
          )}
          {page && (
            <article className="old-town-article">
              <header>
                <button
                  onClick={() => {
                    browserSearch('呼兰乡村记');
                  }}
                >
                  <span>呼</span>
                  <strong>呼兰乡村记</strong>
                </button>
                <small>让一座小城的往事，有处可寻。</small>
              </header>
              <div className="article-inner">
                <div className="article-category">{page.category}</div>
                <h1>{page.title.split('｜')[0]}</h1>
                <span className="article-date">{page.date}</span>
                <div className="article-rule" />
                {page.body.map((p, i) => (
                  <p key={i} className={proseParagraphClass(p)}>
                    {p}
                  </p>
                ))}
                <footer>
                  本文由屯里的老人们口述整理。
                  <br />
                  每个人，都不只活在最后一页。
                </footer>
              </div>
            </article>
          )}
          {browserPage === 'postoffice' && (
            <div className="postoffice">
              <header>
                <Mail size={25} />
                <strong>乡邮保管箱</strong>
                <span>写给未来的你</span>
              </header>
              {!save.postalOpen ? (
                <section className="post-receive">
                  <span className="post-stamp">一封信，可以等很久。</span>
                  <h1>
                    有人给未来的你，
                    <br />
                    留了一句话。
                  </h1>
                  <p>
                    使用原始信件编号和寄信人设定的口令，
                    <br />
                    打开这封写给未来的信。
                  </p>
                  <form onSubmit={unlockPost}>
                    <label>
                      信件编号
                      <input
                        aria-label="信件编号"
                        value={letterId}
                        onChange={(e) => {
                          setLetterId(e.target.value);
                          setPostalError('');
                        }}
                        placeholder="原始信件编号"
                        autoComplete="off"
                      />
                    </label>
                    <label>
                      收件口令
                      <input
                        aria-label="收件口令"
                        value={letterPassword}
                        onChange={(e) => {
                          setLetterPassword(e.target.value);
                          setPostalError('');
                        }}
                        placeholder="寄信人设定的四字口令"
                        autoComplete="off"
                      />
                    </label>
                    <output className="form-error">{postalError}</output>
                    <button type="submit">
                      打开这封信 <ArrowRight size={17} />
                    </button>
                  </form>
                </section>
              ) : (
                <article className="received-letter">
                  <div className="letter-meta">
                    存于 2025.11.16 · 手写信扫描件 · 共 2 页
                  </div>
                  <h1>给建军的一封信</h1>
                  <span className="letter-byline">
                    存件人：陆守义　 ·　 收信人：陆建军
                  </span>
                  <PaperScans id="father" />
                  <div className="letter-after">
                    <button
                      onClick={() => {
                        switchAccount('me');
                        openApp('chat');
                      }}
                    >
                      给爸爸发消息 <MessageCircle size={16} />
                    </button>
                  </div>
                </article>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
  function renderContent(id: AppId) {
    if (id === 'chat') return renderChat();
    if (id === 'mail') return renderMail();
    if (id === 'files') return renderFiles();
    if (id === 'reader') return renderReader();
    if (id === 'trash') return renderTrash();
    if (id === 'browser') return renderBrowser();
    return (
      <div className="notepad">
        <div className="notepad-toolbar">
          <span>文件</span>
          <span>编辑</span>
          <span>查看</span>
          <small>我的笔记.txt</small>
        </div>
        <textarea
          aria-label="我的笔记"
          placeholder="可以在这里记下自己的推测。\n\n日期、名字、某封信里的半句话……"
          maxLength={15000}
          value={save.notes}
          onChange={(e) => setSave((s) => ({ ...s, notes: e.target.value }))}
        />
        <footer>
          <span>{save.notes.length} 字</span>
          <span>
            {storageError ? '无法保存，请勿关闭页面' : '已保存到本机'}　 ·　
            UTF-8
          </span>
        </footer>
      </div>
    );
  }
  if (!entered)
    return (
      <main className="story-cover">
        <Image
          className="cover-landscape"
          src="/rural-home.png"
          width={1672}
          height={941}
          unoptimized
          alt="呼兰冬日，老屋亮着一扇窗"
          priority
        />
        <div className="cover-shade" />
        <section className="cover-content">
          <p className="cover-place">黑龙江 · 呼兰　 /　 2025 年冬</p>
          <h1>
            呼兰<span>爱情故事</span>
          </h1>
          <p className="cover-line">
            雪又落了一院子。
            <br />
            这一次，没人出来接你。
          </p>
          <div className="cover-intro">
            <p>
              你叫陆禾，今年二十二岁。爷爷陆守义走了一周，你回到柳河屯，替家里整理他留下的旧电脑。
            </p>
            <p>
              爸爸陆建军和妈妈陈淑琴还在回村的路上。你登录自己的微信，家庭群里的最后几条消息，停在爷爷说“回来就行”的那天。
            </p>
            <p>
              电脑里有旧照片、扫描的信，还有一些舍不得删的东西。你以为自己只是回来收拾一间屋子。
            </p>
          </div>
          <button
            id="enter-desktop"
            className="cover-enter"
            disabled={!ready}
            onClick={enterDesktop}
          >
            {ready
              ? save.started
                ? '继续整理旧电脑'
                : '打开旧电脑'
              : '正在读取存档'}
            <ArrowRight size={20} />
          </button>
          <p className="cover-guide">自由翻看 · 自动保存 · 建议戴上耳机</p>
        </section>
        <footer className="cover-footer">
          <span>一段藏在日常里的往事</span>
          <span>原创虚构 · 网页叙事解谜</span>
        </footer>
      </main>
    );
  return (
    <main className="computer-desktop">
      <Image
        className="desktop-wallpaper"
        src="/rural-home.png"
        width={1672}
        height={941}
        unoptimized
        alt="冬日的东北村屯，老屋的窗子亮着暖灯"
      />
      <div className="wallpaper-vignette" />
      <div className="desktop-name">
        <h1>呼兰爱情故事</h1>
        <span>A LOVE STORY IN HULAN</span>
      </div>
      <div className="desktop-shortcuts" aria-label="桌面应用">
        {APPS.map((a) => (
          <button
            key={a.id}
            className={
              'desktop-shortcut ' +
              (selectedShortcut === a.id ? 'selected' : '')
            }
            onClick={() => shortcut(a.id)}
            onDoubleClick={() => openApp(a.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') openApp(a.id);
            }}
            aria-label={'打开' + a.label}
            title={'双击打开' + a.label}
          >
            <AppGlyph id={a.id} />
            <span>{a.label}</span>
            {a.id === 'chat' && save.intro === 0 && (
              <i className="shortcut-dot" />
            )}
          </button>
        ))}
        {supperFinished && (
          <button
            className="desktop-shortcut"
            onClick={() => selectFile(replyFile)}
          >
            <span className="app-glyph cream">
              <FileText size={29} />
            </span>
            <span>回家吃饭</span>
          </button>
        )}
      </div>
      <aside className="desktop-note">
        <span>阿禾：</span>
        <p>
          旧东西先别急着扔。
          <br />
          爸晚点到，先别急着收拾。
        </p>
        <div>爸　11.24</div>
      </aside>
      {(storageError || extrasError) && (
        <div className="desktop-session" role="alert">
          无法保存更改，请勿关闭窗口。
        </div>
      )}
      <div className="window-workspace">
        {wins.map(
          (win, index) =>
            !win.min && (
              <section
                key={win.id}
                className={
                  'os-window ' +
                  (win.max ? 'maximized ' : '') +
                  (active === win.id ? 'focused ' : '') +
                  'window-' +
                  win.id
                }
                style={{
                  zIndex: 10 + index,
                  transform: win.max
                    ? undefined
                    : 'translate(calc(-50% + ' +
                      win.x +
                      'px), calc(-50% + ' +
                      win.y +
                      'px))',
                }}
                onPointerDown={() => focus(win.id)}
                aria-label={APP_NAMES[win.id]}
              >
                <header
                  className="window-titlebar"
                  onPointerDown={(e) => pointerDown(e, win)}
                  onPointerMove={pointerMove}
                  onPointerUp={stopDrag}
                  onPointerCancel={stopDrag}
                  onDoubleClick={(e) => {
                    if (!(e.target as HTMLElement).closest('button'))
                      maximize(win.id);
                  }}
                >
                  <div>
                    <AppGlyph id={win.id} small />
                    <span>
                      {win.id === 'reader'
                        ? selectedFile?.name || '文件预览'
                        : APP_NAMES[win.id]}
                    </span>
                  </div>
                  <div className="window-controls">
                    <button
                      aria-label={'最小化' + APP_NAMES[win.id]}
                      onClick={(e) => {
                        e.stopPropagation();
                        setWins((ws) =>
                          ws.map((w) =>
                            w.id === win.id ? { ...w, min: true } : w,
                          ),
                        );
                      }}
                    >
                      <Minus size={15} />
                    </button>
                    <button
                      aria-label={
                        (win.max ? '还原' : '最大化') + APP_NAMES[win.id]
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        maximize(win.id);
                      }}
                    >
                      <Square size={12} />
                    </button>
                    <button
                      className="close-window"
                      aria-label={'关闭' + APP_NAMES[win.id]}
                      onClick={(e) => {
                        e.stopPropagation();
                        closeApp(win.id);
                      }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                </header>
                <div className="window-content">{renderContent(win.id)}</div>
              </section>
            ),
        )}
      </div>
      <footer className="taskbar">
        <div className="taskbar-start">
          <Popover open={startMenu} onOpenChange={setStartMenu}>
            <PopoverTrigger
              className={'start-menu-button ' + (startMenu ? 'active' : '')}
              aria-label="开始菜单"
            >
              <Grid2X2 size={23} />
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="start-menu">
              <div>
                <Avatar id="me" className="player-avatar" />
                <span>陆禾</span>
              </div>
              <h2>应用</h2>
              <div className="start-apps">
                {APPS.map((a) => (
                  <button key={a.id} onClick={() => openApp(a.id)}>
                    <AppGlyph id={a.id} small />
                    {a.label}
                  </button>
                ))}
              </div>
              <hr />
              {supperFinished && (
                <button
                  onClick={() => {
                    setFilmOpen(true);
                    setStartMenu(false);
                  }}
                >
                  片尾 · 他们的一生
                </button>
              )}
              <button
                onClick={() => {
                  setHelp(true);
                  setStartMenu(false);
                }}
              >
                <Settings size={17} /> 游玩与显示设置
              </button>
              <button
                onClick={() => {
                  setResetOpen(true);
                  setStartMenu(false);
                }}
              >
                <RefreshCw size={17} /> 从头重读这个故事
              </button>
            </PopoverContent>
          </Popover>
          <button
            className="task-search"
            onClick={() => {
              navigate('start');
              openApp('browser');
            }}
            aria-label="打开搜索"
          >
            <Search size={16} />
            <span>搜索</span>
          </button>
        </div>
        <div className="task-apps">
          {APPS.filter((a) =>
            ['chat', 'mail', 'browser', 'files', 'notes'].includes(a.id),
          ).map((a) => (
            <button
              key={a.id}
              className={
                (active === a.id ? 'active ' : '') +
                (wins.some((w) => w.id === a.id) ? 'running' : '')
              }
              onClick={() => taskClick(a.id)}
              aria-label={'任务栏' + a.label}
              title={a.label}
            >
              <AppGlyph id={a.id} small />
            </button>
          ))}
          {wins.some((w) => w.id === 'reader') && (
            <button
              className={'running ' + (active === 'reader' ? 'active' : '')}
              onClick={() => taskClick('reader')}
              aria-label="任务栏文件预览"
            >
              <FileText size={22} />
            </button>
          )}
          {wins.some((w) => w.id === 'trash') && (
            <button
              className={'running ' + (active === 'trash' ? 'active' : '')}
              onClick={() => taskClick('trash')}
              aria-label="任务栏回收站"
            >
              <Trash2 size={22} />
            </button>
          )}
        </div>
        <div className="system-tray">
          <button
            onClick={() => void toggleFullscreen()}
            aria-label={full ? '退出全屏' : '全屏'}
            title="F 全屏"
          >
            <Maximize2 size={15} />
          </button>
          <Wifi size={16} />
          <button
            onClick={toggleMusic}
            aria-label={muted ? '开启氛围音乐' : '关闭氛围音乐'}
            title={muted ? '开启氛围音乐' : '关闭氛围音乐'}
          >
            {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>
          <BatteryFull size={19} />
          <time>
            <span>{storyTime}</span>
            <span>2025/11/24</span>
          </time>
          <button
            className="show-desktop"
            aria-label="显示桌面"
            onClick={() =>
              setWins((ws) => ws.map((w) => ({ ...w, min: true })))
            }
          />
        </div>
      </footer>
      <Dialog
        open={!!fileInfo}
        onOpenChange={(v) => {
          if (!v) setFileInfo(null);
        }}
      >
        <DialogContent className="file-properties">
          <DialogTitle>文件属性</DialogTitle>
          <DialogDescription>{fileInfo?.name}</DialogDescription>
          {fileInfo &&
            [
              ['名称', fileInfo.name],
              [
                '类型',
                fileInfo.kind === 'folder'
                  ? '文件夹'
                  : fileInfo.kind === 'scan'
                    ? 'PNG 图片'
                    : fileInfo.kind === 'photo'
                      ? '照片'
                      : fileInfo.kind === 'audio'
                        ? '录音转写'
                        : fileInfo.kind === 'link'
                          ? '互联网快捷方式'
                          : '文本文件',
              ],
              [
                '位置',
                isGrandfatherFavorite(fileInfo)
                  ? '微信 / 老陆的收藏'
                  : fileInfo.id === 'river'
                    ? '微信 / 桂兰奶奶'
                    : '此电脑 / ' +
                      (files.find((f) => f.id === fileInfo.folder)?.name ||
                        '桌面'),
              ],
              ['修改日期', fileInfo.date],
              ['大小', fileInfo.size || '—'],
            ].map(([k, v]) => (
              <div className="file-property-row" key={k}>
                <span>{k}</span>
                <span>{v}</span>
              </div>
            ))}
          <DialogClose className="system-button primary">确定</DialogClose>
        </DialogContent>
      </Dialog>
      <Dialog open={accountDialog} onOpenChange={setAccountDialog}>
        <DialogContent className="wechat-account-dialog">
          <DialogTitle>{accountLogin ? '登录微信' : '设置'}</DialogTitle>
          <DialogDescription>
            {accountLogin ? '微信号登录' : '账号与安全'}
          </DialogDescription>
          {accountLogin ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (
                  loginId.normalize('NFKC').trim().toLowerCase() !==
                    people.lu.wechat ||
                  loginPassword.normalize('NFKC').trim() !== 'jj19850406'
                ) {
                  setLoginError('账号或密码错误，请重新输入');
                  return;
                }
                switchAccount('lu');
              }}
            >
              <Avatar id="lu" />
              <label>
                微信号
                <input
                  aria-label="微信号"
                  autoComplete="off"
                  value={loginId}
                  onChange={(e) => {
                    setLoginId(e.target.value);
                    setLoginError('');
                  }}
                />
              </label>
              <label>
                密码
                <input
                  aria-label="微信密码"
                  type="password"
                  autoComplete="off"
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    setLoginError('');
                  }}
                />
              </label>
              {loginError && (
                <p role="alert" className="login-error">
                  {loginError}
                </p>
              )}
              <button className="account-login-button" type="submit">
                登录
              </button>
              <button
                type="button"
                onClick={() => {
                  setAccountLogin(false);
                  setLoginError('');
                  setLoginPassword('');
                }}
              >
                返回
              </button>
            </form>
          ) : (
            <>
              <div className="account-current">
                <Avatar id={viewer} />
                <strong>{people[viewer].name}</strong>
                <span>微信号：{people[viewer].wechat}</span>
              </div>
              <button
                className="account-switch-button"
                onClick={() => {
                  if (viewer === 'lu') switchAccount('me');
                  else {
                    setAccountLogin(true);
                    setLoginId('');
                    setLoginPassword('');
                    setLoginError('');
                  }
                }}
              >
                切换账号
              </button>
              {viewer === 'me' && save.wechatUnlocked && (
                <button
                  className="remembered-account"
                  onClick={() => switchAccount('lu')}
                >
                  <Avatar id="lu" />
                  <span>老陆</span>
                  <ChevronRight size={18} />
                </button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
      <ProfileDialog
        person={profile}
        photos={Array.from(
          new Set(
            [...extras.posts, ...moments]
              .filter((p) => p.person === profile && canViewMoment(p, viewer))
              .flatMap((p) => p.photos),
          ),
        )}
        onClose={() => setProfile(null)}
        onMoments={(id) => {
          setChatView('moments');
          setMomentFilter(id);
          openApp('chat');
        }}
        onChat={openPersonChat}
      />
      <LifeGallery
        key={gallery || 'none'}
        photo={gallery}
        onClose={() => setGallery(null)}
      />
      <Dialog open={chatDetails} onOpenChange={setChatDetails}>
        <DialogContent className="chat-details-dialog">
          <DialogTitle>聊天详情</DialogTitle>
          <DialogDescription>
            {contacts.find((c) => c.id === contact)?.name}
          </DialogDescription>
          {contact === 'history' ? (
            <div className="group-members">
              {familyMembers.map((id) => (
                <button
                  key={id}
                  onClick={() => {
                    setChatDetails(false);
                    setProfile(id);
                  }}
                >
                  <Avatar id={id} />
                  <span>{people[id].name}</span>
                </button>
              ))}
              <p>
                群主：陈淑琴 · 2015 年除夕建群
                <br />
                你在入群后收到的消息一直保留在自己的微信中。
              </p>
            </div>
          ) : (
            contact !== 'transfer' && (
              <button
                className="chat-detail-person"
                onClick={() => {
                  setChatDetails(false);
                  setProfile(contact);
                }}
              >
                <Avatar id={contact} />
                <span>查看联系人资料</span>
                <ChevronRight size={16} />
              </button>
            )
          )}
          <label>
            <span>
              <Pin size={16} />
              置顶聊天
            </span>
            <input
              type="checkbox"
              checked={extras.pinned.includes(draftKey)}
              onChange={(e) =>
                setExtras((s) => ({
                  ...s,
                  pinned: e.target.checked
                    ? [...new Set([...s.pinned, draftKey])]
                    : s.pinned.filter((x) => x !== draftKey),
                }))
              }
            />
          </label>
          <label>
            <span>
              <BellOff size={16} />
              消息免打扰
            </span>
            <input
              type="checkbox"
              checked={extras.muted.includes(draftKey)}
              onChange={(e) =>
                setExtras((s) => ({
                  ...s,
                  muted: e.target.checked
                    ? [...new Set([...s.muted, draftKey])]
                    : s.muted.filter((x) => x !== draftKey),
                }))
              }
            />
          </label>
          <button
            className="detail-action"
            onClick={() => {
              setChatDetails(false);
              setContact('history');
            }}
          >
            <Search size={17} />
            查找聊天记录
            <ChevronRight size={15} />
          </button>
        </DialogContent>
      </Dialog>
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="system-dialog" showCloseButton={false}>
          <div className="folder-lock-icon">
            <Folder size={43} />
            <LockKeyhole size={20} />
          </div>
          <DialogTitle>
            “
            {lockedFolder === 'future'
              ? '留着'
              : lockedFolder === 'winter-archive'
                ? '那年冬天'
                : memoryLocks[lockedFolder].name}
            ”是一个加密文件夹
          </DialogTitle>
          <DialogDescription>
            {lockedFolder === 'future'
              ? '密码提示：我们的第一场雪（月日，四位数字）'
              : lockedFolder === 'winter-archive'
                ? '密码提示：那张旧单子'
                : '密码提示：' + memoryLocks[lockedFolder].hint}
          </DialogDescription>
          <form onSubmit={unlockFolder}>
            <label>
              输入密码
              <input
                id="archive-password"
                aria-label="文件夹密码"
                value={folderPassword}
                onChange={(e) => {
                  setFolderPassword(e.target.value);
                  setPasswordError('');
                }}
                placeholder="四位数字"
                autoComplete="off"
                inputMode="numeric"
                maxLength={12}
              />
            </label>
            <output className="form-error">{passwordError}</output>
            <div className="dialog-actions">
              <DialogClose className="system-button" type="button">
                取消
              </DialogClose>
              <button className="system-button primary" type="submit">
                解锁文件夹
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {filmOpen && supperFinished && (
        <MemoryFilm onClose={() => setFilmOpen(false)} />
      )}
      <Dialog open={help} onOpenChange={setHelp}>
        <DialogContent
          className="system-dialog settings-dialog"
          showCloseButton={false}
        >
          <DialogTitle>这台电脑，留着他们的后来。</DialogTitle>
          <DialogDescription>
            你是陆禾，回到呼兰乡下，整理爷爷陆守义留下的旧电脑。爸爸陆建军和妈妈陈淑琴正在回屯子的路上。微信是你登录的账号，“陆家小院”是你也在的家庭群。
          </DialogDescription>
          <p>
            双击桌面图标打开应用，或使用底部任务栏。窗口可以拖动、最小化、放大，也可以同时打开，来回对照。
          </p>
          <p>
            旧聊天、邮件、文件与网页可以自由翻看。笔记本只记录你自己写下的内容。没有时间限制。
          </p>
          <p>
            进度自动保存在当前浏览器。F
            键切换全屏。录音提供文字转写，音乐可随时开关。
          </p>
          <p className="settings-small">
            故事与人物均为虚构。游戏中的消息、邮箱和网页只在本机模拟，不会发送给真实联系人。
          </p>
          <button className="system-button" onClick={toggleMusic}>
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}{' '}
            {muted ? '开启氛围音乐' : '关闭氛围音乐'}
          </button>
          <DialogClose className="system-button primary">回到电脑</DialogClose>
        </DialogContent>
      </Dialog>
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent className="system-dialog">
          <AlertDialogTitle>从头重读这个故事？</AlertDialogTitle>
          <AlertDialogDescription>
            当前故事的聊天、笔记、朋友圈和邮件操作会重置。其他版本存档仍保留。
          </AlertDialogDescription>
          <div className="dialog-actions">
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={resetGame}>重新开始</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      {toast && (
        <div className="system-toast" aria-live="polite">
          <div>
            <MessageCircle size={19} />
            <strong>{toast.title}</strong>
            <button aria-label="关闭通知" onClick={() => setToast(null)}>
              <X size={16} />
            </button>
          </div>
          <button
            className="notification-body"
            onClick={() => {
              if (toast.app) {
                if (toast.app === 'chat') {
                  switchAccount('me');
                }
                openApp(toast.app);
              }
              setToast(null);
            }}
          >
            {toast.text}
          </button>
        </div>
      )}
    </main>
  );
}
