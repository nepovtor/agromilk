import { useEffect } from "react";
import { useLocation } from "wouter";
import { api } from "@/api/client";

const getId = (key: string, storage: Storage) => {
  let value = storage.getItem(key);
  if (!value) {
    value = crypto.randomUUID();
    storage.setItem(key, value);
  }
  return value;
};

export function useAnalytics() {
  const [location] = useLocation();
  useEffect(() => {
    if (location.startsWith("/admin")) return;
    const query = new URLSearchParams(window.location.search);
    void api.analytics
      .pageView({
        visitorId: getId("visitor_id", localStorage),
        sessionId: getId("session_id", sessionStorage),
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
