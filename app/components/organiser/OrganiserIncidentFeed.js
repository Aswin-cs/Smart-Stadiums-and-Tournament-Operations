'use client';
import styles from '../../organiser/organiser.module.css';

export default function OrganiserIncidentFeed({ incidents }) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>
          <span className={`${styles.panelDot} ${styles.bgRed}`}></span>
          GenAI Real-Time Decision Support
        </h2>
        <span className={styles.panelCount}>{incidents.length} active</span>
      </div>
      <div className={styles.taskList}>
        {incidents.map((inc) => (
          <div key={inc.id} className={styles.taskItem}>
            <div className={styles.taskContent}>
              <p className={styles.taskTitle}>{inc.title}</p>
              <div className={styles.taskMeta}>
                <span className={styles.taskCategory}>{inc.location}</span>
                <span className={styles.taskDue}>{inc.time}</span>
              </div>
            </div>
            <span className={styles.priorityBadge} data-type={inc.type}>
              {inc.type}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
