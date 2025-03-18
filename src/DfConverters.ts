import * as tf from '@tensorflow/tfjs';
import DataFrame from 'dflib'; // Assuming DataFrame is implemented elsewhere

export class tfConverters {
  /**
   * Converts a DataFrame to a tf.Tensor.
   * @param dataFrame - The DataFrame to convert.
   * @returns A 2D tf.Tensor representing the DataFrame data.
   */
  static toTensor(dataFrame: DataFrame): tf.Tensor {
    const json = dataFrame.toJSON() as Array<Record<string, any>>;
    const values = json.map(row => dataFrame.columnNames().map(col => row[col]));
    const shape = [dataFrame.count(), dataFrame.columnNames().length];
    const flattenedValues = values.flat();
    return tf.tensor(flattenedValues, shape);
  }

  /**
   * Converts a tf.Tensor to a DataFrame.
   * @param tensor - The tf.Tensor to convert.
   * @param columns - Optional array of column names for the DataFrame.
   * @returns A Promise that resolves to a DataFrame instance.
   */
  static fromTensor(tensor: tf.Tensor, columns?: string[]): Promise<DataFrame> {
    const shape = tensor.shape;
    if (shape.length !== 2) {
      throw new Error('Only 2D tensors can be converted to a DataFrame');
    }

    const values = tensor.arraySync() as number[][];
    const data = values.map(rowValues => {
      const row: Record<string, any> = {};
      (columns || []).forEach((col, index) => {
        row[col] = rowValues[index];
      });
      return row;
    });
    return Promise.resolve(new DataFrame(data, columns));
  }

  /**
   * Converts a 3D tf.Tensor to an image Blob in PNG or JPG format.
   * @param tensor - A 3D tf.Tensor of shape [height, width, 3] (RGB).
   * @param format - Desired image format ('image/png' or 'image/jpeg').
   * @param quality - Optional quality setting for JPEG (0 to 1).
   * @returns A Promise that resolves to a Blob representing the image.
   */
  static async toImageBlob(
    tensor: tf.Tensor3D,
    format: 'image/png' | 'image/jpeg' = 'image/png',
    quality?: number
  ): Promise<Blob> {
    if (tensor.shape.length !== 3 || tensor.shape[2] !== 3) {
      throw new Error('Tensor must have shape [height, width, 3] for RGB image');
    }

    const [height, width] = tensor.shape;
    const pixelData = await tensor.data();

    const expandedArray = [] as number[];
    for (let i = 0; i < pixelData.length; i += 3) {
      expandedArray.push(pixelData[i] * 255);     // R
      expandedArray.push(pixelData[i + 1] * 255); // G
      expandedArray.push(pixelData[i + 2] * 255); // B
      expandedArray.push(255);                    // A (fully opaque)
    }
    //const clampedArray = new Uint8ClampedArray(pixelData.map((v) => v * 255));
    const clampedArray = new Uint8ClampedArray(expandedArray.map((v) => v * 255));
    const imageData = new ImageData(clampedArray, width, height);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Unable to get canvas context');

    ctx.putImageData(imageData, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) throw new Error('Conversion to Blob failed');
          resolve(blob);
        },
        format,
        quality
      );
    });
  }

  /**
   * Converts an image Blob (PNG or JPG) to a 3D tf.Tensor.
   * @param blob - The image Blob to convert.
   * @returns A Promise that resolves to a 3D tf.Tensor of shape [height, width, 3].
   */
  static async fromImageBlob(blob: Blob): Promise<tf.Tensor3D> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        console.log("fromImageBlob onload");
        console.log("url", url);
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        console.log("canvas", canvas);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Unable to get canvas context'));
          URL.revokeObjectURL(url);
          return;
        }

        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = new Float32Array(imageData.data.length/4*3);  // make rgb vector
        for (let i = 0, j = 0; i < imageData.data.length; i += 4) {
          data[j++] = imageData.data[i] / 255;     // R
          data[j++] = imageData.data[i + 1] / 255; // G
          data[j++] = imageData.data[i + 2] / 255; // B
        }
        console.log("array data", data);
        try {
          const tensor = tf.tensor3d(data, [canvas.height, canvas.width, 3]);
          console.log("tensor", tensor);
          resolve(tensor);
        }
        catch (error) {
          console.log("tensor failed");
          reject(error);
        }
      };

      img.onerror = (error) => {
        reject(new Error(`Image failed to load: ${error}`));
      };

      img.src = url;
      //setTimeout(img.onload, 100);
    });
  }

  /*
  static fromImageBlob(blob: Blob): Promise<tf.Tensor3D> {
    return new Promise((resolve, reject) => {
      console.log("blob from image", blob);
      const img = new Image();
      const url = URL.createObjectURL(blob);
      console.log("url", url);
      img.onload = () => {
        console.log("onload");
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        console.log("ctx", ctx);
        if (!ctx) {
          reject(new Error('Unable to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const { data, width, height } = imageData;

        const tensor = tf.tensor(Array.from(data), [height, width, 4], 'int32')
          .slice([0, 0, 0], [height, width, 3])
          .div(255);
        
        URL.revokeObjectURL(url);
        resolve(tensor as tf.Tensor3D);
      };

      img.onerror = (error) => {
        URL.revokeObjectURL(url);
        reject(error);
      };

      img.src = url;
      img.onload()
    });
  }
  */
}
