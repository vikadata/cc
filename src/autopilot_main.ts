import { PersonnelType, PersonnelRole, Lead, Customer, Contract, Personnel, Payment, SQCResult, AmoebaBill, getSalesCommissionRate } from './autopilot';
import * as lib from './autopilot';


const personnel: { [id: string]: Personnel} = {
    'lucy': {
        type: PersonnelType.Employee,
        role: PersonnelRole.Enterprise,

    },
    'bob': {
        type: PersonnelType.Contractor,
        role: PersonnelRole.S,
    },
    'tom': {
        type: PersonnelType.Partner,
        role: PersonnelRole.A,
    },
    'mary': {
        type: PersonnelType.Employee,
        role: PersonnelRole.SME,
    }
}

// SQL lead
const leads: {[key: string]: Lead} = {
    'A1': {
        sourcer: personnel['lucy'],
        sales: personnel['bob'],
        // partnerSales: 'tom'
    },
    'B1': {
        sourcer: personnel['bob'],
        sales: personnel['tom'],
    }
}

const customers: {[key: string]: Customer} = {
    'A': {
    },
    'B': {
    }
}


// Contracts
const contracts: {[key: string]: Contract} = {
    "a": {
        customer: customers['A'],
        lead: leads['A1'],
        tcv: 10000,
        period: 18,
    },
    "b": {
        customer: customers['B'],
        lead: leads['B1'],
        tcv: 20000,
        period: 36,
    }
}

/**
 * 回款
 */
const payments: {[key: string]: Payment} = {
    'pay1': {
        contract: contracts['a'],
        amount: 3000,
        salesCost: 0,
    },
    'pay2': {
        contract: contracts['b'],
        amount: 6000,
        salesCost: 0,
    }
}

// Amoeba
export const amoebas = {
    'ent': {
        type: PersonnelType.Employee,
        members: [
            personnel['lucy'],
        ]
    },
    'sme': {
        type: PersonnelType.Employee,
        members: [
            personnel['bob'],
            personnel['tom'],
        ]

    }
}

// Amoeba Bills
export const amoebaBills = [
    {
        amoeba: amoebas['ent'],
        amount: 10000,
        type: 'sqc',
    },
    {
        amoeba: amoebas['sme'],
        amount: -20000,
        type: 'salary',
    },
]

function getSQCResult(payment: Payment): SQCResult[]{
    const sqcResults = new Array<SQCResult>();
    const res = new SQCResult();

    const contract = payment.contract;
    const sqrOfProduct = lib.getSQR(payment.amount, contract.period);
    const salesType = contract.lead.sales.type;
    const szSalesType = salesType.toString().toLowerCase();

    const paymentMargin = payment.amount - payment.salesCost;
    const employeeSalesType = 'ent';
    const partnerLevel = 'b';
    // start calc the SQC


    const sourcerSQC = 0;

    let salesSQC = 0;
    if (salesType == PersonnelType.Partner) {
        salesSQC = paymentMargin * getSalesCommissionRate(szSalesType, employeeSalesType, partnerLevel); // partner按回款、contractor按SQR
      } else if (salesType == PersonnelType.Employee) {
        salesSQC = sqrOfProduct * getSalesCommissionRate(szSalesType, employeeSalesType, partnerLevel);
      } else {
        salesSQC = sqrOfProduct * getSalesCommissionRate(szSalesType, employeeSalesType, partnerLevel);
      }

    const serviceSQC = 0;

    const payServiceSQC = 0;
    const partnerSalesSQC = 0

    sqcResults.push(res);

    return sqcResults;
}

function main() {
    // 算出SQC，虚出SQC收入，放到阿米巴
    for (const key in payments) {
        const payment = payments[key];
        
        // const contract = contracts[payment.contract]
        const sqcResults = getSQCResult(payment);

        for (const sqcResult of sqcResults) {
            const amoeba = null;
            const amoebaBill = {
                amoeba: amoeba,
                amount: sqcResult.sqc,
                reason: sqcResult.reason
            }
        }


    }

    // 根据SQC和其它成本bill，计算阿米巴余额

    // 生成报告




}



if (module == require.main) {
    main();
}