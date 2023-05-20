cqjs.editor('char', {
    getTpl: function () {
        return `<input type="text" class="form-control" id="${this.getId()}"/>`;
    },
    init: function () {
        let me = this, dom = me.dom, field = me.field, placeholder = dom.attr('placeholder');
        me.name = me.name || dom.attr('data-field') || field.name;
        me.trim = eval(me.trim || dom.attr('trim') || field.trim);
        me.length = eval(me.length || dom.attr('length') || field.length);
        dom.html(me.getTpl());
        if (placeholder) {
            dom.find('input').attr('placeholder', cqjs.utils.decode(placeholder));
        }
    },
    onValueChange: function (handler) {
        let me = this;
        me.dom.find('input').on('change', function (e) {
            handler(e, me);
        });
    },
    setReadonly: function (val) {
        if (val) {
            this.dom.children('input').attr('readonly', true);
        } else {
            this.dom.children('input').removeAttr('readonly');
        }
    },
    getValue: function () {
        var val = this.dom.children('input').val();
        if (this.trim) {
            val = val.trim();
        }
        return val;
    },
    setValue: function (v) {
        if (v != this.getValue()) {
            this.dom.children('input').val(v).trigger('change');
        }
    },
    valid: function () {
        var me = this, val = this.getValue();
        if (val.length > me.length) {
            return '当前长度'.t() + val.length + "超过最大长度".t() + me.length;
        }
    }
});

cqjs.searchEditor('char', {
    extends: "editors.char",
    getCriteria: function () {
        var val = this.getValue(), vals = val.split(';');
        if (vals.length > 1) {
            return [[this.name, 'in', vals]];
        }
        if (val) {
            return [[this.name, 'like', val]];
        }
        return [];
    },
    getText: function () {
        return this.getValue();
    },
});