'use client';
import styles from '../../organiser/organiser.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faCheck } from '@fortawesome/free-solid-svg-icons';

export default function OrganiserVolunteerBoard({ volunteerTasks, handleGenerateAiTask, markTaskCompleted }) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>
          <span className={`${styles.panelDot} ${styles.bgGold}`}></span>
          Volunteer Task Board
        </h2>
        <button className={styles.updateBtn} onClick={handleGenerateAiTask} title="AI Generate Task">
          <FontAwesomeIcon icon={faRobot} /> AI Auto-Assign
        </button>
      </div>
      <div className={styles.gateList}>
        {volunteerTasks.map((t, i) => (
          <div key={i} className={styles.gateItemWrapper}>
            <div className={styles.gateItem}>
              <div className={styles.gateInfo}>
                <p className={styles.gateTitle}>{t.task}</p>
                <p className={styles.gateFlow}>{t.zone} · {t.category} · {t.assignee}</p>
              </div>
              <div className={styles.gateActions}>
                <span className={styles.statusBadge} data-status={t.status === 'COMPLETED' ? 'CLOSED' : (t.status === 'ACTIVE' ? 'CONGESTED' : 'OPEN')}>
                  {t.status}
                </span>
                {t.status !== 'COMPLETED' && (
                  <button 
                    className={styles.gateBtn}
                    onClick={() => markTaskCompleted(t.id)}
                  >
                    <FontAwesomeIcon icon={faCheck} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
