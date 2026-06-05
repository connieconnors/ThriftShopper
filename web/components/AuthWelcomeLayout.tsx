"use client";

import React from "react";
import { motion } from "motion/react";
import { WelcomeBrandHeader } from "./WelcomeBrandHeader";
import { useAppShell, SHELL_LINEN } from "@/hooks/useAppShell";

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
  useAppShell("linen");

  return (
    <div
      className="fixed inset-0 overflow-y-auto py-12 px-6"
      style={{
        backgroundColor: SHELL_LINEN,
        paddingTop: "max(3rem, env(safe-area-inset-top))",
        paddingBottom: "max(3rem, env(safe-area-inset-bottom))",
      }}
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
