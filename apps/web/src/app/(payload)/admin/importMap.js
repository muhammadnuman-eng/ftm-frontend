import {
    CollectionField as CollectionField_cdf7e044479f899a31f804427d568b36,
    ExportListMenuItem as ExportListMenuItem_cdf7e044479f899a31f804427d568b36,
    ExportSaveButton as ExportSaveButton_cdf7e044479f899a31f804427d568b36,
    FieldsToExport as FieldsToExport_cdf7e044479f899a31f804427d568b36,
    ImportExportProvider as ImportExportProvider_cdf7e044479f899a31f804427d568b36,
    Page as Page_cdf7e044479f899a31f804427d568b36,
    Preview as Preview_cdf7e044479f899a31f804427d568b36,
    SelectionToUseField as SelectionToUseField_cdf7e044479f899a31f804427d568b36,
    SortBy as SortBy_cdf7e044479f899a31f804427d568b36,
    SortOrder as SortOrder_cdf7e044479f899a31f804427d568b36,
} from "@payloadcms/plugin-import-export/rsc";
import {
    LinkToDoc as LinkToDoc_aead06e4cbf6b2620c5c51c9ab283634,
    ReindexButton as ReindexButton_aead06e4cbf6b2620c5c51c9ab283634,
} from "@payloadcms/plugin-search/client";
import {
    MetaDescriptionComponent as MetaDescriptionComponent_a8a977ebc872c5d5ea7ee689724c0860,
    MetaImageComponent as MetaImageComponent_a8a977ebc872c5d5ea7ee689724c0860,
    MetaTitleComponent as MetaTitleComponent_a8a977ebc872c5d5ea7ee689724c0860,
    OverviewComponent as OverviewComponent_a8a977ebc872c5d5ea7ee689724c0860,
    PreviewComponent as PreviewComponent_a8a977ebc872c5d5ea7ee689724c0860,
} from "@payloadcms/plugin-seo/client";
import {
    AlignFeatureClient as AlignFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    BlockquoteFeatureClient as BlockquoteFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    BlocksFeatureClient as BlocksFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    BoldFeatureClient as BoldFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    ChecklistFeatureClient as ChecklistFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    HeadingFeatureClient as HeadingFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    HorizontalRuleFeatureClient as HorizontalRuleFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    IndentFeatureClient as IndentFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    InlineCodeFeatureClient as InlineCodeFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    InlineToolbarFeatureClient as InlineToolbarFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    ItalicFeatureClient as ItalicFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    LinkFeatureClient as LinkFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    OrderedListFeatureClient as OrderedListFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    ParagraphFeatureClient as ParagraphFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    RelationshipFeatureClient as RelationshipFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    StrikethroughFeatureClient as StrikethroughFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    SubscriptFeatureClient as SubscriptFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    SuperscriptFeatureClient as SuperscriptFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    TableFeatureClient as TableFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    UnderlineFeatureClient as UnderlineFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    UnorderedListFeatureClient as UnorderedListFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    UploadFeatureClient as UploadFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
} from "@payloadcms/richtext-lexical/client";
import {
    LexicalDiffComponent as LexicalDiffComponent_44fe37237e0ebf4470c9990d8cb7b07e,
    RscEntryLexicalCell as RscEntryLexicalCell_44fe37237e0ebf4470c9990d8cb7b07e,
    RscEntryLexicalField as RscEntryLexicalField_44fe37237e0ebf4470c9990d8cb7b07e,
} from "@payloadcms/richtext-lexical/rsc";
import { S3ClientUploadHandler as S3ClientUploadHandler_f97aa6c64367fa259c5bc0567239ef24 } from "@payloadcms/storage-s3/client";
import { default as default_1f0b2fe8116be4a087d8b5c362020d8a } from "../../../../src/admin/components/PurchaseDetailView";
import { default as default_e44f93e32604faca0fa28f0841dd3e84 } from "../../../../src/admin/components/ViewSiteButton";
import { LogoWithType as LogoWithType_b68d6f8a2207d331f8a91e72d9e8ca12 } from "../../../../src/components/logo-admin.tsx";
import { default as default_8944cf1fbf38f9f144ed1cb02aa01def } from "../../../../src/components/ScheduleMatrixField";

