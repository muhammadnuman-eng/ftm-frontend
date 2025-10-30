"use client";

import { Squircle } from "@squircle-js/react";
import { useLottie } from "lottie-react";
import { useEffect } from "react";
import animationData from "./iconly-icon-export-1759279187.json";

export const FaqAnimation = () => {
    const lottieOptions = {
        animationData: animationData,
        loop: true,
    };

    const { View, setSpeed } = useLottie(lottieOptions);

    useEffect(() => {
        setSpeed(0.5);
    }, [setSpeed]);

    return (
        <Squircle
            cornerRadius={28}
            cornerSmoothing={1}
            className="mb-10 size-28 bg-gradient-to-tr from-blue-500/90 to-70% to-indigo-500/90 p-4 mix-blend-screen"
        >
            <div className="w-full">{View}</div>
        </Squircle>
    );
};
