cqjs.editor('datetime', {
    extends: "editors.date",
    format: 'YYYY-MM-DD HH:mm:ss',
});

cqjs.searchEditor('datetime', {
    extends: "editors.datetime",
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
