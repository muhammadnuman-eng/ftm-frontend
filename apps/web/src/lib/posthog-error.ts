import { hashEmail } from "./hash-utils";
import { getPostHogServer } from "./posthog-server";

type ErrorType = "webhook" | "action" | "api";

interface BaseErrorContext {
    errorType: ErrorType;
    source: string;
    errorMessage: string;
    errorStack?: string;
    timestamp: string;
}

interface WebhookErrorContext extends BaseErrorContext {
    errorType: "webhook";
    purchaseId?: string | number;
    orderNumber?: string;
    status?: string;
    amount?: number;
    currency?: string;
    customerEmailHash?: string;
    webhookType?: string;
    transactionId?: string;
    gateway?: string;
    [key: string]: unknown;
}

interface ActionErrorContext extends BaseErrorContext {
    errorType: "action";
    actionName: string;
    userId?: string;
    userEmailHash?: string;
    [key: string]: unknown;
}

interface ApiErrorContext extends BaseErrorContext {
    errorType: "api";
    endpoint: string;
    method?: string;
    statusCode?: number;
    [key: string]: unknown;
}

type ErrorContext = WebhookErrorContext | ActionErrorContext | ApiErrorContext;

/**
 * Extract error message and stack from an unknown error
 */
function extractErrorDetails(error: unknown): {
    message: string;
    stack?: string;
} {
    if (error instanceof Error) {
        return {
            message: error.message,
            stack: error.stack,
        };
    }

    if (typeof error === "string") {
        return { message: error };
    }

    return {
        message: JSON.stringify(error),
    };
}

/**
 * Log error to PostHog with context
 */
function logErrorToPostHog(context: ErrorContext): void {
    try {
        const posthog = getPostHogServer();

        // Create a distinct ID for tracking (use source + timestamp for uniqueness)
        const distinctId = `error_${context.source}_${Date.now()}`;

        posthog.capture({
            distinctId,
            event: "error_occurred",
            properties: context,
        });

        // Also keep console.error for development
        console.error(`[PostHog Error Log] ${context.source}:`, context);
    } catch (loggingError) {
        // Don't let logging errors break the application
        console.error("Failed to log error to PostHog:", loggingError);
    }
}

/**
 * Log webhook errors with payment context
 */
export function logWebhookError(params: {
    source: string;
    error: unknown;
    gateway?: string;
    webhookType?: string;
    purchaseId?: string | number;
    orderNumber?: string;
    status?: string;
    amount?: number;
    currency?: string;
    customerEmail?: string;
    transactionId?: string;
    additionalContext?: Record<string, unknown>;
}): void {
    const errorDetails = extractErrorDetails(params.error);

    const context: WebhookErrorContext = {
        errorType: "webhook",
        source: params.source,
        errorMessage: errorDetails.message,
        errorStack: errorDetails.stack,
        timestamp: new Date().toISOString(),
        gateway: params.gateway,
        webhookType: params.webhookType,
        purchaseId: params.purchaseId,
        orderNumber: params.orderNumber,
        status: params.status,
        amount: params.amount,
        currency: params.currency,
        customerEmailHash: hashEmail(params.customerEmail),
        transactionId: params.transactionId,
        ...params.additionalContext,
    };

    logErrorToPostHog(context);
}

/**
 * Log server action errors
 */
export function logActionError(params: {
    actionName: string;
    error: unknown;
    userId?: string;
    userEmail?: string;
    additionalContext?: Record<string, unknown>;
}): void {
    const errorDetails = extractErrorDetails(params.error);

    const context: ActionErrorContext = {
        errorType: "action",
        source: `action_${params.actionName}`,
        actionName: params.actionName,
        errorMessage: errorDetails.message,
        errorStack: errorDetails.stack,
        timestamp: new Date().toISOString(),
        userId: params.userId,
        userEmailHash: hashEmail(params.userEmail),
        ...params.additionalContext,
    };

    logErrorToPostHog(context);
}

/**
 * Log general API route errors
 */
export function logApiError(params: {
    endpoint: string;
    error: unknown;
    method?: string;
    statusCode?: number;
    additionalContext?: Record<string, unknown>;
}): void {
    const errorDetails = extractErrorDetails(params.error);

    const context: ApiErrorContext = {
        errorType: "api",
        source: `api_${params.endpoint}`,
        endpoint: params.endpoint,
        method: params.method,
        statusCode: params.statusCode,
        errorMessage: errorDetails.message,
        errorStack: errorDetails.stack,
        timestamp: new Date().toISOString(),
        ...params.additionalContext,
    };

    logErrorToPostHog(context);
}
