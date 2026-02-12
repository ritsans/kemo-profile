import type { User } from "@supabase/supabase-js";

/**
 * ユーザー情報から slug の初期値候補を生成
 * - OAuth: user_name や preferred_username を参照
 * - Email: @ 以前の文字列を参照
 * - slug の形式に合わない場合は空文字を返す
 */
export function generateSuggestedSlug(user: User): string {
  let candidate = "";

  // OAuth メタデータから取得
  if (user.user_metadata) {
    // X (Twitter) OAuth: user_name
    if (user.user_metadata.user_name) {
      candidate = user.user_metadata.user_name;
    }
    // Google OAuth: preferred_username (通常はメールアドレス形式)
    else if (user.user_metadata.preferred_username) {
      candidate = user.user_metadata.preferred_username.split("@")[0];
    }
    // 汎用: name をフォールバック
    else if (user.user_metadata.name) {
      candidate = user.user_metadata.name;
    }
  }

  // メールアドレスから取得（OAuth で取得できなかった場合）
  if (!candidate && user.email) {
    candidate = user.email.split("@")[0];
  }

  // サニタイズ: slug の形式に合わせる
  return sanitizeSlug(candidate);
}

/**
 * 文字列を slug の形式にサニタイズ
 * - 小文字化
 * - 英数字とアンダースコア以外を除去（またはアンダースコアに変換）
 * - 英小文字で始まることを確認
 * - 3-20文字に調整
 */
function sanitizeSlug(input: string): string {
  if (!input) return "";

  // 小文字化
  let slug = input.toLowerCase();

  // スペースやハイフンをアンダースコアに変換
  slug = slug.replace(/[\s-]+/g, "_");

  // 英数字とアンダースコア以外を除去
  slug = slug.replace(/[^a-z0-9_]/g, "");

  // 先頭が数字やアンダースコアの場合は除去
  slug = slug.replace(/^[^a-z]+/, "");

  // 3文字未満または20文字超の場合は空文字
  if (slug.length < 3 || slug.length > 20) {
    return "";
  }

  return slug;
}
