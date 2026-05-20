"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/card";
import { register, login, fetchMe } from "@/services/auth.service";
import { fetchSchools, fetchSchoolClasses } from "@/services/school.service";
import { getErrorMessage } from "@/services/api";
import { useAuthStore } from "@/store/auth.store";

export function RegisterForm() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [schoolSlug, setSchoolSlug] = useState("");
  const [classId, setClassId] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");

  const {
    data: schools = [],
    isLoading: schoolsLoading,
    isError: schoolsError,
  } = useQuery({
    queryKey: ["schools"],
    queryFn: fetchSchools,
  });

  const selectedSchool = schools.find((s) => s.slug === schoolSlug);

  const { data: classes = [] } = useQuery({
    queryKey: ["classes", schoolSlug],
    queryFn: () => fetchSchoolClasses(schoolSlug),
    enabled: !!schoolSlug,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      await register({
        email,
        password,
        username,
        school_slug: schoolSlug,
        school_class_id: classId || undefined,
        invite_code: inviteCode || undefined,
      });
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
        <CardTitle className="text-2xl">Регистрация</CardTitle>
        <CardDescription>Выберите школу и подтвердите, что вы в ней учитесь</CardDescription>
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
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Имя пользователя</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ivan_8a"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Пароль</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Школа</label>
            {schoolsLoading ? (
              <p className="text-sm text-muted-foreground py-2">Загрузка школ...</p>
            ) : schoolsError ? (
              <p className="text-sm text-red-500 bg-red-500/10 rounded-2xl px-4 py-2">
                Не удалось загрузить школы. Запущен ли backend на порту 8000?
              </p>
            ) : schools.length === 0 ? (
              <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-2xl px-4 py-3">
                Список школ пуст. В терминале backend выполните:{" "}
                <code className="text-xs block mt-1 bg-muted px-2 py-1 rounded-lg">
                  python manage.py seed_schools
                </code>
              </p>
            ) : null}
            <select
              value={schoolSlug}
              onChange={(e) => {
                setSchoolSlug(e.target.value);
                setClassId("");
              }}
              required
              disabled={schools.length === 0}
              className="flex h-11 w-full rounded-2xl border border-border bg-card px-4 text-sm disabled:opacity-50"
            >
              <option value="">Выберите школу</option>
              {schools.map((s) => (
                <option key={s.id} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          {classes.length > 0 ? (
            <div>
              <label className="text-sm font-medium mb-1.5 block">Класс</label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="flex h-11 w-full rounded-2xl border border-border bg-card px-4 text-sm"
              >
                <option value="">Не выбран</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {selectedSchool?.verification_mode === "invite" ? (
            <div>
              <label className="text-sm font-medium mb-1.5 block">Код школы</label>
              <Input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="WRT-2026"
              />
            </div>
          ) : null}
          {selectedSchool?.verification_mode === "email" ? (
            <p className="text-xs text-muted-foreground rounded-2xl bg-muted p-3">
              Используйте школьный email:{" "}
              {selectedSchool.allowed_email_domains?.join(", ") || "домен школы"}
            </p>
          ) : null}

          <Button type="submit" className="w-full" size="lg" loading={mutation.isPending}>
            Создать аккаунт
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-6">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-accent font-medium hover:underline">
            Войти
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
