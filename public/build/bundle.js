
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        select.selectedIndex = -1; // no option should be selected
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.55.1' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /**
     * 提成率表
     */
    const commissionRate = {
        //////// employee
        // sourcing
        // "employee-sourcer": 0.07,
        "employee-sourcer-new": {
            text: '全职雇员-线索开发-新购合同',
            rate: 0.07
        },
        // "employee-sourcer-new": {
        //   text: '全职雇员-线索开发-大客户团队',
        //   rate: 0.07
        // },
        "employee-sourcer-renewal": {
            text: '全职雇员-线索开发-续费',
            rate: 0.02
        },
        // kp
        // "employee-sales": 0.16,
        "employee-sales-new": {
            text: '全职雇员-销售-新购',
            rate: 0.16,
        },
        // "employee-sales-ent": {
        //   text: '全职雇员-销售-大客户团队',
        //   rate: 0.16,
        // },
        "employee-sales-renewal": {
            text: '全职雇员-销售-续费',
            rate: 0.14,
        },
        // ku users service
        // "employee-service": 0.07,
        "employee-service-new": {
            text: '全职雇员-用户服务-新购合同',
            rate: 0.07
        },
        // "employee-service-renewal": {
        //   text: '全职雇员-用户服务-续费合同',
        //   rate: 0.07
        // },
        "employee-service-renewal": {
            text: '全职雇员-用户服务-续费合同',
            rate: 0
        },
        /**
         * 独立的付费交付服务合同的提成率
         * 给到Partner和Contractor
         */
        "employee-payservice": {
            text: '全职雇员-付费交付服务',
            rate: 0.2
        },
        /**
         * 雇员奖金池
         */
        "employee-bonus": {
            text: '全职雇员-年/季奖金池',
            rate: 0.05,
        },
        /**
         * 渠道经理
         */
        "employee-partnersales": {
            text: '全职雇员-渠道服务',
            rate: 0.2,
        },
        //////// partner & contractors
        "partner-sourcer": {
            text: undefined,
            rate: 0
        },
        "partner-sales": {
            text: undefined,
            rate: 0.51
        },
        "partner-sales-b": {
            text: '合作伙伴(B级)销售',
            rate: 0.51
        },
        "partner-sales-a": {
            text: '合作伙伴(A级)销售',
            rate: 0.61
        },
        "partner-sales-s": {
            text: '合作伙伴(S级)销售',
            rate: 0.71,
        },
        "partner-service": {
            text: undefined,
            rate: 0,
        },
        "contractor-sourcer": {
            text: undefined,
            rate: 0,
        },
        "contractor-sales": {
            text: undefined,
            rate: 0.51,
        },
        "contractor-sales-b": {
            text: '兼职雇员(B级)销售',
            rate: 0.51,
        },
        "contractor-sales-a": {
            text: '兼职雇员(A级)销售',
            rate: 0.61,
        },
        "contractor-sales-s": {
            text: '兼职雇员(S级)销售',
            rate: 0.71,
        },
        "contractor-service": {
            text: undefined,
            rate: 0,
        }
    };

    // Auto Pilot for Commission Calculator
    /**
     * 职员类型
     */
    var PersonnelType;
    (function (PersonnelType) {
        PersonnelType["Employee"] = "employee";
        PersonnelType["Contractor"] = "contractor";
        PersonnelType["Partner"] = "partner";
    })(PersonnelType || (PersonnelType = {}));
    var PersonnelRole;
    (function (PersonnelRole) {
        // ENT = 'ent',
        // SME = 'sme',
        // CSM = 'csm',
        PersonnelRole["S"] = "s";
        PersonnelRole["A"] = "a";
        PersonnelRole["B"] = "b";
    })(PersonnelRole || (PersonnelRole = {}));
    var ContractType;
    (function (ContractType) {
        ContractType["New"] = "new";
        ContractType["Renewal"] = "renewal";
    })(ContractType || (ContractType = {}));
    /**
     * 统计周期
     */
    var PeriodType;
    (function (PeriodType) {
        PeriodType[PeriodType["AllTime"] = 0] = "AllTime";
        PeriodType[PeriodType["LastMonth"] = 1] = "LastMonth";
        PeriodType[PeriodType["CurrentMonth"] = 2] = "CurrentMonth";
    })(PeriodType || (PeriodType = {}));
    /**
     * 阿米巴类型
     */
    var AmoebaType;
    (function (AmoebaType) {
        /**
         * 内部阿米巴
         */
        AmoebaType[AmoebaType["InHouse"] = 0] = "InHouse";
        /**
         * 外部阿米巴
         */
        AmoebaType[AmoebaType["Outside"] = 1] = "Outside";
        /**
         * 奖金池
         */
        AmoebaType[AmoebaType["BonusPool"] = 2] = "BonusPool";
    })(AmoebaType || (AmoebaType = {}));
    /**
     * SQC计算结果 （针对Payment）
     */
    class SQCResult {
        constructor(source) {
            Object.assign(this, source);
        }
        get partnerIncome() {
            if (this.salesType != PersonnelType.Employee) {
                return this.salesSQC - this.compensation;
            }
            return 0;
        }
    }
    const sourcerCommissionRate = (sourcerType, contractType) => {
        // sourcer必须是雇员
        if (sourcerType == PersonnelType.Employee)
            return getCommissionRate(sourcerType, "sourcer", contractType);
        return 0;
    };
    /**
     * 服务人员的提成率
     */
    const serviceCommissionRate = (salesType, contractType) => {
        if (salesType == PersonnelType.Employee)
            return getCommissionRate(PersonnelType.Employee, "service", contractType);
        return 0;
    };
    /**
     * 计算所有SQC如何分
     */
    function getSQCResult(payment, compensation = 0) {
        const contract = payment.contract;
        const contractType = contract.type;
        const sqrOfProduct = getSQR(payment.amount, contract.period);
        const sourcerType = contract.lead.sourcer.type;
        const salesType = contract.lead.sales.type;
        const paymentMargin = payment.amount - payment.salesCost;
        const partnerLevel = contract.lead.sales.role; // if partner
        let salesSQC = 0;
        if (salesType == PersonnelType.Partner) {
            salesSQC = paymentMargin * getSalesCommissionRate(salesType, contractType, partnerLevel); // partner按回款、contractor按SQR
        }
        else if (salesType == PersonnelType.Employee) {
            salesSQC = sqrOfProduct * getSalesCommissionRate(salesType, contractType, partnerLevel);
        }
        else {
            salesSQC = sqrOfProduct * getSalesCommissionRate(salesType, contractType, partnerLevel);
        }
        // start calc the SQC
        let sourcerSQC = 0;
        // 我们开发的线索，给到Partners，我们的怎么分？
        if (salesType == PersonnelType.Employee) {
            sourcerSQC = sqrOfProduct * sourcerCommissionRate(sourcerType, contractType);
        }
        else {
            // 如果是渠道合作伙伴，减掉他们的分成后，剩下的才是我们的
            sourcerSQC = (sqrOfProduct - salesSQC) * sourcerCommissionRate(sourcerType, contractType);
        }
        const serviceSQC = sqrOfProduct * serviceCommissionRate(salesType, contractType);
        let partnerSalesSQC = 0;
        if (salesType != PersonnelType.Employee) {
            partnerSalesSQC = (sqrOfProduct - salesSQC) * getCommissionRate("employee", "partnersales");
        }
        const bonusPool = sqrOfProduct * getCommissionRate("employee", "bonus");
        const res = new SQCResult({
            sourcerSQC: sourcerSQC,
            salesSQC: salesSQC,
            serviceSQC: serviceSQC,
            // payServiceSQC: payServiceSQC,
            partnerSalesSQC: partnerSalesSQC,
            bonusPool: bonusPool,
            compensation: compensation,
            salesType: salesType,
        });
        return res;
    }
    /**
     * 阿米巴账单类型
     */
    var AmoebaBillType;
    (function (AmoebaBillType) {
        AmoebaBillType["SQC"] = "sqc";
        AmoebaBillType["Salary"] = "salary";
    })(AmoebaBillType || (AmoebaBillType = {}));
    function getARR(productTCV, periodMonthly) {
        return productTCV / (periodMonthly / 12);
    }
    function getMRR(productTCV, periodMonthly) {
        return productTCV / periodMonthly;
    }
    /**
     * Product SQR
     */
    function getSQR(productPayment, periodMonthly) {
        const contractPeriodYearly = periodMonthly / 12;
        return productPayment / contractPeriodYearly +
            ((productPayment * (contractPeriodYearly - 1)) / contractPeriodYearly) *
                0.5;
    }
    /**
     * 销售提成率，根据不同的销售职员类型、岗位类型，提成率不同
     */
    const getSalesCommissionRate = (salesType, contractType, partnerLevel) => {
        if (salesType == 'employee') {
            return getCommissionRate('employee', "sales", contractType);
        }
        else {
            return getCommissionRate(salesType, "sales", partnerLevel); // contractor、partner分级别
        }
    };
    /**
     * 根据职员、岗位、额外属性，提取提成率对象
     */
    const getCommissionRateObject = (personnelType, role, extra = undefined) => {
        const key = extra === undefined
            ? `${personnelType}-${role}`
            : `${personnelType}-${role}-${extra}`;
        const obj = commissionRate[key];
        return obj;
    };
    /**
     * 根据职员、岗位、额外属性，提取提成率对象
     */
    const getCommissionRate = (personnelType, role, extra = undefined) => {
        const obj = getCommissionRateObject(personnelType, role, extra);
        if (obj)
            return obj.rate;
        return 0;
    };
    /**
     * 计算所有阿米巴余额
     */
    function calc(leads, customers, amoebas, amoebaBiils) {
        // for (const bill of amoebaBills) {
        // }
    }

    var lib = /*#__PURE__*/Object.freeze({
        __proto__: null,
        get PersonnelType () { return PersonnelType; },
        get PersonnelRole () { return PersonnelRole; },
        get ContractType () { return ContractType; },
        get AmoebaType () { return AmoebaType; },
        SQCResult: SQCResult,
        sourcerCommissionRate: sourcerCommissionRate,
        serviceCommissionRate: serviceCommissionRate,
        getSQCResult: getSQCResult,
        get AmoebaBillType () { return AmoebaBillType; },
        getARR: getARR,
        getMRR: getMRR,
        getSQR: getSQR,
        getSalesCommissionRate: getSalesCommissionRate,
        getCommissionRateObject: getCommissionRateObject,
        getCommissionRate: getCommissionRate,
        calc: calc
    });

    /* src/App.svelte generated by Svelte v3.55.1 */

    const { Object: Object_1 } = globals;
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[55] = list[i][0];
    	child_ctx[56] = list[i][1];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[59] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[62] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[62] = list[i];
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[67] = list[i];
    	return child_ctx;
    }

    function get_each_context_5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[70] = list[i];
    	return child_ctx;
    }

    // (368:12) {#each contractModels as cm}
    function create_each_block_5(ctx) {
    	let option;
    	let t0_value = /*cm*/ ctx[70].text + "";
    	let t0;
    	let t1;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = space();
    			option.__value = option_value_value = /*cm*/ ctx[70].id;
    			option.value = option.__value;
    			add_location(option, file, 368, 14, 8118);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*contractModels*/ 2 && t0_value !== (t0_value = /*cm*/ ctx[70].text + "")) set_data_dev(t0, t0_value);

    			if (dirty[0] & /*contractModels*/ 2 && option_value_value !== (option_value_value = /*cm*/ ctx[70].id)) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_5.name,
    		type: "each",
    		source: "(368:12) {#each contractModels as cm}",
    		ctx
    	});

    	return block;
    }

    // (377:6) {#if contractModel == "hybrid"}
    function create_if_block_13(ctx) {
    	let tr0;
    	let td0;
    	let label;
    	let t0;
    	let br0;
    	let t1;
    	let t2;
    	let td1;
    	let input;
    	let t3;
    	let tr1;
    	let td2;
    	let t4;
    	let br1;
    	let t5;
    	let t6;
    	let td3;
    	let t7_value = /*contractProductValue*/ ctx[24]() + "";
    	let t7;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			tr0 = element("tr");
    			td0 = element("td");
    			label = element("label");
    			t0 = text("Service value in this contract\n              ");
    			br0 = element("br");
    			t1 = text("\n              合同中的服务价值多少?");
    			t2 = space();
    			td1 = element("td");
    			input = element("input");
    			t3 = space();
    			tr1 = element("tr");
    			td2 = element("td");
    			t4 = text("Product value in this contract\n            ");
    			br1 = element("br");
    			t5 = text("\n            合同中的产品价值多少?");
    			t6 = space();
    			td3 = element("td");
    			t7 = text(t7_value);
    			add_location(br0, file, 381, 14, 8430);
    			attr_dev(label, "for", "contractServiceValue");
    			add_location(label, file, 379, 12, 8336);
    			add_location(td0, file, 378, 10, 8319);
    			attr_dev(input, "name", "contractServiceValue");
    			attr_dev(input, "type", "number");
    			add_location(input, file, 386, 12, 8527);
    			add_location(td1, file, 385, 10, 8510);
    			add_location(tr0, file, 377, 8, 8304);
    			add_location(br1, file, 396, 12, 8780);
    			add_location(td2, file, 394, 10, 8720);
    			add_location(td3, file, 399, 10, 8837);
    			add_location(tr1, file, 393, 8, 8705);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr0, anchor);
    			append_dev(tr0, td0);
    			append_dev(td0, label);
    			append_dev(label, t0);
    			append_dev(label, br0);
    			append_dev(label, t1);
    			append_dev(tr0, t2);
    			append_dev(tr0, td1);
    			append_dev(td1, input);
    			set_input_value(input, /*contractServiceValue*/ ctx[26]);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, tr1, anchor);
    			append_dev(tr1, td2);
    			append_dev(td2, t4);
    			append_dev(td2, br1);
    			append_dev(td2, t5);
    			append_dev(tr1, t6);
    			append_dev(tr1, td3);
    			append_dev(td3, t7);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[46]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*contractServiceValue*/ 67108864 && to_number(input.value) !== /*contractServiceValue*/ ctx[26]) {
    				set_input_value(input, /*contractServiceValue*/ ctx[26]);
    			}

    			if (dirty[0] & /*contractProductValue*/ 16777216 && t7_value !== (t7_value = /*contractProductValue*/ ctx[24]() + "")) set_data_dev(t7, t7_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(tr1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_13.name,
    		type: "if",
    		source: "(377:6) {#if contractModel == \\\"hybrid\\\"}",
    		ctx
    	});

    	return block;
    }

    // (406:6) {#if contractModel != "service"}
    function create_if_block_12(ctx) {
    	let tr0;
    	let td0;
    	let label;
    	let t0;
    	let br0;
    	let t1;
    	let t2;
    	let td1;
    	let input;
    	let t3;
    	let tr1;
    	let td2;
    	let t4;
    	let br1;
    	let t5;
    	let t6;
    	let td3;
    	let t7;
    	let t8;
    	let tr2;
    	let td4;
    	let t9;
    	let br2;
    	let t10;
    	let t11;
    	let td5;
    	let t12;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			tr0 = element("tr");
    			td0 = element("td");
    			label = element("label");
    			t0 = text("Contract Period\n              ");
    			br0 = element("br");
    			t1 = text("\n              合同周期多少个月?");
    			t2 = space();
    			td1 = element("td");
    			input = element("input");
    			t3 = space();
    			tr1 = element("tr");
    			td2 = element("td");
    			t4 = text("ARR (Annual Recurring Revenue)\n            ");
    			br1 = element("br");
    			t5 = text("合同总年度经常性收入");
    			t6 = space();
    			td3 = element("td");
    			t7 = text(/*arr*/ ctx[36]);
    			t8 = space();
    			tr2 = element("tr");
    			td4 = element("td");
    			t9 = text("MRR (Monthly Recurring Revenue)\n            ");
    			br2 = element("br");
    			t10 = text("合同月化经常性收入");
    			t11 = space();
    			td5 = element("td");
    			t12 = text(/*mrr*/ ctx[35]);
    			add_location(br0, file, 410, 14, 9066);
    			attr_dev(label, "for", "period");
    			add_location(label, file, 408, 12, 9001);
    			add_location(td0, file, 407, 10, 8984);
    			attr_dev(input, "name", "period");
    			attr_dev(input, "type", "number");
    			add_location(input, file, 415, 12, 9161);
    			add_location(td1, file, 414, 10, 9144);
    			add_location(tr0, file, 406, 8, 8969);
    			add_location(br1, file, 422, 12, 9341);
    			add_location(td2, file, 420, 10, 9281);
    			add_location(td3, file, 424, 10, 9384);
    			add_location(tr1, file, 419, 8, 9266);
    			add_location(br2, file, 431, 12, 9521);
    			add_location(td4, file, 429, 10, 9460);
    			add_location(td5, file, 433, 10, 9563);
    			add_location(tr2, file, 428, 8, 9445);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr0, anchor);
    			append_dev(tr0, td0);
    			append_dev(td0, label);
    			append_dev(label, t0);
    			append_dev(label, br0);
    			append_dev(label, t1);
    			append_dev(tr0, t2);
    			append_dev(tr0, td1);
    			append_dev(td1, input);
    			set_input_value(input, /*contractPeriod*/ ctx[20]);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, tr1, anchor);
    			append_dev(tr1, td2);
    			append_dev(td2, t4);
    			append_dev(td2, br1);
    			append_dev(td2, t5);
    			append_dev(tr1, t6);
    			append_dev(tr1, td3);
    			append_dev(td3, t7);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, tr2, anchor);
    			append_dev(tr2, td4);
    			append_dev(td4, t9);
    			append_dev(td4, br2);
    			append_dev(td4, t10);
    			append_dev(tr2, t11);
    			append_dev(tr2, td5);
    			append_dev(td5, t12);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler_1*/ ctx[47]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*contractPeriod*/ 1048576 && to_number(input.value) !== /*contractPeriod*/ ctx[20]) {
    				set_input_value(input, /*contractPeriod*/ ctx[20]);
    			}

    			if (dirty[1] & /*arr*/ 32) set_data_dev(t7, /*arr*/ ctx[36]);
    			if (dirty[1] & /*mrr*/ 16) set_data_dev(t12, /*mrr*/ ctx[35]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(tr1);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(tr2);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_12.name,
    		type: "if",
    		source: "(406:6) {#if contractModel != \\\"service\\\"}",
    		ctx
    	});

    	return block;
    }

    // (450:12) {#each contractTypes as ct}
    function create_each_block_4(ctx) {
    	let option;
    	let t0_value = /*ct*/ ctx[67].text + "";
    	let t0;
    	let t1;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = space();
    			option.__value = option_value_value = /*ct*/ ctx[67].id;
    			option.value = option.__value;
    			add_location(option, file, 450, 14, 9918);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[1] & /*contractTypes*/ 128 && t0_value !== (t0_value = /*ct*/ ctx[67].text + "")) set_data_dev(t0, t0_value);

    			if (dirty[1] & /*contractTypes*/ 128 && option_value_value !== (option_value_value = /*ct*/ ctx[67].id)) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(450:12) {#each contractTypes as ct}",
    		ctx
    	});

    	return block;
    }

    // (513:6) {#if contractModel == "hybrid" || contractModel == "product"}
    function create_if_block_11(ctx) {
    	let tr;
    	let td0;
    	let t0;
    	let br;
    	let t1;
    	let t2;
    	let td1;
    	let t3_value = /*paymentOfProduct*/ ctx[23]() + "";
    	let t3;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text("Payment of Product\n            ");
    			br = element("br");
    			t1 = text("\n            回款的产品部分");
    			t2 = space();
    			td1 = element("td");
    			t3 = text(t3_value);
    			add_location(br, file, 516, 12, 11217);
    			add_location(td0, file, 514, 10, 11169);
    			add_location(td1, file, 519, 10, 11270);
    			add_location(tr, file, 513, 8, 11154);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(td0, br);
    			append_dev(td0, t1);
    			append_dev(tr, t2);
    			append_dev(tr, td1);
    			append_dev(td1, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*paymentOfProduct*/ 8388608 && t3_value !== (t3_value = /*paymentOfProduct*/ ctx[23]() + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_11.name,
    		type: "if",
    		source: "(513:6) {#if contractModel == \\\"hybrid\\\" || contractModel == \\\"product\\\"}",
    		ctx
    	});

    	return block;
    }

    // (526:6) {#if contractModel == "hybrid" || contractModel == "service"}
    function create_if_block_10(ctx) {
    	let tr;
    	let td0;
    	let t0;
    	let br;
    	let t1;
    	let t2;
    	let td1;
    	let t3_value = /*paymentOfService*/ ctx[22]() + "";
    	let t3;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text("Payment of Service\n            ");
    			br = element("br");
    			t1 = text("\n            回款的服务部分");
    			t2 = space();
    			td1 = element("td");
    			t3 = text(t3_value);
    			add_location(br, file, 529, 12, 11490);
    			add_location(td0, file, 527, 10, 11442);
    			add_location(td1, file, 532, 10, 11543);
    			add_location(tr, file, 526, 8, 11427);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(td0, br);
    			append_dev(td0, t1);
    			append_dev(tr, t2);
    			append_dev(tr, td1);
    			append_dev(td1, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*paymentOfService*/ 4194304 && t3_value !== (t3_value = /*paymentOfService*/ ctx[22]() + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_10.name,
    		type: "if",
    		source: "(526:6) {#if contractModel == \\\"hybrid\\\" || contractModel == \\\"service\\\"}",
    		ctx
    	});

    	return block;
    }

    // (549:12) {#each personnelTypes as personnelType}
    function create_each_block_3(ctx) {
    	let option;
    	let t0_value = /*personnelType*/ ctx[62].text + "";
    	let t0;
    	let t1;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = space();
    			option.__value = option_value_value = /*personnelType*/ ctx[62].id;
    			option.value = option.__value;
    			add_location(option, file, 549, 14, 11925);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[1] & /*personnelTypes*/ 256 && t0_value !== (t0_value = /*personnelType*/ ctx[62].text + "")) set_data_dev(t0, t0_value);

    			if (dirty[1] & /*personnelTypes*/ 256 && option_value_value !== (option_value_value = /*personnelType*/ ctx[62].id)) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(549:12) {#each personnelTypes as personnelType}",
    		ctx
    	});

    	return block;
    }

    // (568:12) {#each personnelTypes as personnelType}
    function create_each_block_2(ctx) {
    	let option;
    	let t0_value = /*personnelType*/ ctx[62].text + "";
    	let t0;
    	let t1;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = space();
    			option.__value = option_value_value = /*personnelType*/ ctx[62].id;
    			option.value = option.__value;
    			add_location(option, file, 568, 14, 12379);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[1] & /*personnelTypes*/ 256 && t0_value !== (t0_value = /*personnelType*/ ctx[62].text + "")) set_data_dev(t0, t0_value);

    			if (dirty[1] & /*personnelTypes*/ 256 && option_value_value !== (option_value_value = /*personnelType*/ ctx[62].id)) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(568:12) {#each personnelTypes as personnelType}",
    		ctx
    	});

    	return block;
    }

    // (598:6) {#if salesType == PersonnelType.Partner || salesType == PersonnelType.Contractor}
    function create_if_block_9(ctx) {
    	let tr;
    	let td0;
    	let label;
    	let t0;
    	let br;
    	let t1;
    	let t2;
    	let td1;
    	let select;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*partnersLevel*/ ctx[28];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			label = element("label");
    			t0 = text("Partner(Contractor) Type\n              ");
    			br = element("br");
    			t1 = text("\n              合作级别");
    			t2 = space();
    			td1 = element("td");
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(br, file, 602, 14, 13304);
    			attr_dev(label, "for", "partnerLevel");
    			add_location(label, file, 600, 12, 13224);
    			add_location(td0, file, 599, 10, 13207);
    			attr_dev(select, "name", "partnerLevel");
    			if (/*partnerLevel*/ ctx[14] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[53].call(select));
    			add_location(select, file, 607, 12, 13394);
    			add_location(td1, file, 606, 10, 13377);
    			add_location(tr, file, 598, 8, 13192);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, label);
    			append_dev(label, t0);
    			append_dev(label, br);
    			append_dev(label, t1);
    			append_dev(tr, t2);
    			append_dev(tr, td1);
    			append_dev(td1, select);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*partnerLevel*/ ctx[14]);

    			if (!mounted) {
    				dispose = listen_dev(select, "change", /*select_change_handler*/ ctx[53]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*partnersLevel*/ 268435456) {
    				each_value_1 = /*partnersLevel*/ ctx[28];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}

    			if (dirty[0] & /*partnerLevel, partnersLevel*/ 268451840) {
    				select_option(select, /*partnerLevel*/ ctx[14]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(598:6) {#if salesType == PersonnelType.Partner || salesType == PersonnelType.Contractor}",
    		ctx
    	});

    	return block;
    }

    // (609:14) {#each partnersLevel as level}
    function create_each_block_1(ctx) {
    	let option;
    	let t0_value = /*level*/ ctx[59].text + "";
    	let t0;
    	let t1;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = space();
    			option.__value = option_value_value = /*level*/ ctx[59].id;
    			option.value = option.__value;
    			add_location(option, file, 609, 16, 13510);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*partnersLevel*/ 268435456 && t0_value !== (t0_value = /*level*/ ctx[59].text + "")) set_data_dev(t0, t0_value);

    			if (dirty[0] & /*partnersLevel*/ 268435456 && option_value_value !== (option_value_value = /*level*/ ctx[59].id)) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(609:14) {#each partnersLevel as level}",
    		ctx
    	});

    	return block;
    }

    // (619:6) {#if contractModel == "hybrid" || contractModel == "product"}
    function create_if_block_8(ctx) {
    	let tr;
    	let td0;
    	let label;
    	let t0;
    	let br;
    	let t1;
    	let t2;
    	let td1;
    	let t3;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			label = element("label");
    			t0 = text("产品SQR (Sales Qualified Revenue)\n              ");
    			br = element("br");
    			t1 = text("\n              销售确认收入 ？");
    			t2 = space();
    			td1 = element("td");
    			t3 = text(/*sqrOfProduct*/ ctx[15]);
    			add_location(br, file, 623, 14, 13866);
    			attr_dev(label, "for", "sqr");
    			add_location(label, file, 621, 12, 13788);
    			add_location(td0, file, 620, 10, 13771);
    			add_location(td1, file, 627, 10, 13943);
    			add_location(tr, file, 619, 8, 13756);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, label);
    			append_dev(label, t0);
    			append_dev(label, br);
    			append_dev(label, t1);
    			append_dev(tr, t2);
    			append_dev(tr, td1);
    			append_dev(td1, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*sqrOfProduct*/ 32768) set_data_dev(t3, /*sqrOfProduct*/ ctx[15]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(619:6) {#if contractModel == \\\"hybrid\\\" || contractModel == \\\"product\\\"}",
    		ctx
    	});

    	return block;
    }

    // (634:6) {#if contractModel == "hybrid" || contractModel == "service"}
    function create_if_block_7(ctx) {
    	let tr;
    	let td0;
    	let t1;
    	let td1;
    	let t2;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			td0.textContent = "服务SQR";
    			t1 = space();
    			td1 = element("td");
    			t2 = text(/*sqrOfService*/ ctx[16]);
    			add_location(td0, file, 635, 10, 14109);
    			add_location(td1, file, 636, 10, 14134);
    			add_location(tr, file, 634, 8, 14094);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*sqrOfService*/ 65536) set_data_dev(t2, /*sqrOfService*/ ctx[16]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(634:6) {#if contractModel == \\\"hybrid\\\" || contractModel == \\\"service\\\"}",
    		ctx
    	});

    	return block;
    }

    // (643:6) {#if sourcerType == PersonnelType.Employee}
    function create_if_block_6(ctx) {
    	let tr0;
    	let td0;
    	let span0;
    	let t0;
    	let br0;
    	let t1;
    	let t2;
    	let td1;
    	let t3_value = (/*sourcerCommissionRate*/ ctx[34]() * 100).toFixed(2) + "";
    	let t3;
    	let t4;
    	let t5;
    	let tr1;
    	let td2;
    	let span1;
    	let t6;
    	let br1;
    	let t7;
    	let t8;
    	let td3;
    	let t9_value = /*sourcerSQC*/ ctx[7]().toFixed(2) + "";
    	let t9;

    	const block = {
    		c: function create() {
    			tr0 = element("tr");
    			td0 = element("td");
    			span0 = element("span");
    			t0 = text("Sourcer Commission Rate\n              ");
    			br0 = element("br");
    			t1 = text("\n              Sourcer提成率");
    			t2 = space();
    			td1 = element("td");
    			t3 = text(t3_value);
    			t4 = text("%");
    			t5 = space();
    			tr1 = element("tr");
    			td2 = element("td");
    			span1 = element("span");
    			t6 = text("Sourcer SQC (Sales Qualified Commission)\n              ");
    			br1 = element("br");
    			t7 = text("\n              Sourcer计提多少阿米巴收入?");
    			t8 = space();
    			td3 = element("td");
    			t9 = text(t9_value);
    			add_location(br0, file, 647, 14, 14358);
    			add_location(span0, file, 645, 12, 14299);
    			add_location(td0, file, 644, 10, 14282);
    			add_location(td1, file, 651, 10, 14436);
    			add_location(tr0, file, 643, 8, 14267);
    			add_location(br1, file, 659, 14, 14645);
    			add_location(span1, file, 657, 12, 14569);
    			add_location(td2, file, 656, 10, 14552);
    			add_location(td3, file, 663, 10, 14730);
    			add_location(tr1, file, 655, 8, 14537);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr0, anchor);
    			append_dev(tr0, td0);
    			append_dev(td0, span0);
    			append_dev(span0, t0);
    			append_dev(span0, br0);
    			append_dev(span0, t1);
    			append_dev(tr0, t2);
    			append_dev(tr0, td1);
    			append_dev(td1, t3);
    			append_dev(td1, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, tr1, anchor);
    			append_dev(tr1, td2);
    			append_dev(td2, span1);
    			append_dev(span1, t6);
    			append_dev(span1, br1);
    			append_dev(span1, t7);
    			append_dev(tr1, t8);
    			append_dev(tr1, td3);
    			append_dev(td3, t9);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[1] & /*sourcerCommissionRate*/ 8 && t3_value !== (t3_value = (/*sourcerCommissionRate*/ ctx[34]() * 100).toFixed(2) + "")) set_data_dev(t3, t3_value);
    			if (dirty[0] & /*sourcerSQC*/ 128 && t9_value !== (t9_value = /*sourcerSQC*/ ctx[7]().toFixed(2) + "")) set_data_dev(t9, t9_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr0);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(tr1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(643:6) {#if sourcerType == PersonnelType.Employee}",
    		ctx
    	});

    	return block;
    }

    // (677:12) {:else}
    function create_else_block_1(ctx) {
    	let t0;
    	let br;
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text("Partner/Contractor Commission Rate\n              ");
    			br = element("br");
    			t1 = text("\n              伙伴销售提成率");
    			add_location(br, file, 678, 14, 15074);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(677:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (673:12) {#if salesType == PersonnelType.Employee}
    function create_if_block_5(ctx) {
    	let t0;
    	let br;
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text("Sales Commission Rate\n              ");
    			br = element("br");
    			t1 = text("\n              Sales提成率");
    			add_location(br, file, 674, 14, 14961);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(673:12) {#if salesType == PersonnelType.Employee}",
    		ctx
    	});

    	return block;
    }

    // (695:12) {:else}
    function create_else_block(ctx) {
    	let t0;
    	let br;
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text("Partner/Contractor SQC\n              ");
    			br = element("br");
    			t1 = text("\n              伙伴销售计提多少提成?");
    			add_location(br, file, 696, 14, 15507);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(695:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (691:12) {#if salesType == PersonnelType.Employee}
    function create_if_block_4(ctx) {
    	let t0;
    	let br;
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text("Sales SQC (Sales Qualified Commission)\n              ");
    			br = element("br");
    			t1 = text("\n              Sales计提多少阿米巴收入?");
    			add_location(br, file, 692, 14, 15399);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(691:12) {#if salesType == PersonnelType.Employee}",
    		ctx
    	});

    	return block;
    }

    // (707:6) {#if sourcerType == PersonnelType.Employee && contractType == ContractType.New}
    function create_if_block_3(ctx) {
    	let tr0;
    	let td0;
    	let span0;
    	let t0;
    	let br0;
    	let t1;
    	let t2;
    	let td1;
    	let t3_value = (/*serviceCommissionRate*/ ctx[32]() * 100).toFixed(2) + "";
    	let t3;
    	let t4;
    	let t5;
    	let tr1;
    	let td2;
    	let span1;
    	let t6;
    	let br1;
    	let t7;
    	let t8;
    	let td3;
    	let t9_value = /*serviceSQC*/ ctx[6]() + "";
    	let t9;

    	const block = {
    		c: function create() {
    			tr0 = element("tr");
    			td0 = element("td");
    			span0 = element("span");
    			t0 = text("CSM/SE/CS Commission Rate\n              ");
    			br0 = element("br");
    			t1 = text("\n              KU服务方提成率");
    			t2 = space();
    			td1 = element("td");
    			t3 = text(t3_value);
    			t4 = text("%");
    			t5 = space();
    			tr1 = element("tr");
    			td2 = element("td");
    			span1 = element("span");
    			t6 = text("CSM/SE/CS SQC (Sales Qualified Commission)\n              ");
    			br1 = element("br");
    			t7 = text("\n              KU服务方计提多少阿米巴收入?");
    			t8 = space();
    			td3 = element("td");
    			t9 = text(t9_value);
    			add_location(br0, file, 711, 14, 15851);
    			add_location(span0, file, 709, 12, 15790);
    			add_location(td0, file, 708, 10, 15773);
    			add_location(td1, file, 715, 10, 15927);
    			add_location(tr0, file, 707, 8, 15758);
    			add_location(br1, file, 723, 14, 16138);
    			add_location(span1, file, 721, 12, 16060);
    			add_location(td2, file, 720, 10, 16043);
    			add_location(td3, file, 727, 10, 16221);
    			add_location(tr1, file, 719, 8, 16028);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr0, anchor);
    			append_dev(tr0, td0);
    			append_dev(td0, span0);
    			append_dev(span0, t0);
    			append_dev(span0, br0);
    			append_dev(span0, t1);
    			append_dev(tr0, t2);
    			append_dev(tr0, td1);
    			append_dev(td1, t3);
    			append_dev(td1, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, tr1, anchor);
    			append_dev(tr1, td2);
    			append_dev(td2, span1);
    			append_dev(span1, t6);
    			append_dev(span1, br1);
    			append_dev(span1, t7);
    			append_dev(tr1, t8);
    			append_dev(tr1, td3);
    			append_dev(td3, t9);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[1] & /*serviceCommissionRate*/ 2 && t3_value !== (t3_value = (/*serviceCommissionRate*/ ctx[32]() * 100).toFixed(2) + "")) set_data_dev(t3, t3_value);
    			if (dirty[0] & /*serviceSQC*/ 64 && t9_value !== (t9_value = /*serviceSQC*/ ctx[6]() + "")) set_data_dev(t9, t9_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr0);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(tr1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(707:6) {#if sourcerType == PersonnelType.Employee && contractType == ContractType.New}",
    		ctx
    	});

    	return block;
    }

    // (734:6) {#if contractModel == "hybrid" || contractModel == "service"}
    function create_if_block_2(ctx) {
    	let tr;
    	let td0;
    	let span;
    	let t0;
    	let br;
    	let t1;
    	let t2;
    	let td1;
    	let t3_value = /*payDeliveryServiceSQC*/ ctx[5]() + "";
    	let t3;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			span = element("span");
    			t0 = text("Pay Service SQC\n              ");
    			br = element("br");
    			t1 = text("\n              付费服务提成");
    			t2 = space();
    			td1 = element("td");
    			t3 = text(t3_value);
    			add_location(br, file, 738, 14, 16455);
    			add_location(span, file, 736, 12, 16404);
    			add_location(td0, file, 735, 10, 16387);
    			add_location(td1, file, 742, 10, 16529);
    			add_location(tr, file, 734, 8, 16372);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, span);
    			append_dev(span, t0);
    			append_dev(span, br);
    			append_dev(span, t1);
    			append_dev(tr, t2);
    			append_dev(tr, td1);
    			append_dev(td1, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*payDeliveryServiceSQC*/ 32 && t3_value !== (t3_value = /*payDeliveryServiceSQC*/ ctx[5]() + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(734:6) {#if contractModel == \\\"hybrid\\\" || contractModel == \\\"service\\\"}",
    		ctx
    	});

    	return block;
    }

    // (762:6) {#if salesType == "partner" || salesType == "contractor"}
    function create_if_block_1(ctx) {
    	let tr0;
    	let td0;
    	let span0;
    	let t0;
    	let br0;
    	let t1;
    	let t2;
    	let td1;
    	let t3_value = /*partnerSalesSQC*/ ctx[4]() + "";
    	let t3;
    	let t4;
    	let tr1;
    	let td2;
    	let span1;
    	let t5;
    	let br1;
    	let t6;
    	let t7;
    	let td3;
    	let t8_value = (/*partnerSalesCommissionRate*/ ctx[30]() * 100).toFixed(2) + "";
    	let t8;
    	let t9;
    	let t10_value = (/*partnerSalesSQC_SQR_Ratio*/ ctx[31]() * 100).toFixed(2) + "";
    	let t10;
    	let t11;
    	let t12;
    	let tr2;
    	let td4;
    	let t13;
    	let br2;
    	let t14;
    	let t15;
    	let td5;
    	let t16_value = /*partnerIncome*/ ctx[29]() + "";
    	let t16;

    	const block = {
    		c: function create() {
    			tr0 = element("tr");
    			td0 = element("td");
    			span0 = element("span");
    			t0 = text("Partner Sales SQC (Sales Qualified Commission)\n              ");
    			br0 = element("br");
    			t1 = text("\n              渠道销售计提多少阿米巴收入?");
    			t2 = space();
    			td1 = element("td");
    			t3 = text(t3_value);
    			t4 = space();
    			tr1 = element("tr");
    			td2 = element("td");
    			span1 = element("span");
    			t5 = text("Partner Sales Commission Rate\n              ");
    			br1 = element("br");
    			t6 = text("\n              渠道销售提成率");
    			t7 = space();
    			td3 = element("td");
    			t8 = text(t8_value);
    			t9 = text("% (all: ");
    			t10 = text(t10_value);
    			t11 = text("%)");
    			t12 = space();
    			tr2 = element("tr");
    			td4 = element("td");
    			t13 = text("Partner Income\n            ");
    			br2 = element("br");
    			t14 = text("\n            合作伙伴最终收入");
    			t15 = space();
    			td5 = element("td");
    			t16 = text(t16_value);
    			add_location(br0, file, 766, 14, 17083);
    			add_location(span0, file, 764, 12, 17001);
    			add_location(td0, file, 763, 10, 16984);
    			add_location(td1, file, 770, 10, 17165);
    			add_location(tr0, file, 762, 8, 16969);
    			add_location(br1, file, 779, 14, 17338);
    			add_location(span1, file, 777, 12, 17273);
    			add_location(td2, file, 776, 10, 17256);
    			add_location(td3, file, 783, 10, 17413);
    			add_location(tr1, file, 775, 8, 17241);
    			add_location(br2, file, 792, 12, 17663);
    			add_location(td4, file, 790, 10, 17619);
    			add_location(td5, file, 795, 10, 17717);
    			add_location(tr2, file, 789, 8, 17604);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr0, anchor);
    			append_dev(tr0, td0);
    			append_dev(td0, span0);
    			append_dev(span0, t0);
    			append_dev(span0, br0);
    			append_dev(span0, t1);
    			append_dev(tr0, t2);
    			append_dev(tr0, td1);
    			append_dev(td1, t3);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, tr1, anchor);
    			append_dev(tr1, td2);
    			append_dev(td2, span1);
    			append_dev(span1, t5);
    			append_dev(span1, br1);
    			append_dev(span1, t6);
    			append_dev(tr1, t7);
    			append_dev(tr1, td3);
    			append_dev(td3, t8);
    			append_dev(td3, t9);
    			append_dev(td3, t10);
    			append_dev(td3, t11);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, tr2, anchor);
    			append_dev(tr2, td4);
    			append_dev(td4, t13);
    			append_dev(td4, br2);
    			append_dev(td4, t14);
    			append_dev(tr2, t15);
    			append_dev(tr2, td5);
    			append_dev(td5, t16);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*partnerSalesSQC*/ 16 && t3_value !== (t3_value = /*partnerSalesSQC*/ ctx[4]() + "")) set_data_dev(t3, t3_value);
    			if (dirty[0] & /*partnerSalesCommissionRate*/ 1073741824 && t8_value !== (t8_value = (/*partnerSalesCommissionRate*/ ctx[30]() * 100).toFixed(2) + "")) set_data_dev(t8, t8_value);
    			if (dirty[1] & /*partnerSalesSQC_SQR_Ratio*/ 1 && t10_value !== (t10_value = (/*partnerSalesSQC_SQR_Ratio*/ ctx[31]() * 100).toFixed(2) + "")) set_data_dev(t10, t10_value);
    			if (dirty[0] & /*partnerIncome*/ 536870912 && t16_value !== (t16_value = /*partnerIncome*/ ctx[29]() + "")) set_data_dev(t16, t16_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr0);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(tr1);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(tr2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(762:6) {#if salesType == \\\"partner\\\" || salesType == \\\"contractor\\\"}",
    		ctx
    	});

    	return block;
    }

    // (842:6) {#if value.text}
    function create_if_block(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*key*/ ctx[55] + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*value*/ ctx[56].text + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = (/*value*/ ctx[56].rate * 100).toFixed(2) + "";
    	let t4;
    	let t5;
    	let t6;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = text("%");
    			t6 = space();
    			add_location(td0, file, 843, 10, 18686);
    			add_location(td1, file, 844, 10, 18711);
    			add_location(td2, file, 845, 10, 18743);
    			add_location(tr, file, 842, 8, 18671);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(td2, t5);
    			append_dev(tr, t6);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(842:6) {#if value.text}",
    		ctx
    	});

    	return block;
    }

    // (841:4) {#each Object.entries(commissionRate) as [key, value]}
    function create_each_block(ctx) {
    	let if_block_anchor;
    	let if_block = /*value*/ ctx[56].text && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*value*/ ctx[56].text) if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(841:4) {#each Object.entries(commissionRate) as [key, value]}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let h10;
    	let t1;
    	let form;
    	let table0;
    	let tr0;
    	let td0;
    	let label0;
    	let t2;
    	let br0;
    	let t3;
    	let t4;
    	let td1;
    	let input0;
    	let t5;
    	let tr1;
    	let td2;
    	let label1;
    	let t6;
    	let br1;
    	let t7;
    	let t8;
    	let td3;
    	let select0;
    	let t9;
    	let t10;
    	let t11;
    	let tr2;
    	let td4;
    	let label2;
    	let t12;
    	let br2;
    	let t13;
    	let t14;
    	let td5;
    	let select1;
    	let t15;
    	let tr3;
    	let td6;
    	let label3;
    	let t16;
    	let br3;
    	let t17;
    	let t18;
    	let td7;
    	let input1;
    	let t19;
    	let tr4;
    	let td8;
    	let label4;
    	let t20;
    	let br4;
    	let t21;
    	let t22;
    	let td9;
    	let t23_value = /*paymentRatio*/ ctx[37] * 100 + "";
    	let t23;
    	let t24;
    	let t25;
    	let tr5;
    	let td10;
    	let label5;
    	let t26;
    	let br5;
    	let t27;
    	let br6;
    	let t28;
    	let t29;
    	let td11;
    	let input2;
    	let t30;
    	let tr6;
    	let td12;
    	let label6;
    	let t31;
    	let br7;
    	let t32;
    	let t33;
    	let td13;
    	let t34;
    	let t35;
    	let t36;
    	let t37;
    	let tr7;
    	let td14;
    	let label7;
    	let t38;
    	let br8;
    	let t39;
    	let t40;
    	let td15;
    	let select2;
    	let t41;
    	let tr8;
    	let td16;
    	let label8;
    	let t42;
    	let br9;
    	let t43;
    	let t44;
    	let td17;
    	let select3;
    	let t45;
    	let t46;
    	let t47;
    	let t48;
    	let t49;
    	let tr9;
    	let td18;
    	let span0;
    	let t50;
    	let td19;
    	let t51_value = /*realSalesCommissionRate*/ ctx[33]() * 100 + "";
    	let t51;
    	let t52;
    	let t53;
    	let tr10;
    	let td20;
    	let span1;
    	let t54;
    	let td21;
    	let t55_value = /*salesSQC*/ ctx[8]().toFixed(2) + "";
    	let t55;
    	let t56;
    	let t57;
    	let t58;
    	let tr11;
    	let td22;
    	let t59;
    	let br10;
    	let t60;
    	let br11;
    	let t61;
    	let t62;
    	let td23;
    	let input3;
    	let t63;
    	let t64;
    	let tr12;
    	let td24;
    	let label9;
    	let t65;
    	let br12;
    	let t66;
    	let t67;
    	let td25;
    	let t68_value = /*bonusPool*/ ctx[9]() + "";
    	let t68;
    	let t69;
    	let tr13;
    	let td26;
    	let t70;
    	let br13;
    	let t71;
    	let t72;
    	let td27;
    	let t73_value = /*shareInPayment*/ ctx[10].toFixed(2) + "";
    	let t73;
    	let t74;
    	let t75_value = (/*shareInPaymentRatio*/ ctx[27] * 100).toFixed(2) + "";
    	let t75;
    	let t76;
    	let t77;
    	let tr14;
    	let td28;
    	let t78;
    	let br14;
    	let t79;
    	let t80;
    	let td29;
    	let t81_value = /*netIncomeByPayment*/ ctx[12].toFixed(2) + "";
    	let t81;
    	let t82;
    	let t83_value = (/*netIncomeRatioByPayment*/ ctx[2] * 100).toFixed(2) + "";
    	let t83;
    	let t84;
    	let t85;
    	let h11;
    	let t87;
    	let table1;
    	let t88;
    	let div;
    	let h2;
    	let t90;
    	let t91;
    	let t92;
    	let t93_value = /*bonusPool*/ ctx[9]() + "";
    	let t93;
    	let t94;
    	let t95_value = /*salesSQC*/ ctx[8]() + "";
    	let t95;
    	let t96;
    	let t97_value = /*sourcerSQC*/ ctx[7]() + "";
    	let t97;
    	let t98;
    	let t99_value = /*serviceSQC*/ ctx[6]() + "";
    	let t99;
    	let t100;
    	let t101_value = /*payDeliveryServiceSQC*/ ctx[5]() + "";
    	let t101;
    	let t102;
    	let t103_value = /*partnerSalesSQC*/ ctx[4]() + "";
    	let t103;
    	let t104;
    	let t105;
    	let t106;
    	let mounted;
    	let dispose;
    	let each_value_5 = /*contractModels*/ ctx[1];
    	validate_each_argument(each_value_5);
    	let each_blocks_4 = [];

    	for (let i = 0; i < each_value_5.length; i += 1) {
    		each_blocks_4[i] = create_each_block_5(get_each_context_5(ctx, each_value_5, i));
    	}

    	let if_block0 = /*contractModel*/ ctx[0] == "hybrid" && create_if_block_13(ctx);
    	let if_block1 = /*contractModel*/ ctx[0] != "service" && create_if_block_12(ctx);
    	let each_value_4 = /*contractTypes*/ ctx[38];
    	validate_each_argument(each_value_4);
    	let each_blocks_3 = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks_3[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
    	}

    	let if_block2 = (/*contractModel*/ ctx[0] == "hybrid" || /*contractModel*/ ctx[0] == "product") && create_if_block_11(ctx);
    	let if_block3 = (/*contractModel*/ ctx[0] == "hybrid" || /*contractModel*/ ctx[0] == "service") && create_if_block_10(ctx);
    	let each_value_3 = /*personnelTypes*/ ctx[39];
    	validate_each_argument(each_value_3);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_2[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	let each_value_2 = /*personnelTypes*/ ctx[39];
    	validate_each_argument(each_value_2);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let if_block4 = (/*salesType*/ ctx[18] == PersonnelType.Partner || /*salesType*/ ctx[18] == PersonnelType.Contractor) && create_if_block_9(ctx);
    	let if_block5 = (/*contractModel*/ ctx[0] == "hybrid" || /*contractModel*/ ctx[0] == "product") && create_if_block_8(ctx);
    	let if_block6 = (/*contractModel*/ ctx[0] == "hybrid" || /*contractModel*/ ctx[0] == "service") && create_if_block_7(ctx);
    	let if_block7 = /*sourcerType*/ ctx[19] == PersonnelType.Employee && create_if_block_6(ctx);

    	function select_block_type(ctx, dirty) {
    		if (/*salesType*/ ctx[18] == PersonnelType.Employee) return create_if_block_5;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block8 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*salesType*/ ctx[18] == PersonnelType.Employee) return create_if_block_4;
    		return create_else_block;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block9 = current_block_type_1(ctx);
    	let if_block10 = /*sourcerType*/ ctx[19] == PersonnelType.Employee && /*contractType*/ ctx[17] == ContractType.New && create_if_block_3(ctx);
    	let if_block11 = (/*contractModel*/ ctx[0] == "hybrid" || /*contractModel*/ ctx[0] == "service") && create_if_block_2(ctx);
    	let if_block12 = (/*salesType*/ ctx[18] == "partner" || /*salesType*/ ctx[18] == "contractor") && create_if_block_1(ctx);
    	let each_value = Object.entries(commissionRate);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			h10 = element("h1");
    			h10.textContent = "Commission Calculator";
    			t1 = space();
    			form = element("form");
    			table0 = element("table");
    			tr0 = element("tr");
    			td0 = element("td");
    			label0 = element("label");
    			t2 = text("Total Contract Value (TCV)\n            ");
    			br0 = element("br");
    			t3 = text("\n            合同总价值");
    			t4 = space();
    			td1 = element("td");
    			input0 = element("input");
    			t5 = space();
    			tr1 = element("tr");
    			td2 = element("td");
    			label1 = element("label");
    			t6 = text("Contract Model \n            ");
    			br1 = element("br");
    			t7 = text("\n            合同种类");
    			t8 = space();
    			td3 = element("td");
    			select0 = element("select");

    			for (let i = 0; i < each_blocks_4.length; i += 1) {
    				each_blocks_4[i].c();
    			}

    			t9 = space();
    			if (if_block0) if_block0.c();
    			t10 = space();
    			if (if_block1) if_block1.c();
    			t11 = space();
    			tr2 = element("tr");
    			td4 = element("td");
    			label2 = element("label");
    			t12 = text("Contract Type\n            ");
    			br2 = element("br");
    			t13 = text("\n            合同类型");
    			t14 = space();
    			td5 = element("td");
    			select1 = element("select");

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].c();
    			}

    			t15 = space();
    			tr3 = element("tr");
    			td6 = element("td");
    			label3 = element("label");
    			t16 = text("Payment\n            ");
    			br3 = element("br");
    			t17 = text("\n            回款");
    			t18 = space();
    			td7 = element("td");
    			input1 = element("input");
    			t19 = space();
    			tr4 = element("tr");
    			td8 = element("td");
    			label4 = element("label");
    			t20 = text("Payment Ratio\n            ");
    			br4 = element("br");
    			t21 = text("\n            回款比例");
    			t22 = space();
    			td9 = element("td");
    			t23 = text(t23_value);
    			t24 = text("%");
    			t25 = space();
    			tr5 = element("tr");
    			td10 = element("td");
    			label5 = element("label");
    			t26 = text("Sales Cost\n            ");
    			br5 = element("br");
    			t27 = text("\n            销售成本, 为完成本项目交付 ");
    			br6 = element("br");
    			t28 = text("\n            支付费用采购的第三方服务、软件、硬件费用");
    			t29 = space();
    			td11 = element("td");
    			input2 = element("input");
    			t30 = space();
    			tr6 = element("tr");
    			td12 = element("td");
    			label6 = element("label");
    			t31 = text("Payment Margin\n            ");
    			br7 = element("br");
    			t32 = text("\n            回款毛利");
    			t33 = space();
    			td13 = element("td");
    			t34 = text(/*paymentMargin*/ ctx[25]);
    			t35 = space();
    			if (if_block2) if_block2.c();
    			t36 = space();
    			if (if_block3) if_block3.c();
    			t37 = space();
    			tr7 = element("tr");
    			td14 = element("td");
    			label7 = element("label");
    			t38 = text("Sourcer\n            ");
    			br8 = element("br");
    			t39 = text("\n            线索的来源?");
    			t40 = space();
    			td15 = element("td");
    			select2 = element("select");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t41 = space();
    			tr8 = element("tr");
    			td16 = element("td");
    			label8 = element("label");
    			t42 = text("Sales\n            ");
    			br9 = element("br");
    			t43 = text("\n            订单谁销售的？");
    			t44 = space();
    			td17 = element("td");
    			select3 = element("select");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t45 = space();
    			if (if_block4) if_block4.c();
    			t46 = space();
    			if (if_block5) if_block5.c();
    			t47 = space();
    			if (if_block6) if_block6.c();
    			t48 = space();
    			if (if_block7) if_block7.c();
    			t49 = space();
    			tr9 = element("tr");
    			td18 = element("td");
    			span0 = element("span");
    			if_block8.c();
    			t50 = space();
    			td19 = element("td");
    			t51 = text(t51_value);
    			t52 = text("%");
    			t53 = space();
    			tr10 = element("tr");
    			td20 = element("td");
    			span1 = element("span");
    			if_block9.c();
    			t54 = space();
    			td21 = element("td");
    			t55 = text(t55_value);
    			t56 = space();
    			if (if_block10) if_block10.c();
    			t57 = space();
    			if (if_block11) if_block11.c();
    			t58 = space();
    			tr11 = element("tr");
    			td22 = element("td");
    			t59 = text("Compensation\n          ");
    			br10 = element("br");
    			t60 = text("\n          补偿机制，在Sales SQC或\n          ");
    			br11 = element("br");
    			t61 = text("\n          Partner/Contractor SQC中扣除某些费用");
    			t62 = space();
    			td23 = element("td");
    			input3 = element("input");
    			t63 = space();
    			if (if_block12) if_block12.c();
    			t64 = space();
    			tr12 = element("tr");
    			td24 = element("td");
    			label9 = element("label");
    			t65 = text("Bonus Pool\n            ");
    			br12 = element("br");
    			t66 = text("\n            计入公司奖金池?");
    			t67 = space();
    			td25 = element("td");
    			t68 = text(t68_value);
    			t69 = space();
    			tr13 = element("tr");
    			td26 = element("td");
    			t70 = text("Share in Payment\n          ");
    			br13 = element("br");
    			t71 = text("\n          本次回款的公司分利");
    			t72 = space();
    			td27 = element("td");
    			t73 = text(t73_value);
    			t74 = text(" (");
    			t75 = text(t75_value);
    			t76 = text("%)");
    			t77 = space();
    			tr14 = element("tr");
    			td28 = element("td");
    			t78 = text("Net Income in Payment\n          ");
    			br14 = element("br");
    			t79 = text("\n          本次回款的公司真实净利");
    			t80 = space();
    			td29 = element("td");
    			t81 = text(t81_value);
    			t82 = text(" (");
    			t83 = text(t83_value);
    			t84 = text("%)");
    			t85 = space();
    			h11 = element("h1");
    			h11.textContent = "Commission Rate Table";
    			t87 = space();
    			table1 = element("table");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t88 = space();
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "DEBUG";
    			t90 = text("\n    * Share in Payment(");
    			t91 = text(/*shareInPayment*/ ctx[10]);
    			t92 = text(") = Bonus Pool(");
    			t93 = text(t93_value);
    			t94 = text(") + Sales\n    SQC(");
    			t95 = text(t95_value);
    			t96 = text(") + Sourcer SQC(");
    			t97 = text(t97_value);
    			t98 = text(") + Service SQC(");
    			t99 = text(t99_value);
    			t100 = text(")\n    + Pay Delivery Service SQC(");
    			t101 = text(t101_value);
    			t102 = text(") + Partner Sales SQC(");
    			t103 = text(t103_value);
    			t104 = text(")\n    - Compensation(");
    			t105 = text(/*compensation*/ ctx[3]);
    			t106 = text(")");
    			add_location(h10, file, 341, 2, 7473);
    			add_location(br0, file, 348, 12, 7655);
    			attr_dev(label0, "for", "tcv");
    			add_location(label0, file, 346, 10, 7586);
    			add_location(td0, file, 345, 8, 7571);
    			attr_dev(input0, "name", "tcv");
    			attr_dev(input0, "type", "number");
    			add_location(input0, file, 353, 10, 7736);
    			add_location(td1, file, 352, 8, 7721);
    			add_location(tr0, file, 344, 6, 7558);
    			add_location(br1, file, 361, 12, 7917);
    			attr_dev(label1, "for", "contractModel");
    			add_location(label1, file, 359, 10, 7849);
    			add_location(td2, file, 358, 8, 7834);
    			attr_dev(select0, "name", "contractModel");
    			select0.disabled = true;
    			if (/*contractModel*/ ctx[0] === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[45].call(select0));
    			add_location(select0, file, 366, 10, 7997);
    			add_location(td3, file, 365, 8, 7982);
    			add_location(tr1, file, 357, 6, 7821);
    			add_location(br2, file, 443, 12, 9729);
    			attr_dev(label2, "for", "contractModel");
    			add_location(label2, file, 441, 10, 9663);
    			add_location(td4, file, 440, 8, 9648);
    			attr_dev(select1, "name", "contractType");
    			if (/*contractType*/ ctx[17] === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[48].call(select1));
    			add_location(select1, file, 448, 10, 9809);
    			add_location(td5, file, 447, 8, 9794);
    			add_location(tr2, file, 439, 6, 9635);
    			add_location(br3, file, 462, 12, 10146);
    			attr_dev(label3, "for", "payment");
    			add_location(label3, file, 460, 10, 10092);
    			add_location(td6, file, 459, 8, 10077);
    			attr_dev(input1, "name", "payment");
    			attr_dev(input1, "type", "number");
    			add_location(input1, file, 467, 10, 10224);
    			add_location(td7, file, 466, 8, 10209);
    			add_location(tr3, file, 458, 6, 10064);
    			add_location(br4, file, 475, 12, 10410);
    			attr_dev(label4, "for", "paymentRatio");
    			add_location(label4, file, 473, 10, 10345);
    			add_location(td8, file, 472, 8, 10330);
    			add_location(td9, file, 479, 8, 10475);
    			add_location(tr4, file, 471, 6, 10317);
    			add_location(br5, file, 488, 12, 10632);
    			add_location(br6, file, 489, 27, 10666);
    			attr_dev(label5, "for", "salesCost");
    			add_location(label5, file, 486, 10, 10573);
    			add_location(td10, file, 485, 8, 10558);
    			attr_dev(input2, "name", "salesCost");
    			attr_dev(input2, "type", "number");
    			add_location(input2, file, 494, 10, 10762);
    			add_location(td11, file, 493, 8, 10747);
    			add_location(tr5, file, 484, 6, 10545);
    			add_location(br7, file, 501, 12, 10953);
    			attr_dev(label6, "for", "paymentMargin");
    			add_location(label6, file, 499, 10, 10886);
    			add_location(td12, file, 498, 8, 10871);
    			add_location(td13, file, 506, 8, 11019);
    			add_location(tr6, file, 497, 6, 10858);
    			add_location(br8, file, 542, 12, 11720);
    			attr_dev(label7, "for", "whoSourcingType");
    			add_location(label7, file, 540, 10, 11658);
    			add_location(td14, file, 539, 8, 11643);
    			attr_dev(select2, "name", "whoSourcingType");
    			if (/*sourcerType*/ ctx[19] === void 0) add_render_callback(() => /*select2_change_handler*/ ctx[51].call(select2));
    			add_location(select2, file, 547, 10, 11802);
    			add_location(td15, file, 546, 8, 11787);
    			add_location(tr7, file, 538, 6, 11630);
    			add_location(br9, file, 561, 12, 12178);
    			attr_dev(label8, "for", "whoSalesType");
    			add_location(label8, file, 559, 10, 12121);
    			add_location(td16, file, 558, 8, 12106);
    			attr_dev(select3, "name", "whoSalesType");
    			if (/*salesType*/ ctx[18] === void 0) add_render_callback(() => /*select3_change_handler*/ ctx[52].call(select3));
    			add_location(select3, file, 566, 10, 12261);
    			add_location(td17, file, 565, 8, 12246);
    			add_location(tr8, file, 557, 6, 12093);
    			add_location(span0, file, 671, 10, 14850);
    			add_location(td18, file, 670, 8, 14835);
    			add_location(td19, file, 683, 8, 15161);
    			add_location(tr9, file, 669, 6, 14822);
    			add_location(span1, file, 689, 10, 15271);
    			add_location(td20, file, 688, 8, 15256);
    			add_location(td21, file, 701, 8, 15598);
    			add_location(tr10, file, 687, 6, 15243);
    			add_location(br10, file, 751, 10, 16672);
    			add_location(br11, file, 753, 10, 16716);
    			add_location(td22, file, 749, 8, 16634);
    			attr_dev(input3, "name", "compensation");
    			attr_dev(input3, "type", "number");
    			add_location(input3, file, 757, 10, 16800);
    			add_location(td23, file, 756, 8, 16785);
    			add_location(tr11, file, 748, 6, 16621);
    			add_location(br12, file, 805, 12, 17884);
    			attr_dev(label9, "for", "bonus");
    			add_location(label9, file, 803, 10, 17829);
    			add_location(td24, file, 802, 8, 17814);
    			add_location(td25, file, 809, 8, 17953);
    			add_location(tr12, file, 801, 6, 17801);
    			add_location(br13, file, 817, 10, 18070);
    			add_location(td26, file, 815, 8, 18028);
    			add_location(td27, file, 820, 8, 18119);
    			add_location(tr13, file, 814, 6, 18015);
    			add_location(br14, file, 828, 10, 18299);
    			add_location(td28, file, 826, 8, 18252);
    			add_location(td29, file, 831, 8, 18350);
    			add_location(tr14, file, 825, 6, 18239);
    			attr_dev(table0, "border", "1");
    			attr_dev(table0, "cellspacing", "1");
    			add_location(table0, file, 343, 4, 7517);
    			add_location(form, file, 342, 2, 7506);
    			add_location(h11, file, 838, 2, 18497);
    			attr_dev(table1, "border", "1");
    			attr_dev(table1, "cellspacing", "1");
    			attr_dev(table1, "cellpadding", "1");
    			add_location(table1, file, 839, 2, 18530);
    			add_location(h2, file, 852, 4, 18847);
    			add_location(div, file, 851, 2, 18837);
    			add_location(main, file, 340, 0, 7464);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h10);
    			append_dev(main, t1);
    			append_dev(main, form);
    			append_dev(form, table0);
    			append_dev(table0, tr0);
    			append_dev(tr0, td0);
    			append_dev(td0, label0);
    			append_dev(label0, t2);
    			append_dev(label0, br0);
    			append_dev(label0, t3);
    			append_dev(tr0, t4);
    			append_dev(tr0, td1);
    			append_dev(td1, input0);
    			set_input_value(input0, /*tcv*/ ctx[21]);
    			append_dev(table0, t5);
    			append_dev(table0, tr1);
    			append_dev(tr1, td2);
    			append_dev(td2, label1);
    			append_dev(label1, t6);
    			append_dev(label1, br1);
    			append_dev(label1, t7);
    			append_dev(tr1, t8);
    			append_dev(tr1, td3);
    			append_dev(td3, select0);

    			for (let i = 0; i < each_blocks_4.length; i += 1) {
    				each_blocks_4[i].m(select0, null);
    			}

    			select_option(select0, /*contractModel*/ ctx[0]);
    			append_dev(table0, t9);
    			if (if_block0) if_block0.m(table0, null);
    			append_dev(table0, t10);
    			if (if_block1) if_block1.m(table0, null);
    			append_dev(table0, t11);
    			append_dev(table0, tr2);
    			append_dev(tr2, td4);
    			append_dev(td4, label2);
    			append_dev(label2, t12);
    			append_dev(label2, br2);
    			append_dev(label2, t13);
    			append_dev(tr2, t14);
    			append_dev(tr2, td5);
    			append_dev(td5, select1);

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].m(select1, null);
    			}

    			select_option(select1, /*contractType*/ ctx[17]);
    			append_dev(table0, t15);
    			append_dev(table0, tr3);
    			append_dev(tr3, td6);
    			append_dev(td6, label3);
    			append_dev(label3, t16);
    			append_dev(label3, br3);
    			append_dev(label3, t17);
    			append_dev(tr3, t18);
    			append_dev(tr3, td7);
    			append_dev(td7, input1);
    			set_input_value(input1, /*payment*/ ctx[11]);
    			append_dev(table0, t19);
    			append_dev(table0, tr4);
    			append_dev(tr4, td8);
    			append_dev(td8, label4);
    			append_dev(label4, t20);
    			append_dev(label4, br4);
    			append_dev(label4, t21);
    			append_dev(tr4, t22);
    			append_dev(tr4, td9);
    			append_dev(td9, t23);
    			append_dev(td9, t24);
    			append_dev(table0, t25);
    			append_dev(table0, tr5);
    			append_dev(tr5, td10);
    			append_dev(td10, label5);
    			append_dev(label5, t26);
    			append_dev(label5, br5);
    			append_dev(label5, t27);
    			append_dev(label5, br6);
    			append_dev(label5, t28);
    			append_dev(tr5, t29);
    			append_dev(tr5, td11);
    			append_dev(td11, input2);
    			set_input_value(input2, /*salesCost*/ ctx[13]);
    			append_dev(table0, t30);
    			append_dev(table0, tr6);
    			append_dev(tr6, td12);
    			append_dev(td12, label6);
    			append_dev(label6, t31);
    			append_dev(label6, br7);
    			append_dev(label6, t32);
    			append_dev(tr6, t33);
    			append_dev(tr6, td13);
    			append_dev(td13, t34);
    			append_dev(table0, t35);
    			if (if_block2) if_block2.m(table0, null);
    			append_dev(table0, t36);
    			if (if_block3) if_block3.m(table0, null);
    			append_dev(table0, t37);
    			append_dev(table0, tr7);
    			append_dev(tr7, td14);
    			append_dev(td14, label7);
    			append_dev(label7, t38);
    			append_dev(label7, br8);
    			append_dev(label7, t39);
    			append_dev(tr7, t40);
    			append_dev(tr7, td15);
    			append_dev(td15, select2);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(select2, null);
    			}

    			select_option(select2, /*sourcerType*/ ctx[19]);
    			append_dev(table0, t41);
    			append_dev(table0, tr8);
    			append_dev(tr8, td16);
    			append_dev(td16, label8);
    			append_dev(label8, t42);
    			append_dev(label8, br9);
    			append_dev(label8, t43);
    			append_dev(tr8, t44);
    			append_dev(tr8, td17);
    			append_dev(td17, select3);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(select3, null);
    			}

    			select_option(select3, /*salesType*/ ctx[18]);
    			append_dev(table0, t45);
    			if (if_block4) if_block4.m(table0, null);
    			append_dev(table0, t46);
    			if (if_block5) if_block5.m(table0, null);
    			append_dev(table0, t47);
    			if (if_block6) if_block6.m(table0, null);
    			append_dev(table0, t48);
    			if (if_block7) if_block7.m(table0, null);
    			append_dev(table0, t49);
    			append_dev(table0, tr9);
    			append_dev(tr9, td18);
    			append_dev(td18, span0);
    			if_block8.m(span0, null);
    			append_dev(tr9, t50);
    			append_dev(tr9, td19);
    			append_dev(td19, t51);
    			append_dev(td19, t52);
    			append_dev(table0, t53);
    			append_dev(table0, tr10);
    			append_dev(tr10, td20);
    			append_dev(td20, span1);
    			if_block9.m(span1, null);
    			append_dev(tr10, t54);
    			append_dev(tr10, td21);
    			append_dev(td21, t55);
    			append_dev(table0, t56);
    			if (if_block10) if_block10.m(table0, null);
    			append_dev(table0, t57);
    			if (if_block11) if_block11.m(table0, null);
    			append_dev(table0, t58);
    			append_dev(table0, tr11);
    			append_dev(tr11, td22);
    			append_dev(td22, t59);
    			append_dev(td22, br10);
    			append_dev(td22, t60);
    			append_dev(td22, br11);
    			append_dev(td22, t61);
    			append_dev(tr11, t62);
    			append_dev(tr11, td23);
    			append_dev(td23, input3);
    			set_input_value(input3, /*compensation*/ ctx[3]);
    			append_dev(table0, t63);
    			if (if_block12) if_block12.m(table0, null);
    			append_dev(table0, t64);
    			append_dev(table0, tr12);
    			append_dev(tr12, td24);
    			append_dev(td24, label9);
    			append_dev(label9, t65);
    			append_dev(label9, br12);
    			append_dev(label9, t66);
    			append_dev(tr12, t67);
    			append_dev(tr12, td25);
    			append_dev(td25, t68);
    			append_dev(table0, t69);
    			append_dev(table0, tr13);
    			append_dev(tr13, td26);
    			append_dev(td26, t70);
    			append_dev(td26, br13);
    			append_dev(td26, t71);
    			append_dev(tr13, t72);
    			append_dev(tr13, td27);
    			append_dev(td27, t73);
    			append_dev(td27, t74);
    			append_dev(td27, t75);
    			append_dev(td27, t76);
    			append_dev(table0, t77);
    			append_dev(table0, tr14);
    			append_dev(tr14, td28);
    			append_dev(td28, t78);
    			append_dev(td28, br14);
    			append_dev(td28, t79);
    			append_dev(tr14, t80);
    			append_dev(tr14, td29);
    			append_dev(td29, t81);
    			append_dev(td29, t82);
    			append_dev(td29, t83);
    			append_dev(td29, t84);
    			append_dev(main, t85);
    			append_dev(main, h11);
    			append_dev(main, t87);
    			append_dev(main, table1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table1, null);
    			}

    			append_dev(main, t88);
    			append_dev(main, div);
    			append_dev(div, h2);
    			append_dev(div, t90);
    			append_dev(div, t91);
    			append_dev(div, t92);
    			append_dev(div, t93);
    			append_dev(div, t94);
    			append_dev(div, t95);
    			append_dev(div, t96);
    			append_dev(div, t97);
    			append_dev(div, t98);
    			append_dev(div, t99);
    			append_dev(div, t100);
    			append_dev(div, t101);
    			append_dev(div, t102);
    			append_dev(div, t103);
    			append_dev(div, t104);
    			append_dev(div, t105);
    			append_dev(div, t106);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[44]),
    					listen_dev(select0, "change", /*select0_change_handler*/ ctx[45]),
    					listen_dev(select1, "change", /*select1_change_handler*/ ctx[48]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[49]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[50]),
    					listen_dev(select2, "change", /*select2_change_handler*/ ctx[51]),
    					listen_dev(select3, "change", /*select3_change_handler*/ ctx[52]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[54])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*tcv*/ 2097152 && to_number(input0.value) !== /*tcv*/ ctx[21]) {
    				set_input_value(input0, /*tcv*/ ctx[21]);
    			}

    			if (dirty[0] & /*contractModels*/ 2) {
    				each_value_5 = /*contractModels*/ ctx[1];
    				validate_each_argument(each_value_5);
    				let i;

    				for (i = 0; i < each_value_5.length; i += 1) {
    					const child_ctx = get_each_context_5(ctx, each_value_5, i);

    					if (each_blocks_4[i]) {
    						each_blocks_4[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_4[i] = create_each_block_5(child_ctx);
    						each_blocks_4[i].c();
    						each_blocks_4[i].m(select0, null);
    					}
    				}

    				for (; i < each_blocks_4.length; i += 1) {
    					each_blocks_4[i].d(1);
    				}

    				each_blocks_4.length = each_value_5.length;
    			}

    			if (dirty[0] & /*contractModel, contractModels*/ 3) {
    				select_option(select0, /*contractModel*/ ctx[0]);
    			}

    			if (/*contractModel*/ ctx[0] == "hybrid") {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_13(ctx);
    					if_block0.c();
    					if_block0.m(table0, t10);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*contractModel*/ ctx[0] != "service") {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_12(ctx);
    					if_block1.c();
    					if_block1.m(table0, t11);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty[1] & /*contractTypes*/ 128) {
    				each_value_4 = /*contractTypes*/ ctx[38];
    				validate_each_argument(each_value_4);
    				let i;

    				for (i = 0; i < each_value_4.length; i += 1) {
    					const child_ctx = get_each_context_4(ctx, each_value_4, i);

    					if (each_blocks_3[i]) {
    						each_blocks_3[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_3[i] = create_each_block_4(child_ctx);
    						each_blocks_3[i].c();
    						each_blocks_3[i].m(select1, null);
    					}
    				}

    				for (; i < each_blocks_3.length; i += 1) {
    					each_blocks_3[i].d(1);
    				}

    				each_blocks_3.length = each_value_4.length;
    			}

    			if (dirty[0] & /*contractType*/ 131072 | dirty[1] & /*contractTypes*/ 128) {
    				select_option(select1, /*contractType*/ ctx[17]);
    			}

    			if (dirty[0] & /*payment*/ 2048 && to_number(input1.value) !== /*payment*/ ctx[11]) {
    				set_input_value(input1, /*payment*/ ctx[11]);
    			}

    			if (dirty[1] & /*paymentRatio*/ 64 && t23_value !== (t23_value = /*paymentRatio*/ ctx[37] * 100 + "")) set_data_dev(t23, t23_value);

    			if (dirty[0] & /*salesCost*/ 8192 && to_number(input2.value) !== /*salesCost*/ ctx[13]) {
    				set_input_value(input2, /*salesCost*/ ctx[13]);
    			}

    			if (dirty[0] & /*paymentMargin*/ 33554432) set_data_dev(t34, /*paymentMargin*/ ctx[25]);

    			if (/*contractModel*/ ctx[0] == "hybrid" || /*contractModel*/ ctx[0] == "product") {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_11(ctx);
    					if_block2.c();
    					if_block2.m(table0, t36);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*contractModel*/ ctx[0] == "hybrid" || /*contractModel*/ ctx[0] == "service") {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block_10(ctx);
    					if_block3.c();
    					if_block3.m(table0, t37);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (dirty[1] & /*personnelTypes*/ 256) {
    				each_value_3 = /*personnelTypes*/ ctx[39];
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_3(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(select2, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_3.length;
    			}

    			if (dirty[0] & /*sourcerType*/ 524288 | dirty[1] & /*personnelTypes*/ 256) {
    				select_option(select2, /*sourcerType*/ ctx[19]);
    			}

    			if (dirty[1] & /*personnelTypes*/ 256) {
    				each_value_2 = /*personnelTypes*/ ctx[39];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(select3, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_2.length;
    			}

    			if (dirty[0] & /*salesType*/ 262144 | dirty[1] & /*personnelTypes*/ 256) {
    				select_option(select3, /*salesType*/ ctx[18]);
    			}

    			if (/*salesType*/ ctx[18] == PersonnelType.Partner || /*salesType*/ ctx[18] == PersonnelType.Contractor) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);
    				} else {
    					if_block4 = create_if_block_9(ctx);
    					if_block4.c();
    					if_block4.m(table0, t46);
    				}
    			} else if (if_block4) {
    				if_block4.d(1);
    				if_block4 = null;
    			}

    			if (/*contractModel*/ ctx[0] == "hybrid" || /*contractModel*/ ctx[0] == "product") {
    				if (if_block5) {
    					if_block5.p(ctx, dirty);
    				} else {
    					if_block5 = create_if_block_8(ctx);
    					if_block5.c();
    					if_block5.m(table0, t47);
    				}
    			} else if (if_block5) {
    				if_block5.d(1);
    				if_block5 = null;
    			}

    			if (/*contractModel*/ ctx[0] == "hybrid" || /*contractModel*/ ctx[0] == "service") {
    				if (if_block6) {
    					if_block6.p(ctx, dirty);
    				} else {
    					if_block6 = create_if_block_7(ctx);
    					if_block6.c();
    					if_block6.m(table0, t48);
    				}
    			} else if (if_block6) {
    				if_block6.d(1);
    				if_block6 = null;
    			}

    			if (/*sourcerType*/ ctx[19] == PersonnelType.Employee) {
    				if (if_block7) {
    					if_block7.p(ctx, dirty);
    				} else {
    					if_block7 = create_if_block_6(ctx);
    					if_block7.c();
    					if_block7.m(table0, t49);
    				}
    			} else if (if_block7) {
    				if_block7.d(1);
    				if_block7 = null;
    			}

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block8.d(1);
    				if_block8 = current_block_type(ctx);

    				if (if_block8) {
    					if_block8.c();
    					if_block8.m(span0, null);
    				}
    			}

    			if (dirty[1] & /*realSalesCommissionRate*/ 4 && t51_value !== (t51_value = /*realSalesCommissionRate*/ ctx[33]() * 100 + "")) set_data_dev(t51, t51_value);

    			if (current_block_type_1 !== (current_block_type_1 = select_block_type_1(ctx))) {
    				if_block9.d(1);
    				if_block9 = current_block_type_1(ctx);

    				if (if_block9) {
    					if_block9.c();
    					if_block9.m(span1, null);
    				}
    			}

    			if (dirty[0] & /*salesSQC*/ 256 && t55_value !== (t55_value = /*salesSQC*/ ctx[8]().toFixed(2) + "")) set_data_dev(t55, t55_value);

    			if (/*sourcerType*/ ctx[19] == PersonnelType.Employee && /*contractType*/ ctx[17] == ContractType.New) {
    				if (if_block10) {
    					if_block10.p(ctx, dirty);
    				} else {
    					if_block10 = create_if_block_3(ctx);
    					if_block10.c();
    					if_block10.m(table0, t57);
    				}
    			} else if (if_block10) {
    				if_block10.d(1);
    				if_block10 = null;
    			}

    			if (/*contractModel*/ ctx[0] == "hybrid" || /*contractModel*/ ctx[0] == "service") {
    				if (if_block11) {
    					if_block11.p(ctx, dirty);
    				} else {
    					if_block11 = create_if_block_2(ctx);
    					if_block11.c();
    					if_block11.m(table0, t58);
    				}
    			} else if (if_block11) {
    				if_block11.d(1);
    				if_block11 = null;
    			}

    			if (dirty[0] & /*compensation*/ 8 && to_number(input3.value) !== /*compensation*/ ctx[3]) {
    				set_input_value(input3, /*compensation*/ ctx[3]);
    			}

    			if (/*salesType*/ ctx[18] == "partner" || /*salesType*/ ctx[18] == "contractor") {
    				if (if_block12) {
    					if_block12.p(ctx, dirty);
    				} else {
    					if_block12 = create_if_block_1(ctx);
    					if_block12.c();
    					if_block12.m(table0, t64);
    				}
    			} else if (if_block12) {
    				if_block12.d(1);
    				if_block12 = null;
    			}

    			if (dirty[0] & /*bonusPool*/ 512 && t68_value !== (t68_value = /*bonusPool*/ ctx[9]() + "")) set_data_dev(t68, t68_value);
    			if (dirty[0] & /*shareInPayment*/ 1024 && t73_value !== (t73_value = /*shareInPayment*/ ctx[10].toFixed(2) + "")) set_data_dev(t73, t73_value);
    			if (dirty[0] & /*shareInPaymentRatio*/ 134217728 && t75_value !== (t75_value = (/*shareInPaymentRatio*/ ctx[27] * 100).toFixed(2) + "")) set_data_dev(t75, t75_value);
    			if (dirty[0] & /*netIncomeByPayment*/ 4096 && t81_value !== (t81_value = /*netIncomeByPayment*/ ctx[12].toFixed(2) + "")) set_data_dev(t81, t81_value);
    			if (dirty[0] & /*netIncomeRatioByPayment*/ 4 && t83_value !== (t83_value = (/*netIncomeRatioByPayment*/ ctx[2] * 100).toFixed(2) + "")) set_data_dev(t83, t83_value);

    			if (dirty & /*Object, commissionRate*/ 0) {
    				each_value = Object.entries(commissionRate);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(table1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty[0] & /*shareInPayment*/ 1024) set_data_dev(t91, /*shareInPayment*/ ctx[10]);
    			if (dirty[0] & /*bonusPool*/ 512 && t93_value !== (t93_value = /*bonusPool*/ ctx[9]() + "")) set_data_dev(t93, t93_value);
    			if (dirty[0] & /*salesSQC*/ 256 && t95_value !== (t95_value = /*salesSQC*/ ctx[8]() + "")) set_data_dev(t95, t95_value);
    			if (dirty[0] & /*sourcerSQC*/ 128 && t97_value !== (t97_value = /*sourcerSQC*/ ctx[7]() + "")) set_data_dev(t97, t97_value);
    			if (dirty[0] & /*serviceSQC*/ 64 && t99_value !== (t99_value = /*serviceSQC*/ ctx[6]() + "")) set_data_dev(t99, t99_value);
    			if (dirty[0] & /*payDeliveryServiceSQC*/ 32 && t101_value !== (t101_value = /*payDeliveryServiceSQC*/ ctx[5]() + "")) set_data_dev(t101, t101_value);
    			if (dirty[0] & /*partnerSalesSQC*/ 16 && t103_value !== (t103_value = /*partnerSalesSQC*/ ctx[4]() + "")) set_data_dev(t103, t103_value);
    			if (dirty[0] & /*compensation*/ 8) set_data_dev(t105, /*compensation*/ ctx[3]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks_4, detaching);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			destroy_each(each_blocks_3, detaching);
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			if (if_block4) if_block4.d();
    			if (if_block5) if_block5.d();
    			if (if_block6) if_block6.d();
    			if (if_block7) if_block7.d();
    			if_block8.d();
    			if_block9.d();
    			if (if_block10) if_block10.d();
    			if (if_block11) if_block11.d();
    			if (if_block12) if_block12.d();
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let tcv;
    	let personnelTypes;
    	let contractTypes;
    	let contractType;
    	let sourcerType;
    	let salesCost;
    	let salesType;
    	let contractPeriod;
    	let contractServiceValue;
    	let contractProductValue;
    	let tcvOfProductRatio;
    	let tcvOfServiceRatio;
    	let payment;
    	let paymentMargin;
    	let paymentOfProduct;
    	let paymentOfService;
    	let paymentRatio;
    	let arr;
    	let mrr;
    	let sqrOfProduct;
    	let sqrOfService;
    	let getCommissionRate$1;
    	let sourcerCommissionRate;
    	let sourcerSQC;
    	let realSalesCommissionRate;
    	let salesSQC;
    	let getSQCResult$1;
    	let bonusPool;
    	let serviceCommissionRate;
    	let serviceSQC;
    	let payDeliveryServiceSQC;
    	let partnerSalesSQC;
    	let partnerSalesSQC_SQR_Ratio;
    	let partnerSalesCommissionRate;
    	let partnerIncome;
    	let partnersLevel;
    	let partnerLevel;
    	let compensation;
    	let netIncomeByPayment;
    	let netIncomeRatioByPayment;
    	let shareInPayment;
    	let shareInPaymentRatio;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	let { contractModels = [
    		{ id: "product", text: `纯产品 Product-only` },
    		{ id: "service", text: `纯服务 Service-only` },
    		{ id: "hybrid", text: `产品加服务 Hybrid` }
    	] } = $$props;

    	let { contractModel = "product" } = $$props;
    	const writable_props = ['contractModels', 'contractModel'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		tcv = to_number(this.value);
    		$$invalidate(21, tcv);
    	}

    	function select0_change_handler() {
    		contractModel = select_value(this);
    		$$invalidate(0, contractModel);
    		$$invalidate(1, contractModels);
    	}

    	function input_input_handler() {
    		contractServiceValue = to_number(this.value);
    		(($$invalidate(26, contractServiceValue), $$invalidate(0, contractModel)), $$invalidate(21, tcv));
    	}

    	function input_input_handler_1() {
    		contractPeriod = to_number(this.value);
    		$$invalidate(20, contractPeriod);
    	}

    	function select1_change_handler() {
    		contractType = select_value(this);
    		$$invalidate(17, contractType);
    		$$invalidate(38, contractTypes);
    	}

    	function input1_input_handler() {
    		payment = to_number(this.value);
    		$$invalidate(11, payment);
    	}

    	function input2_input_handler() {
    		salesCost = to_number(this.value);
    		$$invalidate(13, salesCost);
    	}

    	function select2_change_handler() {
    		sourcerType = select_value(this);
    		$$invalidate(19, sourcerType);
    		$$invalidate(39, personnelTypes);
    	}

    	function select3_change_handler() {
    		salesType = select_value(this);
    		$$invalidate(18, salesType);
    		$$invalidate(39, personnelTypes);
    	}

    	function select_change_handler() {
    		partnerLevel = select_value(this);
    		$$invalidate(14, partnerLevel);
    		$$invalidate(28, partnersLevel);
    	}

    	function input3_input_handler() {
    		compensation = to_number(this.value);
    		$$invalidate(3, compensation);
    	}

    	$$self.$$set = $$props => {
    		if ('contractModels' in $$props) $$invalidate(1, contractModels = $$props.contractModels);
    		if ('contractModel' in $$props) $$invalidate(0, contractModel = $$props.contractModel);
    	};

    	$$self.$capture_state = () => ({
    		ContractType,
    		getARR,
    		getMRR,
    		getSQR,
    		PersonnelRole,
    		PersonnelType,
    		lib,
    		commissionRate,
    		contractModels,
    		contractModel,
    		netIncomeRatioByPayment,
    		shareInPaymentRatio,
    		compensation,
    		partnerSalesSQC,
    		payDeliveryServiceSQC,
    		serviceSQC,
    		sourcerSQC,
    		salesSQC,
    		bonusPool,
    		shareInPayment,
    		payment,
    		netIncomeByPayment,
    		salesCost,
    		partnerLevel,
    		partnersLevel,
    		getSQCResult: getSQCResult$1,
    		partnerIncome,
    		getCommissionRate: getCommissionRate$1,
    		partnerSalesCommissionRate,
    		sqrOfProduct,
    		partnerSalesSQC_SQR_Ratio,
    		sqrOfService,
    		contractType,
    		salesType,
    		serviceCommissionRate,
    		sourcerType,
    		contractPeriod,
    		tcv,
    		realSalesCommissionRate,
    		sourcerCommissionRate,
    		paymentOfService,
    		paymentOfProduct,
    		contractProductValue,
    		mrr,
    		arr,
    		paymentRatio,
    		tcvOfServiceRatio,
    		paymentMargin,
    		tcvOfProductRatio,
    		contractServiceValue,
    		contractTypes,
    		personnelTypes
    	});

    	$$self.$inject_state = $$props => {
    		if ('contractModels' in $$props) $$invalidate(1, contractModels = $$props.contractModels);
    		if ('contractModel' in $$props) $$invalidate(0, contractModel = $$props.contractModel);
    		if ('netIncomeRatioByPayment' in $$props) $$invalidate(2, netIncomeRatioByPayment = $$props.netIncomeRatioByPayment);
    		if ('shareInPaymentRatio' in $$props) $$invalidate(27, shareInPaymentRatio = $$props.shareInPaymentRatio);
    		if ('compensation' in $$props) $$invalidate(3, compensation = $$props.compensation);
    		if ('partnerSalesSQC' in $$props) $$invalidate(4, partnerSalesSQC = $$props.partnerSalesSQC);
    		if ('payDeliveryServiceSQC' in $$props) $$invalidate(5, payDeliveryServiceSQC = $$props.payDeliveryServiceSQC);
    		if ('serviceSQC' in $$props) $$invalidate(6, serviceSQC = $$props.serviceSQC);
    		if ('sourcerSQC' in $$props) $$invalidate(7, sourcerSQC = $$props.sourcerSQC);
    		if ('salesSQC' in $$props) $$invalidate(8, salesSQC = $$props.salesSQC);
    		if ('bonusPool' in $$props) $$invalidate(9, bonusPool = $$props.bonusPool);
    		if ('shareInPayment' in $$props) $$invalidate(10, shareInPayment = $$props.shareInPayment);
    		if ('payment' in $$props) $$invalidate(11, payment = $$props.payment);
    		if ('netIncomeByPayment' in $$props) $$invalidate(12, netIncomeByPayment = $$props.netIncomeByPayment);
    		if ('salesCost' in $$props) $$invalidate(13, salesCost = $$props.salesCost);
    		if ('partnerLevel' in $$props) $$invalidate(14, partnerLevel = $$props.partnerLevel);
    		if ('partnersLevel' in $$props) $$invalidate(28, partnersLevel = $$props.partnersLevel);
    		if ('getSQCResult' in $$props) $$invalidate(40, getSQCResult$1 = $$props.getSQCResult);
    		if ('partnerIncome' in $$props) $$invalidate(29, partnerIncome = $$props.partnerIncome);
    		if ('getCommissionRate' in $$props) $$invalidate(41, getCommissionRate$1 = $$props.getCommissionRate);
    		if ('partnerSalesCommissionRate' in $$props) $$invalidate(30, partnerSalesCommissionRate = $$props.partnerSalesCommissionRate);
    		if ('sqrOfProduct' in $$props) $$invalidate(15, sqrOfProduct = $$props.sqrOfProduct);
    		if ('partnerSalesSQC_SQR_Ratio' in $$props) $$invalidate(31, partnerSalesSQC_SQR_Ratio = $$props.partnerSalesSQC_SQR_Ratio);
    		if ('sqrOfService' in $$props) $$invalidate(16, sqrOfService = $$props.sqrOfService);
    		if ('contractType' in $$props) $$invalidate(17, contractType = $$props.contractType);
    		if ('salesType' in $$props) $$invalidate(18, salesType = $$props.salesType);
    		if ('serviceCommissionRate' in $$props) $$invalidate(32, serviceCommissionRate = $$props.serviceCommissionRate);
    		if ('sourcerType' in $$props) $$invalidate(19, sourcerType = $$props.sourcerType);
    		if ('contractPeriod' in $$props) $$invalidate(20, contractPeriod = $$props.contractPeriod);
    		if ('tcv' in $$props) $$invalidate(21, tcv = $$props.tcv);
    		if ('realSalesCommissionRate' in $$props) $$invalidate(33, realSalesCommissionRate = $$props.realSalesCommissionRate);
    		if ('sourcerCommissionRate' in $$props) $$invalidate(34, sourcerCommissionRate = $$props.sourcerCommissionRate);
    		if ('paymentOfService' in $$props) $$invalidate(22, paymentOfService = $$props.paymentOfService);
    		if ('paymentOfProduct' in $$props) $$invalidate(23, paymentOfProduct = $$props.paymentOfProduct);
    		if ('contractProductValue' in $$props) $$invalidate(24, contractProductValue = $$props.contractProductValue);
    		if ('mrr' in $$props) $$invalidate(35, mrr = $$props.mrr);
    		if ('arr' in $$props) $$invalidate(36, arr = $$props.arr);
    		if ('paymentRatio' in $$props) $$invalidate(37, paymentRatio = $$props.paymentRatio);
    		if ('tcvOfServiceRatio' in $$props) $$invalidate(42, tcvOfServiceRatio = $$props.tcvOfServiceRatio);
    		if ('paymentMargin' in $$props) $$invalidate(25, paymentMargin = $$props.paymentMargin);
    		if ('tcvOfProductRatio' in $$props) $$invalidate(43, tcvOfProductRatio = $$props.tcvOfProductRatio);
    		if ('contractServiceValue' in $$props) $$invalidate(26, contractServiceValue = $$props.contractServiceValue);
    		if ('contractTypes' in $$props) $$invalidate(38, contractTypes = $$props.contractTypes);
    		if ('personnelTypes' in $$props) $$invalidate(39, personnelTypes = $$props.personnelTypes);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*contractModel, tcv*/ 2097153) {
    			/**
     * Contract Service Value
     * 合同中的服务部分价值（排除产品价值）
     */
    			$$invalidate(26, contractServiceValue = contractModel == "service" ? tcv : 0);
    		}

    		if ($$self.$$.dirty[0] & /*contractModel, tcv, contractServiceValue*/ 69206017) {
    			/**
     * 合同中的产品部分价值
     */
    			$$invalidate(24, contractProductValue = () => {
    				if (contractModel == "product") {
    					return tcv;
    				} else if (contractModel == "service") {
    					return 0;
    				} else if (contractModel == "hybrid") {
    					return tcv - contractServiceValue;
    				} else {
    					return 0;
    				}
    			});
    		}

    		if ($$self.$$.dirty[0] & /*contractProductValue, tcv*/ 18874368) {
    			/**
     * 合同中的产品部分价值占比
     */
    			$$invalidate(43, tcvOfProductRatio = () => {
    				return contractProductValue() / tcv;
    			});
    		}

    		if ($$self.$$.dirty[0] & /*contractServiceValue, tcv*/ 69206016) {
    			/**
     * 合同中的服务部分价值占比
     */
    			$$invalidate(42, tcvOfServiceRatio = () => {
    				return contractServiceValue / tcv;
    			});
    		}

    		if ($$self.$$.dirty[0] & /*payment, salesCost*/ 10240) {
    			/**
     * Payment Margin
     * 回款毛利
     */
    			$$invalidate(25, paymentMargin = payment - salesCost);
    		}

    		if ($$self.$$.dirty[0] & /*paymentMargin*/ 33554432 | $$self.$$.dirty[1] & /*tcvOfProductRatio*/ 4096) {
    			/**
     * 回款所属产品部分
     */
    			$$invalidate(23, paymentOfProduct = () => {
    				return paymentMargin * tcvOfProductRatio();
    			});
    		}

    		if ($$self.$$.dirty[0] & /*paymentMargin*/ 33554432 | $$self.$$.dirty[1] & /*tcvOfServiceRatio*/ 2048) {
    			/**
     * 回款所属的服务部分
     */
    			$$invalidate(22, paymentOfService = () => {
    				return paymentMargin * tcvOfServiceRatio();
    			});
    		}

    		if ($$self.$$.dirty[0] & /*payment, tcv*/ 2099200) {
    			/**
     * Payment Ratio
     * 回款比例 (回款比例 = 回款 / 合同总价值)
     */
    			$$invalidate(37, paymentRatio = payment / tcv);
    		}

    		if ($$self.$$.dirty[0] & /*contractProductValue, contractPeriod*/ 17825792) {
    			/**
     * ARR
     */
    			$$invalidate(36, arr = getARR(contractProductValue(), contractPeriod));
    		}

    		if ($$self.$$.dirty[0] & /*contractProductValue, contractPeriod*/ 17825792) {
    			/**
     * MRR
     */
    			$$invalidate(35, mrr = getMRR(contractProductValue(), contractPeriod));
    		}

    		if ($$self.$$.dirty[0] & /*paymentOfProduct, contractPeriod*/ 9437184) {
    			/**
     * 产品SQR 销售确认收入
     */
    			$$invalidate(15, sqrOfProduct = getSQR(paymentOfProduct(), contractPeriod));
    		}

    		if ($$self.$$.dirty[0] & /*paymentOfService*/ 4194304) {
    			// paymentOfProduct() / contractPeriodYearly +
    			// ((paymentOfProduct() * (contractPeriodYearly - 1)) / contractPeriodYearly) *
    			//   0.5;
    			/**
     * 服务SQR 销售确认收入
     */
    			$$invalidate(16, sqrOfService = paymentOfService());
    		}

    		if ($$self.$$.dirty[0] & /*sourcerType, contractType*/ 655360 | $$self.$$.dirty[1] & /*getCommissionRate*/ 1024) {
    			/**
     * Sourcer的提成率
     */
    			$$invalidate(34, sourcerCommissionRate = () => {
    				// sourcer必须是雇员
    				return getCommissionRate$1(sourcerType, "sourcer", contractType);
    			});
    		}

    		if ($$self.$$.dirty[0] & /*tcv, contractPeriod, contractType, sourcerType, partnerLevel, salesType, payment, salesCost, compensation*/ 4089864) {
    			//   return sqrOfProduct * realSalesCommissionRate();
    			// }
    			/**
     * 构造一个模拟的Payment对象，用于计算SQC
     */
    			$$invalidate(40, getSQCResult$1 = () => {
    				const simPayment = {
    					contract: {
    						tcv,
    						period: contractPeriod,
    						type: contractType,
    						customer: {},
    						lead: {
    							sourcer: {
    								name: 'sim-sourcer',
    								type: sourcerType,
    								role: partnerLevel
    							},
    							sales: {
    								name: 'sim-sales',
    								type: salesType,
    								role: partnerLevel
    							},
    							servant: {
    								name: 'sim-servant',
    								type: PersonnelType.Employee,
    								role: partnerLevel
    							}
    						}
    					},
    					amount: payment,
    					salesCost
    				};

    				const res = getSQCResult(simPayment, compensation);
    				return res;
    			});
    		}

    		if ($$self.$$.dirty[1] & /*getSQCResult*/ 512) {
    			/**
     * Sourcer的SQC，计提阿米巴
     */
    			$$invalidate(7, sourcerSQC = () => {
    				const res = getSQCResult$1();
    				return res.sourcerSQC;
    			}); // // 我们开发的线索，给到Partners，我们的怎么分？
    			// if (salesType == "employee") {
    			//   return sqrOfProduct * sourcerCommissionRate();
    			// } else {
    			//   // 如果是渠道合作伙伴，减掉他们的分成后，剩下的才是我们的
    		}

    		if ($$self.$$.dirty[0] & /*salesType, contractType, partnerLevel*/ 409600) {
    			//   return (sqrOfProduct - salesSQC()) * sourcerCommissionRate();
    			// }
    			/**
     * 销售提成率，根据不同的销售职员类型、岗位类型，提成率不同
     */
    			$$invalidate(33, realSalesCommissionRate = () => {
    				return getSalesCommissionRate(salesType, contractType, partnerLevel);
    			});
    		}

    		if ($$self.$$.dirty[1] & /*getSQCResult*/ 512) {
    			/**
     * Sales的SQC，计提阿米巴
     */
    			$$invalidate(8, salesSQC = () => {
    				const res = getSQCResult$1();
    				return res.salesSQC;
    			}); // if (salesType == "partner") {
    			//   return paymentMargin * realSalesCommissionRate(); // partner按回款、contractor按SQR
    			// } else if (salesType == "employee") {
    			//   return sqrOfProduct * realSalesCommissionRate();
    			// } else {
    		}

    		if ($$self.$$.dirty[1] & /*getSQCResult*/ 512) {
    			/**
     * 计入公司奖金池金额
     */
    			$$invalidate(9, bonusPool = () => {
    				const res = getSQCResult$1();
    				return res.bonusPool;
    			}); // return sqrOfProduct * getCommissionRate("employee", "bonus");
    		}

    		if ($$self.$$.dirty[0] & /*salesType, contractType*/ 393216 | $$self.$$.dirty[1] & /*getCommissionRate*/ 1024) {
    			/**
     * 服务人员的提成率
     */
    			$$invalidate(32, serviceCommissionRate = () => {
    				if (salesType == "employee") return getCommissionRate$1("employee", "service", contractType);
    				return 0;
    			});
    		}

    		if ($$self.$$.dirty[1] & /*getSQCResult*/ 512) {
    			/**
     * 交付、服务人员SQC ,即SE/CSM/KU
     */
    			$$invalidate(6, serviceSQC = () => {
    				const res = getSQCResult$1();
    				return res.serviceSQC;
    			});
    		}

    		if ($$self.$$.dirty[0] & /*sqrOfService*/ 65536 | $$self.$$.dirty[1] & /*getCommissionRate*/ 1024) {
    			/**
     * 付费的交付服务的SQC
     */
    			$$invalidate(5, payDeliveryServiceSQC = () => {
    				// const res = getSQCResult();
    				// return res.payDeliveryServiceSQC;
    				return sqrOfService * getCommissionRate$1("employee", "payservice");
    			});
    		}

    		if ($$self.$$.dirty[1] & /*getSQCResult*/ 512) {
    			/**
     * 渠道经理SQC、分成，扣掉合作伙伴分成后的数
     */
    			$$invalidate(4, partnerSalesSQC = () => {
    				const res = getSQCResult$1();
    				return res.partnerSalesSQC;
    			}); // if (salesType != "employee") {
    			//   return (sqrOfProduct - salesSQC()) * partnerSalesCommissionRate();
    			// }
    			// return 0;
    		}

    		if ($$self.$$.dirty[0] & /*partnerSalesSQC, sqrOfProduct*/ 32784) {
    			/**
     * 由于渠道经理的SQC，是扣掉合作伙伴分成后的数，所以这里计算一个比例，显示真实的SQR的总提成率
     */
    			$$invalidate(31, partnerSalesSQC_SQR_Ratio = () => {
    				return partnerSalesSQC() / sqrOfProduct;
    			});
    		}

    		if ($$self.$$.dirty[1] & /*getCommissionRate*/ 1024) {
    			/**
     * 渠道经理提成率
     */
    			$$invalidate(30, partnerSalesCommissionRate = () => {
    				return getCommissionRate$1("employee", "partnersales");
    			});
    		}

    		if ($$self.$$.dirty[1] & /*getSQCResult*/ 512) {
    			/**
     * 合作伙伴收入
     */
    			$$invalidate(29, partnerIncome = () => {
    				const res = getSQCResult$1();
    				return res.partnerIncome;
    			}); // if (salesType != "employee") {
    			//   return salesSQC() - compensation;
    			// }
    			// return 0;
    		}

    		if ($$self.$$.dirty[0] & /*bonusPool, salesSQC, sourcerSQC, serviceSQC, payDeliveryServiceSQC, partnerSalesSQC, compensation*/ 1016) {
    			/**
     * 本次回款的公司分利， 即分了多少出去
     */
    			$$invalidate(10, shareInPayment = bonusPool() + salesSQC() + sourcerSQC() + serviceSQC() + payDeliveryServiceSQC() + partnerSalesSQC() - compensation);
    		}

    		if ($$self.$$.dirty[0] & /*payment, salesCost, shareInPayment*/ 11264) {
    			/**
     * 公司这次回款的真实净利
     */
    			$$invalidate(12, netIncomeByPayment = payment - salesCost - shareInPayment);
    		}

    		if ($$self.$$.dirty[0] & /*netIncomeByPayment, payment*/ 6144) {
    			/**
     * 公司这次回款的真实净利率
     */
    			$$invalidate(2, netIncomeRatioByPayment = netIncomeByPayment / payment);
    		}

    		if ($$self.$$.dirty[0] & /*netIncomeRatioByPayment*/ 4) {
    			/**
     * 分利占回款比例
     */
    			$$invalidate(27, shareInPaymentRatio = 1 - netIncomeRatioByPayment);
    		}
    	};

    	$$invalidate(21, tcv = 10000);

    	/**
     * personnel type
     * 职员类型
     */
    	$$invalidate(39, personnelTypes = [
    		{
    			id: PersonnelType.Employee,
    			text: `全职雇员 Employee`
    		},
    		{
    			id: PersonnelType.Contractor,
    			text: `合约雇员 Contractor`
    		},
    		{
    			id: PersonnelType.Partner,
    			text: `渠道合作伙伴 Partner`
    		}
    	]);

    	/**
     * 合同类型
    */
    	$$invalidate(38, contractTypes = [
    		{ id: ContractType.New, text: `New 新购合同` },
    		{
    			id: ContractType.Renewal,
    			text: `Renewal 续费合同`
    		}
    	]);

    	$$invalidate(17, contractType = ContractType.New);

    	/**
     * the sourcing people personnel type
     * Sourcer职员类型
     */
    	$$invalidate(19, sourcerType = PersonnelType.Employee);

    	/**
     * 第三方销售成本
     * 服务、采购、硬件等
     * 不包括特殊费用
     */
    	$$invalidate(13, salesCost = 0);

    	/**
     * sales personnel type
     * 销售Sales的职员类型
     */
    	$$invalidate(18, salesType = PersonnelType.Partner);

    	/**
     * Sales Employee Job Type
     * 雇员型销售的类型，大客户、直销、客户成功
     */
    	// export let employeeSalesType = PersonnelRole.SME;
    	/**
     * 销售雇员岗位类型
     */
    	// export let employeeSalesTypes = [
    	//   { id: PersonnelRole.SME, text: "直销 SME" },
    	//   { id: PersonnelRole.ENT, text: "大客户 ENT" },
    	//   { id: PersonnelRole.CSM, text: "客户成功 CSM" },
    	// ];
    	/**
     * Contract Period
     * 合同周期，单位月
     */
    	$$invalidate(20, contractPeriod = 12);

    	/**
     * how many payment get back?
     * 回款
     */
    	$$invalidate(11, payment = 8000);

    	/**
     * 根据职员、岗位、额外属性，提取提成率对象
     */
    	$$invalidate(41, getCommissionRate$1 = (personnelType, role, extra = undefined) => {
    		return getCommissionRate(personnelType, role, extra);
    	});

    	/**
     * 合作伙伴、合约雇员级别
     */
    	$$invalidate(14, partnerLevel = PersonnelRole.B); //

    	/**
     * 补偿compensation
     * 渠道或合约人员，回馈补偿、填充对价
     */
    	$$invalidate(3, compensation = 0);

    	/**
     * 合作伙伴、合约雇员级别选择
     */
    	$$invalidate(28, partnersLevel = [
    		{ id: PersonnelRole.B, text: `铜牌级(B)` },
    		{ id: PersonnelRole.A, text: `银牌级(A)` },
    		{ id: PersonnelRole.S, text: `金牌级(S)` }
    	]);

    	return [
    		contractModel,
    		contractModels,
    		netIncomeRatioByPayment,
    		compensation,
    		partnerSalesSQC,
    		payDeliveryServiceSQC,
    		serviceSQC,
    		sourcerSQC,
    		salesSQC,
    		bonusPool,
    		shareInPayment,
    		payment,
    		netIncomeByPayment,
    		salesCost,
    		partnerLevel,
    		sqrOfProduct,
    		sqrOfService,
    		contractType,
    		salesType,
    		sourcerType,
    		contractPeriod,
    		tcv,
    		paymentOfService,
    		paymentOfProduct,
    		contractProductValue,
    		paymentMargin,
    		contractServiceValue,
    		shareInPaymentRatio,
    		partnersLevel,
    		partnerIncome,
    		partnerSalesCommissionRate,
    		partnerSalesSQC_SQR_Ratio,
    		serviceCommissionRate,
    		realSalesCommissionRate,
    		sourcerCommissionRate,
    		mrr,
    		arr,
    		paymentRatio,
    		contractTypes,
    		personnelTypes,
    		getSQCResult$1,
    		getCommissionRate$1,
    		tcvOfServiceRatio,
    		tcvOfProductRatio,
    		input0_input_handler,
    		select0_change_handler,
    		input_input_handler,
    		input_input_handler_1,
    		select1_change_handler,
    		input1_input_handler,
    		input2_input_handler,
    		select2_change_handler,
    		select3_change_handler,
    		select_change_handler,
    		input3_input_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { contractModels: 1, contractModel: 0 }, null, [-1, -1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get contractModels() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set contractModels(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get contractModel() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set contractModel(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
        target: document.body,
        props: {
            name: 'world'
        }
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
