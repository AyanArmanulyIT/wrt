"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  banUser,
  fetchAdminUsers,
  unbanUser,
  updateUser,
  verifyUser,
} from "@/services/admin.service";
import { fetchSchools, fetchSchoolClasses } from "@/services/school.service";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { BadgeCheck, Pencil, CheckCircle2, XCircle } from "lucide-react";
import type { AdminUser } from "@/services/admin.service";

function EditUserModal({
  user,
  onClose,
  onSave,
  saving,
}: {
  user: AdminUser;
  onClose: () => void;
  onSave: (data: Record<string, any>) => void;
  saving: boolean;
}) {
  const [firstName, setFirstName] = useState(user.first_name || "");
  const [lastName, setLastName] = useState(user.last_name || "");
  const [username, setUsername] = useState(user.username || "");
  const [bio, setBio] = useState(user.bio || "");
  const [schoolSlug, setSchoolSlug] = useState("");
  const [classId, setClassId] = useState("");

  const { data: schools = [] } = useQuery({
    queryKey: ["schools"],
    queryFn: fetchSchools,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["classes", schoolSlug],
    queryFn: () => fetchSchoolClasses(schoolSlug),
    enabled: !!schoolSlug,
  });

  const handleSave = () => {
    const data: Record<string, any> = {};

    // Всегда отправляем поля, даже если пустые
    data.first_name = firstName || "";
    data.last_name = lastName || "";
    data.bio = bio || "";

    if (username !== user.username) {
      data.username = username;
    }

    // Если выбран новый slug школы — отправляем его
    if (schoolSlug) {
      data.school_slug = schoolSlug;
      // Если выбран и класс — отправляем его UUID
      if (classId) {
        data.school_class_id = classId;
      } else {
        // Если школу меняем, а класс не выбран — сбрасываем класс
        data.school_class_id = null;
      }
    }

    onSave(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 space-y-4 mx-4">
        <h2 className="text-lg font-bold">Редактировать @{user.username}</h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Имя</label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Фамилия</label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Username</label>
          <Input value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Био</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full h-20 rounded-xl border border-border bg-card px-4 py-2 text-sm resize-none"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Школа</label>
          <select
            value={schoolSlug}
            onChange={(e) => {
              setSchoolSlug(e.target.value);
              setClassId("");
            }}
            className="flex h-11 w-full rounded-2xl border border-border bg-card px-4 text-sm"
          >
            <option value="">Не менять</option>
            {schools.map((s) => (
              <option key={s.id} value={s.slug}>
                {s.name}{s.city ? ` (${s.city})` : ""}
              </option>
            ))}
          </select>
        </div>

        {schoolSlug && (
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Класс</label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="flex h-11 w-full rounded-2xl border border-border bg-card px-4 text-sm"
            >
              <option value="">Без класса</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button variant="primary" loading={saving} onClick={handleSave}>
            Сохранить
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AdminUsersPanel() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users", search, status],
    queryFn: () => fetchAdminUsers({ search: search || undefined, status: status || undefined }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    queryClient.clear();
  };

  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const banMutation = useMutation({
    mutationFn: (id: string) => banUser(id, "Нарушение правил"),
    onSuccess: () => { invalidate(); showToast("success", "Пользователь забанен"); },
  });

  const unbanMutation = useMutation({
    mutationFn: unbanUser,
    onSuccess: () => { invalidate(); showToast("success", "Пользователь разбанен"); },
  });

  const verifyMutation = useMutation({
    mutationFn: verifyUser,
    onSuccess: () => { invalidate(); showToast("success", "Галочка выдана ✓"); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) => updateUser(id, data),
    onSuccess: () => {
      invalidate();
      setEditingUser(null);
      showToast("success", "Профиль обновлён");
    },
    onError: (err) => {
      showToast("error", "Ошибка: " + ((err as any)?.response?.data?.error || (err as any)?.message));
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Пользователи</h1>
        <p className="text-gray-500 text-sm mt-1">Модерация, верификация и редактирование профилей</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Поиск email / username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs bg-white/5 border-white/10 text-gray-100"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-11 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-gray-200"
        >
          <option value="">Все</option>
          <option value="pending">На проверке</option>
          <option value="banned">Заблокированные</option>
        </select>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-soft-lg text-sm font-medium animate-in slide-in-from-right ${
          toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
          {toast.message}
        </div>
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={(data) => updateMutation.mutate({ id: editingUser.id, data })}
          saving={updateMutation.isPending}
        />
      )}

      <div className="rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-gray-400 text-left">
            <tr>
              <th className="p-3 font-medium">Пользователь</th>
              <th className="p-3 font-medium">Школа</th>
              <th className="p-3 font-medium">Статус</th>
              <th className="p-3 font-medium text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">Загрузка...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">Нет пользователей</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="p-3">
                    <p className="font-medium">@{u.username}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                    {(u.first_name || u.last_name) && (
                      <p className="text-xs text-gray-400 mt-0.5">{u.first_name} {u.last_name}</p>
                    )}
                  </td>
                  <td className="p-3 text-gray-400">{u.school_name ?? "—"}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {u.is_banned ? (
                        <span className="text-red-400 text-xs font-medium">Заблокирован</span>
                      ) : u.is_verified ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-green-300">
                          <BadgeCheck className="h-4 w-4" /> Верифицирован
                        </span>
                      ) : (
                        <span className="text-amber-400 text-xs font-medium">Не верифицирован</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2 flex-wrap">
                      <Button size="sm" variant="ghost" className="text-gray-300" onClick={() => setEditingUser(u)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {!u.is_verified && !u.is_banned && (
                        <Button size="sm" variant="secondary" className="!bg-foreground/10 !text-foreground border border-foreground/20" loading={verifyMutation.isPending} onClick={() => verifyMutation.mutate(u.id)}>
                          <BadgeCheck className="h-4 w-4 mr-1" /> Дать галочку
                        </Button>
                      )}
                      {u.is_banned ? (
                        <Button size="sm" variant="ghost" className="text-gray-300" loading={unbanMutation.isPending} onClick={() => unbanMutation.mutate(u.id)}>Разбан</Button>
                      ) : (
                        <Button size="sm" variant="danger" loading={banMutation.isPending} onClick={() => banMutation.mutate(u.id)}>Бан</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}