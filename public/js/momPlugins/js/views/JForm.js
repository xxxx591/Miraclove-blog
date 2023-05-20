/**
 * 表单控件
 */
$.component("JForm", {
    /**
     *
     */
    ajax: cqjs.emptyFn,
    /**
     * 表单列数
     */
    cols: 4,
    /**
     * 左侧树形模板
     * @returns
     */
    getAsideTpl: function () {
        return `<aside class="left-aside border-right"><div class="m-1">
                    <div class="input-group input-group-sm">
                        <div class="input-group-prepend">
                            <button class="btn btn-default btn-sm tree-expand"><i class="fas fa-chevron-down"></i></button>
                            <button class="btn btn-default btn-sm tree-collapse"><i class="fas fa-chevron-up"></i></button>
                        </div>
                        <input type="text" class="form-control tree-keyword"/>
                        <div class="input-group-append">
                            <div data-btn="view" class="btn btn-default tree-lookup">
                                <i class="fa fa-search"></i>
                            </div>
                        </div>
                    </div>
                </div><div id="treeview_${cqjs.nextId()}" class="treeview"></div></aside>`;
    },
    /**
     * 必填验证
     * @param editor
     * @returns {todo|*}
     */
    requiredValid: function (editor) {
        let required = editor.dom.attr('required') || editor.field.required;
        if (eval(required)) {
            let val = editor.getValue();
            if (val === '' || val == null || val == undefined) {
                return '不能为空'.t();
            }
            if ($.isArray(val) && val.length == 0) {
                return '不能为空'.t();
            }
        }
    },
    /**
     * 初始化控件
     */
    init: function () {
        let me = this, dom = me.dom;
        me._fields = [];
        me.sel = [];
        me.editors = {};
        if (me.arch) {
            let arch = cqjs.utils.parseXML(me.arch), form = arch.find('form'), toManyArchs = {};
            if (form.length > 0) {
                let tbar = form.children('toolbar');
                me.tbarArch = tbar.prop('outerHTML');
                tbar.remove();
                me.isTree = eval(form.attr('tree'));
                me.cols = eval(form.attr('cols') || me.cols);
                if (me.isTree) {
                    me.cols -= 1;
                }
                if (me.cols < 1) {
                    me.cols = 1;
                }
                me._initFields(form, toManyArchs);
                me._initTabs(form);
                me._initGroup(form);
                me._initLogAccess(form);
                form.addClass('grid');
                form.attr('role', 'form-body');
                let html = arch.children().prop('outerHTML');

                if (dom.parents('form').length > 0) {
                    html = html.replaceAll('<form', '<div').replaceAll('/form>', '/div>');
                }
                html = '<div class="container-fluid form-body"><div class="card-body row"><div class="col-md-12">' + html + '</div></div></div>';
                if (me.isTree) {
                    html = me.getAsideTpl() + html;
                    dom.css("display", "flex");
                }
                dom.html(html).find('[role=form-body]').css('grid-template-columns', 'repeat(' + me.cols + ', 1fr)')
                    .on('click', '.field-group .group-expender', function () {
                        let btn = $(this), body = btn.parents('.field-group').find('.group-body');
                        if (btn.hasClass('collapsed')) {
                            body.show();
                            btn.removeClass('collapsed');
                            btn.find('[role=button]').removeClass('fa-chevron-down').addClass('fa-chevron-up');
                        } else {
                            body.hide();
                            btn.addClass('collapsed');
                            btn.find('[role=button]').removeClass('fa-chevron-up').addClass('fa-chevron-down');
                        }
                    });
                me._initTreeView(form);
                dom.find('[data-field]').each(function () {
                    let el = $(this),
                        fname = el.attr('data-field'),
                        field = me.fields[fname],
                        editor = el.attr('editor') || field.type,
                        cfg = {
                            field: field,
                            model: me.model,
                            module: me.module,
                            owner: me,
                            view: me.view,
                            dom: el,
                        },
                        ctl = cqjs.editors[editor];
                    if (!ctl) {
                        throw new Error('找不到编辑器:' + editor);
                    }
                    if (field.type === 'many2many' || field.type === 'one2many') {
                        cfg.arch = toManyArchs[fname];
                    }
                    let edt = new ctl(cfg);
                    if (edt.onValueChange) {
                        edt.onValueChange(function (e, ed) {
                            ed.dirty = true;
                            me.dirty = true;
                            me._updateEditorState();
                            if (!me.loading) {
                                me.valid(ed.field.name);
                                me._onFieldChange(ed);
                            }
                        });
                    }
                    me.editors[fname] = edt;
                });
                dom.find('[readonly]').each(function () {
                    let e = $(this),
                        fname = e.attr('form-field'),
                        expr = this.attributes['readonly'].value;
                    if (fname) {
                        me.getEditor(fname).setReadonly(eval(expr));
                    }
                });
                dom.find('[visible]').each(function () {
                    let e = $(this),
                        visible = eval(e.attr('visible'));
                    if (visible) {
                        e.show();
                    } else {
                        e.hide();
                    }
                });
                dom.find('[t-reset]').each(function () {
                    let e = $(this),
                        fname = e.attr('form-field'),
                        reset = e.attr('t-reset');
                    if (fname) {
                        $.each(reset.split(","), function () {
                            let edt = me.editors[this];
                            if (edt.onValueChange) {
                                edt.onValueChange(function () {
                                    if (!me.loading) {
                                        me.getEditor(fname).setValue();
                                    }
                                });
                            }
                        });
                    }
                });
                dom.find('[data-toggle=tooltip]').tooltip();
            }
        }
        me.onSelected(me.selected);
        if (me.data) {
            me.setData(me.data);
        }
    },
    /**
     * 初始化访问字段
     * @param form
     * @private
     */
    _initLogAccess: function (form) {
        let me = this, logAccess = me.fields['create_uid'] && eval(form.attr('logAccess') || 1);
        if (logAccess) {
            form.append(`<div class="grid log-access" style="grid-template-columns: repeat(4, 1fr);grid-column:span ${me.cols}">
                        <div style="grid-column:span 1" class="form-group">                                  
                            <label>${'创建人'.t()}</label>
                            <span data-field="create_uid" editor="span">                          
                            </span>
                        </div>
                        <div style="grid-column:span 1" class="form-group">                           
                            <label>${'创建时间'.t()}</label>
                            <span data-field="create_date" editor="span">                           
                            </span>
                        </div>
                        <div style="grid-column:span 1" class="form-group">
                            <label>${'修改人'.t()}</label>
                            <span data-field="update_uid" editor="span"></span>
                        </div>
                        <div style="grid-column:span 1" class="form-group">
                            <label>${'修改时间'.t()}</label>
                            <span data-field="update_date" editor="span"></span>
                        </div>
                    </div>`);
            me._fields.push('create_uid');
            me._fields.push('create_date');
            me._fields.push('update_uid');
            me._fields.push('update_date');
        }
    },
    /**
     * 字段变更
     * @param editor
     * @private
     */
    _onFieldChange: function (editor) {
        let me = this, dom = me.dom;
        if (editor.dom.attr('onchange')) {
            cqjs.rpc({
                model: me.model,
                module: me.module,
                method: "onchange",
                args: {
                    ids: [me.dataId || '@newid'],
                    values: me.getRawData(),
                    field: editor.field.name,
                },
                onsuccess: function (r) {
                    me.loading = true;
                    for (const k in r.data) {
                        let ed = me.editors[k];
                        if (ed) {
                            ed.setValue(r.data[k]);
                            ed.dirty = true;
                        }
                    }
                    me.loading = false;
                }
            });
        }
    },
    /**
     * 初始化树控件
     * @param form
     * @private
     */
    _initTreeView: function (form) {
        let me = this, dom = me.dom;
        if (me.isTree) {
            let sortField = form.attr('sort_field'),
                allowSort = sortField != undefined && sortField != '',
                dragInner = eval(form.attr('drag_inner') || 1);
            me.treeview = dom.find('.treeview').JTree({
                model: me.model,
                module: me.module,
                fields: me.fields,
                presentField: form.attr('present_field') || 'present',
                parentField: form.attr('parent_field') || 'parent_id',
                sortField: sortField,
                config: function (setting) {
                    setting.edit.drag.prev = allowSort;
                    setting.edit.drag.next = allowSort;
                    setting.edit.drag.inner = dragInner;
                    setting.callback.onDrop = function (event, treeId, treeNodes, targetNode, moveType) {
                        if (moveType !== 'inner' && moveType !== 'next' && moveType !== 'prev') {
                            return;
                        }
                        let ids = [], vals = {}, pId = me.treeview.parentField, id = me.treeview.idField,
                            sort = me.treeview.sortField;
                        $.each(treeNodes, function () {
                            ids.push(this[id]);
                        });
                        if (moveType === 'inner') {
                            vals[pId] = targetNode ? targetNode[id] : null;
                        } else if (moveType === 'next') {
                            vals[pId] = targetNode ? targetNode[pId] : null;
                            vals[sort] = targetNode ? targetNode[sort] + 1 : 0;
                        } else if (moveType === 'prev') {
                            vals[pId] = targetNode ? targetNode[pId] : null;
                            vals[sort] = targetNode ? targetNode[sort] - 1 : 0;
                        }
                        cqjs.rpc({
                            model: me.model,
                            module: me.module,
                            method: "update",
                            args: {
                                ids: ids,
                                values: vals
                            },
                            onsuccess: function (r) {
                                cqjs.msg.show('保存成功'.t());
                                //me.load();
                            }
                        });
                    }
                },
                ajax: function (tree, callback) {
                    let kw = dom.find('.tree-keyword').val();
                    cqjs.rpc({
                        model: me.model,
                        module: me.module,
                        method: "presentSearch",
                        args: {
                            keyword: kw,
                            offset: 0,
                            limit: 0,
                            order: '',
                            fields: tree.getFields()
                        },
                        onsuccess: function (r) {
                            callback(r.data);
                        }
                    });
                },
                onselected: function (e, tree, selected) {
                    dom.triggerHandler('treeSelected', [me.treeview, selected]);
                    if (selected.length > 0) {
                        view.urlHash.id = selected[0].id;
                    } else {
                        delete view.urlHash.id;
                    }
                    view.changeView();
                    me.ajax(me, function (r) {
                        me.setData(r.data)
                    });
                }
            });
            me.treeview.load();
            dom.on('click', '.tree-expand', function () {
                me.treeview.expandAll();
            }).on('click', '.tree-collapse', function () {
                me.treeview.collapseAll();
            }).on('click', '.tree-lookup', function () {
                me.treeview.load();
            });
        }
        me.onTreeSelected(me.treeSelected);
    },
    /**
     * 注册树选中事件
     * @param handler 处理函数
     */
    onTreeSelected: function (handler) {
        this.dom.on('treeSelected', handler);
    },
    /**
     * 初始化字段
     * @param form
     * @param toManyArchs
     * @private
     */
    _initFields: function (form, toManyArchs) {
        let me = this;
        form.find('field').each(function () {
            let el = $(this);
            if (el.parents('field').length > 0) {
                return;
            }
            let name = el.attr('name'),
                label = el.attr('label'),
                nolabel = el.attr('nolabel'),
                help = el.attr('help'),
                field = me.fields[name],
                defVal = el.attr('default') || el.attr('defaultValue'),
                colspan = Math.min(el.attr('colspan') || 1, me.cols),
                rowspan = el.attr('rowspan') || 1,
                css = 'form-group col-12',
                style = `grid-column:span ${colspan};grid-row:span ${rowspan};`,
                attrs = "",
                html = '<div form-field="' + name + '" ';
            if (!field) {
                throw new Error('模型' + me.model + '找不到字段' + name);
            }
            if (field.deny) {
                el.remove();
            } else {
                field.$defaultValue = defVal || field.defaultValue;
                $.each(this.attributes, function (i, attr) {
                    if (attr.name === 'class') {
                        css += ' ' + attr.value;
                    } else if (attr.name === 'style') {
                        style += ' ' + attr.value;
                    } else {
                        let v = cqjs.utils.encode(attr.value);
                        if (['name', 'editor'].indexOf(attr.name) == -1) {
                            html += attr.name + '="' + v + '" ';
                        }
                        if (['t-readonly', 't-visible', 'style', 't-reset'].indexOf(attr.name) == -1) {
                            attrs += attr.name + '="' + v + '" ';
                        }
                    }
                });
                me._fields.push(name);
                if (field.type === 'many2many' || field.type === 'one2many') {
                    toManyArchs[name] = el.html();
                }
                if (el.attr('readonly') == undefined && field.readonly) {
                    html += 'readonly="1" ';
                }
                if (help == undefined) {
                    help = field.help;
                }
                if (help) {
                    attrs += ' data-toggle="tooltip" data-original-title="' + help.replaceAll('<', "&lt;").replaceAll('>', "&gt;") + '"';
                }
                html += ` style="${style}" class="${css}">`;
                if (!label) {
                    label = field.label || field.name;
                }
                label = label.t();
                if (!eval(nolabel)) {
                    html += '<label>' + label + ' </label>';
                    let required = eval(el.attr('required'));
                    if (required == undefined) {
                        required = field.required;
                    }
                    if (required) {
                        html += '<span class="text-danger"> *</span>';
                    }
                }
                html += `<div data-field="${name}" data-label="${label.replaceAll('<', "&lt;").replaceAll('>', "&gt;")}" ${attrs}> </div>`;
                html += '<span class="invalid-feedback"></span></div>';
                el.replaceWith(html);
            }
        });
    },
    /**
     * 初始化分组布局
     * @param form
     * @private
     */
    _initGroup: function (form) {
        let me = this;
        form.find('group').each(function () {
            let group = $(this), css = 'field-group', attrs = '',
                colspan = eval(eval(group.attr("colspan") || me.cols)),
                cols = eval(eval(group.attr('cols') || colspan)),
                styles = 'grid-column:span ' + colspan + ';';
            $.each(this.attributes, function (i, attr) {
                if (attr.name === 'class') {
                    css += ' ' + attr.value;
                } else if (attr.name === 'style') {
                    styles += ' ' + attr.value;
                } else {
                    let v = cqjs.utils.encode(attr.value);
                    attrs += attr.name + '="' + v + '" ';
                }
            });
            let label = group.attr('label');
            if (label) {
                label = label.t();
            }
            let expander = eval(group.attr('collapsable')) ? '<div class="group-expender"><span role="button" class="fa fa-chevron-up"></span></div>' : '';
            let html = `<div class="${css}" style="${styles}" ${attrs}>
                            <div class="group-header border-bottom">${label + expander}</div>
                            <div class="group-body"><div class="group-content grid" style="grid-template-columns:repeat(${cols}, 1fr)">${group.prop('innerHTML')}</div></div>
                        </div>`;
            group.replaceWith(html);
        });
    },
    /**
     * 初始化Tabs布局
     * @param form
     * @private
     */
    _initTabs: function (form) {
        let me = this;
        form.find('tabs').each(function () {
            let tabs = $(this), nav = '', content = '', tabAttrs = '', tabStyle = 'grid-column:span ' + me.cols + ';';
            $.each(this.attributes, function (i, attr) {
                if (attr.name === 'style') {
                    tabStyle += ' ' + attr.value;
                } else {
                    let v = cqjs.utils.encode(attr.value);
                    tabAttrs += attr.name + '="' + v + '" ';
                }
            });
            tabs.children('tab').each(function (i) {
                let tab = $(this);
                if (tab.children().length > 0) {
                    let label = tab.attr('label'), id = 'tab-' + cqjs.nextId(), active = nav ? '' : ' active',
                        show = nav ? '' : ' show', attrs = '', css = '';
                    if (label) {
                        label = label.t();
                    }
                    $.each(this.attributes, function (i, attr) {
                        if (attr.name === 'class') {
                            css += ' ' + attr.value;
                        } else {
                            let v = cqjs.utils.encode(attr.value);
                            if (attr.name != 'id') {
                                attrs += attr.name + '="' + v + '" ';
                            }
                        }
                    });
                    nav += `<li class="nav-item" ${attrs}>
                                <a class="nav-link${active + css}" id="${id}-tab" data-toggle="pill" href="#${id}" role="tab" aria-controls="${id}" aria-selected="true">${label}</a>
                            </li>`;

                    content += `<div class="tab-pane fade${show + active}" id="${id}" role="tabpanel" aria-labelledby="${id}-tab">
                                    <div class="grid mt-3" style="grid-template-columns:repeat(${me.cols}, 1fr)">${tab.prop('innerHTML')}</div>
                                </div>`;
                }
            });
            if (nav) {
                let html = `<div class="tabs-panel" style="${tabStyle}" ${tabAttrs}>
                                <ul class="nav nav-tabs col-12" role="tablist">${nav}</ul>
                                <div class="tab-content col-12">${content}</div>
                            </div>`;
                tabs.replaceWith(html);
            } else {
                tabs.remove();
            }
        });
    },
    /**
     * 更新控件状态，t-visible,t-readonly
     * @private
     */
    _updateEditorState: function () {
        let me = this, toUpdate = me.dom.find('[t-visible],[t-readonly]');
        if (toUpdate.length > 0) {
            let data = me.getData();
            data.id = data.id || me.dataId;
            toUpdate.each(function () {
                let e = $(this), visible = e.attr('t-visible'), readonly = e.attr('t-readonly');
                if (visible) {
                    data.__test_visible = new Function("return " + cqjs.utils.decode(visible));
                    if (data.__test_visible()) {
                        e.show();
                    } else {
                        e.hide();
                    }
                }
                if (readonly) {
                    data.__test_readonly = new Function("return " + cqjs.utils.decode(readonly));
                    let fname = e.attr('form-field'), edt = me.getEditor(fname);
                    if (edt) {
                        edt.setReadonly(data.__test_readonly());
                    }
                }
            });
        }
    },
    /**
     * 注册行选中事件
     * @param handler 处理函数
     */
    onSelected: function (handler) {
        this.dom.on('selected', handler);
    },
    /**
     * 获取表单的字段
     * @returns {[]}
     */
    getFields: function () {
        return this._fields;
    },
    /**
     * 获取当前选中 [id]
     * @returns {[]|[*]|*}
     */
    getSelected: function () {
        return this.sel;
    },
    // 更新grid的按钮
    updateGridToolBar: function (data) {
        let me = this;
        $.each(me.getFields(), function (i, fname) {
            me.getEditor(fname).updateToolbarByParent(data);
        });
    },
    /**
     * 设置值
     * @param data
     */
    setData: function (data, type = '') {
        let me = this;
        me.dataId = data.id || '';
        if (data.id) {
            me.sel = [data.id];
            if (data.id.startsWith('new')) {
                me.dom.find('.log-access').hide();
            } else {
                me.dom.find('.log-access').show();
            }
        } else {
            me.sel = [];
            me.dom.find('.log-access').hide();
        }
        me.loading = true;
        $.each(me.getFields(), function (i, fname) {
            if (type === 'aside') {
                me.getEditor(fname).setData(data.childList[fname], data[fname]);
            } else {
                me.getEditor(fname).setValue(data[fname]);
            }
        });
        me.loading = false;
        me._updateEditorState();
        me.clearInvalid();
        me.dom.triggerHandler("selected", [me, me.sel]);
    },

    /**
     * 设置字段的错误提示
     * @param field
     * @param error
     */
    setInvalid: function (field, error) {
        let me = this;
        me.dom.find('[form-field=' + field + '] .invalid-feedback').html(error).show();
        me.dom.find('[form-field=' + field + '] .form-control').addClass('is-invalid');
    },
    /**
     * 获取所有控件的错误信息
     * @returns {string}
     */
    getErrors: function () {
        let me = this, error = [],
            _valid = function (field) {
                let editor = me.getEditor(field),
                    display = me.dom.find('[form-field=' + field + ']').css('display'),
                    addError = function (err) {
                        if (err) {
                            error.push(editor.dom.attr("data-label") + ":" + err);
                        }
                    };
                if (display == 'none') {
                    return;
                }
                addError(me.requiredValid(editor));
                if (editor.valid) {
                    addError(editor.valid());
                }
            };
        $.each(me.getFields(), function (i, field) {
            _valid(field);
        });
        return error.join("<br/>");
    },
    /**
     * 验证控件输入
     * @param field
     * @returns {boolean}
     */
    valid: function (field) {
        let me = this, v = true,
            _valid = function (fname) {
                let editor = me.getEditor(fname), error = [],
                    display = me.dom.find('[form-field=' + fname + ']').css('display'),
                    addError = function (err) {
                        if (err) {
                            error.push(err);
                        }
                    };
                if (display == 'none') {
                    return;
                }
                addError(me.requiredValid(editor));
                if (editor.valid) {
                    addError(editor.valid());
                }
                if (error.length > 0) {
                    me.setInvalid(fname, error.join(";"));
                    v = false;
                }
            };
        me.clearInvalid(field);
        if (field) {
            _valid(field);
        } else {
            $.each(me.getFields(), function (i, fname) {
                _valid(fname);
            });
        }
        return v;
    },
    /**
     * 清空验证失败的提示
     * @param field
     */
    clearInvalid: function (field) {
        let me = this;
        if (field) {
            me.dom.find('[form-field=' + field + '] .invalid-feedback').empty().hide();
            me.dom.find('[form-field=' + field + '] .form-control').removeClass('is-invalid');
        } else {
            me.dom.find('.invalid-feedback').empty().hide();
            me.dom.find('.form-control').removeClass('is-invalid');
        }
    },
    /**
     * 获取加载的数据，指定field时获取field的数据，没指定时返回整个表单的数据
     * @param field
     * @returns {{}|*}
     */
    getData: function (field) {
        let me = this, data = {};
        if (field) {
            return me.getEditor(field).getValue();
        }
        $.each(me.getFields(), function (i, f) {
            let editor = me.getEditor(f);
            if (!editor.noEdit) {
                data[f] = editor.getValue();
            }
        });
        return data;
    },
    /**
     * 获取脏数据用于提交
     * @param all 是否所有，创建时提交所有数据，修改时只提交修改的数据
     * @returns {{}}
     */
    getDirtyData: function (all) {
        let me = this, data = {};
        $.each(me.getFields(), function (i, f) {
            let editor = me.getEditor(f);
            if (!editor.noEdit && (all || editor.dirty)) {
                if (editor.getDirtyValue) {
                    data[f] = editor.getDirtyValue();
                } else if (editor.getRawValue) {
                    data[f] = editor.getRawValue();
                } else {
                    data[f] = editor.getValue();
                }
            }
        });
        return data;
    },
    /**
     * 清空所有字段的dirty状态
     */
    clean: function () {
        let me = this;
        me.dirty = false;
        $.each(me.getFields(), function (i, field) {
            me.getEditor(field).dirty = false;
        });
    },
    /**
     * 获取存储格式的数据
     * @returns {{}}
     */
    getRawData: function () {
        let me = this, data = {};
        $.each(me.getFields(), function (i, field) {
            let editor = me.getEditor(field);
            if (editor.getRawValue) {
                data[field] = editor.getRawValue();
            } else {
                data[field] = editor.getValue();
            }
        });
        return data;
    },
    /**
     * 获取编辑器
     * @param name
     * @returns {*}
     */
    getEditor: function (name) {
        let e = this.editors[name];
        if (!e) {
            throw new Error("找不到name=[" + name + "]的editor");
        }
        return e;
    },
    /**
     * 创建子数据
     */
    createChild: function () {
        let me = this;
        if (me.treeview) {
            let sel = me.treeview.ztree.getSelectedNodes()[0];
            if (sel) {
                delete view.urlHash.id;
                let data = {};
                $.each(me.getFields(), function () {
                    let field = me.fields[this];
                    if (field.defaultValue) {
                        data[this] = field.defaultValue;
                    }
                });
                data[me.treeview.parentField] = [sel.id, sel[me.treeview.presentField]];
                me.setData(data);
            }
        }
    },
    /**
     * 创建数据
     * @param values
     */
    create: function (values) {
        let me = this, data = {};
        $.each(me.getFields(), function () {
            let field = me.fields[this], val = field.$defaultValue;
            if (val == "env.user") {
                val = env.user;
            } else if (val == "env.company") {
                val = env.company;
            } else if (val == "[env.company]") {
                val = [[4, env.company[0], 0]];
            }
            data[this] = val;
        });
        $.extend(true, data, values);
        me.setData(data);
    },
    /**
     * 加载数据
     */
    load: function () {
        let me = this;
        if (me.treeview) {
            me.treeview.load();
        }
        me.ajax(me, function (r) {
            me.setData(r.data);
            me.clean();
        });
    }
});