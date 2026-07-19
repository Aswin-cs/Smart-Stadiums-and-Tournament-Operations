'use client';
import styles from '../../organiser/organiser.module.css';

export default function OrganiserWasteManagement({ bins, handleDeployStaffToBin }) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>
          <span className={`${styles.panelDot} ${styles.bgGreen}`}></span>
          GenAI Sustainability & Transportation Intelligence
        </h2>
      </div>
      <div className={styles.gateList}>
        {bins.map((b, i) => (
          <div key={i} className={styles.gateItemWrapper}>
            <div className={styles.gateItem}>
              <div className={styles.gateInfo}>
                <p className={styles.gateTitle}>{b.id} - {b.location}</p>
                <p className={styles.gateFlow}>Fill Level: {b.fillLevel}%</p>
              </div>
              <div className={styles.gateActions}>
                <span className={styles.statusBadge} data-status={b.fillLevel > 80 ? 'CONGESTED' : 'OPEN'}>
                  {b.fillLevel > 80 ? 'FULL' : 'OK'}
                </span>
                <button 
                  className={styles.gateBtn}
                  onClick={() => handleDeployStaffToBin(b.id)}
                >
                  Deploy Staff
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
