<script>
  import "app.css";

  /**
   * total contract value
   * 合同总价值
   */
  export let tcv = 10000;

  /**
   * personnel type
   * 职员类型
   */
  export let personnelTypes = [
    { id: "employee", text: `全职雇员 Employee` },
    { id: "contractor", text: `合约雇员 Contractor` },
    { id: "partner", text: `渠道合作伙伴 Partner` },
  ];

  /**
   * the sourcing people personnel type
   * Sourcer职员类型
   */
  export let sourcerType = "employee";

  /**
   * 第三方销售成本
   * 服务、采购、硬件等
   * 不包括特殊费用
   */
  export let salesCost = 0;

  /**
   * Contract Margin
   * 合同毛利
   */
  $: contractMargin = tcv - salesCost;

  /**
   * sales personnel type
   * 销售Sales的职员类型
   */
  export let salesType = "employee";

  /**
   * Sales Employee Job Type
   * 雇员型销售的类型，大客户、直销、客户成功
   */
  export let employeeSalesType = "sme";

  /**
   * Contract Period
   * 合同周期，单位月
   */
  export let contractPeriod = 12;

  /**
   * 可选合同类型
   */
  export let contractTypes = [
    { id: "product", text: `纯产品 Product-only` },
    { id: "service", text: `纯服务 Service-only` },
    { id: "hybrid", text: `产品加服务 Hybrid` },
  ];

  /**
   * Contract Type
   * 合同类型
   */
  export let contractType = "product";

  /**
   * Contract Service Value
   * 合同中的服务部分价值（排除产品价值）
   */
  export let contractServiceValue = 0;

  /**
   * 合同中的产品部分价值
   */
  $: contractProductValue =
    contractType == "product"
      ? tcv
      : contractType == "service"
      ? 0
      : contractType == "hybrid"
      ? tcv - contractServiceValue
      : 0;

  /**
   * how many payment get back?
   * 回款
   */
  export let payment = 3000;

  /**
   * Payment Ratio
   * 回款比例
   */
  $: paymentRatio = payment / tcv;

  /**
   * 合同周期年化
   */
  $: periodYearly = contractPeriod / 12; // 12个月为年化

  /**
   * ARR
   */
  $: arr = contractProductValue / periodYearly;

  /**
   * MRR
   */
  $: mrr = contractProductValue / contractPeriod;

  /**
   * SQR 销售确认收入
   */
  $: sqr =
    payment / periodYearly +
    ((payment * (periodYearly - 1)) / periodYearly) * 0.5;

  /**
   * 销售雇员岗位类型
   */
  export let employeeSalesTypes = [
    { id: "sme", text: "直销 SME" },
    { id: "ent", text: "大客户 ENT" },
    { id: "csm", text: "客户成功 CSM" },
  ];

  /**
   * 提成率表
   */
  export const commissionRate = {
    "employee-sourcer": 0.1,
    "employee-sales": 0.3,
    "employee-sales-sme": 0.3,
    "employee-sales-ent": 0.3,
    "employee-sales-csm": 0.2,
    "partner-sourcer": 0.1,
    "partner-sales": 0.49,
    "contractor-sourcer": 0.1,
    "contractor-sales": 0.49,
    "employee-bonus": 0.05,
  };

  /**
   * 获取提成率
   * @param personnelType
   * @param role
   * @param extra
   */
  const getCommissionRate = (personnelType, role, extra) => {
    const key =
      extra === undefined
        ? `${personnelType}-${role}`
        : `${personnelType}-${role}-${extra}`;
    return commissionRate[key];
  };

  /**
   * Sourcer的SQC，计提阿米巴
   */
  $: sourcerSQC = sqr * getCommissionRate(sourcerType, "sourcer");

  /**
   * 销售提成率，根据不同的销售职员类型、岗位类型，提成率不同
   */
  $: realSalesCommissionRate =
    salesType == "partner"
      ? getCommissionRate(salesType, "sales") // partner按回款、contractor按SQR
      : salesType == "employee"
      ? getCommissionRate("employee", "sales", employeeSalesType)
      : getCommissionRate(salesType, "sales");

  /**
   * Sales的SQC，计提阿米巴
   */
  $: salesSQC =
    salesType == "partner"
      ? payment * realSalesCommissionRate // partner按回款、contractor按SQR
      : salesType == "employee"
      ? sqr * realSalesCommissionRate
      : sqr * realSalesCommissionRate;

  /**
   * 计入公司奖金池金额
   */
  $: bonusPool = sqr * getCommissionRate("employee", "bonus");


  /**
   * 公司这次回款的真实净利
  */
 $: netIncomeByPayment = payment - bonusPool - salesSQC - sourcerSQC;
 $: netIncomeRatioByPayment = netIncomeByPayment / payment;
</script>

