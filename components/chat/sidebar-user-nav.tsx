"use client";

import { ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import type { User } from "next-auth";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";
import { toast as sonnerToast } from "sonner";
import { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { getChatHistoryPaginationKey } from "@/components/chat/sidebar-history";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { unlimitedUsageLabel } from "@/lib/billing/usage-label";
import { guestRegex } from "@/lib/constants";
import { LoaderIcon } from "./icons";
import { toast } from "./toast";

type UsageBody = {
  minimumMicro?: number | null;
  plan?: string | null;
  spendMicro?: number;
  status?: string | null;
};

function emailToHue(email: string): number {
  let hash = 0;
  for (const char of email) {
    hash = char.charCodeAt(0) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

export function SidebarUserNav({ user }: { user: User }) {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { data, status } = useSession();
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

  const isGuest = guestRegex.test(data?.user?.email ?? "");
  const [usageLabel, setUsageLabel] = useState("");
  const [hasPlan, setHasPlan] = useState(false);
  const handleThemeSelect = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  const loadUsage = useCallback(() => {
    if (status !== "authenticated" || isGuest) {
      setUsageLabel("");
      setHasPlan(false);
      return;
    }
    fetch("/api/billing/usage")
      .then((response) => (response.ok ? response.json() : null))
      .then((body: UsageBody | null) => {
        setUsageLabel(
          unlimitedUsageLabel({
            plan: body?.plan ?? null,
            spendMicro:
              typeof body?.spendMicro === "number" ? body.spendMicro : null,
            status: body?.status ?? null,
          })
        );
        const open = body?.status === "active" || body?.status === "trialing";
        setHasPlan(Boolean(open));
      })
      .catch(() => undefined);
  }, [isGuest, status]);

  useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  const handleMenuOpen = useCallback(
    (open: boolean) => {
      if (open) {
        loadUsage();
      }
    },
    [loadUsage]
  );

  const openSubscribe = useCallback(() => {
    router.push("/subscribe");
  }, [router]);

  const openDeleteAll = useCallback(() => {
    setShowDeleteAll(true);
  }, []);

  const deleteAllChats = useCallback(() => {
    setShowDeleteAll(false);
    router.replace("/");
    mutate(unstable_serialize(getChatHistoryPaginationKey), [], {
      revalidate: false,
    });
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/history`, {
      method: "DELETE",
    });
    sonnerToast.success("All chats deleted");
  }, [mutate, router]);

  const handleAuthClick = useCallback(() => {
    if (status === "loading") {
      toast({
        description: "Checking authentication status, please try again!",
        type: "error",
      });

      return;
    }

    if (isGuest) {
      router.push("/login");
    } else {
      signOut({
        redirectTo: "/",
      });
    }
  }, [isGuest, router, status]);

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu onOpenChange={handleMenuOpen}>
            <DropdownMenuTrigger asChild>
              {status === "loading" ? (
                <SidebarMenuButton className="h-10 justify-between rounded-lg bg-transparent text-sidebar-foreground/50 transition-colors duration-150 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                  <div className="flex flex-row items-center gap-2">
                    <div className="size-6 animate-pulse rounded-full bg-sidebar-foreground/10" />
                    <span className="animate-pulse rounded-md bg-sidebar-foreground/10 text-transparent text-[13px]">
                      Loading...
                    </span>
                  </div>
                  <div className="animate-spin text-sidebar-foreground/50">
                    <LoaderIcon />
                  </div>
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton
                  className="h-8 px-2 rounded-lg bg-transparent text-sidebar-foreground/70 transition-colors duration-150 hover:text-sidebar-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  data-testid="user-nav-button"
                >
                  <div
                    className="size-5 shrink-0 rounded-full ring-1 ring-sidebar-border/50"
                    style={{
                      background: `linear-gradient(135deg, oklch(0.35 0.08 ${emailToHue(user.email ?? "")}), oklch(0.25 0.05 ${emailToHue(user.email ?? "") + 40}))`,
                    }}
                  />
                  <span
                    className="truncate text-[13px]"
                    data-testid="user-email"
                  >
                    {isGuest ? "Guest" : user?.email}
                  </span>
                  <ChevronUp className="ml-auto size-3.5 text-sidebar-foreground/50" />
                </SidebarMenuButton>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-64 rounded-lg border border-border/60 bg-card/95 backdrop-blur-xl shadow-[var(--shadow-float)]"
              data-testid="user-nav-menu"
              side="top"
            >
              <DropdownMenuItem
                className="cursor-pointer text-[13px]"
                data-testid="user-nav-item-theme"
                onSelect={handleThemeSelect}
              >
                {`Toggle ${resolvedTheme === "light" ? "dark" : "light"} mode`}
              </DropdownMenuItem>
              {usageLabel ? (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-[13px] text-muted-foreground">
                    {usageLabel}
                  </div>
                </>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-[13px]"
                onSelect={openSubscribe}
              >
                {hasPlan ? "Manage plan" : "Subscribe"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-[13px] text-destructive focus:text-destructive"
                onSelect={openDeleteAll}
              >
                Delete all chats
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild data-testid="user-nav-item-auth">
                <button
                  className="w-full cursor-pointer text-[13px]"
                  onClick={handleAuthClick}
                  type="button"
                >
                  {isGuest ? "Login to your account" : "Sign out"}
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      <AlertDialog onOpenChange={setShowDeleteAll} open={showDeleteAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all chats?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes every saved chat on this account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteAllChats}>
              Delete all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
