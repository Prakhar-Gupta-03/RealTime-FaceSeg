export const overlayMask = async (imageBase64, maskBase64) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const mask = new Image();

    image.src = imageBase64;
    mask.src = `data:image/png;base64,${maskBase64}`;

    image.onload = () => {
      mask.onload = () => {
        const aspectRatio = image.width / image.height;

        // Step 1: Resize so shorter side = 256
        let resizedWidth, resizedHeight;
        if (image.width < image.height) {
          resizedWidth = 256;
          resizedHeight = Math.round(256 / aspectRatio);
        } else {
          resizedHeight = 256;
          resizedWidth = Math.round(256 * aspectRatio);
        }

        const resizeCanvas = document.createElement("canvas");
        resizeCanvas.width = resizedWidth;
        resizeCanvas.height = resizedHeight;
        const resizeCtx = resizeCanvas.getContext("2d");
        resizeCtx.drawImage(image, 0, 0, resizedWidth, resizedHeight);

        // Step 2: Center crop 256x256
        const cropCanvas = document.createElement("canvas");
        cropCanvas.width = 256;
        cropCanvas.height = 256;
        const cropCtx = cropCanvas.getContext("2d");

        const cropX = Math.floor((resizedWidth - 256) / 2);
        const cropY = Math.floor((resizedHeight - 256) / 2);
        cropCtx.drawImage(resizeCanvas, cropX, cropY, 256, 256, 0, 0, 256, 256);

        // Step 3: Draw mask overlay
        cropCtx.globalAlpha = 0.5;
        cropCtx.drawImage(mask, 0, 0, 256, 256);
        cropCtx.globalAlpha = 1.0;

        resolve(cropCanvas.toDataURL());
      };
    };

    image.onerror = reject;
    mask.onerror = reject;
  });
};
