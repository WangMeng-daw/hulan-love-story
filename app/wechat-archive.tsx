'use client';
import { useState } from 'react';
import { Search, FileText, Music2, Star } from 'lucide-react';
import { Avatar, PhotoTile } from './desktop-social';
import { files, type FileItem } from './rural-story';
import type { PersonId } from './desktop-life';

export type ArchiveMessage = { who: PersonId; text: string; time: string };
// A conversation has one source of truth. The active account only changes its presentation.
export const grandfatherThreads: Record<string, ArchiveMessage[]> = {
  lu: [
    {
      who: 'lu',
      text: '阿禾，回来时帮爷爷看看电脑。',
      time: '2025 年 11 月 16 日 · 21:16',
    },
    {
      who: 'me',
      text: '行，爷爷。别删东西，等我回去。',
      time: '2025 年 11 月 16 日 · 21:16',
    },
    {
      who: 'lu',
      text: '知道。爷爷都留着。',
      time: '2025 年 11 月 16 日 · 21:17',
    },
  ],
  'lu:aunt': [
    {
      who: 'aunt',
      text: '爸，照片和那些纸都扫好了，放您微信收藏里了。电脑备忘里给您留了账号。',
      time: '2013 年 11 月 24 日 · 17:20',
    },
    {
      who: 'lu',
      text: '行。纸上的字浅了，别弄丢。',
      time: '2013 年 11 月 24 日 · 17:21',
    },
    {
      who: 'aunt',
      text: '今天新传的几张，您也看看。',
      time: '2025 年 11 月 16 日 · 19:32',
    },
    {
      who: 'lu',
      text: '看见了。你小时候那张，手攥得真紧。',
      time: '2025 年 11 月 16 日 · 19:33',
    },
    {
      who: 'aunt',
      text: '那会儿怕您走。',
      time: '2025 年 11 月 16 日 · 19:34',
    },
    {
      who: 'lu',
      text: '傻孩子。都进家了，爸还能上哪去。',
      time: '2025 年 11 月 16 日 · 19:35',
    },
  ],
  'lu:mom': [
    {
      who: 'mom',
      text: '爸，饺子到家了，阿禾吃了一大盘。碗下回给您带回去。',
      time: '2025 年 11 月 16 日 · 19:06',
    },
    {
      who: 'lu',
      text: '碗不着急。淑琴，你也吃，别光顾他们爷俩。',
      time: '2025 年 11 月 16 日 · 19:08',
    },
    {
      who: 'mom',
      text: '吃了。您早点歇着，锅留着下回我刷。',
      time: '2025 年 11 月 16 日 · 19:09',
    },
  ],
  'lu:zhou': [
    {
      who: 'lu',
      text: '桂兰，你还记得她说话啥声不。',
      time: '2025 年 10 月 8 日 · 20:41',
    },
    {
      who: 'zhou',
      text: '记得。说快了，有两个字爱连在一块。',
      time: '2025 年 10 月 8 日 · 20:43',
    },
    {
      who: 'lu',
      text: '她叫我名字，也是那样不。',
      time: '2025 年 10 月 8 日 · 20:44',
    },
    {
      who: 'zhou',
      text: '守义，我怕学不像。',
      time: '2025 年 10 月 8 日 · 20:46',
    },
    {
      who: 'lu',
      text: '没事。不学了。你早点睡。',
      time: '2025 年 10 月 8 日 · 20:48',
    },
    {
      who: 'zhou',
      text: '守义，建军把那张合影扫清楚了吧？',
      time: '2025 年 11 月 16 日 · 10:25',
    },
    {
      who: 'lu',
      text: '清楚。她那件衣裳的扣子都能看清。',
      time: '2025 年 11 月 16 日 · 10:27',
    },
    {
      who: 'zhou',
      text: '当年拍的时候，她还说没站好，让再拍一张。',
      time: '2025 年 11 月 16 日 · 10:28',
    },
    { who: 'lu', text: '这张就好。', time: '2025 年 11 月 16 日 · 10:30' },
  ],
};
export const isGrandfatherFavorite = (f: FileItem) =>
  ['photos', 'sounds', 'documents'].includes(f.folder) && f.id !== 'river';

export function WechatFavorites({
  owner,
  onOpen,
}: {
  owner: 'me' | 'lu';
  onOpen: (f: FileItem) => void;
}) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('全部收藏');
  const items =
    owner === 'lu'
      ? files
          .filter(isGrandfatherFavorite)
          .filter(
            (f) =>
              (!search ||
                [f.name, ...(f.body || [])].join(' ').includes(search)) &&
              (category === '全部收藏' ||
                (category === '图片'
                  ? f.kind === 'photo' || f.kind === 'scan'
                  : category === '语音'
                    ? f.kind === 'audio'
                    : f.kind === 'text')),
          )
      : [];
  return (
    <section className="wechat-favorites">
      <header>
        <h2>收藏</h2>
        <label>
          <Search size={17} />
          <input
            aria-label="搜索收藏"
            placeholder="搜索"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </header>
      <nav>
        {['全部收藏', '图片', '语音', '笔记'].map((c) => (
          <button
            key={c}
            className={category === c ? 'active' : ''}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </nav>
      <div className="favorite-scroll">
        {items.map((f) => (
          <button
            className="favorite-card"
            data-file-id={f.id}
            key={f.id}
            onClick={() => onOpen(f)}
          >
            {f.photo ? (
              <PhotoTile id={f.photo} />
            ) : (
              <span className="favorite-icon">
                {f.kind === 'audio' ? <Music2 /> : <FileText />}
              </span>
            )}
            <span className="favorite-copy">
              <strong>{f.name}</strong>
              <small>
                {f.kind === 'photo'
                  ? '老照片'
                  : f.kind === 'audio'
                    ? '录音与转写'
                    : '旧纸上的字'}
              </small>
              <span className="favorite-source">
                <Avatar id="lu" />
                老陆
                <time>
                  {f.date.includes('2013') ? '2013/11/24' : '2025/11/16'}
                </time>
              </span>
            </span>
          </button>
        ))}
        {!items.length && (
          <div className="favorites-empty">
            <Star size={36} />
            <p>{search ? '无搜索结果' : '暂无收藏'}</p>
          </div>
        )}
      </div>
    </section>
  );
}
