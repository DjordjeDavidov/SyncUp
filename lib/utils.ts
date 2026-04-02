import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function getInitials(value: string) {
  return value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function formatDistanceToNow(date: Date) {
  const diff = date.getTime() - Date.now();
  const minutes = Math.round(diff / 60000);

  if (Math.abs(minutes) < 1) {
    return "Just now";
  }

  if (Math.abs(minutes) < 60) {
    return minutes > 0 ? `In ${minutes}m` : `${Math.abs(minutes)}m ago`;
  }

  const hours = Math.round(minutes / 60);

  if (Math.abs(hours) < 24) {
    return hours > 0 ? `In ${hours}h` : `${Math.abs(hours)}h ago`;
  }

  const days = Math.round(hours / 24);

  return days > 0 ? `In ${days}d` : `${Math.abs(days)}d ago`;
}
