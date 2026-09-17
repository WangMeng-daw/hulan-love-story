'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Pause, Check, RotateCcw } from 'lucide-react';
import { publicAsset } from '../lib/public-asset';

type Resource = { path: string; bytes: number };
type Manifest = {
  version: string;
  totalBytes: number;
  offlineShell: boolean;
  resources: Resource[];
};
const mb = (n: number) => (n / 1048576).toFixed(1);
const cacheName = (m: Manifest) => 'hulan-resources-' + m.version;
const assetUrl = (r: Resource) =>
  new URL(publicAsset('/' + r.path), location.href).href;
async function readManifest(signal?: AbortSignal) {
  try {
    const response = await fetch(publicAsset('/resource-manifest.json'), {
      cache: 'no-store',
      signal,
    });
    if (!response.ok) throw new Error('资源清单暂时无法读取');
    const data = (await response.json()) as Manifest;
    if (!Array.isArray(data.resources) || !data.version)
      throw new Error('资源清单不完整');
    try {
      localStorage.setItem(
        'hulan-resource-manifest:' + publicAsset('/'),
        JSON.stringify(data),
      );
    } catch {
      /* Storage may be disabled. */
    }
    return data;
  } catch (error) {
    if (signal?.aborted) throw error;
    try {
      const saved = localStorage.getItem(
        'hulan-resource-manifest:' + publicAsset('/'),
      );
      if (saved) return JSON.parse(saved) as Manifest;
    } catch {
      /* Direct online play remains available. */
    }
    throw error;
  }
}
export function ResourcePreload({
  onBusy,
}: {
  onBusy: (busy: boolean) => void;
}) {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [status, setStatus] = useState('checking');
  const [done, setDone] = useState(0);
  const [bytes, setBytes] = useState(0);
  const [message, setMessage] = useState('正在检查本地资源…');
  const controller = useRef<AbortController | null>(null);
  const manifestRef = useRef<Manifest | null>(null);
  const alive = useRef(true);
  const running = useRef(false);
  const inspect = useCallback(async (signal?: AbortSignal) => {
    if (
      !('caches' in window) ||
      !('serviceWorker' in navigator) ||
      !window.isSecureContext
    )
      throw new Error('当前浏览器不支持本地资源下载，仍可直接开始游戏。');
    const m = await readManifest(signal);
    manifestRef.current = m;
    // Check for a newer worker on each online visit, even when the previous download is complete.
    if (navigator.onLine)
      void navigator.serviceWorker
        .register(publicAsset('/resource-worker.js'), {
          scope: publicAsset('/'),
          updateViaCache: 'none',
        })
        .catch(() => {
          /* The download action reports registration failures if needed. */
        });
    const cache = await caches.open(cacheName(m));
    let count = 0,
      size = 0;
    for (const resource of m.resources) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      if (await cache.match(assetUrl(resource))) {
        count++;
        size += resource.bytes;
      }
    }
    if (alive.current) {
      setManifest(m);
      setDone(count);
      setBytes(size);
      setStatus(count === m.resources.length ? 'complete' : 'idle');
      setMessage(
        count === m.resources.length
          ? '全部资源已保存在此浏览器'
          : count
            ? '已保留下载进度，可以接着下载'
            : '先把照片与信件装进书里，再慢慢读。',
      );
    }
    return m;
  }, []);
  useEffect(() => {
    alive.current = true;
    const initial = new AbortController();
    inspect(initial.signal).catch((error) => {
      if (alive.current && !initial.signal.aborted) {
        setStatus('error');
        setMessage(error.message);
      }
    });
    return () => {
      alive.current = false;
      initial.abort();
      controller.current?.abort();
    };
  }, [inspect]);

  async function download() {
    if (running.current) return;
    running.current = true;
    const abort = new AbortController();
    controller.current = abort;
    setStatus('downloading');
    setMessage('正在下载，请保留这个页面…');
    onBusy(true);
    try {
      const m = manifestRef.current || (await inspect(abort.signal));
      if (abort.signal.aborted) throw new DOMException('Aborted', 'AbortError');
      setStatus('downloading');
      const registration = await navigator.serviceWorker.register(
        publicAsset('/resource-worker.js'),
        { scope: publicAsset('/'), updateViaCache: 'none' },
      );
      // Wait for an active worker before claiming durable/offline availability.
      await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(
          () => finish(new Error('资源缓存启动超时，请重试')),
          15000,
        );
        const check = () => {
          if (registration.active?.state === 'activated') finish();
        };
        const interval = window.setInterval(check, 100);
        const cancel = () => finish(new DOMException('Aborted', 'AbortError'));
        function finish(error?: Error) {
          clearTimeout(timeout);
          clearInterval(interval);
          abort.signal.removeEventListener('abort', cancel);
          if (error) reject(error);
          else resolve();
        }
        abort.signal.addEventListener('abort', cancel, { once: true });
        check();
        if (abort.signal.aborted) cancel();
      });
      const cache = await caches.open(cacheName(m));
      let completed = 0,
        loaded = 0;
      const pending: Resource[] = [];
      for (const resource of m.resources) {
        if (await cache.match(assetUrl(resource))) {
          completed++;
          loaded += resource.bytes;
        } else pending.push(resource);
      }
      if (abort.signal.aborted) throw new DOMException('Aborted', 'AbortError');
      setDone(completed);
      setBytes(loaded);
      const failures: string[] = [];
      let cursor = 0;
      async function worker() {
        while (!abort.signal.aborted && cursor < pending.length) {
          const resource = pending[cursor++];
          try {
            const response = await fetch(assetUrl(resource), {
              signal: abort.signal,
              cache: 'reload',
            });
            if (!response.ok) throw new Error('HTTP ' + response.status);
            const blob = await response.blob();
            if (
              blob.size !== resource.bytes ||
              (/\.(png|jpg|webp)$/.test(resource.path) &&
                !blob.type.startsWith('image/'))
            )
              throw new Error('资源不完整');
            await cache.put(
              assetUrl(resource),
              new Response(blob, {
                headers: response.headers,
                status: response.status,
              }),
            );
            completed++;
            loaded += resource.bytes;
            if (alive.current) {
              setDone(completed);
              setBytes(loaded);
            }
          } catch (error) {
            if (!abort.signal.aborted)
              failures.push(
                error instanceof DOMException &&
                  error.name === 'QuotaExceededError'
                  ? '浏览器存储空间不足'
                  : resource.path,
              );
          }
        }
      }
      await Promise.all([worker(), worker(), worker()]);
      if (abort.signal.aborted) {
        setStatus('paused');
        setMessage('下载已暂停，已完成的资源会保留。');
      } else if (failures.length) {
        setStatus('error');
        setMessage(
          failures.includes('浏览器存储空间不足')
            ? '浏览器存储空间不足，可释放空间后重试，或直接开始。'
            : `${failures.length} 项未能下载，请检查网络后重试。`,
        );
      } else {
        setStatus('complete');
        setMessage('全部资源已保存在此浏览器');
      }
    } catch (error) {
      if (alive.current) {
        setStatus(abort.signal.aborted ? 'paused' : 'error');
        setMessage(
          abort.signal.aborted
            ? '下载已暂停，已完成的资源会保留。'
            : '下载暂未完成：' +
                (error instanceof Error ? error.message : '请重试'),
        );
      }
    } finally {
      running.current = false;
      controller.current = null;
      if (alive.current) onBusy(false);
    }
  }
  const percent = manifest
    ? Math.round((bytes / manifest.totalBytes) * 100)
    : 0;
  return (
    <section
      className="resource-preload"
      data-status={status}
      data-completed={done}
      data-total={manifest?.resources.length || 0}
      aria-label="游戏资源下载"
    >
      <div className="resource-heading">
        <span>
          {status === 'complete' ? <Check size={16} /> : <Download size={16} />}{' '}
          {status === 'complete' ? '资源已备好' : '把往事留在本机'}
        </span>
        <small>
          {manifest
            ? `${mb(bytes)} / ${mb(manifest.totalBytes)} MB`
            : '照片 · 信件 · 片尾'}
        </small>
      </div>
      <progress value={percent} max={100} aria-label="资源下载进度" />
      <div className="resource-bottom">
        <output>
          {message}
          {status === 'downloading' && manifest
            ? ` ${done}/${manifest.resources.length} · ${percent}%`
            : ''}
        </output>
        {status === 'downloading' ? (
          <button onClick={() => controller.current?.abort()}>
            <Pause size={14} />
            暂停下载
          </button>
        ) : (
          status !== 'complete' && (
            <button disabled={status === 'checking'} onClick={download}>
              {status === 'error' ? (
                <RotateCcw size={14} />
              ) : (
                <Download size={14} />
              )}
              {status === 'error'
                ? '重试下载'
                : done
                  ? '继续下载'
                  : '一键下载全部资源'}
            </button>
          )
        )}
      </div>
      <small className="resource-note">
        {status === 'complete' && manifest?.offlineShell
          ? '已可离线游玩。'
          : '也可直接开始，游玩时按需加载。'}{' '}
        缓存仅保存在当前浏览器，清理浏览器数据后需重新下载。
      </small>
    </section>
  );
}
