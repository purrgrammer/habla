import { useNavigation } from "react-router";
import { useEffect, useState } from "react";
import { cn } from "~/lib/utils";

export default function GlobalLoading() {
  const navigation = useNavigation();
  const active = navigation.state !== "idle";
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (active) {
      setVisible(true);
      // Start at random small percentage
      setProgress(10);
      
      // Increment slowly
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          // Decaying increment
          const increment = Math.max(1, (90 - prev) / 10);
          return prev + increment;
        });
      }, 100);
    } else {
      // Finish
      setProgress(100);
      // Hide after animation
      timer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 500);
    }

    return () => clearInterval(timer);
  }, [active]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-transparent">
      <div
        className={cn(
          "h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)] transition-all duration-300 ease-out",
          active ? "opacity-100" : "opacity-0"
        )}
        style={{ 
          width: `${progress}%`,
          opacity: active || progress === 100 ? 1 : 0 
        }}
      />
    </div>
  );
}
