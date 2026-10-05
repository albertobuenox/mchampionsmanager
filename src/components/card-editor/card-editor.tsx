"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CardData } from "@/lib/card-defaults";
import { captureCardJpeg, uploadCardJpeg } from "@/lib/capture-card";
import { CardPreview } from "./card-preview";
import { ASPECTS, SPLIT_TYPES, TYPES, applyAspectColors, familyOf } from "./constants";
import "./card.css";

type Meta = {
  id: string;
  heroKit?: { id: string; name: string } | null;
  importedDeck?: { id: string; name: string } | null;
};

export function CardEditor({
  initial,
  meta,
}: {
  initial: CardData;
  meta: Meta;
}) {
  const [card, setCard] = useState<CardData>(initial);
  const [zoom, setZoom] = useState(0.34);
  const [showBg, setShowBg] = useState(true);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const cardNodeRef = useRef<HTMLElement | null>(null);
  const snapshotTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const snapshotBusy = useRef(false);

  const backHref = meta.heroKit
    ? `/heroes/${meta.heroKit.id}`
    : meta.importedDeck
      ? "/imported"
      : "/heroes";
  const backLabel = meta.heroKit
    ? meta.heroKit.name
    : meta.importedDeck
      ? meta.importedDeck.name
      : "Volver";

  const patch = useCallback((partial: Partial<CardData>) => {
    setCard((prev) => ({ ...prev, ...partial }));
  }, []);

  const persistAppPreview = useCallback(async () => {
    const el = cardNodeRef.current;
    if (!el || snapshotBusy.current) return;
    snapshotBusy.current = true;
    const hadPlain = el.classList.contains("is-plain-art");
    try {
      // Snapshot the HTML mask only (no printed underlay).
      el.classList.add("is-plain-art");
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const file = await captureCardJpeg(el, `${meta.id}-app.jpg`);
      const url = await uploadCardJpeg(file);
      await fetch(`/api/cards/${meta.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appPreview: url }),
      });
    } catch {
      /* snapshot is best-effort */
    } finally {
      if (!hadPlain) el.classList.remove("is-plain-art");
      snapshotBusy.current = false;
    }
  }, [meta.id]);

  const queueAppPreview = useCallback(() => {
    if (snapshotTimer.current) clearTimeout(snapshotTimer.current);
    snapshotTimer.current = setTimeout(() => {
      void persistAppPreview();
    }, 900);
  }, [persistAppPreview]);

  const save = useCallback(
    async (next?: CardData) => {
      setSaving(true);
      const payload = next || card;
      const res = await fetch(`/api/cards/${meta.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setSaving(false);
      setStatus(res.ok ? "Guardado" : "Error al guardar");
      if (res.ok) queueAppPreview();
    },
    [card, meta.id, queueAppPreview],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      save(card);
    }, 500);
    return () => clearTimeout(timer);
  }, [card, save]);

  useEffect(() => {
    return () => {
      if (snapshotTimer.current) clearTimeout(snapshotTimer.current);
    };
  }, []);

  async function upload(field: "photo" | "headshot", file: File) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    if (!res.ok) {
      setStatus("Error al subir imagen");
      return;
    }
    const data = await res.json();
    if (field === "photo") {
      patch({ photo: data.url, photoZoom: 1, photoX: 0, photoY: 0, fullCardPhoto: true });
    } else {
      patch({ headshot: data.url });
    }
  }

  const sections = useMemo(() => buildVisibleFields(card), [card]);

  function resetValues() {
    const ok = window.confirm(
      "¿Descartar los cambios y volver al último estado guardado de esta carta?",
    );
    if (!ok) return;
    setCard({ ...initial });
    setStatus("Cambios descartados");
  }

  return (
    <div className="card-editor-shell app">
      <section className="preview" aria-label="Vista de la carta">
        <div className="preview__bar">
          <strong>Vista</strong>
          <div className="preview__bar-actions">
            <button
              type="button"
              className={`preview__eye${showBg ? " is-on" : ""}`}
              aria-pressed={showBg}
              aria-label={showBg ? "Ocultar imagen impresa" : "Mostrar imagen impresa"}
              title={showBg ? "Ocultar imagen impresa (fondo)" : "Mostrar imagen impresa (fondo)"}
              onClick={() => setShowBg((v) => !v)}
            >
              {showBg ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                  <path d="M4 4l16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </button>
            <label>
              Zoom{" "}
              <input
                type="range"
                min={0.22}
                max={0.55}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
            </label>
          </div>
        </div>
        <div className="preview__stage">
          <CardPreview ref={cardNodeRef} card={card} zoom={zoom} hideArt={!showBg} />
        </div>
      </section>

      <section className="editor" aria-label="Campos de la carta">
        <header className="editor__head">
          <div className="brand">
            <Link href={backHref} className="text-sm text-[#8a8174] hover:text-[#c41218]">
              ← {backLabel}
            </Link>
            <h1>Editar carta</h1>
            <p>Personalización estética · {saving ? "Guardando…" : status || "Autoguardado"}</p>
          </div>
          <div className="editor__row">
            <label className="grow">
              Tipo
              <select
                value={card.type}
                onChange={(e) => {
                  const type = e.target.value;
                  setCard((prev) => {
                    if (type === "identity") {
                      return applyAspectColors({ ...prev, type }, "Identidad");
                    }
                    return {
                      ...prev,
                      type,
                      aspect: prev.aspect === "Identidad" ? "" : prev.aspect,
                    };
                  });
                }}
              >
                {Object.entries(TYPES).map(([value, item]) => (
                  <option key={value} value={value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={resetValues}
              className="rounded-lg border border-[#cfc6b6] bg-white px-3 py-2 text-sm font-medium text-[#1a1612] hover:bg-[#f3efe6]"
            >
              Reiniciar valores
            </button>
            <button type="button" onClick={() => save()} className="rounded-lg bg-[#1a1612] px-3 py-2 text-sm text-white">
              Guardar ahora
            </button>
          </div>
        </header>

        <form className="fields" onSubmit={(e) => e.preventDefault()}>
          {sections.map((section) => (
            <section key={section.name} className="section">
              <h2>{section.name}</h2>
              <div className="grid">
                {section.fields.map((field) => (
                  <label
                    key={field.key}
                    className={`${field.wide ? "wide" : ""} ${field.control === "check" ? "check" : ""}`}
                  >
                    {field.control === "aspects" ? (
                      <>
                        {field.label}
                        <div className="aspects">
                          {Object.entries(ASPECTS).map(([name, colors]) => {
                            if (name === "Identidad" && card.type !== "identity") return null;
                            return (
                              <button
                                key={name}
                                type="button"
                                className={card.aspect === name ? "is-selected" : ""}
                                style={
                                  name === "Identidad"
                                    ? {
                                        background: `linear-gradient(135deg, ${colors[0]} 50%, ${colors[1]} 50%)`,
                                      }
                                    : { ["--swatch" as string]: colors[0] }
                                }
                                onClick={() => setCard((prev) => applyAspectColors(prev, name))}
                              >
                                {name}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    ) : field.control === "check" ? (
                      <>
                        <input
                          type="checkbox"
                          checked={Boolean(card[field.key as keyof CardData])}
                          onChange={(e) => patch({ [field.key]: e.target.checked } as Partial<CardData>)}
                        />
                        <span>{field.label}</span>
                      </>
                    ) : (
                      <>
                        <span>{field.label}</span>
                        {field.control === "textarea" ? (
                          <textarea
                            value={String(card[field.key as keyof CardData] ?? "")}
                            onChange={(e) => patch({ [field.key]: e.target.value } as Partial<CardData>)}
                          />
                        ) : field.control === "color" ? (
                          <input
                            type="color"
                            value={colorValue(card, field.key)}
                            onChange={(e) => applyColor(field.key, e.target.value, patch, setCard)}
                          />
                        ) : field.control === "range" ? (
                          <input
                            type="range"
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            value={Number(card[field.key as keyof CardData] ?? 0)}
                            onChange={(e) =>
                              patch({ [field.key]: Number(e.target.value) } as Partial<CardData>)
                            }
                          />
                        ) : field.control === "resource" ? (
                          <select
                            value={card.resources[Number(field.key.slice(-1))] || "none"}
                            onChange={(e) => {
                              const idx = Number(field.key.slice(-1));
                              const resources = [...card.resources] as string[];
                              resources[idx] = e.target.value;
                              patch({ resources });
                            }}
                          >
                            <option value="none">Ninguno</option>
                            <option value="energy">Energía</option>
                            <option value="mental">Mental</option>
                            <option value="physical">Físico</option>
                            <option value="wild">Salvaje</option>
                          </select>
                        ) : field.control === "select" ? (
                          <select
                            value={String(card[field.key as keyof CardData] ?? "0")}
                            onChange={(e) =>
                              patch({
                                [field.key]: field.key === "boosts" ? Number(e.target.value) : e.target.value,
                              } as Partial<CardData>)
                            }
                          >
                            {(field.options || []).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : field.control === "file" ? (
                          <div className="file-row">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file && (field.key === "photo" || field.key === "headshot")) {
                                  upload(field.key, file);
                                }
                              }}
                            />
                            <button
                              type="button"
                              className="ghost"
                              onClick={() => patch({ [field.key]: "" } as Partial<CardData>)}
                            >
                              Quitar
                            </button>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={String(card[field.key as keyof CardData] ?? "")}
                            placeholder={field.placeholder}
                            onChange={(e) => patch({ [field.key]: e.target.value } as Partial<CardData>)}
                          />
                        )}
                        {field.hint ? <p className="hint">{field.hint}</p> : null}
                      </>
                    )}
                  </label>
                ))}
              </div>
            </section>
          ))}
        </form>
      </section>
    </div>
  );
}

function colorValue(card: CardData, key: string) {
  if (key === "frame" || key === "primary") return card.left;
  if (key === "frameAccent") return card.leftAccent;
  if (key === "secondary") return card.right;
  return String(card[key as keyof CardData] ?? "#000000");
}

function applyColor(
  key: string,
  value: string,
  patch: (p: Partial<CardData>) => void,
  setCard: React.Dispatch<React.SetStateAction<CardData>>,
) {
  if (key === "frame") {
    patch({ left: value, right: value });
    return;
  }
  if (key === "frameAccent") {
    patch({ leftAccent: value, rightAccent: value });
    return;
  }
  if (key === "primary") {
    patch({ left: value, leftAccent: value });
    return;
  }
  if (key === "secondary") {
    patch({ right: value, rightAccent: value });
    return;
  }
  setCard((prev) => ({ ...prev, [key]: value }));
}

type Field = {
  section: string;
  key: string;
  label: string;
  control: string;
  wide?: boolean;
  show: (c: CardData) => boolean;
  placeholder?: string;
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
};

function buildVisibleFields(card: CardData) {
  const SPEC: Field[] = [
    { section: "Texto", key: "title", label: "Título", control: "textarea", wide: true, show: () => true },
    { section: "Texto", key: "subtitle", label: "Subtítulo", control: "text", show: (c) => c.type === "ally" },
    {
      section: "Texto",
      key: "typeLabel",
      label: "Tipo en la carta",
      control: "text",
      show: () => true,
      placeholder: "Si lo dejas vacío, usa el del tipo",
    },
    { section: "Texto", key: "traits", label: "Traits", control: "text", wide: true, show: () => true },
    {
      section: "Texto",
      key: "rules",
      label: "Reglas",
      control: "textarea",
      wide: true,
      show: () => true,
      hint: "Los saltos de línea se respetan. **así** sale en negrita.",
    },
    { section: "Texto", key: "quote", label: "Cita", control: "textarea", wide: true, show: () => true },
    { section: "Texto", key: "setLine", label: "Set", control: "text", show: () => true },
    { section: "Texto", key: "copyright", label: "Autor", control: "text", show: () => true },
    { section: "Texto", key: "darkText", label: "Autor y set en negro", control: "check", show: () => true },

    { section: "Valores", key: "cost", label: "Coste", control: "text", show: (c) => ["ally", "event", "upgrade", "support", "resource", "player-scheme"].includes(c.type) },
    { section: "Valores", key: "costStar", label: "Estrella de coste", control: "check", show: (c) => ["ally", "event", "upgrade", "support", "resource", "player-scheme"].includes(c.type) },
    { section: "Valores", key: "thw", label: "THW / SCH", control: "text", show: (c) => ["ally", "identity", "minion", "villain"].includes(c.type) },
    { section: "Valores", key: "thwStar", label: "Estrella THW", control: "check", show: (c) => ["ally", "identity", "minion", "villain"].includes(c.type) },
    { section: "Valores", key: "atk", label: "ATK", control: "text", show: (c) => ["ally", "identity", "minion", "villain"].includes(c.type) },
    { section: "Valores", key: "atkStar", label: "Estrella ATK", control: "check", show: (c) => ["ally", "identity", "minion", "villain"].includes(c.type) },
    { section: "Valores", key: "def", label: "DEF", control: "text", show: (c) => c.type === "identity" },
    { section: "Valores", key: "defStar", label: "Estrella DEF", control: "check", show: (c) => c.type === "identity" },
    { section: "Valores", key: "rec", label: "REC", control: "text", show: (c) => c.type === "alter-ego" },
    { section: "Valores", key: "recStar", label: "Estrella REC", control: "check", show: (c) => c.type === "alter-ego" },
    { section: "Valores", key: "hp", label: "PV", control: "text", show: (c) => ["ally", "minion", "villain"].includes(c.type) },
    { section: "Valores", key: "handSize", label: "Mano", control: "text", show: (c) => ["identity", "alter-ego"].includes(c.type) },
    { section: "Valores", key: "identityHp", label: "PV de identidad", control: "text", show: (c) => ["identity", "alter-ego"].includes(c.type) },
    { section: "Valores", key: "stage", label: "Fase (I, II, A…)", control: "text", show: (c) => c.type === "villain" },
    { section: "Valores", key: "threat", label: "Amenaza inicial", control: "text", show: (c) => ["side-scheme", "main-scheme", "player-scheme"].includes(c.type) },
    { section: "Valores", key: "schemeNo", label: "Número de fase", control: "text", show: (c) => c.type === "main-scheme" },
    { section: "Valores", key: "boosts", label: "Iconos de boost", control: "select", options: ["0", "1", "2", "3", "4", "5"], show: (c) => ["minion", "attachment", "treachery", "environment", "side-scheme"].includes(c.type) },
    { section: "Valores", key: "boostStar", label: "Estrella de boost", control: "check", show: (c) => ["minion", "attachment", "treachery", "environment", "side-scheme"].includes(c.type) },
    { section: "Valores", key: "attAtk", label: "ATK vinculada", control: "text", show: (c) => c.type === "attachment" },
    { section: "Valores", key: "attSch", label: "SCH vinculada", control: "text", show: (c) => c.type === "attachment" },
    { section: "Valores", key: "resource0", label: "Recurso inferior", control: "resource", show: (c) => ["ally", "event", "upgrade", "support", "resource", "player-scheme"].includes(c.type) },
    { section: "Valores", key: "resource1", label: "Recurso medio", control: "resource", show: (c) => ["ally", "event", "upgrade", "support", "resource", "player-scheme"].includes(c.type) },
    { section: "Valores", key: "resource2", label: "Recurso superior", control: "resource", show: (c) => ["ally", "event", "upgrade", "support", "resource", "player-scheme"].includes(c.type) },

    { section: "Imagen", key: "photo", label: "Foto / JPG de carta", control: "file", show: () => true },
    {
      section: "Imagen",
      key: "fullCardPhoto",
      label: "JPG de carta completa (solo marco HTML)",
      control: "check",
      show: (c) => Boolean(c.photo),
    },
    { section: "Imagen", key: "photoZoom", label: "Zoom de la foto", control: "range", min: 1, max: 4, step: 0.01, show: () => true },
    { section: "Imagen", key: "photoX", label: "Foto horizontal", control: "range", min: -1600, max: 1600, step: 1, show: () => true },
    { section: "Imagen", key: "photoY", label: "Foto vertical", control: "range", min: -1600, max: 1600, step: 1, show: () => true },
    { section: "Imagen", key: "showSplash", label: "Mostrar esquina", control: "check", show: (c) => familyOf(c) === "hero" && !c.fullCardPhoto },
    { section: "Imagen", key: "starSplash", label: "Esquina en estrella", control: "check", show: (c) => familyOf(c) === "hero" && !c.fullCardPhoto },
    { section: "Imagen", key: "headshot", label: "Retrato de esquina", control: "file", show: (c) => familyOf(c) === "hero" && !c.fullCardPhoto },
    { section: "Imagen", key: "headZoom", label: "Zoom del retrato", control: "range", min: 0.4, max: 3, step: 0.01, show: (c) => familyOf(c) === "hero" && !c.fullCardPhoto },
    { section: "Imagen", key: "headX", label: "Retrato horizontal", control: "range", min: -200, max: 200, step: 1, show: (c) => familyOf(c) === "hero" && !c.fullCardPhoto },
    { section: "Imagen", key: "headY", label: "Retrato vertical", control: "range", min: -200, max: 200, step: 1, show: (c) => familyOf(c) === "hero" && !c.fullCardPhoto },
    { section: "Imagen", key: "cracks", label: "Grietas en el marco", control: "check", show: (c) => familyOf(c) === "villain" && !c.fullCardPhoto },

    { section: "Color", key: "aspects", label: "Atajo de aspecto", control: "aspects", wide: true, show: (c) => familyOf(c) === "hero" && !SPLIT_TYPES.has(c.type) },
    { section: "Color", key: "frame", label: "Color del marco", control: "color", show: (c) => familyOf(c) === "hero" && !SPLIT_TYPES.has(c.type) && c.aspect !== "Identidad" },
    { section: "Color", key: "frameAccent", label: "Acento del marco", control: "color", show: (c) => familyOf(c) === "hero" && !SPLIT_TYPES.has(c.type) && c.aspect !== "Identidad" },
    { section: "Color", key: "primary", label: "Color principal", control: "color", show: (c) => c.type === "identity" && c.aspect === "Identidad" },
    { section: "Color", key: "secondary", label: "Color secundario", control: "color", show: (c) => c.type === "identity" && c.aspect === "Identidad" },
    { section: "Color", key: "left", label: "Color izquierdo", control: "color", show: (c) => SPLIT_TYPES.has(c.type) },
    { section: "Color", key: "leftAccent", label: "Acento izquierdo", control: "color", show: (c) => SPLIT_TYPES.has(c.type) },
    { section: "Color", key: "right", label: "Color derecho", control: "color", show: (c) => SPLIT_TYPES.has(c.type) },
    { section: "Color", key: "rightAccent", label: "Acento derecho", control: "color", show: (c) => SPLIT_TYPES.has(c.type) },
    { section: "Color", key: "divider", label: "Divisor", control: "color", show: (c) => SPLIT_TYPES.has(c.type) },
    { section: "Color", key: "outer", label: "Color del pie", control: "color", show: (c) => c.type === "alter-ego" },
    { section: "Color", key: "outer", label: "Borde exterior", control: "color", show: (c) => familyOf(c) === "villain" },
    { section: "Color", key: "outerAccent", label: "Acento del borde", control: "color", show: (c) => familyOf(c) === "villain" },
    { section: "Color", key: "gradTop", label: "Degradado superior", control: "color", show: (c) => familyOf(c) === "villain" },
    { section: "Color", key: "gradBottom", label: "Degradado inferior", control: "color", show: (c) => familyOf(c) === "villain" },
  ];

  const sections: { name: string; fields: Field[] }[] = [];
  for (const field of SPEC) {
    if (!field.show(card)) continue;
    let section = sections.find((s) => s.name === field.section);
    if (!section) {
      section = { name: field.section, fields: [] };
      sections.push(section);
    }
    section.fields.push(field);
  }
  return sections;
}
