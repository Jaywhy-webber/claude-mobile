import { z } from "zod";

export const ImplementPrOutput = z.object({
  threadReplies: z
    .array(
      z.object({
        commentId: z.string().min(1),
        body: z.string().min(1),
      })
    )
    .optional()
    .default([]),
  newInlineComments: z
    .array(
      z
        .object({
          path: z.string().min(1).optional(),
          file: z.string().min(1).optional(),
          line: z.coerce.number().int().positive().optional(),
          lineRange: z.string().optional(),
          body: z.string().min(1).optional(),
          comment: z.string().min(1).optional(),
          side: z.enum(["LEFT", "RIGHT"]).optional().default("RIGHT"),
        })
        .transform((c, ctx) => {
          const path = c.path ?? c.file;
          const body = c.body ?? c.comment;

          let line = c.line;
          if (line == null && c.lineRange != null) {
            const match = c.lineRange.match(/^(\d+)/);
            line = match ? parseInt(match[1]!, 10) : undefined;
          }

          if (!path) {
            ctx.addIssue({ code: "custom", message: "missing 'path' or 'file'" });
            return z.NEVER;
          }
          if (line == null || line < 1) {
            ctx.addIssue({ code: "custom", message: "missing valid 'line'" });
            return z.NEVER;
          }
          if (!body) {
            ctx.addIssue({ code: "custom", message: "missing 'body' or 'comment'" });
            return z.NEVER;
          }
          return { path, line, body, side: c.side ?? "RIGHT" };
        })
    )
    .optional()
    .default([]),
  topLevelComments: z
    .array(z.object({ body: z.string().min(1) }))
    .optional()
    .default([]),
});

export type ImplementPrOutput = z.infer<typeof ImplementPrOutput>;
