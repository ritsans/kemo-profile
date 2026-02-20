"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";
import { updateProfile } from "@/app/actions/profile";
import { XIcon } from "@/components/icons/x-icon";
import type { ProfileUpdateResult } from "@/lib/types/action";

interface ProfileEditFormProps {
  displayName: string;
  bio: string | null;
  xUsername: string | null;
  slug: string | null;
  avatarUrl: string | null;
}

export function ProfileEditForm({
  displayName,
  bio,
  xUsername,
  slug,
  avatarUrl,
}: ProfileEditFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  // フォーム内の現在値（dirty check 用）
  const [currentDisplayName, setCurrentDisplayName] = useState(displayName);
  const [currentBio, setCurrentBio] = useState(bio ?? "");
  const [currentXUsername, setCurrentXUsername] = useState(xUsername ?? "");
  const [currentSlug, setCurrentSlug] = useState(slug ?? "");

  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState<
    ProfileUpdateResult | null,
    FormData
  >(updateProfile, null);

  // 保存成功時: 表示モードへ切り替え＆「保存しました」表示
  useEffect(() => {
    if (state?.success) {
      setIsEditing(false);
      setSavedMessage(true);
      const timer = setTimeout(() => setSavedMessage(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  // dirty チェック: 初期 props と現在値を比較
  const isDirty =
    currentDisplayName !== displayName ||
    currentBio !== (bio ?? "") ||
    currentXUsername !== (xUsername ?? "") ||
    currentSlug !== (slug ?? "");

  // ブラウザ離脱保護（編集中かつ未保存の場合）
  useEffect(() => {
    if (!isEditing || !isDirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isEditing, isDirty]);

  // キャンセルボタン: 未保存変更がある場合は確認ダイアログ
  const handleCancel = () => {
    if (
      isDirty &&
      !window.confirm("保存していない変更があります。破棄しますか？")
    ) {
      return;
    }
    // フォームの値をリセット
    setCurrentDisplayName(displayName);
    setCurrentBio(bio ?? "");
    setCurrentXUsername(xUsername ?? "");
    setCurrentSlug(slug ?? "");
    setIsEditing(false);
  };

  // フィールドエラーの取り出し（型ガード付き）
  const fieldErrors = state && !state.success ? state.fieldErrors : {};

  // --- 表示モード ---
  if (!isEditing) {
    return (
      <div className="relative rounded-lg bg-white p-8 shadow-lg">
        {/* 編集ボタン */}
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="absolute top-4 right-4 rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50"
        >
          編集
        </button>

        {/* 保存完了メッセージ */}
        {savedMessage && (
          <p className="mb-4 text-center text-sm text-green-600">
            保存しました
          </p>
        )}

        {/* アバター */}
        <div className="flex justify-center">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={120}
              height={120}
              className="rounded-full object-cover"
              unoptimized={!avatarUrl.startsWith("http")}
            />
          ) : (
            <div className="flex h-30 w-30 items-center justify-center rounded-full bg-gray-200 text-4xl text-gray-400">
              👤
            </div>
          )}
        </div>

        {/* 表示名 */}
        <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
          {displayName}
        </h2>

        {/* bio */}
        {bio && (
          <p className="mt-3 whitespace-pre-wrap text-center text-sm text-gray-600">
            {bio}
          </p>
        )}

        {/* X リンクボタン */}
        {xUsername ? (
          <div className="mt-8">
            <a
              href={`https://x.com/${xUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-3 rounded-lg bg-black px-6 py-4 text-lg font-medium text-white transition hover:bg-gray-800 active:bg-gray-900"
            >
              <XIcon className="h-6 w-6" />
              X (Twitter) で見る
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

  // --- 編集モード ---
  return (
    <div className="rounded-lg bg-white p-6 shadow-lg">
      {/* アバター（編集不可） */}
      <div className="mb-4 flex flex-col items-center">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={120}
            height={120}
            className="rounded-full object-cover"
            unoptimized={!avatarUrl.startsWith("http")}
          />
        ) : (
          <div className="flex h-30 w-30 items-center justify-center rounded-full bg-gray-200 text-4xl text-gray-400">
            👤
          </div>
        )}
        <p className="mt-2 text-xs text-gray-400">
          ※ アバター変更は今後対応予定
        </p>
      </div>

      <form ref={formRef} action={formAction} className="space-y-5">
        {/* 保存前の元の値（差分検知用） */}
        <input type="hidden" name="original_display_name" value={displayName} />
        <input type="hidden" name="original_bio" value={bio ?? ""} />
        <input type="hidden" name="original_x_username" value={xUsername ?? ""} />
        <input type="hidden" name="original_slug" value={slug ?? ""} />

        {/* 表示名 */}
        <div>
          <label
            htmlFor="display_name"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            表示名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="display_name"
            name="display_name"
            value={currentDisplayName}
            onChange={(e) => setCurrentDisplayName(e.target.value)}
            required
            maxLength={50}
            disabled={isPending}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          />
          {fieldErrors.display_name && (
            <p className="mt-1 text-sm text-red-600">
              {fieldErrors.display_name}
            </p>
          )}
        </div>

        {/* 自己紹介 */}
        <div>
          <label
            htmlFor="bio"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            自己紹介
          </label>
          <textarea
            id="bio"
            name="bio"
            value={currentBio}
            onChange={(e) => setCurrentBio(e.target.value)}
            maxLength={160}
            rows={3}
            disabled={isPending}
            placeholder="自己紹介を入力してください（160文字以内）"
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {currentBio.length} / 160
            </span>
          </div>
          {fieldErrors.bio && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.bio}</p>
          )}
        </div>

        {/* X ユーザー名 */}
        <div>
          <label
            htmlFor="x_username"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            X (Twitter) ユーザー名
          </label>
          <input
            type="text"
            id="x_username"
            name="x_username"
            value={currentXUsername}
            onChange={(e) => setCurrentXUsername(e.target.value)}
            disabled={isPending}
            placeholder="username または https://x.com/username"
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          />
          {fieldErrors.x_username && (
            <p className="mt-1 text-sm text-red-600">
              {fieldErrors.x_username}
            </p>
          )}
        </div>

        {/* カスタム URL */}
        <div>
          <label
            htmlFor="slug"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            カスタムURL
          </label>
          <input
            type="text"
            id="slug"
            name="slug"
            value={currentSlug}
            onChange={(e) => setCurrentSlug(e.target.value)}
            maxLength={20}
            disabled={isPending}
            placeholder="my_name"
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <p className="mt-1 text-xs text-gray-400">
            英小文字で始まり、英小文字・数字・アンダースコアのみ、3〜20文字
          </p>
          {fieldErrors.slug && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.slug}</p>
          )}
        </div>

        {/* ボタン群 */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
          >
            {isPending ? "保存中..." : "保存する"}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={handleCancel}
            className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 disabled:opacity-50"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
