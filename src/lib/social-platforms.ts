import type { ComponentType } from "react";

import { BlueskyIcon } from "@/components/icons/bluesky-icon";
import { PixivIcon } from "@/components/icons/pixiv-icon";
import { SkebIcon } from "@/components/icons/skeb-icon";
import { XIcon } from "@/components/icons/x-icon";
import { YoutubeIcon } from "@/components/icons/youtube-icon";
import { normalizeInstagramUsername } from "@/lib/utils/instagram-username";
import { normalizePixivUserId } from "@/lib/utils/pixiv-user-id";
import { normalizeSkebUsername } from "@/lib/utils/skeb-username";
import { normalizeXUsername } from "@/lib/utils/x-username";
import { normalizeYoutubeChannel } from "@/lib/utils/youtube-channel";

export interface SocialPlatform {
  /** JSONB のキー名。DB に保存される識別子 */
  key: string;
  label: string;
  /** プロフィール URL を生成する関数。null の場合はリンクなし（テキスト表示のみ） */
  profileUrl: ((value: string) => string) | null;
  /** 入力値を正規化する関数。未定義の場合は trim のみ */
  normalize?: (
    input: string,
  ) => { ok: true; value: string } | { ok: false; error: string };
  placeholder: string;
  icon?: ComponentType<{ className?: string }>;
  /** 公開プロフィールでのボタン背景色（Tailwind クラス） */
  buttonClass?: string;
  /** 編集フォームのアイコンバッジ背景色（Tailwind クラス） */
  iconBoxClass?: string;
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    key: "bluesky", // DBのJSONBキー名（英数字・アンダースコア）
    label: "Bluesky", // 表示名
    profileUrl: (v) => `https://bsky.app/profile/${v}`, // プロフィールURLの生成。null にするとリンクなしのテキスト表示
    normalize: (input) => {
      // 任意: 入力値の正規化。省略時は trim のみ
      const trimmed = input.trim();
      if (!trimmed) return { ok: false, error: "入力してください" };
      return { ok: true, value: trimmed };
    },
    placeholder: "handle.bsky.social", // input の placeholder テキスト
    icon: BlueskyIcon,
    buttonClass: "bg-sky-500 hover:bg-sky-600 active:bg-sky-700",
    iconBoxClass: "bg-sky-500 text-white",
  },
  {
    key: "x",
    label: "X (Twitter)",
    profileUrl: (v) => `https://x.com/${v}`,
    normalize: normalizeXUsername,
    placeholder: "username または https://x.com/username",
    icon: XIcon,
    buttonClass: "bg-black hover:bg-gray-800 active:bg-gray-900",
    iconBoxClass: "bg-black text-white",
  },
  {
    key: "instagram",
    label: "Instagram",
    profileUrl: (v) => `https://instagram.com/${v}`,
    normalize: normalizeInstagramUsername,
    placeholder: "@username または https://instagram.com/username",
    buttonClass:
      "bg-gradient-to-r from-pink-500 via-red-500 to-yellow-400 hover:from-pink-600 hover:via-red-600 hover:to-yellow-500 active:from-pink-700 active:via-red-700 active:to-yellow-600",
    iconBoxClass:
      "bg-gradient-to-br from-pink-500 via-red-500 to-yellow-400 text-white",
  },
  {
    key: "pixiv",
    label: "Pixiv",
    profileUrl: (v) => `https://www.pixiv.net/users/${v}`,
    normalize: normalizePixivUserId,
    placeholder: "12345678 または https://www.pixiv.net/users/12345678",
    icon: PixivIcon,
    buttonClass: "bg-blue-500 hover:bg-blue-600 active:bg-blue-700",
    iconBoxClass: "bg-blue-500 text-white",
  },
  {
    key: "youtube",
    label: "YouTubeチャンネル",
    profileUrl: (v) =>
      v.startsWith("UC")
        ? `https://www.youtube.com/channel/${v}`
        : `https://www.youtube.com/@${v}`,
    normalize: normalizeYoutubeChannel,
    placeholder: "@channelname または https://www.youtube.com/@channelname",
    icon: YoutubeIcon,
    buttonClass: "bg-red-600 hover:bg-red-700 active:bg-red-800",
    iconBoxClass: "bg-red-600 text-white",
  },
  {
    key: "skeb",
    label: "Skeb",
    profileUrl: (v) => `https://skeb.jp/@${v}`,
    normalize: normalizeSkebUsername,
    placeholder: "@username または https://skeb.jp/@username",
    icon: SkebIcon,
    buttonClass: "bg-teal-500 hover:bg-teal-600 active:bg-teal-700",
    iconBoxClass: "bg-teal-500 text-white",
  },
];

/** キーから定義を引く便利関数 */
export function getPlatform(key: string): SocialPlatform | undefined {
  return SOCIAL_PLATFORMS.find((p) => p.key === key);
}
