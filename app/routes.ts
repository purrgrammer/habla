import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  layout("./ui/layouts/editor.tsx", [route("write", "./routes/write.tsx")]),
  layout("./ui/layouts/main.tsx", [
    index("routes/home.tsx"),
    route("/a/:naddr", "./routes/address.tsx"),
    route("/e/:nevent", "./routes/event.tsx"),
    route("/p/:nprofile", "./routes/pubkey.tsx"),
    // route("/c/:naddr") community

    route("/t/:tag", "./routes/hashtag.tsx"),
    //route("/r/:ref", "./routes/ref.tsx"),
    route("/relay/:relay", "./routes/relay.tsx"),

    // todo: some require auth, client side rendered
    route("wallet", "./routes/wallet.tsx"),
    route("bookmarks", "./routes/bookmarks.tsx"),
    route("faq", "./routes/faq.tsx"),
    route("settings", "./routes/settings.tsx"),
  ]),
] satisfies RouteConfig;
