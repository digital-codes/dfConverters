import * as tf from '@tensorflow/tfjs';
import { tfConverters } from '../src/DfConverters';
import DataFrame from 'dflib'; // Assuming DataFrame is implemented elsewhere

import {describe, it } from "vitest"

describe('tfConverters', () => {

  // Force TensorFlow.js to use the `cpu` backend
  beforeAll(async () => {
    await tf.setBackend('cpu');
  });
  afterEach(() => {
    // Clean up any tensors created during tests
    tf.disposeVariables();
  });

  describe('DataFrame to Tensor Conversion', () => {
    test('should convert DataFrame to a 2D Tensor', () => {
      const data = [
        { feature1: 1, feature2: 2 },
        { feature1: 3, feature2: 4 }
      ];
      const df = new DataFrame(data);

      const tensor = tfConverters.toTensor(df);

      expect(tensor.shape).toEqual([2, 2]);
      expect(tensor.arraySync()).toEqual([
        [1, 2],
        [3, 4]
      ]);
      tensor.dispose();
    });

    test('should convert 2D Tensor to DataFrame', async () => {
      const tensor = tf.tensor([[1, 2], [3, 4]]);
      const df = await tfConverters.fromTensor(tensor, ['feature1', 'feature2']);

      expect(df.toJSON()).toEqual([
        { feature1: 1, feature2: 2 },
        { feature1: 3, feature2: 4 }
      ]);
    });
  });

  describe('Tensor to Image Blob Conversion', () => {
    test('should convert a 3D Tensor to an image Blob (PNG)', async () => {
      const tensor = tf.tensor([[[1, 0, 0], [0, 1, 0]], [[0, 0, 1], [1, 1, 0]]], [2, 2, 3]);

      const blob = await tfConverters.toImageBlob(tensor as tf.Tensor3D, 'image/png');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/png');

      // Verify the Blob has content (size > 0)
      expect(blob.size).toBeGreaterThan(0);
      // console.log("blob", blob,blob.size);
      // console.log("tensor", tensor,tensor.arraySync());
      tensor.dispose();
    });
  });

  describe('Image Blob to Tensor Conversion', () => {
    /* not working */
    test('should convert an image Blob to a 3D Tensor', async () => {
      // Create a small test image Blob (red 2x2 image)
      const redPixelPngBase64 =
        'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAEElEQVR4nGP8z4AATAxEcQAz0QEHOoQ+uAAAAABJRU5ErkJggg==';

      const createRedImageBlob = () => {
        try {
          const binary = atob(redPixelPngBase64); // Decode Base64
          console.log("Binary data length:", binary.length);

          const array = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            array[i] = binary.charCodeAt(i);
          }

          const blob = new Blob([array], { type: 'image/png' });
          return blob;
        } catch (error) {
          console.error("Error creating Blob:", error);
          throw error;
        }
      };

      const blob = createRedImageBlob();
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/png');
      // const blob = tImg as Blob

      //console.log("blob2", await blob.arrayBuffer());
      //console.log("Blob size:", blob.size);
      // Read and log Blob content as ArrayBuffer
      //const buffer = await blob.arrayBuffer();
      //console.log("Blob content as ArrayBuffer:", new Uint8Array(buffer));

            
      try {
        const tensor = await tfConverters.fromImageBlob(blob);
        console.log("tensor", tensor);
        console.log("tensor shape", tensor.shape);
        // Check the tensor shape and data
        expect(tensor.shape).toEqual([4, 4, 3]);

        // Convert tensor to an array to check values (approximate red color)
        const tensorArray = tensor.arraySync() as number[][][];
        console.log("tensorArray", tensorArray);
        tensorArray.forEach(row =>
          row.forEach(pixel => {
            expect(pixel[0]).toBeCloseTo(1, 1);  // Red channel
            expect(pixel[1]).toBeCloseTo(0, 1);  // Green channel
            expect(pixel[2]).toBeCloseTo(0, 1);  // Blue channel
          })
        );

        tensor.dispose();
      } catch (e) {
        console.log("error", e);
        throw e;
      }
    },10000);
    /* */
  });
});
