"use client";

import { useActionState } from "react";
import {
  updateBio,
  updateDisplayName,
  updateSlug,
} from "@/app/actions/profile";
import type { ActionResult } from "@/lib/types/action";

interface ProfileEditFormProps {
  displayName: string;
  bio: string | null;
  slug: string | null;
}

export function ProfileEditForm({
  displayName,
  bio,
  slug,
}: ProfileEditFormProps) {
  const [displayNameState, displayNameAction, isDisplayNamePending] =
    useActionState<ActionResult | null, FormData>(updateDisplayName, null);

  const [bioState, bioAction, isBioPending] = useActionState<
    ActionResult | null,
    FormData
  >(updateBio, null);

  const [slugState, slugAction, isSlugPending] = useActionState<
    ActionResult | null,
    FormData
  >(updateSlug, null);

  return (
    <>
      {/* 表示名変更フォーム */}
      <form action={displayNameAction} className="mb-6">
        <label
          htmlFor="display_name"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          表示名
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            id="display_name"
            name="display_name"
            defaultValue={displayName}
            required
            maxLength={50}
            disabled={isDisplayNamePending}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={isDisplayNamePending}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
          >
            {isDisplayNamePending ? "保存中..." : "保存"}
          </button>
        </div>
        {displayNameState && !displayNameState.success && (
          <p className="mt-2 text-sm text-red-600">{displayNameState.error}</p>
        )}
        {displayNameState?.success && (
          <p className="mt-2 text-sm text-green-600">保存しました</p>
        )}
      </form>

      {/* 自己紹介変更フォーム */}
      <form action={bioAction} className="mb-6">
        <label
          htmlFor="bio"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          自己紹介
        </label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={bio ?? ""}
          maxLength={160}
          rows={3}
          disabled={isBioPending}
          placeholder="自己紹介を入力してください（160文字以内）"
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
        />
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {bio?.length ?? 0} / 160
          </span>
          <button
            type="submit"
            disabled={isBioPending}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
          >
            {isBioPending ? "保存中..." : "保存"}
          </button>
        </div>
        {bioState && !bioState.success && (
          <p className="mt-2 text-sm text-red-600">{bioState.error}</p>
        )}
        {bioState?.success && (
          <p className="mt-2 text-sm text-green-600">保存しました</p>
        )}
      </form>

      {/* カスタムURL変更フォーム */}
      <form action={slugAction} className="mb-6">
        <label
          htmlFor="slug"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          カスタムURL
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            id="slug"
            name="slug"
            defaultValue={slug ?? ""}
            maxLength={20}
            disabled={isSlugPending}
            placeholder="my_name"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={isSlugPending}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
          >
            {isSlugPending ? "保存中..." : "保存"}
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-400">
          英小文字で始まり、英小文字・数字・アンダースコアのみ、3〜20文字
        </p>
        {slugState && !slugState.success && (
          <p className="mt-2 text-sm text-red-600">{slugState.error}</p>
        )}
        {slugState?.success && (
          <p className="mt-2 text-sm text-green-600">保存しました</p>
        )}
      </form>
    </>
  );
}
