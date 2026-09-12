'use client';
import { useEffect, useState } from 'react';
import { reviseNpcDialogue } from './dialogue-revisions';

export type PersonId = 'aunt' | 'lu' | 'zhou' | 'mom' | 'me';
export const people: Record<
  PersonId,
  {
    name: string;
    wechat: string;
    region: string;
    signature: string;
    position: string;
    image: string;
  }
> = {
  aunt: {
    name: '陆建军',
    wechat: 'lujianjun_0406',
    region: '黑龙江 哈尔滨',
    signature: '一家人，平平安安。',
    position: '0% 100%',
    image: '/everyday-avatars.png',
  },
  lu: {
    name: '老陆',
    wechat: 'lushouyi_1958',
    region: '黑龙江 呼兰',
    signature: '孩子们回来，提前说一声。',
    position: '100% 0%',
    image: '/life-atlas.png',
  },
  zhou: {
    name: '桂兰奶奶',
    wechat: 'guilan_li',
    region: '黑龙江 呼兰',
    signature: '院里的酸菜腌好了。',
    position: '100% 100%',
    image: '/everyday-avatars.png',
  },
  mom: {
    name: '陈淑琴',
    wechat: 'shuqin_1979',
    region: '黑龙江 哈尔滨',
    signature: '家里那盆花又开了。',
    position: '0% 0%',
    image: '/everyday-avatars.png',
  },
  me: {
    name: '陆禾',
    wechat: 'luhe_2003',
    region: '黑龙江 哈尔滨',
    signature: '回屯子几天。',
    position: '100% 0%',
    image: '/everyday-avatars.png',
  },
};
export const lifePhotos = [
  {
    id: 'noodles',
    title: '爷爷包的饺子',
    position: '0% 0%',
    date: '2024 年 2 月 9 日',
    caption: '两个红花碗用了很多年。豁口的那个，他总留给自己。',
  },
  {
    id: 'coast',
    title: '校门口的两个人',
    position: '100% 0%',
    date: '1984 年 10 月 1 日',
    caption: '陆守义与许知遥。合影背面写着：等开春。',
  },
  {
    id: 'flowers',
    title: '留在窗台的红围巾',
    position: '0% 100%',
    date: '2013 年 11 月 24 日',
    caption:
      '2013 年拍下的围巾，是知遥在 1983 年织给他的。那一针错了，他一直没拆。',
  },
  {
    id: 'piano',
    title: '建军进家的第一天',
    position: '100% 100%',
    date: '1985 年 4 月 6 日',
    caption: '那孩子一直攥着他的手。他说，不松也行，咱就这么回家。',
  },
];
export type Moment = {
  id: string;
  person: PersonId;
  date: string;
  text: string;
  photos: string[];
  location?: string;
  likes: PersonId[];
  comments: { person: PersonId; text: string }[];
  own?: boolean;
  visibility?: 'friends' | 'private';
};
export const canViewMoment = (p: Moment, viewer: PersonId) =>
  p.visibility !== 'private' || p.person === viewer;
