import asyncBusboy from 'async-busboy';
import { Client } from 'minio';
import { dbapi } from "@nfjs/back";
import { api, common, config } from "@nfjs/core";
import crypto from "crypto";

const moduleConfig = common.getPath(config, '@nfjs/minio-filestorage') || {};
const minioClient = new Client({
    endPoint: moduleConfig.endPoint,
    port: moduleConfig.port,
    useSSL: moduleConfig.useSSL,
    accessKey: moduleConfig.accessKey,
    secretKey: moduleConfig.secretKey
});

export async function upload(context) {
    await asyncBusboy(context.req, {
        onFile: async (fieldname, file, filename, encoding, mimetype) => {
            try {
                const raw = crypto.pseudoRandomBytes(16);
                const hex = raw.toString('hex');

                await dbapi.broker('nfc.files.add',
                    {
                        org_id: context.session.get('context.org'),
                        originalname: filename,
                        encoding: encoding,
                        mimetype: mimetype,
                        filesize: context.req.headers['content-length'],
                        destination: hex,
                        filename: hex,
                        user_id: null,
                    }, { context: context }
                );

                minioClient.putObject('root', filename, file, context.req.headers['content-length'], (err, etag) => {
                    if (err) throw new Error(err);
                    context.send(JSON.stringify({
                        id: file._filename
                    }));
                });
            }
            catch (error) {
                const err = api.nfError(error, error.message);
                context.send(err.json());
            }
        }
    });
}