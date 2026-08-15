/**
 * Offscreen compositor applying signed per-channel ambient light to a rendered layer, preserving its transparency
 */

// Ordered (Bayer) dithering matrix for the optional retro stippled-light look
const BAYER_4X4 = [
    0, 8, 2, 10,
    12, 4, 14, 6,
    3, 11, 1, 9,
    15, 7, 13, 5
];

class Lighting {

    constructor() {

        // Layer render target, tinted in place then composited onto the real canvas
        this.scene = document.createElement('canvas');
        this.sceneCtx = this.scene.getContext('2d');
        this.disableSmoothing();

    }

    /**
     * Match the main view's crisp pixel-art rendering (new canvases default to smoothing enabled)
     */

    disableSmoothing() {
        this.sceneCtx.imageSmoothingEnabled = false;
        this.sceneCtx.webkitImageSmoothingEnabled = false;
        this.sceneCtx.mozImageSmoothingEnabled = false;
    }

    /**
     * Resize the buffer to match the view's canvas
     */

    resize(view) {
        if (this.scene.width !== view.canvas.width || this.scene.height !== view.canvas.height) {
            this.scene.width = view.canvas.width;
            this.scene.height = view.canvas.height;
            this.disableSmoothing(); // resizing a canvas resets its context state
        }
    }

    /**
     * Start a batch: redirect view.ctx into the scene buffer so any number of layers can be
     * drawn into it before a single tint + composite pass (avoids one getImageData pass per layer)
     * @param view: Object - view reference
     */

    begin(view) {
        this.resize(view);
        this.sceneCtx.clearRect(0, 0, this.scene.width, this.scene.height);
        this.savedCtx = view.ctx;
        view.ctx = this.sceneCtx;
    }

    /**
     * Restore view.ctx, tint the accumulated batch and composite it onto the real canvas
     * @param view: Object - view reference
     * @param light: Object - level.light reference ({ambient, points, spots})
     */

    end(view, light) {
        view.ctx = this.savedCtx;

        // Tint in place (future cone lights would add more passes here)
        this.applyLighting(view, light);

        // Composite the tinted batch, with its original transparency intact, onto the real canvas
        view.ctx.drawImage(this.scene, 0, 0);
    }

    /**
     * Add the ambient offset and all point/spot light contributions directly to each pixel's RGB,
     * leaving alpha untouched so transparency/anti-aliased edges are never affected
     * @param view: Object - view reference, used to project lights into screen space
     * @param light: Object - level.light reference ({ambient, points, spots})
     */

    applyLighting(view, light) {
        const ambient = light.ambient;
        const points = Object.values(light.points);
        const spots = Object.values(light.spots);
        const hasAmbient = ambient && (ambient.r || ambient.g || ambient.b);
        if (!hasAmbient && !points.length && !spots.length) return;

        const width = this.scene.width;
        const image = this.sceneCtx.getImageData(0, 0, width, this.scene.height);
        const data = image.data;

        // Ambient: uniform per-pixel add across the whole buffer
        if (hasAmbient) {
            for (let i = 0; i < data.length; i += 4) {
                if (data[i + 3] === 0) continue; // skip fully transparent pixels
                data[i] += ambient.r; // Uint8ClampedArray clamps to 0-255 automatically
                data[i + 1] += ambient.g;
                data[i + 2] += ambient.b;
            }
        }

        // Point/spot lights: only touch each light's screen-space bounding box, never the whole canvas
        points.forEach(pointLight => this.applyPointLight(view, data, width, pointLight));
        spots.forEach(spotLight => this.applySpotLight(view, data, width, spotLight));

        this.sceneCtx.putImageData(image, 0, 0);
    }

    /**
     * Add one point light's falloff contribution within its screen-space bounding box
     */

