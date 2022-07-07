import { WebSocket, MessageEvent, ErrorEvent } from "ws";
import { 
    ICON_NEXT, ICON_PREV, ICON_PAUSE, ICON_PLAY, MEDIA_ICONS, APP_NAME
} from './constants';
const SOCKET_URL = "ws://localhost:26369";


export class CiderSocket {
    connection: WebSocket
    songName: string
    currentMediaString: string
    isError: boolean = false
    currentMediaArtwork: any
    status: boolean = false
    volume: number = -1
    constructor () {
        this.connection = new WebSocket(SOCKET_URL);
        this.setup();
        this.songName = "";
        this.currentMediaString = "";
    }


    setStatus(status: boolean) {
        this.status = status;
    }
    setVolume(v: number) {
        this.volume = v;
    }
    setCurrentMediaString(name: string, artistName: string, albumName: string) {
        this.currentMediaString = `${name} - ${artistName} | ${albumName}`;
    }
    setSongName(s: string) {
        this.songName = s;
    }
    setError(e: boolean) {
        this.isError = e;
    }
    setArtwork(url: string, width: number = 50, height: number = 50) {
        url = url.replace("{w}", width.toString());
        url = url.replace("{h}", height.toString());
        this.currentMediaArtwork = url;
    }


    setup() {
        this.connection.onmessage = (event: MessageEvent) => {
            const response = JSON.parse(event.data as string);
            switch (response.type) {
                case "playbackStateUpdate":
                    const { albumName, artistName, name, artwork, status, volume } = response.data;
                    this.setStatus(status);
                    this.setVolume(volume);
                    if (this.songName !== name)  {
                        this.setSongName(name);
                        let { url } = artwork;
                        if (name && url) {
                            this.setArtwork(url);
                            this.setCurrentMediaString(name, artistName, albumName);
                        }
                    }
                    break;
                default: 
                    break;
            }
        }

        this.connection.onerror = (event: ErrorEvent) => {
            this.setError(true);
            if (event.error.code === "ECONNREFUSED") {
                process.stdout.write("")
            }
            else {
                process.stdout.write(event.message, event.error);
            }
        }
    }

    async sendCommand(command: {[key:string]: string | number}) {
        let timer = 10;
        return new Promise((resolve, _) => {
            const i = setInterval(() => {
                if (timer == 0) {
                    clearInterval(i);
                }
                if (this.connection.readyState === 1) {
                    this.connection.send(JSON.stringify(command));
                    clearInterval(i);
                    resolve(null);
                }
                timer--;
            }, 200);
        })
    }

    action(command: string, icon: string) {
        let path = `node ${__dirname}/index.js`;
        if (process.env.CIDER_DEV === undefined) {
            path = APP_NAME;
        }
        return `%{A1:${path} ${command}:}${icon}%{A}`;
    }

    showCiderAction(media: string) {
        return `%{A1:i3-msg '[class="Cider"] scratchpad show':}${media}%{A}`;
    }

    toPolyBar() {
        const output = `${this.action("-a previous", ICON_PREV)} ${this.action("-a playpause", this.status ? ICON_PAUSE : ICON_PLAY)} ${this.action("-a next", ICON_NEXT)} | ${MEDIA_ICONS["apple"]} ${this.showCiderAction(this.currentMediaString)}`;
        return output;
    }

    closeConnection() {
        if (this.connection.readyState === 1) this.connection.close();
    }

    adjustVolume(a: number) {
        let timer = 10;
        return new Promise((resolve, _) => {
            const i = setInterval(() => {
                if (timer == 0) {
                    clearInterval(i);
                }
                if (this.connection.readyState === 1 && this.volume !== -1) {
                    this.setVolume(this.volume + a)
                    this.connection.send(JSON.stringify({
                        action: "volume",
                        volume: this.volume
                    }));
                    clearInterval(i);
                    resolve(null);
                }
                timer--;
            }, 100);
        })
    }

    toVolumeStr(): string {
        return `${MEDIA_ICONS["apple"]} Music Volume: ${Math.ceil(this.volume * 100)}%`;
    }
}