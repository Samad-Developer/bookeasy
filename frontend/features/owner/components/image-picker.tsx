'use client';

import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { addFiles, ACCEPTED_TYPES, MAX_IMAGE_MB } from '@/features/owner/image-rules';

type Props = {
  files: File[];
  onChange: (files: File[]) => void;
  max: number; // how many photos may still be added
  disabled?: boolean;
  firstIsCover?: boolean; // show the "Cover" label on the first photo
};

// Lets the owner choose photos and shows a preview of each one BEFORE anything is uploaded.
// It does not upload: the screen that uses it decides when to.
export function ImagePicker({ files, onChange, max, disabled, firstIsCover }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hintId = useId(); // a unique id, even when two pickers exist in the page at once
  const [problems, setProblems] = useState<string[]>([]);

  function onChoose(event: ChangeEvent<HTMLInputElement>) {
    const chosen = Array.from(event.target.files ?? []);
    event.target.value = ''; // so choosing the same photo again after removing it still works

    const result = addFiles(files, chosen, max);
    setProblems(result.problems);
    onChange(result.files);
  }

  function remove(index: number) {
    setProblems([]);
    onChange(files.filter((_, position) => position !== index));
  }

  const full = files.length >= max;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          multiple
          disabled={disabled || full}
          onChange={onChoose}
          className="sr-only"
          aria-describedby={hintId}
        />
        <Button type="button" variant="outline" disabled={disabled || full} onClick={() => inputRef.current?.click()}>
          {files.length === 0 ? 'Choose photos' : 'Add more photos'}
        </Button>
        <p id={hintId} className="text-sm text-muted-foreground">
          JPEG, PNG or WebP, up to {MAX_IMAGE_MB} MB each.
          {full ? ' That is the maximum.' : ` You can add ${max === 1 ? '1 more' : `up to ${max}`}.`}
        </p>
      </div>

      {problems.length > 0 && (
        <ul role="alert" className="space-y-1 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {files.map((file, index) => (
            <li key={`${file.name}-${file.size}-${file.lastModified}`} className="space-y-1.5">
              <div className="relative">
                <Preview file={file} />
                {firstIsCover && index === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-background/90 px-2 py-0.5 text-xs font-medium">Cover</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-xs text-muted-foreground" title={file.name}>
                  {file.name}
                </span>
                <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => remove(index)} aria-label={`Remove ${file.name}`}>
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// The browser can show a file it has not uploaded yet through a temporary address (an "object URL").
// It is created when the preview appears and released when it goes away, so the memory is not kept.
function Preview({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the address must be created in an effect so it is released (and, in development, re-created) correctly
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className="aspect-[4/3] w-full rounded-md bg-muted object-cover" />
  ) : (
    <div className="aspect-[4/3] w-full rounded-md bg-muted" />
  );
}