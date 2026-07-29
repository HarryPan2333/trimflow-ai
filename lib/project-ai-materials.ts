export type ProjectMaterial = {
  id: number;
  code: string;
  name: string;
  sections: Array<{
    id: string;
    title: string;
    content: string;
  }>;
};

export const projectMaterials: Record<number, ProjectMaterial> = {
  1: {
    id: 1,
    code: "NAS-2407",
    name: "北美运动服装品牌——防水拉链开发",
    sections: [
      {
        id: "project_profile",
        title: "项目基本信息",
        content:
          "客户：North American Sportswear Brand；地区：美国西雅图；产品：防水尼龙拉链；阶段：打样中；负责人：陈晨；预计数量：120,000 条 / 年；目标交期：2026-10-15；项目状态：良好。",
      },
      {
        id: "confirmed_requirements",
        title: "已确认的产品要求",
        content:
          "产品类型：TPU 膜防水尼龙拉链；材质：尼龙链牙 + TPU 膜；颜色：Black C、Cool Gray 11 C；尺寸：#5；长度：58 cm、64 cm、72 cm；表面处理：哑光膜面；预计数量：120,000 条 / 年；目标交期：2026-10-15。",
      },
      {
        id: "open_items",
        title: "待确认及冲突事项",
        content:
          "拉片定制 Logo 的最终图稿与雕刻位置待确认；目标价格 USD 0.82 / 条尚未确认；AATCC 22 测试应以水洗 3 次还是 5 次后防泼水等级不低于 80 分为准，双方尚未统一；首批订单各长度的数量比例及大货包装、条码要求尚未确认。",
      },
      {
        id: "sample_status",
        title: "样品进度",
        content:
          "V2 黑色、灰色样品各 6 条，已于 2026-07-24 寄出，并于 2026-07-28 由 Olivia Reed 签收。客户将优先测试 64 cm 黑色样品，预计周四提供初步反馈。",
      },
      {
        id: "communications",
        title: "客户沟通",
        content:
          "客户确认已收到 V2 样品，并询问指定的防泼水等级能否在水洗 5 次后保持。客户偏好简洁、专业、数据导向的英文邮件。",
      },
      {
        id: "internal_notes",
        title: "内部备注",
        content:
          "技术部说明现有配方可稳定达到水洗 3 次后防泼水等级不低于 80 分；若改为水洗 5 次，需调整膜材，预计增加 3%–5% 的成本。当前尚未形成最终报价。",
      },
    ],
  },
  2: {
    id: 2,
    code: "EFC-2411",
    name: "欧洲时尚品牌——金属纽扣项目",
    sections: [
      {
        id: "project_profile",
        title: "项目基本信息",
        content:
          "客户：European Fashion Client；地区：法国巴黎；产品：锌合金四合扣；阶段：报价中；负责人：王璐；预计数量：80,000 套；目标交期：2026-11-20；项目状态：关注。",
      },
      {
        id: "latest_progress",
        title: "最新进展",
        content:
          "已提交 V2 阶梯报价，客户正在内部评估。报价金额未记录在当前项目材料中。",
      },
      {
        id: "next_action",
        title: "下一步行动",
        content:
          "补充 REACH 测试费用与模具费说明。联系人为 Camille Bernard，职位为 Buyer。",
      },
    ],
  },
  3: {
    id: 3,
    code: "EYW-2502",
    name: "瑜伽服品牌——2027服装辅料系列",
    sections: [
      {
        id: "project_profile",
        title: "项目基本信息",
        content:
          "客户：Emerging Yoga Wear Brand；地区：澳大利亚墨尔本；产品：隐形拉链、绳扣、织带；阶段：需求确认；负责人：林薇；预计数量：首单约 45,000 件套；目标交期：2027-01-10；项目状态：关注。",
      },
      {
        id: "latest_progress",
        title: "最新进展",
        content:
          "已收到客户概念板，仍需确认三组 Pantone 色号。当前项目材料中没有价格信息。",
      },
      {
        id: "next_action",
        title: "下一步行动",
        content:
          "向客户发送产品规格确认表与颜色选项。联系人为 Mia Collins，职位为 Founder。",
      },
    ],
  },
  4: {
    id: 4,
    code: "OC-2418",
    name: "户外服饰客户——反光绳扣升级",
    sections: [
      {
        id: "project_profile",
        title: "项目基本信息",
        content:
          "客户：Outdoor Clothing Client；地区：德国汉堡；产品：反光绳扣；阶段：谈判中；负责人：陈晨；预计数量：200,000 个；目标交期：2026-12-05；项目状态：风险。",
      },
      {
        id: "latest_progress",
        title: "最新进展",
        content:
          "客户要求在原报价基础上降低 4%。原报价金额未记录在当前项目材料中。",
      },
      {
        id: "next_action",
        title: "下一步行动",
        content:
          "准备数量阶梯方案与材质替代方案。联系人为 Jonas Weber，职位为 Sourcing Manager。",
      },
    ],
  },
};
