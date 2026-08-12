"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { PATHS } from "@/lib/constants";

export default function SignOutButton() {
  return (
    <Button
      variant="destructive"
      onClick={() => signOut({ redirectTo: PATHS.home })}>
      Đăng xuất
    </Button>
  );
}