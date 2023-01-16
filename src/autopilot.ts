// Auto Pilot for Commission Calculator
// Generate report automatically

import commissionRate from "./commission_rate";


/**
 * 职员类型
 */
export enum PersonnelType {
    Employee = 'employee',
    Contractor = 'contractor',
    Partner = 'partner',
  }

  export enum PersonnelRole {
    ENT = 'ent',
    SME = 'sme',
    CSM = 'csm',
    S = 's',
    A = 'a',
    B = 'b',

  }
export interface Personnel {
  name?: string;
    type: PersonnelType;
    role: PersonnelRole;
}
/**
 * 线索
 */
export interface Lead {
    sourcer: Personnel;
    sales: Personnel;
    servant: Personnel;
    partnerSales?: Personnel;
}

export interface Customer {

}
/**
 * 合同
 */
export interface Contract {
    customer: Customer;
    lead: Lead;
    tcv: number;
    period: number;

}
/**
 * 回款
 */
export interface Payment {
    contract: Contract;
    amount: number;
    salesCost: number;
}

/**
 * 统计周期
 */
enum PeriodType {
    AllTime,
    LastMonth,
    CurrentMonth,
}

/**
 * 阿米巴
 */
export interface Amoeba {
    type: PersonnelType;
    members: Personnel[];
}

/**
 * 阿米巴账单
 */
export interface AmoebaBill {
    amoeba: Amoeba;
    amount: number;
    reason: string;
    type: AmoebaBillType;
}


/**
 * SQC计算结果 （针对Payment）
 */
export class SQCResult {

    sourcerSQC: number;
    salesSQC: number;
    serviceSQC: number;
    partnerSalesSQC: number;
    bonusPool: number;
    compensation: number;

    /**
     * 销售人类型
     */
    salesType: PersonnelType;
  
    constructor(source: Partial<SQCResult>) {
        Object.assign(this, source);
    }

    get partnerIncome() {
      if (this.salesType != PersonnelType.Employee) {
        return this.salesSQC - this.compensation;
      }

      return 0;
    }
}

export const sourcerCommissionRate = (sourcerType, employeeSalesType) => {
  // sourcer必须是雇员
  return getCommissionRate(sourcerType, "sourcer", employeeSalesType);
};

/**
 * 服务人员的提成率
 */
export const serviceCommissionRate = (salesType, employeeSalesType) => {
  if (salesType == "employee")
    return getCommissionRate("employee", "service", employeeSalesType);
  return 0;
};

/**
 * 计算所有SQC如何分
 */
export function getSQCResult(payment: Payment, compensation: number = 0): SQCResult{

  const contract = payment.contract;
  const sqrOfProduct = getSQR(payment.amount, contract.period);
  const sourcerType = contract.lead.sourcer.type;
  const sourcerRole = contract.lead.sourcer.role;
  const salesType = contract.lead.sales.type;
  const szSalesType = salesType.toString().toLowerCase();

  const paymentMargin = payment.amount - payment.salesCost;
  const employeeSalesType = contract.lead.sales.role; // if employee sales
  const partnerLevel = contract.lead.sales.role; // if partner

  let salesSQC = 0;
  if (salesType == PersonnelType.Partner) {
      salesSQC = paymentMargin * getSalesCommissionRate(szSalesType, employeeSalesType, partnerLevel); // partner按回款、contractor按SQR
    } else if (salesType == PersonnelType.Employee) {
      salesSQC = sqrOfProduct * getSalesCommissionRate(szSalesType, employeeSalesType, partnerLevel);
    } else {
      salesSQC = sqrOfProduct * getSalesCommissionRate(szSalesType, employeeSalesType, partnerLevel);
    }

  // start calc the SQC
  let sourcerSQC = 0;
  // 我们开发的线索，给到Partners，我们的怎么分？
  if (szSalesType == "employee") {
    sourcerSQC = sqrOfProduct * sourcerCommissionRate(sourcerType, sourcerRole);
  } else {
    // 如果是渠道合作伙伴，减掉他们的分成后，剩下的才是我们的
    sourcerSQC = (sqrOfProduct - salesSQC) * sourcerCommissionRate(sourcerType, sourcerRole);
  }

  const serviceSQC = sqrOfProduct * serviceCommissionRate(szSalesType, employeeSalesType);

  const payServiceSQC = 0;

  let partnerSalesSQC = 0
  if (szSalesType != "employee") {
    partnerSalesSQC = (sqrOfProduct - salesSQC) * getCommissionRate("employee", "partnersales");
  }

  const bonusPool = sqrOfProduct * getCommissionRate("employee", "bonus");

  const res = new SQCResult({
      sourcerSQC: sourcerSQC,
      salesSQC: salesSQC,
      serviceSQC: serviceSQC,
      // payServiceSQC: payServiceSQC,
      partnerSalesSQC: partnerSalesSQC,
      bonusPool: bonusPool,
      compensation: compensation,

      salesType: salesType,
  })
  return res;

}
/**
 * 阿米巴账单类型
 */
export enum AmoebaBillType {
    SQC = 'sqc',
    Salary = 'salary',
}


export function getARR(productTCV: number, periodMonthly: number) {
  return productTCV / (periodMonthly / 12);
}

export function getMRR(productTCV: number, periodMonthly: number) {
  return productTCV / periodMonthly;
}

/**
 * Product SQR
 */
export function getSQR(productPayment: number, periodMonthly: number) {
  const contractPeriodYearly = periodMonthly / 12;
  return productPayment / contractPeriodYearly +
    ((productPayment * (contractPeriodYearly - 1)) / contractPeriodYearly) *
      0.5;
}

/**
 * 销售提成率，根据不同的销售职员类型、岗位类型，提成率不同
 */
export const getSalesCommissionRate = (salesType: string, employeeSalesType: string, partnerLevel: string) => {
  if (salesType == 'employee') {
      return getCommissionRate('employee', "sales", employeeSalesType);
  } else {
      return getCommissionRate(salesType, "sales", partnerLevel); // contractor、partner分级别
  }
};

/**
 * 根据职员、岗位、额外属性，提取提成率对象
 */
export const getCommissionRateObject = (personnelType: string, role, extra = undefined) => {
  const key =
    extra === undefined
      ? `${personnelType}-${role}`
      : `${personnelType}-${role}-${extra}`;
  const obj = commissionRate[key];
  return obj;
};

/**
 * 根据职员、岗位、额外属性，提取提成率对象
 */
export const getCommissionRate = (personnelType, role, extra = undefined) => {
  const obj = getCommissionRateObject(personnelType, role, extra);
  if (obj) return obj.rate;
  return 0;
};

/**
 * 计算所有阿米巴余额
 */
export function calc(
    leads: {[key: string]: Lead}, 
    customers: {[key: string]:Customer},
    amoebas: {[key: string]: Amoeba},
    amoebaBiils: {[key: string]: AmoebaBill}
    ) {
    // for (const bill of amoebaBills) {

    // }
}
