"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { login, fetchMe } from "@/services/auth.service";
import { getErrorMessage } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export function LoginForm() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const tokens = await login({ email, password });
      localStorage.setItem("wrt_access", tokens.access);
      localStorage.setItem("wrt_refresh", tokens.refresh);
      return fetchMe();
    },
    onSuccess: (user) => {
      setUser(user);
      router.push("/feed");
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  return (
    <Card className="border-border/60 shadow-soft-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-14 w-14 rounded-3xl bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
          W
        </div>
        <CardTitle className="text-2xl">Вход в {APP_NAME}</CardTitle>
        <CardDescription>{APP_TAGLINE}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError("");
            mutation.mutate();
          }}
        >
          {error ? (
            <p className="text-sm text-red-500 bg-red-500/10 rounded-2xl px-4 py-2">{error}</p>
          ) : null}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.ru"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Пароль</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full" size="lg" loading={mutation.isPending}>
            Войти
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-6">
          Нет аккаунта?{" "}
          <Link href="/register" className="text-accent font-medium hover:underline">
            Зарегистрироваться
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
