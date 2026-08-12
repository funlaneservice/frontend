'use client';

import { useEffect, useState } from 'react';
import { usersApi } from '@/api';
import type { AdminUserView } from '@/interface';


let cache: AdminUserView[] | null = null;
let inflight: Promise<AdminUserView[]> | null = null;

export function useUserDirectory() {
  const [users, setUsers] = useState<AdminUserView[]>(cache ?? []);

  useEffect(() => {
    if (cache) return;
    inflight ??= usersApi.listUsers({ limit: 100 }).then((res) => (cache = res.users));
    let alive = true;
    inflight.then((list) => alive && setUsers(list)).catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  /** Full user record for an id, if known. */
  function userById(id: string | null | undefined): AdminUserView | null {
    if (!id) return null;
    return users.find((u) => u.id === id) ?? null;
  }

  /** Display name for a user id; falls back to a short id while loading/unknown. */
  function userLabel(id: string | null | undefined): string | null {
    if (!id) return null;
    const u = userById(id);
    return u ? u.name || u.email : `User ${id.slice(0, 8)}`;
  }

  return { users, userById, userLabel };
}
