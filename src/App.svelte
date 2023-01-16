<script lang="ts">
  import { getARR, getMRR, getSQR, Payment, PersonnelRole, PersonnelType } from "./autopilot";
  import * as lib from "./autopilot";
  import commissionRate from "./commission_rate";

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
    { id: PersonnelType.Employee, text: `全职雇员 Employee` },
    { id: PersonnelType.Contractor, text: `合约雇员 Contractor` },
    { id: PersonnelType.Partner, text: `渠道合作伙伴 Partner` },
  ];

  /**
   * the sourcing people personnel type
   * Sourcer职员类型
   */
  $: sourcerType = PersonnelType.Employee;

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
  $: salesType =  PersonnelType.Partner;

  /**
   * Sales Employee Job Type
   * 雇员型销售的类型，大客户、直销、客户成功
   */
  export let employeeSalesType = PersonnelRole.SME;

  /**
   * 销售雇员岗位类型
   */
  export let employeeSalesTypes = [
    { id: PersonnelRole.SME, text: "直销 SME" },
    { id: PersonnelRole.ENT, text: "大客户 ENT" },
    { id: PersonnelRole.CSM, text: "客户成功 CSM" },
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
   * ARR
   */
  $: arr = getARR(contractProductValue(), contractPeriod);

  /**
   * MRR
   */
  $: mrr = getMRR(contractProductValue(), contractPeriod);

  /**
   * 产品SQR 销售确认收入
   */
  $: sqrOfProduct = getSQR(paymentOfProduct(), contractPeriod);
    // paymentOfProduct() / contractPeriodYearly +
    // ((paymentOfProduct() * (contractPeriodYearly - 1)) / contractPeriodYearly) *
    //   0.5;

  /**
   * 服务SQR 销售确认收入
   */
  $: sqrOfService = paymentOfService();

  /**
   * 根据职员、岗位、额外属性，提取提成率对象
   */
  $: getCommissionRate = (personnelType, role, extra = undefined) => {
    return lib.getCommissionRate(personnelType, role, extra);
  };

  /**
   * Sourcer的提成率
   */
  $: sourcerCommissionRate = () => {
    // sourcer必须是雇员
    return getCommissionRate(sourcerType, "sourcer", employeeSalesType);
  };

  /**
   * Sourcer的SQC，计提阿米巴
   */
  $: sourcerSQC = () => {
    const res = getSQCResult();
    return res.sourcerSQC;

    // // 我们开发的线索，给到Partners，我们的怎么分？
    // if (salesType == "employee") {
    //   return sqrOfProduct * sourcerCommissionRate();
    // } else {
    //   // 如果是渠道合作伙伴，减掉他们的分成后，剩下的才是我们的
    //   return (sqrOfProduct - salesSQC()) * sourcerCommissionRate();
    // }
  };

  /**
   * 销售提成率，根据不同的销售职员类型、岗位类型，提成率不同
   */
  $: realSalesCommissionRate = () => {
    return lib.getSalesCommissionRate(salesType, employeeSalesType, partnerLevel);
  };

  /**
   * Sales的SQC，计提阿米巴
   */
  $: salesSQC = () => {
    const res = getSQCResult();
    return res.salesSQC;

    // if (salesType == "partner") {
    //   return paymentMargin * realSalesCommissionRate(); // partner按回款、contractor按SQR
    // } else if (salesType == "employee") {
    //   return sqrOfProduct * realSalesCommissionRate();
    // } else {
    //   return sqrOfProduct * realSalesCommissionRate();
    // }
  };

  /**
   * 构造一个模拟的Payment对象，用于计算SQC
   */
  $: getSQCResult = () => {
    const simPayment: Payment = {
      contract: {
        tcv: tcv,
        period: contractPeriod,
        customer: {
        },
        lead: {
          sourcer: {
            name: 'sim-sourcer',
            type: sourcerType,
            role: employeeSalesType,
          },
          sales: {
            name: 'sim-sales',
            type: salesType,
            role: salesType == 'employee' ? employeeSalesType : partnerLevel,
          },
          servant: {
            name: 'sim-servant',
            type: PersonnelType.Employee,
            role: employeeSalesType,
          }
        }
      },
      amount: payment,
      salesCost: salesCost,
    }

    const res = lib.getSQCResult(simPayment, compensation);
    return res;
  }

  /**
   * 计入公司奖金池金额
   */
  $: bonusPool = () => {
    const res = getSQCResult();
    return res.bonusPool;
    // return sqrOfProduct * getCommissionRate("employee", "bonus");
  };

  /**
   * 服务人员的提成率
   */
  $: serviceCommissionRate = () => {
    if (salesType == "employee")
      return getCommissionRate("employee", "service", employeeSalesType);
    return 0;
  };

  /**
   * 交付、服务人员SQC ,即SE/CSM/KU
   */
  $: serviceSQC = () => {
    const res = getSQCResult();
    return res.serviceSQC;
  };

  /**
   * 付费的交付服务的SQC
   */
  $: payDeliveryServiceSQC = () => {
    // const res = getSQCResult();
    // return res.payDeliveryServiceSQC;
    return sqrOfService * getCommissionRate("employee", "payservice");
  };

  /**
   * 渠道经理SQC、分成，扣掉合作伙伴分成后的数
   */
  $: partnerSalesSQC = () => {
    const res = getSQCResult();
    return res.partnerSalesSQC;
    // if (salesType != "employee") {
    //   return (sqrOfProduct - salesSQC()) * partnerSalesCommissionRate();
    // }

    // return 0;
  };

  /**
   * 由于渠道经理的SQC，是扣掉合作伙伴分成后的数，所以这里计算一个比例，显示真实的SQR的总提成率
   */
  $: partnerSalesSQC_SQR_Ratio = () => {
    return partnerSalesSQC() / sqrOfProduct;
  };

  /**
   * 渠道经理提成率
   */
  $: partnerSalesCommissionRate = () => {
    return getCommissionRate("employee", "partnersales");
  };

  /**
   * 合作伙伴收入
   */
  $: partnerIncome = () => {
    const res = getSQCResult();

    return res.partnerIncome;
    // if (salesType != "employee") {
    //   return salesSQC() - compensation;
    // }
    // return 0;
  };

  /**
   * 合作伙伴、合约雇员级别选择
   */
  $: partnersLevel = [
    { id: PersonnelRole.B, text: `铜牌级(B)` },
    { id: PersonnelRole.A, text: `银牌级(A)` },
    { id: PersonnelRole.S, text: `金牌级(S)` },
  ];

  /**
   * 合作伙伴、合约雇员级别
   */
  $: partnerLevel = PersonnelRole.B; //

  /**
   * 补偿compensation
   * 渠道或合约人员，回馈补偿、填充对价
   */
  $: compensation = 0;

  /**
   * 公司这次回款的真实净利
   */
  $: netIncomeByPayment = payment - salesCost - shareInPayment;

  /**
   * 公司这次回款的真实净利率
   */
  $: netIncomeRatioByPayment = netIncomeByPayment / payment;

  /**
   * 本次回款的公司分利， 即分了多少出去
   */
  $: shareInPayment =
    bonusPool() +
    salesSQC() +
    sourcerSQC() +
    serviceSQC() +
    payDeliveryServiceSQC() +
    partnerSalesSQC() -
    compensation;

  /**
   * 分利占回款比例
   */
  $: shareInPaymentRatio = 1 - netIncomeRatioByPayment;
</script>

<main>
  <h1>Commission Calculator</h1>
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

      <tr>
        <td>
          <label for="contractType">
            Contract Type
            <br />
            合同类型
          </label>
        </td>
        <td>
          <select name="contractType" bind:value={contractType} disabled>
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

      <tr>
        <td>
          <label for="whoSourcingType">
            Sourcer
            <br />
            线索的来源?
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
      </tr>

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

      {#if sourcerType == "employee" && employeeSalesType != "csm"}
        <tr>
          <td>
            <span>
              Sourcer Commission Rate
              <br />
              Sourcer提成率
            </span>
          </td>
          <td>
            {(sourcerCommissionRate() * 100).toFixed(2)}%
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
            {sourcerSQC().toFixed(2)}
          </td>
        </tr>
      {/if}

      <tr>
        <td>
          <span>
            {#if salesType == "employee"}
              Sales Commission Rate
              <br />
              Sales提成率
            {:else}
              Partner/Contractor Commission Rate
              <br />
              伙伴销售提成率
            {/if}
          </span>
        </td>
        <td>
          {realSalesCommissionRate() * 100}%
        </td>
      </tr>
      <tr>
        <td>
          <span>
            {#if salesType == "employee"}
              Sales SQC (Sales Qualified Commission)
              <br />
              Sales计提多少阿米巴收入?
            {:else}
              Partner/Contractor SQC
              <br />
              伙伴销售计提多少提成?
            {/if}
          </span>
        </td>
        <td>
          {salesSQC().toFixed(2)}
        </td>
      </tr>

      {#if sourcerType == "employee" && employeeSalesType != "csm"}
        <tr>
          <td>
            <span>
              CSM/SE/CS Commission Rate
              <br />
              KU服务方提成率
            </span>
          </td>
          <td>
            {(serviceCommissionRate() * 100).toFixed(2)}%
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
            {serviceSQC()}
          </td>
        </tr>
      {/if}

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
            {payDeliveryServiceSQC()}
          </td>
        </tr>
      {/if}

      <tr>
        <td>
          Compensation
          <br />
          补偿机制，在Sales SQC或
          <br />
          Partner/Contractor SQC中扣除某些费用
        </td>
        <td>
          <input name="compensation" type="number" bind:value={compensation} />
        </td>
      </tr>

      {#if salesType == "partner" || salesType == "contractor"}
        <tr>
          <td>
            <span>
              Partner Sales SQC (Sales Qualified Commission)
              <br />
              渠道销售计提多少阿米巴收入?
            </span>
          </td>
          <td>
            {partnerSalesSQC()}
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
            {(partnerSalesCommissionRate() * 100).toFixed(2)}% (all: {(
              partnerSalesSQC_SQR_Ratio() * 100
            ).toFixed(2)}%)
          </td>
        </tr>
        <tr>
          <td>
            Partner Income
            <br />
            合作伙伴最终收入
          </td>
          <td>
            {partnerIncome()}
          </td>
        </tr>
      {/if}

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
          {shareInPayment.toFixed(2)} ({(shareInPaymentRatio * 100).toFixed(2)}%)
        </td>
      </tr>

      <tr>
        <td>
          Net Income in Payment
          <br />
          本次回款的公司真实净利
        </td>
        <td>
          {netIncomeByPayment.toFixed(2)} ({(netIncomeRatioByPayment * 100).toFixed(2)}%)
        </td>
      </tr>
    </table>
  </form>

  <h1>Commission Rate Table</h1>
  <table border="1" cellspacing="1" cellpadding="1">
    {#each Object.entries(commissionRate) as [key, value]}
      {#if value.text}
        <tr>
          <td>{key}</td>
          <td>{value.text}</td>
          <td>{(value.rate * 100).toFixed(2)}%</td>
        </tr>
      {/if}
    {/each}
  </table>

  <div>
    <h2>DEBUG</h2>
    * Share in Payment({shareInPayment}) = Bonus Pool({bonusPool()}) + Sales
    SQC({salesSQC()}) + Sourcer SQC({sourcerSQC()}) + Service SQC({serviceSQC()})
    + Pay Delivery Service SQC({payDeliveryServiceSQC()}) + Partner Sales SQC({partnerSalesSQC()})
    - Compensation({compensation})
  </div>
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
