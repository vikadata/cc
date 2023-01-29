

/**
 * 提成率表
 */
const commissionRate: {[key: string]: {text: string, rate: number}} = {
  //////// employee

  // sourcing
  // "employee-sourcer": 0.07,
  "employee-sourcer-new": {
    text: '全职雇员-线索开发-新购合同',
    rate: 0.07
  },
  // "employee-sourcer-new": {
  //   text: '全职雇员-线索开发-大客户团队',
  //   rate: 0.07
  // },
  "employee-sourcer-renewal": {
    text: '全职雇员-线索开发-续费',
    rate: 0.03
  },
  // kp
  // "employee-sales": 0.16,
  "employee-sales-new": {
    text: '全职雇员-销售-新购',
    rate: 0.16,
  },
  // "employee-sales-ent": {
  //   text: '全职雇员-销售-大客户团队',
  //   rate: 0.16,
  // },
  "employee-sales-renewal": {
    text: '全职雇员-销售-续费',
    rate: 0.13,
  },

  // ku users service
  // "employee-service": 0.07,
  "employee-service-new": {
    text: '全职雇员-用户服务-新购合同',
    rate: 0.07
  },
  // "employee-service-renewal": {
  //   text: '全职雇员-用户服务-续费合同',
  //   rate: 0.07
  // },
  "employee-service-renewal": {
    text: '全职雇员-用户服务-续费合同',
    rate: 0
  },

  /**
   * 独立的付费交付服务合同的提成率
   * 给到Partner和Contractor
   */
  "employee-payservice": {
    text: '全职雇员-付费交付服务',
    rate: 0.2 
  },

  /**
   * 雇员奖金池
   */
  "employee-bonus": {
    text: '全职雇员-年/季奖金池',
    rate: 0.05,
  },

  /**
   * 渠道经理
   */
  "employee-partnersales": {
    text: '全职雇员-渠道服务',
    rate: 0.2,
  },

  //////// partner & contractors
  "partner-sourcer": {
    text: undefined,
    rate: 0
  },
  "partner-sales": {
    text: undefined,
    rate: 0.51
  },
  "partner-sales-b": {
    text: '合作伙伴(B级)销售',
    rate: 0.51
  },
  "partner-sales-a": {
    text: '合作伙伴(A级)销售',
    rate: 0.61
  },
  "partner-sales-s": {
    text: '合作伙伴(S级)销售',
    rate: 0.71,
  },
  "partner-service": {
    text: undefined,
    rate: 0,
  },
  "contractor-sourcer": {
    text: undefined,
    rate: 0,
  },
  "contractor-sales": {
    text: undefined,
    rate: 0.51,
  },
  "contractor-sales-b": {
    text: '兼职雇员(B级)销售',
    rate: 0.51,
  },
  "contractor-sales-a": {
    text: '兼职雇员(A级)销售',
    rate: 0.61,
  },
  "contractor-sales-s": {
    text: '兼职雇员(S级)销售',
    rate: 0.71,
  },
  "contractor-service": {
    text: undefined,
    rate: 0,
  }
};

export default commissionRate;