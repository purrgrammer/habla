import { Outlet } from "react-router";
import Main from "../main";

export default function Layout() {
  return (
    <main className="flex flex-col w-full min-h-screen">
      <Outlet />
    </main>
  );
}
