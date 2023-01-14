<script lang="ts">
  import * as lib from "./lib";

  /**
   * total contract value
   * 合同总价值
   */
  $: tcv = 10000;

  /**
   * personnel type
   * 职员类型
   */
  $: personnelTypes = [
    { id: "employee", text: `全职雇员 Employee` },
    { id: "contractor", text: `合约雇员 Contractor` },
    { id: "partner", text: `渠道合作伙伴 Partner` },
  ];

  /**
   * the sourcing people personnel type
   * Sourcer职员类型
   */
  $: sourcerType = "employee";

  /**
   * 第三方销售成本
   * 服务、采购、硬件等
   * 不包括特殊费用
   */
  $: salesCost = 0;


  /**
   * sales personnel type
   * 销售Sales的职员类型
   */
  $: salesType = "employee";

  /**
   * Sales Employee Job Type
   * 雇员型销售的类型，大客户、直销、客户成功
   */
  export let employeeSalesType = "sme";

  /**
   * 销售雇员岗位类型
   */
  export let employeeSalesTypes = [
    { id: "sme", text: "直销 SME" },
    { id: "ent", text: "大客户 ENT" },
    { id: "csm", text: "客户成功 CSM" },
  ];

  /**
   * Contract Period
   * 合同周期，单位月
   */
  $: contractPeriod = 12;

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
  $: contractServiceValue = contractType == "service" ? tcv : 0;

  /**
   * 合同中的产品部分价值
   */
  $: contractProductValue = () => {
    if (contractType == "product") {
      return tcv;
    } else if (contractType == "service") {
      return 0;
    } else if (contractType == "hybrid") {
      return tcv - contractServiceValue;
    } else {
      return 0;
    }
  };

  /**
   * 合同中的产品部分价值占比
   */
  $: tcvOfProductRatio = () => {
    return contractProductValue() / tcv;
  };

  /**
   * 合同中的服务部分价值占比
   */
  $: tcvOfServiceRatio = () => {
    return contractServiceValue / tcv;
  };

  /**
   * how many payment get back?
   * 回款
   */
  $: payment = 3000;

  /**
   * Payment Margin
   * 回款毛利
   */
  $: paymentMargin = payment - salesCost;

  /**
   * 回款所属产品部分
   */
  $: paymentOfProduct = () => {
    return paymentMargin * tcvOfProductRatio();
  };

  /**
   * 回款所属的服务部分
   */
  $: paymentOfService = () => {
    return paymentMargin * tcvOfServiceRatio();
  };

  /**
   * Payment Ratio
   * 回款比例 (回款比例 = 回款 / 合同总价值)
   */
  $: paymentRatio = payment / tcv;

  /**
   * 合同周期年化
   */
  $: contractPeriodYearly = contractPeriod / 12; // 12个月为年化

  /**
   * ARR
   */
  $: arr = lib.getARR(contractProductValue(), contractPeriod);

  /**
   * MRR
   */
  $: mrr = lib.getMRR(contractProductValue(), contractPeriod);

  /**
   * 产品SQR 销售确认收入
   */
  $: sqrOfProduct =
    paymentOfProduct() / contractPeriodYearly +
    ((paymentOfProduct() * (contractPeriodYearly - 1)) / contractPeriodYearly) *
      0.5;

  /**
   * 服务SQR 销售确认收入
   */
  $: sqrOfService = paymentOfService();

  /**
   * 提成率表
   */
  export const commissionRate = {
    "employee-sourcer": 0.1,

    "employee-sales": 0.3,
    "employee-sales-sme": 0.3,
    "employee-sales-ent": 0.3,
    "employee-sales-csm": 0.2,

    /**
     * 渠道经理
     */
    "employee-partnersales": 0.3,

    "partner-sourcer": 0,
    "partner-sales": 0.51,
    "partner-sales-b": 0.51,
    "partner-sales-a": 0.61,
    "partner-sales-s": 0.71,

    "contractor-sourcer": 0.1,
    "contractor-sales": 0.51,
    "contractor-sales-b": 0.51,
    "contractor-sales-a": 0.61,
    "contractor-sales-s": 0.71,

    /**
     * 交付/服务/实施，统归客户成功
     */
    "employee-csm": 0.2,

    /**
     * 独立的付费交付服务合同的提成率
     * 给到Partner和Contractor
     */
    "employee-service": 1,

    /**
     * 雇员奖金池
     */
    "employee-bonus": 0.05,
  };

  /**
   * 根据职员、岗位、额外属性，提取提成率
   */
  $: getCommissionRate = (personnelType, role, extra = undefined) => {
    const key =
      extra === undefined
        ? `${personnelType}-${role}`
        : `${personnelType}-${role}-${extra}`;
    return commissionRate[key];
  };

  /**
   * Sourcer的SQC，计提阿米巴
   */
  $: sourcerSQC = () => {
    // TODO: 我们开发的线索，给到Partners，我们的怎么分？

    return sqrOfProduct * getCommissionRate(sourcerType, "sourcer");
  };

  /**
   * 销售提成率，根据不同的销售职员类型、岗位类型，提成率不同
   */
  $: realSalesCommissionRate = () => {
    if (salesType == "employee") {
      return getCommissionRate("employee", "sales", employeeSalesType);
    } else {
      return getCommissionRate(salesType, "sales", partnerLevel); // contractor、partner分级别
    }
  };

  /**
   * Sales的SQC，计提阿米巴
   */
  $: salesSQC = () => {
    if (salesType == "partner") {
      return paymentMargin * realSalesCommissionRate(); // partner按回款、contractor按SQR
    } else if (salesType == "employee") {
      return sqrOfProduct * realSalesCommissionRate();
    } else {
      return sqrOfProduct * realSalesCommissionRate();
    }
  };

  /**
   * 计入公司奖金池金额
   */
  $: bonusPool = () => {
    return sqrOfProduct * getCommissionRate("employee", "bonus");
  };

  /**
   * TODO: 交付、服务人员SQC ,即SE/CSM/KU
   */
  $: csmSQC = () => {
    return contractServiceValue * getCommissionRate("employee", "csm");
  };

  /**
   * 付费的服务的SQC
   */
  $: payServiceSQC = () => {
    return sqrOfService * getCommissionRate("employee", "service");
  };

  /**
   * TODO: 渠道经理SQC、分成
   */
  $: partnerSalesSQC = 0;

  /**
   * TODO: 合作伙伴收入
   */
  $: partnerIncome = 0;

  /**
   * 合作伙伴、兼职雇员级别选择
   */
  $: partnersLevel = [
    { id: "b", text: `铜牌级(B)` },
    { id: "a", text: `银牌级(A)` },
    { id: "s", text: `金牌级(S)` },
  ];

  /**
   * 合作伙伴、兼职雇员级别
   */
  $: partnerLevel = "b"; //

  /**
   * TODO: 补偿compensation
   * 渠道或兼职人员，回馈补偿、填充对价
   */
  $: compensation = 0;

  /**
   * 公司这次回款的真实净利
   */
  $: netIncomeByPayment =
    payment - salesCost - bonusPool() - salesSQC() - sourcerSQC();
  $: netIncomeRatioByPayment = netIncomeByPayment / payment;
