"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { LocaleSwitcher } from "./locale-switcher";
import { LogoIcon } from "./logo";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "./ui/sheet";

export const MobileMenu = () => {
    const navigation = useTranslations("navigation");
    const header = useTranslations("header");
    const mobile = useTranslations("mobileNavigation");
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }

        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <button type="button" className="p-2 md:hidden">
                    <MenuIcon className="size-6" strokeWidth={1.5} />
                </button>
            </SheetTrigger>

            <SheetContent side="right" className="w-3/4 sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle className="flex items-center justify-between gap-2 pr-6">
                        <div className="flex flex-1 items-center gap-2">
                            <LogoIcon className="h-6" />
                            <span className="font-bold text-sm tracking-wider">
                                FTM
                            </span>
                        </div>
                        <LocaleSwitcher />
                    </SheetTitle>
                </SheetHeader>

                <ScrollArea className="h-0 flex-1 px-6">
                    <div className="flex flex-col gap-4 py-6">
                        <h3 className="font-medium text-sm text-white/70">
                            {navigation("programs.label")}
                        </h3>

                        <div className="flex flex-col gap-4 border-l pl-4">
                            <Link
                                href="/1-step"
                                onClick={() => setIsOpen(false)}
                            >
                                <div className="font-medium text-sm">
                                    {navigation("programs.links.oneStep.title")}
                                </div>
                                <p className="text-muted-foreground text-sm leading-snug">
                                    {mobile("programs.oneStep")}
                                </p>
                            </Link>
                            <Link
                                href="/2-step"
                                onClick={() => setIsOpen(false)}
                            >
                                <div className="font-medium text-sm">
                                    {navigation("programs.links.twoStep.title")}
                                </div>
                                <p className="text-muted-foreground text-sm leading-snug">
                                    {mobile("programs.twoStep")}
                                </p>
                            </Link>
                            <Link
                                href="/ftm-instant-funding"
                                onClick={() => setIsOpen(false)}
                            >
                                <div className="font-medium text-sm">
                                    {navigation("programs.links.instant.title")}
                                </div>
                                <p className="text-muted-foreground text-sm leading-snug">
                                    {mobile("programs.instant")}
                                </p>
                            </Link>
                        </div>

                        <Link
                            href="/how-it-works"
                            onClick={() => setIsOpen(false)}
                        >
                            {navigation("howItWorks")}
                        </Link>
                        <Link
                            href="/affiliates"
                            onClick={() => setIsOpen(false)}
                        >
                            {navigation("affiliates")}
                        </Link>
                        <Link href="/faq" onClick={() => setIsOpen(false)}>
                            {navigation("faq")}
                        </Link>

                        <h3 className="font-medium text-sm text-white/70">
                            {navigation("resources")}
                        </h3>

                        <div className="flex flex-col gap-4 border-l pl-4">
                            <Link
                                href="/tools"
                                onClick={() => setIsOpen(false)}
                            >
                                <div className="font-medium text-sm">
                                    {navigation("tools.title")}
                                </div>
                                <p className="text-muted-foreground text-sm leading-snug">
                                    {navigation("tools.description")}
                                </p>
                            </Link>
                            <Link href="/blog" onClick={() => setIsOpen(false)}>
                                <div className="font-medium text-sm">
                                    {navigation("blog.title")}
                                </div>
                                <p className="text-muted-foreground text-sm leading-snug">
                                    {navigation("blog.description")}
                                </p>
                            </Link>
                            <Link
                                href="/instruments-specification"
                                onClick={() => setIsOpen(false)}
                            >
                                <div className="font-medium text-sm">
                                    {navigation("instrumentsSpec.title")}
                                </div>
                                <p className="text-muted-foreground text-sm leading-snug">
                                    {navigation("instrumentsSpec.description")}
                                </p>
                            </Link>
                        </div>
                    </div>
                </ScrollArea>

                <div className="grid grid-cols-2 border-white/10 border-t p-6">
                    <Button variant="ghost" size="lg" asChild>
                        <Link
                            href="https://dash.fundedtradermarkets.com/register"
                            onClick={() => setIsOpen(false)}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {header("register")}
                        </Link>
                    </Button>
                    <Button variant="secondary" size="lg" asChild>
                        <Link
                            href="https://dash.fundedtradermarkets.com/sign-in"
                            onClick={() => setIsOpen(false)}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {header("login")}
                        </Link>
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
};
