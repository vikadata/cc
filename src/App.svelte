<script>
  import "app.css";
  export let tcv; // total contract value
  export let whoSourcingType = "employment";
  export let whoSalesType;
  export let cycle;
  export let contractType = "product";
  export let contractServiceValue; // 服务部分占合同的多少？

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
  $: contractProductValue =
    contractType == "product"
      ? tcv
      : contractType == "service"
      ? 0
      : contractType == "hybrid"
      ? tcv - contractServiceValue
      : 0;

  $: arr = contractProductValue / cycle;
  $: commission = tcv * 2;
</script>

<main>
  <h1>提成计算器 Commision Calculator</h1>
  <!-- <p>Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn how to build Svelte apps.</p> -->
  <form>
    <p>
      <label for="whoSourcingType">谁开发的(Sourcer)？</label>
      <select name="whoSourcingType" value={whoSourcingType}>
        {#each personnelTypes as personnelType}
          <option value={personnelType.id}>
            {personnelType.text}
          </option>
        {/each}
      </select>
    </p>

    <label for="whoSalesType">谁销售的(Sales)？</label>
    <select name="whoSalesType" bind:value={whoSalesType}>
      {#each personnelTypes as personnelType}
        <option value={personnelType.id}>
          {personnelType.text}
        </option>
      {/each}
    </select>

    <label for="tcv">有多少合同总价值(TCV, Total Contract Value)?</label>
    <input name="tcv" type="number" bind:value={tcv} />

    <label for="contractType">合同类型?</label>
    <select name="contractType" bind:value={contractType}>
      {#each contractTypes as ct}
        <option value={ct.id}>
          {ct.text}
        </option>
      {/each}
    </select>

    {#if contractType == "hybrid"}
      <label for="contractServiceValue"
        >合同中的服务价值多少(Service value in this contract)?</label
      >
      <input
        name="contractServiceValue"
        type="number"
        bind:value={contractServiceValue}
      />

      <label for="contractProductValue"
        >合同中的产品价值多少(Product value in this contract)?</label
      >
      {contractProductValue}
    {/if}

    <label for="cycle">合同周期多少个月(Cycle)?</label>
    <input name="cycle" type="number" bind:value={cycle} />

    <p>
      合同中的产品价值多少(Product value in this contract?): {contractProductValue}
    </p>

    <p>合同总年度经常性收入(ARR): {arr}</p>
    <p>合同总价值(TCV): {tcv}</p>
  </form>
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
