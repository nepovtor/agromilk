import { useEffect } from "react";
import { useLocation } from "wouter";
import { api } from "@/api";
import { getSessionId, getVisitorId } from "@/lib/analyticsIdentity";

export function useAnalytics() {
  const [location] = useLocation();
  useEffect(() => {
    if (location.startsWith("/admin")) return;
    const query = new URLSearchParams(window.location.search);
    void api.analytics
      .pageView({
        visitorId: getVisitorId(),
        sessionId: getSessionId(),
        eventType: "page_view",
        pagePath: `${location}${window.location.search}`,
        referrer: document.referrer,
        utmSource: query.get("utm_source") || undefined,
        utmMedium: query.get("utm_medium") || undefined,
        utmCampaign: query.get("utm_campaign") || undefined,
      })
      .catch(() => undefined);
  }, [location]);
}
