import { Loader2 } from "lucide-react";

interface IframeLoaderProps {
    isLoading: boolean;
    toolName: string;
}

export const IframeLoader = ({ isLoading, toolName }: IframeLoaderProps) => {
    if (!isLoading) return null;

    return (
        <div className="flex h-full w-full items-center justify-center bg-stone-900/50">
            <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                <div className="text-center">
                    <p className="font-medium text-white">Loading {toolName}</p>
                    <p className="text-sm text-stone-400">
                        Please wait while we load the calculator...
                    </p>
                </div>
            </div>
        </div>
    );
};
