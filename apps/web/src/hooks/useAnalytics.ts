import { useEffect } from "react";
import { useLocation } from "wouter";
import { api } from "@/api";
import { getSessionId, getVisitorId, safeRandomUUID } from "@/lib/analyticsIdentity";

export function useAnalytics() {
  const [location] = useLocation();
  useEffect(() => {
    if (location.startsWith("/admin")) return;
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    const eventId = safeRandomUUID();
    if (!visitorId || !sessionId || !eventId) return;
    const query = new URLSearchParams(window.location.search);
    void api.analytics
      .pageView({
        eventId,
        visitorId,
        sessionId,
        eventType: "page_view",
        pagePath: `${location}${window.location.search}`,
        referrer: document.referrer,
        utmSource: query.get("utm_source") || undefined,
        utmMedium: query.get("utm_medium") || undefined,
        utmCampaign: query.get("utm_campaign") || undefined,
      })
      .catch((error: unknown) => console.warn("Analytics event failed", error));
  }, [location]);
}
