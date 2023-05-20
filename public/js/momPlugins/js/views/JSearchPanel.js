/**
 * 查询左侧面板
 */
$.component("JSearchPanel", {
    /**
     * 显示最大限制
     */
    limit: 1000,
    /**
     * 显示字段名称
     */
    presentField: 'present',
    /**
     * 父字段名称
     */
    parentField: 'parent_id',
    /**
     * id字段名称
     */
    idField: 'id',
    /**
     * 设置
     * @param setting
     */
    config: function (setting) {
    },
    /**
     * 获取模板
     * @returns {`<div class="search-panel">
                    <label class="ml-2 mt-2 mb-0">${*}</label>
                    <div id="search_panel_${*}" class="ztree"></div>
                </div>`}
     */
    getTpl: function () {
        return `<div class="search-panel">
                    <label class="ml-2 mt-2 mb-0">${this.label}</label>
                    <div id="search_panel_${cqjs.nextId()}" class="ztree"></div>
                </div>`
    },
    /**
     * 初始化控件
     */
    init: function () {
        let me = this;
        me.sel = [];
        me._fields = [];
        me._fields.push(me.presentField);
        if (me.arch) {
            let arch = cqjs.utils.parseXML(me.arch).children('aside'),
                el = arch.find('field:first-child'),
                name = el.attr('name'),
                field = me.fields[name];
            if (field.type !== 'many2one') {
                throw new Error('aside not support：' + field.type);
            }
            me.label = el.attr('label') || field.label;
            me.field = field;
            me.isTree = Boolean(eval(arch.attr("tree")));
            me.select = eval(el.attr('select')) || [];
            if (me.isTree) {
                me._fields.push(me.parentField);
            }
            me.dom.html(me.getTpl());
            me.ztreeSetting = {
                view: {
                    showIcon: false,
                    selectedMulti: false
                },
                data: {
                    simpleData: {
                        enable: true,
                        pIdKey: "parent_id"
                    },
                    key: {
                        name: "present"
                    },
                },
                callback: {
                    onClick: function (e, id, node) {
                        me.sel = me.ztree.getSelectedNodes();
                        me.dom.triggerHandler("selected", [me, me.sel]);
                    }
                }
            };
            me.ztreeSetting.view.showLine = me.isTree;
            me.config(me.ztreeSetting);
        }
        me.onSelected(me.selected);
    },
    /**
     * 加载数据
     */
    load: function () {
        let me = this;
        me.ajax(me, function (data) {
            me.ztree = $.fn.zTree.init(me.dom.find('.ztree'), me.ztreeSetting, data);
            me.ztree.expandAll(true);
        });
    },
    /**
     * 注册选中事件
     * @param handler 处理函数
     */
    onSelected: function (handler) {
        this.dom.on("selected", handler);
    },
    /**
     * 获取选中[ids]
     * @returns {*|*[]}
     */
    getSelect: function () {
        return this.select;
    },
    /**
     * 获取查询条件
     * @returns [[field,op,value]]
     */
    getCriteria: function () {
        let me = this;
        let sel = me.sel[0];
        if (sel && sel.id != 'all') {
            //TODO 处理树形数据递归
            return [[me.field.name, '=', sel.id]];
        }
        return [];
    },
    /**
     * 获取控件字段
     * @returns {[]}
     */
    getFields: function () {
        return this._fields;
    },
});