import * as path from 'path';
import generateDetail from './generateDetail';

const typesArgIndex = process.argv.indexOf('--types-path');

if (typesArgIndex < 0) {
    console.error("You must provide --types-path argument to specify where types are generated");
    process.exit(1);
}

let typesPath: string;

if (process.argv[typesArgIndex].indexOf('=') > 0) {
    typesPath = process.argv[typesArgIndex].replace(/--types-path=/, '');
} else {
    typesPath = process.argv[typesArgIndex+1];
}

if (!typesPath) {
    console.error("Invalid types path specified");
    process.exit(137);
}

const protoArgIndex = process.argv.indexOf('--proto-path');

if (protoArgIndex < 0) {
    console.error("You must provide --proto-path argument to specify where proto are generated");
    process.exit(1);
}

let protoPath: string;

if (process.argv[protoArgIndex].indexOf('=') > 0) {
    protoPath = process.argv[protoArgIndex].replace(/--proto-path=/, '');
} else {
    protoPath = process.argv[protoArgIndex+1];
}

if (!protoPath) {
    console.error("Invalid proto path specified");
    process.exit(137);
}

generateDetail(path.resolve(typesPath), path.resolve(protoPath));
