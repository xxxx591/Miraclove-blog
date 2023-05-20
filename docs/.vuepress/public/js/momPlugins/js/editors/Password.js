cqjs.editor('password', {
    extends: "editors.char",
    getTpl: function () {
        return `<input type="password" autocomplete="off" class="form-control" id="${this.getId()}"/>`;
    }
});