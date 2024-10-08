import { FastifyInstance } from "fastify"
import {fastifyMultipart} from "@fastify/multipart"
import path from "node:path";
import { randomUUID } from "node:crypto";
import { prisma } from '../lib/prisma'
import fs from "node:fs"
import {pipeline} from "node:stream"
import { promisify } from "node:util";

const pump = promisify(pipeline)

export async function  uploadVideoRoute(app: FastifyInstance) {
    app.register(fastifyMultipart, {
        limits:{
            fieldSize: 1_048_576 * 25, //25mb
        }
    })


    app.post('/videos', async (request, reply) => {
       const data = await request.file()

       if(!data) {
        return reply.status(400).send({error: "Entrada de arquivo ausente."})
       }

       const extension = path.extname(data.filename)

       if (extension != '.mp3'){
        return reply.status(400).send({error: 'Tipo de entrada inválido. Faça upload de um MP3'})
       }

       //elimina a extensão do nome do arquivo
       const fileBaseName = path.basename(data.filename, extension)
       const fileUploadName = `${fileBaseName}-${randomUUID()}${extension}`
       const uploadDestination = path.resolve(__dirname, '../../tmp', fileUploadName)

       await pump(data.file, fs.createWriteStream(uploadDestination))

       const video = await prisma.video.create({
        data: {
            name: data.filename,
            path: uploadDestination
        }
       })

       return {
        video,
       }
    })
}