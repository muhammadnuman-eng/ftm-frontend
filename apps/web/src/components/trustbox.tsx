"use client";

import React from "react";

interface TrustBoxProps {
    templateId?: string;
    businessUnitId?: string;
    locale?: string;
    styleHeight?: string;
    styleWidth?: string;
    theme?: "light" | "dark";
    stars?: string;
}

export const TrustBox = ({
    templateId = "5419b732fbfb950b10de65e5",
    businessUnitId = "6689230ce2870f3ba27edbd9",
    locale = "en-US",
    styleHeight = "24px",
    styleWidth = "100%",
    theme = "dark",
    stars = "4,5",
}: TrustBoxProps) => {
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        // If window.Trustpilot is available it means that we need to load the TrustBox from our ref.
        // If it's not, it means the script hasn't loaded just yet.
        // When it is, it will automatically load the TrustBox.
        if (window.Trustpilot) {
            window.Trustpilot.loadFromElement(ref.current, true);
        }
    }, []);

    return (
        <div
            ref={ref}
            className="trustpilot-widget"
            data-locale={locale}
            data-template-id={templateId}
            data-businessunit-id={businessUnitId}
            data-style-height={styleHeight}
            data-style-width={styleWidth}
            data-theme={theme}
            data-stars={stars}
        >
            <a
                href="https://www.trustpilot.com/review/fundedtradermarkets.com"
                target="_blank"
                rel="noopener noreferrer"
            >
                Trustpilot
            </a>
        </div>
    );
};

// Extend the Window interface to include Trustpilot
declare global {
    interface Window {
        Trustpilot?: {
            loadFromElement: (
                element: HTMLElement | null,
                refresh: boolean,
            ) => void;
        };
    }
}
