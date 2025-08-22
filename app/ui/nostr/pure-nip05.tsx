import { Link } from "react-router";
import { Verified, LoaderCircle, TriangleAlert } from "lucide-react";
import Logo from "../logo";
import { cn } from "~/lib/utils";

export interface Nip05Props {
  nip05: string;
  className?: string;
}

function Domain({
  domain,
  className,
  noAt,
}: {
  domain: string;
  noAt?: boolean;
  className?: string;
}) {
  return (
    <>
      {noAt ? null : <span className="text-muted-foreground">@</span>}
      <Link
        target="_blank"
        className={cn(
          "text-primary hover:underline hover:decoration-dotted",
          className,
        )}
        to={`https://${domain}`}
      >
        {domain}
      </Link>
    </>
  );
}

export function Invalid({ nip05, className = "text-sm" }: Nip05Props) {
  return (
    <PureNip05
      nip05={nip05}
      isLoading={false}
      isVerified={false}
      className={className}
    />
  );
}

export function Loading({ nip05, className = "text-sm" }: Nip05Props) {
  return (
    <PureNip05
      nip05={nip05}
      isLoading={false}
      isVerified={false}
      className={className}
    />
  );
}

interface PureNip05Props extends Nip05Props {
  isLoading: boolean;
  isVerified: boolean;
}

export default function PureNip05({
  nip05,
  isLoading,
  isVerified,
  className = "text-sm",
}: PureNip05Props) {
  const isSupporter = true;
  const [username, domain] = nip05.includes("@")
    ? nip05.split("@")
    : ["_", nip05];
  const isHabla = domain.toLowerCase().trim() === "habla.news";
  const icon = "size-4 text-muted-foreground";
  const isUnverified = !isLoading && !isVerified;

  return (
    <div className="flex flex-row items-center gap-1 font-sans font-light">
      {isLoading ? (
        <LoaderCircle className={cn(icon, "animate-spin")} />
      ) : isHabla && isVerified ? (
        <Logo className={icon} />
      ) : isVerified ? (
        <Verified className={icon} />
      ) : (
        <TriangleAlert className={cn(icon, "text-destructive")} />
      )}
      <span
        className={cn(
          "animate-color",
          className,
          isUnverified && "text-destructive",
        )}
      >
        {username === "_" ? (
          <Domain noAt domain={domain} />
        ) : isVerified && isHabla ? (
          <Link
            to={`/${username}`}
            className="text-primary hover:underline hover:decoration-dotted"
          >
            {username}
          </Link>
        ) : (
          <span>{username}</span>
        )}
        {username !== "_" && !isHabla ? <Domain domain={domain} /> : null}
      </span>
    </div>
  );
}
