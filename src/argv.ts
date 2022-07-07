import yargs from 'yargs';
import { INFORMATIVE_ACTIONS } from './constants';

export interface ARGV {
    [x: string]: unknown;
    action: string;
    volume: number;
    _: (string | number)[];
    $0: string;
}

export const getArgv = (argv: Array<any>) => {
    return yargs(argv)
        .options({
            action: {
                alias: "a", 
                type: "string", 
                choices: INFORMATIVE_ACTIONS,
                desc: "Send informative actions to Cider"
            },
            volume: {
                alias: "v", 
                type: "number",
                desc: "Increase/Decrease volume with this increment. Use with -a volume",
            }
        })
        .help()
        .alias('help', 'h')
        .parseSync();
}