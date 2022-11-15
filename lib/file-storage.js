import { dbapi } from "@nfjs/back";
import { api } from "@nfjs/core";
import crypto from "crypto";
import { putObject, getObject } from './minio.js';

export async function upload(context) {
    try {
        const raw = crypto.pseudoRandomBytes(16);
        const hex = raw.toString('hex');

        let { data } = await dbapi.broker('nfc.files.add',
            {
                org_id: context.session.get('context.org'),
                originalname: context.fileInfo.fileName,
                encoding: context.fileInfo.encoding,
                mimetype: context.fileInfo.mimetype,
                filesize: context.req.headers['content-length'],
                destination: context.store.bucket,
                filename: hex,
                user_id: context.session.get('context.user_id'),
            }, { context: context }
        );

        await putObject(context.store.bucket, hex, context.fileInfo.fileStream, context.req.headers['content-length'], {
            encoding: context.fileInfo.encoding,
            'Content-Type': context.fileInfo.mimeType,
            originalname: context.fileInfo.fileName
        });
        context.send(JSON.stringify({
            id: data.id,
            filename: hex
        }));
    }
    catch (error) {
        const err = api.nfError(error, error.message);
        context.send(err.json());
    }
}

export async function download(context) {
    try {
        const result = await dbapi.query(
            'select * from nfc.v4files t where t.filename = :filename',
            { filename: context.params.fileName },
            { context: context }
        );

        if (result.data && result.data[0]) {
            let file = result.data[0];

            if (file.mimetype) {
                context.type('Content-Type', file.mimetype);
            }
            const headers = {
                'Content-Disposition': `attachment; filename=${encodeURIComponent(file.originalname)}`,
                'Content-Transfer-Encoding': 'binary'
            }
            context.headers(headers);
            const data = await getObject(file.destination, context.params.fileName);
            context.send(data);
        }
    } catch (error) {
        context.code(404);
        const err = api.nfError(error, error.message);
        context.send(err.json());
    }
}