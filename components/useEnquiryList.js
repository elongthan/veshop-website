"use client";

import { useSyncExternalStore } from "react";
import { getItems, getServerItems, subscribe } from "@/lib/enquiryList";

export default function useEnquiryList() {
  return useSyncExternalStore(subscribe, getItems, getServerItems);
}
