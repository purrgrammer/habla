import { Link } from "react-router";
import { type NostrEvent } from "nostr-tools";
import { getTagValue } from "applesauce-core/helpers";
import { isImageURL, isVideoURL, isAudioURL } from "applesauce-core/helpers";
import RichText from "./rich-text";
import Image from "~/ui/image";
import Video from "../video";
import Audio from "../audio";

function FileContent({ link }: { link: string }) {
  if (isImageURL(link)) {
    return <Image src={link} className="my-0" />;
  }
  if (isVideoURL(link)) {
    return <Video src={link} className="my-0" />;
  }
  if (isAudioURL(link)) {
    return <Audio src={link} />;
  }
  return (
    <Link target="_blank" to={link}>
      {link}
    </Link>
  );
}

export default function FileEvent({ event }: { event: NostrEvent }) {
  const link = getTagValue(event, "url");
  if (!link) return null;
  return (
    <div className="flex flex-col gap-2">
      <RichText event={event} />
      <FileContent link={link} />
    </div>
  );
}
