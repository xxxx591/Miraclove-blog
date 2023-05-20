cqjs.editor('integer', {
    getTpl: function () {
        return `<input type="number" id="${this.getId()}"
                    ${this.min != null ? ' min="' + this.min + '"' : ''}
                    ${this.max != null ? ' max="' + this.max + '"' : ''}
                    ${this.step != null ? ' step="' + this.step + '"' : ''}/>`;
    },
    buttonsClass: "input-group-text",
    decrementButton: '<i class="fa fa-minus"></i>',
    incrementButton: '<i class="fa fa-plus"></i>',
    init: function () {
        let me = this, dom = me.dom, field = me.field;
        me.name = me.name || dom.attr('data-field') || field.name;
        me.min = dom.attr("min") || field.min;
        me.max = dom.attr("max") || field.max;
        me.step = me.step || dom.attr("step");
        dom.html(me.getTpl());
        me.initSpinner(dom.find("input[type=number]"));
    },
    initSpinner: function (el) {
        let me = this;
        el.inputSpinner({
            buttonsClass: me.buttonsClass,
            decrementButton: me.decrementButton,
            incrementButton: me.incrementButton,
            template: // the template of the input
                '<div class="input-group ${groupClass}">' +
                '<input type="text" inputmode="decimal" style="text-align: ${textAlign}" class="form-control form-control-text-input"/>' +
                '<div class="input-group-prepend"><button style="min-width: ${buttonsWidth}" class="btn btn-decrement ${buttonsClass} btn-minus" type="button">${decrementButton}</button></div>' +
                '<div class="input-group-append"><button style="min-width: ${buttonsWidth}" class="btn btn-increment ${buttonsClass} btn-plus" type="button">${incrementButton}</button></div>' +
                '</div>'
        });
    },
    onValueChange: function (handler) {
        let me = this;
        me.dom.find('input').on('change', function (e) {
            handler(e, me);
        });
    },
    setReadonly: function (readonly) {
        let me = this;
        me.dom.children('input').attr('disabled', readonly);
        if (readonly) {
            me.dom.find("[type=button]").hide();
        } else {
            me.dom.find("[type=button]").show();
        }
    },
    getValue: function () {
        let val = this.dom.children('input').val();
        if (val == '') {
            return null;
        }
        return parseInt(val);
    },
    setValue: function (val) {
        if (val === null) {
            val = undefined;
        }
        if (val != this.getValue()) {
            this.dom.children('input').val(val).trigger('change');
        }
    }
});

cqjs.searchEditor('integer', {
    extends: "editors.integer",
    getCriteria: function () {
        let val = this.getValue();
        if (val) {
            return [[this.name, '=', val]];
        }
        return [];
    },
    getText: function () {
        return this.getValue();
    },
});
