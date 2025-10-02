/**
 * Global cache system
 */

const Cache = {

    // Images cache { url: HTMLImageElement, ... }
    images: {},
    // Atlases cache { url: Atlas, ... }
    atlases: {},
    
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
     * Get Atlas asynchronously (create if necessary)
     * @param args compatible with new Atlas { resource, width, height, cols, rows (or cell instead) }
     * @returns {Promise<Atlas>} Promise resolving to created Atlas
     */

    async getAtlas(args) {
        // Atlas already exists in cache
        if (args.resource in this.atlases) {
            return this.atlases[args.resource];
        }
        
        try {
            // Create new Atlas
            const atlas = new Atlas(args);
            
            // Wait for atlas to load
            await atlas.load();
            
            // Store in cache
            this.atlases[args.resource] = atlas;
            
            // Return the loaded atlas
            return atlas;
        }
        catch (error) {
            throw new Error(`Failed to load atlas: ${args.resource} - ${error.message}`);
        }
    },

    /**
     * Clear cache
     */

    clear() {
        this.images = {};
        this.atlases = {};
    }

};