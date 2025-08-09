import {
  type RouteConfig,
  index,
  route,
  layout,
  prefix,
} from "@react-router/dev/routes";

export default [
  layout("./ui/layouts/editor.tsx", [route("write", "./routes/write.tsx")]),
  layout("./ui/layouts/main.tsx", [
    index("routes/home.tsx"),
    route("/a/:naddr", "./routes/address.tsx"),
    route("/e/:nevent", "./routes/event.tsx"),
    route("/p/:nprofile", "./routes/pubkey.tsx"),

    route("/u/:nip05", "./routes/u/nip05.tsx"),
    route("/u/:nip05/:identifier", "./routes/u/article.tsx"),

    route("/t/:tag", "./routes/hashtag.tsx"),
    //route("/r/:ref", "./routes/relay.tsx"),
    route("/relay/:relay", "./routes/relay.tsx"),

    route(":username", "./routes/username.tsx"),
    route(":username/:identifier", "./routes/identifier.tsx"),
  ]),

  ...prefix("api", [
    route("members", "./routes/members.ts"),
    route("markdown", "./routes/markdown.ts"),
  ]),

  route(".well-known/nostr.json", "./routes/nip05.ts"),
  // /faq
  // require auth, client side rendered:
  // /settings
] satisfies RouteConfig;
