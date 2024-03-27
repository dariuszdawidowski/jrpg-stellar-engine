class LoaderTMX {

    parseLevel(xmlStr) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlStr, 'application/xml');
        const layers = doc.querySelectorAll('layer');
        const level = {ground: null, colliders: null, cover: null};
        layers.forEach(layer => {
            const name = layer.getAttribute('name').toLowerCase();
            const data = layer.querySelector('data');
            if (['ground', 'colliders', 'cover'].includes(name) && data) {
                const arrayContent = data.textContent.split(',').map(Number).map(num => num - 1);
                level[name] = this.create2DArray(arrayContent, parseInt(layer.getAttribute('width')));
            }
        });
        return level;
    }

    create2DArray(arr, width) {
        let result = [];
        for (let i = 0; i < arr.length; i += width) {
            result.push(arr.slice(i, i + width));
        }
        return result;
    }

}
