export default function Audio({ src }: { src: string }) {
  return <audio controls src={src} />;
}
