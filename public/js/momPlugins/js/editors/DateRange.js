cqjs.searchEditor('date_range', {
    format: 'YYYY-MM-DD',
    getTpl: function () {
        return `<div class="input-group dateRanges">
                    <input id="${this.getId()}" type="text" class="form-control float-right"/>
                    <div class="input-group-append">
                        <span class="input-group-text">
                            <span class="far fa-calendar-alt"></span>
                        </span>
                    </div>
                </div>`;
    },
    init: function () {
        let me = this, dom = me.dom, field = me.field;
        me.name = me.name || dom.attr('data-field') || field.name;
        me.startDate = dom.attr('startDate') || new Date().format(this.format);
        me.endDate = dom.attr('endDate') || new Date().format(this.format);
        dom.html(me.getTpl())
            .find('#' + me.id).daterangepicker({
                startDate: me.startDate,
                endDate: me.endDate,
                locale: {
                    format: me.format,
                },
            }
        ).on('apply.daterangepicker', function (ev, picher) {
            me.startDate = picher.startDate.format(me.format);
            me.endDate = picher.endDate.format(me.format);
        });
    },
    getValue: function () {
        let me = this,
            text = me.dom.find('input').val();
        if (text) {
            return [me.startDate, me.endDate];
        }
        return "";
    },
    getCriteria: function () {
        let me = this;
        if (this.dom.find('input').val()) {
            return ['&', [me.name, '>=', me.startDate], [me.name, '<=', me.endDate]];
        }
        return [];
    },
    getText: function () {
        let me = this,
            text = me.dom.find('input').val();
        if (text) {
            return [me.startDate + "至".t() + me.endDate];
        }
        return "";
    },
    setValue: function (v) {
        let me = this;
        if (!v || v === undefined || v === '') {
            me.dom.find('input').val('').trigger('change');
        } else {
            let values = v.split(',');
            me.dom.find('input').val(values[0] + "-" + values[1]).trigger('change');
            me.startDate = values[0];
            me.endDate = values[1];
        }
    }
});