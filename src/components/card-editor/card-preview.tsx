"use client";

import { forwardRef, useEffect, useRef } from "react";
import type { CardData } from "@/lib/card-defaults";
import {
  BOOST_TYPES,
  COST_TYPES,
  RESOURCE_TYPES,
  SPLIT_TYPES,
  TYPES,
  familyOf,
  formatRules,
  statText,
} from "./constants";

function Stat({
  visible,
  value,
  star,
  label,
  className,
}: {
  visible: boolean;
  value: string;
  star: boolean;
  label: string;
  className: string;
}) {
  const text = statText(value, star);
  if (!visible || !text) return <div className={className} hidden />;
  return (
    <div className={className}>
      <span>{text}</span>
      <small>{label}</small>
    </div>
  );
}

export const CardPreview = forwardRef<
  HTMLElement,
  {
    card: CardData;
    zoom?: number;
    maxHeight?: number;
    hideArt?: boolean;
  }
>(function CardPreview({ card, zoom, maxHeight, hideArt = false }, ref) {
  const meta = TYPES[card.type] || TYPES.event;
  const family = familyOf(card);
  const photoRef = useRef<HTMLImageElement>(null);
  const localCardRef = useRef<HTMLElement | null>(null);
  const nativeH = meta.landscape ? 1500 : 2150;
  const resolvedZoom = maxHeight ? maxHeight / nativeH : (zoom ?? 0.34);
  /** Alter-ego keeps the HTML mask always on; print JPG is only a toggleable underlay. */
  const maskedLayout = card.type === "alter-ego";
  const showPhoto = Boolean(card.photo) && !hideArt;
  const fullCard = Boolean(card.fullCardPhoto) && !hideArt && !maskedLayout;
  const printUnderlay = maskedLayout && showPhoto && Boolean(card.fullCardPhoto);

  function setCardRef(el: HTMLElement | null) {
    localCardRef.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  }

  useEffect(() => {
    const img = photoRef.current;
    const cardEl = localCardRef.current;
    if (!img || !cardEl) return;
    if (!showPhoto) {
      img.removeAttribute("src");
      img.classList.remove("is-placed");
      img.style.width = "";
      img.style.height = "";
      return;
    }
    if (fullCard || printUnderlay) {
      // CSS covers the full face; only ensure src is set.
      img.classList.add("is-placed");
      if (img.src !== card.photo) img.src = card.photo;
      return;
    }
    const place = () => {
      const wrap = img.parentElement;
      if (!wrap || !img.naturalWidth) return;
      const cover = Math.max(wrap.offsetWidth / img.naturalWidth, wrap.offsetHeight / img.naturalHeight);
      const width = img.naturalWidth * cover;
      const height = img.naturalHeight * cover;
      img.style.width = `${width}px`;
      img.style.height = `${height}px`;
      cardEl.style.setProperty("--ox", String((wrap.offsetWidth - width) / 2));
      cardEl.style.setProperty("--oy", String((wrap.offsetHeight - height) / 2));
      img.classList.add("is-placed");
    };
    img.onload = place;
    if (img.src !== card.photo) {
      img.classList.remove("is-placed");
      img.src = card.photo;
    } else if (img.complete) place();
  }, [card.photo, card.photoZoom, card.photoX, card.photoY, card.type, showPhoto, fullCard, printUnderlay]);

  const rulesLen = card.rules.length;
  const boostCount = Number(card.boosts) || 0;
  const attachBits = [card.attAtk && `ATK ${card.attAtk}`, card.attSch && `SCH ${card.attSch}`].filter(Boolean);

  return (
    <div className={`fit${meta.landscape ? " is-landscape" : ""}`} style={{ ["--zoom" as string]: resolvedZoom }}>
      <div className="scale">
        <article
          ref={setCardRef}
          className={[
            "card",
            card.starSplash ? "is-star" : "",
            card.darkText ? "is-dark-text" : "",
            card.type === "identity" && card.aspect === "Identidad" ? "is-dual" : "",
            hideArt ? "is-plain-art" : "",
            fullCard ? "is-full-card" : "",
            printUnderlay ? "is-print-underlay" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          data-type={card.type}
          data-family={family}
          data-cracks={family === "villain" && card.cracks ? "on" : "off"}
          style={{
            ["--left" as string]: card.left,
            ["--left-accent" as string]: card.leftAccent,
            ["--right" as string]: card.right,
            ["--right-accent" as string]: card.rightAccent,
            ["--divider" as string]: SPLIT_TYPES.has(card.type) ? card.divider : card.left,
            ["--outer" as string]: card.outer,
            ["--outer-accent" as string]: card.outerAccent,
            ["--grad-top" as string]: card.gradTop,
            ["--grad-bottom" as string]: card.gradBottom,
            ["--ae-bottom" as string]: card.outer,
            ["--px" as string]: card.photoX,
            ["--py" as string]: card.photoY,
            ["--pz" as string]: Math.max(1, Number(card.photoZoom) || 1),
            ["--hx" as string]: card.headX,
            ["--hy" as string]: card.headY,
            ["--hz" as string]: card.headZoom,
          }}
        >
          <div className="card__window">
            <div className="card__photo-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="card__photo" alt="" ref={photoRef} />
              <div className="card__art" />
            </div>
            <div className="card__fade" />
          </div>
          <div className="card__frame" aria-hidden />
          <div className="card__ae-accent" hidden={card.type !== "alter-ego"} aria-hidden>
            <div className="card__ae-accent-tex" />
            <div className="card__ae-accent-tint" />
          </div>
          <div className="card__split" hidden={!SPLIT_TYPES.has(card.type)} />
          <div className="card__cracks" hidden={!(family === "villain" && card.cracks)} />
          <h2 className={`card__title${!card.title ? " is-empty" : ""}`}>{card.title || "Título"}</h2>
          <p className="card__subtitle" hidden={!(card.type === "ally" && card.subtitle)}>
            {card.subtitle}
          </p>
          <div className="card__cost" hidden={!(COST_TYPES.has(card.type) && (card.cost || card.costStar))}>
            {statText(card.cost, card.costStar)}
          </div>
          <Stat
            className="card__stat card__stat--thw"
            visible={["ally", "identity", "minion", "villain"].includes(card.type)}
            value={card.thw}
            star={card.thwStar}
            label={card.type === "identity" || card.type === "ally" ? "THW" : "SCH"}
          />
          <Stat
            className="card__stat card__stat--atk"
            visible={["ally", "identity", "minion", "villain"].includes(card.type)}
            value={card.atk}
            star={card.atkStar}
            label="ATK"
          />
          <Stat
            className="card__stat card__stat--def"
            visible={card.type === "identity"}
            value={card.def}
            star={card.defStar}
            label="DEF"
          />
          <Stat
            className="card__stat card__stat--rec"
            visible={card.type === "alter-ego"}
            value={card.rec}
            star={card.recStar}
            label="REC"
          />
          <div className="card__type">{card.typeLabel || meta.typeText}</div>
          <div className="card__plate">
            <p className="card__traits">{card.traits}</p>
            <div
              className={`card__rules${rulesLen > 220 && rulesLen <= 420 ? " is-tight" : ""}${rulesLen > 420 ? " is-dense" : ""}`}
              dangerouslySetInnerHTML={{ __html: formatRules(card.rules) }}
            />
            <p className="card__quote" hidden={!card.quote}>
              {card.quote}
            </p>
          </div>
          <div className="card__hp" hidden={!(["ally", "minion", "villain"].includes(card.type) && card.hp)}>
            {card.hp}
          </div>
          <div
            className="card__meta"
            hidden={!(["identity", "alter-ego"].includes(card.type) && (card.handSize || card.identityHp))}
          >
            <div>
              <b className="card__hand">{card.handSize}</b>
              <small className="card__hand-label">
                {card.type === "identity" || card.type === "alter-ego" ? "Hand size" : "Mano"}
              </small>
            </div>
            <div>
              <b className="card__hpmeta">{card.identityHp}</b>
              <small className="card__hp-label">
                {card.type === "identity" || card.type === "alter-ego" ? "Hit points" : "PV"}
              </small>
            </div>
          </div>
          <div className="card__resources">
            {RESOURCE_TYPES.has(card.type)
              ? card.resources
                  .filter((kind) => kind && kind !== "none")
                  .map((kind, i) => <i key={`${kind}-${i}`} className={`pip pip--${kind}`} />)
              : null}
          </div>
          <div
            className="card__splash"
            hidden={!(family === "hero" && card.showSplash && !meta.landscape)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {card.headshot ? <img className="card__headshot" alt="" src={card.headshot} /> : <img className="card__headshot" alt="" />}
          </div>
          <div className="card__stage" hidden={!(card.type === "villain" && card.stage)}>
            {card.stage}
          </div>
          <div
            className="card__threat"
            hidden={!(["side-scheme", "main-scheme", "player-scheme"].includes(card.type) && card.threat)}
          >
            {card.threat}
          </div>
          <div className="card__scheme-no" hidden={!(card.type === "main-scheme" && card.schemeNo)}>
            {card.schemeNo}
          </div>
          <div
            className="card__boosts"
            hidden={!((BOOST_TYPES.has(card.type) || card.type === "side-scheme") && (boostCount || card.boostStar))}
          >
            {Array.from({ length: boostCount }).map((_, i) => (
              <i key={i} />
            ))}
            {card.boostStar ? <b>★</b> : null}
          </div>
          <div className="card__attach" hidden={!(card.type === "attachment" && attachBits.length)}>
            {attachBits.join("  ")}
          </div>
          <p className="card__set">{card.setLine}</p>
          <p className="card__copy">{card.copyright}</p>
        </article>
      </div>
    </div>
  );
});
