/**
 * Global cache system
 */

const Cache = {

    // Images cache { url: HTMLImageElement, ... }
    images: {},
    
    /**
     * Get image asynchronously (load if necessary)
     * @returns {Promise<HTMLImageElement>} Promise resolving to loaded image
     */

    async getImage(src) {
        // Image already exists in cache
        if (src in this.images) {
            return this.images[src];
        }
        
        // Create new image and wait for it to load
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                this.images[src] = img;
                resolve(img);
            };
            
            img.onerror = (error) => {
                reject(new Error(`Failed to load image: ${src}`));
            };
            
            img.src = src;
        });
    },
    
    /**
     * Clear cache
     */

    clear() {
        this.images = {};
    }

};