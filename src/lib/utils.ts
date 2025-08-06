import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getGoogleDriveImageSrc(url: string | undefined | null): string {
  if (!url || !url.includes('drive.google.com')) {
    // Return a placeholder if the URL is empty or not a Google Drive link.
    return "";
  }

  const regex = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
  const match = url.match(regex);

  if (match && match[1]) {
    const fileId = match[1];
    return `https://drive.google.com/uc?id=${fileId}`;
  }

  // Fallback if the URL is a Google Drive link but doesn't match the expected format.
  return url;
}
