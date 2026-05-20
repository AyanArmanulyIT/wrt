"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  banUser,
  fetchAdminUsers,
  unbanUser,
  verifyUser,
} from "@/services/admin.service";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";

export function AdminUsersPanel() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users", search, status],
    queryFn: () => fetchAdminUsers({ search: search || undefined, status: status || undefined }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
  };

  const banMutation = useMutation({
    mutationFn: (id: string) => banUser(id, "Нарушение правил"),
    onSuccess: invalidate,
  });

  const unbanMutation = useMutation({
    mutationFn: unbanUser,
    onSuccess: invalidate,
  });

  const verifyMutation = useMutation({
    mutationFn: verifyUser,
    onSuccess: invalidate,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Пользователи</h1>
        <p className="text-gray-500 text-sm mt-1">Модерация и верификация</p>
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
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  Загрузка...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  Нет пользователей
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="p-3">
                    <p className="font-medium">@{u.username}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </td>
                  <td className="p-3 text-gray-400">{u.school_name ?? "—"}</td>
                  <td className="p-3">
                    {u.is_banned ? (
                      <span className="text-red-400 text-xs font-medium">Заблокирован</span>
                    ) : u.verification_status === "pending" ? (
                      <span className="text-amber-400 text-xs font-medium">На проверке</span>
                    ) : (
                      <span className="text-green-400 text-xs font-medium">Подтверждён</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2 flex-wrap">
                      {u.verification_status === "pending" && !u.is_banned ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="!bg-green-500/20 !text-green-300 border-0"
                          loading={verifyMutation.isPending}
                          onClick={() => verifyMutation.mutate(u.id)}
                        >
                          Одобрить
                        </Button>
                      ) : null}
                      {u.is_banned ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-gray-300"
                          loading={unbanMutation.isPending}
                          onClick={() => unbanMutation.mutate(u.id)}
                        >
                          Разбан
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="danger"
                          loading={banMutation.isPending}
                          onClick={() => banMutation.mutate(u.id)}
                        >
                          Бан
                        </Button>
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
