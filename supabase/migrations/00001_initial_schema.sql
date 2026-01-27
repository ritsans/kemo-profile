-- kemono-profile 初期スキーマ
-- プロフィールとブックマークのテーブルを作成

-- ===========================
-- profiles テーブル
-- ===========================
-- 公開プロフィール（デジタル名刺）を格納
CREATE TABLE profiles (
  profile_id TEXT PRIMARY KEY,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  x_username TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- owner_user_id にユニークインデックス（1ユーザー1プロフィール）
CREATE UNIQUE INDEX profiles_owner_user_id_idx ON profiles(owner_user_id);

-- profile_id の検索用インデックス
CREATE INDEX profiles_profile_id_idx ON profiles(profile_id);

-- ===========================
-- bookmarks テーブル
-- ===========================
-- ユーザーがお気に入り登録したプロフィール
CREATE TABLE bookmarks (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id TEXT NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- (user_id, profile_id) の組み合わせにユニーク制約
CREATE UNIQUE INDEX bookmarks_user_profile_idx ON bookmarks(user_id, profile_id);

-- 論理削除されていないブックマークを高速に取得するためのインデックス
CREATE INDEX bookmarks_user_id_active_idx ON bookmarks(user_id) WHERE deleted_at IS NULL;

-- ===========================
-- RLS (Row Level Security) 設定
-- ===========================

-- profiles テーブルのRLS有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- プロフィール所有者のみが自分のプロフィールを閲覧可能
CREATE POLICY "profiles_select_own_policy" ON profiles
  FOR SELECT
  USING (auth.uid() = owner_user_id);

-- プロフィール所有者のみが自分のプロフィールを更新可能
CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE
  USING (auth.uid() = owner_user_id);

-- プロフィール所有者のみが自分のプロフィールを削除可能
CREATE POLICY "profiles_delete_policy" ON profiles
  FOR DELETE
  USING (auth.uid() = owner_user_id);

-- 認証済みユーザーのみがプロフィールを作成可能
CREATE POLICY "profiles_insert_policy" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

-- bookmarks テーブルのRLS有効化
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のブックマークのみ閲覧可能
CREATE POLICY "bookmarks_select_policy" ON bookmarks
  FOR SELECT
  USING (auth.uid() = user_id);

-- ユーザーは自分のブックマークのみ作成可能
CREATE POLICY "bookmarks_insert_policy" ON bookmarks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分のブックマークのみ更新可能（論理削除用）
CREATE POLICY "bookmarks_update_policy" ON bookmarks
  FOR UPDATE
  USING (auth.uid() = user_id);

-- ユーザーは自分のブックマークのみ削除可能
CREATE POLICY "bookmarks_delete_policy" ON bookmarks
  FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================
-- 公開プロフィール取得関数
-- ===========================

-- 公開用の最小カラムのみ返す（owner_user_idは非公開）
CREATE OR REPLACE FUNCTION public_get_profile(p_profile_id TEXT)
RETURNS TABLE (
  profile_id TEXT,
  display_name TEXT,
  avatar_url TEXT,
  x_username TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT profile_id, display_name, avatar_url, x_username
  FROM profiles
  WHERE profile_id = p_profile_id;
$$;

GRANT EXECUTE ON FUNCTION public_get_profile(TEXT) TO anon, authenticated;

-- ===========================
-- updated_at 自動更新トリガー
-- ===========================

-- 汎用的な updated_at 更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- profiles テーブルの updated_at 自動更新トリガー
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- bookmarks テーブルの updated_at 自動更新トリガー
CREATE TRIGGER update_bookmarks_updated_at
  BEFORE UPDATE ON bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
