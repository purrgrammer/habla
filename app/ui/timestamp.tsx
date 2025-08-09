export default function Timestamp({ timestamp }: { timestamp: number }) {
  const date = new Date(timestamp * 1000);
  const timeFormatter = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  });
  return timeFormatter.format(date);
}
