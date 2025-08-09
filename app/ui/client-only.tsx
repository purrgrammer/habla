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
