import type { ImgHTMLAttributes } from 'react';
import { publicAsset } from '../lib/public-asset';
/* eslint-disable @next/next/no-img-element -- This is the static next/image adapter for GitHub Pages. */

type StaticImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string;
  unoptimized?: boolean;
  priority?: boolean;
  fill?: boolean;
};

// All game images are local static assets; GitHub Pages needs no image server.
export default function StaticImage({
  src = '',
  alt = '',
  unoptimized: _unoptimized,
  priority,
  fill,
  style,
  ...props
}: StaticImageProps) {
  return (
    <img
      {...props}
      src={publicAsset(src)}
      alt={alt}
      fetchPriority={priority ? 'high' : props.fetchPriority}
      style={
        fill
          ? {
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              ...style,
            }
          : style
      }
    />
  );
}
