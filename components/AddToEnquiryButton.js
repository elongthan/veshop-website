"use client";

import { ClipboardList, Check } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useEnquiryList from "./useEnquiryList";
import { addItem } from "@/lib/enquiryList";

export default function AddToEnquiryButton({ id, name, sku }) {
  const items = useEnquiryList();
  const [full, setFull] = useState(false);
  const inList = items.some((i) => i.id === id);

  if (inList) {
    return (
      <Link href="/enquiry" className="ve-btn ve-btn-ghost">
        <Check size={16} /> In your enquiry list — view
      </Link>
    );
  }
  return (
    <>
      <button
        type="button"
        className="ve-btn ve-btn-ghost"
        onClick={() => { if (addItem({ id, name, sku }) === "full") setFull(true); }}
      >
        <ClipboardList size={16} /> Add to enquiry list
      </button>
      {full && <span className="ve-form-error">Your list is full (50 items). Please send it first.</span>}
    </>
  );
}
