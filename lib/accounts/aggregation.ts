import type { Project } from "../mock-data";
import type { ProductLibraryData } from "../product-library/types";
import type { SampleWorkspace } from "../../components/samples/sample-data";
import type { QuotationWorkspace } from "../../components/quotations/quotation-data";
import type { OrderWorkspace } from "../../components/orders/order-data";
import type { AccountState } from "./types";
import { getAccountSourceIds } from "./selectors";

export function getAccountBusiness(state: AccountState, accountId: string, projects: Project[], products: ProductLibraryData, samples: SampleWorkspace, quotations: QuotationWorkspace, orders: OrderWorkspace) {
  const sourceIds = new Set(getAccountSourceIds(state, accountId));
  const accountProjects = projects.filter((item) => sourceIds.has(item.clientId));
  const projectIds = new Set(accountProjects.map((item) => item.id));
  const links = products.projectProducts.filter((item) => projectIds.has(item.projectId));
  const linkedProducts = links.map((link) => ({ link, product: products.products.find((item) => item.id === link.productId) })).filter((item) => item.product);
  const accountSamples = samples.samples.filter((item) => projectIds.has(item.projectId) || sourceIds.has(item.clientId));
  const accountQuotations = quotations.quotations.filter((item) => projectIds.has(item.projectId) || sourceIds.has(item.clientId));
  const accountOrders = orders.orders.filter((item) => projectIds.has(item.projectId) || sourceIds.has(item.clientId));
  const orderIds = new Set(accountOrders.map((item) => item.id));
  return { projects: accountProjects, linkedProducts, samples: accountSamples, quotations: accountQuotations, orders: accountOrders, productStages: {
    proposed: new Set(links.filter((item) => ["candidate", "proposed"].includes(item.proposalStatus)).map((item) => item.productId)).size,
    sampling: new Set(accountSamples.map((item) => item.productId ?? item.product)).size,
    quoted: new Set(accountQuotations.flatMap((item) => item.lineItems?.map((line) => line.productId ?? line.product) ?? [item.product])).size,
    ordered: new Set(orders.lines.filter((item) => orderIds.has(item.purchaseOrderId)).map((item) => item.productId ?? item.product)).size,
  } };
}
