import { useLoaderData } from "react-router";

import { userApi } from "../../trpc";

export async function loader() {
  const users = await userApi.getAllUsers.query();
  return { users };
}

function UsersPage() {
  const { users } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            <strong>{user.name}</strong> — {user.email}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default UsersPage;
