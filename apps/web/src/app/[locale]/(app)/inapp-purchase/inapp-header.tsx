import Link from "next/link";
import ReactCountryFlag from "react-country-flag";
import { LogoWithType } from "@/components/logo";
import { Card, CardContent } from "@/components/ui/card";

interface InAppHeaderProps {
    countryCode: string;
    countryName: string;
    ipAddress: string;
}

export function InAppHeader({
    countryCode,
    countryName,
    ipAddress,
}: InAppHeaderProps) {
    return (
        <Card
            wrapperClassName="ring ring-white/10 rounded-xl"
            className="!bg-none"
        >
            <CardContent className="relative bg-gradient-to-r from-white/[0.03] to-white/[0.01] p-6 backdrop-blur-sm">
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                    {/* Logo - Left Side */}
                    <Link href="/">
                        <LogoWithType className="h-10 md:h-12" />
                    </Link>

                    {/* User Info - Right Side */}
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <ReactCountryFlag
                                    countryCode={countryCode}
                                    svg
                                    style={{
                                        width: "28px",
                                        height: "28px",
                                        flexShrink: 0,
                                    }}
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-white/50 text-xs">
                                    {countryCode}
                                </span>
                                <span className="font-medium text-sm text-white/90">
                                    {countryName}
                                </span>
                            </div>
                        </div>
                        <div className="h-4 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                        <div className="flex flex-col">
                            <span className="text-white/40 text-xs uppercase tracking-wider">
                                IP Address
                            </span>
                            <span className="font-mono text-sm text-white/70">
                                {ipAddress}
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
