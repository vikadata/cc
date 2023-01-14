<script>
  import "app.css";

  // total contract value
  export let tcv = 10000;

  /**
   * the sourcing people personnel type
   */
  export let whoSourcingType = "employment";

  // 第三方销售成本
  export let salesCost = 0;

  // 合同毛利
  $: contractMargin = tcv - salesCost;

  export let whoSalesType = "employment";
  export let cycle = 12;
  export let contractType = "product";
  export let contractServiceValue = 0; // 服务部分占合同的多少？

  // 合同中的产品部分价值
  $: contractProductValue =
    contractType == "product"
      ? tcv
      : contractType == "service"
      ? 0
      : contractType == "hybrid"
      ? tcv - contractServiceValue
      : 0;

  $: arr = contractProductValue / cycle;
  // 回款
  export let payment = 3000;

  // 回款比例
  $: paymentRatio = payment / tcv;

  // SQR 销售确认收入
  $: cycleYearly = cycle / 12; // 12个月为年化
  $: sqr = payment / cycleYearly + (payment * (cycleYearly - 1)) / cycleYearly;

  export let personnelTypes = [
    { id: "employment", text: `全职雇员 Employment` },
    { id: "contractor", text: `合约雇员 Contractor` },
    { id: "partner", text: `渠道合作伙伴 Partner` },
  ];
  export let contractTypes = [
    { id: "product", text: `纯产品 Product-only` },
    { id: "service", text: `纯服务 Service-only` },
    { id: "hybrid", text: `产品加服务 Hybrid` },
  ];

  export let commissionRate = {
    "employment-sourcer": 0.04,
    "employment-sales": 0.2,
    "partner-sourcer": 0.04,
    "partner-sales": 0.49,
    "contractor-sourcer": 0.04,
    "contractor-sales": 0.49,
  };

  const getCommissionRate = (personnelType, role) => {
    return commissionRate[`${personnelType}-${role}`];
  };

  $: sourcerSQC = sqr * getCommissionRate(whoSourcingType, "sourcer");
  $: salesSQC = sqr * getCommissionRate(getCommissionRate, "sales");
</script>

<main>
  <h1 class="text-3xl font-bold underline">提成计算器 Commision Calculator</h1>
  <!-- <p>Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn how to build Svelte apps.</p> -->
  <form>
    <table>
      <tr>
        <td>
          <label for="tcv">有多少合同总价值(TCV, Total Contract Value)?</label>
        </td>
        <td>
          <input name="tcv" type="number" bind:value={tcv} />
        </td>
      </tr>

      <tr>
        <td>
          <label for="salesCost">销售成本(Sales Cost)?</label>
        </td>
        <td>
          <input name="salesCost" type="number" bind:value={salesCost} />
        </td>
      </tr>
      <tr>
        <td>
          <label for="contractMargin">合同毛利(Contract Margin)?</label>
        </td>

        <td>
          {contractMargin}
        </td>
      </tr>
      <tr>
        <td>
          <label for="contractType">合同类型?</label>
        </td>
        <td>
          <select name="contractType" bind:value={contractType}>
            {#each contractTypes as ct}
              <option value={ct.id}>
                {ct.text}
              </option>
            {/each}
          </select>
        </td>
      </tr>

      {#if contractType == "hybrid"}
        <tr>
          <td>
            <label for="contractServiceValue">
              合同中的服务价值多少(Service value in this contract)?
            </label>
          </td>
          <td>
            <input
              name="contractServiceValue"
              type="number"
              bind:value={contractServiceValue}
            />
          </td>
        </tr>
        <tr>
          <td>
            <label for="contractProductValue"
              >合同中的产品价值多少(Product value in this contract)?</label
            >
          </td>
          <td>
            {contractProductValue}
          </td>
        </tr>
      {/if}
    </table>

    <label for="cycle">合同周期多少个月(Cycle)?</label>
    <input name="cycle" type="number" bind:value={cycle} />

    <p>合同总年度经常性收入(ARR): {arr}</p>

    <p>合同总价值(TCV): {tcv}</p>

    <label for="payment">回款 Payment?</label>
    <input name="payment" type="number" bind:value={payment} />

    <label for="paymentRatio">回款比例 Payment Ratio?</label>
    {paymentRatio * 100}%

    <div class="columns-2">
      <span><label for="whoSourcingType">谁开发的(Sourcer)？</label></span>
      <span>
        <select name="whoSourcingType" bind:value={whoSourcingType}>
          {#each personnelTypes as personnelType}
            <option value={personnelType.id}>
              {personnelType.text}
            </option>
          {/each}
        </select>
      </span>
    </div>

    <label for="whoSalesType">谁销售的(Sales)？</label>
    <select name="whoSalesType" bind:value={whoSalesType}>
      {#each personnelTypes as personnelType}
        <option value={personnelType.id}>
          {personnelType.text}
        </option>
      {/each}
    </select>

    <label for="sqr">销售确认收入 (SQR, Sales Qualified Revenue)？</label>
    {sqr}

    <label>Sourcer提成率：</label>
    {getCommissionRate(whoSourcingType, "sourcer")}

    <label for="sourcerSQC">Sourcer可提成收入 (SQC)?</label>
    {sourcerSQC}

    <label>Sales提成率：</label>
    {getCommissionRate(whoSalesType, "sales")}

    <label for="salesSQC">Sales可提成收入 (SQC)?</label>
    {salesSQC}
  </form>
</main>

<!-- 
<style>
  main {
    text-align: left;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style> -->
