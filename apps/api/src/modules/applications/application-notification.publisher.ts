import type { FastifyBaseLogger } from "fastify";
import {
  sendApplicationEmail,
  sendApplicationTelegram,
} from "../../services/notification.service.js";
import type { Application } from "./application.repository.js";

export interface ApplicationNotificationPublisher {
  publishCreated(application: Application, logger: FastifyBaseLogger): Promise<void>;
}

export const applicationNotificationPublisher: ApplicationNotificationPublisher = {
  async publishCreated(application, logger) {
    const results = await Promise.allSettled([
      sendApplicationEmail(application),
      sendApplicationTelegram(application),
    ]);
    results.forEach((result) => {
      if (result.status === "rejected")
        logger.error(result.reason, "Ошибка отправки уведомления о заявке");
    });
  },
};
