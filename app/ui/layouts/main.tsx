import { Outlet } from "react-router";

import Header from "~/ui/header";
import Footer from "~/ui/footer";
import Main from "~/ui/main";

export default function Layout() {
  return (
    <>
      <Header />
      <Main>
        <Outlet />
      </Main>
      <Footer />
    </>
  );
}
