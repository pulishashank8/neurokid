import "next-auth";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user?: {
      id: string;
      email: string;
      name?: string;
      image?: string;
      username?: string;
      roles?: Role[];
    };
  }

  interface User {
    id: string;
    email: string;
    username?: string;
    roles?: Role[];
  }

  interface JWT {
    id?: string;
    username?: string;
    roles?: Role[];
  }
}
