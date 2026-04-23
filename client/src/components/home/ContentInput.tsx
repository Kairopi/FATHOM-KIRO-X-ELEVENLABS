import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';

interface ContentInputProps {
  onFocusChange?: (focused: boolean) => void;
}

export function ContentInput({ onFocusChange }: ContentInputProps) {
  const content = useStore((s) => s.content);
  const setContent = useStore((s) => s.setContent);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const dragCounterRef = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounterRef.current++;
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragOver(false);
    dragCounterRef.current = 0;
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    const file = files[0];

    // Check size
    if (file.size > 5 * 1024 * 1024) {
      setIsShaking(true);
      toast.error('File too large. Maximum 5MB.');
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    // Accept text-based files
    const textExtensions = ['.txt', '.md', '.csv', '.json', '.xml', '.html', '.htm', '.rtf', '.log'];
    const textTypes = ['text/', 'application/json', 'application/xml'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const isTextFile = textExtensions.includes(ext) || textTypes.some(t => file.type.startsWith(t));

    if (!isTextFile) {
      setIsShaking(true);
      toast.error('Unsupported file. Try .txt, .md, or paste text directly.');
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      let text = event.target?.result;
      if (typeof text === 'string') {
        if (text.length > 50000) {
          text = text.substring(0, 50000);
          toast('Content trimmed to 50,000 characters for best results.', { duration: 5000 });
        }
        setContent(text);
        toast.success(`Loaded ${file.name}`);
      }
    };
    reader.onerror = () => toast.error('Failed to read file');
    reader.readAsText(file);
  }, [setContent]);

  return (
    <motion.div
      className="relative"
      animate={isShaking ? { x: [0, -6, 6, -4, 4, 0] } : {}}
      transition={isShaking ? { duration: 0.4 } : {}}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onFocus={() => onFocusChange?.(true)}
        onBlur={() => onFocusChange?.(false)}
        placeholder="Paste an article, essay, lecture notes, or any text..."
        rows={2}
        aria-label="Content input"
        className={cn(
          'w-full resize-none px-5 py-4 text-[15px] leading-[1.65]',
          'bg-transparent text-[var(--text-primary)]',
          'placeholder:text-[var(--text-muted)] placeholder:leading-[1.65]',
          'focus:outline-none',
          isDragOver && 'ring-2 ring-inset ring-[var(--accent-primary)] rounded-xl'
        )}
      />
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center rounded-xl pointer-events-none"
            style={{ backgroundColor: 'rgba(139, 92, 246, 0.05)' }}
          >
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--accent-hover)]">
              <FileText className="w-4 h-4" strokeWidth={2} />
              Drop a text file here
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
