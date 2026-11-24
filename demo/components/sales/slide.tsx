import { asset } from "@/lib/asset";
import { BRAND_NAME } from "@/lib/mock-data";
import { CONTACT, type Card, type Slide, type Stat } from "@/lib/sales";

const pad2 = (n: number) => String(n + 1).padStart(2, "0");

/** Grid columns come from the item count, so a row always fills its width. */
const cols = (n: number) => ({ "--cols": n }) as React.CSSProperties;

function Eyebrow({ text }: { text: string }) {
  // The uppercase style would turn the company name into capitals, so any
  // eyebrow that carries it stays in mixed case.
  const mixed = text.includes(BRAND_NAME);
  return <p className={`s-eyebrow${mixed ? " s-eyebrow--mixed" : ""}`}>{text}</p>;
}

function Heading({ slide }: { slide: Slide }) {
  const { lead, accent } = slide.title;
  const Tag = slide.kind === "cover" ? "h1" : "h2";
  return (
    <Tag className={`s-title${slide.kind ? " s-title--big" : ""}`}>
      {lead}
      {accent && (
        <>
          {" "}
          <em>{accent}</em>
        </>
      )}
    </Tag>
  );
}

function CardGrid({ cards, numbered }: { cards: Card[]; numbered?: boolean }) {
  return (
    <ul className="s-grid" style={cols(cards.length)}>
      {cards.map((c, i) => (
        <li key={c.title} className={`s-card${c.hero ? " s-card--hero" : ""}`}>
          {numbered && <span className="s-num">{pad2(i)}</span>}
          <h3 className="s-card-title">{c.title}</h3>
          {c.body && <p className="s-body">{c.body}</p>}
          {c.tag && <p className="s-tag">{c.tag}</p>}
        </li>
      ))}
    </ul>
  );
}

function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <ul className="s-grid" style={cols(stats.length)}>
      {stats.map((s) => (
        <li key={s.value} className={`s-card s-stat${s.hero ? " s-card--hero" : ""}`}>
          <p className="s-stat-value">{s.value}</p>
          <p className="s-stat-label">{s.label}</p>
          {s.body && <p className="s-body">{s.body}</p>}
        </li>
      ))}
    </ul>
  );
}

function Body({ slide }: { slide: Slide }) {
  return (
    <>
      {slide.label && <p className="s-label">{slide.label}</p>}
      {slide.stats && <StatGrid stats={slide.stats} />}
      {slide.cards && <CardGrid cards={slide.cards} numbered={slide.numbered} />}
      {slide.pillars && (
        <ul className="s-grid" style={cols(slide.pillars.length)}>
          {slide.pillars.map((p, i) => (
            <li key={p.name} className="s-card">
              <span className="s-num">{pad2(i)}</span>
              <p className="s-pillar-name">{p.name}</p>
              <h3 className="s-card-title">{p.line}</h3>
              <p className="s-body">{p.body}</p>
              <ul className="s-chips">
                {p.tags.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
      {slide.leaders && (
        <div className="s-leaders">
          <p className="s-label">{slide.leaders.label}</p>
          <p className="s-body">{slide.leaders.line}</p>
          <ul className="s-people" style={cols(slide.leaders.people.length)}>
            {slide.leaders.people.map((p) => (
              <li key={p.name}>
                <p className="s-person">{p.name}</p>
                <p className="s-body">{p.role}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      {slide.band && (
        <p className="s-band">
          {slide.band.text} <em>{slide.band.accent}</em>
        </p>
      )}
      {slide.closing && <p className="s-band">{slide.closing}</p>}
      {slide.signature && <p className="s-signature">{slide.signature}</p>}
      {slide.source && <p className="s-source">{slide.source}</p>}
    </>
  );
}

function Mark() {
  // Dark slides only: the teal mark is the approved asset for navy grounds.
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="s-mark" src={asset("/brand/hearfy-mark.svg")} alt={`${BRAND_NAME} mark`} />;
}

export function SalesSlide({ slide }: { slide: Slide }) {
  return (
    <section id={slide.id} className={`s-slide s-slide--${slide.tone}${slide.kind ? ` s-slide--${slide.kind}` : ""}`}>
      {slide.kind && <Mark />}
      <div className="s-main">
        <header>
          <Eyebrow text={slide.eyebrow} />
          <Heading slide={slide} />
          {slide.lede && <p className="s-lede">{slide.lede}</p>}
          {slide.ask && <p className="s-lede">{slide.ask}</p>}
        </header>
        <Body slide={slide} />
      </div>
      {slide.footer && (
        <footer className="s-footer">
          <span>{slide.footer[0]}</span>
          <span>{slide.footer[1]}</span>
        </footer>
      )}
      {slide.kind === "close" && (
        <footer className="s-footer">
          <span>
            {CONTACT.name} · <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> · {CONTACT.site}
          </span>
        </footer>
      )}
    </section>
  );
}
