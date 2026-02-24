/**
 * Server Action の統一戻り値型
 * @template T - 成功時のデータ型（デフォルトは void）
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * プロフィール一括更新 Server Action の戻り値型
 * フィールドごとのバリデーションエラーを返す
 */
export type ProfileUpdateResult =
  | { success: true }
  | {
      success: false;
      fieldErrors: Partial<
        Record<"display_name" | "bio" | "slug", string> &
          Record<string, string>
      >;
    };
