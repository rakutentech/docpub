const Document = require('./document');

module.exports = class Category extends Document {
    constructor(path) {
        super(path);

        this.type = 'category';
        this.sections = [];
    }

    read() {
        return super.read()
            .then(subdirs => {
                subdirs.map(() => {});
            });
    }
};
