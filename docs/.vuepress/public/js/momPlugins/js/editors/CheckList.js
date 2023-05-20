cqjs.editor('checklist', {
    getTpl: function () {
        let me = this, html = `<div class="form-checkboxs" id="${this.getId()}">`;
        for (const key in me.options) {
            let itemId = me.name + '-' + cqjs.nextId();
            html += `<span>
                        <input type="checkbox" class="form-check-input" id="${itemId}" data-key="${key}">
                        <label class="form-check-label" for="${itemId}">${me.options[key]}</label>
                    </span>`;
        }
        html += "</div>"
        return html;
    },
    init: function () {
        let me = this, dom = me.dom, field = me.field;
        me.name = me.name || dom.attr('data-field') || field.name;
        if (field.type === 'many2one') {
            //TODO 加载options
        } else {
            me.options = eval(dom.attr('options')) || field.options;
            dom.html(me.getTpl());
        }
    },
    onValueChange: function (handler) {
        let me = this;
        me.dom.on('change', function (e) {
            handler(e, me);
        });
    },
    setReadonly: function (v) {
        if (v) {
            this.dom.find('input').attr('readonly', true);
        } else {
            this.dom.find('input').removeAttr('readonly');
        }
    },
    getValue: function () {
        let me = this, values = [];
        me.dom.find("input[type=checkbox]").each(function () {
            let cbx = $(this);
            if (cbx.is(":checked")) {
                values.push(cbx.attr('data-key'));
            }
        });
        return values.join();
    },
    setValue: function (value) {
        let me = this;
        if (value != this.getValue()) {
            me.dom.find('input').prop("checked", false);
            if (value) {
                let values = value.split(',');
                for(let v of values){
                    me.dom.find("input[data-key=" + v + "]").prop('checked', true);
                }

            }
            me.dom.trigger('change');
        }
    },
});

cqjs.searchEditor('checklist', {
    extends: "editors.checklist",
    getCriteria: function () {
        let me = this, values = [];
        me.dom.find("input[type=checkbox]").each(function () {
            let cbx = $(this);
            if (cbx.is(":checked")) {
                values.push(cbx.attr('data-key'));
            }
        });
        if (values.length > 0) {
            return [[this.name, 'in', values]];
        }
        return [];
    },
    getText: function () {
        let me = this, values = [];
        me.dom.find("input[type=checkbox]").each(function () {
            let cbx = $(this);
            if (cbx.is(":checked")) {
                values.push(cbx.next('label').html());
            }
        });
        return values.join();
    },
});