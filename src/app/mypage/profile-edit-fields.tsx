"use client";

import type { DragEndEvent } from "@dnd-kit/core";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon, MoreHorizontalIcon } from "lucide-react";
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
  /** SNSリンクの表示順序（キーの配列） */
  socialLinksOrder: string[];
  /** ロック済みキー（表示のみ・削除不可） */
  lockedSocialKeys: string[];
  /** 削除ボタン押下 */
  onRemoveSocialLink: (key: string) => void;
  /** + リンクを追加 ボタン押下 */
  onAddSocialLinkClick: () => void;
  /** 編集ボタン押下 */
  onEditSocialLinkClick: (key: string) => void;
  /** 並び替え確定時 */
  onReorderSocialLinks: (newOrder: string[]) => void;
  fieldErrors: Partial<Record<string, string>>;
  /** 削除処理中のキー（削除ボタンを無効化） */
  removingKey: string | null;
}

// ────────────────────────────────────────────────────────
// 各SNSリンク行（Sortable Item）
// ────────────────────────────────────────────────────────
interface SortableSnsItemProps {
  id: string;
  value: string;
  isLocked: boolean;
  isRemoving: boolean;
  isPending: boolean;
  onEdit: () => void;
  onRemove: () => void;
}

function SortableSnsItem({
  id,
  value,
  isLocked,
  isRemoving,
  isPending,
  onEdit,
  onRemove,
}: SortableSnsItemProps) {
  const platform = getPlatform(id);
  const Icon = platform?.icon;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-3"
    >
      {/* ドラッグハンドル */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="flex h-8 w-5 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
        aria-label="ドラッグして並び替え"
      >
        <GripVerticalIcon className="h-4 w-4" aria-hidden="true" />
      </button>

      {/* プラットフォームアイコンボックス */}
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
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {platform?.label}
        </p>
        <p className="truncate text-xs leading-tight text-muted-foreground">
          {platform?.profileUrl?.(value) ?? value}
          {isLocked && "（OAuth連携）"}
        </p>
      </div>

      {/* メニュー */}
      <div className="flex shrink-0 items-center gap-1">
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
              <DropdownMenuItem onClick={onEdit}>編集</DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={onRemove}
                disabled={isRemoving}
              >
                {isRemoving ? "削除中..." : "削除"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </li>
  );
}

// ────────────────────────────────────────────────────────
// メインコンポーネント
// ────────────────────────────────────────────────────────
export function ProfileEditFields({
  isPending,
  formAction,
  originalDisplayName,
  originalBio,
  currentDisplayName,
  setCurrentDisplayName,
  currentBio,
  setCurrentBio,
  currentSocialLinks,
  socialLinksOrder,
  lockedSocialKeys,
  onRemoveSocialLink,
  onAddSocialLinkClick,
  onEditSocialLinkClick,
  onReorderSocialLinks,
  fieldErrors,
  removingKey,
}: ProfileEditFieldsProps) {
  // socialLinksOrder に含まれるキーのうち currentSocialLinks に存在するものだけ表示
  const orderedKeys = socialLinksOrder.filter((k) => k in currentSocialLinks);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedKeys.indexOf(active.id as string);
    const newIndex = orderedKeys.indexOf(over.id as string);
    const newOrder = arrayMove(orderedKeys, oldIndex, newIndex);
    onReorderSocialLinks(newOrder);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
      <form action={formAction} className="space-y-5">
        <input
          type="hidden"
          name="original_display_name"
          value={originalDisplayName}
        />
        <input type="hidden" name="original_bio" value={originalBio} />

        {/* Basic セクション */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Basic
          </p>
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
                onChange={(e) => setCurrentDisplayName(e.target.value)}
                required
                maxLength={50}
                disabled={isPending}
              />
              {fieldErrors.display_name && (
                <p className="mt-1 text-sm text-destructive">
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
              <p className="mt-1 text-xs text-muted-foreground">
                {currentBio.length} / 160
              </p>
              {fieldErrors.bio && (
                <p className="mt-1 text-sm text-destructive">
                  {fieldErrors.bio}
                </p>
              )}
            </div>
          </div>

          <div className="flex pt-4">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? "保存中..." : "保存する"}
            </Button>
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
            <DndContext
              id="sns-links-sortable"
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={orderedKeys}
                strategy={verticalListSortingStrategy}
              >
                <ul className="mb-3 space-y-2">
                  {orderedKeys.map((key) => (
                    <SortableSnsItem
                      key={key}
                      id={key}
                      value={currentSocialLinks[key]}
                      isLocked={lockedSocialKeys.includes(key)}
                      isRemoving={removingKey === key}
                      isPending={isPending}
                      onEdit={() => onEditSocialLinkClick(key)}
                      onRemove={() => onRemoveSocialLink(key)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
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
      </form>
    </div>
  );
}
