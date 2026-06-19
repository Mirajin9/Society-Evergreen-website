"use client";

import { FormEvent, useEffect, useState } from "react";
import { Icon, PageHead, StatusBadge } from "@/app/components/ui";
import { getSession, type GalleryCategory } from "@/app/lib/local-store";
import { MAX_IMAGES_PER_POST, MAX_IMAGE_SIZE } from "@/app/lib/gallery";

const categories: Array<{ value: GalleryCategory; label: string }> = [
  { value: "activities", label: "Activities" },
  { value: "visits", label: "Personality visits" },
  { value: "celebrations", label: "Celebrations" },
  { value: "maintenance", label: "Maintenance" },
  { value: "community", label: "Community" }
];

interface GalleryImage {
  imageUrl: string;
  storagePath: string;
  imageName: string;
  mimeType: string;
  sizeBytes: number;
}

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
  storagePath: string;
  images: GalleryImage[];
  featured: boolean;
  publishedAt: string;
}

export function AdminGalleryClient() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string>("");
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
      setGalleryItems((payload.items || []).map(withImages));
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
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const files = form.getAll("images").filter((entry): entry is File => entry instanceof File && entry.size > 0);
    const title = String(form.get("title") || "").trim();
    const caption = String(form.get("caption") || "").trim();

    if (!title || !caption) {
      setError("Add both a title and caption.");
      return;
    }
    if (files.length === 0) {
      setError("Choose at least one image to upload.");
      return;
    }
    if (files.length > MAX_IMAGES_PER_POST) {
      setError(`Add up to ${MAX_IMAGES_PER_POST} images per post.`);
      return;
    }
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setError("Gallery uploads must be image files.");
        return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setError("Keep each image or GIF below 8 MB.");
        return;
      }
    }

    const session = getSession();
    form.set("actor", session ? `${session.username} / Flat ${session.flatNo}` : "MC user");
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/gallery", { method: "POST", body: form });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || "Could not publish gallery post.");
      const item = withImages(payload.item);
      setGalleryItems((current) => [item, ...current].sort(sortGalleryItems));
      setNotice(
        `${item.title} posted with ${item.images.length} photo${item.images.length === 1 ? "" : "s"}.`
      );
      formEl.reset();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function deletePost(item: GalleryItem) {
    if (!window.confirm(`Delete the entire post "${item.title}" and all ${item.images.length} photo${item.images.length === 1 ? "" : "s"}? This cannot be undone.`)) {
      return;
    }
    await runDelete(item.id, { id: item.id }, () => {
      setGalleryItems((current) => current.filter((entry) => entry.id !== item.id));
      setNotice(`Deleted post "${item.title}".`);
    });
  }

  async function deleteImage(item: GalleryItem, image: GalleryImage) {
    if (item.images.length === 1) {
      await deletePost(item);
      return;
    }
    if (!window.confirm(`Remove this photo from "${item.title}"?`)) return;
    await runDelete(item.id, { id: item.id, storagePath: image.storagePath }, (payload) => {
      if (payload?.deleted || !payload?.item) {
        setGalleryItems((current) => current.filter((entry) => entry.id !== item.id));
      } else {
        const updated = withImages(payload.item);
        setGalleryItems((current) => current.map((entry) => (entry.id === item.id ? updated : entry)));
      }
      setNotice(`Removed a photo from "${item.title}".`);
    });
  }

  async function runDelete(id: string, body: Record<string, unknown>, onDone: (payload: any) => void) {
    setNotice("");
    setError("");
    setBusyId(id);
    try {
      const res = await fetch("/api/admin/gallery", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || "Could not delete.");
      onDone(payload);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId("");
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
            <div className="eyebrow">Post gallery photos</div>
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
              <label className="fl">Photos</label>
              <input className="field" name="images" type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple required />
              <div className="auth-note">Select one or more photos (hold Ctrl/Cmd to pick several). JPG, PNG, WebP or GIF, up to {MAX_IMAGES_PER_POST} per post. Public visitors will see them with the caption.</div>
            </div>
            <div>
              <label className="fl">Caption</label>
              <textarea className="field" name="caption" rows={5} placeholder="Short description of the activity, visitor or occasion." required />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <input name="featured" type="checkbox" />
              Feature this post in the carousel
            </label>
            <button className="btn btn-primary" style={{ alignSelf: "flex-start" }} disabled={submitting}>
              <Icon name="image" size={15} color="#fff" />
              {submitting ? "Publishing..." : "Publish to gallery"}
            </button>
          </form>

          <div className="card table-wrap">
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600 }}>Public gallery posts</div>
                <div className="tiny" style={{ marginTop: 4 }}>{galleryItems.length} post{galleryItems.length === 1 ? "" : "s"} · {featuredCount} featured in carousel</div>
              </div>
              <StatusBadge status="Public" />
            </div>
            <table className="tbl gallery-admin-table">
              <thead><tr><th>Cover</th><th>Post</th><th>Category</th><th>Date</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {galleryItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="gallery-admin-cover">
                        <img className="gallery-admin-thumb" src={item.imageUrl} alt={item.title} />
                        {item.images.length > 1 && (
                          <span className="gallery-count-badge">{item.images.length}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.title}</div>
                      <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>{item.caption.slice(0, 100)}{item.caption.length > 100 ? "..." : ""}</div>
                      {item.images.length > 1 && (
                        <div className="gallery-admin-strip">
                          {item.images.map((image) => (
                            <div key={image.storagePath} className="gallery-admin-chip">
                              <img src={image.imageUrl} alt={image.imageName} />
                              <button
                                type="button"
                                className="gallery-chip-del"
                                title="Remove this photo"
                                aria-label="Remove this photo"
                                disabled={busyId === item.id}
                                onClick={() => deleteImage(item, image)}
                              >
                                <Icon name="x" size={11} color="#fff" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>{labelForCategory(item.category)}</td>
                    <td>{new Date(`${item.eventDate}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td><StatusBadge status={item.featured ? "Featured" : "Published"} /></td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm gallery-del-btn"
                        disabled={busyId === item.id}
                        onClick={() => deletePost(item)}
                      >
                        <Icon name="trash" size={13} color="var(--flag-green)" />
                        {busyId === item.id ? "..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {galleryItems.length === 0 && <div className="empty-state" style={{ border: 0 }}>No gallery posts yet.</div>}
          </div>
        </div>
      </div>
    </>
  );
}

function labelForCategory(category: GalleryCategory) {
  return categories.find((item) => item.value === category)?.label || category;
}

function withImages(raw: any): GalleryItem {
  const images: GalleryImage[] = Array.isArray(raw?.images) && raw.images.length
    ? raw.images
    : [
        {
          imageUrl: raw?.imageUrl,
          storagePath: raw?.storagePath || "",
          imageName: raw?.imageName || "image",
          mimeType: raw?.mimeType || "image/jpeg",
          sizeBytes: raw?.sizeBytes || 0
        }
      ];
  const cover = images[0];
  return { ...raw, images, imageUrl: cover.imageUrl, storagePath: cover.storagePath };
}

function sortGalleryItems(a: GalleryItem, b: GalleryItem) {
  if (a.featured !== b.featured) return a.featured ? -1 : 1;
  return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
}
