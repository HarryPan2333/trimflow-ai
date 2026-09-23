import type { LocalizedText } from "./types";

const values: Record<string, LocalizedText> = {
  nylon_tpu: { zh: "尼龙 + TPU", en: "Nylon + TPU" },
  zinc_alloy: { zh: "锌合金", en: "Zinc alloy" },
  nylon: { zh: "尼龙", en: "Nylon" },
  recycled_nylon: { zh: "再生尼龙（来源待核实）", en: "Recycled nylon (source pending)" },
  recycled_polyester_blend: { zh: "再生涤纶混纺（来源待核实）", en: "Recycled polyester blend (source pending)" },
  polyester: { zh: "涤纶", en: "Polyester" },
  aluminum: { zh: "铝合金", en: "Aluminum" },
  matte: { zh: "哑光", en: "Matte" },
  antique_brass: { zh: "仿古铜", en: "Antique brass" },
  brushed: { zh: "拉丝", en: "Brushed" },
  Black: { zh: "黑色", en: "Black" },
  "Cool Gray": { zh: "冷灰色", en: "Cool Gray" },
  "Antique brass": { zh: "仿古铜色", en: "Antique brass" },
  Sand: { zh: "沙色", en: "Sand" },
  Sage: { zh: "鼠尾草绿", en: "Sage" },
  Clay: { zh: "陶土色", en: "Clay" },
  "TPU coating": { zh: "TPU 覆膜", en: "TPU coating" },
  plating: { zh: "电镀", en: "Plating" },
  water_resistant: { zh: "防泼水方向", en: "Water-resistant concept" },
  custom_logo: { zh: "可定制标识", en: "Custom logo option" },
  premium_finish: { zh: "质感表面", en: "Premium finish" },
  lightweight: { zh: "轻量化方向", en: "Lightweight concept" },
  recycled_material: { zh: "再生材料方向", en: "Recycled material concept" },
};

export function productValue(code: string): LocalizedText {
  return values[code] ?? { zh: code, en: code };
}
