/**
 * Global cache system
 */

const Cache = {

    // Images
    images: {},
    
    /**
     * Get image
     */

    getImage(src) {
        if (!this.images[src]) {
            // Not in cache
            const img = new Image();
            img.src = src;
            this.images[src] = img;
        }
        return this.images[src];
    },
    
    /**
     * Clear cache
     */

    clear() {
        this.images = {};
    }

};