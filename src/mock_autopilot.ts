import { PersonnelType, AmoebaType, PersonnelRole, Lead, Customer, Contract, Personnel, Payment, SQCResult, AmoebaBill, getSalesCommissionRate, ContractType } from './autopilot';
import * as lib from './autopilot';


/**
 * 职员
 */
const personnel: { [id: string]: Personnel} = {
    'amen': {
        name: 'amen',
        type: PersonnelType.Employee,
        // role: PersonnelRole.B,

    },
    'bmen': {
        name: 'amen',
        type: PersonnelType.Employee,
        // role: PersonnelRole.ENT,
    },
    'cmen': {
        name: 'cmen',
        type: PersonnelType.Employee,
        // role: PersonnelRole.CSM,
    },

    'dmen': {
        name: 'dmen',
        type: PersonnelType.Employee,
        // role: PersonnelRole.SME,
    },
    'emen': {
        name: 'emen',
        type: PersonnelType.Contractor,
        role: PersonnelRole.B,
    },
    'fmen': {
        name: 'fmen',
        type: PersonnelType.Partner,
        role: PersonnelRole.B,
    },
}

// SQL lead
const leads: {[key: string]: Lead} = {
    'A1': {
        sourcer: personnel['amen'],
        sales: personnel['bmen'],
        servant: personnel['cmen']
        // partnerSales: 'tom'
    },
    // contractor example
    'B1': {
        sourcer: personnel['dmen'],
        sales: personnel['emen'],
        servant: undefined,
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
        period: 12,
        type: ContractType.New,
    },
    "b": {
        customer: customers['B'],
        lead: leads['B1'],
        tcv: 10000,
        period: 12,
        type: ContractType.New,
    }
}

/**
 * 回款
 */
const payments: {[key: string]: Payment} = {
    'pay1': {
        contract: contracts['a'],
        amount: 10000,
        salesCost: 0,
    },
    'pay2': {
        contract: contracts['b'],
        amount: 10000,
        salesCost: 0,
    }
}

// Amoeba
export const amoebas = {
    'ent': {
        type: AmoebaType.InHouse,
        members: [
            'amen',
            'bmen',
        ]
    },
    'sme': {
        type: AmoebaType.InHouse,
        members: [
            'cmen',
            'dmen',
            'emen',
            'fmen',
        ]
    },
    'bonuspool': {
        type: AmoebaType.BonusPool,
        members: [],
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


function main() {

    const sqcResultsList: SQCResult[] = [];
    const personnelsSQC: {[key: string]: number} = {

    };

    // 通过回款算出SQC，虚出SQC收入，放到阿米巴
    for (const key in payments) {
        const payment = payments[key];
        
        // const contract = contracts[payment.contract]
        const sqcResult = lib.getSQCResult(payment);

        const lead = payment.contract.lead;
        const contract = payment.contract;

        const sourcer = lead.sourcer;
        const sales = lead.sales;
        const servant = lead.servant;
        const partnerSales = lead.partnerSales;

        console.log('================================================================');
        console.log(`Contract合同： tcv: ${contract.tcv}, period: ${contract.period}, type: ${contract.type}`)
        console.log(`Payment回款： ${payment.amount}`)
        console.log(`Sourcer线索开发： ${lead.sourcer.type}, ${lead.sourcer.role}`);
        console.log(`Sales销售： ${lead.sales.type}, ${lead.sales.role}`);
        if (lead.servant)
            console.log(`Servant KU服务: ${lead.servant.type}, ${lead.servant.role}`);
        console.log(sqcResult);

        sqcResultsList.push(sqcResult);

        // 累计SQC
        personnelsSQC[sourcer.name] = (personnelsSQC[sourcer.name] || 0) + sqcResult.sourcerSQC;
        personnelsSQC[sales.name] = (personnelsSQC[sales.name] || 0) + sqcResult.salesSQC;

        if (servant)
            personnelsSQC[servant.name] = (personnelsSQC[servant.name] || 0) + sqcResult.serviceSQC;

        if (partnerSales)
            personnelsSQC[partnerSales.name] = (personnelsSQC[partnerSales.name] || 0) + sqcResult.partnerSalesSQC;
        

        // for (const sqcResult of sqcResults) {
        //     const amoeba = null;
        //     const amoebaBill = {
        //         amoeba: amoeba,
        //         amount: sqcResult.sqc,
        //         reason: sqcResult.reason
        //     }
        // }
    }

    console.log('---------------- personnels SQC ----------------')
    console.log(personnelsSQC);

    console.log('---------------- amoeba SQC ----------------')
    const amoebasResult: {[name:string]:number} = {};
    for (const amoebaName in amoebas) {
        const amoeba = amoebas[amoebaName];
        for (const memberName of amoeba.members) {
            const personSQC = personnelsSQC[memberName] || 0;
            amoebasResult[amoebaName] = (amoebasResult[amoebaName] || 0) + personSQC;
        }
    }

    
    // 根据SQC和其它成本bill，计算成员SQC、阿米巴余额、阿米巴余额
    for ( const sqcR of sqcResultsList) {
        amoebasResult['bonuspool'] =  ( amoebasResult['bonuspool'] || 0) + sqcR.bonusPool
    }

    console.log(amoebasResult);



    // 生成报告

}



if (module == require.main) {
    main();
}