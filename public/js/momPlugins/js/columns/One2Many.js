cqjs.column('one2many', {
    render: function () {
        let me = this;
        return function (data, type, row) {
            let id = cqjs.utils.randomId(), ids = [];
            if (data && data.length > 0) {
                for (let row of data) {
                    if ($.isArray(row)) {
                        ids.push(row[1]);
                    } else {
                        ids.push(row);
                    }
                }
            }
            if (ids && ids.length > 0) {
                cqjs.rpc({
                    model: me.owner.model,
                    module: me.owner.module,
                    method: "searchRelated",
                    args: {
                        relatedField: me.field.name,
                        options: {
                            criteria: [['id', 'in', ids]],
                            fields: ["present"],
                            limit: ids.length,
                            nextTest: false
                        }
                    },
                    onsuccess: function (r) {
                        let present = '', ids = '';
                        for (let item of r.data.values) {
                            if (ids) {
                                ids += ",";
                                present += ",";
                            }
                            present += item.present;
                            ids += item.id;
                        }
                        me.owner.dom.find(`[row=${id}]`).html(present).attr("data-id", ids);
                    }
                });
            }
            return `<span row="${id}" o2m-field="${me.field.name}"></span>`;
        }
    }
});