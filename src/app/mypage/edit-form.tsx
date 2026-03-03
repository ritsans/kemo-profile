"use client";

/**
 * マイページ編集エリアの親コンテナ。
 * 状態管理（保存・差分・離脱保護）と、プレビュー/編集ペインのレイアウトを担当する。
 */
import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  removeSocialLink,
  reorderSocialLinks,
  updateProfile,
} from "@/app/actions/profile";
import type { ProfileUpdateResult } from "@/lib/types/action";
import { AddSocialLinkModal } from "./add-social-link-modal";
import { ProfileEditFields } from "./profile-edit-fields";
import { ProfilePreviewCard } from "./profile-preview-card";

interface ProfileEditFormProps {
  displayName: string;
  bio: string | null;
  socialLinks: Record<string, string>;
  socialLinksOrder: string[] | null;
  avatarUrl: string | null;
  lockedSocialKeys: string[];
}

type ModalState = { type: "add" } | { type: "edit"; key: string } | null;

/** モバイル切り替えタブのスタイル */
function paneTabClass(isActive: boolean): string {
  return `rounded-lg px-3 py-2 transition ${
    isActive ? "bg-white text-gray-900 shadow-sm" : "text-gray-600"
  }`;
}

/** セクションの表示/非表示クラス（モバイル時のペイン切り替え用） */
function paneSectionClass(isVisible: boolean): string {
  return isVisible ? "block" : "hidden lg:block";
}

/** 保存済みの順序 or social_links のキー順でフォールバック */
function buildInitialOrder(
  socialLinks: Record<string, string>,
  savedOrder: string[] | null,
): string[] {
  if (savedOrder && savedOrder.length > 0) {
    // 保存済み順序を優先しつつ、存在しないキーを除外し、新規キーを末尾に追加
    const existing = savedOrder.filter((k) => k in socialLinks);
    const added = Object.keys(socialLinks).filter((k) => !existing.includes(k));
    return [...existing, ...added];
  }
  return Object.keys(socialLinks);
}

