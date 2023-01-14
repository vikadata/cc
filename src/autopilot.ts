// Auto Pilot for Commission Calculator



// Contracts

const contracts = {
    "a": {
        customerName: 'A',
        tcv: '10000',
        period: '18',
    },
    "b": {
        customerName: 'B',
        tcv: '20000',
        period: '36',
    }
}

// Payments
const payments = {
    'pay1': {
        contract: 'a'
    },
    'pay2': {
        contract: 'b'
    }
}


// Amoeba
export const amoeba = {
    'ent': {

    },
    'sme': {

    }
}

// Amoeba Bills
export const amoebaBills = [
    {
        amoeba: 'ent',
        price: 10000,
        type: 'sqc',
    },
    {
        amoeba: 'ent',
        price: -20000,
        type: 'salary',
    },
]


enum PeriodType {
    AllTime,
    LastMonth,
    CurrentMonth,
}

/**
 * 计算所有阿米巴余额
 */
function calcAmoebaBalances(amoeba: string, periodType: PeriodType) {
    for (const bill of amoebaBills) {

    }
}


function doCalc() {


}