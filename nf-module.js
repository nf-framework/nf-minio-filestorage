import { web } from "@nfjs/back";
import { upload } from './lib/file-storage.js';

const meta = {
    require: {
        after: '@nfjs/back-dbfw'
    }
};

function init() {
    web.on('POST', '/@nfjs/upload', { middleware: ['session', 'auth'] }, upload);
}

export {
    init,
    meta
};
