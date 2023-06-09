window.cqjs = window.cqjs || {};

(function () {
    /** 字符翻译，如 "名称".t() */
    String.prototype.t = function () {
        return this + '';//todo
    }
    /** 从数组移除指定项，如 [1,2].remove(1) */
    Array.prototype.remove = function (e) {
        let idx = this.indexOf(e);
        if (idx > -1) {
            this.splice(idx, 1);
        }
    }
    /** 全局id */
    let globaleId = 0;
    /** 获取全局id */
    cqjs.nextId = function () {
        return globaleId++;
    }
    cqjs.emptyFn = function () { }
    /** 工具 */
    cqjs.utils = {
        /** 参考 jQuery.extend 方法，使用 defineMethod 处理 Function，实现类的继承方法可以通过 callParent 调用父类的方法 */
        apply: function () {
            let options, name, src, copy, copyIsArray, clone, target = arguments[0] || {}, i = 1, length = arguments.length, deep = false;
            if (typeof target === "boolean") {
                deep = target;
                target = arguments[1] || {};
                i = 2;
            }
            if (typeof target !== "object" && !jQuery.isFunction(target)) {
                target = {};
            }
            if (length === i) {
                target = this;
                --i;
            }
            for (; i < length; i++) {
                if ((options = arguments[i]) != null) {
                    for (name in options) {
                        if (name && name[0] === '$') {
                            continue;
                        }
                        src = target[name];
                        copy = options[name];
                        if (target === copy) {
                            continue;
                        }
                        if (deep && copy && (jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)))) {
                            if (copyIsArray) {
                                copyIsArray = false;
                                clone = src && jQuery.isArray(src) ? jQuery.extend(deep, [], src) : [];

                            } else {
                                clone = src && jQuery.isPlainObject(src) ? jQuery.extend(deep, {}, src) : {};
                            }
                            target[name] = jQuery.extend(deep, clone, copy);
                        } else if (copy !== undefined) {
                            if (copy instanceof Function) {
                                cqjs.utils.defineMethod(target, name, copy);
                            } else {
                                target[name] = copy;
                            }
                        }
                    }
                }
            }
            return target;
        },
        /** 定义方法 */
        defineMethod: function (owner, name, body) {
            let clone = function (method) {
                let newMethod, prop;
                newMethod = function () {
                    return method.apply(this, arguments);
                };
                for (prop in method) {
                    if (method.hasOwnProperty(prop)) {
                        newMethod[prop] = method[prop];
                    }
                }
                return newMethod;
            };
            if (body.$owner) {
                body = clone(body);
            }
            owner[name] = body;
            body.$name = name;
            body.$owner = owner.$class;
        },
        /** 解析xml */
        parseXML: function (xmlStr) {
            if (typeof ($.browser) == "undefined") {
                if (!!navigator.userAgent.match(/Trident\/7\./)) {// IE11
                    let xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                    xmlDoc.async = "false";
                    xmlDoc.loadXML(xmlStr);
                } else {
                    let parser = new DOMParser();
                    xmlDoc = parser.parseFromString(xmlStr, "text/xml");
                }
            } else {
                if ($.browser.msie) {// IE
                    xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                    xmlDoc.async = "false";
                    xmlDoc.loadXML(xmlStr);
                } else {// Other
                    let parser = new DOMParser();
                    xmlDoc = parser.parseFromString(xmlStr, "text/xml");
                }
            }
            return $(xmlDoc);
        },
        /** 16位随机id */
        randomId: function () {
            let guid = "";
            for (let i = 1; i <= 16; i++) {
                let n = Math.floor(Math.random() * 16.0).toString(16);
                guid += n;
            }
            return guid;
        },
    }
    cqjs.web = {
        /** 获取 url 参数的值 */
        getUrlParam: function (name) {
            let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
            let r = window.location.search.substr(1).match(reg);
            if (r != null) return unescape(r[2]); return null;
        },
        /** 获取 url 参数转换的对象 */
        getParams: function (search) {
            let o = {}, re = /([^&=]+)=([^&]*)/g, m;
            while (m = re.exec(search)) {
                o[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
            }
            return o;
        },
        /** 获取租户，从url解析 */
        getTenantPath: function () {
            let parts = window.location.pathname.substring(1).split("/");
            return "/" + parts[0];
        },
        /** cookie读写 */
        cookie: function (name, value, options) {
            if (typeof value != 'undefined') {
                options = options || {};
                if (value === null) {
                    value = '';
                    options = $.extend({}, options);
                    options.expires = -1;
                }
                let expires = '';
                if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
                    let date;
                    if (typeof options.expires == 'number') {
                        date = new Date();
                        date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
                    } else {
                        date = options.expires;
                    }
                    expires = '; expires=' + date.toUTCString();
                }
                let path = options.path ? '; path=' + (options.path) : '';
                let domain = options.domain ? '; domain=' + (options.domain) : '';
                let secure = options.secure ? '; secure' : '';
                document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
            } else {
                let cookieValue = null;
                if (document.cookie && document.cookie != '') {
                    let cookies = document.cookie.split(';');
                    for (let i = 0; i < cookies.length; i++) {
                        let cookie = jQuery.trim(cookies[i]);
                        if (cookie.substring(0, name.length + 1) == (name + '=')) {
                            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                            break;
                        }
                    }
                }
                return cookieValue;
            }
        }
    }
    /** 请求模型的服务 */
    cqjs.rpc = function (opt) {
        opt = opt || {};
        let model = opt.model,
            method = opt.method,
            context = opt.context || {},
            args = opt.args || {},
            dialog = opt.dialog,
            defaults = {
                url: cqjs.web.getTenantPath() + "/rpc/service?module=" + (opt.module || 'base'),
                type: "POST",
                dataType: "json",
                data: {
                    id: cqjs.utils.randomId(),
                    jsonrpc: "2.0",
                    method: method,
                    params: {
                        args: args,
                        context: context,
                        model: model
                    }
                },
                contentType: "application/json; charset=utf-8",
                onsuccess: function (data) { },
                onerror: function (err) {
                    if (dialog) {
                        dialog.busy(false);
                    }
                    console.error(err);
                    //cqjs.msg.error(err);
                },
                success: function (rs) {
                    if (rs.error) {
                        options.onerror(rs.error);
                        if (rs.error.code === 7100) {//未授权，刷新转跳到登录
                            top.window.location.reload();
                        }
                    } else {
                        let result = rs.result;
                        options.onsuccess(result);
                        if (dialog) {
                            dialog.busy(false);
                            cqjs.msg.show(dialog.submitText + '成功'.t());
                        }
                    }
                },
                error: function (rs) {
                    console.log(rs);
                }
            };
        delete opt.context;
        delete opt.args;
        delete opt.module;
        delete opt.method;
        delete opt.model;
        delete opt.dialog;
        let options = $.extend(true, defaults, opt);
        options.data = JSON.stringify(options.data);
        $.ajax(options);
    }
    /** 所有定义的类型 */
    cqjs.types = {}
    /** 定义类，使用 extends 指定要继承的父类，如：
     * cqjs.define("a", {});
     * cqjs.define("b", { extends: "a"});
     * cqjs.define("c", { extends: ["b", "a"]});
     */
    cqjs.define = function (name, define) {
        let clz = function () {
            this.new(...arguments);
        }, prop = clz.prototype, addBase = function (b) {
            let base = cqjs.types[b];
            if (base) {
                clz.$bases.push(base);
                cqjs.utils.apply(true, prop, base.prototype);
                cqjs.utils.apply(true, clz.$statics, base.$statics);
            } else {
                throw new Error(name + " 不能扩展未定义的 " + b);
            }
        };
        prop.$class = clz;
        clz.$statics = {};
        if (typeof define === "function") {
            define = define();
        }
        define = define || {};
        cqjs.utils.defineMethod(prop, 'new', function () { });
        clz.$bases = [];
        if (typeof define.extends === "string") {
            addBase(define.extends);
        } else if (jQuery.isArray(define.extends)) {
            for (let i = define.extends.length - 1; i >= 0; i--) {
                let b = define.extends[i];
                if (typeof b === "string") {
                    addBase(b);
                }
            }
        }
        if (define.statics) {
            cqjs.utils.apply(true, clz.$statics, define.statics);
            delete define.statics;
        }
        cqjs.utils.apply(true, clz, clz.$statics);
        cqjs.utils.apply(true, prop, define);
        prop.callSuper = function () {
            let bases = this.$class.$bases,
                stack = new Error().stack.split('\n')[2].trim().split(/\s+/)[1].trim().split('.'),
                name = stack[stack.length - 1];
            for (let i = bases.length - 1; i >= 0; i--) {
                let baseMethod = bases[i].prototype[name];
                if (baseMethod) {
                    return baseMethod.apply(this, arguments);
                }
            }
        }
        clz.$name = name;
        cqjs.types[name] = clz;
        return clz;
    }
    cqjs.override = function (name, define) {
        let clz = cqjs.types[name];
        if (typeof define === "function") {
            define = define();
        }
        if (define.statics) {
            cqjs.utils.apply(true, clz.$statics, define.statics);
            delete define.statics;
        }
        cqjs.utils.apply(true, clz, clz.$statics);
        cqjs.utils.apply(true, clz.prototype, define);
        return clz;
    }
    cqjs.create = function () {
        let name = arguments[0], args = [];
        for (let i = 1; i < arguments.length; i++) {
            args.push(arguments[i]);
        }
        return new cqjs.types[name](...args);
    }
})();
