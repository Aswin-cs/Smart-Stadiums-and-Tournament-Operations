import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faLocationDot, faBuilding } from '@fortawesome/free-solid-svg-icons';
import styles from '../fan/fan.module.css';
import Image from 'next/image';
import { categoryColors } from '../lib/utils/ticket-colors';
import TicketBarcode from './TicketBarcode';

export default function TicketPreview({ ticket, animating }) {
  const c = categoryColors[ticket.category] || categoryColors.Standard;

  return (
    <div
      className={`${styles.ticketPreview} ${animating ? styles.ticketPreviewSaved : ''}`}
      style={{ '--tk-bg': c.bg, '--tk-border': c.border, '--tk-accent': c.accent }}
    >
      {/* Perforated left edge */}
      <div className={styles.ticketStub}>
        <div className={styles.stubVertText}>ADMIT ONE</div>
        <TicketBarcode />
      </div>

      {/* Main ticket body */}
      <div className={styles.ticketBody}>
        <div className={styles.ticketTopRow}>
          <div className={styles.ticketTournament}>
            <span className={styles.ticketBall}><Image src="/football.svg" alt="Football" width={28} height={28} style={{ display: 'inline-block', verticalAlign: 'middle' }} /></span>
            <div>
              <div className={styles.ticketTournamentName}>FIFA WORLD CUP 2026™</div>
              <div className={styles.ticketCategoryBadge} style={{ background: c.accent + '22', border: `1px solid ${c.accent}55`, color: c.accent }}>
                {ticket.category}
              </div>
            </div>
          </div>
          <div className={styles.ticketSeatBlock}>
            <div className={styles.seatBlockItem}><span className={styles.seatBlockLabel}>GATE</span><span className={styles.seatBlockVal}>{ticket.gate.replace('Gate ', '')}</span></div>
            <div className={styles.seatBlockSep} />
            <div className={styles.seatBlockItem}><span className={styles.seatBlockLabel}>ROW</span><span className={styles.seatBlockVal}>{ticket.row}</span></div>
            <div className={styles.seatBlockSep} />
            <div className={styles.seatBlockItem}><span className={styles.seatBlockLabel}>SEAT</span><span className={styles.seatBlockVal}>{ticket.seat}</span></div>
          </div>
        </div>

        <div className={styles.ticketMatchRow}>
          <span className={styles.ticketMatchText}>{ticket.match}</span>
        </div>

        <div className={styles.ticketInfoRow}>
          <div className={styles.ticketInfoItem}><span className={styles.infoLabel}><FontAwesomeIcon icon={faCalendarAlt} style={{ color: '#8b9bb4' }} /></span>{ticket.matchDate}</div>
          <div className={styles.ticketInfoItem}><span className={styles.infoLabel}><FontAwesomeIcon icon={faBuilding} style={{ color: '#8b9bb4' }} /></span>{ticket.stadium}</div>
          <div className={styles.ticketInfoItem}><span className={styles.infoLabel}><FontAwesomeIcon icon={faLocationDot} style={{ color: '#e11d48' }} /></span>{ticket.section}</div>
        </div>

        <div className={styles.ticketDivider}>
          <div className={styles.ticketCircleL} />
          <div className={styles.ticketDashes} />
          <div className={styles.ticketCircleR} />
        </div>

        <div className={styles.ticketFooterRow}>
          <div className={styles.ticketHolder}>
            <span className={styles.holderLabel}>TICKET HOLDER</span>
            <span className={styles.holderName}>{ticket.holderName || '—'}</span>
          </div>
          <div className={styles.ticketBarcode}>
            <span className={styles.barcodeText}>{ticket.barcode}</span>
          </div>
        </div>
      </div>
    </div>
  );
}