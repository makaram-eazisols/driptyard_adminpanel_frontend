'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function TextPromptDialog({
  open,
  onOpenChange,
  title,
  description,
  value,
  onChange,
  placeholder = '',
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  isLoading = false,
  maxLength = 500,
}) {
  const [localValue, setLocalValue] = useState(value || '');

  useEffect(() => {
    if (open) {
      setLocalValue(value || '');
    }
  }, [open, value]);

  const handleSubmit = () => {
    onChange?.(localValue);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <Textarea
          value={localValue}
          onChange={(event) => setLocalValue(event.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="min-h-[100px]"
          disabled={isLoading}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Processing...' : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TextPromptDialog;
