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
  previewSocialLinksOrder?: string[];
  previewSocialLinksComments?: Record<string, string>;
}

export function ProfilePreviewCard({
  avatarUrl,
  previewDisplayName,
  previewBio,
  previewSocialLinks,
  previewSocialLinksOrder,
  previewSocialLinksComments,
}: ProfilePreviewCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 lg:sticky lg:top-20">
      <ProfileCardView
        displayName={previewDisplayName}
        bio={previewBio || null}
        avatarUrl={avatarUrl}
        socialLinks={previewSocialLinks}
        socialLinksOrder={previewSocialLinksOrder}
        socialLinksComments={previewSocialLinksComments}
        showBioPlaceholder={true}
        showSocialEmptyState={true}
        compact={true}
        className="!rounded-none !bg-transparent !p-0 !shadow-none"
      />
    </div>
  );
}
