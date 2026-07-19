'use client';
import styles from '../../organiser/organiser.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function OrganiserStatsRow({ displayStats }) {
  return (
    <div className={styles.statsRow}>
      {displayStats.map((s, i) => (
        <div key={i} className={styles.statCard}>
          <div className={styles.statTop}>
            <span className={styles.statIcon}>
              <FontAwesomeIcon icon={s.icon} style={{ color: s.iconColor }} />
            </span>
            <span className={styles.statTrend} style={{ color: s.trendColor, borderColor: s.trendColor + '44', backgroundColor: s.trendColor + '11' }}>{s.trend}</span>
          </div>
          <div className={styles.statValueRow}>
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statSub}>{s.sub}</span>
          </div>
          <div className={styles.statLabel}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}
