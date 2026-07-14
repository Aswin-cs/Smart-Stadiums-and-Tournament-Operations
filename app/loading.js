import styles from './loading.module.css';

export default function Loading() {
  return (
    <div className={styles.loaderContainer}>
      <div className={styles.spinner}></div>
      <div className={styles.text}>LOADING...</div>
    </div>
  );
}
