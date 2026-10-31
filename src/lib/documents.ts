import type { Subject } from '../types';

export interface PaperDocument {
  id: string;
  name: string;
  subject: Subject;
  kind: 'paper' | 'mark-scheme';
  year: number;
  size: number;
  addedAt: string;
  file: Blob;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('folio-documents', 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore('documents', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        new Error(
          'Your browser could not open the PDF library. Check that site storage is enabled.',
        ),
      );
  });
}

export async function listDocuments(): Promise<PaperDocument[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('documents', 'readonly');
    const request = transaction.objectStore('documents').getAll();
    transaction.oncomplete = () => {
      db.close();
      resolve(
        (request.result as PaperDocument[]).sort((a, b) => b.addedAt.localeCompare(a.addedAt)),
      );
    };
    transaction.onerror = () => {
      db.close();
      reject(new Error('Could not read your PDF library.'));
    };
  });
}

export async function saveDocuments(
  files: File[],
  subject: Subject,
  kind: PaperDocument['kind'],
  year: number,
): Promise<void> {
  const documents: PaperDocument[] = [];
  for (const file of files) {
    if (file.size > 25 * 1024 * 1024) throw new Error(`${file.name} is larger than 25 MB.`);
    const header = await file.slice(0, 5).text();
    if (header !== '%PDF-') throw new Error(`${file.name} is not a valid PDF file.`);
    documents.push({
      id: crypto.randomUUID(),
      name: file.name,
      subject,
      kind,
      year,
      size: file.size,
      addedAt: new Date().toISOString(),
      file,
    });
  }
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('documents', 'readwrite');
    documents.forEach((doc) => transaction.objectStore('documents').put(doc));
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(new Error('Could not save the PDFs. Your browser’s storage may be full.'));
    };
    transaction.onabort = () => {
      db.close();
      reject(new Error('PDF upload was interrupted. No files were saved.'));
    };
  });
}

export async function deleteDocument(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('documents', 'readwrite');
    transaction.objectStore('documents').delete(id);
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(new Error('Could not delete this PDF.'));
    };
  });
}
