"use client";

import { useEffect, useState } from "react";
import { PageHead } from "@/app/components/ui";
import { ensureLocalStore, type LocalMember } from "@/app/lib/local-store";

export function AdminCommitteeClient() {
  const [members, setMembers] = useState<LocalMember[]>([]);
  useEffect(() => {
    ensureLocalStore().then((store) => setMembers(store.members.filter((member) => member.committeeRole)));
  }, []);
  return (
    <>
      <PageHead title="Committee" sub="Current Managing Committee rows from the member database." breadcrumb="ADMIN - COMMITTEE" />
      <div className="page-body">
        <div className="card table-wrap">
          <table className="tbl">
            <thead><tr><th>Name</th><th>Designation</th><th>Flat</th></tr></thead>
            <tbody>
              {members.map((member) => <tr key={member.id}><td>{member.name}</td><td>{member.committeeRole}</td><td>{member.flatNo}</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
