cqjs.editors = {};
cqjs.searchEditors = {};
cqjs.component("editors.Editor", {
    getId: function () {
        let me = this;
        if(!me.id) {
            if (me.owner && me.owner.model) {
                me.id = me.owner.model.replaceAll('\.', "_");
            }
            if (me.name) {
                me.id = me.id + "-" + me.name;
            }
            me.id += "-" + cqjs.nextId();
        }
        return me.id;
    },
    getRawValue: function () {
        return this.getValue();
    },
    getValue: cqjs.emptyFn,
    setValue: cqjs.emptyFn,
    onValueChange: cqjs.emptyFn,
    setReadonly: cqjs.emptyFn,
    valid: cqjs.emptyFn,
});
cqjs.editor = function (name, define) {
    if (typeof define === "function") {
        define = define();
    }
    define.extends = define.extends || 'editors.Editor';
    cqjs.editors[name] = cqjs.component('editors.' + name, define);
}
cqjs.searchEditor = function (name, define) {
    if (typeof define === "function") {
        define = define();
    }
    define.extends = define.extends || 'editors.Editor';
    cqjs.searchEditors[name] = cqjs.component('searchEditors.' + name, define);
}
/**
 * 只显示文本, 不能编辑
 */
cqjs.editor('span', {
    noEdit: true,
    getTpl: function () {
        return `<input type="text" readonly class="form-control" id="${this.name + '-' + cqjs.nextId()}"/>`;
    },
    init: function () {
        let me = this;
        me.dom.html(me.getTpl());
    },
    setValue: function (value) {
        let me = this;
        if (me.field.type == 'many2one') {
            if (value && value[0]) {
                me.dom.find('input').attr("data", value).val(value[1]);
            } else {
                me.dom.find('input').removeAttr("data").val('');
            }
        } else {
            if (value === null || value === undefined) {
                value = '';
            }
            me.dom.find('input').val(value);
        }
    },
    getValue: function () {
        let me = this;
        if (me.field.type == 'many2one') {
            let data = me.dom.attr("data");
            if (data) {
                return [data, me.dom.find('input').val()];
            }
            return null;
        } else {
            return me.dom.find('input').val();
        }
    },
    getRawValue: function () {
        let me = this;
        if (me.field.type == 'many2one') {
            return me.dom.find('input').attr("data");
        } else {
            return me.dom.find('input').val();
        }
    }
});