"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Icon, PubLogo } from "@/app/components/ui";
import { logoutLocal } from "@/app/lib/local-store";

export interface PortalLink {
  href: string;
  label: string;
}

export function PortalTopbar({ links, homeHref }: { links: PortalLink[]; homeHref: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const showNotificationBell = homeHref.startsWith("/member");

  function isActive(href: string) {
    return pathname === href || (href !== homeHref && pathname.startsWith(href));
  }

  function logout() {
    logoutLocal();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <div className="pub-topbar">
        <Link href={homeHref} style={{ textDecoration: "none", flexShrink: 0 }}>
          <PubLogo />
        </Link>
        <nav>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`pub-nav-link${isActive(link.href) ? " active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        {showNotificationBell && (
          <Link
            href="/member/notices"
            className="pub-nav-login"
            title="Website notifications"
            aria-label="Website notifications"
            style={{ background: "rgba(255,255,255,0.14)", padding: "9px 10px" }}
          >
            <Icon name="bell" size={15} color="#fff" />
          </Link>
        )}
        <button onClick={logout} className="pub-nav-login" style={{ background: "rgba(255,255,255,0.14)" }}>
          <Icon name="lock" size={13} color="#fff" /> Logout
        </button>
        <button className="pub-hamburger" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
          <Icon name="menu" size={22} color="#fff" />
        </button>
      </div>
      <div className={`pub-mobile-menu${menuOpen ? " open" : ""}`}>
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="pub-nav-link" onClick={() => setMenuOpen(false)}>
            {link.label}
          </Link>
        ))}
        {showNotificationBell && (
          <Link href="/member/notices" className="pub-nav-link" onClick={() => setMenuOpen(false)}>
            Notifications
          </Link>
        )}
        <button className="pub-nav-login" onClick={() => { setMenuOpen(false); logout(); }}>
          <Icon name="lock" size={13} color="#fff" /> Logout
        </button>
      </div>
    </>
  );
}
