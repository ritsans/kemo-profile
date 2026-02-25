"use client";

import { useEffect, useRef, useState } from "react";

export interface DropdownMenuItemDef {
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
}

interface DropdownMenuProps {
  items: DropdownMenuItemDef[];
  disabled?: boolean;
}

/**
 * 「…」ボタンを押すとアイテムリストを表示する小型ドロップダウン。
 * メニュー外クリックで自動的に閉じる。
 */
export function DropdownMenu({ items, disabled }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-label="メニューを開く"
        className="flex h-7 w-7 items-center justify-center rounded text-gray-500 hover:bg-gray-200 disabled:opacity-40"
      >
        <span
          aria-hidden="true"
          className="text-base leading-none tracking-widest"
        >
          ···
        </span>
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 min-w-[96px] rounded-md border border-gray-200 bg-white py-1 shadow-md">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
              className={`block w-full px-4 py-2 text-left text-sm ${
                item.variant === "danger"
                  ? "text-red-600 hover:bg-red-50"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