<main>
  <h1 class="text-3xl font-bold underline">Commission Calculator</h1>
  <!-- <p>Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn how to build Svelte apps.</p> -->
  <form>
    <table border="1" cellspacing="0">
      <tr>
        <td>
          <label for="tcv">
            Total Contract Value (TCV)
            <br />
            合同总价值
          </label>
        </td>
        <td>
          <input name="tcv" type="number" bind:value={tcv} />
        </td>
      </tr>

      <tr>
        <td>
          <label for="salesCost">
            Sales Cost
            <br />
            销售成本, 为完成本项目交付 <br />
            支付费用采购的第三方服务、软件、硬件费用
          </label>
        </td>
        <td>
          <input name="salesCost" type="number" bind:value={salesCost} />
        </td>
      </tr>
      <tr>
        <td>
          <label for="contractMargin">
            Contract Margin
            <br />
            合同毛利
          </label>
        </td>

        <td>
          {contractMargin}
        </td>
      </tr>
      <tr>
        <td>
          <label for="contractType">
            Contract Type
            <br />
            合同类型
          </label>
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

      {#if contractType != "service"}
        <tr>
          <td>
            <label for="period">
              Contract Period
              <br />
              合同周期多少个月?
            </label>
          </td>
          <td>
            <input name="period" type="number" bind:value={contractPeriod} />
          </td>
        </tr>

        <tr>
          <td> 合同总年度经常性收入(ARR) </td>
          <td>
            {arr}
          </td>
        </tr>
        <tr>
          <td> 合同月化经常性收入(MRR) </td>
          <td>
            {mrr}
          </td>
        </tr>
      {/if}

      <tr>
        <td>
          合同总价值(TCV): {tcv}
        </td>
        <td>
          {tcv}
        </td>
      </tr>
      <tr>
        <td>
          <label for="payment">
            Payment
            <br />
            回款
          </label>
        </td>
        <td>
          <input name="payment" type="number" bind:value={payment} />
        </td>
      </tr>
      <tr>
        <td>
          <label for="paymentRatio">
            Payment Ratio
            <br />
            回款比例
          </label>
        </td>
        <td>
          {paymentRatio * 100}%
        </td>
      </tr>
      <tr>
        <td>
          <label for="whoSourcingType">谁开发的(Sourcer)？</label>
        </td>
        <td>
          <select name="whoSourcingType" bind:value={sourcerType}>
            {#each personnelTypes as personnelType}
              <option value={personnelType.id}>
                {personnelType.text}
              </option>
            {/each}
          </select>
        </td>
      </tr>

      <tr>
        <td>
          <label for="whoSalesType">谁销售的(Sales)？</label>
        </td>
        <td>
          <select name="whoSalesType" bind:value={salesType}>
            {#each personnelTypes as personnelType}
              <option value={personnelType.id}>
                {personnelType.text}
              </option>
            {/each}
          </select>
        </td>
      </tr>
      {#if salesType == "employee"}
        <tr>
          <td>
            <label for="employeeSalesType">
              Employee Type
              <br />
              销售雇员类型？
            </label>
          </td>
          <td>
            <select name="employeeSalesType" bind:value={employeeSalesType}>
              {#each employeeSalesTypes as est}
                <option value={est.id}>
                  {est.text}
                </option>
              {/each}
            </select>
          </td>
        </tr>
      {/if}

      <tr>
        <td>
          <label for="sqr">
            SQR (Sales Qualified Revenue)
            <br />
            销售确认收入 ？</label
          >
        </td>
        <td>
          {sqr}
        </td>
      </tr>
      <tr>
        <td>
          <span>
            Sourcer Commission Rate
            <br />
            Sourcer提成率
          </span>
        </td>
        <td>
          {getCommissionRate(sourcerType, "sourcer") * 100}%
        </td>
      </tr>
      <tr>
        <td>
          <label for="sourcerSQC">
            Sourcer SQC (Sales Qualified Commission)
            <br />
            Sourcer计提多少阿米巴收入?
          </label>
        </td>
        <td>
          {sourcerSQC}
        </td>
      </tr>
      <tr>
        <td>
          <span>
            Sales Commission Rate
            <br />
            Sales提成率
          </span>
        </td>
        <td>
          {realSalesCommissionRate * 100}%
        </td>
      </tr>
      <tr>
        <td>
          <label for="salesSQC">
            Sales SQC (Sales Qualified Commission)
            <br />
            Sales计提多少阿米巴收入?
          </label>
        </td>
        <td>
          {salesSQC}
        </td>
      </tr>
      <tr>
        <td>
          <label for="bonus">
            Bonus Pool
            <br />
            计入公司奖金池?
          </label>
        </td>
        <td>
          {bonusPool}
        </td>
      </tr>

	  <tr>
		<td>
			Share in Payment
			<br />
			本次回款的公司分利
		</td>
		<td>
			{payment - netIncomeByPayment} ({( (1 - netIncomeRatioByPayment)*100).toFixed(2)}%)
		</td>
	  </tr>

	  <tr>
		<td>
			Net Income in Payment
			<br />
			本次回款的公司真实净利
		</td>
		<td>
			{netIncomeByPayment} ({(netIncomeRatioByPayment*100).toFixed(2)}%)
		</td>
	  </tr>
    </table>
  </form>

  <h1>Commission Rate Table</h1>
  <table>
    {#each Object.entries(commissionRate) as [key, value]}
      <tr>
        <td>{key}</td>
        <td>{value * 100}%</td>
      </tr>
    {/each}
  </table>
</main>

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
</style>
