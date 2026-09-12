'use client';
import { proseParagraphClass } from './prose-paragraph';
import { useState, type Dispatch, type SetStateAction } from 'react';
import {
  Mail,
  Search,
  Inbox,
  Send,
  PenLine,
  Star,
  Trash2,
  Reply,
  ArrowRight,
  Archive,
  X,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar } from './desktop-social';
import { HandwrittenLetter, handwrittenLetters } from './handwritten-letter';
import { mails, type MailItem } from './rural-story';
import { type ExtraState, type LocalMail } from './desktop-life';
type Props = {
  extras: ExtraState;
  setExtras: Dispatch<SetStateAction<ExtraState>>;
  folder: string;
  selected: string;
  query: string;
  read: string[];
  onSelect: (id: string) => void;
  onFolder: (folder: string, id?: string) => void;
  onQuery: (v: string) => void;
  notify: (message: string) => void;
};
export default function DesktopMail({
  extras,
  setExtras,
  folder,
  selected,
  query,
  read,
  onSelect,
  onFolder,
  onQuery,
  notify,
}: Props) {
  const [compose, setCompose] = useState<{
    id?: string;
    to: string;
    subject: string;
    body: string;
  } | null>(null);
  const [error, setError] = useState('');
  const all: (MailItem | LocalMail)[] = [...mails, ...extras.localMails];
  const inFolder = (m: MailItem | LocalMail, f: string) =>
    f === 'trash'
      ? extras.deletedMails.includes(m.id)
      : !extras.deletedMails.includes(m.id) &&
        (f === 'starred' ? extras.stars.includes(m.id) : m.folder === f);
  const list = all
    .filter(
      (m) =>
        inFolder(m, folder) &&
        (!query ||
          [m.from, m.subject, ...m.body]
            .join(' ')
            .toLowerCase()
            .includes(query.toLowerCase())),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  const current = list.find((m) => m.id === selected) || list[0];
  const folders = [
    { id: 'inbox', name: '收件箱', icon: Inbox },
    { id: 'starred', name: '星标邮件', icon: Star },
    { id: 'sent', name: '已发送', icon: Send },
    { id: 'drafts', name: '草稿', icon: PenLine },
    { id: 'trash', name: '废纸篓', icon: Trash2 },
  ];
  function switchFolder(v: string) {
    onQuery('');
    onFolder(
      v,
      all
        .filter((m) => inFolder(m, v))
        .sort((a, b) => b.date.localeCompare(a.date))[0]?.id,
    );
  }
  function write(mode: 'new' | 'reply' | 'forward' | 'edit') {
    if (mode === 'new' || !current) {
      setCompose({ to: '', subject: '', body: '' });
    } else {
      setCompose({
        id: mode === 'edit' && 'to' in current ? current.id : undefined,
        to:
          mode === 'edit' && 'to' in current
            ? current.to
            : mode === 'reply'
              ? current.email
              : '',
        subject:
          mode === 'edit'
            ? current.subject
            : (mode === 'reply' ? 'Re: ' : 'Fw: ') + current.subject,
        body:
          mode === 'edit'
            ? current.body.join('\n\n')
            : '\n\n—— ' +
              current.from +
              '，' +
              current.date +
              ' ——\n' +
              current.body.join('\n'),
      });
    }
    setError('');
  }
  function saveMail(send: boolean) {
    if (!compose) return;
    if (send && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(compose.to)) {
      setError('请填写完整的收件人邮箱。');
      return;
    }
    if (send && !compose.subject.trim()) {
      setError('请填写邮件主题。');
      return;
    }
    const item: LocalMail = {
      id: compose.id || 'mail-' + Date.now(),
      from: '陆禾',
      email: 'luhe@example.com',
      to: compose.to.trim(),
      subject: compose.subject.trim() || '（无主题）',
      date: '2025/11/24',
      folder: send ? 'sent' : 'drafts',
      body: [compose.body],
    };
    setExtras((s) => ({
      ...s,
      localMails: [...s.localMails.filter((m) => m.id !== item.id), item],
    }));
    setCompose(null);
    onQuery('');
    onFolder(item.folder, item.id);
    notify(send ? '已发送' : '草稿已保存');
  }
  function star(id: string) {
    setExtras((s) => ({
      ...s,
      stars: s.stars.includes(id)
        ? s.stars.filter((x) => x !== id)
        : [...s.stars, id],
    }));
  }
  return (
    <div className="mail-layout">
      <div className="mail-brand">
        <Mail size={27} />
        <strong>邮箱</strong>
        <span>陆守义 &lt;lushouyi@example.com&gt;</span>
        <button
          className="mail-new-mobile"
          aria-label="写邮件"
          onClick={() => write('new')}
        >
          <PenLine size={20} />
        </button>
        <label>
          <Search size={15} />
          <input
            placeholder="搜索邮件"
            aria-label="搜索邮件"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
          />
        </label>
      </div>
      <aside className="mail-folders">
        <button className="mail-compose-button" onClick={() => write('new')}>
          <PenLine size={17} />
          写邮件
        </button>
        <span className="mail-account">lushouyi@example.com</span>
        <Tabs
          orientation="vertical"
          value={folder}
          onValueChange={(v) => switchFolder(String(v))}
        >
          <TabsList className="mail-folder-list">
            {folders.map((f) => (
              <TabsTrigger value={f.id} key={f.id}>
                <f.icon size={16} />
                {f.name}
                <span>{all.filter((m) => inFolder(m, f.id)).length}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <p>
          <Archive size={14} />
          1981—2025
          <br />
          <span>旧信扫描与家庭邮件</span>
        </p>
      </aside>
      <div className="mail-list">
        <div className="mail-list-heading">
          {folders.find((f) => f.id === folder)?.name}
          <span>{list.length} 封</span>
        </div>
        {list.map((m) => (
          <div
            className={
              'mail-list-item ' + (current?.id === m.id ? 'active' : '')
            }
            key={m.id}
          >
            <button
              className={
                'mail-row ' +
                (current?.id === m.id ? 'active' : '') +
                (!read.includes(m.id) ? ' unread' : '')
              }
              onClick={() => onSelect(m.id)}
            >
              <div>
                <strong>{m.from}</strong>
                <small>{m.date}</small>
              </div>
              <h3>{m.subject}</h3>
              <p>{m.body[0]}</p>
            </button>
            <button
              className={
                'mail-row-star ' +
                (extras.stars.includes(m.id) ? 'starred' : '')
              }
              aria-label={
                (extras.stars.includes(m.id) ? '取消星标：' : '标星：') +
                m.subject
              }
              onClick={() => star(m.id)}
            >
              <Star
                size={13}
                fill={extras.stars.includes(m.id) ? 'currentColor' : 'none'}
              />
            </button>
          </div>
        ))}
        {!list.length && (
          <p className="blank-state">
            {query ? '没有找到相关邮件。' : '这个文件夹是空的。'}
          </p>
        )}
      </div>
      <article className="mail-reading">
        {current ? (
          <>
            <div className="mail-actions">
              <button
                onClick={() =>
                  write(current.folder === 'drafts' ? 'edit' : 'reply')
                }
              >
                <Reply size={15} />
                {current.folder === 'drafts' ? '继续编辑' : '回复'}
              </button>
              <button onClick={() => write('forward')}>
                <ArrowRight size={15} />
                转发
              </button>
              <button
                className={extras.stars.includes(current.id) ? 'starred' : ''}
                onClick={() => star(current.id)}
                aria-label="切换当前邮件星标"
              >
                <Star
                  size={15}
                  fill={
                    extras.stars.includes(current.id) ? 'currentColor' : 'none'
                  }
                />
              </button>
              <button
                aria-label={folder === 'trash' ? '还原邮件' : '删除邮件'}
                onClick={() => {
                  setExtras((s) => ({
                    ...s,
                    deletedMails:
                      folder === 'trash'
                        ? s.deletedMails.filter((x) => x !== current.id)
                        : [...s.deletedMails, current.id],
                  }));
                  notify(
                    folder === 'trash'
                      ? '邮件已还原到原文件夹。'
                      : '邮件已移入废纸篓，可随时还原。',
                  );
                }}
              >
                {folder === 'trash' ? (
                  <Archive size={15} />
                ) : (
                  <Trash2 size={15} />
                )}
              </button>
            </div>
            <span className="mail-folder-caption">
              {'source' in current && current.source
                ? '附件（1）'
                : current.folder === 'drafts'
                  ? '未发送的草稿'
                  : '家庭邮件存档'}
            </span>
            <h2>{current.subject}</h2>
            <div className="mail-sender">
              <Avatar
                id={
                  current.from === '陆守义'
                    ? 'lu'
                    : current.from === '陆建军'
                      ? 'aunt'
                      : current.from === '陆禾'
                        ? 'me'
                        : 'transfer'
                }
              />
              <div>
                <strong>
                  {current.from}
                  <span>&lt;{current.email}&gt;</span>
                </strong>
                <small>
                  收件人：
                  {'to' in current
                    ? current.to
                    : current.folder === 'inbox'
                      ? '陆守义'
                      : '陆建军'}
                  　·　{current.date}
                </small>
              </div>
            </div>
            {'source' in current && handwrittenLetters[current.id] ? (
              <HandwrittenLetter key={current.id} mail={current as MailItem} />
            ) : (
              <div className="mail-body">
                {current.body.map((p, i) => (
                  <p key={i} className={proseParagraphClass(p)}>
                    {p}
                  </p>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="mail-no-selection">
            <Mail size={45} />
            <p>选择一封邮件阅读</p>
          </div>
        )}
      </article>
      <Dialog
        open={!!compose}
        onOpenChange={(v) => {
          if (!v && compose) {
            saveMail(false);
          }
        }}
      >
        <DialogContent className="mail-compose-dialog" showCloseButton={false}>
          <header>
            <DialogTitle>{compose?.id ? '编辑草稿' : '新邮件'}</DialogTitle>
            <button aria-label="保存草稿并关闭" onClick={() => saveMail(false)}>
              <X size={20} />
            </button>
          </header>
          <DialogDescription>陆禾 &lt;luhe@example.com&gt;</DialogDescription>
          {compose && (
            <>
              <label>
                <span>收件人</span>
                <input
                  aria-label="邮件收件人"
                  value={compose.to}
                  onChange={(e) => {
                    setCompose({ ...compose, to: e.target.value });
                    setError('');
                  }}
                  placeholder="name@example.com"
                />
              </label>
              <label>
                <span>主题</span>
                <input
                  aria-label="邮件主题"
                  value={compose.subject}
                  onChange={(e) =>
                    setCompose({ ...compose, subject: e.target.value })
                  }
                />
              </label>
              <textarea
                aria-label="邮件正文"
                value={compose.body}
                onChange={(e) =>
                  setCompose({ ...compose, body: e.target.value })
                }
                placeholder="写下想说的话…"
                maxLength={10000}
              />
              <output className="form-error">{error}</output>
              <footer>
                <button
                  className="system-button primary"
                  onClick={() => saveMail(true)}
                >
                  <Send size={15} />
                  发送
                </button>
                <button
                  className="system-button"
                  onClick={() => saveMail(false)}
                >
                  存为草稿
                </button>
                <button
                  className="discard-mail"
                  onClick={() => setCompose(null)}
                >
                  放弃
                </button>
              </footer>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
