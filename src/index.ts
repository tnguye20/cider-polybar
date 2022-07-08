const util = require('util');
const exec = util.promisify(require('child_process').exec);
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
            await exec(`notify-send "${ciderSocket.toVolumeStr()}"`)
            ciderSocket.closeConnection();
            break;
        case "autoplay":
            await ciderSocket.toggleAutoplay();
            await exec(`notify-send "${ciderSocket.toAutoplayStr()}"`)
            ciderSocket.closeConnection();
            break;
        default:
            await ciderSocket.sendCommand({
                action: action
            });

            if (action !== "get-currentmediaitem" || ciderSocket.isError) {
                ciderSocket.closeConnection()
                return;
            }

            await ciderSocket.waitToConnect(() => ciderSocket.currentMediaString !== "");
            if (ciderSocket.currentMediaString !== "") {
                process.stdout.write(ciderSocket.toPolyBar());
                ciderSocket.closeConnection()
            }

            break;
    }
}

main(argv as ARGV);
