import assert from "node:assert/strict";
import test from "node:test";
import { businessCases } from "../lib/mock-data/trimflow";
import { mockProductLibraryRepository } from "../lib/product-library/repository";
import { addProductToProject, createProductSnapshot, getSoldSpecification } from "../lib/product-library/integration";
import { createCustomerProductDTO } from "../lib/product-library/publication";
import { getCommercialProfile, getFactoryCandidates, getVariantsForProduct } from "../lib/product-library/selectors";
import { validateProductLibrary } from "../lib/product-library/validation";
import { createOrderFromQuote, createOrderWorkspace } from "../components/orders/order-data";

test("synthetic library has valid stable references and an explicit three-case map", () => {
  const data = mockProductLibraryRepository.load();
  assert.deepEqual(validateProductLibrary(data), []);
  assert.equal(data.products.length, 8);
  assert.equal(data.variants.length, 10);
  assert.deepEqual(data.projectProducts.map((item) => item.projectId), [1, 2, 3, 3, 3]);
  assert.equal(businessCases[0].samples[0].variantId, undefined);
  assert.deepEqual(businessCases[0].quotations.map((item) => item.lineItems?.[0].productId), ["prod-waterproof", "prod-waterproof"]);
  assert.equal(businessCases[1].orderLines[0].productId, "prod-snap");
  assert.equal(businessCases[1].quotations[0].lineItems?.[0].designRevisionId, undefined);
  assert.deepEqual(businessCases[2].samples.map((item) => item.productId), ["prod-invisible", "prod-cord", "prod-tape"]);
  assert.equal(businessCases[2].quotations.length, 0);
  assert.equal(businessCases[2].purchaseOrders.length, 0);
});

test("sample, quotation and order snapshots survive product edits and a new revision", () => {
  const data = mockProductLibraryRepository.load();
  const sample = businessCases[0].sampleVersions.find((item) => item.version === "V3")!;
  const quote = businessCases[0].quotations.find((item) => item.version === "V2")!.lineItems![0];
  const order = businessCases[1].orderLines[0];
  const before = [sample.configurationSnapshot, quote.configurationSnapshot, order.configurationSnapshot].map((item) => JSON.stringify(item));
  assert.ok(before.every(Boolean));
  data.products[0].name.zh = "修改后的产品名称";
  data.products[1].name.en = "Changed Product Name";
  data.revisions[0].configuration.material = "modified_material";
  const next = structuredClone(data.revisions[0]);
  next.id = "rev-future-demo";
  next.revisionNumber = 2;
  next.previousRevisionId = data.revisions[0].id;
  data.revisions.push(next);
  data.variants[0].currentRevisionId = next.id;
  assert.notEqual(createProductSnapshot(data, "prod-waterproof", "var-waterproof-black")?.productName.zh, sample.configurationSnapshot?.productName.zh);
  assert.deepEqual([sample.configurationSnapshot, quote.configurationSnapshot, order.configurationSnapshot].map((item) => JSON.stringify(item)), before);
  assert.equal(getSoldSpecification(order.configurationSnapshot)?.zh, order.specification);
});

test("new order freezes the accepted quotation's recorded configuration and price", () => {
  const accepted = structuredClone(businessCases[1].quotations[0]);
  accepted.id = "QT-DEMO-NEW-V1";
  accepted.lineItems = accepted.lineItems?.map((item) => ({ ...item, id: "LINE-DEMO", quotationId: accepted.id }));
  const workspace = createOrderWorkspace();
  const result = createOrderFromQuote(accepted, workspace);
  assert.ok("order" in result);
  if (!("order" in result) || !result.lines) return;
  const line = result.lines[0];
  const before = JSON.stringify(line.configurationSnapshot);
  const amount = line.amount;
  accepted.lineItems![0].configurationSnapshot!.productName.zh = "后来修改的报价显示名";
  accepted.lineItems![0].unitPrice = 999;
  assert.equal(JSON.stringify(line.configurationSnapshot), before);
  assert.equal(line.amount, amount);
  assert.equal(line.quotationLineItemId, "LINE-DEMO");
});

test("customer preview is published-only and contains no internal factory or commercial notes", () => {
  const data = mockProductLibraryRepository.load();
  const preview = createCustomerProductDTO(data, "prod-waterproof", "var-waterproof-black");
  assert.ok(preview);
  assert.equal(preview.name.en, "Waterproof Coil Zipper");
  assert.equal(preview.referencePrice, undefined);
  assert.equal(preview.moq, undefined);
  assert.equal(createCustomerProductDTO(data, "prod-invisible", "var-invisible-sand"), undefined);
  const serialized = JSON.stringify(preview);
  for (const forbidden of ["factoryId", "internalNote", "internalCommercialNote", "internalSalesNote", "bottomPrice", "supplierTerms"]) assert.equal(serialized.includes(forbidden), false);
  data.products[0].name.en = "Renamed after publishing";
  data.products[0].productCode = "CHANGED-CODE";
  data.variants[0].variantCode = "CHANGED-VARIANT";
  data.assets[0].fileRef = "/products/changed.svg";
  data.revisions[0].configuration.color = "Changed after publishing";
  assert.equal(createCustomerProductDTO(data, "prod-waterproof", "var-waterproof-black")?.name.en, "Waterproof Coil Zipper");
  assert.equal(createCustomerProductDTO(data, "prod-waterproof", "var-waterproof-black")?.productCode, "TF-ZIP-001");
  assert.equal(createCustomerProductDTO(data, "prod-waterproof", "var-waterproof-black")?.variantCode, "WP-5-BLK");
  assert.deepEqual(createCustomerProductDTO(data, "prod-waterproof", "var-waterproof-black")?.imageRefs, ["/products/zipper.svg"]);
  assert.equal(createCustomerProductDTO(data, "prod-waterproof", "var-waterproof-black")?.specifications.find((row) => row.label.en === "Color")?.value.en, "Black");
  data.assets[0].reviewStatus = "draft";
  assert.deepEqual(createCustomerProductDTO(data, "prod-waterproof", "var-waterproof-black")?.imageRefs, []);
});

test("commercial guidance, variant selection, factory uncertainty and project link remain distinct", () => {
  const data = mockProductLibraryRepository.load();
  assert.equal(getCommercialProfile(data, "prod-waterproof", "var-waterproof-black").source, "variant");
  assert.equal(getCommercialProfile(data, "prod-waterproof", "var-waterproof-gray").source, "product");
  assert.equal(getVariantsForProduct(data, "prod-waterproof").length, 2);
  assert.equal(getFactoryCandidates(data, "prod-invisible")[0].status, "unverified");
  const linked = addProductToProject(data, { projectId: 3, productId: "prod-label", source: "library", proposalStatus: "candidate", applicationNote: { zh: "候选标签", en: "Candidate label" } });
  assert.equal(linked.projectProducts.at(-1)?.proposalStatus, "candidate");
  assert.equal(addProductToProject(linked, { projectId: 3, productId: "prod-label", source: "library", proposalStatus: "candidate", applicationNote: { zh: "重复", en: "Duplicate" } }), linked);
});
