import { describe, expect, it } from "vitest";
import { normalizeXUsername } from "./x-username";

describe("normalizeXUsername", () => {
  describe("プレーンなユーザー名", () => {
    it("有効なユーザー名をそのまま返す", () => {
      expect(normalizeXUsername("username")).toEqual({
        ok: true,
        value: "username",
      });
    });

    it("英大文字を含むユーザー名を受け付ける", () => {
      expect(normalizeXUsername("UserName123")).toEqual({
        ok: true,
        value: "UserName123",
      });
    });

    it("アンダースコアを含むユーザー名を受け付ける", () => {
      expect(normalizeXUsername("user_name")).toEqual({
        ok: true,
        value: "user_name",
      });
    });

    it("15文字のユーザー名を受け付ける", () => {
      expect(normalizeXUsername("a".repeat(15))).toEqual({
        ok: true,
        value: "a".repeat(15),
      });
    });
  });

  describe("@ プレフィックス", () => {
    it("@ を取り除いてユーザー名を返す", () => {
      expect(normalizeXUsername("@username")).toEqual({
        ok: true,
        value: "username",
      });
    });

    it("@ のみの場合はエラーを返す", () => {
      expect(normalizeXUsername("@")).toEqual({
        ok: false,
        error: expect.any(String),
      });
    });
  });

  describe("x.com URL", () => {
    it("https://x.com/username からユーザー名を抽出する", () => {
      expect(normalizeXUsername("https://x.com/username")).toEqual({
        ok: true,
        value: "username",
      });
    });

    it("https://x.com/@username からユーザー名を抽出する", () => {
      expect(normalizeXUsername("https://x.com/@username")).toEqual({
        ok: true,
        value: "username",
      });
    });

    it("http://x.com/username (http) からユーザー名を抽出する", () => {
      expect(normalizeXUsername("http://x.com/username")).toEqual({
        ok: true,
        value: "username",
      });
    });

    it("https://www.x.com/username (www あり) からユーザー名を抽出する", () => {
      expect(normalizeXUsername("https://www.x.com/username")).toEqual({
        ok: true,
        value: "username",
      });
    });
  });

  describe("twitter.com URL", () => {
    it("https://twitter.com/username からユーザー名を抽出する", () => {
      expect(normalizeXUsername("https://twitter.com/username")).toEqual({
        ok: true,
        value: "username",
      });
    });

    it("https://twitter.com/@username からユーザー名を抽出する", () => {
      expect(normalizeXUsername("https://twitter.com/@username")).toEqual({
        ok: true,
        value: "username",
      });
    });
  });

  describe("バリデーションエラー", () => {
    it("空文字はエラーを返す", () => {
      expect(normalizeXUsername("")).toEqual({
        ok: false,
        error: expect.any(String),
      });
    });

    it("16文字以上はエラーを返す", () => {
      expect(normalizeXUsername("a".repeat(16))).toEqual({
        ok: false,
        error: expect.any(String),
      });
    });

    it("スペースを含む場合はエラーを返す", () => {
      expect(normalizeXUsername("user name")).toEqual({
        ok: false,
        error: expect.any(String),
      });
    });

    it("ハイフンを含む場合はエラーを返す", () => {
      expect(normalizeXUsername("user-name")).toEqual({
        ok: false,
        error: expect.any(String),
      });
    });

    it("x.com 以外のドメインのURLはエラーを返す", () => {
      expect(normalizeXUsername("https://google.com/username")).toEqual({
        ok: false,
        error: expect.any(String),
      });
    });
  });
});
