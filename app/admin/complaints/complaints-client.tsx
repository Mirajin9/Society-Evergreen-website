"use client";

import { useEffect, useState } from "react";
import { PageHead } from "@/app/components/ui";
import { ensureLocalStore } from "@/app/lib/local-store";

export function AdminComplaintsClient() {
  const [categories, setCategories] = useState<string[]>([]);
  useEffect(() => {
    ensureLocalStore().then((store) => setCategories(store.complaintCategories));
  }, []);
  return (
    <>
      <PageHead title="Complaints" sub="Grievance categories are scaffolded; submission workflow comes next." breadcrumb="ADMIN - COMPLAINTS" />
      <div className="page-body">
        <div className="grid g3">
          {categories.map((category) => <div className="card pad" key={category}>{category}</div>)}
        </div>
      </div>
    </>
  );
}
