/**
 * 树型控件，基于zTree，参见https://treejs.cn/v3/api.php
 */
$.component("JTree", {
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
     * 排序字段名称
     */
    sortField: null,
    /**
     * 设置
     * @param setting
     */
    config: function (setting) {
    },
    /**
     * ajax绑字数据
     * @param tree
     * @param callback 数据绑定回调函数
     */
    ajax: function (tree, callback) {
    },
    /**
     * 初始化控件
     */
    init: function () {
        let me = this;
        me.ztreeSetting = {
            view: {
                showIcon: false,
                selectedMulti: false
            },
            edit: {
                enable: true,
                drag: {},
                showRemoveBtn: false,
                showRenameBtn: false
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
                    let selected = me.ztree.getSelectedNodes();
                    me.dom.triggerHandler('selected', [me, selected]);
                }
            }
        };
        me.config(me.ztreeSetting);
        me.fields = [];
        me.fields.push(me.parentField);
        me.fields.push(me.presentField);
        if (me.sortField) {
            me.fields.push(me.sortField);
        }
        me.dom.addClass("ztree");
        me.onSelected(me.onselected);
    },
    /**
     * 注册选中数据事件
     * @param handler 处理函数
     */
    onSelected: function (handler) {
        this.dom.on('selected', handler);
    },
    /**
     * 加载数据
     */
    load: function () {
        let me = this;
        me.ajax(me, function (data) {
            me.ztree = $.fn.zTree.init(me.dom, me.ztreeSetting, data);
            let urlHash = cqjs.web.getParams(window.location.hash.substring(1)),
                id = urlHash.id,
                node = me.ztree.getNodeByParam("id", id);
            if (node) {
                me.ztree.selectNode(node);
            }else{
                me.ztree.expandAll(true);
            }
        });
    },
    /**
     * 获取控件字段
     * @returns {[]}
     */
    getFields: function () {
        return this.fields;
    },
    /**
     * 展开选中节点
     */
    expandSelected: function () {
        let me = this;
        if (me.ztree) {
            let nodes = me.ztree.getSelectedNodes();
            if (nodes.length > 0) {
                me.ztree.expandNode(nodes[0], true, true, true);
            }
        }
    },
    /**
     * 展开所有节点
     */
    expandAll: function () {
        let me = this;
        if (me.ztree) {
            me.ztree.expandAll(true);
        }
    },
    /**
     * 收起选中节点
     */
    collapseSelected: function () {
        let me = this;
        if (me.ztree) {
            let nodes = me.ztree.getSelectedNodes();
            if (nodes.length > 0) {
                me.ztree.expandNode(nodes[0], false, true, true);
            }
        }
    },
    /**
     * 收起所有节点
     */
    collapseAll: function () {
        let me = this;
        if (me.ztree) {
            me.ztree.expandAll(false);
        }
    }
});