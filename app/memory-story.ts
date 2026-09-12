export const memoryLocks = {
  needle: {
    name: '围巾的针脚',
    password: '0317',
    hint: '那一针的位置：行、针，各写两位。记在自己的朋友圈里。',
  },
  bus: {
    name: '下一班车',
    password: '1620',
    hint: '她后来坐的那班车，几点几分。那天的事写在自己的朋友圈里了。',
  },
  table: {
    name: '南窗底下',
    password: '5274',
    hint: '桌面宽、桌子高，各两位厘米数。修桌子时分两回记在朋友圈里了。',
  },
} as const;
export type MemoryLock = keyof typeof memoryLocks;
export { memoryScenes } from './memory-album';
