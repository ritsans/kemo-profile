type NormalizeResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

/** YouTube チャンネルハンドルとして有効な文字列パターン（@除く、3〜30文字） */
const HANDLE_REGEX = /^[a-zA-Z0-9_.-]{3,30}$/;

/** YouTube チャンネルIDパターン（UC で始まる24文字） */
const CHANNEL_ID_REGEX = /^UC[a-zA-Z0-9_-]{22}$/;

/** youtube.com の URL からハンドルを抽出するパターン */
const YOUTUBE_HANDLE_URL_REGEX =
  /^https?:\/\/(?:www\.)?youtube\.com\/@([a-zA-Z0-9_.-]{3,30})\/?(?:\?.*)?$/;

/** youtube.com の URL からチャンネルIDを抽出するパターン */
const YOUTUBE_CHANNEL_URL_REGEX =
  /^https?:\/\/(?:www\.)?youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})\/?(?:\?.*)?$/;

/**
 * YouTube チャンネルハンドルまたはチャンネルIDを正規化する
 *
 * 対応する入力形式:
 * - ハンドル: "@channelname" または "channelname"
 * - チャンネルID: "UCxxxxxxxxxxxxxxxxxxxxxxxxx"
 * - ハンドルURL: "https://www.youtube.com/@channelname"
 * - チャンネルIDのURL: "https://www.youtube.com/channel/UCxxxxxxxxxxxxxxxxxxxxxxxxx"
 */
export function normalizeYoutubeChannel(input: string): NormalizeResult {
  const trimmed = input.trim();

  // ハンドル形式のURL
  const handleUrlMatch = YOUTUBE_HANDLE_URL_REGEX.exec(trimmed);
  if (handleUrlMatch) {
    return { ok: true, value: handleUrlMatch[1] };
  }

  // チャンネルID形式のURL
  const channelUrlMatch = YOUTUBE_CHANNEL_URL_REGEX.exec(trimmed);
  if (channelUrlMatch) {
    return { ok: true, value: channelUrlMatch[1] };
  }

  // URL っぽいが対応外ドメインの場合はエラー
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return {
      ok: false,
      error: "youtube.com のURLを入力してください",
    };
  }

  // @ プレフィックスを除去
  const handle = trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;

  // 空文字チェック
  if (handle.length === 0) {
    return { ok: false, error: "チャンネルハンドルを入力してください" };
  }

  // チャンネルID形式（UC で始まる24文字）
  if (CHANNEL_ID_REGEX.test(handle)) {
    return { ok: true, value: handle };
  }

  // 文字数チェック
  if (handle.length < 3) {
    return {
      ok: false,
      error: "YouTubeのチャンネルハンドルは3文字以上で入力してください",
    };
  }

  if (handle.length > 30) {
    return {
      ok: false,
      error: "YouTubeのチャンネルハンドルは30文字以内で入力してください",
    };
  }

  // 使用可能文字チェック
  if (!HANDLE_REGEX.test(handle)) {
    return {
      ok: false,
      error:
        "YouTubeのチャンネルハンドルは英数字・ピリオド・ハイフン・アンダースコアのみ使用できます",
    };
  }

  return { ok: true, value: handle };
}
