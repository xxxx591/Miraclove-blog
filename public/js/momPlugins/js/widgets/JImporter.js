cqjs.define("JImporter", {
    fileReader: new FileReader(),
    file: null,
    activeSheet: 0,
    sheet2JSONOpts: {
        defval: '',
        raw: true,
        range: 0,                             //控制跳过几行
    },
    getTpl: function () {
        return `<div style="background-color: #f8f9fa">
                    <div>
                        <input type="file" class="file_input btn-default" accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" style="font-size: 0.95em;width: 100%;background-color: #fff9ff;"/>
                        <br>
                        <div style="margin-top: 10px">
                             <span>表头行数(默认一行表头)</span>                    
                             <input type="checkbox" class="head_opt" checked style="display: inline;margin-right: 10px;">
                             <input type="number" min="0" placeholder="请输入表头行数" class="header_range form-control" value="1" style="font-size: 0.8em;width: 8%;display: inline-block">
                             <button class="load-data btn btn-default" style="font-size: 0.8em;">解析</button>
                             <span class="data_info"></span>
                        </div>
                       
                    </div>
                    <div class="sheet_selector" style="margin-top: 15px;margin-bottom: 10px"></div>
                    <div style="overflow: auto;height: 410px">
                        <table id="data-table" class="table table-bordered table-striped" style="width: 100% !important;overflow: scroll;">
                            <thead id="preview_head">
                               
                            </thead>
                            <tbody id="preview_data">

                            </tbody>
                        </table>
                    </div>
                    <style>
                        .require{
                             content: '*';
                             color: #e54d42;
                        }
                    </style>
                </div>`;
    },
    new: function (opts, callback) {
        let me = this;
        cqjs.showDialog({
            id: "importer-dialog",
            title: '导入'.t(),
            init: function (dialog) {
                dialog.body.html(me.getTpl())
                    .on('change', '.head_opt', function () {
                        me.showLine(this.checked);
                    }).on('change', '.file_input', function (e) {
                    me.fileChange(e, dialog,opts);
                }).on('input', '.header_range', function (e, a) {
                    me.handleHeader(e, a);
                }).on('click', '.load-data', function () {
                    me.loadData(me.file)
                })
            },
            submit: function () {
                me.uploadData(opts.model,opts.fields,this, callback)
            }
        });
    },
    showLine: function (checked) {
        if (checked) {
            $('.header_range').css('display', 'inline-block');
            $('.header_range').val('1')
        } else {
            $('.header_range').css('display', 'none');
            $('.header_range').val('0')
        }
    },
    uploadData: function (model,_fields,dialog, callback) {
        if(!this.file){
            $(document).Toasts('create', $.extend({
                class: 'msg bg-danger',
                title: '请上传文件'.t(),
                icon: 'iconfont icon-exclamation-circle',
                autohide: true,
                delay: 3000,
            }));
            return
        }
        let opt = {}
        let fields = new Map()
        opt.head = this.sheet2JSONOpts.range + 1
        opt.model = model
        opt.sheet = this.activeSheet
        let selections = $('.fields option:selected')
        for (let i = 0; i < selections.length; i++) {
            if (selections[i].value === '-1') {
                continue
            }
            fields.set(selections[i].value, i)
        }
        let res = this.checkField(_fields)
        if(res.duplicate.length>0){
            $(document).Toasts('create', {
                title: '提示',
                body: res.duplicate.join('字段,').toString()+'重复填写',
                autoHide: true,
                delay: 3
            })
            return
        }
        if(res.require.length>0){
            $(document).Toasts('create', {
                title: '提示',
                body: res.require.join('字段,').toString()+'为必填项',
                autoHide: true,
                delay: 3
            })
            return
        }
        opt.fields = this._strMapToObj(fields)
        let formData = new FormData()
        formData.set("jsonStr", JSON.stringify(opt))
        formData.set('file', this.file)
        $.ajax({
            url: cqjs.web.getTenantPath() + "/import",
            type: "POST",
            data: formData,
            contentType: false,
            processData: false,
            success: function (data) {
                if(data.length===0){
                    $(document).Toasts('create', $.extend({
                        class: 'msg bg-success',
                        title: '上传成功!'.t(),
                        icon: 'iconfont icon-exclamation-circle',
                        delay: 3000,
                    }));
                    dialog.close();

                }else{
                    let result = ''
                    for (let i = 0; i < data.length; i++) {
                        result = data[i]+'\n'
                    }
                    $(document).Toasts('create', $.extend({
                        class: 'msg bg-danger',
                        title: '导入失败!'.t()+result.t(),
                        icon: 'iconfont icon-exclamation-circle',
                    }));
                }
                if(callback){
                    callback();
                }
            },
            error: function (data) {
                $(document).Toasts('create', $.extend({
                    class: 'msg bg-danger',
                    title: '网络错误'.t(),
                    icon: 'iconfont icon-exclamation-circle',
                    autohide: true,
                    delay: 3000,
                }));

            }

        });


    },
    fileChange: function (e, dialog,opts) {
        let me = this;
        this.file = e.target.files[0];
        const extension = this.file.name.substring(this.file.name.lastIndexOf(".") + 1)
        if (extension !== 'xlsx' && extension !== 'xls') {
            $(document).Toasts('create', {
                title: '提示',
                body: '请上传xls或者xlsx文件',
                autoHide: true,
                delay: 3

            })
        }
        let rABS = true
        let sheetSelector = dialog.body.find('.sheet_selector')
        this.fileReader.onload = function (e) {
            sheetSelector.empty()
            // $('#preview_head').empty()
            // $('#preview_data').empty()
            var data = e.target.result;
            if (!rABS) data = new Uint8Array(data);
            var wb = XLSX.read(data, {type: rABS ? 'binary' : 'array',cellDates: true});
            console.log(wb)
            var sheetNum = wb.SheetNames.length
            if (sheetNum <= 0) return

            for (var i = 0; i < sheetNum; i++) {
                sheetSelector.append(`<button style="display: inline-block;margin-left: 5px" class="classfier btn btn-primary" id=selector` + i + `>` + wb.SheetNames[i] + `</button>`)
            }
            $('.classfier').on('click', (event) => {
                const selector_id = event.target.id.toString().substr(8);
                if(!$('.head_opt').prop('checked') || parseInt($('.header_range').val())===0){
                    me.sheet2JSONOpts.header = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']
                }else{
                    delete me.sheet2JSONOpts.header
                }
                let datas = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[selector_id]], me.sheet2JSONOpts)
                const total = datas.length
                $('.data_info').text('一共'+total+'条数据')
                const length = datas.length > 20 ? 20 : datas.length
                datas = datas.slice(0, length)
                $('#preview_head').empty()
                $('#preview_data').empty()
                if (datas.length <= 0) {
                    $('#preview_data').append(`<td style="text-align: center">内容为空,表头行数为:${me.sheet2JSONOpts.range||0}</td>`)
                    return;
                }
                me.activeSheet = selector_id
                //设置表头
                var headers = []
                let head = `<tr>`;

                for (let key in datas[0]) {
                    if (key.startsWith('__')) continue
                    headers.push(key)
                    head = head.concat(`<th>Excel列名:` + key + `<br>对应字段:<select class="fields" style="width: 30px"></th>`)
                }
                head = head.concat(`</tr>`)

                $('#preview_head').append(head)
                //设置数据
                let body = `<tr>`
                for (let j = 0; j < datas.length; j++) {
                    for (let i = 0; i < headers.length; i++) {
                        if(datas[j][headers[i]] instanceof Object){
                            let timeformat = datas[j][headers[i]].toLocaleDateString()
                            body = body.concat(`<td style="line-height: 10px">${timeformat}</td>`)
                        }else{
                            body = body.concat(`<td style="line-height: 10px">${datas[j][headers[i]]}</td>`)
                        }

                    }
                    body = body.concat(`</tr>`)
                }
                $('#preview_data').append(body)
                $('#preview_data').append(`<td style="text-align: center;display: ${total-length>0?'table-cell':'none'}" colspan="999">省略${total-length}条数据......</td>`)
                //设置下拉框
                const fieldsNum = Object.keys(opts.fields).length;
                let sort_fields = Object.values(opts.fields);
                const sortByField = 'label'
                sort_fields.sort(me.sortBy(sortByField))
                const exclude_fields = ['create_uid', 'create_date', 'update_uid', 'update_date','id']
                const field_filter = sort_fields.filter(e => !exclude_fields.includes(e['name']))
                const field_fileterNum = field_filter.length
                $('.fields').append(`<option value="-1">不存在</option>`)
                for (let i = 0; i < field_fileterNum; i++) {
                    let name = field_filter[i]['name']
                    $('.fields').append(`<option value="${name}" class="${field_filter[i].required ? 'require' : ''}">${field_filter[i]['label']}[${name}]</option>`)
                }
                $('.fields').css('border', '1px solid gray')
                    .css('appearance', 'none')
                    .css('padding-right', '90/108rem')
                    .css('background-size', '34/108rem')
                    .css('border-radius', '5%')
                    .css('width', '75px')
            })

        };
        $('.load-data:eq(0)').trigger('click')
        setTimeout(function() {
            $('.classfier:eq('+me.activeSheet+')').trigger('click')
        },50)

    },
    loadData: function () {
        const me = this
        if(!this.file){
            $(document).Toasts('create', $.extend({
                class: 'msg bg-danger',
                title: '请上传文件'.t(),
                icon: 'iconfont icon-exclamation-circle',
                autohide: true,
                delay: 3000,
            }));
            return;
        }
        this.fileReader.readAsArrayBuffer(this.file)
        // setTimeout(function() {
        //     $('.classfier:eq('+me.activeSheet+')').trigger('click')
        // },100)


    },
    handleHeader: function (e, a) {
        const temp = parseInt($('.header_range').val()) || 0
        this.sheet2JSONOpts.range = temp>=1?temp-1:0

        if (this.file) {
            this.loadData(this.file)
            $('.classfier:eq('+this.activeSheet+')').trigger('click')

        }

    },
    sortBy: function (field) {
        //根据传过来的字段进行排序
        return (x, y) => {
            if(x['required'] != y['required']){
                return y['required'] - x['required'];
            }
            return x[field].localeCompare(y[field], 'zh');
        }
    },
    checkField: function(fields){
        //检查字段是否重复
        let map = new Map()
        let duplicate = []
        let require = []
        let selections = $('.fields option:selected')
        for (let i = 0; i < selections.length; i++) {
            let value = selections[i].value
            if (value === '-1') {
                continue
            }
            if(map.has(value)){
                if(!duplicate.includes(selections[i].innerHTML)){
                    duplicate.push(selections[i].innerHTML)
                }
            }else{
                map.set(value,1)
            }
        }
        const require_fields = Object.values(fields).filter(e=>e.required)
        require_fields.forEach(e=>{
            if(!map.has(e.name)){
                require.push(e.label + `[${e.name}]`)
            }
        })
        return {duplicate,require}

    },
    _strMapToObj: function (strMap) {
        let obj = Object.create(null);
        for (let [k, v] of strMap) {
            obj[k] = v;
        }
        return obj;
    },
    throttle:function (fn, waiting) {
        // 上一次的执行时间
        let previous = 0;
        return function (...args) {
            // 当前时间
            let now = +new Date();
            if (now - previous > waiting) {
                previous = now;
                fn.apply(this, args);
            }
        }
    }



});
