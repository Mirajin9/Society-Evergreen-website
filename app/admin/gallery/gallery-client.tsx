"use client";

import { FormEvent, useEffect, useState } from "react";
import { Icon, PageHead, StatusBadge } from "@/app/components/ui";
import { getSession, type GalleryCategory } from "@/app/lib/local-store";

const categories: Array<{ value: GalleryCategory; label: string }> = [
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
  mimeType: string;
  sizeBytes: number;
  imageUrl: string;
  featured: boolean;
  publishedAt: string;
}

export function AdminGalleryClient() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadGallery();
  }, []);

  async function loadGallery() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/gallery", { cache: "no-store" });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || "Could not load gallery.");
      setGalleryItems(payload.items || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setError("");
    const form = new FormData(event.currentTarget);
    const file = form.get("image") as File | null;
    const title = String(form.get("title") || "").trim();
    const caption = String(form.get("caption") || "").trim();

    if (!title || !caption) {
      setError("Add both a title and caption.");
      return;
    }
    if (!file || file.size === 0) {
      setError("Choose an image to upload.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Gallery uploads must be image files.");
      return;
    }
    if (file.size > 4_000_000) {
      setError("Keep gallery images below 4 MB for this rollout.");
      return;
    }

    const session = getSession();
    form.set("actor", session ? `${session.username} / Flat ${session.flatNo}` : "MC user");
    try {
      const res = await fetch("/api/admin/gallery", { method: "POST", body: form });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || "Could not publish gallery image.");
      setGalleryItems((current) => [payload.item, ...current].sort(sortGalleryItems));
      setNotice(`${payload.item.title} posted to the public gallery.`);
      event.currentTarget.reset();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (loading) return <div className="loading-pad">Loading gallery...</div>;

  const featuredCount = galleryItems.filter((item) => item.featured).length;

  return (
    <>
      <PageHead
        title="Gallery"
        sub="Upload public images with short captions for society activities, visits and community moments."
        breadcrumb="MC - GALLERY"
      />
      <div className="page-body">
        {notice && <div className="success-box" style={{ marginBottom: 14 }}>{notice}</div>}
        {error && <div className="error-box" style={{ marginBottom: 14 }}>{error}</div>}

        <div className="grid" style={{ gridTemplateColumns: "0.9fr 1.3fr", gap: 24, alignItems: "start" }}>
          <form className="card pad-lg stack" onSubmit={publish}>
            <div className="eyebrow">Post gallery image</div>
            <div>
              <label className="fl">Title</label>
              <input className="field" name="title" placeholder="e.g. Republic Day celebration" required />
            </div>
            <div>
              <label className="fl">Category</label>
              <select className="field" name="category" defaultValue="activities">
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="fl">Date</label>
              <input className="field" name="eventDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
            </div>
            <div>
              <label className="fl">Image</label>
              <input className="field" name="image" type="file" accept="image/png,image/jpeg,image/webp" required />
              <div className="auth-note">Use JPG, PNG or WebP. Public visitors will see the image and caption.</div>
            </div>
            <div>
              <label className="fl">Caption</label>
              <textarea className="field" name="caption" rows={5} placeholder="Short description of the activity, visitor or occasion." required />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <input name="featured" type="checkbox" />
              Feature this post in the carousel
            </label>
            <button className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
              <Icon name="image" size={15} color="#fff" />
              Publish to gallery
            </button>
          </form>

          <div className="card table-wrap">
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600 }}>Public gallery posts</div>
                <div className="tiny" style={{ marginTop: 4 }}>{featuredCount} featured in carousel</div>
              </div>
              <StatusBadge status="Public" />
            </div>
            <table className="tbl gallery-admin-table">
              <thead><tr><th>Image</th><th>Post</th><th>Category</th><th>Date</th><th>Status</th></tr></thead>
              <tbody>
                {galleryItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <img className="gallery-admin-thumb" src={item.imageUrl} alt={item.title} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.title}</div>
                      <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>{item.caption.slice(0, 100)}{item.caption.length > 100 ? "..." : ""}</div>
                      <div className="mono" style={{ color: "var(--muted)", fontSize: 11, marginTop: 4 }}>{item.imageName} - {formatSize(item.sizeBytes || 0)}</div>
                    </td>
                    <td>{labelForCategory(item.category)}</td>
                    <td>{new Date(`${item.eventDate}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td><StatusBadge status={item.featured ? "Featured" : "Published"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {galleryItems.length === 0 && <div className="empty-state" style={{ border: 0 }}>No gallery images posted yet.</div>}
          </div>
        </div>
      </div>
    </>
  );
}

function labelForCategory(category: GalleryCategory) {
  return categories.find((item) => item.value === category)?.label || category;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function sortGalleryItems(a: GalleryItem, b: GalleryItem) {
  if (a.featured !== b.featured) return a.featured ? -1 : 1;
  return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
}