export function ProfileEditForm({
  displayName,
  bio,
  socialLinks,
  socialLinksOrder,
  avatarUrl,
  lockedSocialKeys,
}: ProfileEditFormProps) {
  const [basicMode, setBasicMode] = useState<"viewing" | "editing">("viewing");
  const [mobilePane, setMobilePane] = useState<"preview" | "edit">("edit");
  // フォーム内の現在値
  const [currentDisplayName, setCurrentDisplayName] = useState(displayName);
  const [currentBio, setCurrentBio] = useState(bio ?? "");
  const currentDisplayNameRef = useRef(currentDisplayName);
  const currentBioRef = useRef(currentBio);
  const [currentSocialLinks, setCurrentSocialLinks] =
    useState<Record<string, string>>(socialLinks);

  // SNSリンクの表示順序
  const [currentOrder, setCurrentOrder] = useState<string[]>(() =>
    buildInitialOrder(socialLinks, socialLinksOrder),
  );

  // 差分検知用の基準値（最後に保存された値）
  const [savedDisplayName, setSavedDisplayName] = useState(displayName);
  const [savedBio, setSavedBio] = useState(bio ?? "");

  // モーダル状態
  const [modalState, setModalState] = useState<ModalState>(null);

  // 削除処理中のキー
  const [removingKey, setRemovingKey] = useState<string | null>(null);
  const [, startRemoveTransition] = useTransition();
  const [, startReorderTransition] = useTransition();

  const [state, formAction, isPending] = useActionState<
    ProfileUpdateResult | null,
    FormData
  >(updateProfile, null);

  useEffect(() => {
    currentDisplayNameRef.current = currentDisplayName;
  }, [currentDisplayName]);

  useEffect(() => {
    currentBioRef.current = currentBio;
  }, [currentBio]);

  // 保存成功時: 基準値更新＆保存完了メッセージ表示
  useEffect(() => {
    if (!state?.success) return;

    const trimmedName = currentDisplayNameRef.current.trim();
    const trimmedBio = currentBioRef.current.trim();

    setCurrentDisplayName(trimmedName);
    setCurrentBio(trimmedBio);
    setSavedDisplayName(trimmedName);
    setSavedBio(trimmedBio);
    setBasicMode("viewing");
  }, [state]);

  // dirty チェック（social_links, slug は Server Action で個別保存のため除外）
  const isDirty =
    currentDisplayName !== savedDisplayName || currentBio !== savedBio;

  // ブラウザ離脱保護（未保存の場合）
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Basic 編集モードへ切り替え
  function handleEdit() {
    setMobilePane("edit");
    setBasicMode("editing");
  }

  // 編集キャンセル: 未保存変更があれば確認して閲覧モードへ戻す
  function handleCancel() {
    if (
      isDirty &&
      !window.confirm("変更内容が保存されていません。編集を破棄しますか？")
    )
      return;
    setCurrentDisplayName(savedDisplayName);
    setCurrentBio(savedBio);
    setBasicMode("viewing");
  }

  // SNSリンク追加・編集の保存後: ローカル状態を更新してモーダルを閉じる
  function handleSocialLinkSaved(key: string, value: string) {
    setCurrentSocialLinks((prev) => ({ ...prev, [key]: value }));
    // 新規キーはorderの末尾に追加
    setCurrentOrder((prev) => (prev.includes(key) ? prev : [...prev, key]));
    setModalState(null);
  }

  // SNSリンク削除
  function handleRemoveSocialLink(key: string) {
    if (!window.confirm("このSNSリンクを削除しますか？")) return;
    setRemovingKey(key);
    startRemoveTransition(async () => {
      const result = await removeSocialLink(key);
      setRemovingKey(null);
      if (!result.success) {
        window.alert(result.error);
        return;
      }
      setCurrentSocialLinks((prev) => {
        const { [key]: _, ...rest } = prev;
        return rest;
      });
      setCurrentOrder((prev) => prev.filter((k) => k !== key));
    });
  }

  // SNSリンク並び替え
  const handleReorderSocialLinks = useCallback((newOrder: string[]) => {
    setCurrentOrder(newOrder);
    startReorderTransition(async () => {
      await reorderSocialLinks(newOrder);
    });
  }, []);

  const fieldErrors = state && !state.success ? state.fieldErrors : {};
  const previewDisplayName =
    currentDisplayName.trim() || "表示名を入力してください";
  const previewBio = currentBio.trim();

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* モバイル用ペイン切り替えタブ */}
      <div className="rounded-xl bg-gray-100 p-1 lg:hidden">
        <div className="grid grid-cols-2 gap-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => setMobilePane("edit")}
            className={paneTabClass(mobilePane === "edit")}
          >
            編集
          </button>
          <button
            type="button"
            onClick={() => setMobilePane("preview")}
            className={paneTabClass(mobilePane === "preview")}
          >
            プレビュー
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
        <section
          className={`${paneSectionClass(mobilePane === "edit")} min-w-0`}
        >
          <ProfileEditFields
            isPending={isPending}
            formAction={formAction}
            originalDisplayName={savedDisplayName}
            originalBio={savedBio}
            currentDisplayName={currentDisplayName}
            setCurrentDisplayName={setCurrentDisplayName}
            currentBio={currentBio}
            setCurrentBio={setCurrentBio}
            currentSocialLinks={currentSocialLinks}
            socialLinksOrder={currentOrder}
            lockedSocialKeys={lockedSocialKeys}
            onRemoveSocialLink={handleRemoveSocialLink}
            onAddSocialLinkClick={() => setModalState({ type: "add" })}
            onEditSocialLinkClick={(key) =>
              setModalState({ type: "edit", key })
            }
            onReorderSocialLinks={handleReorderSocialLinks}
            fieldErrors={fieldErrors}
            removingKey={removingKey}
            basicMode={basicMode}
            onEdit={handleEdit}
            onCancel={handleCancel}
            avatarUrl={avatarUrl}
          />
        </section>

        <section
          className={`${paneSectionClass(mobilePane === "preview")} min-w-0`}
        >
          <ProfilePreviewCard
            avatarUrl={avatarUrl}
            previewDisplayName={previewDisplayName}
            previewBio={previewBio}
            previewSocialLinks={currentSocialLinks}
            previewSocialLinksOrder={currentOrder}
          />
        </section>
      </div>

      {modalState && (
        <AddSocialLinkModal
          existingKeys={Object.keys(currentSocialLinks)}
          mode={modalState.type}
          initialPlatformKey={
            modalState.type === "edit" ? modalState.key : undefined
          }
          initialValue={
            modalState.type === "edit"
              ? (currentSocialLinks[modalState.key] ?? "")
              : undefined
          }
          onClose={() => setModalState(null)}
          onSaved={handleSocialLinkSaved}
        />
      )}
    </div>
  );
}
