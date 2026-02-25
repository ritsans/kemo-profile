"use client";

/**
 * プロフィール編集フォームのフィールド群。
 * 右ペインの入力UIとエラー表示のみを担当する。
 */
import { DropdownMenu } from "@/components/ui/dropdown-menu";
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

        {/* Basic セクション */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Basic
          </p>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="display_name"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Name <span className="text-red-500">*</span>
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
                Bio
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
          </div>
        </div>

        {/* SNS Links セクション */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            SNS Links
          </p>
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
                const Icon = platform?.icon;
                return (
                  <li
                    key={key}
                    className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                  >
                    {Icon && (
                      <Icon
                        className="h-4 w-4 shrink-0 text-gray-600"
                        aria-hidden="true"
                      />
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm text-gray-800">
                      @{value}
                      {isLocked && (
                        <span className="ml-1 text-xs text-gray-400">
                          （OAuth連携）
                        </span>
                      )}
                    </span>
                    {!isLocked && (
                      <DropdownMenu
                        disabled={isPending || isRemoving}
                        items={[
                          {
                            label: "編集",
                            onClick: () => onEditSocialLinkClick(key),
                          },
                          {
                            label: isRemoving ? "削除中..." : "削除",
                            variant: "danger",
                            onClick: () => onRemoveSocialLink(key),
                          },
                        ]}
                      />
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
            className="flex items-center gap-1 text-sm text-blue-600 underline decoration-dashed decoration-blue-400 underline-offset-4 hover:text-blue-800 disabled:opacity-40"
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
