import { notFound } from "next/navigation";
import { getPrograms } from "@/data/programs";
import { isPlatformRestrictedForCountry } from "@/lib/countries";
import { getUserLocation } from "@/lib/geo";
import { getPlatforms } from "@/lib/payload";
import { InAppHeader } from "./inapp-header";
import { InAppPurchaseFlow } from "./inapp-purchase-flow";

// Enable ISR with 2 hour revalidation
export const revalidate = 7200;

type InAppPurchasePageProps = {
    searchParams?: Promise<{
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

const InAppPurchasePage = async ({ searchParams }: InAppPurchasePageProps) => {
    const sp = searchParams ? await searchParams : undefined;

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

    // Extract pre-filled data from search params
    const prefilledData = sp
        ? {
              email: sp.email || "",
              firstName: sp.firstName || "",
              lastName: sp.lastName || "",
              clientId: sp.client_id || "",
              country: sp.country || userLocation.countryCode,
              address: sp.address || "",
              city: sp.city || "",
              phone: sp.phone || "",
              state: sp.state || "",
              postalCode: sp.postalCode || "",
              ip: sp.ip || userLocation.ip,
          }
        : {
              email: "",
              firstName: "",
              lastName: "",
              clientId: "",
              country: userLocation.countryCode,
              address: "",
              city: "",
              phone: "",
              state: "",
              postalCode: "",
              ip: userLocation.ip,
          };

    return (
        <div className="relative mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
            <InAppHeader
                countryCode={userLocation.countryCode}
                countryName={userLocation.country}
                ipAddress={userLocation.ip}
            />
            <InAppPurchaseFlow
                programs={programs}
                platforms={platforms}
                prefilledData={prefilledData}
                userCountryCode={userLocation.countryCode}
                userCountryName={userLocation.country}
            />
        </div>
    );
};

export default InAppPurchasePage;
