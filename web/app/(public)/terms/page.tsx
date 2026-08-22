import { cmsMetadata, CmsPageView } from "@/lib/cms-page";

export const dynamic = "force-dynamic";
export const generateMetadata = cmsMetadata("terms");

export default function TermsPage() {
  return <CmsPageView slug="terms" />;
}
