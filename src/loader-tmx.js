class LoaderTMX {

    parseLevel(xmlStr) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlStr, 'application/xml');
        const layers = doc.querySelectorAll('layer');
        const level = {layer0: null};
        layers.forEach(layer => {
            const data = layer.querySelector('data');
            if (data) {
                const arrayContent = data.textContent.split(',').map(Number).map(num => num - 1); 
                level.layer0 = this.create2DArray(arrayContent, parseInt(layer.getAttribute('width')))
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