export const moments: Moment[] = [
  {
    id: 'private-needle',
    person: 'lu',
    date: '2016/12/09 20:17',
    visibility: 'private',
    photos: ['flowers'],
    likes: [],
    comments: [],
    text: '围巾又拿出来了，摸了摸针脚。第三行，第十七针，还是歪的。\n你当时说，等回来再给我拆。我说不着急。\n这一句不着急，竟然说到了今天。',
  },
  {
    id: 'private-bus',
    person: 'lu',
    date: '2021/11/24 16:20',
    visibility: 'private',
    photos: [],
    likes: [],
    comments: [],
    text: '今天满四十年了。\n那天三点四十的班车刚过去。下一班还得等四十分钟，你说，那就再走一会儿。\n我没敢说，车慢点来才好。\n后来每次过那个站牌，我都会往路那头看看。',
  },
  {
    id: 'private-table-width',
    person: 'lu',
    date: '2015/04/05 15:06',
    visibility: 'private',
    photos: [],
    likes: [],
    comments: [],
    text: '把南窗的小桌擦了。桌面宽五十二厘米，当年你拿尺量的，说再宽就挡着柜门。\n建军小时候在上头刻了个军字。今天擦到那儿，指头还是能摸出来。',
  },
  {
    id: 'private-table-height',
    person: 'lu',
    date: '2015/04/06 18:42',
    visibility: 'private',
    photos: [],
    likes: [],
    comments: [],
    text: '昨天只顾着擦桌面，今天才把桌腿紧好。量了量，桌子高七十四厘米。\n你说这个高度缝衣裳不累。我怕记错，做的时候量了好几遍。\n桌子做好了，你却一次也没试过。\n南窗底下那册，密码就照宽、高这么记。',
  },
  {
    id: 'private-voice',
    person: 'lu',
    date: '2025/10/08 21:43',
    visibility: 'private',
    photos: ['coast'],
    likes: [],
    comments: [],
    text: '知遥，今天有个老学生来看我，说还记得你上课的声音。\n我想让他学一句，又没好意思。\n你的信我能背下来。可你叫我名字，末尾那个字是轻一点，还是重一点，我想了半宿。\n我不是不想你。我天天都想。怎么还是记不清了。',
  },
  {
    id: 'private-dream',
    person: 'lu',
    date: '2022/03/19 05:36',
    visibility: 'private',
    photos: [],
    likes: [],
    comments: [],
    text: '梦见你坐在南窗底下，说桌角磨得挺好。\n我忙着生炉子，怕你冷。忙醒了。\n醒了才想起，还没跟你说一句话。\n炉子添好了。天还没亮，我再躺一会儿。',
  },
  {
    id: 'private-birthday',
    person: 'lu',
    date: '2018/12/09 20:12',
    visibility: 'private',
    photos: [],
    likes: [],
    comments: [],
    text: '今年六十了。头发白了，照相时建军让我笑一笑。\n回来把照片摆在你的旁边，才发现我都这么老了。\n你那张还是二十三。\n知遥，要是能再照一回，你别嫌我站你旁边不好看。',
  },
  {
    id: 'private-window',
    person: 'lu',
    date: '2015/04/06 18:25',
    visibility: 'private',
    photos: [],
    likes: [],
    comments: [],
    text: '南窗底下那张小桌松了，今天紧了紧。\n你说坐这里补衣裳，太阳能照着手。后来建军趴在上头写作业，现在轮到阿禾了。\n桌面上全是他们划的道子。我没刨掉。\n你要见了，得一边嫌他们淘，一边摸那些铅笔印。',
  },
  {
    id: 'private-last',
    person: 'lu',
    date: '2025/11/16 22:10',
    visibility: 'private',
    photos: [],
    likes: [],
    comments: [],
    text: '知遥，给建军的信写完了，扫了两页，放回“那年冬天”。\n有一行写湿了，晾干才扫的。他四十五了，我还没正经跟他说过，他就是我的儿子。\n这些话，我见了他又怕说不出来。',
  },
  {
    id: 'private-bowl',
    person: 'lu',
    date: '2024/02/09 23:18',
    visibility: 'private',
    photos: ['noodles'],
    likes: [],
    comments: [],
    text: '淑琴把你那只碗摆好了。没有人问为什么。\n阿禾说饺子肚最好吃，跟建军小时候一样。\n知遥，今天家里吵得很。你要在，准舍不得睡。',
  },
  {
    id: 'private-snow',
    person: 'lu',
    date: '2020/11/24 16:32',
    visibility: 'private',
    photos: ['flowers'],
    likes: [],
    comments: [],
    text: '又到这一天了。\n围巾洗得薄了，织错的那一针还在。\n你在信里说，下回让我先走。那会儿我不肯，非等车看不见了才回。\n现在我早就肯了。\n今天去道口，回来晚了，炉子灭了。自己重新生上了。',
  },
  {
    id: 'private-home',
    person: 'lu',
    date: '2019/04/06 22:06',
    visibility: 'private',
    photos: ['piano'],
    likes: [],
    comments: [],
    text: '建军打电话，说今天又吃了面。\n那年你说炕上多铺一床褥子就够了。我铺了。孩子现在都快四十了。\n你说的那个家，我没弄丢。',
  },
  {
    id: 'private-seasons',
    person: 'lu',
    date: '2013/11/25 21:08',
    visibility: 'private',
    photos: [],
    likes: [],
    comments: [],
    text: '四封信，春、夏、秋、冬。每封开头的第一个字。\n知遥，我一直是这么念的。\n你写这句话的时候，是在算还剩几个月。我那时候也算。\n后来河开了，又冻上。建军长高，成家，阿禾也上学了。\n我还是舍不得把“来年”念成“那年”。',
  },
  {
    id: 'private-receipt',
    person: 'lu',
    date: '2013/11/24 23:16',
    visibility: 'private',
    photos: [],
    likes: [],
    comments: [],
    text: '建军教我把话设成“仅自己可见”。他说，这样别人就看不见了。\n那我往后就在这里跟你说。\n“那年冬天”也锁好了。用的供销社赊购单右上角那四位单号，头一个零也算。纸就在“留着”里。\n单子背面是你的字。那天你算来算去，没给自己添一样东西。',
  },
  {
    id: 'mom-scanning',
    person: 'mom',
    date: '2025/11/15 19:40',
    photos: [],
    likes: ['aunt'],
    comments: [
      { person: 'aunt', text: '我爸写啥了？' },
      { person: 'mom', text: '没看。爸说还没写完。让他慢慢写。' },
    ],
    text: '教爸用手机扫纸。他说拍的时候手抖，我把台灯挪近了一点。\n问要不要帮他打字，他说，自己的字，建军认得。',
  },
  {
    id: 'mom-home',
    person: 'mom',
    date: '2025/11/15 17:20',
    text: '爸又给我们装了一袋饺子。\n嘴上说冰柜放不下，袋子上写着：建军这袋没葱，阿禾那袋多放肉。',
    photos: ['noodles'],
    location: '柳河屯',
    likes: ['aunt', 'me', 'lu'],
    comments: [
      { person: 'lu', text: '淑琴那袋少放了酸菜，搁最底下了。' },
      { person: 'mom', text: '找着了，爸。您也好好吃饭。' },
    ],
  },
  {
    id: 'waiting',
    person: 'lu',
    date: '2025/11/16 15:42',
    text: '建军说，下周末带阿禾回来。\n白菜剁好了。再多包一点。',
    photos: ['noodles'],
    location: '柳河屯 · 家',
    likes: ['aunt', 'mom', 'zhou'],
    comments: [
      { person: 'aunt', text: '爸，别太累。等我回去一起包。' },
      { person: 'mom', text: '我和建军一块回去。您别老往外头站，风硬。' },
      { person: 'lu', text: '不累。你们回来就行。' },
    ],
  },
  {
    id: 'new-year',
    person: 'aunt',
    date: '2024/02/09 18:36',
    text: '回家了。\n这个门，从我进家那天起，就没用过钥匙。',
    photos: ['noodles'],
    location: '呼兰 · 柳河屯',
    likes: ['lu', 'zhou', 'me'],
    comments: [
      { person: 'lu', text: '我在家，用啥钥匙。' },
      { person: 'zhou', text: '你爸下午就站村口了。' },
    ],
  },
  {
    id: 'zhou-photo',
    person: 'zhou',
    date: '2023/02/04 13:10',
    text: '村里整理旧照片，翻到我给陆守义和知遥拍的这一张。\n那年她说开春穿红棉袄，袖口还是我改的。',
    photos: ['coast'],
    location: '柳河屯小学旧址',
    likes: ['lu'],
    comments: [
      { person: 'lu', text: '这张我有。一直在柜上。' },
      { person: 'aunt', text: '原件我爸连边都不让裁。' },
    ],
  },
  {
    id: 'april',
    person: 'lu',
    date: '2019/04/06 11:24',
    text: '今天河开了。\n给建军包顿饺子。',
    photos: ['piano'],
    location: '柳河屯',
    likes: ['aunt', 'zhou'],
    comments: [
      { person: 'aunt', text: '爸，你比记我生日还记得牢。' },
      { person: 'lu', text: '哪能忘。那天我当爸爸了。' },
    ],
  },
  {
    id: 'scarf',
    person: 'lu',
    date: '2014/11/24 16:08',
    text: '下雪了。\n这条围巾有一针织错了。她说拆了两回，最后还是错着。\n挺好。手一摸就知道是哪儿。',
    photos: ['flowers'],
    location: '呼兰 · 老屋',
    likes: ['zhou'],
    comments: [
      { person: 'zhou', text: '她那时候织这个，晚上在煤油灯底下熬。' },
    ],
  },
  {
    id: 'computer',
    person: 'aunt',
    date: '2013/11/24 19:22',
    text: '给爸买的电脑装好了。\n他第一件事，是让我把炕柜上的旧照片放大。',
    photos: ['coast'],
    location: '柳河屯',
    likes: ['zhou', 'lu'],
    comments: [
      { person: 'lu', text: '能看清了。谢谢儿子。' },
      { person: 'aunt', text: '跟自己儿子谢啥。' },
    ],
  },
];
export type ExtraMessage = {
  who: 'me' | 'other';
  sender?: PersonId;
  text: string;
  time: string;
};
export type LocalMail = {
  id: string;
  from: string;
  email: string;
  to: string;
  subject: string;
  date: string;
  folder: 'sent' | 'drafts';
  body: string[];
};
export type Visit = { page: string; query: string; title: string };
export type ExtraState = {
  likes: string[];
  unlikes: string[];
  comments: {
    id: string;
    post: string;
    text: string;
    reply?: string;
    person?: PersonId;
  }[];
  posts: Moment[];
  pinned: string[];
  muted: string[];
  drafts: Record<string, string>;
  threads: Record<string, ExtraMessage[]>;
  stars: string[];
  deletedMails: string[];
  localMails: LocalMail[];
  bookmarks: Visit[];
  visits: Visit[];
};
export const emptyExtras = (): ExtraState => ({
  likes: [],
  unlikes: [],
  comments: [],
  posts: [],
  pinned: [],
  muted: [],
  drafts: {},
  threads: {},
  stars: [],
  deletedMails: [],
  localMails: [],
  bookmarks: [],
  visits: [],
});
const stringList = (v: unknown): string[] =>
  Array.isArray(v)
    ? v.filter((s): s is string => typeof s === 'string').slice(0, 200)
    : [];
