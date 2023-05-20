cqjs.editor('date', {
    format: 'YYYY-MM-DD',
    max: '2100-12-31',
    min: '1920-1-1',
    todayBtn: true,
    sideBySide: true,
    getTpl: function () {
        let id = this.getId();
        return `<div class="input-group date-edit" id="${id}" data-target-input="nearest">
                    <input type="text" class="form-control datetimepicker-input" data-target="#${id}" />
                    <div class="input-group-append" data-target="#${id}" data-toggle="datetimepicker">
                        <div class="input-group-text"><i class="fa fa-calendar"></i></div>
                    </div>
                </div>`;
    },
    init: function () {
        let me = this, dom = me.dom, field = me.field;
        me.name = me.name || dom.attr('data-field') || field.name;

        const maxAttr = dom.attr('max')
        const maxDefaultDate = maxAttr && /.*\((.*)\)/.test(maxAttr)? eval(cqjs.utils.decode(maxAttr)):maxAttr;
        me.max = maxDefaultDate || field.max || me.max;

        const minAttr = dom.attr('min')
        const minDefaultDate = minAttr && /.*\((.*)\)/.test(minAttr)? eval(cqjs.utils.decode(minAttr)):minAttr;
        me.min = minDefaultDate || field.min || me.min;

        dom.html(me.getTpl())
            .find('.date-edit').datetimepicker({
                format: me.format,
                locale: moment.locale('zh-cn'),
                minDate: new Date(me.min).format(me.format),
                maxDate: new Date(me.max).format(me.format),
                todayBtn: me.todayBtn,
                sideBySide: me.sideBySide,
            });

    },
    onValueChange: function (handler) {
        let me = this;
        me.dom.find('.date-edit').on('change.datetimepicker', function (e) {
            handler(e, me);
        });
    },
    setReadonly: function (readonly) {
        if (readonly) {
            this.dom.find('input').attr('readonly', true);
            this.dom.find('[data-toggle]').hide();
        } else {
            this.dom.find('input').removeAttr('readonly');
            this.dom.find('[data-toggle]').show();
        }
    },
    getValue: function () {
        let me = this,
            text = me.dom.find('input').val(),
            date = me.dom.find('.date-edit').datetimepicker('viewDate').format(me.format);
        if (text) {
            return date;
        }
        return '';
    },
    setValue: function (v) {
        let me = this;
        const dateDom = me.dom.find('.date-edit')
        if (!v) {
            dateDom.datetimepicker('date', me.max + ' 00:00:00');
            dateDom.datetimepicker('clear');
        } else {
            dateDom.datetimepicker('date', v);
        }
    }
});

cqjs.searchEditor('date', {
    extends: "editors.date",
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
