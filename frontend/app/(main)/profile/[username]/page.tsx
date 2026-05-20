"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Avatar } from "@/ui/avatar";
import { Badge } from "@/ui/badge";
import { useAuthStore } from "@/store/auth.store";

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const user = useAuthStore((s) => s.user);
  const isOwn = user?.profile?.username === username;

  const display = isOwn ? user?.profile : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar
            name={display?.username ?? username}
            src={display?.avatar}
            size="lg"
          />
          <div>
            <CardTitle>@{username}</CardTitle>
            {display?.class_name ? <Badge className="mt-1">{display.class_name}</Badge> : null}
            {display?.school_name ? (
              <p className="text-sm text-muted-foreground mt-1">{display.school_name}</p>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm mb-4">
            {display?.bio || "Био пока пустое — настройка профиля в следующих этапах."}
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat label="Посты" value={display?.posts_count ?? 0} />
            <Stat label="Очки" value={display?.total_points ?? 0} />
            <Stat label="Лайки" value={display?.likes_received ?? 0} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-muted p-3">
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
