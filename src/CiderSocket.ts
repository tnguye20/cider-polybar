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
    autoplay: boolean | null = null
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
    setAutoplay(a: boolean) {
        this.autoplay = a;
    }


    setup() {
        this.connection.onmessage = (event: MessageEvent) => {
            const response = JSON.parse(event.data as string);
            switch (response.type) {
                case "playbackStateUpdate":
                    const { albumName, artistName, name, artwork, status, volume, autoplayEnabled } = response.data;
                    this.setStatus(status);
                    this.setVolume(volume);
                    this.setAutoplay(autoplayEnabled);
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
        const output = `${this.action("-a previous", ICON_PREV)} ${this.action("-a playpause", this.status ? ICON_PAUSE : ICON_PLAY)} ${this.action("-a next", ICON_NEXT)} | ${MEDIA_ICONS["apple"]} ${this.showCiderAction(
                this.currentMediaString.length > 50
                ? this.currentMediaString.slice(0, 50) + "..."
                : this.currentMediaString
            )}`;
        return output;
    }

    closeConnection() {
        if (this.connection.readyState === 1) this.connection.close();
    }

    async waitToConnect(condition: () => boolean = () => true) {
        let timer = 10;
        return new Promise((resolve, _) => {
            const i = setInterval(() => {
                if (timer == 0) {
                    clearInterval(i);
                    this.closeConnection()
                }
                if (this.connection.readyState === 1 && condition()) {
                    clearInterval(i);
                    resolve(null);
                }
                timer--;
            }, 100);
        })
    }

    async adjustVolume(a: number) {
        const condition = () => this.volume !== -1
        await this.waitToConnect(condition);
        this.setVolume(this.volume + a);
        const command = {
            action: "volume",
            volume: this.volume
        }
        this.connection.send(JSON.stringify(command));
    }

    async sendCommand(command: {[key:string]: string | number}, condition: () => boolean = () => true) {
        await this.waitToConnect(condition);
        this.connection.send(JSON.stringify(command));
    }

    async toggleAutoplay() {
        await this.waitToConnect(() => this.autoplay !== null);
        this.setAutoplay(!this.autoplay);
        const command = {
            action: "set-autoplay",
            autoplay: this.autoplay
        }
        console.log(command);
        this.connection.send(JSON.stringify(command));
    }

    toVolumeStr(): string {
        return `${MEDIA_ICONS["apple"]} Music Volume: ${Math.ceil(this.volume * 100)}%`;
    }
    toAutoplayStr(): string {
        return `${MEDIA_ICONS["apple"]} Autoplay: ${this.autoplay}`;
    }
}
