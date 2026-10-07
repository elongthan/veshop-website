"use client";

import Link from "next/link";
import useEnquiryList from "./useEnquiryList";

export default function EnquiryListLink() {
  const items = useEnquiryList();
  return (
    <Link href="/enquiry" className="ve-enquiry-link">
      Enquiry list{items.length > 0 && <span className="ve-enquiry-count">{items.length}</span>}
    </Link>
  );
}
