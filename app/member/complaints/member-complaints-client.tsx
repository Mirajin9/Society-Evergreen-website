"use client";

import { useEffect, useState } from "react";
import { PageHead } from "@/app/components/ui";
import { ensureLocalStore } from "@/app/lib/local-store";

export function MemberComplaintsClient() {
  const [categories, setCategories] = useState<string[]>([]);
  useEffect(() => {
    ensureLocalStore().then((store) => setCategories(store.complaintCategories));
  }, []);
  return (
    <>
      <PageHead title="Complaints" sub="Complaint submission will be wired next; categories are prepared." breadcrumb="MEMBER - COMPLAINTS" />
      <div className="page-body">
        <div className="grid g3">{categories.map((category) => <div className="card pad" key={category}>{category}</div>)}</div>
      </div>
    </>
  );
}
