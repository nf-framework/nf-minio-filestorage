import { common, config } from "@nfjs/core";
import { Client } from 'minio';

const moduleConfig = common.getPath(config, '@nfjs/minio-filestorage') || null;
if (!moduleConfig) {
    console.log('Minio is not initialized')
}
const minioClient = !moduleConfig ? null : new Client({
    endPoint: moduleConfig?.endPoint,
    port: moduleConfig?.port,
    useSSL: moduleConfig?.useSSL,
    accessKey: moduleConfig?.accessKey,
    secretKey: moduleConfig?.secretKey
});


export async function putObject(bucketName, fileName, fileStream, size, meta) {
    return new Promise((resolve, reject) => {
        if (minioClient.bucketExists(bucketName, (e, exists) => {
            if (!exists) {
                minioClient.makeBucket(bucketName, (e) => {
                    if (e) reject(e);

                    minioClient.putObject(bucketName, fileName, fileStream, size, meta, (e, etag) => {
                        if (e) reject(e);
                        resolve(etag);
                    });
                });
            }
            else {
                minioClient.putObject(bucketName, fileName, fileStream, size, meta, (e, etag) => {
                    if (e) reject(e);
                    resolve(etag);
                });
            }
        }));
    });
}

export async function getObject(bucketName, fileName) {
    return new Promise((resolve, reject) => {
        minioClient.getObject(bucketName, fileName, (err, stream) => {
            if (err) {
                reject(err);
            }
            resolve(stream);
        });
    });
}