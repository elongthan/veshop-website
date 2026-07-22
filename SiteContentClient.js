"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { addBannerImage, removeBannerImage, updateSiteContent } from "@/actions/site";

async function uploadToSiteAssets(file, prefix) {
  const supabase = createClient();
  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
  const { error } = await supabase.storage.from("site-assets").upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
  return data.publicUrl;
}

export default function SiteContentClient({ settings }) {
  const [form, setForm] = useState({
    site_name: settings.site_name || "",
    site_tagline: settings.site_tagline || "",
    hero_eyebrow: settings.hero_eyebrow || "",
    hero_title: settings.hero_title || "",
    hero_description: settings.hero_description || "",
    footer_address: settings.footer_address || "",
    phone1: settings.phone1 || "",
    phone2: settings.phone2 || "",
    whatsapp_number: settings.whatsapp_number || "",
    contact_email: settings.contact_email || "",
    about_us_text: settings.about_us_text || "",
    logo_url: settings.logo_url || "",
    accent_color: settings.accent_color || "#1B3A6B",
    footer_catalog_heading: settings.footer_catalog_heading || "",
    footer_catalog_text: settings.footer_catalog_text || "",
    footer_copyright: settings.footer_copyright || "",
    about_image_url: settings.about_image_url || ""
  });
  const [banners, setBanners] = useState(settings.banner_images || []);
  const [savingText, setSavingText] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingAbout, setUploadingAbout] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const logoRef = useRef(null);
  const aboutImgRef = useRef(null);
  const bannerRef = useRef(null);
  const router = useRouter();

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function saveText(e) {
    e.preventDefault();
    setSavingText(true);
    try {
      await updateSiteContent(form);
      router.refresh();
    } catch (err) {
      alert("Could not save: " + err.message);
    }
    setSavingText(false);
  }

  async function handleLogoFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const url = await uploadToSiteAssets(file, "logo");
      update("logo_url", url);
      await updateSiteContent({ logo_url: url });
      router.refresh();
    } catch (err) {
      alert("Could not upload logo: " + err.message);
    }
    setUploadingLogo(false);
  }

  async function handleAboutImageFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAbout(true);
    try {
      const url = await uploadToSiteAssets(file, "about");
      update("about_image_url", url);
      await updateSiteContent({ about_image_url: url });
      router.refresh();
    } catch (err) {
      alert("Could not upload image: " + err.message);
    }
    setUploadingAbout(false);
  }

  async function handleBannerFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      const url = await uploadToSiteAssets(file, "banner");
      await addBannerImage(url);
      setBanners((b) => [...b, url]);
      router.refresh();
    } catch (err) {
      alert("Could not upload banner: " + err.message);
    }
    setUploadingBanner(false);
  }

  async function handleRemoveBanner(url) {
    if (!confirm("Remove this banner image?")) return;
    await removeBannerImage(url);
    setBanners((b) => b.filter((u) => u !== url));
    router.refresh();
  }

  return (
    <div className="ve-site-content">
      <div className="ve-admin-head"><h2>Site content</h2></div>

      <div className="ve-settings" style={{ marginBottom: 20 }}>
        <h3>Logo</h3>
        <div className="ve-logo-upload-row">
          <div className="ve-logo-preview" onClick={() => logoRef.current?.click()}>
            {form.logo_url ? <img src={form.logo_url} alt="" /> : <Upload size={18} />}
          </div>
          <div>
            <button type="button" className="ve-btn ve-btn-ghost ve-btn-sm" onClick={() => logoRef.current?.click()} disabled={uploadingLogo}>
              {uploadingLogo ? "Uploading..." : "Upload logo"}
            </button>
            <p className="ve-hint">Shown in the header and footer. Square or wide logos both work.</p>
          </div>
          <input ref={logoRef} type="file" accept="image/*" hidden onChange={handleLogoFile} />
        </div>
      </div>

      <div className="ve-settings" style={{ marginBottom: 20 }}>
        <h3>Homepage banners</h3>
        <p className="ve-hint">Auto-advances every 5 seconds when there's more than one image.</p>
        <div className="ve-banner-manage-grid">
          {banners.map((url) => (
            <div key={url} className="ve-banner-manage-item">
              <img src={url} alt="" />
              <button type="button" onClick={() => handleRemoveBanner(url)}><X size={14} /></button>
            </div>
          ))}
          <button type="button" className="ve-banner-add" onClick={() => bannerRef.current?.click()} disabled={uploadingBanner}>
            <Upload size={16} />
            <span>{uploadingBanner ? "Uploading..." : "Add banner"}</span>
          </button>
        </div>
        <input ref={bannerRef} type="file" accept="image/*" hidden onChange={handleBannerFile} />
      </div>

      <form className="ve-settings" onSubmit={saveText}>
        <h3>Wording</h3>
        <label className="ve-filter-label">Site name</label>
        <input value={form.site_name} onChange={(e) => update("site_name", e.target.value)} />
        <label className="ve-filter-label">Tagline</label>
        <input value={form.site_tagline} onChange={(e) => update("site_tagline", e.target.value)} />
        <label className="ve-filter-label">Homepage eyebrow text</label>
        <input value={form.hero_eyebrow} onChange={(e) => update("hero_eyebrow", e.target.value)} />
        <label className="ve-filter-label">Homepage headline</label>
        <textarea rows={2} value={form.hero_title} onChange={(e) => update("hero_title", e.target.value)} />
        <label className="ve-filter-label">Homepage description</label>
        <textarea rows={3} value={form.hero_description} onChange={(e) => update("hero_description", e.target.value)} />
        <label className="ve-filter-label">Accent colour (links, highlights)</label>
        <div className="ve-color-row">
          <input type="color" value={form.accent_color} onChange={(e) => update("accent_color", e.target.value)} />
          <input value={form.accent_color} onChange={(e) => update("accent_color", e.target.value)} style={{ maxWidth: 120 }} />
        </div>
        <label className="ve-filter-label">About Us page text</label>
        <textarea rows={4} value={form.about_us_text} onChange={(e) => update("about_us_text", e.target.value)} />
        <label className="ve-filter-label">About Us page image (shown above the text)</label>
        <div className="ve-logo-upload-row">
          <div className="ve-logo-preview" onClick={() => aboutImgRef.current?.click()}>
            {form.about_image_url ? <img src={form.about_image_url} alt="" /> : <Upload size={18} />}
          </div>
          <button type="button" className="ve-btn ve-btn-ghost ve-btn-sm" onClick={() => aboutImgRef.current?.click()} disabled={uploadingAbout}>
            {uploadingAbout ? "Uploading..." : form.about_image_url ? "Replace image" : "Upload image"}
          </button>
          <input ref={aboutImgRef} type="file" accept="image/*" hidden onChange={handleAboutImageFile} />
        </div>

        <h3 style={{ marginTop: 20 }}>Contact details</h3>
        <label className="ve-filter-label">Contact email (also used for the Contact form and product enquiries)</label>
        <input value={form.contact_email} onChange={(e) => update("contact_email", e.target.value)} />
        <div className="ve-form-row">
          <div>
            <label className="ve-filter-label">Phone 1</label>
            <input value={form.phone1} onChange={(e) => update("phone1", e.target.value)} />
          </div>
          <div>
            <label className="ve-filter-label">Phone 2</label>
            <input value={form.phone2} onChange={(e) => update("phone2", e.target.value)} />
          </div>
        </div>
        <label className="ve-filter-label">WhatsApp number (digits only, with country code — e.g. 6583631218)</label>
        <input value={form.whatsapp_number} onChange={(e) => update("whatsapp_number", e.target.value)} />
        <label className="ve-filter-label">Address</label>
        <textarea rows={3} value={form.footer_address} onChange={(e) => update("footer_address", e.target.value)} />

        <h3 style={{ marginTop: 20 }}>Footer "Catalog" column</h3>
        <label className="ve-filter-label">Heading</label>
        <input value={form.footer_catalog_heading} onChange={(e) => update("footer_catalog_heading", e.target.value)} />
        <label className="ve-filter-label">Text</label>
        <textarea rows={2} value={form.footer_catalog_text} onChange={(e) => update("footer_catalog_text", e.target.value)} />
        <label className="ve-filter-label">Copyright line (year is added automatically)</label>
        <input value={form.footer_copyright} onChange={(e) => update("footer_copyright", e.target.value)} />

        <div className="ve-form-actions">
          <button className="ve-btn ve-btn-primary" type="submit" disabled={savingText}>
            {savingText ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
