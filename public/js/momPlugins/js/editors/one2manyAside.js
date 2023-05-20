/* <div class="resize-bar"></div>
<div class="resize-line"></div> */

cqjs.editor('one2many_aside', {
  extends: "editors.one2many",
  getTpl: function () {
    return `
    <div style="wdith:100%;">
    <div class="one2many_aside_column" id="asideColumnBox">
      <div class="one2many_aside_column_left" id="asideColumnLeft">
        <div class="one2many_aside_column_left_con">
          <div role="tbar" class="toolbar"></div>
          <div id="asideLeft" class="" style="width:100%;overflow-x:auto"></div>
        </div>
        <div class="resize-line" id="asideColumnResize"></div> 
      </div>


      <div class="one2many_aside_column_right" id="asideColumnRight">
        <div id="asideRight" style="width:100%;overflow-x:auto"></div>
      </div>  
    </div>
    </div>
    
    `;
  },
  moveFn: function () {
    let resize = document.getElementById("asideColumnResize");
    let left = document.getElementById("asideColumnLeft");
    let right = document.getElementById("asideColumnRight");
    let box = document.getElementById("asideColumnBox");
    resize.onmousedown = function (e) {
      let startX = e.clientX;
      resize.left = resize.offsetLeft;
      document.onmousemove = function (e) {
        let endX = e.clientX;

        let moveLen = resize.left + (endX - startX);
        let maxT = box.clientWidth - resize.offsetWidth;
        if (moveLen < 150) moveLen = 150;
        if (moveLen > maxT - 150) moveLen = maxT - 150;

        resize.style.left = moveLen;
        left.style.width = moveLen + "px";
        right.style.width = (box.clientWidth - moveLen - 5) + "px";
      }
      document.onmouseup = function (evt) {
        document.onmousemove = null;
        document.onmouseup = null;
        resize.releaseCapture && resize.releaseCapture();
      }
      resize.setCapture && resize.setCapture();
      return false;
    }
  },
  init: function () {
    let me = this, dom = me.dom, field = me.field;
    me.name = me.name || dom.attr('data-field') || field.name;
    me.delete = [];
    me.create = [];
    me.update = [];
    dom.html(me.getTpl()).find('[role="tbar"]').css('height', 'auto');
    me.initToolbar()

    me.moveFn()
  },
  setValue: function (values) {
    let me = this;
    me.values = values || [];
    delete me.data;
    me.delete = [];
    me.create = [];
    me.update = [];
    me.updateGrid();

  },
  /**
   * 初始化工具条
   */
  initToolbar: function () {
    let me = this;
    if (me.grid && !me.dom.hasClass('readonly')) {
      me.toolbar = me.dom.find('[role=tbar]').JToolbar({
        arch: me.grid.tbarArch || '<toolbar/>',
        auths: "@all",
        buttons: "default",
        defaultButtons: 'create|creating|edit|delete|import',
        target: me.grid,
        view: me.view
      });
      me.view.onToolbarChange(me.toolbar);
    }
  },
  /**
   * 查询数据
   * @param grid 表格
   * @param callback 表格绑定数据的回调
   * @param data DataTable的参数
   * @param settings DataTable的参数
   */
  searchData: function (grid, callback, data, settings) {
    let me = this;
    cqjs.rpc({
      model: me.model,
      module: me.module,
      method: "searchRelated",
      args: {
        relatedField: me.field.name,
        options: {
          criteria: [['id', 'in', me.values || []]],
          offset: 0,
          limit: me.limit,
          fields: grid.getFields(),
          order: grid.getSort()
        }
      },
      context: {
        usePresent: true
      },
      onsuccess: function (r) {
        me.data = r.data.values;
        callback({
          data: r.data.values
        });
      }
    });
  },
  /**
   * 根据id读取数据
   * @param grid 表格
   * @param id 主键 new开头的表示新建的数据，需要从create中找
   * @param callback 回调
   */
  readData: function (grid, id, callback) {
    let me = this;
    if (!id)
      return;
    if (id.startsWith('new')) {
      for (let i = 0; i < me.create.length; i++) {
        let d = me.create[i];
        if (d.id === id) {
          callback({ data: d });
          return;
        }
      }
    } else {
      //TODO 如果当前编辑过，应该取修改的数据，不用再从后台加载
      cqjs.rpc({
        model: grid.model,
        module: grid.module,
        method: "read",
        args: {
          ids: [id],
          fields: grid.editForm.getFields()
        },
        context: {
          usePresent: true
        },
        onsuccess: function (r) {
          for (let i = 0; i < me.update.length; i++) {
            let u = me.update[i];
            if (u.id === id) {
              let d = me.findData(me.data, id);
              $.extend(r.data[0], d);
              break;
            }
          }
          callback({ data: r.data[0] });
        }
      });
    }
  },
  /**
   * 查找
   * @param data 数据源
   * @param id id
   * @returns {*}
   */
  findData: function (data, id) {
    for (let i = 0; i < data.length; i++) {
      let d = data[i];
      if (d.id === id) {
        return d;
      }
    }
  },
  /**
   * 双击事件
   * @param e Event
   * @param grid 表格
   * @param id id
   */
  rowDblClick: function (e, grid, id) {
    let me = this;
    me.view.onDblClick(e, grid, function () {
      if (!me.dom.hasClass('readonly')) {
        me.toolbar.dom.find("[name='btn_edit']").click();
      }
    });
  },
  /**
   * 选中行
   * @param e Event
   * @param grid 表格
   * @param sel 选中的id列表
   */
  selected: function (e, grid, sel) {
    let me = this, selected = [];
    $.each(sel, function (i, id) {
      $.each(grid.data, function () {
        if (this.id === id) {
          selected.push(this);
        }
      });
    });
    if (me.toolbar) {
      me.toolbar.update(selected);

    }
    if (me.editForm) {
      me.editForm.updateGridToolBar(selected)
    }

    if (selected.length > 0) {
      let tagertVal = selected[0] || {}
      me.editForm.setData(selected[0], 'childList' in tagertVal ? 'aside' : '');
    }
  },
  /**
   * 删除数据
   */
  deleteData: function () {
    let me = this;
    $.each(me.grid.getSelected(), function (i, item) {
      if (item.startsWith('new')) {
        for (let i = 0; i < me.create.length; i++) {
          let d = me.create[i];
          if (d.id === item) {
            me.create.splice(i, 1);
            break;
          }
        }
      } else {
        me.delete.push(item);
        me.dom.triggerHandler("valueChange", [me]);
      }
      for (let i = 0; i < me.data.length; i++) {
        let d = me.data[i];
        if (d.id === item) {
          me.data.splice(i, 1);
          break;
        }
      }
    });
    me.grid.table.draw();
  },
  /**
   * 根据id移除数据
   * @param data 数据源
   * @param id id
   */
  removeDataById(data, id) {
    let me = this;
    for (let i = 0; i < data.length; i++) {
      let d = data[i];
      if (d.id === id) {
        data.splice(i, 1);
        break;
      }
    }
  },
  /**
   * 保存编辑的数据
   * @param id 数据的id，new开头表示新建的数据
   * @param dirty 用于保存的脏数据
   * @param data 用于显示在表格中的数据
   * @param callback 回调方法
   */
  saveEdit: function (id, dirty, data, callback) {
    let me = this;
    data = data || dirty;
    if (id) {
      data.id = id;
      for (let i = 0; i < me.data.length; i++) {
        let d = me.data[i];
        if (d.id === id) {
          $.extend(d, data);
        }
      }
      if (id.startsWith('new')) {
        me.removeDataById(me.create, id);
        me.create.push(dirty);
        me.dom.triggerHandler("valueChange", [me]);
      } else {
        me.removeDataById(me.update, id);
        me.update.push(dirty);
        me.dom.triggerHandler("valueChange", [me]);
      }
    } else {
      dirty.id = 'new-' + cqjs.nextId();
      data.id = dirty.id;
      me.create.push(dirty);
      me.data.push(data);
      me.dom.triggerHandler("valueChange", [me]);
    }
    if (callback) {
      callback(true);
    }
  },
  // 更新表格
  updateGrid: function () {
    let me = this;
    if (me._fields) {
      let el = me.dom.find('#asideLeft');
      el.html('').unbind();
      let arch = cqjs.utils.parseXML(me.arch), aside = arch.find('aside');
      if (!me.asideArch) {
        me.asideArch = aside.prop('innerHTML');
        aside.remove();
      }
      me.arch = arch.children('grid').prop('outerHTML');
      me.data = [];
      me.grid = el.JGrid({
        model: me.field.comodel,
        module: me.module,
        arch: me.arch,
        fields: me._fields,
        owner: me,
        editable: true,
        view: me.view,
        dialog: true,
        selected: function (e, grid, sel) {
          me.selected(e, grid, sel);
        },
        rowDblClick: function (e, grid, id) {
          me.rowDblClick(e, grid, id);
        },
        saveEdit(grid, id, dirty, data, callback) {
          me.view.onEditConfirm(grid, id, data, function () {
            me.saveEdit(id, dirty, data, callback);
          });
        },
        loadEdit(grid, id, callback) {
          me.readData(grid, id, callback);
        },
        ajax: function (grid, callback, data, settings) {

          if (me.data) {
            callback({
              data: me.data
            });
          } else {
            me.searchData(grid, callback, data, settings);
          }
        },
        delete: function () {

          me.deleteData();
        }
      });
      me.editForm = me.dom.find('#asideRight').html('').unbind().JForm($.extend({
        arch: '<form logAccess="0">' + me.asideArch + '</form>',
        fields: me._fields,
        model: me.field.comodel,
        module: me.module,
        owner: me,
        view: me.view
      }));

      for (let field of me.editForm.getFields()) {
        me.grid._fields.push(field);
      }
      let formValueChange = function () {
        // getSelected 获取表格选中的
        // me.grid.data 表格当前的值
        // getDirtyData 获取目标表格的列表值

        let sel = me.grid.getSelected();
        for (let data of me.grid.data) {
          if (data.id == sel[0]) {
            let val = JSON.parse(JSON.stringify(me.editForm.getData() || []))
            data.childList = val
            $.extend(data, me.editForm.getDirtyData());
          }
        }
        // 新增
        if (sel[0].startsWith("new-")) {
          for (let data of me.create) {
            if (data.id == sel[0]) {
              $.extend(data, me.editForm.getDirtyData());
            }
          }
        } else {
          let exist;
          for (let data of me.update) {
            if (data.id == sel[0]) {
              $.extend(data, me.editForm.getDirtyData());
              exist = true;
            }
          }
          if (!exist) {
            let data = {};
            data.id = sel[0];
            $.extend(data, me.editForm.getDirtyData());
            me.update.push(data);
          }
        }
        me.dom.triggerHandler("valueChange", [me]);
      }
      for (let field of me.editForm.getFields()) {
        let edit = me.editForm.editors[field];
        edit.onValueChange(formValueChange);
      }
      me.initToolbar();
      me.data = null;
      me.grid.load();
    } else {
      cqjs.rpc({
        model: 'ir.ui.view',
        method: "loadFields",
        args: {
          model: me.field.comodel
        },
        onsuccess: function (r) {
          me._fields = r.data.fields;
          me.updateGrid();
        }
      });
    }
  },
});
