// setup.ts

// Mock ImageData
globalThis.ImageData = class {
    constructor(dataOrWidth: Uint8ClampedArray | number, widthOrHeight: number, height?: number) {
        if (typeof dataOrWidth === 'number') {
            this.data = new Uint8ClampedArray(dataOrWidth * widthOrHeight * 4);
            this.width = dataOrWidth;
            this.height = widthOrHeight;
        } else {
            if (!(dataOrWidth instanceof Uint8ClampedArray)) {
                throw new TypeError('data must be an instance of Uint8ClampedArray');
            }
            this.data = dataOrWidth;
            this.width = widthOrHeight;
            this.height = height ?? widthOrHeight;
        }
    }
    data: Uint8ClampedArray;
    width: number;
    height: number;
    colorSpace: PredefinedColorSpace = 'srgb';
};

// setup.ts

globalThis.document = {
    createElement: (tag) => {
      if (tag === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: () => ({
            putImageData: () => {},
            drawImage: () => {},
            fillStyle: '',
            fillRect: () => {},
            getImageData: () => ({
              data: new Uint8ClampedArray(),
              width: 0,
              height: 0,
            }),
          }),
          toBlob: (callback, type) => {
            // Simulate meaningful content in the Blob
            //const content = `mock image data for ${type}`;
            const content = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]);
            const simulatedBlob = new Blob([content], { type });
            callback(simulatedBlob);
          },
        };
      }
      throw new Error(`Unsupported element: ${tag}`);
    },
  };
  
