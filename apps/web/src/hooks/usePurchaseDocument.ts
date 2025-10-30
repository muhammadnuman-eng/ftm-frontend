import { useDocumentInfo } from "@payloadcms/ui";
import type { Data } from "payload";
import { useMemo } from "react";
import type { Purchase } from "../payload-types";

type State = {
    data?: Purchase;
    isLoading: boolean;
    error?: Error;
};

const isPurchase = (value: unknown): value is Purchase => {
    return Boolean(
        value && typeof value === "object" && "orderNumber" in value,
    );
};

export const usePurchaseDocument = (): State => {
    const { data, isInitializing } = useDocumentInfo();

    const purchase = useMemo(() => {
        if (!data) return undefined;

        const doc = (data as Data & { doc?: unknown })?.doc;

        if (isPurchase(doc)) {
            return doc;
        }

        if (isPurchase(data)) {
            return data as Purchase;
        }

        return undefined;
    }, [data]);

    return useMemo(() => {
        return {
            data: purchase,
            isLoading: isInitializing,
            error: undefined,
        };
    }, [isInitializing, purchase]);
};
