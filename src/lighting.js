/**
 * Offscreen compositor applying signed per-channel ambient light to a rendered layer, preserving its transparency
 */

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
     * @param ambient: {r, g, b} - signed ambient light (-255..255 per channel, 0 neutral)
     */

    end(view, ambient) {
        view.ctx = this.savedCtx;

        // Tint in place (future point/cone lights would add more passes here)
        this.applyAmbient(ambient);

        // Composite the tinted batch, with its original transparency intact, onto the real canvas
        view.ctx.drawImage(this.scene, 0, 0);
    }

    /**
     * Add the signed ambient offset directly to each pixel's RGB, leaving alpha untouched so
     * transparency/anti-aliased edges are never affected (avoids blend-mode edge artifacts)
     */

    applyAmbient(ambient) {
        const { r, g, b } = ambient;
        if (!r && !g && !b) return;

        const image = this.sceneCtx.getImageData(0, 0, this.scene.width, this.scene.height);
        const data = image.data;

        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] === 0) continue; // skip fully transparent pixels
            data[i] += r; // Uint8ClampedArray clamps to 0-255 automatically
            data[i + 1] += g;
            data[i + 2] += b;
        }

        this.sceneCtx.putImageData(image, 0, 0);
    }

}
