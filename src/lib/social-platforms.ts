import type { ComponentType } from "react";

import { XIcon } from "@/components/icons/x-icon";
import { normalizeXUsername } from "@/lib/utils/x-username";

export interface SocialPlatform {
  /** JSONB のキー名。DB に保存される識別子 */
  key: string;
  /** UI に表示するプラットフォーム名 */
  label: string;
  /** プロフィール URL を生成する関数。null の場合はリンクなし（テキスト表示のみ） */
  profileUrl: ((value: string) => string) | null;
  /** 入力値を正規化する関数。未定義の場合は trim のみ */
  normalize?: (
    input: string,
  ) => { ok: true; value: string } | { ok: false; error: string };
  /** プレースホルダーテキスト */
  placeholder: string;
  /** アイコンコンポーネント（省略可） */
  icon?: ComponentType<{ className?: string }>;
  /** 公開プロフィールでのボタン背景色（Tailwind クラス） */
  buttonClass?: string;
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    key: "x",
    label: "X (Twitter)",
    profileUrl: (v) => `https://x.com/${v}`,
    normalize: normalizeXUsername,
    placeholder: "username または https://x.com/username",
    icon: XIcon,
    buttonClass: "bg-black hover:bg-gray-800 active:bg-gray-900",
  },
];

/** キーから定義を引く便利関数 */
export function getPlatform(key: string): SocialPlatform | undefined {
  return SOCIAL_PLATFORMS.find((p) => p.key === key);
}
