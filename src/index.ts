const util = require('util');
const exec = util.promisify(require('child_process').exec);import { WebSocket, MessageEvent, ErrorEvent } from "ws";
import { exit } from "process";
import { ARGV, getArgv } from "./argv";
import { CiderSocket } from "./CiderSocket";

if (process.argv.length < 3) {
    process.stdout.write("Invalid Action");
    exit(1);
}

const argv = getArgv(process.argv.slice(2));


const main = async (argv: ARGV) => {
    const { action, volume } = argv;

    const ciderSocket = new CiderSocket();

    switch (action) {
        case "volume":
            await ciderSocket.adjustVolume(volume);
            // process.stdout.write(ciderSocket.toVolumeStr());
            await exec(`notify-send "${ciderSocket.toVolumeStr()}"`)
            ciderSocket.closeConnection()
            break;
        default:
            await ciderSocket.sendCommand({
                action: action
            });

            if (action !== "get-currentmediaitem") {
                ciderSocket.closeConnection()
                return;
            }

            let timer = 10;
            const i = setInterval(() => {
                if (timer == 0 || ciderSocket.isError) {
                    clearInterval(i);
                }
                if (ciderSocket.currentMediaString !== "") {
                    process.stdout.write(ciderSocket.toPolyBar());
                    clearInterval(i);
                    ciderSocket.closeConnection()
                }
                timer--;
            }, 200);

            break;
    }
}

main(argv as ARGV);