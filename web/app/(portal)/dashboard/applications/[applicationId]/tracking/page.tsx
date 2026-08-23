"use client";

import { useParams } from "next/navigation";

import { ApplicationTrackingView } from "@/components/tracking/ApplicationTrackingView";

export default function DashboardApplicationTrackingPage() {
  const params = useParams<{ applicationId: string }>();
  const id = Number(params.applicationId);
  return <ApplicationTrackingView applicationId={id} />;
}
