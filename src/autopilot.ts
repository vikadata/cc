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
    Enterprise = 'ent',
    SME = 'sme',
    CSM = 'csm',
    S = 's',
    A = 'a',
    B = 'b',

  }
export interface Personnel {
    type: PersonnelType;
    role: PersonnelRole;
}
/**
 * 线索
 */
export interface Lead {
    sourcer: Personnel;
    sales: Personnel;
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
    personnel: string;
    sqc: number
    reason: string;
    // sourcerSQC: number;
    // salesSQC: number;
    // serviceSQC: number;
    // partnerSalesSQC: number;
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
