import React from 'react';
import vcpmcLogo from '../../assets/vcpmc-logo-animated.webp';

interface CommandOrbProps {
  onClick: () => void;
  isOpen: boolean;
  compact?: boolean;
  title?: string;
}

export function CommandOrb({ onClick, isOpen, compact = false, title = 'VCPMC Command Center' }: CommandOrbProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`vc-command-orb-new ${isOpen ? 'is-open' : ''} ${compact ? 'vc-command-orb-new--compact' : ''}`}
      aria-label={title}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      title={title}
    >
      <img
        src={vcpmcLogo}
        alt="VCPMC"
        className="vc-command-orb-new__logo"
      />
    </button>
  );
}
