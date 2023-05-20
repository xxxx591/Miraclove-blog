/**
 * 多对多编辑控件
 */
cqjs.editor('many2many', {
    /**
     * 查找数据分页大小
     */
    lookupLimit: 10,
    /**
     * 查找对话框架
     */
    lookupTpl: `<div class="modal fade" id="modal-m2m">
                    <div class="modal-dialog modal-xl">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h4 class="modal-title">${'选择'.t()}<span class="comodel-name"></span></h4>
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div class="modal-body">
                                <div class="btn-row">
                                    <div class="input-group col-3">
                                        <input type="text" class="form-control lookup-keyword"/>
                                        <div class="input-group-append">
                                            <button type="button" class="btn btn-default btn-lookup">
                                                <i class="fa fa-search"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="m2m-pager float-right"></div>                                
                                </div>
                                <div class="grid-sm m2m-cogrid"></div>
                            </div>
                            <div class="modal-footer justify-content-between">
                                <button type="button" class="btn btn-default" data-dismiss="modal">${'关闭'.t()}</button>
                                <button type="button" role="btn-save" class="btn btn-primary">${'确定'.t()}</button>
                            </div>
                        </div>
                    </div>
                </div>`,
    /**
     * 获取控件模板
     * @returns
     */
    getTpl: function () {
        return `<div role="tbar" class="toolbar"></div><div class="grid-sm m2m-grid" id="${this.getId()}">${'加载中'.t()}</div>`;
    },
    /**
     * 初始化控件
     */
    init: function () {
        let me = this, dom = me.dom, field = me.field;
        me.name = me.name || dom.attr('data-field') || field.name;
        me.delete = [];
        me.create = [];
        dom.html(me.getTpl());
    },
    /**
     * 选中行
     * @param e Event
     * @param grid 表格
     * @param sel 选中的id列表
     */
    selected: function (e, grid, sel) {
        let me = this, selected = [];
        $.each(sel, function (i, id) {
            $.each(grid.data, function () {
                if (this.id === id) {
                    selected.push(this);
                }
            });
        });
        if (me.toolbar) {
            me.toolbar.update(selected);
        }
    },
    /**
     * 更新表格
     */
    updateGrid: function () {
        let me = this;
        if (me.fields) {
            let el = me.dom.children('.m2m-grid');
            el.html('').unbind();
            me.grid = el.JGrid({
                model: me.field.comodel,
                module: me.module,
                arch: me.arch,
                fields: me.fields,
                view: me.view,
                editable: true,
                selected: function (e, grid, sel) {
                    me.selected(e, grid, sel);
                },
                ajax: function (grid, callback, data, settings) {
                    me.loadData(grid, callback, data, settings);
                },
                delete: function () {
                    me.removeValue();
                },
                create: function () {
                    me.addValue();
                }
            });
            me.initToolbar();
        } else {
            cqjs.rpc({
                model: 'ir.ui.view',
                method: "loadFields",
                args: {
                    model: me.field.comodel
                },
                onsuccess: function (r) {
                    me.fields = r.data.fields;
                    me.lookupPresent = r.data.present;
                    me.updateGrid();
                }
            });
        }
    },
    /**
     * 初始化工具条
     */
    initToolbar: function () {
        let me = this;
        if (me.grid && !me.dom.hasClass('readonly')) {
            me.toolbar = me.dom.find('[role=tbar]').JToolbar({
                arch: me.grid.tbarArch || '<toolbar/>',
                auths: "@all",
                buttons: "default",
                buttonsTpl: me.buttonsTpl,
                defaultButtons: 'create|delete',
                target: me.grid,
                view: me.view,
            });
            me.view.onToolbarChange(me.toolbar);
        }
    },
    /**
     * 加载数据
     * @param grid 表格
     * @param callback 表格绑定数据的回调
     * @param data DataTable的参数
     * @param settings DataTable的参数
     */
    loadData: function (grid, callback, data, settings) {
        let me = this;
        if (me.data) {
            callback({
                data: me.data
            });
        } else {
            cqjs.rpc({
                model: me.model,
                module: me.module,
                method: "searchRelated",
                args: {
                    relatedField: me.field.name,
                    options: {
                        criteria: [['id', 'in', me.values || []]],
                        nextTest: true,
                        offset: 0,
                        limit: me.field.limit,
                        fields: grid.getFields(),
                        order: grid.getSort()
                    }
                },
                context: {
                    usePresent: true
                },
                onsuccess: function (r) {
                    me.data = r.data.values;
                    callback({
                        data: r.data.values
                    });
                }
            });
        }
    },
    /**
     * 查找数据
     * @param grid 表格
     * @param callback 表格绑定数据的回调
     * @param data DataTable的参数
     * @param settings DataTable的参数
     */
    lookupData: function (grid, pager, callback, data, settings) {
        let me = this, kw = $("#modal-m2m .lookup-keyword").val(), filter = me.dom.attr('search') || null;
        let values = me.getRawValue();
        let criteria = [['id', 'not in', values], ['present', 'like', kw]];
        if (filter) {
            filter = cqjs.utils.decode(filter);
            let data = me.owner.getRawData();
            data.__filter = new Function("return " + filter);
            filter = data.__filter();
            $.each(filter, function () {
                criteria.push(this);
            });
        }
        cqjs.rpc({
            model: me.model,
            module: me.module,
            method: "searchRelated",
            args: {
                relatedField: me.field.name,
                options: {
                    criteria: criteria,
                    nextTest: true,
                    offset: pager.getOffset(),
                    limit: pager.getLimit(),
                    fields: grid.getFields(),
                    order: grid.getSort(),
                    activeTest: true
                }
            },
            context: {
                active_test: true,
                usePresent: true
            },
            onsuccess: function (r) {
                if (r.data.values.length > 0) {
                    let len = pager.getOffset() + r.data.values.length;
                    if (r.data.hasNext === false) {
                        pager.update({
                            to: len,
                            next: false,
                            total: len
                        });
                    } else {
                        pager.update({
                            to: len,
                            next: true
                        });
                    }
                } else {
                    pager.hide();
                }
                callback({
                    data: r.data.values
                });
                me.lookupGrid.data = {};
                $.each(r.data.values, function (i, v) {
                    me.lookupGrid.data[v['id']] = v;
                });
            }
        });
    },
    confirmData: function (selected) {
        let me = this;
        for (let i = 0; i < selected.length; i++) {
            let id = selected[i], row = me.lookupGrid.data[id];
            if (me.delete.indexOf(id) > -1) {
                me.delete.remove(id);
            } else {
                me.create.push(id);
            }
            me.data.push(row);
        }
        me.grid.table.draw();
        me.dom.triggerHandler('valueChange', [me]);
    },
    /**
     * 添加数据
     */
    addValue: function () {
        let me = this;
        $("#modal-m2m").remove();
        $(document.body).append(me.lookupTpl);
        let modal = $("#modal-m2m");
        if (me.lookupPresent && me.lookupPresent.length) {
            let placeholder = '';
            for (let p of me.lookupPresent) {
                if (placeholder) {
                    placeholder += ",";
                }
                let f = me.fields[p], label = f.label || f.name;
                if (label) {
                    placeholder += label.t();
                }
            }
            modal.find('.lookup-keyword').attr('placeholder', placeholder);
        }
        modal.on('click', '[role=btn-save]', function () {
            me.confirmData(me.lookupGrid.getSelected());
            modal.modal('hide');
        }).on('click', '.btn-lookup', function () {
            me.lookupGrid.load();
        });
        modal.modal({backdrop: false});
        modal.find('.m2m-pager').empty();
        modal.find('.m2m-cogrid').empty();
        let pager = modal.find('.m2m-pager').JPager({
            limit: me.lookupLimit,
            buttonOnly: true,
            pageChange: function (e, pager) {
                me.lookupGrid.load();
            }
        });
        me.lookupGrid = modal.find('.m2m-cogrid').JGrid({
            checkSelect: true,
            model: me.field.comodel,
            module: me.module,
            arch: me.arch,
            fields: me.fields,
            view: me.view,
            selected: function (e, grid, sel) {
            },
            rowDblClick: function (e, grid, id) {
                me.confirmData([id]);
            },
            ajax: function (grid, callback, data, settings) {
                me.lookupData(grid, pager, callback, data, settings);
            }
        });
    },
    /**
     * 移除数据
     */
    removeValue: function () {
        let me = this;
        $.each(me.grid.getSelected(), function (i, item) {
            if (me.create.indexOf(item) > -1) {
                me.create.remove(item);
            } else {
                me.delete.push(item);
            }
            for (let i = 0; i < me.data.length; i++) {
                if (me.data[i].id === item) {
                    me.data.splice(i, 1);
                    break;
                }
            }
        });
        me.grid.table.draw();
        me.dom.triggerHandler('valueChange', [me]);
    },
    /**
     * 注册值变更事件
     * @param handler 处理函数
     */
    onValueChange: function (handler) {
        this.dom.on('valueChange', handler);
    },
    /**
     * 设置为只读状态
     * @param v
     */
    setReadonly: function (readonly) {
        let me = this;
        if (readonly) {
            me.dom.find('[role=tbar]').empty();
            me.dom.addClass('readonly');
        } else {
            me.dom.removeClass('readonly');
            me.initToolbar();
        }
    },
    /**
     * 获取用于提交的数据
     * 指令说明：
     *  create:[0, 0, {values}]
     *  update:[1, id, {values}]
     *  delete:[2, id, 0]
     *  unlink:[3, id, 0]
     *  link:[4, id, 0]
     *  clear:[5, 0, 0]
     *  set:[6, 0, [ids]]
     * @returns {[]}
     */
    getDirtyValue: function () {
        let me = this, v = [];
        for (let i = 0; i < me.create.length; i++) {
            v.push([4, me.create[i], 0]);
        }
        for (let i = 0; i < me.delete.length; i++) {
            v.push([3, me.delete[i], 0]);
        }
        return v;
    },
    getRawValue: function () {
        let me = this, values = [];
        for (let v of me.values) {
            values.push(v);
        }
        for (let v of me.create) {
            values.push(v);
        }
        return values;
    },
    /**
     * 获取值[id1, id2]
     */
    getValue: function () {
        let me = this;
        return me.values;
    },
    /**
     * 设置值
     * @param v
     */
    setValue: function (v) {
        let me = this;
        me.values = v || [];
        delete me.data;
        me.delete = [];
        me.create = [];
        me.updateGrid();
    }
});
