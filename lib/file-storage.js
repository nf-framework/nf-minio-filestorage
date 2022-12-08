import { dbapi } from "@nfjs/back";
import crypto from "crypto";
import { putObject, getObject } from './minio.js';
import { api } from "@nfjs/core";

export async function upload(fileInfo, context, options) {
    try {
        options = Object.assign({
            bucket: 'nfjs-uploads'
        }, options);
    
        const raw = crypto.pseudoRandomBytes(16);
        const hex = raw.toString('hex');
    
        let { data } = await dbapi.broker('nfc.files.add',
            {
                org_id: context.session.get('context.org'),
                originalname: fileInfo.fileName,
                encoding: fileInfo.encoding,
                mimetype: fileInfo.mimetype,
                filesize: fileInfo.fileSize,
                destination: options.bucket,
                filename: hex,
                user_id: context.session.get('context.user_id'),
            }, { context: context }
        );
    
        await putObject(options.bucket, hex, fileInfo.fileStream, fileInfo.fileSize, {
            encoding: fileInfo.encoding,
            'Content-Type': fileInfo.mimeType
        });
    
        return {
            id: data.id,
            filename: hex
        }
    }
    catch(err) {
        throw new Error(err);
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