import { domToJpeg } from "modern-screenshot";

/** Renders the live `.card` DOM node to a JPEG File for upload. */
export async function captureCardJpeg(
  cardEl: HTMLElement,
  filename = "card-preview.jpg",
): Promise<File> {
  const dataUrl = await domToJpeg(cardEl, {
    quality: 0.9,
    scale: 1,
    backgroundColor: "#ffffff",
    style: {
      transform: "none",
      margin: "0",
    },
  });

  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: "image/jpeg" });
}

export async function uploadCardJpeg(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  if (!res.ok) throw new Error("UPLOAD_FAILED");
  const data = await res.json();
  return data.url as string;
}
