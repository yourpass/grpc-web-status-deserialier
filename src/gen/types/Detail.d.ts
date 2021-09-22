
import * as ErrorDetails from "./googleapis/google/rpc/error_details_pb";

export type Detail =
    | ErrorDetails.BadRequest
    | ErrorDetails.DebugInfo
    | ErrorDetails.ErrorInfo
    | ErrorDetails.Help
    | ErrorDetails.LocalizedMessage
    | ErrorDetails.PreconditionFailure
    | ErrorDetails.QuotaFailure
    | ErrorDetails.RequestInfo
    | ErrorDetails.ResourceInfo
    | ErrorDetails.RetryInfo
;