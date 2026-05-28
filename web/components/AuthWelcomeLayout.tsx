"use client";

import React from "react";
import { motion } from "motion/react";
import { WelcomeBrandHeader } from "./WelcomeBrandHeader";

interface AuthWelcomeLayoutProps {
  title: string;
  subtitle?: React.ReactNode;
  headerExtra?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClass?: string;
  children: React.ReactNode;
}

export function AuthWelcomeLayout({
  title,
  subtitle,
  headerExtra,
  footer,
  maxWidthClass = "max-w-md",
  children,
}: AuthWelcomeLayoutProps) {
  return (
    <div
      className="min-h-screen py-12 px-6 overflow-y-auto"
      style={{ backgroundColor: "var(--background)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${maxWidthClass} mx-auto w-full`}
      >
        <WelcomeBrandHeader
          title={title}
          subtitle={subtitle}
          className="mb-8"
        >
          {headerExtra}
        </WelcomeBrandHeader>

        <div className="bg-white rounded-2xl shadow-xl p-8">{children}</div>

        {footer && <div className="mt-6 text-center">{footer}</div>}
      </motion.div>
    </div>
  );
}
