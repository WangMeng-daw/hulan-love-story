'use client';
import { useState, type Dispatch, type SetStateAction } from 'react';
import Image from 'next/image';
import {
  Camera,
  Heart,
  MessageCircle,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Trash2,
  Users,
  X,
  Monitor,
  Send,
  LockKeyhole,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import {
  people,
  lifePhotos,
  moments,
  canViewMoment,
  type PersonId,
  type ExtraState,
  type Moment,
} from './desktop-life';

function AtlasImage({ src, position }: { src: string; position: string }) {
  const [x, y] = position.split(' ');
  return (
    <Image
      src={src}
      width={1254}
      height={1254}
      alt=""
      unoptimized
      draggable={false}
      className="atlas-bitmap"
      style={{
        left: x === '100%' ? '-100%' : '0',
        top: y === '100%' ? '-100%' : '0',
      }}
    />
  );
}
/* eslint-disable jsx-a11y/prefer-tag-over-role -- Each cropped atlas region has one accessible label; its full image is decorative. */
export function Avatar({
  id,
  onClick,
  className = '',
}: {
  id: PersonId | 'transfer';
  onClick?: () => void;
  className?: string;
}) {
  const label = id === 'transfer' ? '文件传输助手' : people[id].name;
  const content =
    id === 'transfer' ? (
      <Monitor size={24} />
    ) : (
      <AtlasImage src={people[id].image} position={people[id].position} />
    );
  return onClick ? (
    <button
      type="button"
      className={
        'avatar portrait ' +
        className +
        (id === 'transfer' ? ' transfer-avatar' : '')
      }
      onClick={onClick}
      aria-label={label + '的头像'}
    >
      {content}
    </button>
  ) : (
    <span
      className={
        'avatar portrait ' +
        className +
        (id === 'transfer' ? ' transfer-avatar' : '')
      }
      role="img"
      aria-label={label + '的头像'}
    >
      {content}
    </span>
  );
}
export function GroupAvatar() {
  return (
    <span className="group-avatar" role="img" aria-label="陆家小院群头像">
      {(['lu', 'aunt', 'mom', 'me'] as PersonId[]).map((id) => (
        <Avatar key={id} id={id} />
      ))}
    </span>
  );
}
export function PhotoTile({
  id,
  className = '',
}: {
  id: string;
  className?: string;
}) {
  const p = lifePhotos.find((p) => p.id === id) || lifePhotos[0];
  return (
    <span role="img" aria-label={p.title} className={'life-photo ' + className}>
      <AtlasImage src={p.image || '/life-atlas.png'} position={p.position} />
    </span>
  );
}
/* eslint-enable jsx-a11y/prefer-tag-over-role */
export function LifeGallery({
  photo,
  onClose,
}: {
  photo: string | null;
  onClose: () => void;
}) {
  const [offset, setOffset] = useState(0);
  const index =
    (lifePhotos.findIndex((p) => p.id === photo) +
      offset +
      lifePhotos.length * 100) %
    lifePhotos.length;
  const p = lifePhotos[index];
  return (
    <Dialog
      open={!!photo}
      onOpenChange={(open) => {
        if (!open) {
          setOffset(0);
          onClose();
        }
      }}
    >
      <DialogContent className="life-gallery" showCloseButton={false}>
        <header>
          <DialogTitle>{p.title}</DialogTitle>
          <DialogClose aria-label="关闭照片">
            <X size={22} />
          </DialogClose>
        </header>
        <div className="gallery-stage">
          <button
            aria-label="上一张照片"
            onClick={() => setOffset((n) => n - 1)}
          >
            <ChevronLeft />
          </button>
          <PhotoTile id={p.id} />
          <button
            aria-label="下一张照片"
            onClick={() => setOffset((n) => n + 1)}
          >
            <ChevronRight />
          </button>
        </div>
        <DialogDescription>
          {p.date} · {p.caption}
        </DialogDescription>
        <footer>
          {index + 1} / {lifePhotos.length}　旧相册
        </footer>
      </DialogContent>
    </Dialog>
  );
}
export function ProfileDialog({
  person,
  onClose,
  onMoments,
  onChat,
  photos,
}: {
  person: PersonId | null;
  onClose: () => void;
  onMoments: (id: PersonId) => void;
  onChat: (id: PersonId) => void;
  photos: string[];
}) {
  const p = person ? people[person] : people.aunt;
  return (
    <Dialog
      open={!!person}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="profile-dialog">
        <div className="profile-top">
          <Avatar id={person || 'aunt'} />
          <div>
            <DialogTitle>{p.name}</DialogTitle>
            <DialogDescription>微信号：{p.wechat}</DialogDescription>
            <p>地区：{p.region}</p>
          </div>
        </div>
        <div className="profile-signature">
          <span>个性签名</span>
          <p>{p.signature}</p>
        </div>
        <button
          className="profile-album"
          onClick={() => {
            if (person) onMoments(person);
            onClose();
          }}
        >
          <span>朋友圈</span>
          <div>
            {photos.slice(0, 3).map((id) => (
              <PhotoTile key={id} id={id} />
            ))}
            {!photos.length && <small>暂无动态</small>}
          </div>
          <ChevronRight size={18} />
        </button>
        <button
          className="wechat-send profile-chat"
          onClick={() => {
            if (person) onChat(person);
            onClose();
          }}
        >
          <MessageCircle size={17} /> 发消息
        </button>
      </DialogContent>
    </Dialog>
  );
}
export function ContactsView({
  viewer = 'me',
  onProfile,
}: {
  onProfile: (id: PersonId) => void;
  viewer?: 'me' | 'lu';
}) {
  return (
    <section className="address-book">
      <header>
        <h2>通讯录</h2>
        <span>4 位联系人</span>
      </header>
      <div className="address-section">
        <Users size={18} /> 我的朋友
      </div>
      {(
        ['aunt', 'mom', viewer === 'me' ? 'lu' : 'me', 'zhou'] as PersonId[]
      ).map((id) => (
        <button key={id} onClick={() => onProfile(id)}>
          <Avatar id={id} />
          <span>
            <strong>{people[id].name}</strong>
            <small>{people[id].signature}</small>
          </span>
          <ChevronRight size={17} />
        </button>
      ))}
    </section>
  );
}
export function MomentsView({
  viewer = 'me',
  storyTime,
  extras,
  setExtras,
  filter,
  setFilter,
  onProfile,
  onPhoto,
}: {
  viewer?: 'me' | 'lu';
  storyTime: string;
  extras: ExtraState;
  setExtras: Dispatch<SetStateAction<ExtraState>>;
  filter: PersonId | null;
  setFilter: (id: PersonId | null) => void;
  onProfile: (id: PersonId) => void;
  onPhoto: (id: string) => void;
}) {
  const [commenting, setCommenting] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [writing, setWriting] = useState(false);
  const [postText, setPostText] = useState('');
  const [postPhotos, setPostPhotos] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<'friends' | 'private'>(
    'friends',
  );
  const [search, setSearch] = useState('');
  const feed = [...extras.posts, ...moments]
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter(
      (p) =>
        canViewMoment(p, viewer) &&
        (!filter || p.person === filter) &&
        (!search ||
          [p.text, people[p.person].name, p.date].join(' ').includes(search)),
    );
  function liked(p: Moment) {
    return (
      extras.likes.includes(viewer === 'me' ? p.id : 'lu:' + p.id) ||
      (p.likes.includes(viewer) &&
        !extras.unlikes.includes(viewer === 'me' ? p.id : 'lu:' + p.id))
    );
  }
  function toggleLike(p: Moment) {
    const on = liked(p);
    const key = viewer === 'me' ? p.id : 'lu:' + p.id;
    setExtras((s) => ({
      ...s,
      likes: on
        ? s.likes.filter((x) => x !== key)
        : [...new Set([...s.likes, key])],
      unlikes: on
        ? [...new Set([...s.unlikes, key])]
        : s.unlikes.filter((x) => x !== key),
    }));
  }
  function addComment(id: string) {
    const text = comment.trim();
    if (!text) return;
    setExtras((s) => ({
      ...s,
      comments: [
        ...s.comments,
        {
          id: 'comment-' + Date.now(),
          post: id,
          person: viewer,
          text,
          reply: replyTo || undefined,
        },
      ],
    }));
    setComment('');
    setCommenting(null);
    setReplyTo('');
  }
  function publish() {
    if (!postText.trim() && !postPhotos.length) return;
    const p: Moment = {
      id: 'post-' + Date.now(),
      person: viewer,
      date: '2025/11/24 ' + storyTime,
      text: postText.trim(),
      photos: postPhotos,
      likes: [],
      comments: [],
      own: true,
      visibility,
      location: '呼兰',
    };
    setExtras((s) => ({ ...s, posts: [p, ...s.posts] }));
    setWriting(false);
    setPostText('');
    setPostPhotos([]);
    setVisibility('friends');
    setFilter(null);
  }
  return (
    <section className="moments-shell">
      <header className="moments-top">
        <div>
          {filter ? (
            <button aria-label="返回全部朋友圈" onClick={() => setFilter(null)}>
              <ChevronLeft size={19} />
            </button>
          ) : (
            <span className="moments-symbol" />
          )}
          <h2>{filter ? people[filter].name + '的相册' : '朋友圈'}</h2>
        </div>
        <button
          aria-label="发表朋友圈"
          title="发表朋友圈"
          onClick={() => setWriting(true)}
        >
          <Camera size={22} />
        </button>
      </header>
      <div className="moments-scroll">
        <div className="moments-cover">
          <span className="moments-home-cover" aria-hidden="true" />
          <div className="moments-cover-shade" />
          <div className="cover-profile">
            <strong>{people[filter || viewer].name}</strong>
            <Avatar
              id={filter || viewer}
              onClick={() => onProfile(filter || viewer)}
            />
          </div>
        </div>
        <p className="moments-signature">
          {people[filter || viewer].signature}
        </p>
        <div className="moments-search">
          <input
            aria-label="搜索朋友圈"
            placeholder="搜索朋友、内容或年份"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button aria-label="清除朋友圈搜索" onClick={() => setSearch('')}>
              <X size={14} />
            </button>
          )}
        </div>
        <div className="moments-feed">
          {feed.map((p) => {
            const names = [
              ...(['me', 'lu'] as PersonId[])
                .filter((id) => {
                  const key = id === 'me' ? p.id : 'lu:' + p.id;
                  return (
                    extras.likes.includes(key) ||
                    (p.likes.includes(id) && !extras.unlikes.includes(key))
                  );
                })
                .map((id) => people[id].name),
              ...p.likes
                .filter((id) => id !== 'me' && id !== 'lu')
                .map((id) => people[id].name),
            ];
            const userComments = extras.comments.filter((c) => c.post === p.id);
            return (
              <article className="moment" key={p.id} data-post-id={p.id}>
                <Avatar id={p.person} onClick={() => onProfile(p.person)} />
                <div className="moment-main">
                  <button
                    className="moment-name"
                    onClick={() => {
                      setFilter(p.person);
                      setSearch('');
                    }}
                  >
                    {people[p.person].name}
                  </button>
                  <p className="moment-text">{p.text}</p>
                  {p.photos.length > 0 && (
                    <div
                      className={
                        'moment-photos ' +
                        (p.photos.length === 1 ? 'single' : '')
                      }
                    >
                      {p.photos.map((id) => (
                        <button
                          key={id}
                          aria-label={
                            '查看' + lifePhotos.find((x) => x.id === id)?.title
                          }
                          onClick={() => onPhoto(id)}
                        >
                          <PhotoTile id={id} />
                        </button>
                      ))}
                    </div>
                  )}
                  {p.location && (
                    <div className="moment-location">
                      <MapPin size={11} />
                      {p.location}
                    </div>
                  )}
                  <div className="moment-meta">
                    {p.visibility === 'private' && (
                      <span className="moment-private">
                        <LockKeyhole size={12} />
                        仅自己可见
                      </span>
                    )}
                    <time>
                      {p.date.split(' ')[0].replaceAll('/', '.')}　
                      {p.date.split(' ')[1]}
                    </time>
                    <div>
                      {p.own && p.person === viewer && (
                        <button
                          aria-label="删除我的动态"
                          onClick={() =>
                            setExtras((s) => ({
                              ...s,
                              posts: s.posts.filter((x) => x.id !== p.id),
                            }))
                          }
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                      <button
                        className={liked(p) ? 'liked' : ''}
                        aria-label={
                          (liked(p) ? '取消点赞' : '点赞') + '：' + p.id
                        }
                        onClick={() => toggleLike(p)}
                      >
                        <Heart
                          size={15}
                          fill={liked(p) ? 'currentColor' : 'none'}
                        />
                        <span>{liked(p) ? '已赞' : '赞'}</span>
                      </button>
                      <button
                        aria-label={'评论：' + p.id}
                        onClick={() => {
                          setCommenting(commenting === p.id ? null : p.id);
                          setReplyTo('');
                          setComment('');
                        }}
                      >
                        <MessageCircle size={15} />
                        <span>评论</span>
                      </button>
                    </div>
                  </div>
                  {(names.length > 0 ||
                    p.comments.length > 0 ||
                    userComments.length > 0) && (
                    <div className="moment-responses">
                      {names.length > 0 && (
                        <div className="moment-likes">
                          <Heart size={13} />
                          {names.join('，')}
                        </div>
                      )}
                      {p.comments.map((c, i) => (
                        <button
                          key={i}
                          className="moment-comment"
                          onClick={() => {
                            setCommenting(p.id);
                            setReplyTo(people[c.person].name);
                          }}
                        >
                          <strong>{people[c.person].name}：</strong>
                          {c.text}
                        </button>
                      ))}
                      {userComments.map((c) => (
                        <div className="moment-comment own-comment" key={c.id}>
                          <span>
                            <strong>
                              {people[c.person || 'me'].name}
                              {c.reply ? ' 回复 ' + c.reply : ''}：
                            </strong>
                            {c.text}
                          </span>
                          {(c.person || 'me') === viewer && (
                            <button
                              aria-label="删除我的评论"
                              onClick={() =>
                                setExtras((s) => ({
                                  ...s,
                                  comments: s.comments.filter(
                                    (x) => x.id !== c.id,
                                  ),
                                }))
                              }
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {commenting === p.id && (
                    <form
                      className="moment-comment-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        addComment(p.id);
                      }}
                    >
                      <input
                        aria-label="朋友圈评论内容"
                        placeholder={
                          replyTo ? '回复 ' + replyTo + '：' : '评论…'
                        }
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        maxLength={300}
                      />
                      <button
                        className="wechat-send"
                        disabled={!comment.trim()}
                        type="submit"
                      >
                        发送
                      </button>
                    </form>
                  )}
                </div>
              </article>
            );
          })}
          {feed.length === 0 && (
            <p className="moments-empty">
              {search ? '没有找到相关动态。' : '这里还没有动态。'}
            </p>
          )}
          <p className="moments-end">
            {filter ? '朋友的生活，都留在这里。' : '—— 朋友们的这些年 ——'}
          </p>
        </div>
      </div>
      <Dialog open={writing} onOpenChange={setWriting}>
        <DialogContent className="moment-compose-dialog">
          <DialogTitle>发表朋友圈</DialogTitle>
          <DialogDescription>记录今天的心情</DialogDescription>
          <div className="publish-author">
            <Avatar id={viewer} />
            <strong>{people[viewer].name}</strong>
          </div>
          <textarea
            aria-label="朋友圈正文"
            placeholder="这一刻的想法…"
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            maxLength={1500}
          />
          <div className="moment-photo-picker">
            <span>
              <ImagePlus size={16} /> 从相册选择
            </span>
            <div>
              {lifePhotos.map((p) => (
                <button
                  className={postPhotos.includes(p.id) ? 'selected' : ''}
                  key={p.id}
                  aria-label={'选择照片：' + p.title}
                  aria-pressed={postPhotos.includes(p.id)}
                  onClick={() =>
                    setPostPhotos((v) =>
                      v.includes(p.id)
                        ? v.filter((id) => id !== p.id)
                        : [...v, p.id],
                    )
                  }
                >
                  <PhotoTile id={p.id} />
                </button>
              ))}
            </div>
          </div>
          <footer>
            <label className="moment-visibility">
              谁可以看
              <select
                aria-label="谁可以看"
                value={visibility}
                onChange={(e) =>
                  setVisibility(e.target.value as 'friends' | 'private')
                }
              >
                <option value="friends">朋友</option>
                <option value="private">仅自己可见</option>
              </select>
            </label>
            <button
              className="wechat-send"
              disabled={!postText.trim() && !postPhotos.length}
              onClick={publish}
            >
              <Send size={15} />
              发表
            </button>
          </footer>
        </DialogContent>
      </Dialog>
    </section>
  );
}
