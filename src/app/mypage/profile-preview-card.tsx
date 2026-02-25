"use client";

/**
 * プロフィールのプレビュー表示コンポーネント。
 * 入力中の値を受け取り、公開プロフィールの見た目を左ペインに描画する。
 */
import { ProfileCardView } from "@/components/profile/profile-card-view";

interface ProfilePreviewCardProps {
  avatarUrl: string | null;
  previewDisplayName: string;
  previewBio: string;
  previewSocialLinks: Record<string, string>;
  previewPath: string;
}

export function ProfilePreviewCard({
  avatarUrl,
  previewDisplayName,
  previewBio,
  previewSocialLinks,
  previewPath,
}: ProfilePreviewCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:sticky lg:top-8">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">
          プロフィールプレビュー
        </h2>
        <a
          href={previewPath}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
        >
          公開ページで確認
        </a>
      </div>

      <ProfileCardView
        displayName={previewDisplayName}
        bio={previewBio || null}
        avatarUrl={avatarUrl}
        socialLinks={previewSocialLinks}
        showBioPlaceholder={true}
        showSocialEmptyState={true}
        className="!rounded-none !bg-transparent !p-0 !shadow-none"
      />
    </div>
  );
}
