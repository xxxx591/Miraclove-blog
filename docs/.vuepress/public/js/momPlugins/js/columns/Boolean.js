cqjs.column('boolean', {
    render: function () {
        return function (data, type, row) {
            if (data) {
                return '<label class="checked-column"><span>TRUE</span></label>';
            }
            return '<label class="unchecked-column"><span>FALSE</span></label>';
        }
    }
});