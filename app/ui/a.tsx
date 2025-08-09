import { type ReactNode } from "react";
import { Link } from "react-router";
import { prettify, isImageLink, isVideoLink, isAudioLink } from "~/lib/url";
import Image from "./image";
import Video from "./video";
import Audio from "./audio";

export default function A({
  href,
  value,
}: {
  href: string;
  value: string | ReactNode;
}) {
  if (isVideoLink(href)) {
    return <Video src={href} />;
  }

  if (isImageLink(href)) {
    return <Image src={href} />;
  }

  if (isAudioLink(href)) {
    return <Audio src={href} />;
  }

  return (
    <Link
      className="hover:underline hover:decoration-dotted break-all text-primary"
      to={href}
    >
      {typeof value === "string" ? prettify(value) : value}
    </Link>
  );
}
