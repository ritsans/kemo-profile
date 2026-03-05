"use client";

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPlatform } from "@/lib/social-platforms";
import type { SaveStatus } from "./edit-form";

interface ProfileEditFieldsProps {
  saveStatus: SaveStatus;
  currentDisplayName: string;
  onDisplayNameChange: (value: string) => void;
  currentBio: string;
  onBioChange: (value: string) => void;
  /** 現在登録済みの social_links */
  currentSocialLinks: Record<string, string>;
  /** SNSリンクの表示順序（キーの配列） */
  socialLinksOrder: string[];
  /** ロック済みキー（表示のみ・削除不可） */
  lockedSocialKeys: string[];
  /** + リンクを追加 ボタン押下 */
  onAddSocialLinkClick: () => void;
  /** SNSアイテムタップ（Drawer を開く） */
  onEditSocialLinkClick: (key: string) => void;
  /** 上移動ボタン押下 */
  onMoveUp: (key: string) => void;
  /** 下移動ボタン押下 */
  onMoveDown: (key: string) => void;
}

// ────────────────────────────────────────────────────────
// 各SNSリンク行
// ────────────────────────────────────────────────────────
interface SnsItemProps {
  id: string;
  value: string;
  isLocked: boolean;
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function SnsItem({
  id,
  value,
  isLocked,
  isFirst,
  isLast,
  onEdit,
  onMoveUp,
  onMoveDown,
}: SnsItemProps) {
  const platform = getPlatform(id);
  const Icon = platform?.icon;

  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-3">
      {/* 上下移動ボタン */}
      <div className="flex shrink-0 flex-col gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={isFirst}
          onClick={onMoveUp}
          aria-label="上に移動"
        >
          <ChevronUpIcon className="h-3 w-3" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          disabled={isLast}
          onClick={onMoveDown}
          aria-label="下に移動"
        >
          <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
        </Button>
      </div>

      {/* プラットフォームアイコン + テキスト: タップで Drawer を開く */}
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-3 disabled:opacity-50"
        onClick={onEdit}
        disabled={isLocked}
        aria-label={`${platform?.label}を編集`}
      >
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${platform?.iconBoxClass ?? "border border-border bg-muted text-foreground"}`}
        >
          {Icon ? (
            <Icon className="h-5 w-5" aria-hidden="true" />
          ) : (
            <span className="text-sm font-bold">{platform?.label[0]}</span>
          )}
        </div>

        {/* 2行テキスト */}
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-semibold text-foreground">
            {platform?.label}
          </p>
          <p className="truncate text-xs leading-tight text-muted-foreground">
            {platform?.profileUrl?.(value) ?? value}
            {isLocked && "（OAuth連携）"}
          </p>
        </div>
      </button>
    </li>
  );
}

// ────────────────────────────────────────────────────────
// autosave ステータス表示
// ────────────────────────────────────────────────────────
function SaveStatusLabel({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  if (status === "saving")
    return <span className="text-xs text-muted-foreground">保存中...</span>;
  if (status === "saved")
    return <span className="text-xs text-green-600">保存済み ✓</span>;
  return <span className="text-xs text-destructive">保存に失敗しました</span>;
}

// ────────────────────────────────────────────────────────
// メインコンポーネント
// ────────────────────────────────────────────────────────
export function ProfileEditFields({
  saveStatus,
  currentDisplayName,
  onDisplayNameChange,
  currentBio,
  onBioChange,
  currentSocialLinks,
  socialLinksOrder,
  lockedSocialKeys,
  onAddSocialLinkClick,
  onEditSocialLinkClick,
  onMoveUp,
  onMoveDown,
}: ProfileEditFieldsProps) {
  // socialLinksOrder に含まれるキーのうち currentSocialLinks に存在するものだけ表示
  const orderedKeys = socialLinksOrder.filter((k) => k in currentSocialLinks);

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
      <div className="space-y-5">
        {/* Basic セクション */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Basic
            </p>
            <SaveStatusLabel status={saveStatus} />
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="display_name" className="mb-1">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                type="text"
                id="display_name"
                name="display_name"
                value={currentDisplayName}
                onChange={(e) => onDisplayNameChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.preventDefault();
                }}
                required
                maxLength={50}
              />
            </div>
            <div>
              <Label htmlFor="bio" className="mb-1">
                Bio
              </Label>
              <Textarea
                id="bio"
                name="bio"
                value={currentBio}
                onChange={(e) => onBioChange(e.target.value)}
                maxLength={160}
                rows={3}
                placeholder="自己紹介を入力してください（160文字以内）"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {currentBio.length} / 160
              </p>
            </div>
          </div>
        </div>

        {/* SNS Links セクション */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            SNS Links
          </p>
          {orderedKeys.length === 0 ? (
            <p className="mb-2 text-sm text-muted-foreground">
              SNSリンクはまだ登録されていません
            </p>
          ) : (
            <ul className="mb-3 space-y-2">
              {orderedKeys.map((key, idx) => (
                <SnsItem
                  key={key}
                  id={key}
                  value={currentSocialLinks[key]}
                  isLocked={lockedSocialKeys.includes(key)}
                  isFirst={idx === 0}
                  isLast={idx === orderedKeys.length - 1}
                  onEdit={() => onEditSocialLinkClick(key)}
                  onMoveUp={() => onMoveUp(key)}
                  onMoveDown={() => onMoveDown(key)}
                />
              ))}
            </ul>
          )}
          <Button
            type="button"
            variant="link"
            onClick={onAddSocialLinkClick}
            className="h-auto p-0 text-blue-600 decoration-dashed decoration-blue-400 underline-offset-4"
          >
            <span aria-hidden="true">+</span> リンクを追加
          </Button>
        </div>
      </div>
    </div>
  );
}
