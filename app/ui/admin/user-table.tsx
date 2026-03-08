'use client';
import { useActionState } from 'react';
import { updateUserRole, deleteUser } from '@/app/lib/actions';
import { Button } from '@/app/ui/button';
import { User } from '@/app/lib/definitions';

export default function AdminUserTable({ users }: { users: User[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-700">
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Name</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Email</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Role</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Verified</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Created</th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{user.name}</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{user.email}</td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                <RoleSelect userId={user.id} currentRole={user.role} />
              </td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                {user.email_verified ? 'Yes' : 'No'}
              </td>
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </td>
              <td className="px-4 py-2 text-sm">
                <DeleteUser userId={user.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RoleSelect({ userId, currentRole }: { userId: string; currentRole: string }) {
  const [state, formAction] = useActionState(updateUserRole, undefined);

  return (
    <form action={formAction} className="flex items-center space-x-2">
      <input type="hidden" name="userId" value={userId} />
      <select
        name="role"
        defaultValue={currentRole}
        className="border border-gray-300 dark:border-gray-600 rounded p-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
      >
        <option value="user">User</option>
        <option value="admin">Admin</option>
      </select>
      <button
        type="submit"
        className="px-2 py-1 text-xs font-medium text-white bg-blue-500 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        Update
      </button>
      {state && <p className="text-red-500 text-xs">{state}</p>}
    </form>
  );
}

function DeleteUser({ userId }: { userId: string }) {
  const [state, formAction] = useActionState(deleteUser, undefined);

  return (
    <form action={formAction}>
      <input type="hidden" name="userId" value={userId} />
      <Button type="submit" className="bg-red-600 hover:bg-red-700 text-sm px-2 py-1">
        Delete
      </Button>
      {state && <p className="text-red-500 text-xs">{state}</p>}
    </form>
  );
}