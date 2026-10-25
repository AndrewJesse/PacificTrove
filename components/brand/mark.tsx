import Image from "next/image";
import { cn } from "@/lib/utils";

export function TroveMark({ className }: { className?: string }) {
  return (
    <Image
      alt=""
      className={cn("size-7 rounded-full", className)}
      height={28}
      src="/brand/mark.svg"
      width={28}
    />
  );
}
