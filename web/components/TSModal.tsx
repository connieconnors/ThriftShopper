"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface TSModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string | ReactNode;
  children: ReactNode;
  /** Optional helper line under the chips area, small text */
  helperText?: string;
  /** Optional custom footer; if not provided, caller can render inside children, or we show nothing */
  footer?: ReactNode;
  /** Optional flag to disable clicking on backdrop to close */
  disableBackdropClose?: boolean;
}

const TSModal: React.FC<TSModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  helperText,
  footer,
  disableBackdropClose = false,
}) => {
  const [mounted, setMounted] = useState(false);
  const [portalEl, setPortalEl] = useState<Element | null>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof document !== "undefined") {
      setPortalEl(document.body);
    }
  }, []);

  if (!mounted || !portalEl || !isOpen) return null;

  const handleBackdropClick = () => {
    if (!disableBackdropClose) {
      onClose();
    }
  };

  const modalContent = (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 backdrop-blur-sm"
          onClick={handleBackdropClick}
          onTouchStart={(e) => {
            // Only close if touching the backdrop, not the modal content
            if (e.target === e.currentTarget && !disableBackdropClose) {
              onClose();
            }
          }}
        >
      <div
        className="
          w-[92%]
          max-w-[360px]
          mb-4
          rounded-[28px]
          shadow-[0_18px_40px_rgba(0,0,0,0.45)]
          text-white
          overflow-hidden
        "
        style={{ backgroundColor: '#191970', touchAction: 'pan-y' }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => {
          e.stopPropagation();
        }}
        onTouchMove={(e) => {
          e.stopPropagation();
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Handle + close icon */}
        <div className="flex items-center justify-center pt-4 pb-1 relative">
          <div className="h-1.5 w-10 rounded-full bg-white/35" />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-3 text-lg text-white/70"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Header */}
        {title && (
          <div className="px-3 pb-2">
            <h2 className="text-[15px] font-semibold leading-tight">
              {title}
            </h2>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-white/10" />

        {/* Content */}
        <div className="px-3 pt-2 pb-3">
          {children}
          {helperText && (
            <p className="mt-1.5 text-[11px] text-white/70">{helperText}</p>
          )}
        </div>

        {/* Footer (optional) */}
        {footer && (
          <div className="border-t border-white/10 px-3 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, portalEl);
};

export default TSModal;

