cqjs.columns = {};
cqjs.column = function (name, define) {
    cqjs.columns[name] = cqjs.component('columns.' + name, define);
}
cqjs.column('default', {
    render: function () {
        let me = this, t = me.field.type;
        return function (data, type, row) {
            if (data === null || data === undefined) {
                data = '';
            }
            // if (t === 'integer' || t === 'float') {
            //     return '<div class="text-right">' + data + '</div>';
            // }
            if ((t === 'char' || t === 'text') && typeof data === 'string') {
                return  `<div title="${data.replaceAll('"', "'")}" class="text_column">
                    ${data}
                </div>`
            }
            return data;
        }
    }
});