</script>

<main>
  <h1>Commission Calculator</h1>
  <!-- <p>Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn how to build Svelte apps.</p> -->
  <form>
    <table border="1" cellspacing="1">
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

      <!-- <tr>
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
      </tr> -->

      {#if contractType == "hybrid"}
        <tr>
          <td>
            <label for="contractServiceValue">
              Service value in this contract
              <br />
              合同中的服务价值多少?
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
            Product value in this contract
            <br />
            合同中的产品价值多少?
          </td>
          <td>
            {contractProductValue()}
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
          <td>
            ARR (Annual Recurring Revenue)
            <br />合同总年度经常性收入
          </td>
          <td>
            {arr}
          </td>
        </tr>
        <tr>
          <td>
            MRR (Monthly Recurring Revenue)
            <br />合同月化经常性收入
          </td>
          <td>
            {mrr}
          </td>
        </tr>
      {/if}

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
          <label for="paymentMargin">
            Payment Margin
            <br />
            回款毛利
          </label>
        </td>

        <td>
          {paymentMargin}
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

      {#if contractType == "hybrid" || contractType == "product"}
        <tr>
          <td>
            Payment of Product
            <br />
            回款的产品部分
          </td>
          <td>
            {paymentOfProduct()}
          </td>
        </tr>
      {/if}

      {#if contractType == "hybrid" || contractType == "service"}
        <tr>
          <td>
            Payment of Service
            <br />
            回款的服务部分
          </td>
          <td>
            {paymentOfService()}
          </td>
        </tr>
      {/if}

      <!-- <tr>
        <td>
          <label for="whoSourcingType">
            Sourcer
            <br />
            线索谁开发的?
          </label>
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
      </tr> -->

      <tr>
        <td>
          <label for="whoSalesType">
            Sales
            <br />
            订单谁销售的？
          </label>
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

      {#if salesType == "partner" || salesType == "contractor"}
        <tr>
          <td>
            <label for="partnerLevel">
              Partner(Contractor) Type
              <br />
              合作级别
            </label>
          </td>
          <td>
            <select name="partnerLevel" bind:value={partnerLevel}>
              {#each partnersLevel as level}
                <option value={level.id}>
                  {level.text}
                </option>
              {/each}
            </select>
          </td>
        </tr>
      {/if}

      {#if contractType == "hybrid" || contractType == "product"}
        <tr>
          <td>
            <label for="sqr">
              产品SQR (Sales Qualified Revenue)
              <br />
              销售确认收入 ？
            </label>
          </td>
          <td>
            {sqrOfProduct}
          </td>
        </tr>
      {/if}

      {#if contractType == "hybrid" || contractType == "service"}
        <tr>
          <td>服务SQR</td>
          <td>
            {sqrOfService}
          </td>
        </tr>
      {/if}

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
          <span>
            Sourcer SQC (Sales Qualified Commission)
            <br />
            Sourcer计提多少阿米巴收入?
          </span>
        </td>
        <td>
          {sourcerSQC()}
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
          {realSalesCommissionRate() * 100}%
        </td>
      </tr>
      <tr>
        <td>
          <span>
            Sales SQC (Sales Qualified Commission)
            <br />
            Sales计提多少阿米巴收入?

            <!-- Partner/Contractor Commission
            <br />
            伙伴计提多少提成? -->
          </span>
        </td>
        <td>
          {salesSQC()}
        </td>
      </tr>

      <tr>
        <td>
          <span>

            Partner Sales SQC (Sales Qualified Commission)
            <br />
            渠道销售计提多少阿米巴收入?
            
          </span>
        </td>
        <td>
          
        </td>
      </tr>

      <tr>
        <td>
          <span>
            Partner Sales Commission Rate
            <br />
            渠道销售提成率
          </span>
        </td>
        <td>
          
        </td>
      </tr>
      <tr>
        <td>
          <span>
            CSM/SE/CS SQC (Sales Qualified Commission)
            <br />
            KU服务方计提多少阿米巴收入?
          </span>
        </td>
        <td>
        </td>
      </tr>

      <tr>
        <td>
          <span>
            CSM/SE/CS Commission Rate
            <br />
            KU服务方提成率
          </span>
        </td>
        <td>
        </td>
      </tr>

      {#if contractType == "hybrid" || contractType == "service"}
        <tr>
          <td>
            <span>
              Pay Service SQC
              <br />
              付费服务提成
            </span>
          </td>
          <td>
            {payServiceSQC()}
          </td>
        </tr>
      {/if}

      <tr>
        <td>
          Compensation
          <br />
          合作补偿调节，如部分SQC中扣除某些事项
        </td>
        <td>
          <input name="compensation" type="number" bind:value={compensation} />
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
          {bonusPool()}
        </td>
      </tr>

      <tr>
        <td>
          Share in Payment
          <br />
          本次回款的公司分利
        </td>
        <td>
          {payment - netIncomeByPayment} ({(
            (1 - netIncomeRatioByPayment) *
            100
          ).toFixed(2)}%)
        </td>
      </tr>

      <tr>
        <td>
          Net Income in Payment
          <br />
          本次回款的公司真实净利
        </td>
        <td>
          {netIncomeByPayment} ({(netIncomeRatioByPayment * 100).toFixed(2)}%)
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
