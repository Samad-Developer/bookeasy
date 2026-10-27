'use client';

import { format } from 'date-fns';
import { useState, type FormEvent } from 'react';
import { PageButtons } from '@/components/shared/page-buttons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateUser, useUsers } from '@/features/admin/hooks';
import type { AdminUser, UserFilters } from '@/features/admin/types';
import { useAuth } from '@/features/auth/use-auth';
import { getErrorMessage } from '@/lib/api-client';
import { formatCount } from '@/lib/format';
import type { Role } from '@/types/api';

const ROLES: { value: Role; label: string }[] = [
  { value: 'customer', label: 'Customer' },
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
];

const selectClass = 'h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring';

const NO_FILTERS: UserFilters = { q: '', role: undefined, isActive: undefined };

export function UsersManager() {
  const [filters, setFilters] = useState<UserFilters>(NO_FILTERS);
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const { data, isPending, isError, error, refetch, isFetching } = useUsers(filters, page);

  function changeFilters(changes: Partial<UserFilters>) {
    setFilters((current) => ({ ...current, ...changes }));
    setPage(1); // a new filter always starts on its first page
  }

  function search(event: FormEvent) {
    event.preventDefault();
    changeFilters({ q: searchText.trim() });
  }

  const filtersActive = !!(filters.q || filters.role || filters.isActive !== undefined);

  return (
    <div className="space-y-6">
      <form onSubmit={search} role="search" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="user-q">Search</Label>
          <Input id="user-q" type="search" placeholder="Name or email" value={searchText} onChange={(event) => setSearchText(event.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="user-role">Role</Label>
          <select
            id="user-role"
            className={selectClass}
            value={filters.role ?? ''}
            onChange={(event) => changeFilters({ role: (event.target.value || undefined) as Role | undefined })}
          >
            <option value="">All roles</option>
            {ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="user-status">Status</Label>
          <select
            id="user-status"
            className={selectClass}
            value={filters.isActive === undefined ? '' : String(filters.isActive)}
            onChange={(event) => changeFilters({ isActive: event.target.value === '' ? undefined : event.target.value === 'true' })}
          >
            <option value="">Any status</option>
            <option value="true">Active</option>
            <option value="false">Disabled</option>
          </select>
        </div>

        <div className="flex gap-2">
          <Button type="submit">Search</Button>
          {filtersActive && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSearchText('');
                changeFilters(NO_FILTERS);
              }}
            >
              Clear
            </Button>
          )}
        </div>
      </form>

      {isPending && (
        <div role="status" aria-label="Loading users" className="space-y-3">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-16 animate-pulse rounded bg-muted" />
          ))}
        </div>
      )}

      {isError && (
        <div role="alert" className="space-y-3 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <p className="text-destructive">{getErrorMessage(error, 'Could not load the users.')}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}

      {data && (
        <p aria-live="polite" className="text-sm text-muted-foreground">
          {data.pagination.total === 0
            ? 'No users found'
            : `${formatCount(data.pagination.total)} ${data.pagination.total === 1 ? 'user' : 'users'}${filtersActive ? ' match your search' : ''}`}
        </p>
      )}

      {data && data.users.length > 0 && (
        <ul className={isFetching ? 'divide-y border-y opacity-60 transition-opacity' : 'divide-y border-y transition-opacity'}>
          {data.users.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </ul>
      )}

      {data && data.users.length === 0 && page > 1 && (
        <Button variant="outline" onClick={() => setPage(1)}>
          First page
        </Button>
      )}

      {data && <PageButtons page={data.pagination.page} totalPages={data.pagination.totalPages} onPageChange={setPage} />}
    </div>
  );
}

type RowMode = 'view' | 'change-role' | 'confirm-status';

function UserRow({ user }: { user: AdminUser }) {
  const { user: me } = useAuth();
  const update = useUpdateUser();
  const [mode, setMode] = useState<RowMode>('view');
  const [newRole, setNewRole] = useState<Role>(user.role);

  const isMe = me?.id === user.id;
  const roleLabel = ROLES.find((role) => role.value === user.role)?.label ?? user.role;

  function saveRole() {
    update.mutate({ id: user.id, changes: { role: newRole } }, { onSuccess: () => setMode('view') });
  }

  function toggleStatus() {
    update.mutate({ id: user.id, changes: { isActive: !user.isActive } }, { onSettled: () => setMode('view') });
  }

  return (
    <li className="space-y-3 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <div className="min-w-0">
          <p className={user.isActive ? 'font-medium' : 'font-medium text-muted-foreground'}>
            {user.name}
            {isMe && <span className="ml-2 text-sm font-normal text-muted-foreground">(you)</span>}
          </p>
          <p className="break-all text-sm text-muted-foreground">{user.email}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border px-2.5 py-0.5 text-xs">{roleLabel}</span>
          <span
            className={
              user.isActive
                ? 'rounded-full border border-foreground px-2.5 py-0.5 text-xs font-medium'
                : 'rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground'
            }
          >
            {user.isActive ? 'Active' : 'Disabled'}
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Joined {format(new Date(user.createdAt), 'd MMM yyyy')} · {user.venuesCount} {user.venuesCount === 1 ? 'venue' : 'venues'} ·{' '}
        {user.bookingsCount} {user.bookingsCount === 1 ? 'booking' : 'bookings'}
      </p>

      {/* the API refuses to change your own account, so we do not offer the buttons */}
      {!isMe && mode === 'view' && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNewRole(user.role);
              setMode('change-role');
            }}
          >
            Change role
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMode('confirm-status')}>
            {user.isActive ? 'Disable' : 'Enable'}
          </Button>
        </div>
      )}

      {mode === 'change-role' && (
        <div role="group" aria-label="Change role" className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor={`role-${user.id}`} className="text-sm">
              New role
            </label>
            <select
              id={`role-${user.id}`}
              className={`${selectClass} w-40`}
              value={newRole}
              onChange={(event) => setNewRole(event.target.value as Role)}
            >
              {ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
            <Button size="sm" disabled={update.isPending || newRole === user.role} onClick={saveRole}>
              {update.isPending ? 'Saving…' : 'Save role'}
            </Button>
            <Button variant="outline" size="sm" disabled={update.isPending} onClick={() => setMode('view')}>
              Cancel
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">They will be logged out and see the new role the next time they log in.</p>
        </div>
      )}

      {mode === 'confirm-status' && (
        <div role="group" aria-label="Confirm status change" className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm">{user.isActive ? `Disable ${user.name}?` : `Enable ${user.name}?`}</span>
            <Button variant={user.isActive ? 'destructive' : 'default'} size="sm" disabled={update.isPending} onClick={toggleStatus}>
              {update.isPending ? 'Saving…' : user.isActive ? 'Yes, disable' : 'Yes, enable'}
            </Button>
            <Button variant="outline" size="sm" disabled={update.isPending} onClick={() => setMode('view')}>
              Cancel
            </Button>
          </div>
          {user.isActive && <p className="text-sm text-muted-foreground">They will be logged out and cannot log in again until you enable them.</p>}
        </div>
      )}
    </li>
  );
}