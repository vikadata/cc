import {
  ContractType,
  getSQCResult,
  PersonnelRole,
  PersonnelType,
  Personnel,
} from "./autopilot";

export type MyRecord = {
  id: string;
  fields: {
    [name: string]: any;
  };
};

export type MyResult = {
  [id: string]: {
    [fieldName: string]: any;
  };
};

// 全职名单
const fulltime: Personnel[] = [
  { name: "詹培薇", type: PersonnelType.Employee },
  { name: "杨敏凤", type: PersonnelType.Employee },
  { name: "林晓欣", type: PersonnelType.Employee },
  { name: "李洁玲", type: PersonnelType.Employee },
  { name: "梁浩勋", type: PersonnelType.Employee },
  { name: "黄俊业", type: PersonnelType.Employee },
  { name: "周健龙", type: PersonnelType.Employee },
  { name: "刘琪", type: PersonnelType.Employee },
  { name: "唐明", type: PersonnelType.Employee },
  { name: "李健成", type: PersonnelType.Employee },
  { name: "单文辉", type: PersonnelType.Employee },
  { name: "吴炳霏", type: PersonnelType.Employee },
  { name: "田露", type: PersonnelType.Employee },
  { name: "肖晓斌", type: PersonnelType.Employee },
  { name: "邝宇恒", type: PersonnelType.Employee }
];

// 兼职名单
const contractor: Personnel[] = [
  { name: "顾佳亮", type: PersonnelType.Contractor },
  { name: "刘东升", type: PersonnelType.Contractor },
  { name: "胡田丰", type: PersonnelType.Contractor },
  { name: "李典", type: PersonnelType.Contractor },
  { name: "张辛涛XinEr", type: PersonnelType.Contractor }
];

//判断员工类型
function checkEmployeeStatus(name: string): PersonnelType {
  if (fulltime.some(personnel => personnel.name === name)) {
    return PersonnelType.Employee;
  } else if (contractor.some(personnel => personnel.name === name)) {
    return PersonnelType.Contractor;
  } else {
    return PersonnelType.Partner;
  }
}

//测试打印
console.log(checkEmployeeStatus("张钰彬"));

