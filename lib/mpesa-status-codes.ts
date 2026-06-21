/**
 * M-Pesa Status Code Mappings
 * Maps response codes to user-friendly messages with exact feedback
 */

export const MPesaStatusCodes = {
  // Transaction Status Codes
  "0": {
    status: "success",
    message: "Transaction completed successfully",
    icon: "check",
    color: "emerald",
  },
  "1": {
    status: "cancelled",
    message: "Transaction cancelled by user",
    icon: "x",
    color: "amber",
  },
  "2": {
    status: "timeout",
    message: "Request timeout. No response from customer.",
    icon: "clock",
    color: "gray",
  },

  // Error Codes
  "1001": {
    status: "error",
    message: "Unable to lock subscriber record",
    icon: "alert",
    color: "red",
  },
  "1002": {
    status: "error",
    message: "Invalid Account Number",
    icon: "alert",
    color: "red",
  },
  "1003": {
    status: "error",
    message: "Funds insufficient for transaction",
    icon: "alert",
    color: "red",
  },
  "1004": {
    status: "error",
    message: "Transaction exceeds daily limit",
    icon: "alert",
    color: "red",
  },
  "1005": {
    status: "error",
    message: "One or more parameters invalid",
    icon: "alert",
    color: "red",
  },
  "1006": {
    status: "error",
    message: "Transaction ID already exists",
    icon: "alert",
    color: "red",
  },
  "1007": {
    status: "error",
    message: "Connect timeout with payment gateway",
    icon: "alert",
    color: "red",
  },
  "1008": {
    status: "error",
    message: "Message delivery failed",
    icon: "alert",
    color: "red",
  },
  "1009": {
    status: "error",
    message: "Invalid shortcode",
    icon: "alert",
    color: "red",
  },
  "1010": {
    status: "error",
    message: "Invalid initiator",
    icon: "alert",
    color: "red",
  },
  "1011": {
    status: "error",
    message: "Invalid credentials",
    icon: "alert",
    color: "red",
  },
  "1012": {
    status: "error",
    message: "Invalid amount",
    icon: "alert",
    color: "red",
  },
  "1013": {
    status: "error",
    message: "Subscriber not found",
    icon: "alert",
    color: "red",
  },
  "1014": {
    status: "error",
    message: "Transaction query timeout",
    icon: "alert",
    color: "red",
  },
  "1015": {
    status: "error",
    message: "Queue timeout",
    icon: "alert",
    color: "red",
  },
  "1016": {
    status: "error",
    message: "Reversal timeout",
    icon: "alert",
    color: "red",
  },
  "1017": {
    status: "error",
    message: "Message undeliverable",
    icon: "alert",
    color: "red",
  },
  "1018": {
    status: "error",
    message: "Account restricted",
    icon: "alert",
    color: "red",
  },
  "1019": {
    status: "error",
    message: "Transaction failed",
    icon: "alert",
    color: "red",
  },
  "1020": {
    status: "error",
    message: "OTP validate not successful",
    icon: "alert",
    color: "red",
  },
  "1021": {
    status: "error",
    message: "Invalid format",
    icon: "alert",
    color: "red",
  },

  // Pending/Processing Codes
  "1032": {
    status: "cancelled",
    message: "Request cancelled by user. Please try again.",
    icon: "x",
    color: "amber",
  },
  "1033": {
    status: "error",
    message: "System malfunction",
    icon: "alert",
    color: "red",
  },
  "1034": {
    status: "error",
    message: "Request timeout",
    icon: "alert",
    color: "red",
  },
  "1035": {
    status: "error",
    message: "Invalid encryption",
    icon: "alert",
    color: "red",
  },
  "1036": {
    status: "error",
    message: "Invalid command type",
    icon: "alert",
    color: "red",
  },
  "1037": {
    status: "error",
    message: "Invalid transaction ID",
    icon: "alert",
    color: "red",
  },
  "1038": {
    status: "error",
    message: "Invalid session",
    icon: "alert",
    color: "red",
  },
  "1039": {
    status: "error",
    message: "Invalid account",
    icon: "alert",
    color: "red",
  },
  "1040": {
    status: "error",
    message: "Transaction processing failed",
    icon: "alert",
    color: "red",
  },
  "1041": {
    status: "error",
    message: "Network timeout",
    icon: "alert",
    color: "red",
  },
  "1042": {
    status: "error",
    message: "Insufficient credit",
    icon: "alert",
    color: "red",
  },
  "1043": {
    status: "error",
    message: "User account suspended",
    icon: "alert",
    color: "red",
  },
  "1044": {
    status: "error",
    message: "Duplicate transaction",
    icon: "alert",
    color: "red",
  },

  // Additional Common Codes
  "-1": {
    status: "error",
    message: "Transaction processing error",
    icon: "alert",
    color: "red",
  },
  "-2": {
    status: "error",
    message: "Invalid transaction request",
    icon: "alert",
    color: "red",
  },
  "-3": {
    status: "error",
    message: "Duplicate transaction detected",
    icon: "alert",
    color: "red",
  },
} as const;

export type MPesaStatusCode = keyof typeof MPesaStatusCodes;
export type MPesaStatusType = "success" | "cancelled" | "timeout" | "error" | "pending";

export function getMPesaFeedback(code: string): (typeof MPesaStatusCodes)[MPesaStatusCode] {
  return (
    MPesaStatusCodes[code as MPesaStatusCode] || {
      status: "error",
      message: `Unknown response code: ${code}`,
      icon: "alert",
      color: "red",
    }
  );
}

export function formatMPesaMessage(feedback: ReturnType<typeof getMPesaFeedback>): string {
  return feedback.message;
}

/**
 * M-Pesa STK Push Result Codes
 */
export const STKPushResultCodes = {
  "0": "Successfully completed transaction",
  "1": "Insufficient Funds",
  "2": "Less than minimum transaction value",
  "3": "More than maximum transaction value",
  "4": "Would Exceed Daily Limit",
  "5": "Would Exceed Minimum Balance",
  "6": "Could not process transaction",
  "7": "Error occurred while processing the transaction",
  "8": "Transaction timed out",
  "9": "Transaction cancelled by user",
  "10": "Transaction blocked",
  "11": "Request cancelled by user",
  "12": "Initiator could not be authenticated",
  "13": "Version of API used is not supported",
  "14": "Initiate STK request while transaction request is pending",
  "15": "The balance is insufficient for the transaction",
  "16": "Invalid shortcode",
  "17": "Invalid phone number",
  "18": "The amount is invalid",
  "19": "The Transaction Description is invalid",
  "20": "The Transaction Type is invalid",
} as const;

export function getSTKPushMessage(code: string | number): string {
  return (
    STKPushResultCodes[code as keyof typeof STKPushResultCodes] ||
    `Transaction status: ${code}`
  );
}

/**
 * Query Response Result Codes
 */
export const QueryResponseCodes = {
  "0": "The transaction has completed successfully",
  "1": "The transaction could not be found on the system",
  "2": "The transaction processing is still in progress",
  "429": {
    message: "Too many requests. Please wait before trying again.",
    retryAfter: 60,
  },
  "500": "Internal server error. Please try again later.",
  "503": "Service temporarily unavailable. Please try again later.",
} as const;

export function getQueryResponseMessage(code: string | number): string {
  const response = QueryResponseCodes[code as keyof typeof QueryResponseCodes];
  if (typeof response === "string") {
    return response;
  }
  if (response && typeof response === "object" && "message" in response) {
    return response.message;
  }
  return `Response status: ${code}`;
}
