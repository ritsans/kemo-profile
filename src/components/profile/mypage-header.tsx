"use client";

import { LogOut, Menu } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MypageHeader() {
  return (
    <header className="sticky top-0 z-30 border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <span className="text-lg font-bold text-gray-900">マイページ</span>

        {/* モバイル: ハンバーガーメニュー */}
        <div className="sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="メニューを開く">
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => {
                  logout();
                }}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                ログアウト
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* PC: インラインボタン */}
        <div className="hidden sm:block">
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
              ログアウト
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
