'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.wrapper}>
      {/* Layer 1 — Animated background (::before pseudo, z-index: 0) */}
      <div className={styles.bgCanvas}>
        <div className={styles.bgGlow1}></div>
        <div className={styles.bgGlow2}></div>
        <div className={styles.bgGlow3}></div>
        <div className={styles.pitchLines}></div>
        <div className={styles.particles}>
          {[...Array(20)].map((_, i) => (
            <span key={i} className={styles.particle} style={{ '--i': i }}></span>
          ))}
        </div>
      </div>

      {/* Layer 3 — All content (above trophy) */}

      {/* Top Trophy Header */}
      <div className={styles.trophyHeader}>
        <Image priority src="/trophy.svg" alt="FIFA World Cup Trophy" width={100} height={100} className={styles.trophyHeaderImg} />
      </div>

      {/* Top Badge */}
      <div className={styles.topBadge}>
        <span className={styles.badgeDot}></span>
        FIFA WORLD CUP 2026™
        <span className={styles.badgeDot}></span>
      </div>

      {/* Hero content */}
      <main className={styles.hero}>

        {/* Title */}
        <div className={styles.titleBlock}>
          <p className={styles.eyebrow}>USA · CANADA · MEXICO</p>
          <h1 className={styles.mainTitle}>
            <span className={styles.titleLine1}>WORLD</span>
            <span className={styles.titleLine2}>CUP</span>
            <span className={styles.titleYear}>2026</span>
          </h1>
          <p className={styles.subtitle}>
            The biggest football tournament on Earth. Choose your role and begin your journey.
          </p>
        </div>

        {/* Profile Selector */}
        <div className={styles.profileSection}>
          <p className={styles.profileLabel}>SELECT YOUR PROFILE</p>
          <div className={styles.profileCards}>

            {/* Fan Card */}
            <Link href="/fan" className={styles.profileCard} id="btn-fan-profile">
              <div className={styles.cardGlow} data-color="fan"></div>
              <div className={styles.cardIcon}>
                <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <circle cx="30" cy="20" r="12" stroke="currentColor" strokeWidth="2.5" fill="none" />
                  <path d="M10 52 C10 38 20 32 30 32 C40 32 50 38 50 52" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  <path d="M22 38 L24 44 L30 42 L36 44 L38 38" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />
                  <path d="M18 34 Q30 40 42 34" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6" />
                </svg>
              </div>
              <div className={styles.cardContent}>
                <h2 className={styles.cardTitle}>FAN</h2>
                <p className={styles.cardDesc}>Matches · Tickets · Live Scores · Stadium Guide</p>
              </div>
              <div className={styles.cardArrow}>
                <svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div className={styles.cardShine}></div>
            </Link>

            {/* Organiser Card */}
            <Link href="/organiser" className={`${styles.profileCard} ${styles.profileCardOrg}`} id="btn-organiser-profile">
              <div className={styles.cardGlow} data-color="org"></div>
              <div className={styles.cardIcon}>
                <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <rect x="8" y="12" width="44" height="36" rx="4" stroke="currentColor" strokeWidth="2.5" fill="none" />
                  <path d="M8 22 H52" stroke="currentColor" strokeWidth="2" opacity="0.5" />
                  <path d="M20 8 V16 M40 8 V16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M18 32 H28 M18 38 H34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="40" cy="36" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
                  <path d="M37 36 L39.5 38.5 L44 33" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className={styles.cardContent}>
                <h2 className={styles.cardTitle}>ORGANISER</h2>
                <p className={styles.cardDesc}>Manage Events · Teams · Venues · Reports</p>
              </div>
              <div className={styles.cardArrow}>
                <svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div className={styles.cardShine}></div>
            </Link>
          </div>
        </div>

        {/* Host Countries */}
        <div className={styles.hostFlags}>
          <div className={styles.flagItem}>
            <span className={styles.flagEmoji}>🇺🇸</span>
            <span className={styles.flagName}>USA</span>
          </div>
          <div className={styles.flagDivider}>·</div>
          <div className={styles.flagItem}>
            <span className={styles.flagEmoji}>🇨🇦</span>
            <span className={styles.flagName}>CANADA</span>
          </div>
          <div className={styles.flagDivider}>·</div>
          <div className={styles.flagItem}>
            <span className={styles.flagEmoji}>🇲🇽</span>
            <span className={styles.flagName}>MEXICO</span>
          </div>
        </div>

      </main>
    </div>
  );
}
