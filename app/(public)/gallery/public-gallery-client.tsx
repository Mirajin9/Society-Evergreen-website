"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon, StatusBadge } from "@/app/components/ui";
import {
  ensureLocalStore,
  sortedGalleryItems,
  type GalleryCategory,
  type LocalGalleryItem
} from "@/app/lib/local-store";

const categories: Array<{ value: "all" | GalleryCategory; label: string }> = [
  { value: "all", label: "All" },
  { value: "activities", label: "Activities" },
  { value: "visits", label: "Personality visits" },
  { value: "celebrations", label: "Celebrations" },
  { value: "maintenance", label: "Maintenance" },
  { value: "community", label: "Community" }
];

interface GalleryImage {
  imageUrl: string;
  imageName: string;
}

interface GalleryItem {
  id: string;
  title: string;
  caption: string;
  category: GalleryCategory;
  eventDate: string;
  imageName: string;
  imageUrl: string;
  images: GalleryImage[];
  featured: boolean;
  publishedAt: string;
}

function withImages(raw: any): GalleryItem {
  const images: GalleryImage[] = Array.isArray(raw?.images) && raw.images.length
    ? raw.images.filter((img: any) => img?.imageUrl)
    : [{ imageUrl: raw?.imageUrl, imageName: raw?.imageName || "image" }];
  return { ...raw, images, imageUrl: images[0]?.imageUrl || raw?.imageUrl };
}

export function PublicGalleryClient() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [category, setCategory] = useState<"all" | GalleryCategory>("all");
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function loadGallery() {
      const remoteItems = await loadRemoteGallery();
      if (mounted && remoteItems.length) {
        setItems(remoteItems);
        return;
      }

      const localItems = await loadLocalGallery();
      if (mounted) setItems(localItems);
    }

    loadGallery();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return category === "all" ? items : items.filter((item) => item.category === category);
  }, [category, items]);

  useEffect(() => {
    setActiveIndex(0);
    setImageIndex(0);
  }, [category]);

  const active = filtered[activeIndex] || filtered[0] || null;
  const activeImages = active?.images || [];
  const safeImageIndex = Math.min(imageIndex, Math.max(activeImages.length - 1, 0));
  const activeImage = activeImages[safeImageIndex] || activeImages[0] || null;

  function selectPost(index: number) {
    setActiveIndex(index);
    setImageIndex(0);
  }

  // Page through the active post's photos; wrap to the next/previous post at the ends.
  function move(step: number) {
    if (!filtered.length) return;
    const total = activeImages.length;
    const next = safeImageIndex + step;
    if (total > 1 && next >= 0 && next < total) {
      setImageIndex(next);
      return;
    }
    setActiveIndex((current) => {
      const nextPost = (current + step + filtered.length) % filtered.length;
      const nextImages = filtered[nextPost]?.images || [];
      setImageIndex(step < 0 ? Math.max(nextImages.length - 1, 0) : 0);
      return nextPost;
    });
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
                <img src={activeImage?.imageUrl} alt={active?.title || "Gallery image"} />
                {activeImages.length > 1 && (
                  <span className="gallery-photo-count">{safeImageIndex + 1} / {activeImages.length}</span>
                )}
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
                {activeImages.length > 1 && (
                  <div className="gallery-thumbs" aria-label="Photos in this post">
                    {activeImages.map((image, index) => (
                      <button
                        key={image.imageUrl}
                        type="button"
                        className={`gallery-thumb${index === safeImageIndex ? " on" : ""}`}
                        onClick={() => setImageIndex(index)}
                        aria-label={`Show photo ${index + 1}`}
                      >
                        <img src={image.imageUrl} alt={image.imageName || active?.title} />
                      </button>
                    ))}
                  </div>
                )}
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
                  onClick={() => selectPost(index)}
                  type="button"
                >
                  <div className="gallery-card-media">
                    <img src={item.imageUrl} alt={item.title} />
                    {item.images.length > 1 && (
                      <span className="gallery-card-count">
                        <Icon name="image" size={12} color="#fff" /> {item.images.length}
                      </span>
                    )}
                  </div>
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

async function loadRemoteGallery() {
  try {
    const res = await fetch("/api/gallery", { cache: "no-store" });
    const payload = await res.json().catch(() => ({}));
    return res.ok ? (payload.items || []).map(withImages).filter((item: GalleryItem) => item.imageUrl) : [];
  } catch {
    return [];
  }
}

async function loadLocalGallery() {
  try {
    const store = await ensureLocalStore();
    return sortedGalleryItems(store).map(localGalleryToItem).filter((item) => item.imageUrl);
  } catch {
    return [];
  }
}

function localGalleryToItem(item: LocalGalleryItem): GalleryItem {
  const image = {
    imageUrl: item.imageDataUrl,
    imageName: item.imageName || "image"
  };
  return {
    id: item.id,
    title: item.title,
    caption: item.caption,
    category: item.category,
    eventDate: item.eventDate,
    imageName: item.imageName,
    imageUrl: item.imageDataUrl,
    images: [image],
    featured: item.featured,
    publishedAt: item.publishedAt
  };
}
