#!/bin/bash

# Color output for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurable output width in pixels
WIDTH=400

# Crop options: center-crop to fixed aspect ratio before scaling
# Set CROP_ENABLED=true to enable center crop
CROP_ENABLED=false
# Aspect ratio W:H (e.g. 3:4)
CROP_ASPECT_W=3
CROP_ASPECT_H=3

# Zoom factor: >1.0 to zoom in (tighter crop), 1.0 = no extra zoom
ZOOM=1.0

# List your input GIF files here (relative or absolute paths)
files=(
    "/Users/smh/code/ftm/ftm-web/apps/web/public/animations/logo.gif"
    "/Users/smh/code/ftm/ftm-web/apps/web/public/animations/24-hour-support.gif"
    "/Users/smh/code/ftm/ftm-web/apps/web/public/animations/avg-processing-time.gif"
    "/Users/smh/code/ftm/ftm-web/apps/web/public/animations/clock-motion.gif"
    "/Users/smh/code/ftm/ftm-web/apps/web/public/animations/dollar-motion.gif"
    "/Users/smh/code/ftm/ftm-web/apps/web/public/animations/leverage.gif"
    "/Users/smh/code/ftm/ftm-web/apps/web/public/animations/profit-counter.gif"
    "/Users/smh/code/ftm/ftm-web/apps/web/public/animations/profit-split.gif"
    "/Users/smh/code/ftm/ftm-web/apps/web/public/animations/swap-free.gif"
)

echo -e "${GREEN}Starting GIF to Video conversion...${NC}"
echo ""

for input_file in "${files[@]}"; do
    # Skip if file doesn't exist
    if [ ! -f "$input_file" ]; then
        echo -e "${RED}✗ File not found: $input_file${NC}"
        continue
    fi

    # Get base name without extension
    base_name="${input_file%.*}"

    echo -e "${YELLOW}Processing: $(basename "$input_file")${NC}"

    # Build crop filter (center) if enabled
    if [ "$CROP_ENABLED" = true ]; then
        # Escape commas inside ffmpeg expressions so they aren't treated as filter separators
        # Apply ZOOM by reducing the crop width/height by the factor before scaling
        VF_CROP="crop=if(gte(iw/ih\\,${CROP_ASPECT_W}/${CROP_ASPECT_H})\\,ih*${CROP_ASPECT_W}/${CROP_ASPECT_H}/${ZOOM}\\,iw/${ZOOM}):if(gte(iw/ih\\,${CROP_ASPECT_W}/${CROP_ASPECT_H})\\,ih/${ZOOM}\\,iw*${CROP_ASPECT_H}/${CROP_ASPECT_W}/${ZOOM}):(iw-ow)/2:(ih-oh)/2,"
    else
        VF_CROP=""
    fi

    # Build zoom-only (center) crop if ZOOM > 1 even when CROP is disabled
    VF_ZOOM=""
    if [ "$ZOOM" != "1" ] && [ "$ZOOM" != "1.0" ]; then
        # Center crop by ZOOM factor
        VF_ZOOM="crop=iw/${ZOOM}:ih/${ZOOM}:(iw-iw/${ZOOM})/2:(ih-ih/${ZOOM})/2,"
    fi

    # Prefix for all filter chains
    VF_PREFIX="${VF_CROP}${VF_ZOOM}"

    # 1. WebM with transparency (VP9 codec) - Best for modern browsers
    echo "  Creating WebM with transparency..."
    if ffmpeg -y -i "$input_file" \
        -vf "${VF_PREFIX}scale=${WIDTH}:-2" \
        -c:v libvpx-vp9 -pix_fmt yuva420p \
        -b:v 1M -auto-alt-ref 0 \
        -loglevel error \
        "${base_name}.webm"; then
        echo -e "  ${GREEN}✓ WebM created successfully${NC}"
    else
        echo -e "  ${RED}✗ WebM creation failed${NC}"
    fi

    # 2. MP4 with H.264 (no transparency but universal compatibility)
    echo "  Creating MP4 (H.264, no transparency)..."
    if ffmpeg -y -i "$input_file" \
        -vf "${VF_PREFIX}scale=${WIDTH}:-2,format=yuv420p,pad=ceil(iw/2)*2:ceil(ih/2)*2" \
        -c:v libx264 -pix_fmt yuv420p \
        -preset slow -crf 23 -movflags +faststart \
        -loglevel error \
        "${base_name}_h264.mp4"; then
        echo -e "  ${GREEN}✓ MP4 (H.264) created successfully${NC}"
    else
        echo -e "  ${RED}✗ MP4 (H.264) creation failed${NC}"
    fi

    # 3. Try MP4 with HEVC (may or may not support alpha depending on ffmpeg build)
    echo "  Attempting MP4 with HEVC..."

    # First try with alpha channel
    if ffmpeg -y -i "$input_file" \
        -vf "${VF_PREFIX}scale=${WIDTH}:-2" \
        -c:v libx265 -tag:v hvc1 -pix_fmt yuva420p \
        -preset medium -crf 23 \
        -loglevel error \
        "${base_name}_hevc_alpha.mp4" 2>/dev/null; then
        echo -e "  ${GREEN}✓ MP4 (HEVC with alpha) created successfully${NC}"
    else
        # Fallback to HEVC without alpha
        if ffmpeg -y -i "$input_file" \
            -vf "${VF_PREFIX}scale=${WIDTH}:-2,format=yuv420p" \
            -c:v libx265 -tag:v hvc1 -pix_fmt yuv420p \
            -preset medium -crf 23 \
            -loglevel error \
            "${base_name}_hevc.mp4"; then
            echo -e "  ${YELLOW}✓ MP4 (HEVC without alpha) created${NC}"
        else
            echo -e "  ${RED}✗ HEVC encoding failed${NC}"
        fi
    fi

    # 4. Optional: Create an optimized GIF (high quality with transparency)
    echo "  Creating optimized GIF..."
    if ffmpeg -y -i "$input_file" \
        -vf "${VF_PREFIX}scale=${WIDTH}:-1:flags=lanczos,split[s0][s1];[s0]palettegen=reserve_transparent=1:max_colors=256:stats_mode=single[p];[s1][p]paletteuse=alpha_threshold=128:dither=bayer:bayer_scale=5:diff_mode=rectangle" \
        -loglevel error \
        "${base_name}_optimized.gif"; then
        echo -e "  ${GREEN}✓ Optimized GIF created${NC}"
    else
        echo -e "  ${RED}✗ Optimized GIF creation failed${NC}"
    fi

    echo ""
