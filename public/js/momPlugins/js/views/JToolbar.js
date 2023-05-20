$.component("JToolbar", {
    /**
     * 默认按钮
     */
    defaultButtons: 'create|edit|delete|import',
    /**
     * 默认按钮样式
     */
    defaultButtonCss: 'btn-info',
    /**
     * 默认按钮模板
     */
    buttonsTpl: {
        'create': `<button name="create" class="btn-success" t-click="create">${'创建'.t()}</button>`,
        "creating": `<button name="creating" ref="create" type="button" class="btn" t-click="creating">${'连续添加'.t()}</button>`,
        'createChild': `<button name="createChild" auth="create" class="btn-success" t-enable="id" t-click="createChild">${'创建子'.t()}</button>`,
        'copy': `<button name="copy" ref="create" auth="create" t-enable="id" class="btn-success" t-click="copy">${'复制'.t()}</button>`,
        'edit': `<button name="edit" auth="update" class="btn-info" t-enable="id" t-click="edit">${'编辑'.t()}</button>`,
        'delete': `<button name="delete" ref="edit" t-enable="ids" class="btn-danger" t-click="delete" confirm="${'确定删除?'.t()}">${'删除'.t()}</button>`,
        'save': `<button name="save" auth="create|update" class="btn-info" t-click="save">${'保存'.t()}</button>`,
        'import': `<button name="import" auth="create|update" position="after" t-click="import">${'导入'.t()}</button>`,
        'export': `<button name="export" auth="read" position="after" t-click="export">${'导出'.t()}</button>`,
    },
    /**
     * 初始化工具条
     */
    init: function () {
        let me = this, dom = me.dom, tbar = cqjs.utils.parseXML(me.arch).find('toolbar');
        dom.empty();
        if (tbar.length == 0) return;
        let defaultBtns = me.getDefaultButtons(tbar, tbar.attr('buttons') || me.defaultButtons);
        tbar.prepend(defaultBtns[0]);
        tbar.append(defaultBtns[1]);
        tbar.find('button').each(function () {
            let btn = $(this),
                name = btn.attr('name') || btn.attr('service') || '' + cqjs.nextId(),
                auth = btn.attr('auth') || name || '',
                cls = btn.attr('class'),
                allow = me.auths === "@all";
            btn.attr('auth', auth);
            if (!allow) {
                $.each(auth.split('|'), function (idx, item) {
                    if (me.auths.indexOf(item) > -1) {
                        allow = true;
                        return true;
                    }
                });
            }
            if (allow) {
                if (!btn.hasClass('btn')) {
                    btn.addClass('btn');
                }
                if (!cls || cls.indexOf('btn-') == -1) {
                    btn.addClass(me.defaultButtonCss);
                }
                let label = btn.attr('label') || '';
                btn.append(label.t());
                btn.attr('name', 'btn_' + name);
                if (!btn.attr('type')) {
                    btn.attr('type', 'button');
                }
                btn.replaceWith('<div name="btn_' + name + '_group" class="btn-group">' + btn.prop("outerHTML") + '</div>');
            } else {
                btn.replaceWith('');
            }
        });
        tbar.find('button[ref]').each(function () {
            let btn = $(this);
            let ref = btn.attr('ref');
            let group = tbar.find('div[name=btn_' + ref + '_group]');
            if (group.length > 0) {
                btn.attr('class', 'dropdown-item');
                let drop = group.find('dropdown-menu');
                if (drop.length > 0) {
                    drop.append(btn.prop("outerHTML"));
                } else {
                    let cls = group.find('button[name=btn_' + ref + ']').attr('class');
                    cls = cls.replace('disabled', '');
                    group.append('<button type="button" class="' + cls + ' dropdown-toggle dropdown-icon" data-toggle="dropdown"> </button>')
                    group.append('<div class="dropdown-menu" role="menu">' + btn.prop("outerHTML") + '</div>');
                }
                tbar.find('div[name=' + btn.attr('name') + '_group]').remove();
            }
        });
        dom.html(tbar.html())
            .off("click")
            .on("click", 'button[service]', function () {
                let btn = $(this);
                let cfm = btn.attr('confirm');
                if (cfm) {
                    cqjs.msg.confirm({
                        content: cfm,
                        submit: function () {
                            view.call(btn.attr('service'));
                        }
                    });
                } else {
                    view.call(btn.attr('service'));
                }
            }).on('click', '[t-click]', function (e) {
                let btn = $(this);
                let click = btn.attr('t-click');
                let cfm = btn.attr('confirm');
                if (cfm) {
                    cqjs.msg.confirm({
                        content: cfm,
                        submit: function () {
                            let fn = new Function("e", "target", "view", "return this." + click).call(me.view, e, me.target, me.view);
                            if (fn instanceof Function) {
                                fn.call(me.view, e, me.target, me.view);
                            }
                        }
                    });
                } else {
                    let fn = new Function("e", "target", "view", "return this." + click).call(me.view, e, me.target, me.view);
                    if (fn instanceof Function) {
                        fn.call(me.view, e, me.target, me.view);
                    }
                }
            });
        me.update([]);
    },
    /**
     * 更新工具条中按钮状态，根据t-enable计算
     * expr=== parent时，按钮状态只能有父级控制
     * @param data
     */
    update: function (data) {
        this.dom.find('button[t-enable]').each(function () {
            let btn = $(this), expr = btn.attr('t-enable');
            if (expr === 'id') {
                if (data.length != 1) {
                    btn.attr('disabled', true);
                } else {
                    btn.attr('disabled', false);
                }
            } else if (expr === 'ids') {
                if (data.length > 0) {
                    btn.attr('disabled', false);
                } else {
                    btn.attr('disabled', true);
                }
            } else if (expr !== 'parent') {
                let active = true;
                if (expr.startsWith("ids:")) {
                    if (data.length == 0) {
                        active = false;
                    } else {
                        expr = expr.substring(4);
                        for (let i = 0; i < data.length; i++) {
                            let d = data[i];
                            d.__test_active = new Function("return " + expr);
                            if (!d.__test_active()) {
                                active = false;
                                break;
                            }
                        }
                    }
                } else {
                    if (expr.startsWith("id:")) {
                        expr = expr.substring(3);
                    }
                    if (data.length !== 1) {
                        active = false;
                    } else {
                        let d = data[0];
                        d.__test_active = new Function("return " + expr);
                        if (!d.__test_active()) {
                            active = false;
                        }
                    }
                }
                if (active) {
                    btn.attr('disabled', false);
                } else {
                    btn.attr('disabled', true);
                }
            }
        });
    },
    // 父级控制子级按钮状态
    updateByParent: function (data) {

        this.dom.find('button[t-enable]').each(function () {
            let btn = $(this), expr = btn.attr('t-enable');

            if (expr === 'parent') {
                if (data.length > 0) {
                    btn.attr('disabled', false);
                } else {
                    btn.attr('disabled', true);
                }
            }
        })
    },
    /**
     * 获取默认按钮，可通过name覆盖默认按钮
     * @param tbar
     * @param btns
     * @returns {[string,string]}
     */
    getDefaultButtons: function (tbar, btns) {
        let me = this, before = '', after = '', tpl = {}, addBtn = function (name) {
            let btn = tpl[name];
            if (btn) {
                if ('after' == $(btn).attr('position')) {
                    after += btn + '\n';
                } else {
                    before += btn + '\n';
                }
            }
        }, addTpl = function (name) {
            let btn = tbar.find(`[name=${name}]`);
            if (btn.length > 0) {
                tpl[name] = btn.prop("outerHTML");
                btn.remove();
            } else {
                tpl[name] = me.buttonsTpl[name];
            }
        }
        for (let btn of btns.split('|')) {
            if (btn === 'default') {
                for (let defaultBtn of me.defaultButtons.split('|')) {
                    addTpl(defaultBtn);
                }
            } else {
                addTpl(btn);
            }
        }
        for (let btn of btns.split('|')) {
            if (btn === 'default') {
                for (let defaultBtn of me.defaultButtons.split('|')) {
                    addBtn(defaultBtn);
                }
            } else {
                addBtn(btn);
            }
        }
        return [before, after];
    }
});
