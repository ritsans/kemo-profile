-- プロフィールを公開アクセス可能にする
-- 問題: profiles_select_own_policy が所有者のみ閲覧可能になっていた
-- 修正: 誰でも（非ログイン含む）プロフィールを閲覧可能にする

-- 既存の制限的なSELECTポリシーを削除
DROP POLICY IF EXISTS "profiles_select_own_policy" ON profiles;

-- 新しいポリシー: 誰でもプロフィールを閲覧可能
CREATE POLICY "profiles_select_public_policy" ON profiles
  FOR SELECT
  USING (true);
