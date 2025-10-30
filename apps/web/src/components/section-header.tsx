import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GlowingDotsCSS } from "./ui/glowing-dots-css";
import { SectionDivider } from "./ui/section-divider";

interface SectionHeaderProps {
    dividerTitle?: string;
    title: string;
    titleHighlight?: string | string[];
    description?: string;
    as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "div";
    dividerAs?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "div";
    showVideo?: boolean;
    showVideoMobile?: boolean;
    videoName?: string;
    animation?: ReactNode;
}

export const SectionHeader = ({
    dividerTitle,
    title,
    titleHighlight,
    description,
    as: Component = "h2",
    dividerAs,
    showVideo = true,
    showVideoMobile = false,
    videoName = "logo",
    animation,
}: SectionHeaderProps) => {
    return (
        <div className="space-y-8">
            {animation ? (
                <div
                    className={cn(
                        "relative flex items-end justify-center",
                        showVideoMobile ? "flex" : "hidden sm:flex",
                    )}
                >
                    <div className="absolute inset-0 flex items-end justify-center overflow-hidden">
                        <GlowingDotsCSS />
                    </div>
                    <div className="pointer-events-none relative">
                        {animation}
                    </div>
                </div>
            ) : showVideo ? (
                <div
                    className={cn(
                        "relative flex items-end justify-center",
                        showVideoMobile ? "flex" : "hidden sm:flex",
                    )}
                >
                    <div className="absolute inset-0 flex items-end justify-center overflow-hidden">
                        <GlowingDotsCSS />
                    </div>
                    {/* Mobile: Use original GIF for best quality */}
                    {/** biome-ignore lint/performance/noImgElement: dont use next/image */}
                    <img
                        className="pointer-events-none relative h-36 rounded-lg bg-transparent md:hidden"
                        src={`/animations/${videoName}.gif`}
                        alt=""
                        loading="lazy"
                        style={{ backgroundColor: "transparent" }}
                    />

                    {/* Desktop Safari: Use original GIF for transparency + quality */}
                    {/** biome-ignore lint/performance/noImgElement: dont use next/image */}
                    <img
                        className="pointer-events-none relative hidden h-52 rounded-lg bg-transparent md:safari:block"
                        src={`/animations/${videoName}.gif`}
                        alt=""
                        loading="lazy"
                        style={{ backgroundColor: "transparent" }}
                    />

                    {/* Desktop non-Safari: Use video for better performance */}
                    <video
                        className="pointer-events-none relative hidden h-52 rounded-lg bg-transparent md:non-safari:block"
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="none"
                        style={{ backgroundColor: "transparent" }}
                    >
                        <source
                            src={`/animations/${videoName}.webm`}
                            type="video/webm"
                        />
                        <source
                            src={`/animations/${videoName}_h264.mp4`}
                            type="video/mp4"
                        />
                    </video>
                </div>
            ) : null}

            {dividerTitle && (
                <SectionDivider title={dividerTitle} as={dividerAs} />
            )}

            <div className="mx-auto space-y-4 text-balance text-center">
                <Component className="font-bold text-4xl lg:text-6xl">
                    {titleHighlight
                        ? (() => {
                              if (Array.isArray(titleHighlight)) {
                                  // Handle array of highlights
                                  const result = title;
                                  const parts: React.ReactNode[] = [];
                                  let lastIndex = 0;

                                  titleHighlight.forEach(
                                      (highlight, _highlightIndex) => {
                                          const index =
                                              result.indexOf(highlight);
                                          if (index !== -1) {
                                              // Add text before highlight
                                              if (index > lastIndex) {
                                                  parts.push(
                                                      <Fragment
                                                          key={`text-${highlight}-${index}-${lastIndex}`}
                                                      >
                                                          {result.slice(
                                                              lastIndex,
                                                              index,
                                                          )}
                                                      </Fragment>,
                                                  );
                                              }
                                              // Add highlighted text
                                              parts.push(
                                                  <span
                                                      key={`highlight-${highlight}-${index}`}
                                                      className="bg-gradient-to-br from-blue-400 to-indigo-600 bg-clip-text text-transparent"
                                                  >
                                                      {highlight}
                                                  </span>,
                                              );
                                              lastIndex =
                                                  index + highlight.length;
                                          }
                                      },
                                  );

                                  // Add remaining text
                                  if (lastIndex < result.length) {
                                      parts.push(
                                          <Fragment key="text-end">
                                              {result.slice(lastIndex)}
                                          </Fragment>,
                                      );
                                  }

                                  return parts;
                              }

                              // Handle single string highlight (existing logic)
                              return title
                                  .split(titleHighlight)
                                  .map((part, index, array) => (
                                      <Fragment
                                          key={`part-${part}-${part.length}-${index}`}
                                      >
                                          {part
                                              .split("\n")
                                              .map((line, lineIndex, lines) => (
                                                  <Fragment
                                                      key={`part-${part}-${line}-${line.length}-${lineIndex}`}
                                                  >
                                                      {line}
                                                      {lineIndex <
                                                          lines.length - 1 && (
                                                          <br />
                                                      )}
                                                  </Fragment>
                                              ))}
                                          {index < array.length - 1 && (
                                              <span className="bg-gradient-to-br from-blue-400 to-indigo-600 bg-clip-text text-transparent">
                                                  {titleHighlight
                                                      .split("\n")
                                                      .map(
                                                          (
                                                              line,
                                                              lineIndex,
                                                              lines,
                                                          ) => (
                                                              <Fragment
                                                                  key={`highlight-part-${part}-${line}-${line.length}-${lineIndex}`}
                                                              >
                                                                  {line}
                                                                  {lineIndex <
                                                                      lines.length -
                                                                          1 && (
                                                                      <br />
                                                                  )}
                                                              </Fragment>
                                                          ),
                                                      )}
                                              </span>
                                          )}
                                      </Fragment>
                                  ));
                          })()
                        : title.split("\n").map((line, index, lines) => (
                              <Fragment key={`title-line${index}-${line}`}>
                                  {line}
                                  {index < lines.length - 1 && <br />}
                              </Fragment>
                          ))}
                </Component>
                {description && (
                    <p className="text-stone-400 md:text-lg lg:text-xl">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
};
