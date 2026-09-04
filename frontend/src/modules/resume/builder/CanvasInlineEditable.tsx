import React, { useState, useEffect, useRef } from "react";

export interface CanvasInlineEditableProps {
  value?: string | null;
  onChange: (newValue: string) => void;
  isInteractive?: boolean;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  multiline?: boolean;
  tag?: "h1" | "h2" | "h3" | "p" | "span" | "div";
}

export const CanvasInlineEditable: React.FC<CanvasInlineEditableProps> = ({
  value,
  onChange,
  isInteractive = false,
  placeholder = "Click to edit...",
  className = "",
  style,
  multiline = false,
  tag = "span",
}) => {
  const [localVal, setLocalVal] = useState(value || "");
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalVal(value || "");
  }, [value]);

  const Tag = tag as any;

  // Non-interactive mode (e.g. PDF export / static render):
  // Never render placeholders or fake content.
  if (!isInteractive) {
    if (!value || value.trim() === "") {
      return null;
    }
    return (
      <Tag className={className} style={style}>
        {value}
      </Tag>
    );
  }

  const handleBlur = () => {
    setIsEditing(false);
    const trimmed = localVal.trim();
    if (trimmed !== (value || "").trim()) {
      onChange(localVal);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!multiline && e.key === "Enter") {
      e.preventDefault();
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      setLocalVal(value || "");
      setIsEditing(false);
    }
  };

  if (isEditing) {
    if (multiline) {
      return (
        <textarea
          ref={inputRef as any}
          autoFocus
          value={localVal}
          onChange={(e) => setLocalVal(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={Math.max(2, (localVal || "").split("\n").length)}
          className={`w-full min-w-0 bg-blue-50/50 dark:bg-blue-950/20 text-inherit font-inherit leading-inherit tracking-inherit rounded-xs border-b-2 border-primary outline-none p-1 transition-all resize-y box-border ${className}`}
          style={{ boxSizing: "border-box", ...style }}
        />
      );
    }

    return (
      <input
        ref={inputRef as any}
        autoFocus
        type="text"
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full min-w-0 max-w-full bg-blue-50/50 dark:bg-blue-950/20 text-inherit font-inherit leading-inherit tracking-inherit rounded-xs border-b-2 border-primary outline-none px-0.5 py-0 box-border transition-all ${className}`}
        style={{ width: "100%", boxSizing: "border-box", ...style }}
      />
    );
  }

  const hasValue = Boolean(value && value.trim().length > 0);

  if (!hasValue) {
    const cleanPlaceholder = placeholder.startsWith("+")
      ? placeholder.slice(1).trim()
      : placeholder;

    return (
      <Tag
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
        className={`cursor-pointer inline-flex items-center text-slate-400 hover:text-primary hover:bg-primary/5 rounded px-1 py-0.5 text-[0.88em] font-normal italic transition-colors border border-dashed border-slate-300/80 dark:border-slate-700/80 print:hidden ${className}`}
        style={{ boxSizing: "border-box", ...style }}
        title={`Click to add ${cleanPlaceholder}`}
      >
        + {cleanPlaceholder}
      </Tag>
    );
  }

  return (
    <Tag
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      className={`cursor-text hover:bg-blue-500/10 hover:outline-dashed hover:outline-1 hover:outline-blue-500/50 rounded-xs transition-colors group/inline relative break-words ${className}`}
      style={{ boxSizing: "border-box", overflowWrap: "break-word", wordBreak: "normal", ...style }}
      title="Click to edit directly on canvas"
    >
      {value}
    </Tag>
  );
};

export default React.memo(CanvasInlineEditable);
