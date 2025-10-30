import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { importExportPlugin } from "@payloadcms/plugin-import-export";
import { searchPlugin } from "@payloadcms/plugin-search";
import { seoPlugin } from "@payloadcms/plugin-seo";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import { buildConfig } from "payload";
import sharp from "sharp";
import { AddOns } from "./collections/AddOns";
import { Authors } from "./collections/Authors";
import { Categories } from "./collections/Categories";
import { ContactMessages } from "./collections/ContactMessages";
import { Courses } from "./collections/Courses";
import { Coupons } from "./collections/Coupons";
import { CouponUsage } from "./collections/CouponUsage";
import { FaqCategories } from "./collections/FaqCategories";
import { Faqs } from "./collections/Faqs";
import { Lessons } from "./collections/Lessons";
import { Media } from "./collections/Media";
import { Modules } from "./collections/Modules";
import { NewsletterSubscriptions } from "./collections/NewsletterSubscriptions";
import { PayoutRequests } from "./collections/PayoutRequests";
import { Payouts } from "./collections/Payouts";
import { Platforms } from "./collections/Platforms";
import { Posts } from "./collections/Posts";
import { Programs } from "./collections/Programs";
import { Purchases } from "./collections/Purchases";
import { Tags } from "./collections/Tags";
import { Testimonials } from "./collections/Testimonials";
import { TradingInstruments } from "./collections/TradingInstruments";
import { Users } from "./collections/Users";
import { VideoTestimonials } from "./collections/VideoTestimonials";
import { Affiliates } from "./globals/Affiliates";
import { Banners } from "./globals/Banners";
import { CommerceConfig } from "./globals/CommerceConfig";
import { CookieConsent } from "./globals/CookieConsent";
import { GlobalSEO } from "./globals/GlobalSEO";
import { Homepage } from "./globals/Homepage";
import { HowItWorks } from "./globals/HowItWorks";
import { Policies } from "./globals/Policies";
import { ProgramProductMappings } from "./globals/ProgramProductMappings";
import { Tools } from "./globals/Tools";
import { TradingUpdates } from "./globals/TradingUpdates";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "./lib/i18n/locales";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// Validate required environment variables
const getPostgresUri = () => {
    const uri = process.env.POSTGRES_URI || process.env.DATABASE_URL;
    if (!uri) {
        throw new Error(
            "Missing required environment variable: POSTGRES_URI or DATABASE_URL must be set",
        );
    }
    return uri;
};

const isS3Configured = () => {
    return !!(
        process.env.S3_BUCKET &&
        process.env.S3_ACCESS_KEY_ID &&
        process.env.S3_SECRET_ACCESS_KEY &&
        process.env.S3_REGION
    );
};

const getS3StoragePlugin = () => {
    if (!isS3Configured()) return undefined;

    return s3Storage({
        collections: {
            media: true,
        },
        // biome-ignore lint/style/noNonNullAssertion: checked by isS3Configured
        bucket: process.env.S3_BUCKET!,
        config: {
            credentials: {
                // biome-ignore lint/style/noNonNullAssertion: checked by isS3Configured
                accessKeyId: process.env.S3_ACCESS_KEY_ID!,
                // biome-ignore lint/style/noNonNullAssertion: checked by isS3Configured
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
            },
            // biome-ignore lint/style/noNonNullAssertion: checked by isS3Configured
            region: process.env.S3_REGION!,
            ...(process.env.S3_ENDPOINT && {
                endpoint: process.env.S3_ENDPOINT,
            }),
        },
    });
};

export default buildConfig({
    logger: {
        options: {
            level: "debug",
        },
    },
    debug: true,
    editor: lexicalEditor(),
    collections: [
        Users,
        Media,
        Posts,
        Categories,
        Tags,
        Authors,
        Programs,
        AddOns,
        PayoutRequests,
        Payouts,
        Purchases,
        Coupons,
        CouponUsage,
        VideoTestimonials,
        Testimonials,
        FaqCategories,
        Faqs,
        TradingInstruments,
        Platforms,
        NewsletterSubscriptions,
        ContactMessages,
        Courses,
        Modules,
        Lessons,
    ],
    globals: [
        GlobalSEO,
        Homepage,
        HowItWorks,
        Affiliates,
        TradingUpdates,
        Banners,
        ProgramProductMappings,
        CommerceConfig,
        Policies,
        Tools,
        CookieConsent,
    ],

    localization: {
        locales: SUPPORTED_LOCALES.map(({ label, code, dir }) => ({
            label,
            code,
            ...(dir === "rtl" ? { rtl: true } : {}),
        })),
        defaultLocale: DEFAULT_LOCALE,
        fallback: true,
    },

    // biome-ignore lint/style/noNonNullAssertion: it's not nullable
    secret: process.env.PAYLOAD_SECRET!,
    typescript: {
        outputFile: path.resolve(dirname, "payload-types.ts"),
    },
    db: postgresAdapter({
        pool: {
            connectionString: getPostgresUri(),
        },
    }),
    admin: {
        user: "users",
        meta: {
            titleSuffix: " - FTM CMS",
            description: "FundedTradeMarkets CMS",
            openGraph: {
                description: "FundedTradeMarkets CMS",
                title: "FundedTradeMarkets CMS",
            },
        },
        autoLogin:
            process.env.NODE_ENV === "development"
                ? {
                      email: "smhayhan@gmail.com",
                      password: "436215Sem.",
                      prefillOnly: true,
                  }
                : false,
        components: {
            actions: ["/src/admin/components/ViewSiteButton#default"],
            graphics: {
                Logo: "/src/components/logo-admin.tsx#LogoWithType",
            },
        },
    },
    plugins: [
        getS3StoragePlugin(),
        seoPlugin({
            collections: ["posts"],
            uploadsCollection: "media",
            generateTitle: ({ doc }) => `${doc.title} | FTM Blog`,
            generateDescription: ({ doc }) => doc.excerpt,
            generateImage: ({ doc }) => doc.featuredImage,
            generateURL: ({ doc }) =>
                `https://fundedtradermarkets.com/blog/${doc.slug}`,
            tabbedUI: true,
        }),
        searchPlugin({
            collections: ["posts"],
        }),
        importExportPlugin({
            collections: [
                "users",
                "media",
                "posts",
                "categories",
                "tags",
                "authors",
                "programs",
                "payouts",
                "purchases",
                "add-ons",
                "coupons",
                "coupon-usage",
                "video-testimonials",
                "testimonials",
                "faq-categories",
                "faqs",
                "trading-instruments",
                "newsletter-subscriptions",
                "contact-messages",
                "courses",
                "modules",
                "lessons",
            ],
            debug: process.env.NODE_ENV === "development",
        }),
    ].filter((plugin): plugin is NonNullable<typeof plugin> => !!plugin),
    sharp,
    graphQL: {
        disable: true,
    },
});
