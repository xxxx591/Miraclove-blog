/**
 * 自定义控件
 */
$.component("JCustom", {
    init: function () {
        let me = this;
        if (me.arch) {
            let arch = cqjs.utils.parseXML(me.arch), custom = arch.children('custom');
            if (custom.length > 0) {
                $.each(custom[0].attributes, function (i, attr) {
                    if (attr.name === 'class') {
                        me.dom.addClass(attr.value);
                    } else {
                        let v = encodeURI(attr.value);
                        me.dom.attr(attr.name, v);
                    }
                });
                me.dom.append(custom.prop('innerHTML'));
            }
        }
    }
});