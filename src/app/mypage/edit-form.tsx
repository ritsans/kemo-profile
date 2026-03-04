"use client";

/**
 * マイページ編集エリアの親コンテナ。
 * autosave（1秒debounce）・SNSリンク上下移動・プレビューペインのレイアウトを担当する。
 */
import { useCallback, useRef, useState, useTransition } from "react";
import {
  removeSocialLink,
  reorderSocialLinks,
  updateProfile,
} from "@/app/actions/profile";
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

export type SaveStatus = "idle" | "saving" | "saved" | "error";

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
  const [mobilePane, setMobilePane] = useState<"preview" | "edit">("edit");
  const [currentDisplayName, setCurrentDisplayName] = useState(displayName);
  const [currentBio, setCurrentBio] = useState(bio ?? "");
  const [currentSocialLinks, setCurrentSocialLinks] =
    useState<Record<string, string>>(socialLinks);

  // SNSリンクの表示順序
  const [currentOrder, setCurrentOrder] = useState<string[]>(() =>
    buildInitialOrder(socialLinks, socialLinksOrder),
  );

  // autosave 用
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const savedDisplayNameRef = useRef(displayName);
  const savedBioRef = useRef(bio ?? "");
  const currentDisplayNameRef = useRef(displayName);
  const currentBioRef = useRef(bio ?? "");
  const [, startAutosaveTransition] = useTransition();

  // モーダル状態
  const [modalState, setModalState] = useState<ModalState>(null);

  // 削除処理中のキー
  const [removingKey, setRemovingKey] = useState<string | null>(null);
  const [, startRemoveTransition] = useTransition();
  const [, startReorderTransition] = useTransition();

  function scheduleAutosave(name: string, bio: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startAutosaveTransition(async () => {
        setSaveStatus("saving");
        const fd = new FormData();
        fd.set("display_name", name);
        fd.set("bio", bio);
        fd.set("original_display_name", savedDisplayNameRef.current);
        fd.set("original_bio", savedBioRef.current);
        const result = await updateProfile(null, fd);
        if (result?.success) {
          savedDisplayNameRef.current = name.trim();
          savedBioRef.current = bio.trim();
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 2000);
        } else {
          setSaveStatus("error");
        }
      });
    }, 1000);
  }

  function handleDisplayNameChange(value: string) {
    setCurrentDisplayName(value);
    currentDisplayNameRef.current = value;
    scheduleAutosave(value, currentBioRef.current);
  }

  function handleBioChange(value: string) {
    setCurrentBio(value);
    currentBioRef.current = value;
    scheduleAutosave(currentDisplayNameRef.current, value);
  }

  // SNSリンク上移動
  const handleMoveUp = useCallback(
    (key: string) => {
      const idx = currentOrder.indexOf(key);
      if (idx <= 0) return;

      const next = [...currentOrder];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      setCurrentOrder(next);

      startReorderTransition(async () => {
        await reorderSocialLinks(next);
      });
    },
    [currentOrder],
  );

  // SNSリンク下移動
  const handleMoveDown = useCallback(
    (key: string) => {
      const idx = currentOrder.indexOf(key);
      if (idx < 0 || idx >= currentOrder.length - 1) return;

      const next = [...currentOrder];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      setCurrentOrder(next);

      startReorderTransition(async () => {
        await reorderSocialLinks(next);
      });
    },
    [currentOrder],
  );

  // SNSリンク追加・編集の保存後: ローカル状態を更新してモーダルを閉じる
  function handleSocialLinkSaved(key: string, value: string) {
    setCurrentSocialLinks((prev) => ({ ...prev, [key]: value }));
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
            saveStatus={saveStatus}
            currentDisplayName={currentDisplayName}
            onDisplayNameChange={handleDisplayNameChange}
            currentBio={currentBio}
            onBioChange={handleBioChange}
            currentSocialLinks={currentSocialLinks}
            socialLinksOrder={currentOrder}
            lockedSocialKeys={lockedSocialKeys}
            onRemoveSocialLink={handleRemoveSocialLink}
            onAddSocialLinkClick={() => setModalState({ type: "add" })}
            onEditSocialLinkClick={(key) =>
              setModalState({ type: "edit", key })
            }
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            removingKey={removingKey}
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
