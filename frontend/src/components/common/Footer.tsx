import React from 'react';
import styles from './Footer.module.css';

export const Footer: React.FC = () => {
  return (
    <footer className={styles.footer} role="contentinfo">
      <p className={styles.attributionText}>
        Built with Claude as part of the AB Talks 60-Day Claude AI Challenge.
      </p>
      <div className={styles.challengeTag}>
        <span className={styles.pulseDot} />
        <span>CHALLENGE VERIFIED // DAY 6</span>
      </div>
    </footer>
  );
};
