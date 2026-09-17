'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { publicAsset } from '../lib/public-asset';
import { ChevronLeft, ChevronRight, Pause, Play, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { memoryScenes } from './memory-story';
import { StoryBookEnd } from './story-book';

/* eslint-disable jsx-a11y/prefer-tag-over-role -- The container names a single cropped still; the full atlas is decorative. */
export function MemoryStill({
  atlas,
  tile,
  title,
}: {
  atlas: string;
  tile: number;
  title: string;
}) {
  return (
    <div className="memory-still" role="img" aria-label={title}>
      <Image
        src={'/memories/memory-' + atlas + '.png'}
        width={1536}
        height={1024}
        unoptimized
        loading="eager"
        alt=""
        draggable={false}
        style={{
          left: (tile % 2) * -100 + '%',
          top: Math.floor(tile / 2) * -100 + '%',
        }}
      />
    </div>
  );
}

export function MemoryFilm({ onClose }: { onClose: () => void }) {
  const body = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [analysis, setAnalysis] = useState(false);
  const credits = index === memoryScenes.length;
  const scene = memoryScenes[Math.min(index, memoryScenes.length - 1)];
  useEffect(() => {
    const nextAtlas = memoryScenes.find(
      (item, i) => i > index && item.atlas !== scene.atlas,
    );
    if (!nextAtlas) return;
    const preload = new window.Image();
    preload.src = publicAsset('/memories/memory-' + nextAtlas.atlas + '.png');
  }, [index, scene.atlas]);
  useEffect(() => {
    if (body.current) body.current.scrollTop = 0;
  }, [index]);
  useEffect(() => {
    if (!playing || analysis || credits) return;
    // Leave time to read; a hidden tab must not silently advance the ending.
    const timer = window.setInterval(() => {
      if (!document.hidden)
        setIndex((i) => Math.min(i + 1, memoryScenes.length));
    }, 16000);
    return () => window.clearInterval(timer);
  }, [index, playing, analysis, credits]);
  function move(delta: number) {
    setIndex((i) => Math.max(0, Math.min(i + delta, memoryScenes.length)));
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="memory-film"
        showCloseButton={false}
        onKeyDown={(event) => {
          if (event.target instanceof HTMLSelectElement) return;
          if (event.key === 'ArrowRight') {
            event.preventDefault();
            move(1);
          }
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            move(-1);
          }
          if (
            event.key === ' ' &&
            !(event.target instanceof HTMLButtonElement)
          ) {
            event.preventDefault();
            setPlaying((p) => !p);
          }
        }}
      >
        <header>
          <div>
            <DialogTitle>呼兰爱情故事</DialogTitle>
            <DialogDescription>片尾 · 他们的一生</DialogDescription>
          </div>
          <button onClick={onClose} aria-label="返回旧电脑">
            <X size={22} />
          </button>
        </header>
        <div
          ref={body}
          className="memory-film-body"
          data-scene={index}
          data-playing={playing && !analysis && !credits}
        >
          {credits ? (
            <StoryBookEnd
              onReturn={onClose}
              onReplay={() => {
                setIndex(0);
                setPlaying(true);
                setAnalysis(false);
              }}
            />
          ) : (
            <>
              <div
                className={
                  'memory-frame ' + (playing && !analysis ? 'is-playing' : '')
                }
                key={index}
              >
                <MemoryStill
                  atlas={scene.atlas}
                  tile={scene.tile}
                  title={scene.title}
                />
                <span className="memory-year">{scene.year}</span>
              </div>
              <section className="memory-narrative" key={'text-' + index}>
                <h2>{scene.title}</h2>
                <p>{scene.text}</p>
                <p className="memory-after">{scene.after}</p>
              </section>
              {analysis && (
                <aside className="memory-analysis">
                  <h3>这一幕背后的线索</h3>
                  <p>{scene.analysis}</p>
                  <small>{scene.source}</small>
                </aside>
              )}
            </>
          )}
        </div>
        <footer>
          <div className="memory-progress" aria-label="片尾进度">
            {memoryScenes.map((s, i) => (
              <button
                key={s.title}
                className={i === index ? 'active' : ''}
                aria-label={'跳至：' + s.title}
                onClick={() => setIndex(i)}
              />
            ))}
            <button
              className={credits ? 'active' : ''}
              aria-label="跳至谢幕"
              onClick={() => setIndex(memoryScenes.length)}
            />
          </div>
          <div className="memory-controls">
            <select
              className="memory-scene-select"
              aria-label="选择片尾照片"
              value={index}
              onChange={(event) => setIndex(Number(event.target.value))}
            >
              {memoryScenes.map((item, i) => (
                <option key={item.title} value={i}>
                  {String(i + 1).padStart(2, '0')} · {item.title}
                </option>
              ))}
              <option value={memoryScenes.length}>谢幕</option>
            </select>
            <button
              onClick={() => move(-1)}
              disabled={index === 0}
              aria-label="上一幕"
            >
              <ChevronLeft />
            </button>
            <button
              onClick={() => setPlaying((p) => !p)}
              disabled={credits || analysis}
              aria-label={playing ? '暂停片尾' : '播放片尾'}
            >
              {playing ? <Pause size={19} /> : <Play size={19} />}
            </button>
            <button
              onClick={() => move(1)}
              disabled={credits}
              aria-label="下一幕"
            >
              <ChevronRight />
            </button>
            <span>
              {credits
                ? '谢幕'
                : String(index + 1).padStart(2, '0') +
                  ' / ' +
                  memoryScenes.length}
            </span>
            <button
              className="analysis-toggle"
              aria-pressed={analysis}
              disabled={credits}
              onClick={() => setAnalysis((a) => !a)}
            >
              {analysis ? '收起解析' : '线索解析'}
            </button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