export function calcSQC(records: MyRecord[]): MyResult {
  console.log(records);
  const result: MyResult = {};
  const parttimeGroups = new Map();


  for (const record of records) {
    if (fulltime.some(personnel => personnel.name === record.fields["客户负责人(KP)"][0][0].name)) {
      // 全职
      const name = record.fields["客户负责人(KP)"][0][0].name;
      const amount = record.fields["❗️财务实收金额"];
      const salesCost = record.fields["销售成本"];
      const sqc = getSQCResult({
        contract: {
          customer: {},
          lead: {
            sourcer: {
              type: checkEmployeeStatus(record.fields["客户开发人"][0][0].name),
            },
            sales: {
              type: checkEmployeeStatus(record.fields["客户负责人(KP)"][0][0].name),
            },
            servant: {
              type: checkEmployeeStatus(record.fields["客户服务(KU)"][0][0].name),
            },
          },
          tcv: record.fields["判定TCV"],
          period: +record.fields['合同周期']< 12 ? 12 : +record.fields['合同周期'],
          type:
            record.fields["订单提成率类型"].length && record.fields['订单提成率类型'][0]?.name === "续费"
              ? ContractType.Renewal
              : ContractType.New,
        },
        amount,
        salesCost,
      });
      console.log(sqc)
      result[record.id+'负责人'] = {
        成员: name,
        SQR判定日期: record.fields["SQR判定日期"],
        实收台账标题: record.fields["标题"],
        角色: "负责人",
        SQC: sqc.salesSQC+sqc.partnerSalesSQC,
      };
    } else {
      // 渠道和兼职
    }
    
    if (fulltime.some(personnel => personnel.name === record.fields["客户开发人"][0][0].name)) {
      // 全职
      const name = record.fields["客户开发人"][0][0].name;
      const amount = record.fields["❗️财务实收金额"];
      const salesCost = record.fields["销售成本"];
      const sqc = getSQCResult({
        contract: {
          customer: {},
          lead: {
            sourcer: {
              type: PersonnelType.Employee,
            },
            sales: {
              type: checkEmployeeStatus(record.fields["客户负责人(KP)"][0][0].name),
            },
            servant: {
              type: PersonnelType.Employee,
            },
          },
          tcv: record.fields["判定TCV"],
          period: +record.fields['合同周期']< 12 ? 12 : +record.fields['合同周期'],
          type:
            record.fields["订单提成率类型"].length && record.fields['订单提成率类型'][0]?.name === "续费"
              ? ContractType.Renewal
              : ContractType.New,
        },
        amount,
        salesCost,
      });
      console.log(sqc)
      result[record.id+'开发人'] = {
        成员: name,
        SQR判定日期: record.fields["SQR判定日期"],
        实收台账标题: record.fields["标题"],
        角色: "开发人",
        SQC: sqc.sourcerSQC,
      };
      result[record.id+'渠道服务'] = {
        成员: name,
        SQR判定日期: record.fields["SQR判定日期"],
        实收台账标题: record.fields["标题"],
        角色: "渠道服务",
        SQC: sqc.partnerSalesSQC,
      };
    } else {
      // 渠道和兼职
    }
    if (fulltime.some(personnel => personnel.name === record.fields["客户服务(KU)"][0][0].name)) {
      // 全职
      const name = record.fields["客户服务(KU)"][0][0].name;
      const amount = record.fields["❗️财务实收金额"];
      const salesCost = record.fields["销售成本"];
      const sqc = getSQCResult({
        contract: {
          customer: {},
          lead: {
            sourcer: {
              type: checkEmployeeStatus(record.fields["客户开发人"][0][0].name),
            },
            sales: {
              type: checkEmployeeStatus(record.fields["客户负责人(KP)"][0][0].name),
            },
            servant: {
              type: checkEmployeeStatus(record.fields["客户服务(KU)"][0][0].name),
            },
          },
          tcv: record.fields["判定TCV"],
          period: +record.fields['合同周期']< 12 ? 12 : +record.fields['合同周期'],
          type:
            record.fields["订单提成率类型"].length && record.fields['订单提成率类型'][0]?.name === "续费"
              ? ContractType.Renewal
              : ContractType.New,
        },
        amount,
        salesCost,
      });
      console.log(sqc)
      result[record.id+'客户服务'] = {
        成员: name,
        SQR判定日期: record.fields["SQR判定日期"],
        实收台账标题: record.fields["标题"],
        角色: "客户服务",
        SQC: sqc.serviceSQC,
      };
    } else {
      // 渠道和兼职
      const date = record.fields["SQR判定月份"];
      const name = record.fields["客户负责人(KP)"][0][0].name;
      const groupKey = date + "\\" + name;
      const tcv = parttimeGroups.get(groupKey);
      if (tcv === undefined) {
        parttimeGroups.set(groupKey, record.fields["SQR"]);
      } else { 
        parttimeGroups.set(groupKey, tcv + record.fields["SQR"]);
      }
    }
  }

  // 根据SQR划分兼职SAB
  const parttimeRole = new Map();
  for (const [groupKey, sqr] of parttimeGroups) {
    let role: PersonnelRole;
    if (sqr < 30000) {
      role = PersonnelRole.B;
    } else if (sqr < 50000) {
      role = PersonnelRole.A;
    } else {
      role = PersonnelRole.S;
    }
    parttimeRole.set(groupKey, role);
  }

  // 计算兼职SQC
  for (const record of records) {
    if (fulltime.some(personnel => personnel.name === record.fields["客户开发人"][0][0].name)) {
      // 全职
      const date = record.fields["SQR判定月份"];
      const name = record.fields["客户负责人(KP)"][0][0].name;
      const groupKey = date + "\\" + name;
      const role = parttimeRole.get(groupKey)!;
      const amount = record.fields["❗️财务实收金额"];
      const salesCost = record.fields["销售成本"];
      const sqc = getSQCResult({
        contract: {
          customer: {},
          lead: {
            sourcer: {
              type: PersonnelType.Employee,
            },
            sales: {
              type: checkEmployeeStatus(record.fields["客户负责人(KP)"][0][0].name),
              role,
            },
            servant: {
              type: PersonnelType.Employee,
            },
          },
          tcv: record.fields["判定TCV"],
          period: +record.fields['合同周期']< 12 ? 12 : +record.fields['合同周期'],
          type:
            record.fields["订单提成率类型"].length && record.fields['订单提成率类型'][0]?.name === "续费"
              ? ContractType.Renewal
              : ContractType.New,
        },
        amount,
        salesCost,
      });
      console.log(sqc)
      result[record.id+'开发人'] = {
        成员: record.fields["客户开发人"][0][0].name,
        SQR判定日期: record.fields["SQR判定日期"],
        实收台账标题: record.fields["标题"],
        角色: "开发人",
        SQC: sqc.sourcerSQC,
      };
      result[record.id+'渠道服务'] = {
        成员: record.fields["客户开发人"][0][0].name,
        SQR判定日期: record.fields["SQR判定日期"],
        实收台账标题: record.fields["标题"],
        角色: "渠道服务",
        SQC: sqc.partnerSalesSQC,
      };
      result[record.id+'负责人'] = {
        成员: record.fields["客户负责人(KP)"][0][0].name,
        SQR判定日期: record.fields["SQR判定日期"],
        实收台账标题: record.fields["标题"],
        角色: "负责人",
        SQC: sqc.salesSQC,
      };
    } else if (contractor.some(personnel => personnel.name === record.fields["客户负责人(KP)"][0][0].name)) {
      // 兼职
      const date = record.fields["SQR判定月份"];
      const name = record.fields["客户负责人(KP)"][0][0].name;
      const groupKey = date + "\\" + name;
      const role = parttimeRole.get(groupKey)!;
      const amount = record.fields["❗️财务实收金额"];
      const salesCost = record.fields["销售成本"];

      const sqc = getSQCResult({
        contract: {
          customer: {},
          lead: {
            sourcer: {
              type: checkEmployeeStatus(record.fields["客户开发人"][0][0].name),
              role,
            },
            sales: {
              type: checkEmployeeStatus(record.fields["客户负责人(KP)"][0][0].name),
              role,
            },
            servant: {
              type: checkEmployeeStatus(record.fields["客户服务(KU)"][0][0].name),
              role,
            },
          },
          tcv: record.fields["判定TCV"],
          period: +record.fields['合同周期']< 12 ? 12 : +record.fields['合同周期'],
          type:
            record.fields["订单提成率类型"].length && record.fields['订单提成率类型'][0]?.name === "续费"
              ? ContractType.Renewal
              : ContractType.New,
        },
        amount,
        salesCost,
      });
      console.log(sqc)
      result[record.id+'负责人'] = {
        成员: name,
        SQR判定日期: record.fields["SQR判定日期"],
        实收台账标题: record.fields["标题"],
        角色: "负责人",
        SQC: sqc.salesSQC,
      };
      console.log(result)
    } else {
      // 渠道
    }
  }
  return result;
}