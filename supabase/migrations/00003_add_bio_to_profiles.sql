-- profiles テーブルに bio（自己紹介）カラムを追加
ALTER TABLE profiles ADD COLUMN bio TEXT;

-- 返り値の型が変わるため、既存関数をDROPしてから再作成
DROP FUNCTION IF EXISTS public_get_profile(TEXT);

CREATE FUNCTION public_get_profile(p_profile_id TEXT)
RETURNS TABLE (
  profile_id TEXT,
  display_name TEXT,
  avatar_url TEXT,
  x_username TEXT,
  bio TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT profile_id, display_name, avatar_url, x_username, bio
  FROM profiles
  WHERE profile_id = p_profile_id;
$$;

GRANT EXECUTE ON FUNCTION public_get_profile(TEXT) TO anon, authenticated;
