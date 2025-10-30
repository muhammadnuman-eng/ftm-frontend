"use client";

import { DollarSignIcon } from "lucide-react";
import { useState } from "react";
import { PayoutRequestModal } from "./payout-request-modal";

interface PayoutRequestButtonProps {
    unpaidEarnings: number;
}

export function PayoutRequestButton({
    unpaidEarnings,
}: PayoutRequestButtonProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 font-medium text-white transition-colors hover:bg-cyan-600"
            >
                <DollarSignIcon className="h-5 w-5" />
                Request Payout
            </button>

            <PayoutRequestModal
                open={open}
                onOpenChange={setOpen}
                unpaidEarnings={unpaidEarnings}
            />
        </>
    );
}