done

echo -e "${GREEN}Conversion complete!${NC}"
echo ""
echo "Summary of created files:"
echo "------------------------"

for input_file in "${files[@]}"; do
    base_name="${input_file%.*}"
    echo -e "${YELLOW}$(basename "$input_file"):${NC}"

    # Check which files were created and show their sizes
    [ -f "${base_name}.webm" ] && \
        echo -e "  ${GREEN}✓${NC} WebM (with transparency): $(du -h "${base_name}.webm" | cut -f1)"

    [ -f "${base_name}_h264.mp4" ] && \
        echo -e "  ${GREEN}✓${NC} MP4/H.264 (no transparency): $(du -h "${base_name}_h264.mp4" | cut -f1)"

    [ -f "${base_name}_hevc_alpha.mp4" ] && \
        echo -e "  ${GREEN}✓${NC} MP4/HEVC (with transparency): $(du -h "${base_name}_hevc_alpha.mp4" | cut -f1)"

    [ -f "${base_name}_hevc.mp4" ] && \
        echo -e "  ${GREEN}✓${NC} MP4/HEVC (no transparency): $(du -h "${base_name}_hevc.mp4" | cut -f1)"

    [ -f "${base_name}_optimized.gif" ] && \
        echo -e "  ${GREEN}✓${NC} Optimized GIF: $(du -h "${base_name}_optimized.gif" | cut -f1)"

    # Show original file size for comparison
    echo -e "  Original GIF: $(du -h "$input_file" | cut -f1)"
    echo ""
done

echo "Recommended usage:"
echo "• Use .webm for modern browsers (Chrome, Firefox, Edge)"
echo "• Use _h264.mp4 for maximum compatibility (Safari, older browsers)"
echo "• HEVC files offer better compression but limited browser support"


