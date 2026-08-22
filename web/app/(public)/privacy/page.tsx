import { cmsMetadata, CmsPageView } from "@/lib/cms-page";

export const dynamic = "force-dynamic";
export const generateMetadata = cmsMetadata("privacy");

export default function PrivacyPage() {
  return <CmsPageView slug="privacy" />;
}
