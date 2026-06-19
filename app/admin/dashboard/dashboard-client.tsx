"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon, StatusBadge } from "@/app/components/ui";
import { ensureLocalStore, sortedNotices, type LocalDocument, type LocalNotice, type LocalStore } from "@/app/lib/local-store";

const primaryActions = [
  {
    href: "/admin/notices",
    icon: "bell",
    title: "Publish a Notice",
    desc: "Post a new notice for all members or selected flats. Members will see it on the website notification bell and notices page."
  },
  {
    href: "/admin/gallery",
    icon: "image",
    title: "Post Gallery Photos",
    desc: "Upload public photos with captions for activities, visits, celebrations and community updates."
  },
  {
    href: "/admin/records",
    icon: "folder",
    title: "Upload AGM Minutes",
    desc: "Upload AGM notices, agendas, minutes, resolutions and related documents."
  },
  {
    href: "/admin/records",
    icon: "audit",
    title: "Upload Audit Reports",
    desc: "Upload audit reports, annual returns, accounts and financial statements."
  }
];

export function AdminDashboardClient() {
  const [store, setStore] = useState<LocalStore | null>(null);

  useEffect(() => {
    ensureLocalStore().then(setStore);
  }, []);

  if (!store) return <div className="loading-pad">Loading MC dashboard...</div>;

  const notices = sortedNotices(store);
  const documents = store.documents || [];
  const recentNotices = notices.slice(0, 5);
  const recentDocuments = documents.slice(0, 5);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>MC Dashboard</h1>
          <div className="sub">Use this space for the two main jobs: publish notices and upload official records.</div>
        </div>
      </div>

      <div className="page-body" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div className="grid g3">
          {primaryActions.map((action) => (
            <Link key={action.title} href={action.href} className="tile-card" style={{ textDecoration: "none" }}>
              <div className="tile-icon">
                <Icon name={action.icon} size={20} color="var(--navy)" />
              </div>
              <div className="tile-title">{action.title}</div>
              <p className="tile-desc">{action.desc}</p>
              <div style={{ marginTop: "auto", color: "var(--saffron)", fontSize: 13, fontWeight: 600 }}>
                Open <Icon name="arr_r" size={13} color="var(--saffron)" />
              </div>
            </Link>
          ))}
        </div>

        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
          <RecentNotices notices={recentNotices} />
          <RecentDocuments documents={recentDocuments} />
        </div>

        <div className="card pad" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <Icon name="bell" size={18} color="var(--saffron)" />
          <div>
            <div style={{ fontWeight: 600, color: "var(--navy)", marginBottom: 4 }}>Website notifications only</div>
            <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
              Notices published here appear after member login through the notification bell and the Notices page.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentNotices({ notices }: { notices: LocalNotice[] }) {
  return (
    <div className="card table-wrap">
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 600 }}>Recent Notices</div>
        <Link href="/admin/notices" className="btn btn-sm btn-ghost" style={{ textDecoration: "none" }}>Manage</Link>
      </div>
      {notices.length === 0 ? (
        <div className="empty-state" style={{ border: 0 }}>No notices have been published yet.</div>
      ) : (
        <table className="tbl">
          <tbody>
            {notices.map((notice) => (
              <tr key={notice.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{notice.title}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>
                    {new Date(notice.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                </td>
                <td><StatusBadge status={notice.pinned ? "Pinned" : "Published"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function RecentDocuments({ documents }: { documents: LocalDocument[] }) {
  return (
    <div className="card table-wrap">
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontWeight: 600 }}>Recent Uploads</div>
        <Link href="/admin/records" className="btn btn-sm btn-ghost" style={{ textDecoration: "none" }}>Upload</Link>
      </div>
      {documents.length === 0 ? (
        <div className="empty-state" style={{ border: 0 }}>No AGM minutes, audit reports or records have been uploaded yet.</div>
      ) : (
        <table className="tbl">
          <tbody>
            {documents.map((document) => (
              <tr key={document.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{document.title}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>{document.fileName}</div>
                </td>
                <td><StatusBadge status={document.visibility} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
