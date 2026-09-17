'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowRight, Heart, Download, X, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { publicAsset } from '../lib/public-asset';
import { ResourcePreload } from './resource-preload';

function Book({
  ending = false,
  opening = false,
}: {
  ending?: boolean;
  opening?: boolean;
}) {
  return (
    <div
      className={
        'book-stage' +
        (ending ? ' is-closing' : '') +
        (opening ? ' is-opening' : '')
      }
      aria-label={ending ? '合上的呼兰爱情故事' : '呼兰爱情故事书册'}
    >
      <div className="book-object">
        <div className="book-pages">
          <span>
            那些没舍得删的东西，
            <br />
            后来都成了想念。
          </span>
          <small>一九八一 · 二〇二五</small>
        </div>
        <div className="book-cover">
          <div className="book-border">
            <p className="book-kicker">柳 河 屯 旧 事</p>
            <h1>
              呼兰
              <br />
              <span>爱情故事</span>
            </h1>
            <div className="book-photo">
              <Image
                src="/cover/hulan-love-story.png"
                width={1536}
                height={1024}
                unoptimized
                priority
                alt="陆守义和许知遥的旧合影"
              />
            </div>
            <p className="book-quote">有些人，一辈子只爱过一次。</p>
            <span className="book-author">wangm 著</span>
          </div>
        </div>
        <div className="book-ribbon" />
      </div>
    </div>
  );
}

export function SupportDialog({ onClose }: { onClose: () => void }) {
  const [large, setLarge] = useState(false);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className={'support-dialog' + (large ? ' qr-large' : '')}
        showCloseButton={false}
      >
        <header>
          <span className="support-kicker">致读到这里的你</span>
          <button onClick={onClose} aria-label="关闭打赏页面">
            <X size={20} />
          </button>
        </header>
        <Heart className="support-heart" size={25} />
        <DialogTitle>谢谢你，让故事继续。</DialogTitle>
        <DialogDescription>
          如果这段故事曾让你停留，可以请作者喝杯热茶。金额随心，打赏完全自愿；完整故事始终免费。
        </DialogDescription>
        <button
          className="support-qr"
          onClick={() => setLarge((v) => !v)}
          aria-label={large ? '缩小收款码' : '放大收款码'}
        >
          <Image
            src="/support/wechat-pay.png"
            width={1242}
            height={1692}
            alt="作者提供的微信收款码"
            unoptimized
          />
        </button>
        <p className="support-instruction">
          微信扫码，或保存图片后在微信中识别。
          <br />
          收款码由作者提供。
        </p>
        <a
          className="support-save"
          href={publicAsset('/support/wechat-pay.png')}
          download="呼兰爱情故事-作者收款码.png"
        >
          <Download size={16} />
          保存收款码原图
        </a>
        <button className="support-skip" onClick={onClose}>
          不用啦，把故事记住就好
        </button>
      </DialogContent>
    </Dialog>
  );
}

export function StoryBookStart({
  ready,
  started,
  onEnter,
}: {
  ready: boolean;
  started: boolean;
  onEnter: () => void;
}) {
  const [opening, setOpening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [support, setSupport] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );
  function enter() {
    if (opening || !ready || busy) return;
    setOpening(true);
    timer.current = window.setTimeout(
      onEnter,
      matchMedia('(prefers-reduced-motion: reduce)').matches ? 80 : 1250,
    );
  }
  return (
    <main
      className={'story-book-start' + (opening ? ' book-entering' : '')}
      data-book-state={opening ? 'opening' : 'closed'}
    >
      <header className="book-page-header">
        <span>呼兰爱情故事</span>
        <span>一段藏在日常里的往事</span>
      </header>
      <div className="book-start-layout">
        <Book opening={opening} />
        <section className="book-introduction">
          <p className="book-eyebrow">黑龙江 · 呼兰 / 2025 年冬</p>
          <h2>
            雪又落了一院子。
            <br />
            这一次，没人出来接你。
          </h2>
          <div className="book-intro-text">
            <p>
              你叫陆禾，今年二十二岁。爷爷陆守义走了一周，你回到柳河屯，整理他留下的旧电脑。
            </p>
            <p>
              爸爸和妈妈还在回村的路上。家庭群里的消息，停在爷爷说“回来就行”的那天。
            </p>
            <p>
              旧照片，扫描的信，舍不得删的东西。
              <br />
              你以为自己只是回来收拾一间屋子。
            </p>
          </div>
          <ResourcePreload onBusy={setBusy} />
          <button
            id="enter-desktop"
            className="book-enter"
            disabled={!ready || opening || busy}
            onClick={enter}
          >
            {opening
              ? '往事正在翻开…'
              : !ready
                ? '正在读取存档'
                : started
                  ? '翻开书 · 继续整理'
                  : '翻开这本书'}
            <ArrowRight size={19} />
          </button>
          <p className="book-start-note">
            {busy
              ? '下载完成后即可翻开，也可以暂停下载直接开始。'
              : '自由翻看 · 自动保存 · 建议戴上耳机'}
          </p>
        </section>
      </div>
      <footer className="book-page-footer">
        <span>原创虚构 · 免费网页叙事解谜</span>
        <button onClick={() => setSupport(true)}>
          支持作者 <Heart size={13} />
        </button>
      </footer>
      {support && <SupportDialog onClose={() => setSupport(false)} />}
    </main>
  );
}

export function StoryBookEnd({
  onReplay,
  onReturn,
}: {
  onReplay: () => void;
  onReturn: () => void;
}) {
  const [support, setSupport] = useState(false);
  return (
    <section className="story-book-end" data-book-state="closing">
      <Book ending />
      <div className="book-end-text">
        <span className="book-eyebrow">全 书 完</span>
        <h2>等春天来</h2>
        <p>
          河开了很多次。
          <br />
          他只答应过这一次。
        </p>
        <p className="book-dedication">
          献给那些被好好爱过，
          <br />
          却来不及道别的人。
        </p>
        <p className="book-cast">
          陆守义 · 许知遥
          <br />
          陆建军 · 陈淑琴 · 陆禾
          <br />
          还有桂兰，和柳河屯的旧人。
        </p>
        <p className="book-credit">
          原创故事与制作 / wangm
          <br />
          片尾画面根据虚构故事重现
        </p>
        <button className="book-support" onClick={() => setSupport(true)}>
          <Heart size={17} />
          请作者喝杯热茶
        </button>
        <div className="book-end-actions">
          <button onClick={onReplay}>
            <RotateCcw size={14} />
            再看一遍
          </button>
          <button onClick={onReturn}>
            返回旧电脑
            <ArrowRight size={14} />
          </button>
        </div>
        <small>打赏自愿。谢谢你把故事读到了最后。</small>
      </div>
      {support && <SupportDialog onClose={() => setSupport(false)} />}
    </section>
  );
}
