import Image from "next/image";
import { SOCIAL_PLATFORMS } from "@/lib/social-platforms";

export type ProfileCardViewProps = {
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  socialLinks: Record<string, string>;

  /** bio が空のときガイド文言を表示するか（デフォルト: false） */
  showBioPlaceholder?: boolean;
  /** bio 空時のガイド文言 */
  bioPlaceholderText?: string;
  /** SNS 未設定時の空状態文言を表示するか（デフォルト: false） */
  showSocialEmptyState?: boolean;
  /** SNS 空状態の文言 */
  socialEmptyStateText?: string;

  /** outer card への追加 className */
  className?: string;
  /** アバターサイズ px（デフォルト: 120） */
  avatarSize?: 120 | 96 | 72;
};

export function ProfileCardView({
  displayName,
  bio,
  avatarUrl,
  socialLinks,
  showBioPlaceholder = false,
  bioPlaceholderText = "自己紹介を入力するとここに表示されます",
  showSocialEmptyState = false,
  socialEmptyStateText = "SNSリンクは未設定です",
  className,
  avatarSize = 120,
}: ProfileCardViewProps) {
  const hasSocialLinks = SOCIAL_PLATFORMS.some((p) => socialLinks[p.key]);

  return (
    <div
      className={`rounded-lg bg-white p-8 shadow-lg${className ? ` ${className}` : ""}`}
    >
      {/* アバター */}
      <div className="flex justify-center">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={avatarSize}
            height={avatarSize}
            className="rounded-full object-cover"
            unoptimized={!avatarUrl.startsWith("http")}
          />
        ) : (
          <div
            className="flex items-center justify-center rounded-full bg-gray-200 text-4xl text-gray-400"
            style={{ width: avatarSize, height: avatarSize }}
            data-testid="avatar-fallback"
          >
            👤
          </div>
        )}
      </div>

      {/* 表示名 */}
      <h1 className="mt-6 text-center text-2xl font-bold text-gray-900">
        {displayName}
      </h1>

      {/* bio */}
      {bio ? (
        <p className="mt-3 whitespace-pre-wrap text-center text-sm text-gray-600">
          {bio}
        </p>
      ) : showBioPlaceholder ? (
        <p className="mt-3 text-center text-sm text-gray-400">
          {bioPlaceholderText}
        </p>
      ) : null}

      {/* SNS リンク */}
      {hasSocialLinks ? (
        <div className="mt-8 space-y-3">
          {SOCIAL_PLATFORMS.map((platform) => {
            const value = socialLinks[platform.key];
            if (!value) return null;
            const url = platform.profileUrl?.(value) ?? null;
            const Icon = platform.icon;
            return (
              <div key={platform.key}>
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex w-full items-center justify-center gap-3 rounded-lg px-6 py-4 text-lg font-medium text-white transition ${platform.buttonClass ?? "bg-gray-700 hover:bg-gray-600"}`}
                  >
                    {Icon && <Icon className="h-6 w-6" aria-hidden="true" />}
                    {/* @{value} */}
                    {platform.label} へ移動
                  </a>
                ) : (
                  <p className="text-center text-base font-medium text-gray-700">
                    {value}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : showSocialEmptyState ? (
        <div
          className="mt-8 text-center text-sm text-gray-500"
          data-testid="social-empty-state"
        >
          {socialEmptyStateText}
        </div>
      ) : null}
    </div>
  );
}
