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
}

export function ProfilePreviewCard({
  avatarUrl,
  previewDisplayName,
  previewBio,
  previewSocialLinks,
  previewSocialLinksOrder,
}: ProfilePreviewCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:sticky lg:top-8">
      <ProfileCardView
        displayName={previewDisplayName}
        bio={previewBio || null}
        avatarUrl={avatarUrl}
        socialLinks={previewSocialLinks}
        socialLinksOrder={previewSocialLinksOrder}
        showBioPlaceholder={true}
        showSocialEmptyState={true}
        compact={true}
        className="rounded-none! bg-transparent! p-0! shadow-none!"
      />
    </div>
  );
}
