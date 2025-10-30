"use client";

import Link from "next/link";
import { SectionHeader } from "@/components/section-header";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { FaqAnimation } from "./animations/faq";
import { Button } from "./ui/button";

interface FaqContent {
    dividerTitle: string;
    title: string;
    titleHighlight: string;
    description: string;
    faqs: {
        question: string;
        answer: string;
        id?: string | null;
    }[];
}

interface FaqSectionProps {
    content?: FaqContent;
}

const faqData = [
    {
        id: "item-1",
        question: "What is a Forex Prop Firm?",
        answer: "A Forex Prop Firm allows traders to trade with higher simulated capital while earning real money based on their consistently profitable trading skills. It enables traders to trade without risking their own funds. At Funded Trader Markets (FTM), traders can prove their skills through an Evaluation process or via simulated Instant Funded Accounts and keep a significant share of the profits they earn.",
    },
    {
        id: "item-2",
        question: "What is a Forex Funded Account?",
        answer: "A Forex Funded Account is a trading account provided by a prop firm, allowing traders to trade with large simulated capital instead of their own money. It enables skilled traders to profit without taking on huge financial risk.",
    },
    {
        id: "item-3",
        question: "How Do You Qualify for a Simulated Funded Account?",
        answer: "To qualify for a simulated funded account with FTM, you typically have two options:\nWith Evaluation – You'll need to meet profit targets, follow risk management rules, and demonstrate consistent trading.\nWithout Evaluation – You can access Instant Funded Accounts directly, subject to fees and eligibility.\nThis ensures that only responsible and consistent traders move forward.",
    },
    {
        id: "item-4",
        question: "What Are the Risks of Trading with a Prop Firm?",
        answer: "While trading with a prop firm offers excellent opportunities, there are risks to consider. If you exceed drawdown limits or fail to follow risk management rules, your account may be suspended. Some firms may also restrict certain trading strategies or instruments. Understanding and managing these risks is key to long-term success.",
    },
    {
        id: "item-5",
        question: "What Are the Benefits of Joining a Forex Prop Firm?",
        answer: "Joining a Forex prop trading firm like Funded Trader Markets comes with multiple benefits:\nAccess to Capital: Trade up to $600,000 in simulated capital without risking your own money (just an evaluation fee).\nRisk Management Support: Profit targets and loss limits help you stay disciplined.\nMentorship & Tools: Get access to resources that sharpen your skills and help you stay updated on market trends.\nProfit Sharing: Earn up to 100% of your profits.\nScalability: Perform well and gain access to larger accounts and higher payout potential.",
    },
    {
        id: "item-6",
        question: "How Much Can You Earn with a Simulated Funded Account?",
        answer: "Earnings depend on your trading performance. At FTM, traders can earn up to 100% of the profits they generate. There is no upper limit to how much profit a trader can generate. The more consistent and profitable you are, the more you can earn.",
    },
    {
        id: "item-7",
        question: "What Are the Evaluation Fees at Funded Trader Markets?",
        answer: "Evaluation fees vary by program type and account size:\n• 1-Step Evaluation: $15 (for $5k) to $439 (for $200k)\n• 2-Step Evaluation: $27 (for $5k) to $589 (for $200k)\n• Instant Programs: $49 (for $5k) to $769 (for $100k)",
    },
    {
        id: "item-8",
        question: "What Are the Rules for Trading a Funded Forex Account?",
        answer: "To trade with an FTM funded account, you must:\nHit profit targets\nRespect drawdown limits\nMeet the consistency score\nFor detailed rules for each program, please refer to our General Trading Rules.",
    },
    {
        id: "item-9",
        question: "Can You Withdraw Profits from a Simulated Funded Account?",
        answer: "Yes! You can withdraw profits from your FTM Simulated Funded Account once you meet the trading criteria. Submit a payout request through your Trader Dashboard, choose your preferred payment method, and specify the amount.\n• Minimum Payout: 1% of your starting balance\n• Payout Frequency: On-demand\n• Processing Time: Typically within 24 business hours\n• Payout Methods: Crypto and Rise",
    },
    {
        id: "item-10",
        question: "What Features Does Your Platform Provide?",
        answer: "Funded Trader Markets provides a user-friendly platform where traders can access virtual capital and trade up to $600,000. Key features include:\n• Affordable accounts compared to other firms\n• Simple Payout System with on-demand requests\n• Multiple Withdrawal Methods, including Crypto and Rise\n• Scaling Programs for consistent traders\n• Profit Sharing Up to 100%\n• Evaluation and Instant Funding Options",
    },
];

export function FaqSection({ content }: FaqSectionProps) {
    // Default fallback content if no CMS content provided
    const defaultContent: FaqContent = {
        dividerTitle: "Prop Trading FAQs",
        title: "Your Questions, Our Answers",
        titleHighlight: "Our Answers",
        description:
            "Find answers to common questions about funded trading accounts, instant funding, forex prop firms, and payouts.",
        faqs: faqData,
    };

    const sectionContent = content || defaultContent;

    return (
        <section className="relative mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
            <SectionHeader
                dividerTitle={sectionContent.dividerTitle}
                title={sectionContent.title}
                titleHighlight={sectionContent.titleHighlight}
                description={sectionContent.description}
                animation={<FaqAnimation />}
            />

            <div className="relative">
                <div className="pointer-events-none absolute inset-0 opacity-10 md:opacity-20">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 via-purple-950/10 to-lime-950/10" />
                    <div className="absolute inset-0 bg-radial from-stone-950/30 to-stone-950" />
                </div>
                <Accordion
                    type="single"
                    collapsible
                    className="w-full rounded-xl bg-gradient-to-b from-blue-500/5 to-indigo-500/5 sm:backdrop-blur-xl"
                >
                    {sectionContent.faqs.map((faq, index) => {
                        const faqId = faq.id || `item-${index + 1}`;
                        return (
                            <AccordionItem
                                key={faqId}
                                value={faqId}
                                className="relative overflow-hidden border border-white/10 border-b-0 px-4 py-2 outline-none first:rounded-t-xl last:rounded-b-xl last:border-b"
                            >
                                <AccordionTrigger className="[&>svg]:-order-1 -mx-4 -my-2 cursor-pointer justify-start gap-3 rounded-none px-4 py-6 font-bold text-sm outline-none focus-visible:ring-0 data-[state=closed]:hover:bg-white/5 sm:text-base">
                                    {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="pb-2 text-sm/normal text-white/90 sm:text-base/loose">
                                    {faq.answer
                                        .split("\n")
                                        .map((line, lineIndex) => (
                                            <span
                                                key={`${faqId}-line-${lineIndex}-${line.slice(0, 10).replace(/\s+/g, "-")}`}
                                            >
                                                {line}
                                                {lineIndex <
                                                    faq.answer.split("\n")
                                                        .length -
                                                        1 && <br />}
                                            </span>
                                        ))}
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            </div>
            <Button className="w-full sm:w-auto" asChild>
                <Link href="/faq">View All FAQs</Link>
            </Button>
        </section>
    );
}
