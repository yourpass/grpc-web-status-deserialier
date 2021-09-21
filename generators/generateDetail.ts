import * as fs from 'fs';
import * as ErrorDetails from '../src/gen/googleapis/google/rpc/error_details_pb.js.js.js';



export default function generateDetail(typesPath: string, protoPath: string): void {
    if (!fs.existsSync(typesPath)) {
        fs.mkdirSync(typesPath);
    }

    let index = 0;
    while(typesPath[index] === protoPath[index]) {
        index++;
    }

    const remainingTypesPath = typesPath.substr(index);
    const relativePath = protoPath.substr(index);
    const typeSubdirCount = remainingTypesPath.split('/').length;

    const prefix = '../'.repeat(typeSubdirCount);

    let Detail = `
import * as ErrorDetails from "${prefix}${relativePath}/error_details_pb";

export type Detail =
`;

    Object.keys(ErrorDetails).forEach(key => {
        if (key === 'default') {
            return;
        }
        Detail +=`    | ErrorDetails.${key}
`;
    });

    Detail += ';';

    fs.writeFileSync(`${typesPath}/Detail.d.ts`, Detail);
}
