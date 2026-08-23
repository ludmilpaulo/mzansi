"use client";

import { useParams } from "next/navigation";

import { ApplicationTrackingView } from "@/components/tracking/ApplicationTrackingView";

export default function PortalApplicationTrackingPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  return <ApplicationTrackingView applicationId={id} />;
}
