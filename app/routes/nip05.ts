import { getFeaturedUsers } from "~/featured";

export async function loader() {
  //const { username } = request.query;
  const users = await getFeaturedUsers();
  const names = users.reduce((acc, user) => {
    const { nip05, pubkey } = user;
    return { ...acc, [nip05]: pubkey };
  }, {});
  const relays = users.reduce((acc, user) => {
    const { pubkey, relays } = user;
    if (relays) {
      return { ...acc, [pubkey]: relays };
    }
    return acc;
  }, {});
  return Response.json({ names, relays });
}
