'use client';
import styles from '../../organiser/organiser.module.css';

export default function OrganiserGateStatus({ gates, activeGateManage, setActiveGateManage, handleUpdateGateDensity }) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>
          <span className={`${styles.panelDot} ${styles.bgGold}`}></span>
          Gate Status
        </h2>
      </div>
      <div className={styles.gateList}>
        {gates.map((g, i) => (
          <div key={i} className={styles.gateItemWrapper}>
            <div className={styles.gateItem}>
              <div className={styles.gateInfo}>
                <p className={styles.gateTitle}>{g.id}</p>
                <p className={styles.gateFlow}>Flow: {g.flow}</p>
              </div>
              <div className={styles.gateActions}>
                <span className={styles.statusBadge} data-status={g.status}>{g.status}</span>
                <button 
                  className={styles.gateBtn}
                  onClick={() => setActiveGateManage(activeGateManage === g.id ? null : g.id)}
                >
                  {activeGateManage === g.id ? 'Close' : 'Manage'}
                </button>
              </div>
            </div>
            {activeGateManage === g.id && (
              <div className={styles.inlineGateManager}>
                <div className={styles.sliderHeader}>
                  <span className={styles.sliderLabel}>Density</span>
                  <span className={styles.sliderValue}>{g.density}%</span>
                </div>
                <input
                  type="range"
                  className={styles.sliderInput}
                  min="0"
                  max="100"
                  value={g.density}
                  onChange={(e) => handleUpdateGateDensity(g.id, parseInt(e.target.value))}
                  aria-label={`Adjust density for ${g.id}`}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
