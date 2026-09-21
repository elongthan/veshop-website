"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireFullAdmin } from "@/lib/adminRole";

async function requireAdmin(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
}

export async function updateSiteContent(fields) {
  const supabase = await createClient();
  await requireFullAdmin(supabase);
  const { error } = await supabase.from("settings").update(fields).eq("id", 1);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function addBannerImage(url) {
  const supabase = await createClient();
  await requireFullAdmin(supabase);
  const { data } = await supabase.from("settings").select("banner_images").eq("id", 1).single();
  const next = [...(data?.banner_images || []), url];
  const { error } = await supabase.from("settings").update({ banner_images: next }).eq("id", 1);
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function reorderBannerImages(orderedUrls) {
  const supabase = await createClient();
  await requireFullAdmin(supabase);
  const { error } = await supabase.from("settings").update({ banner_images: orderedUrls }).eq("id", 1);
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function removeBannerImage(url) {
  const supabase = await createClient();
  await requireFullAdmin(supabase);
  const { data } = await supabase.from("settings").select("banner_images").eq("id", 1).single();
  const next = (data?.banner_images || []).filter((u) => u !== url);
  const { error } = await supabase.from("settings").update({ banner_images: next }).eq("id", 1);
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function sendContactEnquiry(formData) {
  // Honeypot — a real visitor never sees or fills this field (hidden via
  // CSS), so anything with a value here is an automated submission. Return
  // a fake success rather than an error, so a bot has no signal to adapt to.
  if (formData.get("website")) {
    return { ok: true };
  }

  const name = formData.get("name");
  const email = formData.get("email");
  const phone = formData.get("phone");
  const message = formData.get("message");
  const attachment = formData.get("attachment");

  if (!name || !email || !message) {
    return { ok: false, error: "Please fill in your name, email and message." };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL || "sales@veshop.com.sg";

  if (!apiKey) {
    // No email service configured yet — tell the caller so the page can
    // fall back to opening the visitor's own email app instead.
    return { ok: false, fallback: true };
  }

  let attachments;
  if (attachment && typeof attachment === "object" && attachment.size > 0) {
    const buffer = Buffer.from(await attachment.arrayBuffer());
    attachments = [{ filename: attachment.name, content: buffer.toString("base64") }];
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "VeShop website <enquiries@veshop.com.sg>",
        to: [toEmail],
        reply_to: email,
        subject: `Website enquiry from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || "—"}\n\n${message}`,
        ...(attachments ? { attachments } : {})
      })
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("Resend API error:", res.status, body);
      throw new Error(body);
    }
    return { ok: true };
  } catch (err) {
    console.error("Contact form send failed:", err);
    return { ok: false, error: "Could not send right now. Please try again or email us directly." };
  }
}
