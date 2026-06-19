"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon, StatusBadge } from "@/app/components/ui";
import { type GalleryCategory } from "@/app/lib/local-store";

const categories: Array<{ value: "all" | GalleryCategory; label: string }> = [
  { value: "all", label: "All" },
  { value: "activities", label: "Activities" },
  { value: "visits", label: "Personality visits" },
  { value: "celebrations", label: "Celebrations" },
  { value: "maintenance", label: "Maintenance" },
  { value: "community", label: "Community" }
];

interface GalleryItem {
  id: string;
  title: string;
  caption: string;
  category: GalleryCategory;
  eventDate: string;
  imageName: string;
  imageUrl: string;
  featured: boolean;
  publishedAt: string;
}

export function PublicGalleryClient() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [category, setCategory] = useState<"all" | GalleryCategory>("all");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    fetch("/api/gallery", { cache: "no-store" })
      .then((res) => res.ok ? res.json() : { items: [] })
      .then((payload) => setItems(payload.items || []))
      .catch(() => setItems([]));
  }, []);

  const filtered = useMemo(() => {
    return category === "all" ? items : items.filter((item) => item.category === category);
  }, [category, items]);

  useEffect(() => {
    setActiveIndex(0);
  }, [category]);

  const active = filtered[activeIndex] || filtered[0] || null;

  function move(step: number) {
    if (!filtered.length) return;
    setActiveIndex((current) => (current + step + filtered.length) % filtered.length);
  }

  return (
    <>
      <section className="pub-page-header">
        <div className="eyebrow-pub">Society memories</div>
        <h1>Gallery</h1>
        <p className="ph-sub">Activities, visits, celebrations and public moments shared by the Management Committee.</p>
      </section>

      <section className="pub-section gallery-page">
        <div className="gallery-filter-row">
          <div className="chips" aria-label="Gallery category filters">
            {categories.map((item) => (
              <button
                key={item.value}
                className={`chip${category === item.value ? " on" : ""}`}
                onClick={() => setCategory(item.value)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="tiny">{filtered.length} public post{filtered.length === 1 ? "" : "s"}</div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state gallery-empty">
            <div className="glyph"><Icon name="image" size={22} /></div>
            <h3>No gallery posts yet</h3>
            <p>Photos published by the MC will appear here for residents and visitors.</p>
          </div>
        ) : (
          <>
            <div className="gallery-carousel">
              <div className="gallery-carousel-media">
                <img src={active?.imageUrl} alt={active?.title || "Gallery image"} />
                <div className="gallery-carousel-controls">
                  <button className="btn-icon gallery-nav-btn" onClick={() => move(-1)} aria-label="Previous image" type="button">
                    <Icon name="arr_l" size={18} color="#fff" />
                  </button>
                  <button className="btn-icon gallery-nav-btn" onClick={() => move(1)} aria-label="Next image" type="button">
                    <Icon name="arr_r" size={18} color="#fff" />
                  </button>
                </div>
              </div>
              <div className="gallery-carousel-copy">
                <StatusBadge status={labelForCategory(active?.category || "activities")} />
                <h2>{active?.title}</h2>
                <p>{active?.caption}</p>
                <div className="gallery-meta">
                  {active?.eventDate
                    ? new Date(`${active.eventDate}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                    : ""}
                </div>
              </div>
            </div>

            <div className="gallery-grid">
              {filtered.map((item, index) => (
                <button
                  key={item.id}
                  className={`gallery-card${active?.id === item.id ? " active" : ""}`}
                  onClick={() => setActiveIndex(index)}
                  type="button"
                >
                  <img src={item.imageUrl} alt={item.title} />
                  <div className="gallery-card-copy">
                    <div className="gallery-card-title">{item.title}</div>
                    <div className="gallery-card-caption">{item.caption}</div>
                    <div className="gallery-card-meta">{labelForCategory(item.category)}</div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}

function labelForCategory(category: GalleryCategory) {
  return categories.find((item) => item.value === category)?.label || category;
}
