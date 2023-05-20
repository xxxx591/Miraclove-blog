/**
 * web视图
 */
$.component('JWebView', {
    /**
     * 图标，用于视图切换
     */
    icon: {'grid': 'fa-list-ul', 'card': 'fa-th-large'},
    /**
     * 获取视图模板
     * @returns
     */
    getViewTpl: function () {
        let me = this, viewContents = '', getViewType = function () {
            let viewSwitch = '';
            if (me.viewtypes.length > 1) {
                viewSwitch += '<div class="btn-group btn-group-toggle ml-2" data-toggle="buttons">';
                $.each(me.viewtypes, function (i, viewtype) {
                    let active = me.urlHash.viewtype === viewtype || i === 0;
                    viewSwitch += `<label role="radio-view-type" data="${viewtype}" class="btn btn-sm btn-secondary${active ? ' active' : ''}">
                                        <input type="radio" name="options" autocomplete="off"${active ? ' checked="checked"' : ''}/>
                                        <i class="fa ${me.icon[viewtype]}"></i>
                                    </label>`;
                });
                viewSwitch += '</div>';
            }
            return viewSwitch;
        };
        $.each(me.viewtypes, function (i, v) {
            viewContents += '<div role="' + v + '"></div>';
        });
        return `<div class="view-panel">
                    <div class="header">
                        <div class="content-header">
                            <div class="container-fluid">
                                <div role="search"></div>
                            </div>
                            <div class="btn-row">                                
                                <div role="toolbar" class="toolbar"></div>
                                <div class="btn-toolbar float-right toolbar-right">
                                    <div role="pager" class="ml-2"></div>
                                    <div role="view-type">${getViewType()}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="content">
                        <aside role="search-panel" class="left-aside border-right" style="display:none"></aside>
                        <div class="view-content container-fluid">${viewContents}</div>
                    </div>
                </div>`;
    },
    /**
     * 获取表单模板
     * @returns {string}
     */
    getFormTpl: function () {
        return `<div class="form-panel">
                    <div class="content-header">
                        <div class="btn-row">
                            <div class="btn-toolbar">
                                <div role="data-nav" class="ml-2"></div>
                                <div class="back"></div>
                            </div>
                            <div role="form-toolbar" class="toolbar"></div>
                            
                        </div>
                    </div>
                    <div class="content">
                        <div role="form" class="form-content">
                        </div>
                    </div>
                </div>`;
    },
    /**
     * 获取控件模板
     * @returns {string}
     */
    getTpl: function () {
        let me = this, tpl = '';
        if (me.viewtypes.length > 0) {
            tpl += me.getViewTpl();
        }
        if (me.views.form) {
            tpl += me.getFormTpl();
        }
        if (me.views.custom) {
            tpl += '<div class="custom-panel"></div>';
        }
        return tpl;
    },
    /**
     * 构建实例
     * @param opt
     */
    new: function (opt) {
        let me = this;
        cqjs.utils.apply(true, me, opt);
        $.event.trigger("viewLoaded", [me]);
        me.init();
        me.render();
    },
    /**
     * 加载数据
     */
    load: function () {
        let me = this;
        if (me.curView && me.curView.load) {
            me.curView.load();
        }
    },
    /**
     * 控件渲染
     * @param component
     */
    onRender: function (component) {
    },
    /**
     * 视力显示
     * @param component
     */
    onShow: function (component) {
    },
    /**
     * 工具条变更
     * @param toolbar
     */
    onToolbarChange: function (toolbar) {
    },
    /**
     * 渲染查询控件
     */
    renderSearch: function () {
        let me = this;
        me.search = me.dom.find('[role=search]').JSearch({
            model: me.model,
            module: me.module,
            arch: me.views.search.arch,
            fields: me.fields,
            view: me,
            submitting: function (e, search) {
                me.resizeContent();
                me.pager.reset();
                me.load();
            }
        });
        me.resizeContent();
        $(window).on('resize', function () {
            me.resizeContent();
        });
        me.onRender(me.search);
    },
    resizeContent: function () {
        let me = this, h = me.dom.find('.view-panel .header').height();
        me.dom.find('.view-panel .content').css('height', 'calc(100% - ' + h + 'px)');
    },
    /**
     * 渲染分页控件
     */
    renderPager: function () {
        let me = this;
        me.pager = me.dom.find('[role=pager]').JPager({
            limitChange: function (e, pager) {
                if (me.curView) {
                    me.curView.limit = pager.limit;
                }
            },
            pageChange: function (e, pager) {
                me.load();
            },
            counting: function (e, pager) {
                cqjs.rpc({
                    model: me.model,
                    module: me.module,
                    method: "count",
                    args: {
                        criteria: me.search.getCriteria()
                    },
                    onsuccess: function (r) {
                        me.pager.update({
                            total: r.data
                        });
                    }
                });
            }
        });
        me.onRender(me.pager);
    },
    /**
     * 渲染表格控件
     */
    renderGrid: function () {
        let me = this;
        me.grid = me.dom.find('[role=grid]').JGrid({
            model: me.model,
            module: me.module,
            arch: me.views.grid.arch,
            fields: me.fields,
            search: me.search,
            pager: me.pager,
            view: me,
            rowDblClick: function (e, grid, id) {
                me.onDblClick(e, grid, function () {
                    me.toolbar.dom.find("[name='btn_edit']").click();
                });
            },
            selected: function (e, grid, sel) {
                let selected = [];
                $.each(sel, function (i, id) {
                    selected.push(me.data[id]);
                });
                if (me.toolbar) {
                    me.toolbar.update(selected);
                }
            },
            ajax: function (grid, callback, data, settings) {
                me.searchData(grid, callback, data, settings);
            },
            saveEdit: function (grid, id, dirty, data, callback) {
                me.onEditConfirm(grid, id, dirty, function () {
                    me.saveData(grid, id, dirty, function () {
                        callback(true);
                    });
                });
            },
            loadEdit: function (grid, id, callback) {
                me.readData(grid, id, grid.editForm.getFields(), callback);
            },
            delete: function () {
                me.deleteData(this, this.getSelected());
            }
        });
        me.dom.trigger("viewCreated", ['grid', me]);
        me.onRender(me.grid);
    },
    /**
     * 渲染卡片控件
     */
    renderCard: function () {
        let me = this;
        me.card = me.dom.find('[role=card]').JCard({
            model: me.model,
            module: me.module,
            arch: me.views.card.arch,
            fields: me.fields,
            search: me.search,
            pager: me.pager,
            view: me,
            dblClick: function (e, card, id) {
                me.edit(e, card);
            },
            selected: function (e, card, sel) {
                let selected = [];
                $.each(sel, function (i, id) {
                    selected.push(me.data[id]);
                });
                if (me.toolbar) {
                    me.toolbar.update(selected);
                }
            },
            ajax: function (card, callback) {
                me.searchData(card, callback);
            },
            delete: function () {
                me.deleteData(this, this.getSelected());
            }
        });
        me.dom.trigger("viewCreated", ['card', me]);
        me.onRender(me.card);
    },
    /**
     * 渲染表单控件
     */
    renderForm: function () {
        let me = this,
            back = me.viewtype;
        me.form = me.dom.find('[role=form]').JForm({
            arch: me.views.form.arch,
            model: me.model,
            module: me.module,
            fields: me.fields,
            view: me,
            treeSelected: function (e, tree, sel) {
                if (me.toolbar) {
                    me.toolbar.update(sel);
                }
            },
            selected: function (e, form, sel) {
                if (me.toolbar) {
                    let data = sel.length > 0 ? form.getData() : {};
                    if (form.dataId) {
                        data.id = form.dataId;
                    }
                    me.toolbar.update([data]);
                }
            },
            ajax: function (form, callback) {
                if (me.urlHash.id) {
                    me.readData(form, me.urlHash.id, me.form.getFields(), callback);
                } else {
                    let data = me.newData(me.form, me, function (data) {
                        me.form.create(data);
                    });
                    if (data != undefined) {
                        me.form.create(data);
                    }
                }
            },
            save: function () {
                let form = this;
                if (!form.valid()) {
                    let errors = form.getErrors();
                    cqjs.msg.error({code: 1000, message: errors});
                    return;
                }
                let data = form.getDirtyData(!me.urlHash.id);
                me.saveData(form, me.urlHash.id, data, function (r) {
                    if (!me.urlHash.id) {
                        me.urlHash.id = r.data;
                        window.location.hash = $.param(me.urlHash);
                    }
                    me.load();
                });
            },
            delete: function () {
                me.deleteData(this, [this.dataId], function () {
                    delete me.urlHash.id;
                    window.location.hash = $.param(me.urlHash);
                });
            }
        });
        if (me.viewtypes.length > 0) {
            me.dom.find('.form-panel .back').append(`<button role="form-close" class="btn" type="button" >${'返回'.t()}</button>`);
            me.dom.find('[role=form-close]').on('click', function () {
                me.changeView(back || me.urlHash.view.split(',')[0]);
            });
        }
        me.dom.trigger("viewCreated", ['form', me]);
        me.onRender(me.form);
    },
    /**
     * 渲染自定义控件
     */
    renderCustom: function () {
        let me = this;
        me.custom = me.dom.find('.custom-panel').JCustom({
            model: me.model,
            module: me.module,
            arch: me.views.custom.arch,
            fields: me.fields,
            view: me,
        });
        me.dom.trigger("viewCreated", ['custom', me]);
        me.onRender(me.custom);
    },
    /**
     * 渲染控件
     */
    render: function () {
        let me = this;
        me.urlHash = cqjs.web.getParams(window.location.hash.substring(1));
        me.viewtypes = me.urlHash.view.split(',');
        me.viewkey = me.urlHash.key;
        me.viewtypes.remove('form');
        me.viewtypes.remove('custom');
        me.dom.html(me.getTpl())
            .find('[role=radio-view-type]').on('click', function (i) {
            let viewtype = $(this).attr('data');
            if (viewtype != me.viewtype) {//click触发两次
                me.changeView(viewtype);
            }
        });
        if (me.viewtypes.length > 0) {
            if (!me.search) {
                me.renderSearch();
            }
            if (!me.pager) {
                me.renderPager();
            }
        }
        me.data = {};
        me.changeView();
        me.dom.trigger("render", [me]);
    },
    /**
     * 切换视图
     * @param viewtype
     */
    changeView: function (viewtype) {
        let me = this;
        let m = viewtype || me.urlHash.viewtype;
        if (!m && me.urlHash.view) {
            m = me.urlHash.view.split(',')[0];
        }
        let changed = me.viewtype !== m;
        if (changed) {
            if (m === 'grid') {
                me.showGridView();
            } else if (m === 'card') {
                me.showCardView();
            } else if (m === 'form') {
                me.showForm();
            } else if (m === 'custom') {
                me.showCustom();
            }
            me.viewtype = m;
            me.urlHash.viewtype = me.viewtype;
            me.dom.trigger("viewChanged", [me.viewtype, me]);
        }
        me.updateHash();
        return changed;
    },
    /**
     * 更新url地址#
     */
    updateHash: function () {
        let me = this;
        window.location.hash = $.param(me.urlHash);
        let p = cqjs.web.getParams(top.window.location.hash.substring(1));
        if (p.u) {
            p.u = window.location.pathname + '#' + $.param($.extend($.param(unescape(p.u)), me.urlHash));
        }
        top.window.location.hash = $.param(p);
    },
    /**
     * 显示指定视图
     * @param name
     */
    showView: function (name) {
        let me = this;
        me.dom.find('.form-panel,.custom-panel').hide();
        me.dom.find('.view-panel').show();
        $.each(me.viewtypes, function (i, v) {
            me.dom.find('[role=' + v + ']').hide();
        });
        me.dom.find('[role=' + name + ']').show();
    },
    /**
     * 显示自定义视图
     */
    showCustom: function () {
        let me = this;
        if (!me.custom) {
            me.renderCustom();
        }
        me.curView = me.custom;
        me.dom.find('.custom-panel').show();
        me.dom.find('.view-panel,.form-panel').hide();
    },
    /**
     * 显示表格视图
     */
    showGridView: function () {
        let me = this;
        if (!me.grid) {
            me.renderGrid();
        } else {
            me.pager.limit = me.grid.limit;
            me.grid.load();
        }
        me.toolbar = me.dom.find('[role=toolbar]').JToolbar({
            arch: me.grid.tbarArch,
            auths: me.auths,
            defaultButtons: 'create|edit|delete|export|import',
            target: me.grid,
            view: me,
        });
        me.onToolbarChange(me.toolbar);
        me.curView = me.grid;
        me.showView('grid');
        me.onShow(me.grid);
        me.resizeContent();
    },
    /**
     * 显示卡片视图
     */
    showCardView: function () {
        let me = this;
        if (!me.card) {
            me.renderCard();
        } else {
            me.pager.limit = me.card.limit;
            me.card.load();
        }
        me.toolbar = me.dom.find('[role=toolbar]').JToolbar({
            arch: me.card.tbarArch,
            auths: me.auths,
            defaultButtons: 'create|edit|delete|export',
            target: me.card,
            view: me,
        });
        me.resizeContent();
        me.onToolbarChange(me.toolbar);
        me.curView = me.card;
        me.showView('card');
        me.onShow(me.card);
    },
    /**
     * 显示表单视图
     */
    showForm: function () {
        let me = this;
        if (!me.form) {
            me.renderForm();
        }
        me.toolbar = me.dom.find('[role=form-toolbar]').JToolbar({
            arch: me.form.tbarArch,
            auths: me.auths,
            defaultButtons: me.form.isTree ? 'create|createChild|save|delete' : 'create|save',
            target: me.form,
            view: me,
        });
        me.onToolbarChange(me.toolbar);
        me.curView = me.form;
        me.dom.find('.form-panel').show();
        me.dom.find('.view-panel,.custom-panel').hide();
        me.form.load();
        me.onShow(me.form);
    },
    /**
     * 获取选中数据
     * @returns {*}
     */
    getSelected: function () {
        return this.curView.getSelected();
    },
    /**
     * 显示加载中，请稍等
     * @param busy
     */
    busy: function (busy) {
        if (busy) {
            $(document.body).append(`<div id="pageWaitingModal" class="modal" data-keyboard="false" data-backdrop="static" data-role="dialog" aria-labelledby="pageWaitingModalLabel" aria-hidden="true">
                                        <div id="loading" class="loading">${'加载中,请稍等'.t()}</div>
                                    </div>`);
            $('#pageWaitingModal').modal('show');
        } else {
            $('#pageWaitingModal').modal('hide').remove();
        }
    },
    /**
     * 读取指定id的数据
     * @param target 目标控件
     * @param id id
     * @param fields 要读取的字段
     * @param callback 回调函数
     */
    readData: function (target, id, fields, callback) {
        let me = this;
        if (id) {
            cqjs.rpc({
                model: me.model,
                module: me.module,
                method: "read",
                args: {
                    ids: [id],
                    fields: fields
                },
                context: {
                    usePresent: true
                },
                onsuccess: function (r) {
                    callback({data: r.data[0]});
                }
            });
        } else {
            callback({data: {}});
        }
    },
    /**
     * 查询数据
     * @param target 目标控件
     * @param callback 回调函数
     */
    searchData: function (target, callback) {
        let me = this;
        cqjs.rpc({
            model: me.model,
            module: me.module,
            method: "search",
            args: {
                criteria: me.search.getCriteria(),
                nextTest: true,
                offset: me.pager.getOffset(),
                limit: me.pager.getLimit(),
                fields: target.getFields(),
                order: target.getSort()
            },
            context: {
                usePresent: true
            },
            onsuccess: function (r) {
                if (r.data.values.length > 0) {
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
                me.data = {};
                $.each(r.data.values, function (i, v) {
                    me.data[v['id']] = v;
                });
            }
        });
    },
    /**
     * 保存数据
     * @param target 目标控件
     * @param id id
     * @param data 数据
     * @param callback 回调函数
     */
    saveData: function (target, id, data, callback) {
        let me = this;
        me.busy(true);
        if (id) {
            cqjs.rpc({
                model: me.model,
                module: me.module,
                method: "update",
                args: {
                    ids: [id],
                    values: data,
                },
                onerror: function (e) {
                    me.busy(false);
                    cqjs.msg.error(e);
                },
                onsuccess: function (r) {
                    me.busy(false);
                    cqjs.msg.show('保存成功'.t());
                    callback(r);
                }
            });
        } else {
            cqjs.rpc({
                model: me.model,
                module: me.module,
                method: "create",
                args: data,
                onerror: function (e) {
                    me.busy(false);
                    cqjs.msg.error(e);
                },
                onsuccess: function (r) {
                    me.busy(false);
                    cqjs.msg.show('保存成功'.t());
                    callback(r);
                }
            });
        }
    },
    /**
     * 删除数据
     * @param target 目标控件
     * @param ids 要删除的id
     * @param callback 回调函数
     */
    deleteData: function (target, ids, callback) {
        let me = this;
        cqjs.rpc({
            model: me.model,
            module: me.module,
            method: 'delete',
            args: {
                ids: ids
            },
            onsuccess: function (r) {
                cqjs.msg.show('删除成功'.t());
                delete me.urlHash.id;
                me.load();
                if (callback) {
                    callback();
                }
            }
        });
    },
    /**
     * 保存按钮事件
     * @param e
     * @param target 目标控件
     */
    save: function (e, target) {
        target.save();
    },
    /**
     * 删除按钮事件
     * @param e
     * @param target 目标控件
     */
    delete: function (e, target) {
        target.delete();
    },
    /**
     * 编辑按钮事件
     * @param e
     * @param target 目标控件
     */
    edit: function (e, target) {
        let me = this;
        if (target.editable) {
            target.edit();
        } else {
            me.urlHash.id = me.getSelected()[0];
            if (!me.changeView('form')) {
                me.form.load();
            }
        }
    },
    /**
     * 初始化新数据，用于创建时提供默认数据
     * @param target 目标控件
     * @param view 视图
     * @param callback
     * @returns {{}}
     */
    newData: function (target, view, callback) {
        return {};
    },
    /**
     * 创建按钮事件
     * @param e
     * @param target 目标控件
     * @param view
     */
    create: function (e, target, view) {
        let me = this;
        if (target.editable) {
            let data = me.newData(target, view, function (data) {
                target.create(data);
            });
            if (data != undefined) {
                target.create(data);
            }
        } else {
            delete me.urlHash.id;
            if (!me.changeView('form')) {
                me.form.load();
            }
        }
    },
    /**
     * 连续创建按钮事件
     * @param e
     * @param target 目标控件
     * @param view
     */
    creating: function (e, target, view) {
        let me = this;
        let data = me.newData(target, view, function (data) {
            target.create(data, function () {
                me.creating(e, target, view);
            });
        });
        if (data != undefined) {
            target.create(data, function () {
                me.creating(e, target, view);
            });
        }
    },
    /**
     * 创建子按钮事件
     * @param e
     * @param target 目标控件
     */
    createChild: function (e, target) {
        let me = this;
        me.changeView('form');
        me.form.createChild();
    },
    /**
     * 复制按钮事件
     * @param e
     * @param target 目标控件
     */
    copy: function (e, target) {
        let me = this, ids = me.getSelected();
        me.busy(true);
        delete me.urlHash.id;
        me.changeView('form');
        cqjs.rpc({
            model: me.model,
            module: me.module,
            method: "copy",
            args: {
                ids: ids,
                defaultValues: {}
            },
            onerror: function (e) {
                me.busy(false);
                cqjs.msg.error(e);
            },
            onsuccess: function (r) {
                me.urlHash.id = r.data[0];
                me.busy(false);
                cqjs.msg.show('保存成功'.t());
                window.location.hash = $.param(me.urlHash);
                me.form.load();
            }
        });
    },
    /**
     * 双击事件
     * @param e
     * @param target 目标控件
     * @param handler 处理函数
     */
    onDblClick: function (e, target, handler) {
        handler();
    },
    /**
     * 数据编辑确定
     * @param target 目标控件
     * @param id id
     * @param data 数据
     * @param handler 处理函数
     */
    onEditConfirm: function (target, id, data, handler) {
        handler();
    },
    /**
     *
     * @param e
     * @param target 目标控件
     */
    import: function (e, target, view) {
        cqjs.create('JImportXls', {
            model: target.model, fields: target.fields, callback: function () {
                view.load();
            }
        });
    },
    export: function (e, target) {
        if (target.table) {
            $.fn.DataTable.ext.buttons.excelHtml5.action.call(
                target.table.buttons(), null, target.table, {}, {
                    header: true,
                    footer: true,
                    extension: ".xlsx",
                    filename: cqjs.web.getParams(top.window.location.hash.substring(1)).t || target.model || "*"
                });
        }
    },
    /**
     * 调用rpc服务
     * @param svc
     * @param ids
     */
    call: function (svc, ids) {
        let me = this;
        if (!ids) {
            ids = me.getSelected();
        }
        me.busy(true);
        cqjs.rpc({
            model: me.model,
            module: me.module,
            method: svc,
            args: {
                ids: ids
            },
            onerror: function (e) {
                me.busy(false);
                cqjs.msg.error(e);
            },
            onsuccess: function (r) {
                me.busy(false);
                let d = r.data || {};
                if (d.message) {
                    cqjs.msg.show(d.message);
                }
                if (d.action === 'js') {
                    eval(d.script);
                } else if (d.action === 'reload') {
                    me.load();
                } else if (d.action === 'service') {
                    //TODO
                } else if (d.action === 'dialog') {
                    //TODO
                } else if (d.action === 'view') {
                    //TODO
                }
            }
        });
    }
});


window.loadWebView = function () {
    let me = this, ps = cqjs.web.getParams(window.location.hash.substring(1));
    $('title').text(cqjs.web.getParams(top.window.location.hash.substring(1)).t || ps.model);
    cqjs.rpc({
        model: "ir.ui.view",
        method: "loadView",
        args: {
            model: ps.model,
            type: ps.view,
            key: ps.key
        },
        onsuccess: function (r) {
            if (r.data.resource) {
                $("head").append(r.data.resource);
            }
            window.env = {
                user: [cqjs.web.cookie('ctx_user'), cqjs.web.cookie('env_user')],
                company: [cqjs.web.cookie('ctx_company'), cqjs.web.cookie('env_company')]
            };
            window.view = $('body').JWebView(r.data);
        }
    });
}
$(function () {
    loadWebView();
    if (window.history && window.history.pushState) {
        $(window).on('popstate', function () {
            if (window.view) {
                window.view.urlHash = cqjs.web.getParams(window.location.hash.substring(1));
                window.view.changeView();
            }
        });
    }
    $('html,body').css("height", "100%");
    $(document).on('click', function () {
        top.window.$('.dropdown-menu').removeClass('show');
    });
});
