/**
 * Defer a subtree to the browser.
 *
 * Habla is a SPA, so almost nothing needs this: only the root route is
 * rendered during the build to produce `index.html`. Reach for it when a
 * component inside `root.tsx` touches the DOM or an account, and nowhere else.
 */
import { type ReactNode, type FC, useState, useEffect } from "react";

interface ClientOnlyProps {
  children: () => ReactNode;
  fallback?: ReactNode;
}

const ClientOnly: FC<ClientOnlyProps> = ({
  children,
  fallback,
}: ClientOnlyProps) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return fallback;

  return children();
};

export default ClientOnly;
