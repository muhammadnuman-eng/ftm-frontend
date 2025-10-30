import type { ReactNode } from "react";

type RootLayoutProps = {
    children: ReactNode;
};

// Minimal root layout - does not render html/body tags
// Those are rendered by [locale]/layout.tsx for localized routes
// This layout is only used for root-level pages like not-found
export default function RootLayout({ children }: RootLayoutProps) {
    return children;
}
