'use client';
import { useState } from 'react';
import Image from 'next/image';
import { publicAsset } from '../lib/public-asset';
import { FileImage, ZoomIn, ZoomOut, Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { MailItem } from './rural-story';

export const handwrittenLetters: Record<
  string,
  { date: string; filename: string }
> = {
  spring: { date: '1982 年 4 月 6 日', filename: '1982-04-06_知遥来信.png' },
  summer: { date: '1982 年 7 月 9 日', filename: '1982-07-09_知遥来信.png' },
  autumn: { date: '1983 年 9 月 17 日', filename: '1983-09-17_知遥来信.png' },
  winter: { date: '1984 年 11 月 3 日', filename: '1984-11-03_知遥来信.png' },
};

export function HandwrittenLetter({ mail }: { mail: MailItem }) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const info = handwrittenLetters[mail.id];
  const src = '/letters/zhiyao-' + mail.id + '.png';
  const description = mail.body.join('\n') + '\n' + info.date;
  return (
    <>
      <figure className="handwritten-attachment">
        <figcaption>
          <FileImage size={17} />
          <span>{info.filename}</span>
          <a
            href={publicAsset(src)}
            download={info.filename}
            aria-label={'下载原件：' + mail.subject}
          >
            <Download size={17} />
          </a>
        </figcaption>
        <button
          className="letter-scan-preview"
          aria-label={'查看原件：' + mail.subject}
          onClick={() => {
            setZoom(1);
            setOpen(true);
          }}
        >
          <Image
            src={src}
            alt={description}
            width={1086}
            height={1448}
            unoptimized
            className="handwritten-scan"
          />
        </button>
      </figure>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="letter-image-dialog">
          <DialogTitle>{info.filename}</DialogTitle>
          <DialogDescription className="sr-only">
            许知遥手写信原件。可以放大、缩小和滚动查看。
          </DialogDescription>
          <div className="letter-zoom-toolbar">
            <button
              aria-label="缩小信件"
              disabled={zoom <= 1}
              onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
            >
              <ZoomOut size={19} />
            </button>
            <span>{zoom * 100}%</span>
            <button
              aria-label="放大信件"
              disabled={zoom >= 3}
              onClick={() => setZoom((z) => Math.min(3, z + 0.5))}
            >
              <ZoomIn size={19} />
            </button>
            <a
              href={publicAsset(src)}
              download={info.filename}
              aria-label="下载信件原图"
            >
              <Download size={19} />
            </a>
          </div>
          <section className="letter-original-scroll" aria-label="信件原图">
            <Image
              src={src}
              alt={description}
              width={1086}
              height={1448}
              unoptimized
              className="handwritten-scan"
              style={{ width: `${zoom * 100}%`, maxWidth: 'none' }}
            />
          </section>
        </DialogContent>
      </Dialog>
    </>
  );
}
