"use client";

import { MoreHorizontalIcon } from "lucide-react";
/**
 * プロフィール編集フォームのフィールド群。
 * 右ペインの入力UIとエラー表示のみを担当する。
 */
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        <SaveStatus saved={savedMessage} dirty={isDirty} />
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
              <Label htmlFor="display_name" className="mb-1">
                Name <span className="text-red-500">*</span>
              </Label>
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
              <Label htmlFor="bio" className="mb-1">
                Bio
              </Label>
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
              <p className="mt-1 text-xs text-gray-400">
                {currentBio.length} / 160
              </p>
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            disabled={isPending || isRemoving}
                            aria-label="メニューを開く"
                          >
                            <MoreHorizontalIcon aria-hidden="true" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => onEditSocialLinkClick(key)}
                          >
                            編集
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => onRemoveSocialLink(key)}
                            disabled={isRemoving}
                          >
                            {isRemoving ? "削除中..." : "削除"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <Button
            type="button"
            variant="link"
            onClick={onAddSocialLinkClick}
            disabled={isPending}
            className="h-auto p-0 text-blue-600 decoration-dashed decoration-blue-400 underline-offset-4"
          >
            <span aria-hidden="true">+</span> リンクを追加
          </Button>
        </div>

        <div className="flex pt-2">
          <Button type="submit" disabled={isPending} className="flex-1">
            {isPending ? "保存中..." : "保存する"}
          </Button>
        </div>
      </form>
    </div>
  );
}

/** 保存状態に応じたステータスメッセージ */
function SaveStatus({ saved, dirty }: { saved: boolean; dirty: boolean }) {
  if (saved) {
    return <p className="text-sm text-green-600">保存しました</p>;
  }
  if (dirty) {
    return <p className="text-sm text-amber-600">未保存の変更があります</p>;
  }
  return <p className="text-sm text-gray-400">保存済み</p>;
}
