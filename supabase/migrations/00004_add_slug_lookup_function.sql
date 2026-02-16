-- slugでプロフィールを取得する公開関数
-- page.tsx の slug ルーティング（/p/@{slug}）で使用

CREATE OR REPLACE FUNCTION public_get_profile_by_slug(p_slug TEXT)
RETURNS TABLE (
  profile_id TEXT,
  display_name TEXT,
  avatar_url TEXT,
  x_username TEXT,
  bio TEXT,
  slug TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT profile_id, display_name, avatar_url, x_username, bio, slug
  FROM profiles
  WHERE profiles.slug = p_slug;
$$;

GRANT EXECUTE ON FUNCTION public_get_profile_by_slug(TEXT) TO anon, authenticated;
