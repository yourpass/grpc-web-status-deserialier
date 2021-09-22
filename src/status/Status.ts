import * as ErrorDetails from "../gen/googleapis/google/rpc/error_details_pb";
import { Status as gRPCStatus } from "../gen/googleapis/google/rpc/status_pb";
import { Detail } from "../gen/types/Detail";

interface DeserializeBinaryInterface {
  deserializeBinary: (data: string) => Detail;
}

function isDeserializeBinaryInterface(
  data: unknown
): data is DeserializeBinaryInterface {
  if (typeof data !== "function" && typeof data !== "object") {
    return false;
  }

  if (data === null) {
    return false;
  }

  // Widen obj type to allow querying property type
  const widenedObject: { deserializeBinary?: unknown } = data;

  return typeof widenedObject.deserializeBinary === "function";
}

function isUnknownMap(data: unknown): data is { [key: string]: unknown } {
  if (typeof data !== "object") {
    return false;
  }

  return data !== null;
}

export default class Status {
  public code: number;

  public message: string;

  public detailsList: Detail[];

  /**
   * @throws Error
   */
  public constructor(code: number, message: string, base64Status?: string) {
    this.code = code;
    this.message = message;
    this.detailsList = [];

    if (base64Status) {
      this.decodeErrorDetails(base64Status);
    }
  }

  /**
   * Naming compatibility with grpc-web Status class
   */
  public getCode(): number {
    return this.code;
  }

  /**
   * Naming compatibility with grpc-web Status class
   */
  public getMessage(): string {
    return this.message;
  }

  /**
   * Naming compatibility with grpc-web Status class
   */
  public getDetailsList(): Detail[] {
    return this.detailsList;
  }

  /**
   * @throws Error
   */
  private decodeErrorDetails(base64: string) {
    try {
      const data = atob(base64);
      const uintArr = this.stringToUint8Array(data);
      const errDetail = gRPCStatus.deserializeBinary(uintArr);

      errDetail.getDetailsList().forEach((item) => {
        // We will loop through the ErrorDetails trying to find name for the class based on the type name
        const fqn = item.getTypeName().replace(/^google\.rpc\./, "");
        const fqPath = fqn.split(".");

        // Final class will be our ErrorDetail class
        let finalClass: DeserializeBinaryInterface | undefined;
        // Classlist holds the relative namespace/class based on the current loop path
        let classList: { [key: string]: unknown } = ErrorDetails;

        try {
          while (fqPath.length > 0) {
            // Grab part of the FQN from the beginning
            const path = fqPath.shift();
            if (!path) {
              throw new Error(
                "One of the error detail fully qualified names is empty"
              );
            }

            // Check if there are remaining path items, if not, path will hold the name of our class
            if (fqPath.length < 1) {
              // Run through typeguard to ensure we have the proper interface
              const tmpFinalClass = classList[path];
              if (!isDeserializeBinaryInterface(tmpFinalClass)) {
                throw new Error("Could not determine the error detail type");
              }

              finalClass = tmpFinalClass;
              break;
            }

            // Enter deeper into the class list using the FQN path
            const tmpClassList = classList[path];

            // Make sure that the classlist is an object of unknown so we can iterate deeper
            if (!isUnknownMap(tmpClassList)) {
              throw new Error(
                "One of the error detail fully qualified name was not found"
              );
            }

            classList = tmpClassList;
          }

          if (!finalClass) {
            throw new Error(
              "Failed to determine the final class from ErrorDetails"
            );
          }

          // Deserialize the class and add it to details
          this.detailsList.push(
            finalClass.deserializeBinary(item.getValue_asU8())
          );
        } catch (e) {
          // If we fail some steps, provide the info through DebugInfo error detail
          const debugInfo = new ErrorDetails.DebugInfo();
          debugInfo.setDetail(
            `Frontend error: Failure to decode error detail ${fqn}: ${e}`
          );

          this.detailsList.push(debugInfo);
          return;
        }
      });
    } catch (e) {
      throw new Error(`Unable to decode error details: ${e}`);
    }
  }

  /**
   * Helper function to create uint8 buffer from decoded string
   */
  private stringToUint8Array(str: string): Uint8Array {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0; i < str.length; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return bufView;
  }
}