function loadExtras(raw: unknown): ExtraState {
  const s = raw as Partial<ExtraState>;
  if (!s || typeof s !== 'object') return emptyExtras();
  const visits = (v: unknown): Visit[] =>
    Array.isArray(v)
      ? v
          .filter(
            (x): x is Visit =>
              x &&
              typeof x.page === 'string' &&
              typeof x.query === 'string' &&
              typeof x.title === 'string',
          )
          .slice(0, 80)
      : [];
  return {
    ...emptyExtras(),
    likes: stringList(s.likes),
    unlikes: stringList(s.unlikes),
    pinned: stringList(s.pinned),
    muted: stringList(s.muted),
    stars: stringList(s.stars),
    deletedMails: stringList(s.deletedMails),
    bookmarks: visits(s.bookmarks),
    visits: visits(s.visits),
    comments: Array.isArray(s.comments)
      ? s.comments
          .filter(
            (c) =>
              c &&
              typeof c.id === 'string' &&
              typeof c.post === 'string' &&
              typeof c.text === 'string',
          )
          .slice(-200)
      : [],
    posts: Array.isArray(s.posts)
      ? s.posts
          .filter(
            (p) =>
              p &&
              p.own &&
              ['me', 'lu'].includes(p.person) &&
              typeof p.id === 'string' &&
              typeof p.text === 'string' &&
              Array.isArray(p.photos) &&
              Array.isArray(p.likes) &&
              Array.isArray(p.comments),
          )
          .slice(0, 50)
      : [],
    localMails: Array.isArray(s.localMails)
      ? s.localMails
          .filter(
            (m) =>
              m &&
              typeof m.id === 'string' &&
              typeof m.subject === 'string' &&
              typeof m.to === 'string' &&
              typeof m.date === 'string' &&
              Array.isArray(m.body) &&
              ['drafts', 'sent'].includes(m.folder),
          )
          .slice(-100)
      : [],
    drafts:
      s.drafts && typeof s.drafts === 'object'
        ? Object.fromEntries(
            Object.entries(s.drafts)
              .filter(([, v]) => typeof v === 'string')
              .map(([k, v]) => [k, v.slice(0, 2000)]),
          )
        : {},
    threads:
      s.threads && typeof s.threads === 'object'
        ? Object.fromEntries(
            Object.entries(s.threads)
              .filter(([, v]) => Array.isArray(v))
              .map(([k, v]) => [
                k,
                v
                  .filter(
                    (m) =>
                      m &&
                      ['me', 'other'].includes(m.who) &&
                      typeof m.text === 'string',
                  )
                  .slice(-100)
                  .map((m) => ({
                    ...m,
                    text:
                      m.who === 'me' || m.sender === 'lu'
                        ? m.text
                        : reviseNpcDialogue(m.text),
                  })),
              ]),
          )
        : {},
  };
}
export function useDesktopExtras() {
  const [extras, setExtras] = useState<ExtraState>(emptyExtras);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    try {
      // Browser-local personalization is restored after hydration to preserve the server markup.
      // eslint-disable-next-line react/react-compiler
      setExtras(
        loadExtras(
          JSON.parse(
            localStorage.getItem('hulan-family-life-v5') ||
              localStorage.getItem('hulan-rural-life-v4') ||
              'null',
          ),
        ),
      );
    } catch {
      setError(true);
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem('hulan-family-life-v5', JSON.stringify(extras));
    } catch {
      // Surface a failed browser write while leaving the in-memory state intact.
      // eslint-disable-next-line react/react-compiler
      setError(true);
    }
  }, [extras, ready]);
  return { extras, setExtras, error };
}
