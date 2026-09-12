'use client';
import { useState } from 'react';
import Image from 'next/image';
import { publicAsset } from '../lib/public-asset';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { finalLetterPages, farewell } from './rural-story';

type ScanPage = { src: string; label: string; text: string };
export const paperScans: Record<string, { title: string; pages: ScanPage[] }> =
  {
    farewell: {
      title: '没写完_给知遥',
      pages: [
        {
          src: '/papers/unfinished-zhiyao.png',
          label: '第 1 页',
          text: farewell.body!.join('\n'),
        },
      ],
    },
    receipt: {
      title: '没置办完的喜事',
      pages: [
        {
          src: '/papers/receipt-front.png',
          label: '正面',
          text: '柳河屯供销社 赊购单\n单号 0847\n日期 1984年11月3日\n购买人 陆守义\n红花搪瓷碗 两只\n枕巾 一对\n备注 开春办喜事用',
        },
        {
          src: '/papers/receipt-back.png',
          label: '背面',
          text: '少买点。建军来了，得给他留个睡觉的地方。\n我想让那个孩子也有个家。\n知遥\n1984年11月3日',
        },
      ],
    },
    register: {
      title: '户籍底册_摘录',
      pages: [
        {
          src: '/papers/household-register.png',
          label: '第 1 页',
          text: '柳河屯户籍底册抄录（家中留存）\n户主：陆守义\n出生：1958年\n婚姻状况：未婚\n家庭成员：陆建军，男，1980年生\n与户主关系：养子\n迁入日期：1985年4月6日\n备注：生父母早亡，由屯集体照料。陆守义申请抚养，经办人李桂兰。\n姓名原记“建军”，入户后随陆姓，名字未改。\n孩子的名字留着，他爹娘给起的。',
        },
      ],
    },
    father: {
      title: '给建军的信',
      pages: finalLetterPages.map((text, i) => ({
        src: `/papers/to-jianjun-${i + 1}.png`,
        label: `第 ${i + 1} 页`,
        text: text.join('\n'),
      })),
    },
  };

export function PaperScans({ id }: { id: string }) {
  const doc = paperScans[id];
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const page = doc.pages[index];
  function changePage(next: number) {
    setIndex(next);
    setZoom(1);
  }
  const controls = (
    <div className="paper-page-controls">
      <button
        aria-label="上一页扫描件"
        disabled={index === 0}
        onClick={() => changePage(index - 1)}
      >
        <ChevronLeft size={18} />
      </button>
      <span>
        {page.label} · {index + 1} / {doc.pages.length}
      </span>
      <button
        aria-label="下一页扫描件"
        disabled={index === doc.pages.length - 1}
        onClick={() => changePage(index + 1)}
      >
        <ChevronRight size={18} />
      </button>
      <a
        href={publicAsset(page.src)}
        download={`${doc.title}_${page.label}.png`}
        aria-label="下载当前扫描件"
      >
        <Download size={18} />
      </a>
    </div>
  );
  return (
    <section className="paper-scans" aria-label={doc.title}>
      {!open && controls}
      <button
        className="letter-scan-preview"
        aria-label={`放大扫描件：${doc.title} ${page.label}`}
        onClick={() => {
          setZoom(1);
          setOpen(true);
        }}
      >
        <Image
          src={page.src}
          alt={page.text}
          width={1086}
          height={1448}
          unoptimized
          className="handwritten-scan"
        />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="letter-image-dialog paper-image-dialog">
          <DialogTitle>{doc.title}.png</DialogTitle>
          <DialogDescription className="sr-only">
            扫描原件，可翻页和放大阅读。
          </DialogDescription>
          {controls}
          <div className="letter-zoom-toolbar">
            <button
              aria-label="缩小扫描件"
              disabled={zoom <= 1}
              onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
            >
              <ZoomOut size={18} />
            </button>
            <span>{zoom * 100}%</span>
            <button
              aria-label="放大扫描件"
              disabled={zoom >= 3}
              onClick={() => setZoom((z) => Math.min(3, z + 0.5))}
            >
              <ZoomIn size={18} />
            </button>
          </div>
          <section
            key={index}
            className="letter-original-scroll"
            aria-label="扫描件原图"
          >
            <Image
              src={page.src}
              alt={page.text}
              width={1086}
              height={1448}
              unoptimized
              className="handwritten-scan"
              style={{ width: `${zoom * 100}%`, maxWidth: 'none' }}
            />
          </section>
        </DialogContent>
      </Dialog>
    </section>
  );
}
