import { Outlet } from "react-router";
import Main from "../main";

export default function Layout() {
  return (
    <Main>
      <Outlet />
    </Main>
  );
}