export const importMap = {
    "@payloadcms/plugin-import-export/rsc#ExportListMenuItem":
        ExportListMenuItem_cdf7e044479f899a31f804427d568b36,
    "@payloadcms/richtext-lexical/rsc#RscEntryLexicalCell":
        RscEntryLexicalCell_44fe37237e0ebf4470c9990d8cb7b07e,
    "@payloadcms/richtext-lexical/rsc#RscEntryLexicalField":
        RscEntryLexicalField_44fe37237e0ebf4470c9990d8cb7b07e,
    "@payloadcms/richtext-lexical/rsc#LexicalDiffComponent":
        LexicalDiffComponent_44fe37237e0ebf4470c9990d8cb7b07e,
    "@payloadcms/richtext-lexical/client#BlocksFeatureClient":
        BlocksFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    "@payloadcms/richtext-lexical/client#BoldFeatureClient":
        BoldFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    "@payloadcms/richtext-lexical/client#ItalicFeatureClient":
        ItalicFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    "@payloadcms/richtext-lexical/client#UnderlineFeatureClient":
        UnderlineFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    "@payloadcms/richtext-lexical/client#StrikethroughFeatureClient":
        StrikethroughFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    "@payloadcms/richtext-lexical/client#SubscriptFeatureClient":
        SubscriptFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    "@payloadcms/richtext-lexical/client#SuperscriptFeatureClient":
        SuperscriptFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    "@payloadcms/richtext-lexical/client#InlineCodeFeatureClient":
        InlineCodeFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    "@payloadcms/richtext-lexical/client#ParagraphFeatureClient":
        ParagraphFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    "@payloadcms/richtext-lexical/client#HeadingFeatureClient":
        HeadingFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    "@payloadcms/richtext-lexical/client#AlignFeatureClient":
        AlignFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    "@payloadcms/richtext-lexical/client#IndentFeatureClient":
        IndentFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    "@payloadcms/richtext-lexical/client#UnorderedListFeatureClient":
        UnorderedListFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    "@payloadcms/richtext-lexical/client#OrderedListFeatureClient":
        OrderedListFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    "@payloadcms/richtext-lexical/client#ChecklistFeatureClient":
        ChecklistFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    "@payloadcms/richtext-lexical/client#LinkFeatureClient":
        LinkFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    "@payloadcms/richtext-lexical/client#RelationshipFeatureClient":
        RelationshipFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    "@payloadcms/richtext-lexical/client#BlockquoteFeatureClient":
        BlockquoteFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    "@payloadcms/richtext-lexical/client#UploadFeatureClient":
        UploadFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    "@payloadcms/richtext-lexical/client#HorizontalRuleFeatureClient":
        HorizontalRuleFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    "@payloadcms/richtext-lexical/client#InlineToolbarFeatureClient":
        InlineToolbarFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    "@payloadcms/plugin-seo/client#OverviewComponent":
        OverviewComponent_a8a977ebc872c5d5ea7ee689724c0860,
    "@payloadcms/plugin-seo/client#MetaTitleComponent":
        MetaTitleComponent_a8a977ebc872c5d5ea7ee689724c0860,
    "@payloadcms/plugin-seo/client#MetaDescriptionComponent":
        MetaDescriptionComponent_a8a977ebc872c5d5ea7ee689724c0860,
    "@payloadcms/plugin-seo/client#MetaImageComponent":
        MetaImageComponent_a8a977ebc872c5d5ea7ee689724c0860,
    "@payloadcms/plugin-seo/client#PreviewComponent":
        PreviewComponent_a8a977ebc872c5d5ea7ee689724c0860,
    "/src/admin/components/PurchaseDetailView#default":
        default_1f0b2fe8116be4a087d8b5c362020d8a,
    "@payloadcms/richtext-lexical/client#TableFeatureClient":
        TableFeatureClient_e70f5e05f09f93e00b997edb1ef0c864,
    "@payloadcms/plugin-search/client#LinkToDoc":
        LinkToDoc_aead06e4cbf6b2620c5c51c9ab283634,
    "@payloadcms/plugin-search/client#ReindexButton":
        ReindexButton_aead06e4cbf6b2620c5c51c9ab283634,
    "@payloadcms/plugin-import-export/rsc#Page":
        Page_cdf7e044479f899a31f804427d568b36,
    "@payloadcms/plugin-import-export/rsc#SortBy":
        SortBy_cdf7e044479f899a31f804427d568b36,
    "@payloadcms/plugin-import-export/rsc#SortOrder":
        SortOrder_cdf7e044479f899a31f804427d568b36,
    "@payloadcms/plugin-import-export/rsc#SelectionToUseField":
        SelectionToUseField_cdf7e044479f899a31f804427d568b36,
    "@payloadcms/plugin-import-export/rsc#FieldsToExport":
        FieldsToExport_cdf7e044479f899a31f804427d568b36,
    "@payloadcms/plugin-import-export/rsc#CollectionField":
        CollectionField_cdf7e044479f899a31f804427d568b36,
    "@payloadcms/plugin-import-export/rsc#Preview":
        Preview_cdf7e044479f899a31f804427d568b36,
    "@payloadcms/plugin-import-export/rsc#ExportSaveButton":
        ExportSaveButton_cdf7e044479f899a31f804427d568b36,
    "/src/components/ScheduleMatrixField#default":
        default_8944cf1fbf38f9f144ed1cb02aa01def,
    "/src/components/logo-admin.tsx#LogoWithType":
        LogoWithType_b68d6f8a2207d331f8a91e72d9e8ca12,
    "/src/admin/components/ViewSiteButton#default":
        default_e44f93e32604faca0fa28f0841dd3e84,
    "@payloadcms/storage-s3/client#S3ClientUploadHandler":
        S3ClientUploadHandler_f97aa6c64367fa259c5bc0567239ef24,
    "@payloadcms/plugin-import-export/rsc#ImportExportProvider":
        ImportExportProvider_cdf7e044479f899a31f804427d568b36,
};
