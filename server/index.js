/*
 * @Descripttion: 
 * @version: 0.x
 * @Author: zhai
 * @Date: 2024-01-25 20:12:04
 * @LastEditors: zhai
 * @LastEditTime: 2024-04-29 10:11:47
 */

import fs from 'fs';
import path from 'path';
import express from 'express';
import formidable from 'formidable';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import history from 'connect-history-api-fallback';
import jsonServer from 'json-server';
import auth from "json-server-auth";


const __dirname = dirname(fileURLToPath(import.meta.url));

const server = jsonServer.create()

// 前端路由
server.use(history());

// Serve static files
server.use(express.static(path.resolve(__dirname, 'web')));
server.use('/uploads', express.static(path.resolve(__dirname, 'uploads')))

// You must apply the auth middleware before the router
server.use(auth)

// json-server options.bodyParser defalut is true
// server.use(jsonServer.bodyParser);

server.use(async (req, res, next) => {
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
        // 请求中包含 FormData 对象
        if (req.method == "POST") {
            try {
                const data = {}
                const form = formidable({});
                form.uploadDir = path.resolve(__dirname, 'tmp');
                const [fields, files] = await form.parse(req);

                req.body = {
                    ...req.body,
                    ...Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, value[0]])),
                };

                Object.entries(files).map(([name, file_array]) => {
                    const file = file_array[0];
                    const oldPath = file.filepath;
                    const fileExt = file.originalFilename.split('.').pop()
                    const newPath = path.join('uploads', file.newFilename + "." + fileExt);
                    const newPathAbs = path.resolve(__dirname, newPath);
                    fs.renameSync(oldPath, newPathAbs);
                    req.body[name] = newPath;
                })

            } catch (err) {
                console.error(err);
            }
        }
    } else {
        // 请求不包含 FormData 对象
    }

    next()
}
)

const router = jsonServer.router(path.resolve(__dirname, 'db.json'))
const middlewares = jsonServer.defaults();
server.use('/api', middlewares, router);

// /!\ Bind the router db to the app
server.db = router.db

server.listen(8008, () => {
    console.log('JSON Server is running on port 8008')
})

// 独立部署
// server.listen(8077, () => {
//     console.log('JSON Server is running on port 8077')
// })