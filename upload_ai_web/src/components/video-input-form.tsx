import {Files, FileVideo, Upload} from "lucide-react";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { getFFmpeg } from "@/lib/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { api } from "@/lib/axios";

type Status = 'Esperando' | 'Convertendo' | 'Carregando' | 'Transcrevendo' | 'Sucesso' | 'Falha'

const statusMessages = {
    Convertendo: 'Convertendo...',
    Transcrevendo: 'Transcrevendo...',
    Carregando: 'Carregando...',
    Sucesso: 'Sucesso!',
    Falha: 'Falha',
}

interface VideoInputFormProps {
    onVideoUploaded: (id: string) => void
}


export function VideoInputForm(props: VideoInputFormProps){
    const [videoFile, setVideoFile] = useState<File | null>(null)
    const [status, setStatus] = useState<Status>('Esperando')

    const promptInputRef = useRef<HTMLTextAreaElement>(null)

    function handleFileSelected(event: ChangeEvent<HTMLInputElement>){
        const { files } = event.currentTarget

        if(!files){
            return
        }

        const seletedFile = files[0]

        setVideoFile(seletedFile)
    }

    async function convertVideoToAudio(video: File) {
        console.log('Conversão iniciada.')

        const ffmpeg = await getFFmpeg()

        await ffmpeg.writeFile('input.mp4', await fetchFile(video))

       /// ffmpeg.on('log', log => {
        ///   console.log(log)
        ///})

        ffmpeg.on('progress', process => {
            console.log('Conversão em Progresso: ' + Math.round(process.progress * 100))
        })

        await ffmpeg.exec([
             '-i',
             'input.mp4', 
             '-map',
             '0:a',
             '-b:a',
             '20k',
             '-acodec',
             'libmp3lame',
             'output.mp3' 

        ])

        const data = await ffmpeg.readFile('output.mp3')

        const audioFileBlob = new Blob([data], { type: 'audio/mpeg' })
        const audioFile = new File([audioFileBlob], 'audio.mp3', {
            type: 'audio/mpeg',
        })

        console.log('Convert finished.')

        return audioFile
    }

    async function handleUploadVideo(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const prompt = promptInputRef.current?.value

        if (!videoFile) {
            return
        }

        // converter o video em áudio
        try {
            setStatus('Convertendo')

            const audioFile = await convertVideoToAudio(videoFile)

            const data = new FormData()

            data.append('file', audioFile)

            setStatus('Carregando')

            const response = await api.post('/videos', data)

            const videoId = response.data.video.id

            setStatus('Transcrevendo')

            await api.post(`/videos/${videoId}/transcription`, {
                prompt,
            })

            setStatus('Sucesso')

            props.onVideoUploaded(videoId)

        } catch (error) {

            setStatus('Falha')
        }
        //console.log('Finalizou')
        //console.log(response.data)
        //console.log(audioFile, prompt)

    }

    const previewURL = useMemo(() => {
        if (!videoFile) {
            return null
        }

        return URL.createObjectURL(videoFile)
    }, [videoFile])

    return (
        <form onSubmit={handleUploadVideo} className="space-y-6">
            <label 
                htmlFor="video"
                className=" relative border flex rouded-md aspect-video cursor-pointer border-dashed text-sm flex-col gap-2 items-center justify-center text-muted-foreground hover:bg-primary/15"
            >
                {previewURL ?  (
                    <video src={previewURL} controls={false} className="pointer-events-none absolute inset-0" />
                ) : (
                    <>
                        <FileVideo className="w-4 h-4" />
                        Carregue um video
                    </>
                     
                )}
            </label>

            <input type="file" id="video" accept="video/mp4" className="sr-only" onChange={handleFileSelected} />

            <Separator/>

            <div className="space-y-2">
            <Label htmlFor="transcription_prompt">Prompt de transcrição</Label>
            <Textarea 
                ref={promptInputRef}
                disabled={status != 'Esperando'}
                id="transcription_prompt" 
                className="h-20 leadin-relaxed resize-none"
                placeholder="Inclua palavras-chave mencionadas no video separadas por virgula (,)"
            />
            </div>

            <Button 
                data-sucess={status == 'Sucesso'}
                data-error={status == 'Falha'}
                disabled={status != 'Esperando'} 
                type="submit" 
                className="w-full data-[sucess=true]:bg-emerald-400 data-[error=true]:bg-red-400"
            >

                {status == 'Esperando' ? (
                    <>
                        Carregar Video
                        <Upload className="w-4 h-4 ml-2"/>
                    </>
                ) : statusMessages[status]}
            </Button>
      </form>
    )

}