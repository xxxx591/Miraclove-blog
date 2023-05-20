/**
 * 卡片控件
 */
$.component("JCard", {
    /**
     * ajax绑定数据
     * @param card
     * @param callback 数据绑定回调函数
     */
    ajax: cqjs.emptyFn,
    /**
     * 初始化控件
     */
    init: function () {
        let me = this, dom = me.dom;
        me._fields = [];
        me.sel = [];
        if (me.arch) {
            let arch = cqjs.utils.parseXML(me.arch), card = arch.children('card');
            if (card.length > 0) {
                me.tbarArch = card.children('toolbar').prop('outerHTML');
                me.limit = eval(card.attr('limit') || 16);
                me.pager.limit = me.limit;
                me.dblclick = card.attr('t-dblclick');
                card.children('field').each(function () {
                    let el = $(this),
                        name = el.attr('name'),
                        field = me.fields[name];
                    if (!field) {
                        throw new Error('模型' + me.model + '找不到字段' + name);
                    }
                    if (!field.deny) {
                        me._fields.push(name);
                    }
                });
                let tpl = card.children('template').html();
                me.tpl = juicer(tpl);
            }
        }
        dom.addClass('row mt-3 card-view');
        me.load();
        me.onSelected(me.selected);
    },
    /**
     * 注册选中事件
     * @param handler 处理函数
     */
    onSelected: function (handler) {
        this.dom.on('selected', handler);
    },
    /**
     * 加载
     */
    load: function () {
        let me = this, dom = me.dom;
        dom.html(`<div class="col-12" style="text-align:center;">${'数据加载中'.t()}</div>`);
        me.ajax(me, function (e) {
            if (e.data.length > 0) {
                dom.empty();
                $.each(e.data, function (i, d) {
                    for (let k in this) {
                        let field = me.fields[k];
                        if (field.type === 'selection') {
                            let v = this[k];
                            this[k] = [v, field.options[v]];
                        }
                    }
                    let html = me.tpl.render(this);
                    dom.append(`<div class="col-3" style="min-width: 18rem;"><div class="card" data="${this['id']}">${html}</div></div>`);
                });
            } else {
                dom.html(`<div class="col-12" style="text-align:center;">${'没有数据'.t()}</div>`);
            }
            dom.find('.card').on('click', function () {
                let card = $(this);
                dom.find('.card').removeClass('selected');
                card.addClass('selected');
                me.sel = [card.attr('data')];
                dom.triggerHandler('selected', [me, me.sel]);
            })
            if (me.dblclick !== "0" && (typeof me.dblClick === 'function' || me.dblclick)) {
                dom.find('.card').on('dblclick', function (e) {
                    let card = $(this);
                    let id = card.attr('data');
                    if (me.dblclick) {
                        let fn = new Function("e", "card", "id", "return this." + me.dblclick).call(me.view, e, me, id);
                        if (fn instanceof Function) {
                            fn.call(me.view, e, me, id);
                        }
                    } else {
                        me.dblClick(e, me, id);
                    }
                });
            }
            me.dom.find("[t-click]").on("click", function (e) {
                let ele = $(this), card = ele.parents(".card"), click = ele.attr("t-click");
                let fn = new Function("e", "id", "target", "view", "return this." + click).call(me.view, e, card.attr("data"), me, me.view);
                if (fn instanceof Function) {
                    fn.call(me.view, e, card.attr("data"), me, me.view);
                }
            });
            dom.triggerHandler('loaded', [me, e.data]);
            me.sel = [];
            dom.triggerHandler('selected', [me, me.sel]);
        });
    },
    /**
     * 获取选中数据
     * @returns {[]|[*]|*}
     */
    getSelected: function () {
        return this.sel;
    },
    /**
     * 获取控件字段
     * @returns {[]}
     */
    getFields: function () {
        return this._fields;
    },
    /**
     * 获取排序
     * @returns {string}
     */
    getSort: function () {
        return "";
    }
});