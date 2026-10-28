import React from 'react';
import {
  ORACLIME_CROPPED_LOGO_DATA_URL,
  ORACLIME_CROPPED_LOGO_SRC,
  ORACLIME_ORIGINAL_LOGO_SRC,
  ORACLIME_OWNER_SIGNATURE_DATA_URL,
  ORACLIME_OWNER_SIGNATURE_SRC,
  ORACLIME_OWNER_SIGNATURE_ORIGINAL_SRC,
} from '../assets/oraclimeOfficialLogo';

interface OraclimeLogoProps {
  variant?: 'full' | 'horizontal' | 'mark' | 'compact';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSubtitle?: boolean;
  surface?: 'dark' | 'light';
}

export const OraclimeLogo: React.FC<OraclimeLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  className = '',
  showSubtitle = true,
  surface = 'dark',
}) => {
  const heightClasses = {
    sm: 'h-5',
    md: 'h-6 sm:h-7',
    lg: 'h-8 sm:h-9',
    xl: 'h-11 sm:h-12',
  }[size];

  const subSize = {
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-[11px]',
    xl: 'text-xs',
  }[size];

  const OfficialLogoBadge = (
    <div className="inline-flex items-center justify-center shrink-0 bg-transparent">
      <img
        src={ORACLIME_CROPPED_LOGO_DATA_URL || ORACLIME_CROPPED_LOGO_SRC}
        onError={(e) => {
          const target = e.currentTarget;
          if (!target.src.endsWith(ORACLIME_ORIGINAL_LOGO_SRC)) {
            target.src = ORACLIME_ORIGINAL_LOGO_SRC;
          }
        }}
        alt="OraClime"
        className={`${heightClasses} w-auto object-contain select-none block ${
          surface === 'dark'
            ? '[filter:drop-shadow(0_0_1px_rgba(241,245,249,0.92))_drop-shadow(0_0_6px_rgba(203,213,225,0.32))]'
            : ''
        }`}
        draggable={false}
      />
    </div>
  );

  if (variant === 'mark' || variant === 'compact') {
    return (
      <div className={`inline-flex items-center ${className}`}>
        {OfficialLogoBadge}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {OfficialLogoBadge}
      <div className="leading-tight flex flex-col justify-center">
        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 bg-cyan-950/90 border border-cyan-800/80 text-cyan-300 rounded font-mono text-[9px] font-bold tracking-widest uppercase">
            DMS
          </span>
          {!showSubtitle && (
            <span className="text-[11px] font-mono text-slate-300 font-semibold tracking-wider uppercase">
              File Manager
            </span>
          )}
        </div>
        {showSubtitle && (
          <span className={`${subSize} font-mono text-cyan-400/90 font-medium tracking-wide uppercase mt-0.5`}>
            Technician & Partner File Manager
          </span>
        )}
      </div>
    </div>
  );
};

interface OraclimeOwnerSignatureProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
  label?: string;
}

/**
 * Reusable Official OraClime Owner Digital Signature Component
 * Renders the actual uploaded owner signature with transparent background and preserved proportions.
 */
export const OraclimeOwnerSignature: React.FC<OraclimeOwnerSignatureProps> = ({
  size = 'md',
  className = '',
  showLabel = false,
  label = 'Authorized Signatory · ORACLIME',
}) => {
  const heightClass = {
    sm: 'h-7',
    md: 'h-10',
    lg: 'h-14',
  }[size];

  return (
    <div className={`inline-flex flex-col items-center justify-center ${className}`}>
      <img
        src={ORACLIME_OWNER_SIGNATURE_DATA_URL || ORACLIME_OWNER_SIGNATURE_SRC}
        onError={(e) => {
          const target = e.currentTarget;
          if (!target.src.endsWith(ORACLIME_OWNER_SIGNATURE_ORIGINAL_SRC)) {
            target.src = ORACLIME_OWNER_SIGNATURE_ORIGINAL_SRC;
          }
        }}
        alt="Official Owner Signature"
        className={`${heightClass} w-auto object-contain select-none block`}
        draggable={false}
      />
      {showLabel && (
        <span className="text-[10px] font-mono font-bold text-slate-700 uppercase tracking-wider mt-0.5 border-t border-slate-300 pt-0.5 px-2">
          {label}
        </span>
      )}
    </div>
  );
};

