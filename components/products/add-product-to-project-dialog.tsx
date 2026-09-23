"use client";

import { useState, type FormEvent } from "react";
import type { Project } from "../../lib/mock-data";
import type { Product, ProductVariant } from "../../lib/product-library/types";
import { useI18n } from "../providers/language-provider";
import { Button, Modal } from "../ui/primitives";

export function AddProductToProjectDialog({ product, variants, projects, initialVariantId, onAdd, onClose }: { product: Product; variants: ProductVariant[]; projects: Project[]; initialVariantId?: string; onAdd: (projectId: number, variantId: string | undefined, note: string) => boolean; onClose: () => void }) {
  const { t, text } = useI18n();
  const [projectId, setProjectId] = useState(projects[0]?.id ?? 0);
  const [variantId, setVariantId] = useState(initialVariantId ?? "");
  const [note, setNote] = useState("");
  const submit = (event: FormEvent) => { event.preventDefault(); if (projectId && onAdd(projectId, variantId || undefined, note.trim())) onClose(); };
  return <Modal title={t("product.addToProject")} onClose={onClose}>
    <form className="modal-form product-add-form" onSubmit={submit}>
      <p>{product.productCode} · {text(product.name)}</p>
      <label>{t("product.selectProject")}<select value={projectId} onChange={(event) => setProjectId(Number(event.target.value))} required>{projects.map((project) => <option key={project.id} value={project.id}>{project.code} · {text(project.name)}</option>)}</select></label>
      <label>{t("product.selectVariant")}<select value={variantId} onChange={(event) => setVariantId(event.target.value)}><option value="">{t("product.familyLevel")}</option>{variants.map((item) => <option key={item.id} value={item.id}>{item.variantCode}</option>)}</select></label>
      <label>{t("product.applicationNote")}<textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder={t("product.pending")} /></label>
      <p className="product-modal-hint">{t("product.candidate")} · {t("product.demo")}</p>
      <div className="modal-actions"><Button type="button" variant="ghost" onClick={onClose}>{t("common.cancel")}</Button><Button type="submit">{t("product.addToProject")}</Button></div>
    </form>
  </Modal>;
}
