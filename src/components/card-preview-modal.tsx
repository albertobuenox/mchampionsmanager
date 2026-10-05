"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CardData } from "@/lib/card-defaults";
import { captureCardJpeg, uploadCardJpeg } from "@/lib/capture-card";
import { CardPreview } from "@/components/card-editor/card-preview";
import "@/components/card-editor/card.css";

type PreviewMode = "app" | "print";

export function CardPreviewModal({
  cardId,
  title,
  printPhoto,
  appPreview: initialAppPreview,
  onClose,
}: {
  cardId: string;
  title: string;
  printPhoto?: string;
  appPreview?: string;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<PreviewMode>(printPhoto ? "print" : "app");
  const [appPreview, setAppPreview] = useState(initialAppPreview || "");
  const [printSrc, setPrintSrc] = useState(printPhoto || "");
  const [card, setCard] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const cardNodeRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(`/api/cards/${cardId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "No se pudo cargar la carta");
        if (cancelled) return;
        setCard(data.data as CardData);
        setAppPreview(data.appPreview || "");
        setPrintSrc(printPhoto || data.photo || "");
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cardId, printPhoto]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const generateImage = useCallback(async () => {
    if (!card || generating) return;
    setGenerating(true);
    setError("");
    setStatus("Generando imagen…");
    setMode("app");

    try {
      await document.fonts.ready.catch(() => undefined);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));

      let el = cardNodeRef.current;
      for (let i = 0; !el && i < 20; i++) {
        await new Promise((r) => setTimeout(r, 50));
        el = cardNodeRef.current;
      }
      if (!el) throw new Error("No se pudo renderizar la carta");

      // Wait for interior photo/headshot if present.
      const imgs = Array.from(el.querySelectorAll("img"));
      await Promise.all(
        imgs.map(
          (img) =>
            img.complete
              ? Promise.resolve()
              : new Promise<void>((resolve) => {
                  img.onload = () => resolve();
                  img.onerror = () => resolve();
                }),
        ),
      );
      await new Promise((r) => setTimeout(r, 80));

      const file = await captureCardJpeg(el, `${cardId}-app.jpg`);
      const url = await uploadCardJpeg(file);
      const res = await fetch(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appPreview: url }),
      });
      if (!res.ok) throw new Error("No se pudo guardar la imagen");

      setAppPreview(`${url}?t=${Date.now()}`);
      setStatus("Imagen generada");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar");
      setStatus("");
    } finally {
      setGenerating(false);
    }
  }, [card, cardId, generating]);

  const src = mode === "print" ? printSrc : appPreview;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-[#f8f4ec] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Vista previa: ${title}`}
      >
        <header className="flex items-start justify-between gap-3 border-b border-[#ddd4c4] px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.16em] text-[#8a8174]">Vista previa</p>
            <h2 className="truncate text-xl font-semibold">{title || "Sin título"}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#cfc6b6] px-2.5 py-1 text-sm font-semibold hover:bg-white"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </header>

        <div className="flex flex-wrap items-center gap-3 border-b border-[#eee6d8] px-5 py-3">
          <label className="text-sm font-medium text-[#6b6358]">
            Versión{" "}
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as PreviewMode)}
              className="ml-2 rounded-lg border border-[#cfc6b6] bg-white px-2 py-1.5 text-sm text-[#1a1612]"
            >
              <option value="app">Versión app</option>
              <option value="print" disabled={!printSrc}>
                Versión impresa
              </option>
            </select>
          </label>
          <button
            type="button"
            onClick={generateImage}
            disabled={!card || generating || loading}
            className="ml-auto rounded-lg bg-[#1a1612] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#c41218] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generating ? "Generando…" : "Generar imagen"}
          </button>
        </div>

        <div className="card-preview-stage relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#f8f4ec] px-6 py-4">
          {loading || generating ? (
            <p className="p-8 text-center text-sm text-[#8a8174]">
              {generating ? "Generando imagen…" : "Cargando carta…"}
            </p>
          ) : error ? (
            <p className="p-8 text-center text-sm text-[#c41218]">{error}</p>
          ) : src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={title} className="card-preview-media" />
          ) : mode === "app" ? (
            <p className="max-w-sm p-8 text-center text-sm text-[#8a8174]">
              Aún no hay vista app. Pulsa <strong>Generar imagen</strong> para crear el JPG con la
              configuración actual del editor.
            </p>
          ) : (
            <p className="p-8 text-center text-sm text-[#8a8174]">
              Esta carta no tiene imagen impresa disponible.
            </p>
          )}
          {status && !generating && src ? (
            <p className="absolute bottom-3 left-0 right-0 text-center text-[11px] text-[#8a8174]">
              {status}
            </p>
          ) : null}
        </div>

        <footer className="flex justify-end border-t border-[#ddd4c4] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#cfc6b6] bg-white px-4 py-2 text-sm font-semibold hover:bg-[#f3efe6]"
          >
            Cerrar
          </button>
        </footer>
      </div>

      {card ? (
        <div
          aria-hidden
          className="pointer-events-none fixed top-0 z-[-1] overflow-hidden"
          style={{ left: -10000, width: 1500, height: 2150 }}
        >
          <CardPreview ref={cardNodeRef} card={card} zoom={1} />
        </div>
      ) : null}
    </div>
  );
}
