import * as fs from "fs";
import { exit } from "process";
import { WebSocket, MessageEvent, ErrorEvent } from "ws";
import { 
    ICON_NEXT, ICON_PREV, ICON_PAUSE, ICON_PLAY, MEDIA_ICONS, APP_NAME
} from './constants';
const SOCKET_URL = "ws://localhost:26369";

class CiderSocket {
    connection: WebSocket
    songName: string
    currentMediaString: string
    isError: boolean = false
    currentMediaArtwork: any
    status: boolean = false
    constructor () {
        this.connection = new WebSocket(SOCKET_URL);
        this.setup();
        this.songName = "";
        this.currentMediaString = "";
    }


    setStatus(status: boolean) {
        this.status = status;
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
                    const { albumName, artistName, name, artwork, status } = response.data;
                    this.setStatus(status);
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
                console.log("")
            }
            else {
                console.log(event.message, event.error);
            }
        }
    }

    async sendCommand(command: string) {
        let timer = 10;
        return new Promise((resolve, _) => {
            const i = setInterval(() => {
                if (timer == 0) {
                    clearInterval(i);
                }
                if (this.connection.readyState === 1) {
                    this.connection.send(JSON.stringify({
                        action: command
                    }));
                    clearInterval(i);
                    resolve(null);
                }
                timer--;
            }, 200);
        })
    }

    action(command: string, icon: string) {
        let path = `node ${__filename}`;
        if (process.env.CIDER_DEV === undefined) {
            path = APP_NAME;
        }
        return `%{A1:${path} ${command}:}${icon}%{A}`;
    }

    toPolyBar() {
        const output = `${this.action("previous", ICON_PREV)} ${this.action("playpause", this.status ? ICON_PAUSE : ICON_PLAY)} ${this.action("next", ICON_NEXT)} | ${MEDIA_ICONS["apple"]} ${this.currentMediaString}`;
        return output;
    }
}

if (process.argv.length !== 3) {
    console.log("Invalid Action");
    exit(1);
}
const command = process.argv[process.argv.length - 1]
if (command == "help") {
    console.log(`Valid actions are "playpause", "play", "pause", "next", "previous", "get-currentmediaitem"`);
    exit(0);
}

const main = async (command: string) => {
    const ciderSocket = new CiderSocket();
    await ciderSocket.sendCommand(command);

    switch (command) {
        case "get-currentmediaitem":
            let timer = 10;
            const i = setInterval(() => {
                if (timer == 0 || ciderSocket.isError) {
                    clearInterval(i);
                }
                if (ciderSocket.currentMediaString !== "") {
                    console.log(ciderSocket.toPolyBar());
                    ciderSocket.connection.close();
                    clearInterval(i);
                }
                timer--;
            }, 200);
            break;
        default:
            ciderSocket.connection.close();
            break;
    }
}

main(command);