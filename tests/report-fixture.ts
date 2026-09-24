import { createAccountState } from "../lib/accounts/repository";
import { createDealRoomState } from "../lib/deal-room/repository";
import { communications, projects, timelineEvents } from "../lib/mock-data";
import { createSampleWorkspace } from "../components/samples/sample-data";
import { createQuotationWorkspace } from "../components/quotations/quotation-data";
import { createOrderWorkspace } from "../components/orders/order-data";
import { mockProductLibraryRepository } from "../lib/product-library/repository";
import { createTaskWorkspace } from "../lib/tasks/workspace";
import type { BusinessSources } from "../lib/activity-memory/source-adapters";

export function reportSources(): BusinessSources {
  const samples = createSampleWorkspace();
  const quotes = createQuotationWorkspace();
  const orders = createOrderWorkspace();
  return { accounts: createAccountState(), dealRoom: createDealRoomState(), projects: structuredClone(projects), projectActivities: [], timeline: structuredClone(timelineEvents),
    communications: structuredClone(communications), samples: { versions: samples.versions, feedback: samples.feedback }, quotations: quotes.quotations, negotiations: quotes.records,
    orders: orders.orders, contracts: orders.contracts, deliveries: orders.deliveries, shipments: orders.shipments, tasks: createTaskWorkspace(), products: mockProductLibraryRepository.load(), manualEntries: [] };
}
