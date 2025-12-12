"use client";

import React, { ReactNode } from "react";
import TSModal from "./TSModal";

interface MoodFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClear?: () => void;
  children: React.ReactNode;
}

const MoodFilterModal: React.FC<MoodFilterModalProps> = ({
  isOpen,
  onClose,
  onClear,
  children,
}) => {
  return (
    <TSModal
      isOpen={isOpen}
      onClose={onClose}
      title="Choose Your Vibe"
      footer={
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="text-[14px] text-white/80"
            onClick={() => {
              if (onClear) onClear();
            }}
          >
            Clear
          </button>
          <button
            type="button"
            className="
              rounded-2xl
              bg-[#000080]
              px-5
              py-2
              text-[14px]
              font-semibold
              text-white
              active:opacity-85
            "
            onClick={onClose}
          >
            Done
          </button>
        </div>
      }
    >
      {children}
    </TSModal>
  );
};

export default MoodFilterModal;

