"use client";

import JsonView from "@uiw/react-json-view";
import { type ReactNode, useMemo, useState } from "react";
import { usePurchaseDocument } from "../../hooks/usePurchaseDocument";
import type { Purchase } from "../../payload-types";

const formatCurrency = (
    value?: number | null,
    currency?: Purchase["currency"],
) => {
    if (value == null) {
        return "—";
    }

    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency || "USD",
            minimumFractionDigits: 2,
        }).format(value);
    } catch {
        return value.toString();
    }
};

const formatDate = (dateString?: string) => {
    if (!dateString) return "—";

    try {
        return new Intl.DateTimeFormat("en-US", {
            dateStyle: "long",
            timeStyle: "short",
        }).format(new Date(dateString));
    } catch {
        return dateString;
    }
};

const getStatusClass = (status?: string): string => {
    switch (status?.toLowerCase()) {
        case "completed":
        case "active":
            return "completed";
        case "pending":
        case "processing":
            return "pending";
        case "failed":
        case "refunded":
            return "failed";
        default:
            return "unknown";
    }
};

const getPurchaseTypeClass = (type?: string | null): string => {
    switch (type) {
        case "original-order":
            return "original-order";
        case "reset-order":
            return "reset-order";
        case "activation-order":
            return "activation-order";
        default:
            return "";
    }
};

const formatPurchaseType = (type?: string | null): string => {
    switch (type) {
        case "original-order":
            return "Original Order";
        case "reset-order":
            return "Reset";
        case "activation-order":
            return "Activation";
        default:
            return "Order";
    }
};

const getProgramTypeClass = (type?: string | null): string => {
    switch (type) {
        case "1-step":
            return "one-step";
        case "2-step":
            return "two-step";
        case "instant":
            return "instant";
        default:
            return "";
    }
};

const formatProgramType = (type?: string | null): string => {
    switch (type) {
        case "1-step":
            return "1 Step Evaluation";
        case "2-step":
            return "2 Step Evaluation";
        case "instant":
            return "Instant";
        default:
            return "";
    }
};

const Section = ({
    title,
    children,
    badge,
}: {
    title: string;
    children: ReactNode;
    badge?: ReactNode;
}) => {
    return (
        <section className="purchase-section">
            <h3 className="purchase-section-title">
                <span>{title}</span>
                {badge}
            </h3>
            <div>{children}</div>
        </section>
    );
};

const FieldRow = ({ label, value }: { label: string; value: ReactNode }) => {
    const isEmpty =
        value === null || value === undefined || value === "" || value === "—";

    return (
        <div className="purchase-field">
            <span className="purchase-field-label">{label}</span>
            <div className={`purchase-field-value ${isEmpty ? "empty" : ""}`}>
                {value ?? "—"}
            </div>
        </div>
    );
};

