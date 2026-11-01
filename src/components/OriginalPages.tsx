import { assetUrl } from '../lib/assets';
import type { SourceImage } from '../types';

export default function OriginalPages({
  images,
  label,
  print = false,
}: {
  images: SourceImage[];
  label: string;
  print?: boolean;
}) {
  return (
    <div className={`original-pages ${print ? 'original-pages-print' : ''}`}>
      {images.map((image, index) => (
        <figure key={image.path}>
          <img
            src={assetUrl(image.path)}
            width={image.width}
            height={image.height}
            alt={`${label}${images.length > 1 ? `, section ${index + 1} of ${images.length}` : ''}. Original PDF page ${image.page}.`}
            loading={print || index === 0 ? 'eager' : 'lazy'}
            decoding="async"
          />
          {images.length > 1 && (
            <figcaption>
              Original page {image.page} · {index + 1}/{images.length}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}
