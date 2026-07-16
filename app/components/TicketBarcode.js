import styles from '../fan/fan.module.css';

const BARCODE_HEIGHTS = [
  23.5, 17.8, 16.3, 13.8, 14.5, 19.4, 11.0, 20.9, 11.3, 17.3, 22.7,
  21.7, 16.8, 20.3, 19.1, 12.8, 15.1, 13.6, 18.0, 16.9, 21.8, 25.1
];

/**
 * Renders the barcode section of the ticket using a series of vertical bars.
 *
 * @returns {JSX.Element} The rendered TicketBarcode component.
 */
export default function TicketBarcode() {
  return (
    <div className={styles.stubBarcode}>
      {BARCODE_HEIGHTS.map((h, i) => (
        <div key={i} className={styles.barcodeBar} style={{ height: `${h}px` }} />
      ))}
    </div>
  );
}
