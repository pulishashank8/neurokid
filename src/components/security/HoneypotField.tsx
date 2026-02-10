/**
 * Honeypot Field Component
 * 
 * Invisible form field that catches automated bots.
 * Uses CSS to hide from human users while remaining detectable by bots.
 * 
 * Usage:
 *   <form onSubmit={handleSubmit}>
 *     <HoneypotField />
 *     <input name="email" ... />
 *     <button type="submit">Submit</button>
 *   </form>
 */

'use client';

import { useEffect, useState } from 'react';

interface HoneypotFieldProps {
  /** Field name - should look legitimate to bots */
  fieldName?: string;
  /** Label for the field (shown to bots, hidden from humans) */
  label?: string;
  /** Additional CSS class */
  className?: string;
  /** Include timestamp field to detect suspiciously fast submissions */
  includeTimestamp?: boolean;
}

/**
 * Honeypot field that is invisible to humans but detectable by bots
 * Bots will often fill in fields they think are hidden but are actually honeypots
 */
export function HoneypotField({
  fieldName = 'website',
  label = 'Website',
  className = '',
  includeTimestamp = true,
}: HoneypotFieldProps) {
  const [timestamp, setTimestamp] = useState<number | null>(null);

  useEffect(() => {
    if (includeTimestamp) {
      setTimestamp(Date.now());
    }
  }, [includeTimestamp]);

  return (
    <>
      {/* 
        Honeypot field - hidden from humans via CSS
        Bots scanning the DOM will see this and may fill it in
      */}
      <div
        className={`hp-field ${className}`}
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
          opacity: 0,
          pointerEvents: 'none',
        }}
      >
        <label htmlFor={fieldName}>{label}</label>
        <input
          type="text"
          id={fieldName}
          name={fieldName}
          tabIndex={-1}
          autoComplete="off"
          onChange={() => {
            // Bot detection - log if field is filled
            if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
              console.warn('[HONEYPOT] Field was filled - possible bot detected');
            }
          }}
        />
      </div>

      {/* Timestamp field for submission time analysis */}
      {includeTimestamp && timestamp && (
        <input
          type="hidden"
          name="_form_timestamp"
          value={timestamp}
          aria-hidden="true"
        />
      )}
    </>
  );
}

/**
 * Alternative honeypot using aria-hidden technique
 * Some bots respect aria-hidden="true" and skip these fields
 * Use this for forms where you want extra bot detection
 */
export function AriaHoneypotField({
  fieldName = 'company_name',
  label = 'Company Name',
}: Omit<HoneypotFieldProps, 'includeTimestamp'>) {
  return (
    <div aria-hidden="true" style={{ display: 'none' }}>
      <label htmlFor={fieldName}>{label}</label>
      <input
        type="text"
        id={fieldName}
        name={fieldName}
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}

export default HoneypotField;
