/**
 * 多对一编辑控件
 */
cqjs.editor('one2many', {
    /**
     * 默认最大加载1000行
     */
    limit: 50,
    /**
     * 控件模板
     * @returns
     */
    getTpl: function () {
        return `<div>
                    <div class="float-right" role="pager"></div>
                    <div role="tbar" class="toolbar"></div>
                </div>
                <div class="grid-sm o2m-grid" style="overflow: auto" id="${this.getId()}">${'加载中'.t()}</div>`
    },
    /**
     * 初始化多对一编译控件
     */
    init: function () {
        let me = this, dom = me.dom, field = me.field;
        me.name = me.name || dom.attr('data-field') || field.name;
        me.limit = eval(dom.attr('limit') || me.limit);
        me.paging = eval(dom.attr('pager') || 1);
        me.delete = [];
        me.create = [];
        me.update = [];
        dom.html(me.getTpl());
        me.initToolbar();
        me.initPager();
    },
    initPager: function () {
        let me = this;
        me.pager = me.dom.find('[role=pager]').JPager({
            limit: me.limit,
            pageChange: function (e, pager) {
                me.data = null;
                me.grid.load();
            },
            counting: function (e, pager) {
                me.countData(pager);
            }
        });
        if (me.paging) {
            me.dom.find('[role=tbar]').css('min-height', '26px');
        }else{
            me.pager.hide();
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
                defaultButtons: 'create|creating|edit|delete|import',
                target: me.grid,
                view: me.view
            });
            me.view.onToolbarChange(me.toolbar);
        }
    },
    countData: function (pager) {
        let me = this;
        cqjs.rpc({
            model: me.model,
            module: me.module,
            method: "countByField",
            args: {
                relatedField: me.field.name,
                criteria: [[me.field.inverseName, '=', me.owner.dataId]]
            },
            onsuccess: function (r) {
                me.pager.update({
                    total: r.data
                });
            }
        });
    },
    /**
     * 查询数据
     * @param grid 表格
     * @param callback 表格绑定数据的回调
     * @param data DataTable的参数
     * @param settings DataTable的参数
     */
    searchData: function (grid, callback, data, settings) {
        let me = this;
        if (me.data && me.data.length > 0) return false
        cqjs.rpc({
            model: me.model,
            module: me.module,
            method: "searchByField",
            args: {
                relatedField: me.field.name,
                criteria: [[me.field.inverseName, '=', me.owner.dataId]],
                offset: me.pager.getOffset(),
                limit: me.pager.getLimit(),
                fields: grid.getFields(),
                order: grid.getSort()
            },
            context: {
                usePresent: true
            },
            onsuccess: function (r) {
                me.data = r.data.values;
                if (me.paging && r.data.values.length > 0) {
                    let len = me.pager.getOffset() + r.data.values.length;
                    if (r.data.hasNext === false) {
                        me.pager.update({
                            to: len,
                            next: false,
                            total: len
                        });
                    } else {
                        me.pager.update({
                            to: len,
                            next: true
                        });
                    }
                } else {
                    me.pager.hide();
                }
                callback({
                    data: r.data.values
                });
            }
        });
    },
    /**
     * 根据id读取数据
     * @param grid 表格
     * @param id 主键 new开头的表示新建的数据，需要从create中找
     * @param callback 回调
     */
    readData: function (grid, id, callback) {
        let me = this;
        if (!id)
            return;
        if (id.startsWith('new')) {
            for (let i = 0; i < me.create.length; i++) {
                let d = me.create[i];
                if (d.id === id) {
                    callback({data: d});
                    return;
                }
            }
        } else {
            //TODO 如果当前编辑过，应该取修改的数据，不用再从后台加载
            cqjs.rpc({
                model: me.model,
                module: me.module,
                method: "searchRelated",
                args: {
                    relatedField: me.field.name,
                    options: {
                        criteria: [['id', '=', id]],
                        fields: grid.editForm.getFields()
                    }
                },
                context: {
                    usePresent: true
                },
                onsuccess: function (r) {
                    let data = r.data.values[0];
                    for (let i = 0; i < me.update.length; i++) {
                        let u = me.update[i];
                        if (u.id === id) {
                            let d = me.findData(me.data, id);
                            $.extend(data, d);
                            break;
                        }
                    }
                    callback({
                        data: data
                    });
                }
            });
        }
    },
    /**
     * 查找
     * @param data 数据源
     * @param id id
     * @returns {*}
     */
    findData: function (data, id) {
        for (let i = 0; i < data.length; i++) {
            let d = data[i];
            if (d.id === id) {
                return d;
            }
        }
    },
    /**
     * 双击事件
     * @param e Event
     * @param grid 表格
     * @param id id
     */
    rowDblClick: function (e, grid, id) {
        let me = this;
        me.view.onDblClick(e, grid, function () {
            if (!me.dom.hasClass('readonly')) {
                me.toolbar.dom.find("[name='btn_edit']").click();
            }
        });
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
    // 更新按钮状态
    updateToolbarByParent: function (data) {
        let me = this
        // 加个延迟操作，避开toolbar组件初始化操作
        setTimeout(() => {
            if (me.toolbar) me.toolbar.updateByParent(data);
        }, 200)

    },
    /**
     * 删除数据
     */
    deleteData: function () {
        let me = this;
        $.each(me.grid.getSelected(), function (i, item) {
            if (item.startsWith('new')) {
                for (let i = 0; i < me.create.length; i++) {
                    let d = me.create[i];
                    if (d.id === item) {
                        me.create.splice(i, 1);
                        me.dom.triggerHandler("valueChange", [me]);
                        break;
                    }
                }
            } else {
                me.delete.push(item);
                me.dom.triggerHandler("valueChange", [me]);
            }
            for (let i = 0; i < me.data.length; i++) {
                let d = me.data[i];
                if (d.id === item) {
                    me.data.splice(i, 1);
                    break;
                }
            }
        });
        me.grid.table.draw();
    },
    /**
     * 更新表格
     */
    updateGrid: function () {
        let me = this;
        if (me._fields) {
            let el = me.dom.children('.o2m-grid');
            el.html('').unbind();
            me.grid = el.JGrid({
                model: me.field.comodel,
                module: me.module,
                arch: me.arch,
                fields: me._fields,
                owner: me,
                editable: true,
                view: me.view,
                dialog: true,
                selected: function (e, grid, sel) {
                    me.selected(e, grid, sel);
                },
                rowDblClick: function (e, grid, id) {
                    me.rowDblClick(e, grid, id);
                },
                saveEdit(grid, id, dirty, data, callback) {
                    me.view.onEditConfirm(grid, id, data, function () {
                        me.saveEdit(id, dirty, data, callback);
                    });
                },
                loadEdit(grid, id, callback) {
                    me.readData(grid, id, callback);
                },
                ajax: function (grid, callback, data, settings) {
                    if (me.data) {
                        callback({
                            data: me.data
                        });
                    } else {
                        me.searchData(grid, callback, data, settings);
                    }
                },
                delete: function () {
                    me.deleteData();
                },
                moveUp: function (seq) {
                    me.moveUp(seq);
                },
                moveDown: function (seq) {
                    me.moveDown(seq);
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
                    me._fields = r.data.fields;
                    me.updateGrid();
                }
            });
        }
    },
    move: function (seq, idx) {
        let me = this, preRow = me.data[idx - 1], row = me.data[idx];
        me.data[idx] = preRow;
        me.data[idx - 1] = row;
        let seqValue = row[seq];
        row[seq] = preRow[seq];
        preRow[seq] = seqValue;
        if (row.id.startsWith('new')) {
            let data = me.create.find(function (r) {
                return r.id == row.id
            });
            data[seq] = row[seq];
        } else {
            let data = me.update.find(function (r) {
                return r.id == row.id;
            });
            if (data) {
                data[seq] = row[seq];
            } else {
                let value = {id: row.id};
                value[seq] = row[seq];
                me.update.push(value);
            }
        }
        if (preRow.id.startsWith('new')) {
            let data = me.create.find(function (r) {
                return r.id == preRow.id;
            });
            data[seq] = preRow[seq];
        } else {
            let data = me.update.find(function (r) {
                return r.id == preRow.id;
            });
            if (data) {
                data[seq] = preRow[seq];
            } else {
                let value = {id: preRow.id};
                value[seq] = preRow[seq];
                me.update.push(value);
            }
        }
        me.grid.load();
        me.dom.triggerHandler("valueChange", [me]);
    },
    moveUp: function (seq) {
        let me = this, sel = me.grid.sel[0];
        for (let idx = 0; idx < me.data.length; idx++) {
            let row = me.data[idx];
            if (idx > 0 && row.id == sel) {
                me.move(seq, idx);
                break;
            }
        }
    },
    moveDown: function (seq) {
        let me = this, sel = me.grid.sel[0];
        for (let idx = 0; idx < me.data.length; idx++) {
            let row = me.data[idx];
            if (idx < me.data.length - 1 && row.id == sel) {
                me.move(seq, idx + 1);
                break;
            }
        }
    },
    /**
     * 根据id移除数据
     * @param data 数据源
     * @param id id
     */
    removeDataById(data, id) {
        let me = this;
        for (let i = 0; i < data.length; i++) {
            let d = data[i];
            if (d.id === id) {
                data.splice(i, 1);
                break;
            }
        }
    },
    /**
     * 保存编辑的数据
     * @param id 数据的id，new开头表示新建的数据
     * @param dirty 用于保存的脏数据
     * @param data 用于显示在表格中的数据
     * @param callback 回调方法
     */
    saveEdit: function (id, dirty, data, callback) {
        let me = this;
        data = data || dirty;
        if (id) {
            data.id = id;
            for (let i = 0; i < me.data.length; i++) {
                let d = me.data[i];
                if (d.id === id) {
                    $.extend(d, data);
                }
            }
            if (id.startsWith('new')) {
                me.removeDataById(me.create, id);
                me.create.push(dirty);
                me.dom.triggerHandler("valueChange", [me]);
            } else {
                me.removeDataById(me.update, id);
                me.update.push(dirty);
                me.dom.triggerHandler("valueChange", [me]);
            }
        } else {
            dirty.id = 'new-' + cqjs.nextId();
            data.id = dirty.id;
            me.create.push(dirty);
            me.data.push(data);
            me.dom.triggerHandler("valueChange", [me]);
        }
        if (callback) {
            callback(true);
        }

    },
    /**
     * 注册值变更事件
     * @param handler 处理函数
     */
    onValueChange: function (handler) {
        this.dom.on("valueChange", handler);
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
     * 获取值
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
            let values = {};
            $.extend(values, me.create[i]);
            delete values.id;
            v.push([0, 0, values]);
        }
        for (let i = 0; i < me.update.length; i++) {
            let values = {};
            $.extend(values, me.update[i]);
            let id = values.id;
            delete values.id;
            v.push([1, id, values]);
        }
        for (let i = 0; i < me.delete.length; i++) {
            v.push([2, me.delete[i], 0]);
        }
        return v;
    },
    /**
     * 获取数据
     */
    getValue: function () {
        let me = this;
        return this.data;
    },
    /**
     * 设置值
     * @param v
     */
    setValue: function (values) {
        let me = this;
        me.values = values || [];
        delete me.data;
        me.delete = [];
        me.create = [];
        me.update = [];
        me.updateGrid();
    },
    // 设置data
    setData: function (data, values) {
        let me = this;
        me.values = values || [];
        me.data = data || []
        me.delete = [];
        me.create = [];
        me.update = [];
        me.updateGrid();
    }
});
