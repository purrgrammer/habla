import type { Nip05Pointer, User } from "~/services/types";

export async function getMembers(): Promise<Nip05Pointer[]> {
  return fetch(`/api/users`)
    .then((r) => r.json())
    .then((users) =>
      users.map((user: { username: string; pubkey: string }) => ({
        ...user,
        nip05: user.username,
      })),
    );
}

export async function getUsers(): Promise<User[]> {
  return fetch(`/api/users`).then((r) => r.json());
}
