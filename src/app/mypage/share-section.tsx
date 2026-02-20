"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

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
 * ×閉じるアイコン
 */
function CloseIcon() {
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
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

  // Escキーでモーダルを閉じる
  useEffect(() => {
    if (!isQrModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsQrModalOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isQrModalOpen]);

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
        <button
          type="button"
          onClick={() => setIsQrModalOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <QrCodeIcon />
          QRコードを表示
        </button>

        {/* URLコピーリンク */}
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={handleCopy}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {isCopied ? "コピーしました!" : "URLをコピー"}
          </button>
        </div>

      {/* QRモーダル */}
      {isQrModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="QRコード"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* バックドロップ（クリックで閉じる）*/}
          <button
            type="button"
            className="fixed inset-0 bg-black/60"
            onClick={() => setIsQrModalOpen(false)}
            aria-label="モーダルを閉じる"
          />

          {/* 中央カード */}
          <div className="relative z-10 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            {/* ×閉じるボタン */}
            <button
              type="button"
              onClick={() => setIsQrModalOpen(false)}
              className="absolute right-3 top-3 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="閉じる"
            >
              <CloseIcon />
            </button>

            {/* QRコード */}
            <div className="flex justify-center">
              <QRCodeSVG value={profileUrl} size={256} />
            </div>

            {/* プロフィールURL表示 */}
            <p className="mt-4 break-all text-center text-sm text-gray-500">
              {profileUrl}
            </p>

            {/* ボタン群 */}
            <div className="mt-4 flex flex-col gap-2">
              {/* URLをコピーボタン */}
              <button
                type="button"
                onClick={handleCopy}
                className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {isCopied ? "コピーしました!" : "URLをコピー"}
              </button>

              {/* Web Share API 対応時のみ表示 */}
              {canShare && (
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <ShareIcon />
                  共有
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
