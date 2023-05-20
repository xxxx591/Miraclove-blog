/**
 * 查询控件
 * arch:
 *  <search>
 *      <fixed>
 *          <field name="..."/>
 *      </fixed>
 *      <field name="..."/>
 *      <aside>
 *          <field name="..."/>
 *      </aside>
 *  </search>
 */
$.component("JSearch", {
    /**
     * 获取控件模板
     * @returns
     */
    getTpl: function () {
        return `<div class="jsearch">
                    <div class="input-group">
                        <div class="input-group-prepend">
                            <button data-btn="submit" type="button" class="btn btn-search">
                                <i class="fa fa-search"></i>
                            </button>
                        </div>
                        <div class="jsearch-container">
                            <span class="jsearch-selection">
                                <ul class="jsearch-selection-body"></ul>
                            </span>
                        </div>
                        <div class="input-group-append">
                            <button type="button" class="btn btn-search dropdown-toggle" data-btn="dropdown">${'过滤'.t()}</button>
                            <div class="container-fluid dropdown-menu search-dropdown" style="min-width:300px">
                                <div class="search-form"></div>
                                <div class="card-footer">
                                    <button data-btn="clear" class="btn btn-outline-secondary" style="margin-right:5px">${'清空'.t()}</button>
                                    <button data-btn="reset" class="btn btn-outline-secondary" style="margin-right:5px">${'重置'.t()}</button>
                                    <button data-btn="confirm" class="btn btn-info float-right" style="min-width:100px">${'确定'.t()}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="jsearch-fixed">
                    </div>
                </div>`;
    },
    /**
     * 初始化控件
     */
    init: function () {
        let me = this, dom = me.dom;
        me.query = {};
        me.editors = {};
        me._fields = [];
        dom.html(me.getTpl())
            .on('click', '.jsearch-selection', function (e) {
                me.showDropdown();
                e.preventDefault();
                e.stopPropagation();
            }).on('click', '[data-btn=clear]', function () {
            me.clear();
            dom.triggerHandler("submitting", [me]);
        }).on('click', '[data-btn=reset]', function () {
            me.reset();
            dom.triggerHandler("submitting", [me]);
        }).on('click', '[data-btn=confirm]', function () {
            me.confirm();
        }).on('click', '[data-btn=submit]', function () {
            me._updateCriteria();
            dom.triggerHandler("submitting", [me]);
        }).on('click', '[data-btn=dropdown]', function (e) {
            me.showDropdown();
            e.preventDefault();
            e.stopPropagation();
        });
        me.dropdown = dom.find('.search-dropdown');
        me.body = dom.find('.jsearch-selection-body');
        $(document).on('mousedown', function (e) {
            if ($(e.target).closest('.search-dropdown').length == 0) {
                me.hideDropdown();
            }
        });
        me.initEditors();
        me.onSubmitting(me.submitting);
        me.dom.on('keyup', 'input,select', function (e) {
            if (e.keyCode == 13) {
                me.confirm();
            }
        });
        $.event.trigger("searchReady", [me]);
    },
    clear: function () {
        let me = this;
        $.each(me._fields, function (i, field) {
            me.editors[field].setValue('');
        });
        me._updateCriteria();
    },
    /**
     * 确定条件
     */
    confirm: function () {
        let me = this;
        me._updateCriteria();
        me.dropdown.removeClass('show');
        me.dom.triggerHandler("submitting", [me]);
        me.hideDropdown();
    },
    /**
     * 注册提交事件
     * @param handler
     */
    onSubmitting: function (handler) {
        this.dom.on("submitting", handler);
    },
    /**
     * 显示下拉条件
     */
    showDropdown: function () {
        let me = this, el = me.dom.find('.dropdown-menu');
        $(".toolbar div").each((index, element) => {
            if (element.className.indexOf('show') > -1) {
                element.children[1].click()
            }
        })
        el.show().addClass('show');
        el.find('input:first').focus();

    },
    /**
     * 隐藏下拉条件
     */
    hideDropdown: function () {
        let me = this, el = me.dom.find('.search-dropdown');
        el.hide().removeClass('show');
    },
    /**
     * 初始化aside布局
     * @param arch
     */
    initAside: function (arch) {
        let me = this, searchPanel = arch.find('aside');
        if (searchPanel.length > 0) {
            me.panel = $("[role=search-panel]").show().JSearchPanel({
                arch: searchPanel.prop("outerHTML"),
                model: me.model,
                module: me.module,
                fields: me.fields,
                selected: function (e, panel, node) {
                    me.dom.triggerHandler("submitting", [me]);
                },
                ajax: function (panel, callback) {
                    cqjs.rpc({
                        model: me.model,
                        module: me.module,
                        method: "searchRelated",
                        args: {
                            relatedField: panel.field.name,
                            options: {
                                criteria: panel.getSelect(),
                                fields: panel.getFields(),
                                limit: panel.limit
                            }
                        },
                        onsuccess: function (r) {
                            r.data.values.splice(0, 0, {present: '全部'.t(), id: 'all'});
                            callback(r.data.values);
                        }
                    });
                }
            });
            me.panel.load();
        }
        searchPanel.remove();
    },
    /**
     * 初始化下拉条件
     * @param arch
     */
    initDropdown: function (arch) {
        let me = this, form = '<div class="row">';
        let fields = arch.children('field');
        let col = arch.col || (fields.length <= 3 ? 1 : fields.length <= 6 ? 2 : 3);
        me.dropdown.addClass('col-md-' + (col * 4));
        let forms = [];
        for (let i = 0; i < col; i++) {
            forms[i] = '<div class="col-md-' + (12 / col) + ' form-horizontal"><div class="card-body">';
        }
        fields.each(function (i, e) {
            let el = $(e),
                name = el.attr('name'),
                field = me.fields[name] || {};
            if (!field.deny) {
                let label = el.attr('label'),
                    val = el.attr('default') || el.attr('defaultValue'),
                    op = el.attr('op'),
                    criteria = el.attr('criteria'),
                    editor = el.attr('editor');
                if (!label) {
                    label = field.label || field.name || name;
                }
                label = label.t();
                name = name.replaceAll('\.', '__');
                me._fields.push(name);
                let html = '<div class="form-group"><label>' + label + '</label>'
                    + '<div data-label="' + label + '"'
                    + (val ? ' data-default="' + val + '"' : '')
                    + (op ? ' data-op="' + op + '"' : '')
                    + (editor ? ' data-editor="' + editor + '"' : '')
                    + (criteria ? ' data-criteria="' + cqjs.utils.encode(criteria) + '"' : '')
                    + ' data-field="' + name + '"></div></div>';
                forms[i % col] += html;
            }
        });
        for (let i = 0; i < col; i++) {
            form += forms[i] + '</div></div>';
        }
        form += '</div>';
        me.dropdown.prepend(form);
    },
    /**
     * 初始化固定条件
     * @param arch
     */
    initFixed: function (arch) {
        let me = this, fixed = arch.children("fixed");
        if (fixed.length > 0) {
            let html = '';
            fixed.children("field").each(function (i, e) {
                let el = $(e),
                    name = el.attr('name'),
                    field = me.fields[name] || {};
                if (!field.deny) {
                    let label = el.attr('label'),
                        val = el.attr('default'),
                        op = el.attr('op'),
                        criteria = el.attr('criteria'),
                        attrs = "",
                        editor = el.attr('editor');
                    if (!label) {
                        label = field.label || field.name || name;
                    }
                    $.each(this.attributes, function (i, attr) {
                        let v = cqjs.utils.encode(attr.value);
                        if (['name', 'editor'].indexOf(attr.name) == -1) {
                            attrs += attr.name + '="' + v + '" ';
                        }
                    });
                    label = label.t();
                    name = name.replaceAll('\.', '__');
                    me._fields.push(name);
                    html += `<label>${label}</label>
                        <div ${attrs} data-label="${label}" ${val ? ' data-default="' + val + '"' : ''}
                            ${op ? ' data-op="' + op + '"' : ''}
                            ${editor ? ' data-editor="' + editor + '"' : ''}
                            ${criteria ? ' data-criteria="' + cqjs.utils.encode(criteria) + '"' : ''}
                            data-field="${name}"></div>`;
                }
            });
            me.dom.find('.jsearch-fixed').html(html);
        } else {
            me.dom.find('.jsearch-fixed').hide();
        }
    },
    /**
     * 初始化查询控件
     */
    initEditors: function () {
        let me = this;
        if (me.arch) {
            let arch = cqjs.utils.parseXML(me.arch).children('search');
            me.initAside(arch);
            me.initFixed(arch);
            me.initDropdown(arch);
            me.criteria = eval(arch.attr('criteria'));
            me.dom.find('[data-field]').each(function () {
                let el = $(this),
                    fname = el.attr('data-field'),
                    field = me.fields[fname] || {},
                    editor = el.attr('data-editor') || field.type,
                    ctl = cqjs.searchEditors[editor];
                if (!ctl) {
                    throw new Error('找不到编辑器:' + editor);
                }
                me.editors[fname] = new ctl({
                    dom: el,
                    field: field,
                    model: me.model,
                    module: me.module,
                    owner: me,
                    allowNull: true,
                    op: el.attr('data-op'),
                    criteria: el.attr('data-criteria'),
                    label: el.attr('data-label')
                });
            });
        }
        me.reset();
    },
    /**
     * 更新查询条件
     * @private
     */
    _updateCriteria: function () {
        let me = this;
        me.query = {};
        me.body.empty();
        $.each(me._fields, function (i, field) {
            let editor = me.editors[field];
            if (editor.criteria) {
                let val = editor.getRawValue ? editor.getRawValue() : editor.getValue();
                let hasValue = val;
                if ($.isArray(val)) {
                    hasValue = val.length;
                }
                if (hasValue) {
                    let expr = cqjs.utils.decode(editor.criteria),
                        f = new Function("value", "return " + expr + ";");
                    let criteria = f(val);
                    me.add(field, editor.label, editor.getText(), criteria);
                }
            } else {
                let criteria = editor.getCriteria();
                if (criteria.length > 0) {
                    me.add(field, editor.label, editor.getText(), criteria);
                }
            }
        });
    },
    /**
     * 重置查询
     */
    reset: function () {
        let me = this;
        $.each(me._fields, function (i, field) {
            me.editors[field].setValue('');
        });
        me.dom.find('[data-default]').each(function () {
            let e = $(this),
                val = e.attr('data-default'),
                fname = e.attr('data-field'),
                editor = me.editors[fname];
            if (val == "env.user") {
                val = env.user;
            } else if (val == "env.company") {
                val = env.company;
            }else if (val == "[env.company]") {
                val = [env.company];
            }
            editor.setValue(val);
        });
        me._updateCriteria();
    },
    /**
     * 添加条件显示
     * @param field
     * @param label
     * @param text
     * @param expr
     */
    add: function (field, label, text, expr) {
        let me = this;
        me.query[field] = expr;
        let svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512"><path d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208s208-93.31 208-208S370.69 48 256 48zm75.31 260.69a16 16 0 1 1-22.62 22.62L256 278.63l-52.69 52.68a16 16 0 0 1-22.62-22.62L233.37 256l-52.68-52.69a16 16 0 0 1 22.62-22.62L256 233.37l52.69-52.68a16 16 0 0 1 22.62 22.62L278.63 256z" fill="currentColor"></path></svg>`
        let html = `
            <li class="jsearch-choice"  data-field="${field}">
                <p class="filter-name">${label}</p>
                <p class="filter-value"><span>${text}</span><span class="jsearch-choice-remove" role="presentation">${svg}</span></p>
            </li>
        `;
        me.body.append(html);
        let el = me.body.find('[data-field=' + field + ']');
        el.on('click', function (e) {
            e.stopPropagation();
        });
        el.find('.jsearch-choice-remove').on('click', function (e) {
            me.remove(field);
            me.dom.triggerHandler("submitting", [me]);
            e.stopPropagation();
        });
    },
    /**
     * 显示条件
     * @param field
     */
    remove: function (field) {
        let me = this;
        delete me.query[field];
        me.editors[field].setValue('');
        me.body.find('[data-field=' + field + ']').remove();
    },
    setCriteria: function () {

    },
    /**
     * 获取条件
     * @returns {[]}
     */
    getCriteria: function () {
        let me = this, criteria = [], vals = Object.values(me.query);
        $.each(vals, function () {
            $.each(this, function () {
                criteria.push(this);
            });
        });
        if (me.criteria) {
            $.each(me.criteria, function () {
                criteria.push(this);
            });
        }
        if (me.panel) {
            $.each(me.panel.getCriteria(), function () {
                criteria.push(this);
            });
        }
        return criteria;
    }
});