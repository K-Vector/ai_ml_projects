import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,

  verification: router({
    verifyLabel: publicProcedure
      .input(
        z.object({
          imageBase64: z.string().min(1),
          brandName: z.string().min(1),
          productClass: z.string().min(1),
          alcoholContent: z.number().min(0).max(100),
          netContents: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { imageBase64, brandName, productClass, alcoholContent, netContents } = input;
        
        try {
          // Remove data URL prefix if present (e.g., "data:image/png;base64,")
          let cleanBase64 = imageBase64;
          if (imageBase64.includes(',')) {
            cleanBase64 = imageBase64.split(',')[1];
          }
          
          // Call Python OCR server
          const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || 'http://127.0.0.1:5001';
          const ocrResponse = await fetch(`${OCR_SERVICE_URL}/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image_bytes: cleanBase64,
              brand_name: brandName,
              product_class: productClass,
              alcohol_content: alcoholContent,
              net_contents: netContents || '',
            }),
          });
          
          if (!ocrResponse.ok) {
            const errorText = await ocrResponse.text();
            throw new Error(`OCR service failed: ${errorText}`);
          }
          
          const result = await ocrResponse.json();
          console.log('[OCR] Verification result:', result);
          
          return result;
        } catch (error) {
          throw new Error(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
