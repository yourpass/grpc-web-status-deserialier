import * as ErrorDetails from "../gen/googleapis/google/rpc/error_details_pb";
import { Status as gRPCStatus } from "../gen/googleapis/google/rpc/status_pb";
import { Detail } from "../gen/types/Detail";

interface DeserializeBinaryInterface {
  deserializeBinary: (data: string) => Detail;
}

function isDeserializeBinaryInterface(
  data: unknown
): data is DeserializeBinaryInterface {
  if (typeof data !== "object") {
    return false;
  }

  if (data === null){
    return false;
  }

  // Widen obj type
  const wideObject: { deserializeBinary?: unknown } = data;

  return typeof wideObject.deserializeBinary === "function";
}

function isMapOfUknown(data: unknown, path: string): data is {[key: string]: unknown} {
  if (typeof data !== 'object') {
    return false;
  }

  if (data === null) {
    return false;
  }

  return Object.prototype.hasOwnProperty.call(data, path);
}

export default class Status {
  public code: number;

  public message: string;

  public detailsList: Detail[];

  /**
   * @throws Error
   */
  public constructor(code: number, message: string, binaryStatus?: string) {
    this.code = code;
    this.message = message;
    this.detailsList = [];

    if (binaryStatus) {
      this.decodeErrorDetails(binaryStatus);
    }
  }

  /**
   * @throws Error
   */
  private decodeErrorDetails(bin: string) {
    try {
      const data = atob(bin);
      const uintArr = this.stringToUint8Array(data);
      const errDetail = gRPCStatus.deserializeBinary(uintArr);
      errDetail.getDetailsList().forEach((item) => {
        const fqn = item.getTypeName().replace(/^google\.rpc\./, "");
        const fqPath = fqn.split(".");
        let finalClass: {[key:string]: unknown} = ErrorDetails;
        do {
          const path = fqPath.shift();
          if (!path) {
            throw new Error(
              "One of the error detail fully qualified names is empty"
            );
          }

          if (isMapOfUknown(finalClass, path)) {
            throw new Error(
              "One of the error detail fully qualified name was not found"
            );
          }

          finalClass = finalClass[path];
        } while (fqPath.length > 0);

        if (!isDeserializeBinaryInterface(finalClass)) {
          throw new Error("Could not determine the error detail type");
        }

        this.detailsList.push(
          finalClass.deserializeBinary(item.getValue_asU8())
        );
      });
    } catch (e) {
      throw new Error(`Unable to decode error details: ${e}`);
    }
  }

  private stringToUint8Array(str: string): Uint8Array {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0; i < str.length; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return bufView;
  }
}
