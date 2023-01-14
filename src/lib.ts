

  export function getARR(productTCV: number, periodMonthly: number) {
    return productTCV / (periodMonthly / 12);
  }

  export function getMRR(productTCV: number, periodMonthly: number) {
    return productTCV / periodMonthly;
  }