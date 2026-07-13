import type { Metadata } from "next";
import DeleteAccountClient from "./DeleteAccountClient";

export const metadata: Metadata = {
  title: "Delete Account | ThriftShopper",
  description:
    "How to permanently delete your ThriftShopper account and associated personal data.",
};

export default function DeleteAccountPage() {
  return <DeleteAccountClient />;
}
