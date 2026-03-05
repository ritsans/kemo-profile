import Image from "next/image";
import { SOCIAL_PLATFORMS } from "@/lib/social-platforms";

const SIZE = {
  default: {
    avatar: 120,
    avatarEmoji: "text-4xl",
    title: "mt-6 text-2xl",
    bio: "mt-3 text-sm",
    socialSection: "mt-8 space-y-3",
    button: "gap-3 px-6 py-4 text-lg",
    buttonIcon: "h-6 w-6",
    plainValue: "text-base",
    emptyState: "mt-8 text-sm",
  },
  compact: {
    avatar: 72,
    avatarEmoji: "text-2xl",
    title: "mt-3 text-base",
    bio: "mt-2 text-xs",
    socialSection: "mt-4 space-y-2",
    button: "gap-2 px-4 py-2 text-sm",
    buttonIcon: "h-4 w-4",
    plainValue: "text-sm",
    emptyState: "mt-4 text-xs",
  },
} as const;

export type ProfileCardViewProps = {
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  socialLinks: Record<string, string>;
  /** SNSリンクの表示順序（未指定時は socialLinks のキー順） */
  socialLinksOrder?: string[];
  /** SNSリンクへのひとことコメント */
  socialLinksComments?: Record<string, string>;

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
  /** プレビューペイン用コンパクト表示（デフォルト: false） */
  compact?: boolean;
};

export function ProfileCardView({
  displayName,
  bio,
  avatarUrl,
  socialLinks,
  socialLinksOrder,
  socialLinksComments,
  showBioPlaceholder = false,
  bioPlaceholderText = "自己紹介を入力するとここに表示されます",
  showSocialEmptyState = false,
  socialEmptyStateText = "SNSリンクは未設定です",
  className,
  compact = false,
}: ProfileCardViewProps) {
  // 表示順序: socialLinksOrder が指定されていればその順、なければ SOCIAL_PLATFORMS の定義順
  const orderedPlatforms = socialLinksOrder
    ? socialLinksOrder
        .filter((k) => socialLinks[k])
        .map((k) => SOCIAL_PLATFORMS.find((p) => p.key === k))
        .filter((p): p is (typeof SOCIAL_PLATFORMS)[number] => p !== undefined)
    : SOCIAL_PLATFORMS.filter((p) => socialLinks[p.key]);

  const hasSocialLinks = orderedPlatforms.length > 0;
  const s = SIZE[compact ? "compact" : "default"];

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
            width={s.avatar}
            height={s.avatar}
            className="rounded-full object-cover"
            unoptimized={!avatarUrl.startsWith("http")}
          />
        ) : (
          <div
            className={`flex items-center justify-center rounded-full bg-gray-200 text-gray-400 ${s.avatarEmoji}`}
            style={{ width: s.avatar, height: s.avatar }}
            data-testid="avatar-fallback"
          >
            👤
          </div>
        )}
      </div>

      {/* 表示名 */}
      <h1 className={`text-center font-bold text-gray-900 ${s.title}`}>
        {displayName}
      </h1>

      {/* bio */}
      {bio ? (
        <p className={`whitespace-pre-wrap text-center text-gray-600 ${s.bio}`}>
          {bio}
        </p>
      ) : showBioPlaceholder ? (
        <p className={`text-center text-gray-400 ${s.bio}`}>
          {bioPlaceholderText}
        </p>
      ) : null}

      {/* SNS リンク */}
      {hasSocialLinks ? (
        <div className={s.socialSection}>
          {orderedPlatforms.map((platform) => {
            const value = socialLinks[platform.key];
            if (!value) return null;
            const url = platform.profileUrl?.(value) ?? null;
            const Icon = platform.icon;
            const comment = socialLinksComments?.[platform.key];
            return (
              <div key={platform.key}>
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex w-full items-center justify-center rounded-lg font-medium text-white transition ${platform.buttonClass ?? "bg-gray-700 hover:bg-gray-600"} ${s.button}`}
                  >
                    {Icon && (
                      <Icon className={s.buttonIcon} aria-hidden="true" />
                    )}
                    {platform.label} へ移動
                  </a>
                ) : (
                  <p
                    className={`text-center font-medium text-gray-700 ${s.plainValue}`}
                  >
                    {value}
                  </p>
                )}
                {comment && (
                  <p className="mt-1 text-center text-xs text-gray-500">
                    {comment}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : showSocialEmptyState ? (
        <div
          className={`text-center text-gray-500 ${s.emptyState}`}
          data-testid="social-empty-state"
        >
          {socialEmptyStateText}
        </div>
      ) : null}
    </div>
  );
}
