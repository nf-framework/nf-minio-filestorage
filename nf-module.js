import { web } from "@nfjs/back";
import { upload, download } from './lib/file-storage.js';

const meta = {
    require: {
        after: '@nfjs/back-dbfw'
    }
};

function init() {
    web.on('POST', '/@nfjs/upload', { middleware: ['session', 'auth', 'files'], override: true }, upload, { bucket: 'nfjs-uploads' });
    web.on('GET', '/@nfjs/download/:fileName', { middleware: ['session', 'auth'], override: true }, download, { bucket: 'nfjs-uploads' });
}

export {
    init,
    meta
};
