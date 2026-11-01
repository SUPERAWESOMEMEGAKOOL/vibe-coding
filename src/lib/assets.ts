import type { SourceDocument } from '../types';

export function assetUrl(path: string) {
  return /^https:\/\//i.test(path)
    ? path
    : `${import.meta.env.BASE_URL}${path.replace(/^\.\//, '')}`;
}

export function documentUrl(document: SourceDocument) {
  return `${assetUrl(document.path)}#page=${document.page}&view=FitH`;
}

export function isLocalPaperPath(value: unknown, extension: 'pdf' | 'image'): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith('papers/') &&
    !value.includes('..') &&
    (extension === 'pdf'
      ? /^papers\/[a-zA-Z0-9_/-]+\.pdf$/
      : /^papers\/[a-zA-Z0-9_/-]+\.(webp|png|jpg)$/
    ).test(value)
  );
}
