"use client";

/**
 * プロフィール編集フォームのフィールド群。
 * 右ペインの入力UIとエラー表示のみを担当する。
 */
import { Input, Textarea } from "@/components/ui/input";
import { SOCIAL_PLATFORMS } from "@/lib/social-platforms";

interface ProfileEditFieldsProps {
  savedMessage: boolean;
  isDirty: boolean;
  isPending: boolean;
  formAction: (formData: FormData) => void | Promise<void>;
  originalDisplayName: string;
  originalBio: string;
  originalSocialLinks: Record<string, string>;
  originalSlug: string;
  currentDisplayName: string;
  setCurrentDisplayName: (value: string) => void;
  currentBio: string;
  setCurrentBio: (value: string) => void;
  currentSocialLinks: Record<string, string>;
  setSocialLinkValue: (key: string, value: string) => void;
  currentSlug: string;
  setCurrentSlug: (value: string) => void;
  fieldErrors: Record<string, string>;
  handleReset: () => void;
  lockedSocialKeys: string[];
}

export function ProfileEditFields({
  savedMessage,
  isDirty,
  isPending,
  formAction,
  originalDisplayName,
  originalBio,
  originalSocialLinks,
  originalSlug,
  currentDisplayName,
  setCurrentDisplayName,
  currentBio,
  setCurrentBio,
  currentSocialLinks,
  setSocialLinkValue,
  currentSlug,
  setCurrentSlug,
  fieldErrors,
  handleReset,
  lockedSocialKeys,
}: ProfileEditFieldsProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-gray-900">
          プロフィール編集
        </h2>
        {savedMessage ? (
          <p className="text-sm text-green-600">保存しました</p>
        ) : isDirty ? (
          <p className="text-sm text-amber-600">未保存の変更があります</p>
        ) : (
          <p className="text-sm text-gray-400">保存済み</p>
        )}
      </div>

      <form action={formAction} className="space-y-5">
        <input
          type="hidden"
          name="original_display_name"
          value={originalDisplayName}
        />
        <input type="hidden" name="original_bio" value={originalBio} />
        {SOCIAL_PLATFORMS.map((platform) => (
          <input
            key={platform.key}
            type="hidden"
            name={`original_social_${platform.key}`}
            value={originalSocialLinks[platform.key] ?? ""}
          />
        ))}
        <input type="hidden" name="original_slug" value={originalSlug} />

        <div>
          <label
            htmlFor="display_name"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            表示名 <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            id="display_name"
            name="display_name"
            value={currentDisplayName}
            onChange={(e) => setCurrentDisplayName(e.target.value)}
            required
            maxLength={50}
            disabled={isPending}
          />
          {fieldErrors.display_name && (
            <p className="mt-1 text-sm text-red-600">
              {fieldErrors.display_name}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="bio"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            自己紹介
          </label>
          <Textarea
            id="bio"
            name="bio"
            value={currentBio}
            onChange={(e) => setCurrentBio(e.target.value)}
            maxLength={160}
            rows={3}
            disabled={isPending}
            placeholder="自己紹介を入力してください（160文字以内）"
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

        {SOCIAL_PLATFORMS.map((platform) => {
          const isLocked = lockedSocialKeys.includes(platform.key);
          return (
            <div key={platform.key}>
              <label
                htmlFor={`social_${platform.key}`}
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                {platform.label}
              </label>
              <Input
                type="text"
                id={`social_${platform.key}`}
                name={`social_${platform.key}`}
                value={currentSocialLinks[platform.key] ?? ""}
                onChange={(e) =>
                  setSocialLinkValue(platform.key, e.target.value)
                }
                disabled={isPending || isLocked}
                placeholder={platform.placeholder}
              />
              {isLocked && (
                <p className="mt-1 text-xs text-gray-400">
                  OAuth連携で自動設定されています
                </p>
              )}
              {fieldErrors[`social_${platform.key}`] && (
                <p className="mt-1 text-sm text-red-600">
                  {fieldErrors[`social_${platform.key}`]}
                </p>
              )}
            </div>
          );
        })}

        <div>
          <label
            htmlFor="slug"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            カスタムURL
          </label>
          <Input
            type="text"
            id="slug"
            name="slug"
            value={currentSlug}
            onChange={(e) => setCurrentSlug(e.target.value)}
            maxLength={20}
            disabled={isPending}
            placeholder="my_name"
          />
          <p className="mt-1 text-xs text-gray-400">
            英小文字で始まり、英小文字・数字・アンダースコアのみ、3〜20文字
          </p>
          {fieldErrors.slug && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.slug}</p>
          )}
        </div>

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
            onClick={handleReset}
            className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 disabled:opacity-50"
          >
            リセット
          </button>
        </div>
      </form>
    </div>
  );
}
