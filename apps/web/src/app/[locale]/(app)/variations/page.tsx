import Link from "next/link";
import { notFound } from "next/navigation";
import ReactCountryFlag from "react-country-flag";
import { SectionHeader } from "@/components/section-header";
import { Card, CardContent } from "@/components/ui/card";
import { getPrograms } from "@/data/programs";
import { isPlatformRestrictedForCountry } from "@/lib/countries";
import { getUserLocation } from "@/lib/geo";
import { getPlatforms } from "@/lib/payload";
import { VariationsWrapper } from "./variations-wrapper";

export const revalidate = false;
export const dynamic = "force-dynamic";

const categorySlugs = ["1-step", "2-step", "instant"] as const;

type VariationsPageProps = {
    searchParams?: Promise<{
        category?: string;
        program?: string;
        accountSize?: string;
        platform?: string;
        // In-app purchase params
        inapp?: string;
        embed?: string;
        email?: string;
        firstName?: string;
        lastName?: string;
        client_id?: string;
        country?: string;
        address?: string;
        city?: string;
        phone?: string;
        state?: string;
        postalCode?: string;
        ip?: string;
    }>;
};

const VariationsPage = async ({ searchParams }: VariationsPageProps) => {
    const sp = searchParams ? await searchParams : undefined;
    const requestedAccountSize = sp?.accountSize;

    // Fetch programs with discounts for all account sizes
    const programs = await getPrograms();
    const rawPlatforms = await getPlatforms();
    const userLocation = await getUserLocation();

    const platforms = rawPlatforms.map((platform) => ({
        ...platform,
        isRestricted: isPlatformRestrictedForCountry(
            platform,
            userLocation.countryCode,
        ),
    }));

    if (!programs || programs.length === 0) {
        notFound();
    }

    const requestedCategory = sp?.category;
    const normalizedCategory = categorySlugs.find(
        (category) => category === requestedCategory,
    );

    // Parse and validate additional query parameters
    const requestedProgram = sp?.program;
    const requestedPlatform = sp?.platform;

    // Find the requested program if it exists
    const initialProgram = requestedProgram
        ? programs.find(
              (program) =>
                  program.slug === requestedProgram ||
                  program.id.toString() === requestedProgram,
          )
        : null;

    // If no specific program is requested but we have category and account size,
    // find a program in that category that has the account size
    const programWithAccountSize =
        !initialProgram && requestedAccountSize && normalizedCategory
            ? programs.find(
                  (program) =>
                      program.category === normalizedCategory &&
                      program.pricingTiers?.some(
                          (tier) => tier.accountSize === requestedAccountSize,
                      ),
              )
            : initialProgram;

    // Validate account size exists in the selected program
    const initialAccountSize =
        requestedAccountSize && programWithAccountSize
            ? programWithAccountSize.pricingTiers?.find(
                  (tier) => tier.accountSize === requestedAccountSize,
              )?.accountSize
            : null;

    // Validate platform exists
    const initialPlatform = requestedPlatform
        ? platforms.find(
              (platform) =>
                  platform.slug === requestedPlatform && !platform.isRestricted,
          )?.slug || null
        : null;

    // Extract in-app purchase params to preserve them
    const inAppParams = sp
        ? {
              inapp: sp.inapp,
              embed: sp.embed,
              email: sp.email,
              firstName: sp.firstName,
              lastName: sp.lastName,
              client_id: sp.client_id,
              country: sp.country,
              address: sp.address,
              city: sp.city,
              phone: sp.phone,
              state: sp.state,
              postalCode: sp.postalCode,
              ip: sp.ip,
          }
        : undefined;

    // Check if we're in embed mode
    const isEmbedMode = sp?.embed === "1";

    return (
        <div className="relative mx-auto max-w-7xl space-y-6 px-4 py-16 sm:space-y-12 sm:px-6 lg:px-8">
            {/* Page Header - hidden in embed mode */}
            {!isEmbedMode && (
                <SectionHeader
                    title={"Select Your\n Preferred Challenge"}
                    titleHighlight="Preferred Challenge"
                    showVideo={false}
                />
            )}

            {/* User Info Bar */}
            <Card
                wrapperClassName="ring ring-white/10 rounded-xl"
                className="!bg-none relative overflow-hidden bg-gradient-to-r from-white/[0.03] to-white/[0.01] backdrop-blur-sm"
            >
                <CardContent className="relative p-6">
                    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                        <div className="flex w-full items-center justify-center gap-6 sm:w-auto sm:justify-start">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <ReactCountryFlag
                                        countryCode={userLocation.countryCode}
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
                                        {userLocation.countryCode}
                                    </span>
                                    <span className="font-medium text-sm text-white/90">
                                        {userLocation.country}
                                    </span>
                                </div>
                            </div>
                            <div className="h-4 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                            <div className="flex flex-col">
                                <span className="text-white/40 text-xs uppercase tracking-wider">
                                    IP Address
                                </span>
                                <span className="font-mono text-sm text-white/70">
                                    {userLocation.ip}
                                </span>
                            </div>
                        </div>
                        <div className="relative flex w-full items-center justify-center gap-3 pt-4 sm:w-auto sm:justify-end sm:pt-0">
                            <div className="absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent sm:hidden" />
                            <div className="flex items-center gap-2">
                                <Link
                                    href="mailto:support@fundedtradermarkets.com"
                                    className="text-sm text-white/60 hover:text-lime-500 hover:underline hover:underline-offset-4"
                                >
                                    Email Support
                                </Link>
                                <span className="text-white/40">-</span>
                                <a
                                    href="https://intercom.help/fundedtradermarkets/en"
                                    rel="noopener noreferrer"
                                    target="_blank"
                                    className="text-sm text-white/60 hover:text-lime-500 hover:underline hover:underline-offset-4"
                                >
                                    Help Center
                                </a>
                                <span className="text-white/40">-</span>
                                <a
                                    href="https://discord.com/invite/ftmarkets"
                                    rel="noopener noreferrer"
                                    target="_blank"
                                    className="text-indigo-500 text-sm hover:text-lime-500 hover:underline hover:underline-offset-4"
                                >
                                    Discord
                                </a>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Main Selection Interface */}
            <VariationsWrapper
                programs={programs}
                platforms={platforms}
                initialCategory={normalizedCategory}
                initialProgram={programWithAccountSize}
                initialAccountSize={initialAccountSize}
                initialPlatform={initialPlatform}
                userCountryCode={userLocation.countryCode}
                userCountryName={userLocation.country}
                inAppParams={inAppParams}
            />
        </div>
    );
};

export default VariationsPage;
