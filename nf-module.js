import { web } from "@nfjs/back";
import { upload, download } from './lib/file-storage.js';
import { api } from "@nfjs/core";

const meta = {
    require: {
        after: '@nfjs/back-dbfw'
    }
};

function init() {
    web.on('POST', '/@nfjs/upload', { middleware: ['session', 'auth', 'files'], override: true }, (async (context) => {
        try {
            const { id, filename } = await upload(context.fileInfo, context);
            context.send(JSON.stringify({
                id: id,
                filename: filename
            }));
        }
        catch (error) {
            const err = api.nfError(error, error.message);
            context.send(err.json());
        }
    }));

    web.on('GET', '/@nfjs/download/:fileName', { middleware: ['session', 'auth'], override: true }, download);
}

export {
    init,
    meta
};
