"use client";

import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ShareSectionProps {
  profileUrl: string;
}

/**
 * QRコードアイコン
 */
function QrCodeIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <path d="M14 14h3v3h-3zM17 17h3v3h-3zM14 20h3" />
    </svg>
  );
}

/**
 * 共有アイコン
 */
function ShareIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

/**
 * プロフィール共有セクション
 * QRコード表示・URLコピー・Web Share APIによる共有手段を提供する
 */
export function ShareSection({ profileUrl }: ShareSectionProps) {
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // URLをクリップボードにコピー
  const handleCopy = async () => {
    await navigator.clipboard.writeText(profileUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Web Share API で共有
  const handleShare = async () => {
    await navigator.share({ url: profileUrl, title: "プロフィール" });
  };

  // Web Share API 対応チェック
  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  return (
    <>
      {/* セクションヘッダ */}
      <h2 className="mb-4 text-lg font-semibold text-gray-900">
        公開プロフィールを共有する
      </h2>

      {/* QRコード表示ボタン */}
      <Button
        type="button"
        onClick={() => setIsQrModalOpen(true)}
        className="w-full"
      >
        <QrCodeIcon />
        QRコードを表示
      </Button>

      {/* URLコピーリンク */}
      <div className="mt-3 text-center">
        <Button type="button" variant="link" onClick={handleCopy}>
          {isCopied ? "コピーしました!" : "URLをコピー"}
        </Button>
      </div>

      {/* QRモーダル */}
      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
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
              {isCopied ? "コピーしました!" : "URLをコピー"}
            </Button>

            {canShare && (
              <Button
                type="button"
                variant="outline"
                onClick={handleShare}
                className="w-full"
              >
                <ShareIcon />
                共有
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