    applyPointLight(view, data, width, pointLight) {
        const { radius, color, intensity = 1, dither } = pointLight;
        const center = view.world2Screen(pointLight);
        const radiusSq = radius * radius;

        const minX = Math.max(0, Math.floor(center.x - radius));
        const maxX = Math.min(width - 1, Math.ceil(center.x + radius));
        const minY = Math.max(0, Math.floor(center.y - radius));
        const maxY = Math.min((data.length / 4 / width) - 1, Math.ceil(center.y + radius));

        for (let y = minY; y <= maxY; y++) {
            const dy = y - center.y;
            const rowOffset = y * width;
            for (let x = minX; x <= maxX; x++) {
                const dx = x - center.x;
                const distSq = dx * dx + dy * dy;
                if (distSq >= radiusSq) continue;

                const i = (rowOffset + x) * 4;
                if (data[i + 3] === 0) continue; // skip fully transparent pixels

                let falloff = 1 - distSq / radiusSq; // quadratic falloff
                if (dither) falloff = this.ditherFalloff(falloff, x, y, dither.size || 1, dither.edge ?? 1);
                falloff *= intensity;

                data[i] += color.r * falloff;
                data[i + 1] += color.g * falloff;
                data[i + 2] += color.b * falloff;
            }
        }
    }

    /**
     * Add one spot light's directional cone contribution within its screen-space bounding box.
     * The beam is a tapered trapezoid: `width` sets its perpendicular width at the light's own
     * position (0 = starts as a point, as before), widening to the cone's spread by `radius`
     */

    applySpotLight(view, data, width, spotLight) {
        const { radius, angle, cone, width: originWidth = 0, color, intensity = 1, dither } = spotLight;
        const center = view.world2Screen(spotLight);
        const radiusSq = radius * radius;
        const angleRad = angle * Math.PI / 180;
        const halfCone = (cone / 2) * Math.PI / 180;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        const halfWidthAtOrigin = originWidth / 2;
        const halfWidthAtEdge = radius * Math.tan(halfCone);

        const minX = Math.max(0, Math.floor(center.x - radius));
        const maxX = Math.min(width - 1, Math.ceil(center.x + radius));
        const minY = Math.max(0, Math.floor(center.y - radius));
        const maxY = Math.min((data.length / 4 / width) - 1, Math.ceil(center.y + radius));

        for (let y = minY; y <= maxY; y++) {
            const dy = y - center.y;
            const rowOffset = y * width;
            for (let x = minX; x <= maxX; x++) {
                const dx = x - center.x;
                const distSq = dx * dx + dy * dy;
                if (distSq >= radiusSq) continue;

                const forward = dx * cos + dy * sin;
                if (forward < 0) continue; // behind the light

                // Half-width of the beam at this forward distance, tapering from originWidth to the cone's spread
                const halfWidth = halfWidthAtOrigin + (halfWidthAtEdge - halfWidthAtOrigin) * (forward / radius);
                const perpendicular = -dx * sin + dy * cos;
                if (Math.abs(perpendicular) > halfWidth) continue;

                const i = (rowOffset + x) * 4;
                if (data[i + 3] === 0) continue; // skip fully transparent pixels

                let falloff = (1 - distSq / radiusSq) * (halfWidth > 0 ? 1 - Math.abs(perpendicular) / halfWidth : 1);
                if (dither) falloff = this.ditherFalloff(falloff, x, y, dither.size || 1, dither.edge ?? 1);
                falloff *= intensity;

                data[i] += color.r * falloff;
                data[i + 1] += color.g * falloff;
                data[i + 2] += color.b * falloff;
            }
        }
    }

    /**
     * Stipple ordered dither: pixels below the per-pixel Bayer threshold are skipped entirely,
     * the rest keep their natural falloff brightness (so dots still fade with distance instead
     * of all snapping to full intensity, which made the earlier binary version too strong).
     * Falloff values at/above edge stay solid (filled core), only the band below it is dithered
     * @param cellSize: Number - screen pixels per dither cell, align with the game's virtual pixel scale
     * @param edge: Number - falloff (0..1) above which the light stays solid instead of dithered
     */

    ditherFalloff(falloff, x, y, cellSize, edge) {
        if (falloff >= edge) return falloff;

        const cellX = Math.floor(x / cellSize) % 4;
        const cellY = Math.floor(y / cellSize) % 4;
        const threshold = (BAYER_4X4[cellY * 4 + cellX] + 0.5) / 16;
        const normalized = edge > 0 ? falloff / edge : 0;
        return normalized > threshold ? falloff : 0;
    }

}
