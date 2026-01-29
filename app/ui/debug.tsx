export default function Debug({ children }: { children: any }) {
  return (
    <pre className="text-xs overflow-x-scroll no-scrollbar w-full">
      {JSON.stringify(children, null, 2)}
    </pre>
  );
}
