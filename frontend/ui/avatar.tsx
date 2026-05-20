import { cn } from "@/lib/utils";
import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const sizes = { sm: 32, md: 40, lg: 56 };
  const px = sizes[size];
  const initials = name.slice(0, 2).toUpperCase();

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={px}
        height={px}
        className={cn("rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div
      style={{ width: px, height: px }}
      className={cn(
        "flex items-center justify-center rounded-full bg-accent/20 text-accent font-semibold text-sm",
        className
      )}
    >
      {initials}
    </div>
  );
}
