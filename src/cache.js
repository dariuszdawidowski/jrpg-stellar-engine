/**
 * Global cache system
 */

const Cache = {

    // Images cache { url: HTMLImageElement, ... }
    images: Object.create(null),
    pending: new Map(),
    generation: 0,
    
    /**
     * Get image asynchronously (load if necessary)
     * @returns {Promise<HTMLImageElement>} Promise resolving to loaded image
     */

    async getImage(src) {
        if (Object.hasOwn(this.images, src)) {
            return this.images[src];
        }

        if (this.pending.has(src)) return this.pending.get(src);

        const generation = this.generation;
        let resolveImage;
        let rejectImage;
        const promise = new Promise((resolve, reject) => {
            resolveImage = resolve;
            rejectImage = reject;
        });
        this.pending.set(src, promise);

        try {
            const img = new Image();
            img.onload = () => {
                if (this.pending.get(src) === promise) this.pending.delete(src);
                if (generation === this.generation) this.images[src] = img;
                resolveImage(img);
            };
            img.onerror = () => {
                if (this.pending.get(src) === promise) this.pending.delete(src);
                rejectImage(new Error(`Failed to load image: ${src}`));
            };
            img.src = src;
        } catch (error) {
            if (this.pending.get(src) === promise) this.pending.delete(src);
            rejectImage(new Error(`Failed to load image: ${src}`));
        }

        return promise;
    },
    
    /**
     * Clear cache
     */

    clear() {
        this.images = Object.create(null);
        this.pending.clear();
        this.generation++;
    }

};