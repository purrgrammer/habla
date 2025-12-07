import { useMemo, type ReactNode } from "react";
import { Link } from "react-router";
import { prettify } from "~/lib/url";
import { isImageURL, isVideoURL, isAudioURL } from "applesauce-core/helpers";
import Image from "./image";
import Video from "./video";
import Audio from "./audio";

function useUrl(href: string) {
  return useMemo(() => {
    try {
      const url = new URL(href);
      return href;
    } catch (err) {
      return null;
    }
  }, [href]);
}

export default function A({
  href,
  value,
}: {
  href: string;
  value: string | ReactNode;
}) {
  const url = useUrl(href);

  if (!url) return null;

  if (isVideoURL(href)) {
    return <Video src={href} />;
  }

  if (isImageURL(href)) {
    return <Image src={href} />;
  }

  if (isAudioURL(href)) {
    return <Audio src={href} />;
  }

  return (
    <Link
      className="break-all hover:underline hover:decoration-dotted text-primary"
      to={href}
    >
      {typeof value === "string" ? prettify(value) : value}
    </Link>
  );
}
