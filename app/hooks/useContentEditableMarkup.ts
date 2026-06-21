'use client';

import { useCallback, useEffect, useRef } from 'react';
import { COLORS } from '@/app/lib/constants';
import {
  applyMarkupCommand,
  canonicalMarkup,
  insertBubbleLineBreak,
  markupToHtml,
  splitMarkupAtSelection,
  syncMarkupFromEditor,
} from '@/app/lib/markup-editor-core';
import { splitMessageParagraphs } from '@/app/lib/split-message-paragraphs';

interface UseContentEditableMarkupOptions {
  value: string;
  onChange: (value: string) => void;
  highlightColor?: string;
  autoFocus?: boolean;
  onParagraphBreak?: (parts: { before: string; after: string }) => void;
  onSplitParagraphs?: (parts: string[]) => void;
}

const MAX_UNDO = 100;

function placeCaretAtEnd(editor: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(editor);
  range.collapse(false);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

function isEditorFocused(editor: HTMLElement | null): boolean {
  if (!editor) return false;
  if (document.activeElement === editor) return true;
  return editor.contains(document.activeElement);
}

export function useContentEditableMarkup({
  value,
  onChange,
  highlightColor = COLORS.highlight,
  autoFocus = false,
  onParagraphBreak,
  onSplitParagraphs,
}: UseContentEditableMarkupOptions) {
  const editorRef = useRef<HTMLDivElement>(null);
  const lastValueRef = useRef(value);
  const didAutoFocusRef = useRef(false);
  const enterSyncTicketRef = useRef(0);
  const pendingParaBreakRef = useRef(false);
  const undoStackRef = useRef<string[]>([]);
  const redoStackRef = useRef<string[]>([]);
  const isApplyingHistoryRef = useRef(false);
  const composingRef = useRef(false);
  const historyShortcutRef = useRef<'undo' | 'redo' | null>(null);

  const resetHistory = useCallback((markup: string) => {
    undoStackRef.current = [];
    redoStackRef.current = [];
    lastValueRef.current = canonicalMarkup(markup);
  }, []);

  const applyHistoryValue = useCallback(
    (markup: string) => {
      const editor = editorRef.current;
      if (!editor) return;

      isApplyingHistoryRef.current = true;
      const canon = canonicalMarkup(markup);
      editor.innerHTML = markupToHtml(canon, highlightColor);
      lastValueRef.current = canon;
      onChange(canon);
      editor.focus();
      placeCaretAtEnd(editor);
      requestAnimationFrame(() => {
        isApplyingHistoryRef.current = false;
      });
    },
    [highlightColor, onChange],
  );

  const pushUndoSnapshot = useCallback(() => {
    if (isApplyingHistoryRef.current || composingRef.current) return;

    const snap = canonicalMarkup(lastValueRef.current);
    const stack = undoStackRef.current;
    if (stack.length > 0 && stack[stack.length - 1] === snap) return;

    stack.push(snap);
    if (stack.length > MAX_UNDO) stack.shift();
    redoStackRef.current = [];
  }, []);

  const commitChange = useCallback(
    (next: string) => {
      const canon = canonicalMarkup(next);
      lastValueRef.current = canon;
      onChange(canon);
    },
    [onChange],
  );

  const undo = useCallback(() => {
    const previous = undoStackRef.current.pop();
    if (previous === undefined) return;

    redoStackRef.current.push(canonicalMarkup(lastValueRef.current));
    applyHistoryValue(previous);
  }, [applyHistoryValue]);

  const redo = useCallback(() => {
    const next = redoStackRef.current.pop();
    if (next === undefined) return;

    undoStackRef.current.push(canonicalMarkup(lastValueRef.current));
    applyHistoryValue(next);
  }, [applyHistoryValue]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (isEditorFocused(editor)) return;

    const canon = canonicalMarkup(value);
    if (canon === lastValueRef.current) return;

    try {
      if (canonicalMarkup(syncMarkupFromEditor(editor, highlightColor)) === canon) {
        lastValueRef.current = canon;
        return;
      }
    } catch {
      // apply external value below
    }

    editor.innerHTML = markupToHtml(value, highlightColor);
    resetHistory(value);
    pendingParaBreakRef.current = false;
  }, [value, highlightColor, resetHistory]);

  useEffect(() => {
    if (!autoFocus || didAutoFocusRef.current) return;
    const editor = editorRef.current;
    if (!editor) return;

    didAutoFocusRef.current = true;
    editor.innerHTML = markupToHtml(value, highlightColor);
    resetHistory(value);
    editor.focus();
    placeCaretAtEnd(editor);
  }, [autoFocus, highlightColor, resetHistory, value]);

  const syncValue = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || isApplyingHistoryRef.current || composingRef.current) return;

    const next = syncMarkupFromEditor(editor, highlightColor);
    const canon = canonicalMarkup(next);
    if (canon === canonicalMarkup(lastValueRef.current)) return;

    pushUndoSnapshot();
    commitChange(next);
  }, [commitChange, highlightColor, pushUndoSnapshot]);

  const pushSyncedChange = useCallback(
    (next: string) => {
      commitChange(next);
    },
    [commitChange],
  );

  const scheduleEnterSync = useCallback(() => {
    const ticket = ++enterSyncTicketRef.current;
    requestAnimationFrame(() => {
      if (ticket !== enterSyncTicketRef.current) return;
      syncValue();
    });
  }, [syncValue]);

  const handleBeforeInput = useCallback(
    (event: React.FormEvent<HTMLDivElement>) => {
      if (isApplyingHistoryRef.current) return;

      const inputEvent = event.nativeEvent as InputEvent;
      const inputType = inputEvent.inputType ?? '';

      if (inputType === 'historyUndo') {
        event.preventDefault();
        if (historyShortcutRef.current === 'undo') return;
        undo();
        return;
      }
      if (inputType === 'historyRedo') {
        event.preventDefault();
        if (historyShortcutRef.current === 'redo') return;
        redo();
        return;
      }
    },
    [redo, undo],
  );

  const handleCompositionStart = useCallback(() => {
    composingRef.current = true;
    pushUndoSnapshot();
  }, [pushUndoSnapshot]);

  const handleCompositionEnd = useCallback(() => {
    composingRef.current = false;
    syncValue();
  }, [syncValue]);

  const handlePaste = useCallback(() => {
    pendingParaBreakRef.current = false;
    pushUndoSnapshot();
    requestAnimationFrame(() => {
      const editor = editorRef.current;
      if (!editor) return;
      const next = syncMarkupFromEditor(editor, highlightColor);

      if (onSplitParagraphs) {
        const parts = splitMessageParagraphs(next);
        if (parts && parts.length > 1) {
          onSplitParagraphs(parts);
          return;
        }
      }

      commitChange(next);
    });
  }, [commitChange, highlightColor, onSplitParagraphs, pushUndoSnapshot]);

  const handleKeyDownCapture = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod) return;

      const key = event.key.toLowerCase();
      if (key !== 'z' && key !== 'y') return;

      event.preventDefault();
      event.stopPropagation();

      const isRedo = key === 'y' || (key === 'z' && event.shiftKey);
      historyShortcutRef.current = isRedo ? 'redo' : 'undo';
      if (isRedo) redo();
      else undo();
      queueMicrotask(() => {
        historyShortcutRef.current = null;
      });
    },
    [redo, undo],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const editor = editorRef.current;
      if (!editor) return;

      const mod = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (mod && (key === 'z' || key === 'y')) return;

      if (mod && key === 'b') {
        event.preventDefault();
        pushUndoSnapshot();
        applyMarkupCommand(editor, 'bold', highlightColor, pushSyncedChange);
        return;
      }

      if (mod && key === 'h') {
        event.preventDefault();
        pushUndoSnapshot();
        applyMarkupCommand(editor, 'highlight', highlightColor, pushSyncedChange);
        return;
      }

      const native = event.nativeEvent;

      if (event.key !== 'Enter') {
        pendingParaBreakRef.current = false;
      }

      if (event.key === 'Enter' && !native.isComposing) {
        event.preventDefault();

        if (onParagraphBreak && pendingParaBreakRef.current) {
          enterSyncTicketRef.current += 1;
          pendingParaBreakRef.current = false;
          pushUndoSnapshot();

          const { before, after } = splitMarkupAtSelection(editor, highlightColor);
          lastValueRef.current = canonicalMarkup(before.replace(/\n+$/, ''));
          onParagraphBreak({
            before: before.replace(/\n+$/, ''),
            after: after.replace(/^\n+/, ''),
          });
          return;
        }

        insertBubbleLineBreak(editor);
        pendingParaBreakRef.current = Boolean(onParagraphBreak);
        scheduleEnterSync();
      }
    },
    [
      highlightColor,
      onParagraphBreak,
      pushSyncedChange,
      pushUndoSnapshot,
      scheduleEnterSync,
    ],
  );

  return {
    editorRef,
    syncValue,
    handleKeyDown,
    handleKeyDownCapture,
    handleBeforeInput,
    handleCompositionStart,
    handleCompositionEnd,
    handlePaste,
    pushUndoSnapshot,
  };
}