const PurchaseDetailView = () => {
    const { data, isLoading, error } = usePurchaseDocument();
    const [isCompleting, setIsCompleting] = useState(false);
    const [completionError, setCompletionError] = useState<string | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [confirmOrderId, setConfirmOrderId] = useState("");

    const handleCompletePurchaseClick = () => {
        setShowConfirmDialog(true);
        setConfirmOrderId("");
        setCompletionError(null);
    };

    const handleConfirmComplete = async () => {
        if (!data?.id || !data?.orderNumber) return;

        // Validate that the entered order ID matches
        if (confirmOrderId !== String(data.orderNumber)) {
            setCompletionError(
                `Order ID mismatch. Please enter "${data.orderNumber}" to confirm.`,
            );
            return;
        }

        setIsCompleting(true);
        setCompletionError(null);
        setShowConfirmDialog(false);

        try {
            const response = await fetch("/api/admin/complete-purchase", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    purchaseId: data.id,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to complete purchase");
            }

            // Reload the page to show updated status
            window.location.reload();
        } catch (err) {
            console.error("Error completing purchase:", err);
            setCompletionError(
                err instanceof Error ? err.message : "Unknown error occurred",
            );
            setIsCompleting(false);
        }
    };

    const handleCancelConfirm = () => {
        setShowConfirmDialog(false);
        setConfirmOrderId("");
        setCompletionError(null);
    };

    const wooCreatedDate = useMemo(() => {
        if (data?.metadata && typeof data.metadata === "object") {
            const metadata = data.metadata as Record<string, unknown>;
            if (
                metadata.woo &&
                typeof metadata.woo === "object" &&
                metadata.woo !== null
            ) {
                const woo = metadata.woo as Record<string, unknown>;
                if (woo.date_created && typeof woo.date_created === "string") {
                    return woo.date_created;
                }
            }
        }
        return null;
    }, [data?.metadata]);

    const affiliateData = useMemo(() => {
        if (data?.metadata && typeof data.metadata === "object") {
            const metadata = data.metadata as Record<string, unknown>;
            if (
                metadata.affiliate &&
                typeof metadata.affiliate === "object" &&
                metadata.affiliate !== null
            ) {
                const affiliate = metadata.affiliate as Record<string, unknown>;
                return {
                    email:
                        typeof affiliate.email === "string"
                            ? affiliate.email
                            : null,
                    referralId:
                        typeof affiliate.referralId === "string"
                            ? affiliate.referralId
                            : null,
                    affiliateId:
                        typeof affiliate.affiliateId === "string"
                            ? affiliate.affiliateId
                            : null,
                };
            }
        }
        return null;
    }, [data?.metadata]);

    if (isLoading) {
        return (
            <div className="purchase-loading">Loading purchase details…</div>
        );
    }

    if (error) {
        return (
            <div className="purchase-error">
                <div className="purchase-error-box">
                    <h2 className="purchase-error-title">
                        Error Loading Purchase
                    </h2>
                    <p className="purchase-error-message">{error.message}</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return null;
    }

    return (
        <div className="purchase-detail-page">
            <header className="purchase-detail-header">
                <div className="purchase-detail-header-top">
                    <div>
                        <h1 className="purchase-detail-title">
                            Order #{data.orderNumber}
                        </h1>
                        <p className="purchase-detail-subtitle">
                            {(wooCreatedDate || data.createdAt) &&
                                `Created ${formatDate(wooCreatedDate || data.createdAt)}`}
                            {data.updatedAt &&
                                ` • Updated ${formatDate(data.updatedAt)}`}
                        </p>
                    </div>
                    <div className="purchase-badges">
                        {data.purchaseType && (
                            <span
                                className={`purchase-type-badge ${getPurchaseTypeClass(data.purchaseType)}`}
                            >
                                {formatPurchaseType(data.purchaseType)}
                            </span>
                        )}
                        {data.isInAppPurchase && (
                            <span className="purchase-inapp-badge">
                                In-App Purchase
                            </span>
                        )}
                        <span
                            className={`purchase-status-badge ${getStatusClass(data.status)}`}
                        >
                            {data.status || "Unknown"}
                        </span>
                        {data.status === "pending" && (
                            <button
                                onClick={handleCompletePurchaseClick}
                                disabled={isCompleting}
                                className="purchase-complete-button"
                                type="button"
                            >
                                {isCompleting
                                    ? "Processing..."
                                    : "Complete Purchase"}
                            </button>
                        )}
                    </div>
                </div>

                {completionError && (
                    <div className="purchase-completion-error">
                        <strong>Error:</strong> {completionError}
                    </div>
                )}

                <div className="purchase-detail-summary">
                    <div className="purchase-summary-card">
                        <div className="purchase-summary-label">
                            Total Amount
                        </div>
                        <div className="purchase-summary-value">
                            {formatCurrency(data.totalPrice, data.currency)}
                        </div>
                    </div>
                    <div className="purchase-summary-card">
                        <div className="purchase-summary-label">Customer</div>
                        <div className="purchase-summary-value">
                            {data.customerName || "—"}
                        </div>
                        <div className="purchase-summary-meta">
                            {data.customerEmail || "—"}
                        </div>
                    </div>
                    <div className="purchase-summary-card">
                        <div className="purchase-summary-label">Program</div>
                        <div className="purchase-summary-value">
                            {data.programName || "—"}
                        </div>
                        {data.purchaseType !== "activation-order" && (
                            <div className="purchase-summary-meta">
                                {data.accountSize || "—"}
                            </div>
                        )}
                    </div>
                    {affiliateData && (
                        <div className="purchase-summary-card">
                            <div className="purchase-summary-label">
                                Affiliate
                            </div>
                            <div className="purchase-summary-value">
                                {affiliateData.email || "—"}
                            </div>
                            <div className="purchase-summary-meta">
                                ID: {affiliateData.affiliateId || "—"}
                                {affiliateData.referralId &&
                                    ` • Referral: ${affiliateData.referralId}`}
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <div className="purchase-sections-grid">
                <Section title="Order Information">
                    <FieldRow label="Order Number" value={data.orderNumber} />
                    <FieldRow
                        label="Purchase Price"
                        value={formatCurrency(
                            data.purchasePrice,
                            data.currency,
                        )}
                    />
                    <FieldRow label="Discount Code" value={data.discountCode} />
                    <FieldRow label="Currency" value={data.currency} />
                </Section>

                <Section title="Customer Information">
                    <FieldRow label="Customer Name" value={data.customerName} />
                    <FieldRow
                        label="Customer Email"
                        value={data.customerEmail}
                    />
                    <FieldRow label="Region" value={data.region} />
                    <FieldRow
                        label="Billing Address"
                        value={
                            data.billingAddress ? (
                                <div className="purchase-address">
                                    {data.billingAddress.address && (
                                        <div className="purchase-address-line">
                                            {data.billingAddress.address}
                                        </div>
                                    )}
                                    {(data.billingAddress.city ||
                                        data.billingAddress.state ||
                                        data.billingAddress.postalCode) && (
                                        <div className="purchase-address-line">
                                            {[
                                                data.billingAddress.city,
                                                data.billingAddress.state,
                                                data.billingAddress.postalCode,
                                            ]
                                                .filter(Boolean)
                                                .join(", ")}
                                        </div>
                                    )}
                                    {data.billingAddress.country && (
                                        <div className="purchase-address-line">
                                            {data.billingAddress.country}
                                        </div>
                                    )}
                                </div>
                            ) : undefined
                        }
                    />
                </Section>

                {data.purchaseType !== "activation-order" && (
                    <Section
                        title="Program Details"
                        badge={
                            data.programType && (
                                <span
                                    className={`purchase-program-type-badge ${getProgramTypeClass(data.programType)}`}
                                >
                                    {formatProgramType(data.programType)}
                                </span>
                            )
                        }
                    >
                        <FieldRow
                            label="Program Name"
                            value={data.programName}
                        />
                        <FieldRow
                            label="Account Size"
                            value={data.accountSize}
                        />
                        <FieldRow
                            label="Platform Name"
                            value={data.platformName}
                        />
                    </Section>
                )}

                <Section title="Payment Details">
                    <FieldRow
                        label="Payment Method"
                        value={data.paymentMethod}
                    />
                    <FieldRow
                        label="Transaction ID"
                        value={data.transactionId}
                    />
                    <FieldRow
                        label="Selected Add-ons"
                        value={
                            data.selectedAddOns &&
                            data.selectedAddOns.length > 0 ? (
                                <ul className="purchase-addons-list">
                                    {data.selectedAddOns.map((addOn) => {
                                        const addOnName =
                                            typeof addOn.addOn === "object"
                                                ? addOn.addOn.name
                                                : String(
                                                      addOn.addOn ?? "Unknown",
                                                  );
                                        const key =
                                            addOn.id ??
                                            (typeof addOn.addOn === "object"
                                                ? addOn.addOn.id
                                                : addOn.addOn) ??
                                            addOnName;

                                        return (
                                            <li key={key}>
                                                <span className="purchase-addon-name">
                                                    {addOnName}
                                                </span>
                                                {typeof addOn.priceIncreasePercentage ===
                                                    "number" && (
                                                    <span className="purchase-addon-price">
                                                        +
                                                        {
                                                            addOn.priceIncreasePercentage
                                                        }
                                                        %
                                                    </span>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : undefined
                        }
                    />
                    <FieldRow label="Notes" value={data.notes} />
                </Section>

                {data.metadata && (
                    <Section title="Technical Metadata">
                        <div className="purchase-metadata-viewer">
                            <JsonView
                                value={data.metadata as object}
                                collapsed={1}
                                displayDataTypes={false}
                                enableClipboard={true}
                                style={{
                                    backgroundColor: "transparent",
                                    fontSize: "0.875rem",
                                }}
                            />
                        </div>
                    </Section>
                )}
            </div>

            {/* Confirmation Dialog */}
            {showConfirmDialog && (
                <div className="purchase-confirm-overlay">
                    <div className="purchase-confirm-dialog">
                        <h2 className="purchase-confirm-title">
                            Confirm Purchase Completion
                        </h2>
                        <p className="purchase-confirm-description">
                            This action will trigger Axcera and mark this
                            purchase as completed. To confirm, please enter the
                            order number below:
                        </p>
                        <div className="purchase-confirm-order-display">
                            Order #{data.orderNumber}
                        </div>
                        <div className="purchase-confirm-input-group">
                            <label
                                htmlFor="confirm-order-id"
                                className="purchase-confirm-label"
                            >
                                Enter Order Number
                            </label>
                            <input
                                id="confirm-order-id"
                                type="text"
                                value={confirmOrderId}
                                onChange={(e) =>
                                    setConfirmOrderId(e.target.value)
                                }
                                placeholder={String(data.orderNumber)}
                                className="purchase-confirm-input"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleConfirmComplete();
                                    } else if (e.key === "Escape") {
                                        handleCancelConfirm();
                                    }
                                }}
                            />
                        </div>
                        {completionError && (
                            <div className="purchase-confirm-error">
                                {completionError}
                            </div>
                        )}
                        <div className="purchase-confirm-actions">
                            <button
                                onClick={handleCancelConfirm}
                                className="purchase-confirm-button purchase-confirm-button-cancel"
                                type="button"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmComplete}
                                disabled={!confirmOrderId}
                                className="purchase-confirm-button purchase-confirm-button-confirm"
                                type="button"
                            >
                                Complete Purchase
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchaseDetailView;
