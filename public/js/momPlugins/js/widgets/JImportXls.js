cqjs.component("JImportXls", {
    previewMaxRows: 100,
    sheet2JSONOpts: {
        defval: '',
        raw: true,
        range: 0,                             //控制跳过几行
    },
    getTpl() {
        return `<div class="import-xls">
                    <div class="import-file">
                        <input type="file" class="import-file-input" id="customFile"></input>
                        <label class="import-file-label" for="customFile"><span class="import-file-name">${'选择文件'.t()}</span><div class="import-file-btn">选择</div></label>
                    </div>
                    <div class="import-options">
                        <div class="form-group" style="margin-top:11px">
                            <div class="form-check">
                                <label class="form-check-label" for="hasHeader">包含表头</label>
                                <input class="form-check-input" id="hasHeader" type="checkbox" checked="checked">
                            </div>
                        </div>
                        <div class="form-group head-rows-panel" style="width: 40px">
                            <input type="number" class="header-rows" min="1" max="10" value="1"/>
                        </div>
                    </div>
                    <ul class="nav nav-tabs" id="sheet-tab" role="tablist">
                    </ul>
                    <div class="data-preview"></div>
                </div>`;
    },
    init() {
        let me = this;
        me.wizard = cqjs.showDialog({
            id: "import-dialog",
            title: '导入'.t(),
            init: function (dialog) {
                me.initWizard(dialog);
            },
            submit: function (dialog) {
                dialog.busy(true);
                me.uploadData();
            }
        });
    },
    getFieldMap() {
        let me = this, map = {};
        let select = me.wizard.body.find('.x-field select');
        for (let i = 0; i < select.length; i++) {
            if (select[i].value) {
                map[select[i].value] = i;
            }
        }
        return map;
    },
    checkFieldMap() {
        let me = this, map = [], duplicate = [];
        let select = me.wizard.body.find('.x-field select');
        for (let i = 0; i < select.length; i++) {
            let item = select[i], value = item.value;
            if (value) {
                if (map.includes(value)) {
                    let text = item.options[item.selectedIndex].text;
                    if (!duplicate.includes(text)) {
                        duplicate.push(text);
                    }
                } else {
                    map.push(value);
                }
            }
        }
        if (map.length == 0) {
            cqjs.msg.error('至少配置一列字段映射，请检查配置'.t());
            return false;
        }
        if (duplicate.length > 0) {
            cqjs.msg.error(duplicate.join('，').toString() + '重复，请检查配置'.t());
            return false;
        }
        return true;
    },
    uploadData() {
        let me = this;
        if (!me.checkFieldMap()) {
            me.wizard.busy(false);
            return;
        }
        let formData = new FormData(), opt = {
            model: me.model,
            sheetIndex: me.sheetIndex,
            headRow: me.wizard.body.find('.header-rows').val(),
            fields: me.getFieldMap(),
        };
        formData.set("options", JSON.stringify(opt));
        formData.set('file', me.file);
        $.ajax({
            url: cqjs.web.getTenantPath() + "/importXls",
            type: "POST",
            data: formData,
            contentType: false,
            processData: false,
            success: function (data) {
                me.wizard.busy(false);
                if (data.success) {
                    if (me.callback) {
                        me.callback();
                    }
                    me.wizard.close();
                    cqjs.msg.show(data.message, {delay: 5000});
                } else {
                    cqjs.msg.error(data, {delay: 50000});
                }
            },
            error: function (data) {
                me.wizard.busy(false);
                console.log(data);
                cqjs.msg.error("发生错误:" + data);
            }
        });
    },
    initWizard(dialog) {
        let me = this;
        dialog.body.html(me.getTpl())
            .on('change', '[type=file]', function (e) {
                me.fileChange(e);
            }).on('change', '.header-rows', function (e, a) {
            let value = parseInt($(this).val());
            $(this).val(isNaN(value) ? 1 : value);
            me.showSheet(me.sheetIndex);
        }).on('change', '#hasHeader', function () {
            if ($(this).is(":checked")) {
                dialog.body.find('.head-rows-panel').show();
            } else {
                dialog.body.find('.head-rows-panel').hide();
            }
            me.showSheet(me.sheetIndex);
        });

        dialog.body.find(".header-rows").inputSpinner({
            template: // the template of the input
                '<div class="input-group ${groupClass}">' +
                '<input type="text" inputmode="decimal" style="text-align: ${textAlign}!important;padding: 5px 0 0;margin-right: 5px"/>' +
                '<div class="input-group-prepend"><button style="display: none" class="btn btn-decrement btn-minus" type="button">${decrementButton}</button></div>' +
                '<div class="input-group-append"><label class="" style="line-height: 37px;">行</label><button style="display: none" class="btn btn-increment btn-plus" type="button">${incrementButton}</button></div>' +
                '</div>'
        });
        dialog.body.on('click', '.sheet-link', function () {
            me.showSheet($(this).attr('data-sheet'));
        });
        dialog.dom.find('[role=btn-submit]').attr('disabled', true);
    },
    fileChange(event) {
        let me = this, fileReader = new FileReader(),
            sheets = me.wizard.body.find('#sheet-tab'),
            preview = me.wizard.body.find('.data-preview');
        preview.empty();
        sheets.empty();
        me.workbook = null;
        me.file = event.target.files[0];
        if (me.file) {
            me.wizard.dom.find('[role=btn-submit]').attr('disabled', false);
            me.wizard.dom.find('.import-file-name').text(event.target.value);
            fileReader.onload = function (e) {
                let data = e.target.result;
                me.workbook = XLSX.read(data, {type: 'binary', cellDates: true});
                let sheetNum = me.workbook.SheetNames.length;
                for (let i = 0; i < sheetNum; i++) {
                    sheets.append(`<li class="nav-item">
                                        <a class="sheet-link nav-link ${i == 0 ? 'active' : ''}"
                                           data-toggle="pill"
                                           data-sheet="${i}"
                                           href="#"
                                           role="tab"
                                           aria-selected="true">${me.workbook.SheetNames[i]}</a>
                                    </li>`);
                }
                if (sheetNum > 0) {
                    me.showSheet(0);
                }
            }
            fileReader.readAsArrayBuffer(me.file);
        } else {
            me.wizard.dom.find('[role=btn-submit]').attr('disabled', true);
            me.wizard.dom.find('.import-file-name').text('选择文件'.t());
        }
    },
    getHeader(end) {
        let header = [];
        if (end.length == 1) {
            for (let a = 65; a <= end.charCodeAt(0); a++) {
                header.push(String.fromCharCode(a));
            }
        }
        if (end.length == 2) {
            for (let a = 65; a <= 90; a++) {
                header.push(String.fromCharCode(a));
            }
            for (let a = 65; a < end[0].charCodeAt(0); a++) {
                for (let b = 65; b <= 90; b++) {
                    header.push(String.fromCharCode(a) + String.fromCharCode(b));
                }
            }
            for (let b = 65; b <= end[1].charCodeAt(0); b++) {
                header.push(end[0] + String.fromCharCode(b));
            }
        }
        return header;
    },
    showSheet(index) {
        let me = this, preview = me.wizard.body.find('.data-preview');
        preview.empty();
        me.sheetIndex = index;
        if (!me.workbook) {
            return;
        }
        let sheetData = me.workbook.Sheets[me.workbook.SheetNames[index]];
        if (me.wizard.body.find('#hasHeader').is(':checked')) {
            me.sheet2JSONOpts.range = me.wizard.body.find('.header-rows').val() - 1;
            delete me.sheet2JSONOpts.header;
        } else {
            me.sheet2JSONOpts.range = 0;
            let range = sheetData['!ref'];
            let end = range.split(':')[1].replaceAll(/\d/g, '');
            me.sheet2JSONOpts.header = me.getHeader(end);
        }
        let rows = XLSX.utils.sheet_to_json(sheetData, me.sheet2JSONOpts);
        if (rows.length == 0) {
            return;
        }
        let cols = [], thead = '<th class="x-cell x-row-head"></th>', tbody = `<td class='x-cell x-row-head'></td>`,
            tfoot = '';
        let fields = Object.values(me.fields).sort(function (x, y) {
            if (x['required'] != y['required']) {
                return y['required'] - x['required'];
            }
            return x['label'].localeCompare(y['label'], 'zh');
        });
        for (let col in rows[0]) {
            if (col !== "__rowNum__") {
                thead += `<th class='x-cell'>${col}</th>`;
                cols.push(col);
                let fieldSelect = '<option value="" style="color:gray">请选择字段映射</option>';
                for (let field of fields) {
                    if (['id', 'create_uid', 'create_date', 'update_uid', 'update_date'].indexOf(field.name) == -1 && field.store) {
                        let checked = col == field.name || col == field.label;
                        fieldSelect += `<option value="${field.name}" ${checked ? 'selected="true"' : ''} 
                                                class="${field.required ? 'required-field' : ''}">
                                            ${field.label}[${field.name}]
                                        </option>`;
                    }
                }
                tbody += `<td class='x-cell x-field'><select>${fieldSelect}</select></td>`;
            }
        }
        for (let i = 0; i < Math.min(me.previewMaxRows, rows.length); i++) {
            tbody += `<tr class='x-row'><td class='x-cell x-row-head'>${i + 1}</td>`;
            for (let col of cols) {
                let value = rows[i][col];
                if (value instanceof Object) {
                    value = value.toLocaleDateString();
                }
                tbody += `<td class='x-cell'>${value}</td>`;
            }
            tbody += '</tr>';
        }
        if (rows.length > me.previewMaxRows) {
            tfoot = `<tr><td colspan="${cols.length + 1}">总共${rows.length}行,还有${rows.length - me.previewMaxRows}行未显示</td></tr>`;
        }
        preview.html(`<table id="data-table" class="x-table">
            <thead>${thead}</thead>
            <tbody>${tbody}</tbody>
            <tfoot>${tfoot}</tfoot>
        </table>`);
    }
});
