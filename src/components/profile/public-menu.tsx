"use client";

import { Check, Copy, Menu, QrCode, Share2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PublicMenuProps {
  profileUrl: string;
}

/**
 * 公開プロフィールページ用ハンバーガーメニュー
 * QRコード表示・URLコピー・Web Share を提供する
 * 画面右上に固定配置（fixed）
 */
export function PublicMenu({ profileUrl }: PublicMenuProps) {
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // URLをクリップボードにコピー
  const handleCopy = async () => {
    await navigator.clipboard.writeText(profileUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Web Share API で共有
  const handleShare = async () => {
    try {
      await navigator.share({ url: profileUrl, title: "プロフィール" });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return; // ユーザーが共有をキャンセル — 正常動作
      }
      console.error("Share failed:", error);
    }
  };

  // Web Share API 対応チェック
  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  return (
    <>
      {/* 右上固定のハンバーガーメニューボタン */}
      <div className="fixed top-4 right-4 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="メニューを開く"
              className="bg-white/80 shadow-sm backdrop-blur-sm hover:bg-white"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* QRコード表示 */}
            <DropdownMenuItem onSelect={() => setIsQrOpen(true)}>
              <QrCode className="mr-2 h-4 w-4" aria-hidden="true" />
              QRコードを表示
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* QRコードダイアログ */}
      <Dialog open={isQrOpen} onOpenChange={setIsQrOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>QRコード</DialogTitle>
          </DialogHeader>

          <div className="flex justify-center">
            <QRCodeSVG value={profileUrl} size={256} />
          </div>

          <p className="break-all text-center text-sm text-gray-500">
            {profileUrl}
          </p>

          <div className="flex flex-col gap-2">
            <Button type="button" onClick={handleCopy} className="w-full">
              {isCopied ? (
                <>
                  <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                  コピーしました!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
                  URLをコピー
                </>
              )}
            </Button>

            {canShare && (
              <Button
                type="button"
                variant="outline"
                onClick={handleShare}
                className="w-full"
              >
                <Share2 className="mr-2 h-4 w-4" aria-hidden="true" />
                共有
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
