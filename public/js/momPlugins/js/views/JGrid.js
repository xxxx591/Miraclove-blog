/**
 * JGrid表格，使用DataTable生成界面
 * arch:
 *  <grid>
 *      <toolbar/>
 *      <field name="..."/>
 *  </grid>
 */
$.component("JGrid", {
    /**
     * 分页数
     */
    limit: 20,
    /**
     * 是否允许编辑，是则表格行内或者对话框编辑，否则转到表单编辑
     */
    editable: false,
    /**
     * 是否对话框编辑
     */
    dialog: false,
    /**
     * 是否显示行号
     */
    showRowNum: true,
    /**
     * 是否允许多选
     */
    multiSelect: true,
    /**
     * 是否通过勾选框选中
     */
    checkSelect: false,
    /**
     * ajax请求，通过callback绑定数据
     * @param grid 表格
     * @param callback DataTable的绑定回调
     * @param data DataTable的参数
     * @param settings DataTable的参数
     */
    ajax: function (grid, callback, data, settings) {
        callback({ data: [] });
    },
    /**
     * 编辑保存：saveEdit(grid, id, dirty, data, callback)
     * @param grid 表格
     * @param id id
     * @param dirty 用于保存的脏数据
     * @param data 用于显示在表格中的数据
     * @param callback 回调方法
     */
    saveEdit: cqjs.emptyFn,
    /**
     * 加载编辑的数据
     * @param grid 表格
     * @param id
     * @param callback
     */
    loadEdit: function (grid, id, callback) {
        cqjs.rpc({
            model: grid.model,
            module: grid.module,
            method: "read",
            args: {
                ids: [id],
                fields: grid.editForm.getFields()
            },
            context: {
                usePresent: true
            },
            onsuccess: function (r) {
                callback({ data: r.data[0] });
            }
        });
    },
    /**
     * 行内编辑的按钮模板
     * @returns
     */
    getEditFBarTpl: function () {
        return `<td colspan="500"><div class="grid-edit"></div>
                    <div class="grid-edit-tbar">
                        <button name="cancel" type="button" class="btn btn-outline-secondary">${'取消'.t()}</button>
                        <button name="confirm" type="button" class="btn btn-info">${'确定'.t()}</button>
                    </div>
                </td>`;
    },
    /**
     * 初始化JGrid
     */
    init: function () {
        let me = this, columnDefs = [], columnIndex = 0, columnOrder = 0;
        me._fields = [];
        if (me.arch) {
            let arch = cqjs.utils.parseXML(me.arch), grid = arch.children('grid');
            if (grid.length > 0) {
                me.limit = eval(grid.attr('limit') || me.limit);
                me.dialog = eval(grid.attr('dialog') || me.dialog);
                me.editable = me.dialog || eval(grid.attr('inline') || grid.attr('editable') || me.editable);
                if (me.pager) {
                    me.pager.limit = me.limit;
                }
                me.showRowNum = eval(grid.attr('showRowNum') || me.showRowNum);
                me.multiSelect = eval(grid.attr('multiSelect') || me.multiSelect);
                me.checkSelect = eval(grid.attr('checkSelect') || me.checkSelect);
                me.tbarArch = grid.children('toolbar').prop('outerHTML');
                me.editArch = grid.children('edit').prop('innerHTML') || grid.prop('innerHTML');
                me.isTree = eval(grid.attr('tree'));
                me.footer = eval(grid.attr('footer') || 0);
                me.ordering = eval(grid.attr('ordering') || 1);
                if (me.isTree) {
                    me.parentField = grid.attr('parent_field') || 'parent_id';
                    me._fields.push(me.parentField);
                }
                let html = '<table class="table table-bordered table-hover ' + me.className + '"><thead><tr>';
                let footer = "";
                if (me.checkSelect) {
                    columnDefs.push({
                        searchable: false,
                        orderable: false,
                        data: null,
                        render: function (data, type, row, opt) {
                            return '<input type="checkbox" class="check-select">';
                        },
                        targets: columnIndex++
                    });
                    html += '<th style="width:1%"><input type="checkbox" class="all-check-select"/></th>';
                    columnOrder++;
                }
                if (me.showRowNum) {
                    columnDefs.push({
                        searchable: false,
                        orderable: false,
                        data: null,
                        render: function (data, type, row, opt) {
                            return opt.row + 1;
                        },
                        targets: columnIndex++
                    });
                    html += '<th style="width:1%">#</th>';
                    columnOrder++;
                }
                grid.children('field').each(function () {
                    let el = $(this),
                        name = el.attr('name'),
                        label = el.attr('label'),
                        css = el.attr('class'),
                        style = el.attr('style'),
                        visible = eval(el.attr('visible') || 1),
                        field = me.fields[name];
                    if (!field) {
                        throw new Error('模型' + me.model + '找不到字段' + name);
                    }
                    if (!field.deny) {
                        if (!label) {
                            label = field.label || field.name;
                        }
                        label = label.t();
                        me._fields.push(name);
                        html += '<th';
                        if (style) {
                            html += ' style="' + style + '"';
                        }
                        html += '>' + label + '</th>';
                        columnDefs.push({
                            render: new (cqjs.columns[el.attr('editor') || field.type] || cqjs.columns['default'])({
                                field: field,
                                owner: me
                            }).render(),
                            data: name,
                            className: css,
                            targets: columnIndex++,
                            orderable: field.sortable,
                            visible: visible
                        });
                        footer += "<th></th>";
                    }
                });
                if (me.footer) {
                    html += `</tr></thead><tfoot><tr>${footer}</tr></tfoot></table>`;
                } else {
                    html += `</tr></thead></table>`;
                }
                grid.replaceWith(html);
            } else {
                let table = arch.children('table');
                table.find('th').each(function () {
                    let el = $(this),
                        name = el.attr('data-data');
                    me._fields.push(name);
                });
            }
            me.dom.html(arch.children().prop('outerHTML'));
        }
        me.initTable(columnDefs);
        me.sel = [];
        me.onSelected(me.selected);
        me.onRowDblClick(me.rowDblClick);
        me.onEditValueChange(me.editValueChange);
    },
    /**
     * 初始化DataTable
     * @param columnDefs 列定义，参考https://datatables.net/reference/option/columnDefs
     */
    initTable: function (columnDefs) {
        let me = this;
        me.table = me.dom.find('table').DataTable({
            paging: false,
            lengthChange: false,
            searching: false,
            ordering: me.ordering,
            info: false,
            autoWidth: false,
            responsive: true,
            processing: true,
            serverSide: true,
            rowId: 'id',
            colReorder: true,
            language: {
                processing: "加载中".t(),
                zeroRecords: "没有数据".t()
            },
            ajax: function (data, callback, settings) {
                me.sel = [];
                me.dom.triggerHandler('selected', [me, []]);
                me.dom.find('.all-check-select').prop('checked', false);
                if (me.redraw && me.data) {
                    callback({ data: me.data });
                    me.dom.triggerHandler('loaded', [me, me.data]);
                } else {
                    if (me.table) {
                        me.ajax(me, function (d) {
                            if (me.isTree) {
                                d = me.buildTreeData(d);
                            }
                            me.data = d.data;
                            callback(d);
                            me.dom.triggerHandler('loaded', [me, me.data]);
                        }, data, settings);
                    }
                }
            },
            order: [],
            columnDefs: columnDefs
        });
        me.table.on('change', '.check-select', function () {
            let ckb = $(this);
            let id = me.table.row(ckb.parents('tr')).id();
            if (ckb.is(":checked")) {
                if (me.multiSelect) {
                    me.sel.push(id);
                } else {
                    me.dom.find('.check-select').prop('checked', false);
                    ckb.prop('checked', true);
                    me.sel = [id];
                }
            } else {
                me.sel.remove(id);
            }
            // 自动触发勾选全选按钮
            let targetLength = 0
            if (Array.isArray(me.data)) {
                targetLength = me.data.length
            } else {
                let ids = []
                for (const dataKey in me.data) {
                    ids.push(dataKey)
                }
                targetLength = ids.length
            }
            if (me.multiSelect && me.sel.length === targetLength) {
                me.dom.find('.all-check-select').prop('checked', true);
            } else {
                me.dom.find('.all-check-select').prop('checked', false);

            }
            console.log(`output->me.sel`, me.sel, me.data)
            me.dom.triggerHandler('selected', [me, me.sel]);
        });
        // 全选事件
        me.table.on('change', '.all-check-select', function () {
            let ckb = $(this);

            if (ckb.is(":checked")) {
                if (Array.isArray(me.data)) {
                    me.sel = me.data.map(item => item.id)
                } else {
                    for (const dataKey in me.data) {
                        me.sel.push(dataKey)
                    }
                }
                me.dom.find('.check-select').prop('checked', true);
            } else {
                me.sel = [];
                me.dom.find('.check-select').prop('checked', false);

            }
            me.dom.triggerHandler('selected', [me, me.sel]);
        });
        me.table.on('click', 'tbody tr', function () {
            let row = $(this);
            if (me.checkSelect || row.hasClass('edit') || row.children('.dataTables_empty').length === 1) {
                return;
            }
            let id = me.table.row(this).id();
            if (me.multiSelect && window.event.ctrlKey) {
                if (row.hasClass('selected')) {
                    row.removeClass('selected');
                    me.sel.remove(id);
                } else {
                    row.addClass('selected');
                    me.sel.push(id);
                }
            } else {
                me.table.$('tr.selected').removeClass('selected');
                row.addClass('selected');
                me.sel = [id];
            }
            me.dom.triggerHandler('selected', [me, me.sel]);
        });
        me.table.on('dblclick', 'tbody tr', function () {
            let row = $(this);
            if (me.checkSelect || row.hasClass('edit') || row.children('.dataTables_empty').length === 1) {
                return;
            }
            let id = me.table.row(this).id();
            me.dom.triggerHandler('rowDblClick', [me, id]);
        });
        me.table.ajax.reload();
    },
    buildTreeData: function (data) {
        let me = this, map = {}, result = [],
            addChildren = function (d) {
                for (let c of d.$children) {
                    c.$depth = c.$parent.$depth + 1;
                    result.push(c);
                    addChildren(c);
                }
            }
        for (let d of data.data) {
            map[d.id] = d;
            d.$children = [];
        }
        for (let d of data.data) {
            let pid = d[me.parentField];
            if (pid) {
                if ($.isArray(pid)) {
                    pid = pid[0];
                }
                let parent = map[pid];
                if (parent) {
                    parent.$children.push(d);
                    d.$parent = parent;
                }
            }
        }
        for (let d of data.data) {
            if (!d.$parent) {
                d.$depth = 0;
                result.push(d);
                addChildren(d);
            }
        }

        return { data: result };
    },
    /**
     * 注册行选中事件
     * @param handler 处理函数
     */
    onSelected: function (handler) {
        this.dom.on('selected', handler);
    },
    /**
     * 注册行双击事件
     * @param handler 处理函数
     */
    onRowDblClick: function (handler) {
        this.dom.on('rowDblClick', handler);
    },
    /**
     * 重新渲染表格
     * @private
     */
    _redraw: function () {
        let me = this;
        me.redraw = true;
        me.table.draw();
        me.redraw = false;
        me.dom.find('tr.edit').removeClass('edit');
        delete me.editCallback;
        me.editing = false;
    },
    /**
     * 添加行数据
     * @param values 数据
     * @param callback 回调函数
     */
    create: function (values, callback) {
        let me = this;
        if (!me.dialog && me.editing) {
            if (me.editForm.valid()) {
                me.confirmData();
            } else {
                return;
            }
        }
        me._redraw();
        if (me.dialog) {
            me.renderDialogEdit();
        } else {
            me.dom.find('table tbody').prepend('<tr id="addNew"></tr>');
            let row = me.dom.find('#addNew');
            me.renderRowEdit(row, null, {});
        }
        me.editForm.create(values);
        me.editCallback = callback;
    },
    /**
     * 渲染编辑对话框
     * @param id
     * @param opt 选项
     */
    renderDialogEdit: function (id, opt) {
        let me = this;
        me.editing = true;
        cqjs.showDialog({
            id: 'edit-' + cqjs.nextId(),
            title: id ? '编辑'.t() : '添加'.t(),
            init: function (dialog) {
                me.editForm = dialog.body.JForm($.extend({
                    arch: '<form>' + me.editArch + '</form>',
                    fields: me.fields,
                    model: me.model,
                    module: me.module,
                    owner: me,
                    view: me.view
                }, opt));
            },
            submit: function (dialog) {
                dialog.busy();
                if (me.editForm.valid()) {
                    me.confirmData(function () {
                        dialog.close();
                    });
                } else {
                    let errors = me.editForm.getErrors();
                    cqjs.msg.error({ code: 1000, message: errors });
                }
            }
        });
    },
    /**
     * 渲染行内编辑
     * @param row 行
     * @param id id
     * @param opt 选项
     */
    renderRowEdit: function (row, id, opt) {
        let me = this;
        me.editing = true;
        row.addClass('edit').html(me.getEditFBarTpl());
        row.find('[name=cancel]').on('click', function () {
            me._redraw();
        });
        row.find('[name=confirm]').on('click', function () {
            if (me.editForm.valid()) {
                let btn = $(this);
                btn.attr('disabled', true);
                me.confirmData(function () {
                    btn.attr('disabled', false);
                });
            } else {
                let errors = me.editForm.getErrors();
                cqjs.msg.error({ code: 1000, message: errors });
            }
        });
        me.editForm = row.find('.grid-edit').JForm($.extend({
            arch: '<form>' + me.editArch + '</form>',
            fields: me.fields,
            model: me.model,
            module: me.module,
            owner: me,
            view: me.view
        }, opt));
    },
    /**
     * 提交编辑数据
     * @param callback 回调函数
     */
    confirmData: function (callback) {
        let me = this, update = me.editForm.dataId && !me.editForm.dataId.startsWith('new'),
            dirty = me.editForm.getDirtyData(!update);
        dirty.id = me.editForm.dataId;
        me.saveEdit(me, me.editForm.dataId, dirty, me.editForm.getData(), function (success) {
            if (success) {
                me.editing = false;
                me.load();
                me.dom.triggerHandler("editValueChange", [me, me.editForm]);
                let cb = me.editCallback;
                delete me.editCallback;
                if (cb) {
                    cb();
                }
            }
            if (callback) {
                callback();
            }
        });
    },
    /**
     * 注册数据变更事件
     * @param handler 处理函数
     */
    onEditValueChange: function (handler) {
        this.dom.on('editValueChange', handler);
    },
    /**
     * 编辑行数据
     * @param id
     * @param callback 回调函数
     */
    edit: function (id, callback) {
        let me = this;
        id = id || me.sel[0];
        if (id) {
            if (!me.dialog && me.editing) {
                if (me.editForm.valid()) {
                    me.confirmData();
                } else {
                    return;
                }
            }
            me._redraw();
            if (me.dialog) {
                me.renderDialogEdit(id, {
                    ajax: function (form, callback) {
                        me.loadEdit(me, id, callback);
                    },
                });
            } else {
                let row = me.dom.find('#' + id);
                me.renderRowEdit(row, id, {
                    ajax: function (form, callback) {
                        me.loadEdit(me, id, callback);
                    },
                });
            }
            me.editForm.load();
        }
        me.editCallback = callback;
    },
    /**
     * 获取DataTable对象
     * @returns {*}
     */
    getTable: function () {
        return this.table;
    },
    /**
     * 获取表格的字段
     * @returns {[]}
     */
    getFields: function () {
        return this._fields;
    },
    /**
     * 获取选中行 [ids]
     * @returns {[]|[*]|[*]|*}
     */
    getSelected: function () {
        return this.sel;
    },
    /**
     * 获取表格排序条件
     * @returns {string}
     */
    getSort: function () {
        let me = this, order = '';
        if (me.table) {
            $.each(me.table.order(), function (i, o) {
                let ds = me.table.column(o[0]).dataSrc();
                if (ds) {
                    if (order != '') {
                        order += ',';
                    }
                    order += ds + ' ' + o[1];

                }
            });
        }
        return order;
    },
    /**
     * 加载数据，触发ajax方法
     */
    load: function () {
        this.table.ajax.reload();
    }
});
