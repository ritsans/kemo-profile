"use client";

/**
 * プロフィールのプレビュー表示コンポーネント。
 * 入力中の値を受け取り、公開プロフィールの見た目を左ペインに描画する。
 */
import Image from "next/image";
import { XIcon } from "@/components/icons/x-icon";

interface ProfilePreviewCardProps {
  avatarUrl: string | null;
  previewDisplayName: string;
  previewBio: string;
  normalizedPreviewXUsername: string | null;
  previewPath: string;
}

export function ProfilePreviewCard({
  avatarUrl,
  previewDisplayName,
  previewBio,
  normalizedPreviewXUsername,
  previewPath,
}: ProfilePreviewCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:sticky lg:top-8">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">
          プロフィールプレビュー
        </h2>
        <a
          href={previewPath}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
        >
          公開ページで確認
        </a>
      </div>

      <div className="flex justify-center">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={previewDisplayName}
            width={120}
            height={120}
            className="rounded-full object-cover"
            unoptimized={!avatarUrl.startsWith("http")}
          />
        ) : (
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gray-200 text-4xl text-gray-400">
            👤
          </div>
        )}
      </div>

      <h3 className="mt-6 text-center text-2xl font-bold text-gray-900">
        {previewDisplayName}
      </h3>

      {previewBio ? (
        <p className="mt-3 whitespace-pre-wrap text-center text-sm text-gray-600">
          {previewBio}
        </p>
      ) : (
        <p className="mt-3 text-center text-sm text-gray-400">
          自己紹介を入力するとここに表示されます
        </p>
      )}

      {normalizedPreviewXUsername ? (
        <div className="mt-8">
          <p className="mb-2 text-center text-sm text-gray-500">
            @{normalizedPreviewXUsername}
          </p>
          <a
            href={`https://x.com/${normalizedPreviewXUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-black px-6 py-4 text-lg font-medium text-white transition hover:bg-gray-800 active:bg-gray-900"
          >
            <XIcon className="h-6 w-6" />X (Twitter) へ移動
          </a>
        </div>
      ) : (
        <div className="mt-8 text-center text-sm text-gray-500">
          SNSリンクは未設定です
        </div>
      )}
    </div>
  );
}
