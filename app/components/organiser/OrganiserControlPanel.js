'use client';
import styles from '../../organiser/organiser.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faUsers, faTemperatureHigh } from '@fortawesome/free-solid-svg-icons';

export default function OrganiserControlPanel({
  isSettingsOpen,
  setIsSettingsOpen,
  isAutoSimulating,
  setIsAutoSimulating,
  handleSimulateOverflow,
  handleReset,
  climate,
  handleSimulateClimate,
  gates,
  handleUpdateGateDensity
}) {
  if (!isSettingsOpen) return null;

  return (
    <div className={styles.settingsDropdown}>
      <div className={styles.settingsHeader}>
        <span className={styles.settingsTitle}>Stadium Control Panel</span>
        <button className={styles.settingsCloseBtn} onClick={() => setIsSettingsOpen(false)} aria-label="Close settings">
          <FontAwesomeIcon icon={faXmark} />
        </button>
      </div>

      {/* Simulation switch section */}
      <div className={styles.settingsSection}>
        <span className={styles.settingsSectionTitle}>Simulation Settings</span>
        <div className={styles.settingsToggleRow}>
          <span className={styles.settingsLabel}>Auto-Fluctuate Crowd Flow</span>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={isAutoSimulating}
              onChange={(e) => setIsAutoSimulating(e.target.checked)}
              aria-label="Auto-Fluctuate Crowd Flow"
            />
            <span className={styles.sliderRound}></span>
          </label>
        </div>
        <div className={styles.settingsBtnRow}>
          <button className={`${styles.actionBtn} ${styles.actionBtnSm}`} onClick={handleSimulateOverflow}>
            <FontAwesomeIcon icon={faUsers} className={styles.iconMargin} />
            Crowd Rush
          </button>
          <button className={`${styles.actionBtn} ${styles.actionBtnSm}`} onClick={handleReset}>
            Reset State
          </button>
        </div>
      </div>

      {/* Climate Simulation section */}
      <div className={styles.settingsSection}>
        <span className={styles.settingsSectionTitle}>Climate Diversity</span>
        <div className={styles.settingsBtnRow}>
          <button className={`${styles.actionBtn} ${styles.actionBtnSm} ${climate === 'HEATWAVE' ? styles.bgHeat : ''}`} onClick={() => handleSimulateClimate('HEATWAVE')}>
            <FontAwesomeIcon icon={faTemperatureHigh} className={styles.iconMargin} />
            Heatwave
          </button>
          <button className={`${styles.actionBtn} ${styles.actionBtnSm} ${climate === 'STORM' ? styles.bgStorm : ''}`} onClick={() => handleSimulateClimate('STORM')}>
            <FontAwesomeIcon icon={faTemperatureHigh} className={styles.iconMargin} />
            Storm
          </button>
          <button className={`${styles.actionBtn} ${styles.actionBtnSm} ${climate === 'CLEAR' ? styles.bgClear : ''}`} onClick={() => handleSimulateClimate('CLEAR')}>
            ☀️ Clear
          </button>
        </div>
      </div>

      {/* Adjust value section */}
      <div className={styles.settingsSection}>
        <span className={styles.settingsSectionTitle}>Adjust Gate Densities</span>
        <div className={styles.settingsSlidersGrid}>
          {gates.map((gate) => (
            <div key={gate.id} className={styles.settingsSliderRow}>
              <div className={styles.sliderHeader}>
                <span className={styles.sliderLabel}>{gate.id} ({gate.status})</span>
                <span className={styles.sliderValue}>{gate.density}%</span>
              </div>
              <input
                type="range"
                className={styles.sliderInput}
                min="0"
                max="100"
                value={gate.density}
                onChange={(e) => handleUpdateGateDensity(gate.id, parseInt(e.target.value))}
                aria-label={`Adjust density for ${gate.id}`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
