"use client";

/**
 * プロフィール編集フォームのフィールド群。
 * 右ペインの入力UIとエラー表示のみを担当する。
 */
import { Input, Textarea } from "@/components/ui/input";
import { getPlatform } from "@/lib/social-platforms";

interface ProfileEditFieldsProps {
  savedMessage: boolean;
  isDirty: boolean;
  isPending: boolean;
  formAction: (formData: FormData) => void | Promise<void>;
  originalDisplayName: string;
  originalBio: string;
  currentDisplayName: string;
  setCurrentDisplayName: (value: string) => void;
  currentBio: string;
  setCurrentBio: (value: string) => void;
  /** 現在登録済みの social_links */
  currentSocialLinks: Record<string, string>;
  /** ロック済みキー（表示のみ・削除不可） */
  lockedSocialKeys: string[];
  /** 削除ボタン押下 */
  onRemoveSocialLink: (key: string) => void;
  /** + リンクを追加 ボタン押下 */
  onAddSocialLinkClick: () => void;
  /** 編集ボタン押下 */
  onEditSocialLinkClick: (key: string) => void;
  fieldErrors: Partial<Record<string, string>>;
  /** 削除処理中のキー（削除ボタンを無効化） */
  removingKey: string | null;
}

export function ProfileEditFields({
  savedMessage,
  isDirty,
  isPending,
  formAction,
  originalDisplayName,
  originalBio,
  currentDisplayName,
  setCurrentDisplayName,
  currentBio,
  setCurrentBio,
  currentSocialLinks,
  lockedSocialKeys,
  onRemoveSocialLink,
  onAddSocialLinkClick,
  onEditSocialLinkClick,
  fieldErrors,
  removingKey,
}: ProfileEditFieldsProps) {
  const registeredEntries = Object.entries(currentSocialLinks);

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

        {/* SNSリンク一覧 */}
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">SNSリンク</p>
          {registeredEntries.length === 0 ? (
            <p className="mb-2 text-sm text-gray-400">
              SNSリンクはまだ登録されていません
            </p>
          ) : (
            <ul className="mb-3 space-y-2">
              {registeredEntries.map(([key, value]) => {
                const platform = getPlatform(key);
                const isLocked = lockedSocialKeys.includes(key);
                const isRemoving = removingKey === key;
                return (
                  <li
                    key={key}
                    className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-500">
                        {platform?.label ?? key}
                        {isLocked && (
                          <span className="ml-1 text-gray-400">
                            （OAuth連携）
                          </span>
                        )}
                      </p>
                      <p className="truncate text-sm text-gray-800">{value}</p>
                    </div>
                    {!isLocked && (
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => onEditSocialLinkClick(key)}
                          disabled={isPending || isRemoving}
                          className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-40"
                        >
                          編集
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveSocialLink(key)}
                          disabled={isPending || isRemoving}
                          className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40"
                        >
                          {isRemoving ? "削除中..." : "削除"}
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <button
            type="button"
            onClick={onAddSocialLinkClick}
            disabled={isPending}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-40"
          >
            <span aria-hidden="true">+</span> リンクを追加
          </button>
        </div>

        <div className="flex pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
          >
            {isPending ? "保存中..." : "保存する"}
          </button>
        </div>
      </form>
    </div>
  );
}
