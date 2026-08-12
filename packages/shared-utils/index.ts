export const greet = (name: string): string => {
  return `Hello from the shared monorepo package, ${name}!`;
};

// import { type users } from '../../apps/server/src/db/schema/user.schema'; // adjust path
// import { type InferSelectModel } from 'drizzle-orm';
// 
// // This automatically creates a TypeScript type from your DB schema!
// export type User = InferSelectModel<typeof users>; 
