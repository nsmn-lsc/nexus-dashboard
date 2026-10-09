import React from "react";
import { db } from "@/db";
import { webhookEndpoints, webhookDeliveries } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { WebhooksManagerClient } from "@/components/hud/WebhooksManagerClient";

export default async function WebhooksPage() {
  const allEndpoints = await db
    .select()
    .from(webhookEndpoints)
    .orderBy(desc(webhookEndpoints.createdAt));

  const deliveriesWithEndpoint = await db
    .select({
      id: webhookDeliveries.id,
      endpointId: webhookDeliveries.endpointId,
      endpointName: webhookEndpoints.name,
      eventType: webhookDeliveries.eventType,
      payload: webhookDeliveries.payload,
      statusCode: webhookDeliveries.statusCode,
      responseBody: webhookDeliveries.responseBody,
      status: webhookDeliveries.status,
      executedAt: webhookDeliveries.executedAt,
    })
    .from(webhookDeliveries)
    .innerJoin(webhookEndpoints, eq(webhookDeliveries.endpointId, webhookEndpoints.id))
    .orderBy(desc(webhookDeliveries.executedAt))
    .limit(50);

  return (
    <WebhooksManagerClient
      endpoints={allEndpoints}
      deliveries={deliveriesWithEndpoint}
    />
  );
}
