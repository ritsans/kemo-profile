/**
 * Server Action の統一戻り値型
 * @template T - 成功時のデータ型（デフォルトは void）
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
