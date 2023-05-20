cqjs.column('tree_column', {
    render: function () {
        let me = this, t = me.field.type;
        return function (data, type, row) {
            return `<span style="margin-left: ${row.$depth * 30}px">${data}</span>`;
        }
    }
});