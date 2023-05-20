cqjs.editor('binary', {
    type: /\.(gif|jpg|jpeg|png|GIF|JPG|PNG|xlsx|xls|XLSX|XLS|word|doc|WORD|DOC|ppt|pptx|PPT|PPTX|zip|rar|ZIP|RAR)$/,//上传的类型
    typeErroTxt: 'gif,jpg,jpeg,png,xlsx,xls,doc,word,ppt,pptx,zip,rar', size: 10, //大小
    fileList: [],//附件
    values: [],//是提交的数据
    number: 10,//附件数量
    getTpl: function () {
        return `<div class="input-group">
                    <div class="custom-file-btn" id="customFileBtn">
                        ${'上传附件'.t()}
                    </div>
                    <input type="file" class="custom-file-btn-input" id="exampleInputFilePro"/>
                <div class="file-box" id="fileBox">

                </div>
                </div>`;
    },
    getItemTpl: function (val) {
        console.log(`output->val`, val)
        let that = this
        return `<div class="file-box-item" id="${val.id}">
                    <img class="file-box-item-img" src="${that.iconObj[val.type] || that.iconObj.UNKNOWN}" alt="">
                    <div class="con-box">
                        <div class="con-box-title">${val.fileName}<span id="del${val.id}" class="fa fa-trash"></span></div>
                        <div class="con-box-title">${val.type}<span id="downLoad${val.id}" class="fa fa-download"></span></div>
                    </div>
                </div>`
    },
    newEval: function (str) {
        return new Function('return ' + str)();
    },
    init: function () {
        let me = this
        let dom = me.dom
        me.typeErroTxt = dom.attr('type-erro-txt') || me.typeErroTxt;
        me.type = dom.attr('type') || me.type;
        me.size = me.newEval(dom.attr('size') || me.size)
        me.number = me.newEval(dom.attr('number') || me.number)
        me.iconObj = {
            word: '/res/com/cqs/base/statics/img/doc.png',
            doc: '/res/com/cqs/base/statics/img/doc.png',
            ppt: '/res/com/cqs/base/statics/img/ppt.png',
            pptx: '/res/com/cqs/base/statics/img/ppt.png',
            pdf: '/res/com/cqs/base/statics/img/pdf.png',
            xlsx: '/res/com/cqs/base/statics/img/xls.png',
            xls: '/res/com/cqs/base/statics/img/xls.png',
            zip: '/res/com/cqs/base/statics/img/zip.png',
            rar: '/res/com/cqs/base/statics/img/rar.png',
            jpeg: '/res/com/cqs/base/statics/img/jpeg.png',
            jpg: '/res/com/cqs/base/statics/img/jpeg.png',
            png: '/res/com/cqs/base/statics/img/png.png',
            gif: '/res/com/cqs/base/statics/img/gif.png',
            txt: '/res/com/cqs/base/statics/img/txt.png',
            UNKNOWN: '/res/com/cqs/base/statics/img/unknown3.png',
        }

        dom.html(me.getTpl()).on('click', '#customFileBtn', function () {
            $('#exampleInputFilePro').click();
        }).on('change', '#exampleInputFilePro', async function (e) {
            let file = this.files[0];
            if (file) {
                if (file.size > 1024 * 500 * me.size) { //10M
                    let error = "上传附件不能超过".t() + me.size + "M";
                    alert(error)
                    return;
                }
                // if (!(me.type.test(file.name))) {
                //     let error = `附件上传格式不正确,必须是${me.typeErroTxt}`.t();
                //     alert(error)
                //     return;
                // }
                // let name = file.name.substring(0, file.name.lastIndexOf("."))
                let reader = new FileReader();
                // 将文件加载进入
                reader.readAsDataURL(file);
                reader.onloadend = function () {
                    let data_64 = reader.result
                    let data = {
                        fileName: file.name,
                        type: file.name.split('.').pop().toLowerCase(),
                        file: data_64,
                        id: `new-${cqjs.nextId()}`
                    };
                    me.values.push(data);
                    me.fileList.push(data);
                    me.showFile(data);
                    me.dom.trigger('valueChange');
                    e.target.value = "";
                }
            }
        });
    },
    onValueChange: function (handler) {
        let me = this;
        me.dom.on('valueChange', function (e) {
            handler(e, me);
        });
    }, // base64转换成file
    parseBlob: function (base64) {
        var arr = base64.split(',');
        var mime = arr[0].match(/:(.*?);/)[1];
        var bstr = atob(arr[1]);
        var n = bstr.length;
        var u8arr = new Uint8Array(n);
        for (var i = 0; i < n; i++) {
            u8arr[i] = bstr.charCodeAt(i);
        }
        return { data: u8arr, type: mime };
    }, // 下载方法
    downloadFileWithBuffer: function (data, name, type) {
        var blob = new Blob([data], {
            type: type || ''
        })
        var downloadElement = document.createElement('a')
        var href = window.URL.createObjectURL(blob) // 创建下载的链接
        downloadElement.href = href
        downloadElement.download = name // 下载后文件名
        document.body.appendChild(downloadElement)
        downloadElement.click() // 点击下载
        document.body.removeChild(downloadElement) // 下载完成移除元素
        window.URL.revokeObjectURL(href) // 释放掉blob对象
    },
    getValue: function () {
        var me = this;
        return me.values;
    },
    setHide: function () {
        let that = this
        if (that.fileList.length >= +that.number) {
            $('#customFileBtn').hide()
        } else {
            $('#customFileBtn').show()
        }
    }, // 用于调用该组件的父组件设置值
    setValuePro: function (v) {
        let that = this;
        if (v.length > 0) {
            v.forEach(val => {
                that.setValue(v)
            })
        }
    },
    showFile: function (v) {
        let me = this;
        me.setHide()
        $("#fileBox").append(me.getItemTpl(v)).on("click", `#downLoad${v.id}`, function () {
            if (v.file) {
                let fileObj = me.parseBlob(v.file)
                me.downloadFileWithBuffer(fileObj.data, v.fileName, fileObj.type)
            } else {
                window.open(cqjs.web.getTenantPath() + "/attachment/" + v.id);
            }
        }).on("click", `#del${v.id}`, function () {
            $(`#${v.id}`).remove();
            if (v.id && !v.id.startsWith('new')) me.values.push({ delete: v.id });
            me.fileList = me.fileList.filter(item => item.id !== v.id)
            me.setHide();
            me.dom.trigger('valueChange');
        })
    },
    setValue: function (value) {
        let me = this;
        me.fileList = [];
        me.values = [];
        $("#fileBox").empty();
        if (jQuery.isArray(value)) {
            for (let v of value) {
                me.fileList.push(v);
                me.showFile(v);
            }
        } else if (value) {
            me.fileList.push(value);
            me.showFile(value);
        }
    },
});
