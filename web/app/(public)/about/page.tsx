import { cmsMetadata, CmsPageView } from "@/lib/cms-page";

export const dynamic = "force-dynamic";
export const generateMetadata = cmsMetadata("about");

export default function AboutPage() {
  return <CmsPageView slug="about" />;
}
