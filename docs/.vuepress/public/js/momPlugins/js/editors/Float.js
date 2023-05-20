cqjs.editor('float', {
    extends: "editors.integer",
    getTpl: function (o) {
        return `<input type="number" id="${this.getId()}"
                    ${this.min != null ? ' min="' + this.min + '"' : ''}
                    ${this.max != null ? ' max="' + this.max + '"' : ''}
                    ${this.step != null ? ' step="' + this.step + '"' : ''}
                    ${this.decimals ? ' data-decimals="' + this.decimals + '"' : ''}/>`;
    },
    init: function () {
        var me = this, dom = me.dom, field = me.field;
        me.name = me.name || dom.attr('data-field') || field.name;
        me.min = dom.attr("min") || field.min;
        me.max = dom.attr("max") || field.max;
        me.step = me.step || dom.attr("step");
        me.decimals = me.decimals || dom.attr('decimals') || "2";
        dom.html(me.getTpl());
        me.initSpinner(dom.find("input[type=number]"));
    },
    getValue: function () {
        let val = this.dom.children('input').val();
        if (val == '') {
            return val;
        }
        return parseFloat(val);
    },
});

cqjs.searchEditor('float', {
    extends: "editors.float",
    getCriteria: function () {
        var val = this.getValue();
        if (val) {
            return [[this.name, '=', val]];
        }
        return [];
    },
    getText: function () {
        return this.getValue();
    },
});