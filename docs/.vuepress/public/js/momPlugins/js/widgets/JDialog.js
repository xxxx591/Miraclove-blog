/**
 * 对话框
 */
cqjs.define("JDialog", {
    /**
     * 唯一标识
     */
    id: 'dialog-id',
    /**
     * 标题
     */
    title: '对话框'.t(),
    /**
     * 提示按钮文本
     */
    submitText: '确定'.t(),
    /**
     * 取消按钮文本
     */
    cancelText: '关闭'.t(),
    /**
     * 加载中文本
     */
    loadingText: '加载中'.t(),
    /**
     * 默认是最大的对话框，
     * 中等 css:'', 最小 css:'modal-sm'
     */
    css: 'modal-xl',
    /**
     * 获取对话框模板
     * @returns
     */
    getTpl: function () {
        return `<div class="modal fade" id="${this.id}">
                    <div class="modal-dialog ${this.css}">
                        <div class="modal-content">
                        <div class="modal-header">
                            <h4 class="modal-title">${this.title}</h4>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div class="modal-body">
                            <p>${this.loadingText}</p>\
                        </div>
                        <div class="modal-footer justify-content-between">
                            <button type="button" class="btn btn-default" data-dismiss="modal">${this.cancelText}</button>
                            <button type="button" role="btn-submit" class="btn btn-primary">${this.submitText}</button>
                        </div>
                        </div>
                    </div>
                </div>`;
    },
    /**
     * 创建对话框实例
     *
     * @param {Object} opt 初始参数
     */
    new: function (opt) {
        let me = this;
        cqjs.utils.apply(true, me, opt);
        $("#" + me.id).remove();
        $(document.body).append(me.getTpl());
        me.dom = $("#" + me.id).modal({ backdrop: false });
        me.body = me.dom.find('.modal-body');
        if (me.submit) {
            me.dom.on('click', '[role=btn-submit]', function () {
                if (me.submit(me)) {
                    me.dom.remove();
                }
            });
        } else {
            me.dom.find('[role=btn-submit]').hide();
        }
        me.init(me);
        $("#" + me.id).on('hide.bs.modal', function () {
            if(me.cancel){
                me.cancel();
            }
        });
    },
    /**
     * 模板方法，初始化对话框内容的入口。
     */
    init: cqjs.emptyFn,
    /**
     * 更新对话框标题
     *
     * @param {String} title
     */
    updateTitle: function (title) {
        this.dom.find('.modal-title').html(title);
    },
    /**
     * 是否繁忙，繁忙时修改提交按钮为`请稍等`，并设置为禁用状态
     *
     * @param {Boolean} busy 是否繁忙
     */
    busy: function (busy) {
        if (busy) {
            this.dom.find('[role=btn-submit]').html('请稍等'.t()).attr('disabled', true);
        } else {
            this.dom.find('[role=btn-submit]').html(this.submitText).attr('disabled', false);
        }
    },
    /**
     * 关闭对话框
     */
    close: function () {
        this.dom.remove();
    }
});

/**
 * 显示对话框
 *
 * @example
 * cqjs.showDialog({
 *      title: '提示',
 *      init: function(dialog){
 *          dialog.body.html('这是一个对话框');
 *      },
 *      submit: function(dialog){
 *          console.log('提交');
 *          dialog.close();
 *      }
 * })
 *
 * @param {Object} opt
 */
cqjs.showDialog = function (opt) {
    return cqjs.create('JDialog', opt);
};
