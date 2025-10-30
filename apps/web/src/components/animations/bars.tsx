"use client";

import { useLottie } from "lottie-react";
import { useEffect } from "react";
import animationData from "./THJpfCzVM0.json";

export const BarsAnimation = () => {
    const lottieOptions = {
        animationData: animationData,
        loop: true,
    };

    const { View, setSpeed } = useLottie(lottieOptions);

    useEffect(() => {
        setSpeed(1);
    }, [setSpeed]);

    return (
        <div className="">
            <div className="w-full">{View}</div>
        </div>
    );
};
